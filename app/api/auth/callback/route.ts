import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const provider = req.nextUrl.searchParams.get("provider") || "google";
  const error = req.nextUrl.searchParams.get("error");

  if (error) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Authorization Cancelled</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3>Authorization Cancelled</h3>
  <p style="color:#aaa">${error}</p>
  <script>setTimeout(() => window.close(), 2000);</script>
</body>
</html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Handle Google OAuth Token Exchange if client secret exists
  if (provider === "google" && code && process.env.GOOGLE_CLIENT_SECRET) {
    try {
      const redirectUri = `${req.nextUrl.origin}/api/auth/callback?provider=google`;
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (tokenRes.ok) {
        const data = await tokenRes.json();
        return new Response(
          `<!DOCTYPE html>
<html>
<head><title>Connected to Google</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#34d399">✓ Successfully Authorized!</h3>
  <p style="color:#aaa">Returning to ThinkFlow...</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({ type: 'THINKFLOW_OAUTH_SUCCESS', provider: 'gemini', token: '${data.access_token}' }, '*');
    }
    setTimeout(() => window.close(), 1200);
  </script>
</body>
</html>`,
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
    } catch (err) {
      console.error("Google OAuth token exchange error:", err);
    }
  }

  return Response.redirect(`${req.nextUrl.origin}/?oauth=complete`);
}
