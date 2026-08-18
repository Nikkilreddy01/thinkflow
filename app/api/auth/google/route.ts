import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/auth/callback?provider=google`;

  if (!clientId) {
    return new Response(
      `<!DOCTYPE html>
<html>
<head><title>OAuth Configuration Required</title>
<style>body{font-family:system-ui,-apple-system,sans-serif;background:#181818;color:#eee;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center}.box{max-width:500px;background:#212121;border:1px solid #383838;padding:30px;border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.5)}h2{margin-top:0;color:#fff}p{color:#aaa;font-size:14px;line-height:1.6}code{background:#111;padding:3px 6px;border-radius:6px;color:#a5b4fc;font-size:13px}a{color:#818cf8;text-decoration:none}</style>
</head>
<body>
<div class="box">
  <h2>Google Cloud OAuth Setup</h2>
  <p>To connect via official Google OAuth, set your credentials in <code>.env.local</code>:</p>
  <p><code>GOOGLE_CLIENT_ID=your_client_id</code><br><code>GOOGLE_CLIENT_SECRET=your_client_secret</code></p>
  <p>Or use the <strong>Connect with API</strong> option with your standard Gemini API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>.</p>
  <button onclick="window.close()" style="margin-top:15px;padding:8px 16px;border-radius:10px;background:#383838;color:#fff;border:none;cursor:pointer">Close Window</button>
</div>
</body>
</html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  // Generate random state
  const state = Math.random().toString(36).substring(2, 15);
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/userinfo.email"
  );

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

  return Response.redirect(authUrl);
}
