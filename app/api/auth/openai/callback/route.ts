import { NextRequest } from "next/server";
import { consumeAuthState } from "@/lib/auth/pkce";

export const runtime = "nodejs";

const OPENAI_CLIENT_ID =
  process.env.OPENAI_OAUTH_CLIENT_ID || "app_EMoamEEZ73f0CkXaXp7hrann";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  if (error) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Authorization Failed</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#ef4444">Authorization Cancelled</h3>
  <p style="color:#aaa">${errorDescription || error}</p>
  <button onclick="window.close()" style="margin-top:15px;padding:8px 16px;border-radius:10px;background:#383838;color:#fff;border:none;cursor:pointer">Close Window</button>
</body>
</html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!code || !state) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Invalid Request</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#ef4444">Missing authorization code or state.</h3>
  <script>setTimeout(() => window.close(), 3000);</script>
</body>
</html>`,
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const authState = consumeAuthState(state);
  const verifier = authState?.verifier || "";

  const redirectUri =
    process.env.OPENAI_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/auth/openai/callback`;

  try {
    const tokenRes = await fetch("https://auth.openai.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: OPENAI_CLIENT_ID,
        code: code,
        code_verifier: verifier,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("OpenAI OAuth token exchange failed:", errText);
      return new Response(
        `<!DOCTYPE html>
<html>
<head><title>Token Exchange Failed</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#ef4444">OAuth Token Exchange Failed</h3>
  <p style="color:#aaa;font-size:13px;max-width:450px;margin:10px auto">${errText}</p>
  <button onclick="window.close()" style="margin-top:15px;padding:8px 16px;border-radius:10px;background:#383838;color:#fff;border:none;cursor:pointer">Close Window</button>
</body>
</html>`,
        { status: tokenRes.status, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token || "";

    // Parse email or user id from id_token if present
    let accountName = "ChatGPT Account";
    if (tokenData.id_token) {
      try {
        const parts = tokenData.id_token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(parts[1], "base64url").toString("utf-8")
          );
          accountName = payload.email || payload.name || "ChatGPT User";
        }
      } catch {}
    }

    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>ChatGPT Account Connected</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#34d399">✓ Successfully Connected to ChatGPT!</h3>
  <p style="color:#aaa;font-size:14px">Account: <strong style="color:#fff">${accountName}</strong></p>
  <p style="color:#888;font-size:12px">Closing window and returning to ThinkFlow...</p>
  <script>
    if (window.opener) {
      window.opener.postMessage({
        type: 'THINKFLOW_OAUTH_SUCCESS',
        provider: 'openai',
        token: '${accessToken}',
        accountIdentifier: '${accountName}',
        model: 'gpt-4o'
      }, '*');
    }
    setTimeout(() => window.close(), 1200);
  </script>
</body>
</html>`,
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (err: unknown) {
    console.error("OpenAI callback error:", err);
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>Connection Error</title></head>
<body style="background:#181818;color:#eee;font-family:sans-serif;text-align:center;padding:50px">
  <h3 style="color:#ef4444">Connection Failed</h3>
  <p style="color:#aaa">${err instanceof Error ? err.message : "Unexpected error"}</p>
</body>
</html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
