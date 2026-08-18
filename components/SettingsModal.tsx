"use client";

import React, { useState, useEffect } from "react";
import { useGraph } from "@/context/GraphContext";
import { AIProvider } from "@/types/graph";
import { PROVIDER_CAPABILITIES } from "@/lib/providers/registry";
import {
  ArrowLeft,
  KeyRound,
  Cpu,
  Trash2,
  Check,
  Save,
  ExternalLink,
  X,
  ShieldCheck,
  User,
  AlertCircle,
  Loader2,
  Unplug,
} from "lucide-react";

interface SettingsModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const PROVIDER_MODEL_PRESETS: Record<AIProvider, string[]> = {
  gemini: [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-2.0-flash",
    "gemini-2.0-flash-thinking-exp-01-21",
    "gemini-2.0-pro-exp-02-05",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
  ],
  openai: [
    "gpt-4o",
    "o3-mini",
    "o1",
    "gpt-4o-mini",
    "gpt-4.5-preview",
  ],
  anthropic: [
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
  ],
  deepseek: ["deepseek-reasoner", "deepseek-chat"],
  groq: [
    "deepseek-r1-distill-llama-70b",
    "llama-3.3-70b-versatile",
    "qwen-2.5-coder-32b",
    "llama-3.1-8b-instant",
  ],
  xai: ["grok-3", "grok-2-latest", "grok-beta"],
  openrouter: [
    "anthropic/claude-3.7-sonnet",
    "deepseek/deepseek-r1",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct",
  ],
  mock: ["smart-tutor"],
};

export function SettingsModal({}: SettingsModalProps = {}) {
  const {
    settings,
    userProfile,
    updateUserProfile,
    saveProviderKey,
    deleteProviderKey,
    setActiveProvider,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useGraph();

  const [activeTab, setActiveTab] = useState<AIProvider | null>(null);
  const selectedProvider: AIProvider =
    activeTab || settings.activeProvider || "gemini";

  const [connectionMethod, setConnectionMethod] = useState<"api" | "oauth">("api");
  const [inputKey, setInputKey] = useState("");
  const [customModelMap, setCustomModelMap] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    error?: string;
  } | null>(null);

  // Profile Form state
  const [profileName, setProfileName] = useState(userProfile.name || "Nikhil Reddy");
  const [profileAge, setProfileAge] = useState<string>(
    userProfile.age ? String(userProfile.age) : "21"
  );
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  // Listen for OAuth success message from popup window (Google or OpenAI)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "THINKFLOW_OAUTH_SUCCESS") {
        const prov: AIProvider = event.data.provider || "openai";
        const modelToSave = event.data.model || (prov === "gemini" ? "gemini-3.7-flash" : "gpt-4o");
        saveProviderKey(prov, event.data.token, modelToSave);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [saveProviderKey]);

  if (!isSettingsOpen) return null;

  const currentCap =
    PROVIDER_CAPABILITIES[selectedProvider] || PROVIDER_CAPABILITIES.gemini;

  const currentModel =
    customModelMap[selectedProvider] ??
    settings.models?.[selectedProvider] ??
    currentCap.defaultModel;

  const existingKeyForSelected = settings.keys?.[selectedProvider];
  const maskedKeyForSelected = existingKeyForSelected
    ? existingKeyForSelected.startsWith("ya29.")
      ? "Google OAuth Connected"
      : existingKeyForSelected.startsWith("eyJ") || existingKeyForSelected.length > 80
      ? "ChatGPT OAuth Connected"
      : `••••${existingKeyForSelected.slice(-4)}`
    : null;

  const handleProviderChange = (newProvider: AIProvider) => {
    setActiveTab(newProvider);
    setInputKey("");
    setValidationResult(null);
  };

  const handleModelChange = (newModel: string) => {
    setCustomModelMap((prev) => ({
      ...prev,
      [selectedProvider]: newModel,
    }));
  };

  const handleValidateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyToSave = inputKey.trim() || existingKeyForSelected || "";

    if (!keyToSave) {
      setValidationResult({ valid: false, error: "Please enter an API key." });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await fetch("/api/providers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey: keyToSave,
          model: currentModel.trim(),
        }),
      });

      const data = await res.json();
      if (data.valid) {
        saveProviderKey(selectedProvider, keyToSave, currentModel.trim());
        setValidationResult({ valid: true });
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      } else {
        setValidationResult({ valid: false, error: data.error || "Invalid credentials." });
      }
    } catch (err: unknown) {
      setValidationResult({
        valid: false,
        error: err instanceof Error ? err.message : "Validation error",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleConnectOAuth = () => {
    if (selectedProvider === "openai") {
      window.open(
        "/api/auth/openai",
        "openai_oauth",
        "width=550,height=680,left=200,top=100"
      );
    } else if (selectedProvider === "gemini") {
      window.open(
        "/api/auth/google",
        "google_oauth",
        "width=550,height=680,left=200,top=100"
      );
    } else if (selectedProvider === "openrouter") {
      window.open("https://openrouter.ai/keys", "_blank");
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: profileName.trim() || "Explorer",
      age: profileAge.trim() ? parseInt(profileAge.trim(), 10) : undefined,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1500);
  };

  const getSavedKeysList = () => {
    const list: {
      provider: AIProvider;
      label: string;
      maskedKey: string;
      isActive: boolean;
    }[] = [];

    (Object.keys(PROVIDER_CAPABILITIES) as AIProvider[]).forEach((provId) => {
      if (provId === "mock") return;
      const key = settings.keys?.[provId];
      if (key && key.trim()) {
        const isOAuth = key.startsWith("ya29.") || (provId === "openai" && key.length > 60);
        list.push({
          provider: provId,
          label: PROVIDER_CAPABILITIES[provId].name,
          maskedKey: isOAuth ? "OAuth Active" : `••••${key.slice(-4)}`,
          isActive: settings.activeProvider === provId,
        });
      }
    });

    return list;
  };

  const savedList = getSavedKeysList();
  const presets = PROVIDER_MODEL_PRESETS[selectedProvider] || [currentCap.defaultModel];

  return (
    <div
      onClick={() => setIsSettingsOpen(false)}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150 font-sans select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-7 my-6 text-zinc-100 font-sans"
      >
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-zinc-800/80">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 hover:text-white transition-all font-semibold shadow-xs active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Chat</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
            title="Close Settings (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
            Settings &amp; AI Connections
          </h1>
          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Connect AI providers via official API keys or OAuth authentication.
          </p>
        </div>

        {/* Main Provider Connections Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 sm:p-6 space-y-5 mb-5">
          {/* Provider Pill Selector */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 text-xs font-semibold text-zinc-200">
              <Cpu className="w-4 h-4 text-zinc-400" />
              <span>AI Provider</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(PROVIDER_CAPABILITIES) as AIProvider[])
                .filter((p) => p !== "mock")
                .map((provId) => {
                  const isSelected = selectedProvider === provId;
                  const hasKey =
                    settings.keys?.[provId] &&
                    settings.keys[provId]!.trim().length > 0;

                  return (
                    <button
                      key={provId}
                      type="button"
                      onClick={() => handleProviderChange(provId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? "bg-zinc-950 border-zinc-500 text-white shadow-xs font-semibold"
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          hasKey ? "bg-emerald-400" : "bg-zinc-600"
                        }`}
                      />
                      <span>{PROVIDER_CAPABILITIES[provId].shortName}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Connection Method Tabs: Connect with API vs Connect Account */}
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5 pt-1">
            <button
              type="button"
              onClick={() => setConnectionMethod("api")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                connectionMethod === "api"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Connect with API
            </button>

            <button
              type="button"
              onClick={() => setConnectionMethod("oauth")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                connectionMethod === "oauth"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Connect Account (OAuth)
            </button>
          </div>

          {/* TAB 1: CONNECT WITH API */}
          {connectionMethod === "api" && (
            <form onSubmit={handleValidateAndSave} className="space-y-4">
              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                    <span>API Key</span>
                  </div>
                  {maskedKeyForSelected && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>saved ({maskedKeyForSelected})</span>
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter API key..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
                />

                <p className="text-[11px] font-mono text-zinc-400 mt-2">
                  Get key at{" "}
                  <a
                    href={currentCap.apiDocsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline hover:text-indigo-300 inline-flex items-center gap-0.5"
                  >
                    <span>{currentCap.apiDocsLabel}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </p>
              </div>

              {/* Model Input & 1-Click Preset Chips */}
              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  Model
                </label>

                <input
                  type="text"
                  value={currentModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  placeholder="e.g. gpt-4o or gemini-3.7-flash"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono mb-2"
                />

                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {presets.map((preset) => {
                    const isCurrentModel = currentModel === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleModelChange(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border ${
                          isCurrentModel
                            ? "bg-zinc-950 border-zinc-500 text-white font-semibold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Validation Feedback */}
              {validationResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    validationResult.valid
                      ? "bg-emerald-950/60 border border-emerald-800/60 text-emerald-300"
                      : "bg-red-950/60 border border-red-800/60 text-red-300"
                  }`}
                >
                  {validationResult.valid ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>✓ API Key Validated &amp; Connected Successfully!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{validationResult.error}</span>
                    </>
                  )}
                </div>
              )}

              {/* Save / Test Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isValidating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-[#e0e0e0] font-semibold text-xs shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Validating API Key...</span>
                    </>
                  ) : savedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Saved &amp; Active!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Connection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: CONNECT ACCOUNT (OAUTH) */}
          {connectionMethod === "oauth" && (
            <div className="space-y-4 py-1">
              {currentCap.supportsOAuth ? (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">
                        Official {currentCap.name} Authorization
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
                        Sign in directly with your {currentCap.shortName} account. An official authorization window will open.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleConnectOAuth}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Connect with {currentCap.shortName} Login</span>
                  </button>

                  <p className="text-[11px] text-zinc-500 font-mono">
                    Official authorization page opens in a secure popup via PKCE OAuth 2.0.
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                  <div className="flex items-start gap-2">
                    <Unplug className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-200">
                        Account Connection Unavailable
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {currentCap.oauthUnavailableReason ||
                          "This provider does not offer an official consumer OAuth login for direct API model execution. Please use the API connection."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setConnectionMethod("api")}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium transition-colors"
                    >
                      ← Switch to API Connection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile & Personalization Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5 mb-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-200">
            <User className="w-4 h-4 text-zinc-400" />
            <span>Personalization &amp; Profile</span>
          </div>

          <form onSubmit={handleSaveProfile} className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[180px]">
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Your Name (e.g. Nikhil Reddy)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
              />
            </div>

            <div className="w-24">
              <input
                type="number"
                value={profileAge}
                onChange={(e) => setProfileAge(e.target.value)}
                placeholder="Age"
                min="1"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              {profileSaved ? "Saved!" : "Update Name"}
            </button>
          </form>
        </div>

        {/* Saved Connections List */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-200">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <span>Connected Providers</span>
          </div>

          {savedList.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono py-1">
              No saved API connections yet. Configure an API key or account above.
            </p>
          ) : (
            <div className="space-y-1.5">
              {savedList.map((item) => (
                <div
                  key={item.provider}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-zinc-200 font-medium">{item.label}</span>
                    <span className="text-zinc-500">{item.maskedKey}</span>
                    {item.isActive ? (
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-200 font-semibold">
                        active
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveProvider(item.provider)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        set active
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteProviderKey(item.provider)}
                    className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                    title={`Disconnect ${item.label}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
