import { NextRequest } from "next/server";
import { constructContextualPrompt } from "@/lib/ai";
import { ContextInheritancePackage, AIProvider } from "@/types/graph";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "gemini",
      apiKey = "",
      model = "gemini-2.0-flash",
      pkg,
    }: {
      provider: AIProvider;
      apiKey?: string;
      model?: string;
      pkg: ContextInheritancePackage;
    } = body;

    if (!pkg) {
      return new Response(JSON.stringify({ error: "Missing context package" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const prompt = constructContextualPrompt(pkg);

    // If mock provider or no API key provided
    if (provider === "mock" || !apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({
          error: `No API key configured for provider "${provider}". Please add an API key in Settings.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Google Gemini Provider
    if (provider === "gemini") {
      let activeModel = (model || "gemini-2.0-flash").replace(/^models\//, "").trim();
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;

      let res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      });

      // If model not found (e.g. 404), fallback to gemini-2.0-flash or gemini-1.5-flash
      if (!res.ok && (res.status === 404 || res.status === 400) && activeModel !== "gemini-2.0-flash") {
        activeModel = "gemini-2.0-flash";
        url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            },
          }),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        let parsedErr = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedErr = jsonErr.error?.message || errorText;
        } catch {}

        return new Response(
          JSON.stringify({
            error: `Gemini API error (${res.status}): ${parsedErr}`,
          }),
          { status: res.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          data.text ||
          "";
        return new Response(text, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
          },
        });
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = res.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("data:")) {
                  const dataStr = trimmed.replace("data:", "").trim();
                  if (!dataStr) continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    const chunk =
                      parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
                    if (chunk) {
                      controller.enqueue(new TextEncoder().encode(chunk));
                    }
                  } catch {
                    // Ignore json chunk parse errors
                  }
                }
              }
            }
          } catch (err) {
            console.error("Gemini stream read error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 2. Anthropic (Claude)
    if (provider === "anthropic") {
      const activeModel = model || "claude-3-5-sonnet-latest";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: activeModel,
          max_tokens: 2048,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return new Response(
          JSON.stringify({
            error: `Anthropic API error (${res.status}): ${errorText}`,
          }),
          { status: res.status, headers: { "Content-Type": "application/json" } }
        );
      }

      const stream = new ReadableStream({
        async start(controller) {
          const reader = res.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          const decoder = new TextDecoder();
          let buffer = "";

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith("data:")) {
                  const dataStr = trimmed.replace("data:", "").trim();
                  if (!dataStr || dataStr === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(dataStr);
                    if (
                      parsed.type === "content_block_delta" &&
                      parsed.delta?.text
                    ) {
                      controller.enqueue(
                        new TextEncoder().encode(parsed.delta.text)
                      );
                    }
                  } catch {
                    // Ignore parse error
                  }
                }
              }
            }
          } catch (err) {
            console.error("Anthropic stream error:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // 3. OpenAI Compatible Providers (OpenAI, DeepSeek, Groq, xAI, OpenRouter)
    let baseUrl = "https://api.openai.com/v1/chat/completions";
    let defaultModel = "gpt-4o-mini";

    if (provider === "deepseek") {
      baseUrl = "https://api.deepseek.com/chat/completions";
      defaultModel = "deepseek-chat";
    } else if (provider === "groq") {
      baseUrl = "https://api.groq.com/openai/v1/chat/completions";
      defaultModel = "llama-3.3-70b-versatile";
    } else if (provider === "xai") {
      baseUrl = "https://api.x.ai/v1/chat/completions";
      defaultModel = "grok-beta";
    } else if (provider === "openrouter") {
      baseUrl = "https://openrouter.ai/api/v1/chat/completions";
      defaultModel = "google/gemini-2.0-flash-exp:free";
    }

    const activeModel = model || defaultModel;

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [
          {
            role: "system",
            content:
              "You are ThinkFlow AI, an expert interactive knowledge guide specialized in structured explanations and anchored concept exploration.",
          },
          { role: "user", content: prompt },
        ],
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return new Response(
        JSON.stringify({
          error: `${provider.toUpperCase()} API error (${res.status}): ${errorText}`,
        }),
        { status: res.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = res.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }
        const decoder = new TextDecoder();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data:")) {
                const dataStr = trimmed.replace("data:", "").trim();
                if (!dataStr || dataStr === "[DONE]") continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  const chunk = parsed.choices?.[0]?.delta?.content || "";
                  if (chunk) {
                    controller.enqueue(new TextEncoder().encode(chunk));
                  }
                } catch {
                  // Ignore parse error
                }
              }
            }
          }
        } catch (err) {
          console.error(`${provider} stream error:`, err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("API route error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal generation failure",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
