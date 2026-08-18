import { NextRequest } from "next/server";
import { AIProvider } from "@/types/graph";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey, model }: { provider: AIProvider; apiKey: string; model?: string } =
      await req.json();

    if (!apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ valid: false, error: "API key cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const cleanKey = apiKey.trim();

    // 1. Google Gemini Validation
    if (provider === "gemini") {
      const activeModel = (model || "gemini-2.0-flash").replace(/^models\//, "");
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${cleanKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({
            valid: false,
            error: errJson.error?.message || `Google API returned status ${res.status}`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, provider: "gemini", model: activeModel }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Anthropic Validation
    if (provider === "anthropic") {
      const activeModel = model || "claude-3-5-haiku-latest";
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: activeModel,
          max_tokens: 1,
          messages: [{ role: "user", content: "ping" }],
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({
            valid: false,
            error: errJson.error?.message || `Anthropic API error (${res.status})`,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, provider: "anthropic", model: activeModel }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. OpenAI Compatible (OpenAI, DeepSeek, Groq, xAI, OpenRouter)
    let baseUrl = "https://api.openai.com/v1/chat/completions";
    let defaultModel = "gpt-4o-mini";

    if (provider === "deepseek") {
      baseUrl = "https://api.deepseek.com/chat/completions";
      defaultModel = "deepseek-chat";
    } else if (provider === "groq") {
      baseUrl = "https://api.groq.com/openai/v1/chat/completions";
      defaultModel = "llama-3.1-8b-instant";
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
        Authorization: `Bearer ${cleanKey}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({
          valid: false,
          error:
            errJson.error?.message || `${provider.toUpperCase()} API returned status ${res.status}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid: true, provider, model: activeModel }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: error instanceof Error ? error.message : "Validation network failure",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
