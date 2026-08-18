import crypto from "crypto";

// In-memory store for pending PKCE authorization states (expires after 10 mins)
interface AuthState {
  verifier: string;
  provider: string;
  createdAt: number;
}

const stateStore = new Map<string, AuthState>();

// Clean up expired states every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
      if (now - data.createdAt > 10 * 60 * 1000) {
        stateStore.delete(state);
      }
    }
  }, 5 * 60 * 1000);
}

export function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function generateCodeChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export function generateState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function storeAuthState(state: string, verifier: string, provider: string) {
  stateStore.set(state, {
    verifier,
    provider,
    createdAt: Date.now(),
  });
}

export function consumeAuthState(state: string): AuthState | null {
  const found = stateStore.get(state);
  if (found) {
    stateStore.delete(state);
    return found;
  }
  return null;
}
