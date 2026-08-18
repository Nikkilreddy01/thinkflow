import { AIProvider } from "./graph";

export type AuthMethod = "api" | "oauth";

export type ConnectionStatus =
  | "disconnected"
  | "connected"
  | "connecting"
  | "error"
  | "expired";

export interface ProviderConnection {
  id: string;
  provider: AIProvider;
  authMethod: AuthMethod;
  status: ConnectionStatus;
  accountIdentifier?: string; // e.g. email or project id if OAuth
  displayName?: string;
  apiKeyMasked?: string;
  model: string;
  customEndpoint?: string;
  oauthTokenExpiry?: number;
  hasRefreshToken?: boolean;
  createdAt: number;
  updatedAt: number;
  lastValidatedAt?: number;
  errorMessage?: string;
}

export interface UserProfile {
  name: string;
  age?: number;
  interests?: string;
  hasCompletedOnboarding: boolean;
}

export interface ProviderCapability {
  id: AIProvider;
  name: string;
  shortName: string;
  supportsAPI: boolean;
  supportsOAuth: boolean;
  oauthUnavailableReason?: string;
  apiDocsUrl: string;
  apiDocsLabel: string;
  oauthDocsUrl?: string;
  defaultModel: string;
}
