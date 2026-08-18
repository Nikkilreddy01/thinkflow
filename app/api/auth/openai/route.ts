import { NextRequest } from "next/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storeAuthState,
} from "@/lib/auth/pkce";

export const runtime = "nodejs";

const OPENAI_CLIENT_ID =
  process.env.OPENAI_OAUTH_CLIENT_ID || "app_EMoamEEZ73f0CkXaXp7hrann";

export async function GET(req: NextRequest) {
  const redirectUri =
    process.env.OPENAI_REDIRECT_URI ||
    `${req.nextUrl.origin}/api/auth/openai/callback`;

  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);
  const state = generateState();

  // Store PKCE verifier keyed by state
  storeAuthState(state, verifier, "openai");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: OPENAI_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "openid profile email offline_access",
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: state,
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    originator: "thinkflow",
  });

  const authUrl = `https://auth.openai.com/oauth/authorize?${params.toString()}`;

  return Response.redirect(authUrl);
}
