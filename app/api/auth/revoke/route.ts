import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token, provider } = await req.json();

    if (!token) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (provider === "gemini" || provider === "google") {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
      } catch (err) {
        console.warn("Google token revocation error:", err);
      }
    } else if (provider === "openai") {
      try {
        await fetch("https://auth.openai.com/oauth/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            token,
            client_id: process.env.OPENAI_OAUTH_CLIENT_ID || "app_EMoamEEZ73f0CkXaXp7hrann",
          }),
        });
      } catch (err) {
        console.warn("OpenAI token revocation error:", err);
      }
    }

    return new Response(JSON.stringify({ success: true, message: "Token revoked successfully." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Revocation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
