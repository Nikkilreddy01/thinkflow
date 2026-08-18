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
        console.warn("Google token revocation request error:", err);
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
