"use client";

import React, { useState, useEffect } from "react";
import { useGraph } from "@/context/GraphContext";
import { AIProvider } from "@/types/graph";
import {
  ArrowLeft,
  KeyRound,
  Cpu,
  Trash2,
  Check,
  Save,
  ExternalLink,
  X,
} from "lucide-react";

interface ProviderMeta {
  id: AIProvider;
  label: string;
  hint: string;
  linkText: string;
  linkUrl: string;
  defaultModel: string;
  presetModels: string[];
}

const PROVIDER_METAS: ProviderMeta[] = [
  {
    id: "gemini",
    label: "Google Gemini",
    hint: "Free tier available. Get key at",
    linkText: "ai.google.dev",
    linkUrl: "https://aistudio.google.com/app/apikey",
    defaultModel: "gemini-3.7-flash",
    presetModels: [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-2.0-flash",
      "gemini-2.0-flash-thinking-exp-01-21",
      "gemini-2.0-pro-exp-02-05",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
  },
  {
    id: "openai",
    label: "OpenAI",
    hint: "Get key at",
    linkText: "platform.openai.com",
    linkUrl: "https://platform.openai.com/api-keys",
    defaultModel: "gpt-4o",
    presetModels: ["gpt-4o", "o3-mini", "o1", "gpt-4o-mini", "gpt-4.5-preview"],
  },
  {
    id: "anthropic",
    label: "Anthropic (Claude)",
    hint: "Get key at",
    linkText: "console.anthropic.com",
    linkUrl: "https://console.anthropic.com/settings/keys",
    defaultModel: "claude-3-7-sonnet-latest",
    presetModels: [
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
      "claude-3-opus-latest",
    ],
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    hint: "Get key at",
    linkText: "platform.deepseek.com",
    linkUrl: "https://platform.deepseek.com/api_keys",
    defaultModel: "deepseek-reasoner",
    presetModels: ["deepseek-reasoner", "deepseek-chat"],
  },
  {
    id: "groq",
    label: "Groq",
    hint: "Free tier available. Get key at",
    linkText: "console.groq.com",
    linkUrl: "https://console.groq.com/keys",
    defaultModel: "deepseek-r1-distill-llama-70b",
    presetModels: [
      "deepseek-r1-distill-llama-70b",
      "llama-3.3-70b-versatile",
      "qwen-2.5-coder-32b",
      "llama-3.1-8b-instant",
    ],
  },
  {
    id: "xai",
    label: "xAI (Grok)",
    hint: "Get key at",
    linkText: "console.x.ai",
    linkUrl: "https://console.x.ai",
    defaultModel: "grok-3",
    presetModels: ["grok-3", "grok-2-latest", "grok-beta"],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    hint: "Access 200+ models. Get key at",
    linkText: "openrouter.ai/keys",
    linkUrl: "https://openrouter.ai/keys",
    defaultModel: "anthropic/claude-3.7-sonnet",
    presetModels: [
      "anthropic/claude-3.7-sonnet",
      "deepseek/deepseek-r1",
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-3.3-70b-instruct",
    ],
  },
];

export function SettingsModal() {
  const {
    settings,
    saveProviderKey,
    deleteProviderKey,
    setActiveProvider,
    isSettingsOpen,
    setIsSettingsOpen,
  } = useGraph();

  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(
    settings.activeProvider || "gemini"
  );
  const [inputKey, setInputKey] = useState("");
  const [customModelMap, setCustomModelMap] = useState<Record<string, string>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSettingsOpen, setIsSettingsOpen]);

  if (!isSettingsOpen) return null;

  const currentMeta =
    PROVIDER_METAS.find((p) => p.id === selectedProvider) || PROVIDER_METAS[0];

  const currentModel =
    customModelMap[selectedProvider] ??
    settings.models?.[selectedProvider] ??
    currentMeta.defaultModel;

  const existingKeyForSelected = settings.keys?.[selectedProvider];
  const maskedKeyForSelected = existingKeyForSelected
    ? `••••${existingKeyForSelected.slice(-4)}`
    : null;

  const handleProviderChange = (newProvider: AIProvider) => {
    setSelectedProvider(newProvider);
    setInputKey("");
  };

  const handleModelChange = (newModel: string) => {
    setCustomModelMap((prev) => ({
      ...prev,
      [selectedProvider]: newModel,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const keyToSave = inputKey.trim() || existingKeyForSelected || "";
    saveProviderKey(selectedProvider, keyToSave, currentModel.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 1200);
  };

  const getSavedKeysList = () => {
    const list: {
      provider: AIProvider;
      label: string;
      maskedKey: string;
      isActive: boolean;
    }[] = [];

    PROVIDER_METAS.forEach((prov) => {
      const key = settings.keys?.[prov.id];
      if (key && key.trim()) {
        list.push({
          provider: prov.id,
          label: prov.label,
          maskedKey: `••••${key.slice(-4)}`,
          isActive: settings.activeProvider === prov.id,
        });
      }
    });

    return list;
  };

  const savedList = getSavedKeysList();

  return (
    <div
      onClick={() => setIsSettingsOpen(false)}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-8 text-zinc-100 font-sans"
      >
        {/* Top Header Navigation Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-zinc-800/80">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 hover:text-white transition-all font-semibold shadow-sm active:scale-95"
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

        {/* Title and Subtitle */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed">
            Configure your AI provider and latest models. Keys are stored locally
            in your browser.
          </p>
        </div>

        {/* Main Configuration Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-7 space-y-6 mb-6">
          {/* 1. AI Provider Selector */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-zinc-200">
              <Cpu className="w-4 h-4 text-zinc-400" />
              <span>AI Provider</span>
            </div>

            {/* Provider Pills */}
            <div className="flex flex-wrap gap-2">
              {PROVIDER_METAS.map((prov) => {
                const isSelected = selectedProvider === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleProviderChange(prov.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? "bg-zinc-950 border-zinc-600 text-white shadow-sm ring-1 ring-zinc-500/30 font-semibold"
                        : "bg-zinc-900/90 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <span>{prov.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                );
              })}
            </div>

            {/* Provider Link / Hint */}
            <p className="text-[11px] font-mono text-zinc-400 mt-2.5">
              {currentMeta.hint}{" "}
              <a
                href={currentMeta.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-indigo-300 inline-flex items-center gap-0.5"
              >
                <span>{currentMeta.linkText}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* 2. API Key Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                  <KeyRound className="w-4 h-4 text-zinc-400" />
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
                placeholder="Enter new key to replace..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono"
              />
              <p className="text-[11px] font-mono text-zinc-500 mt-1.5">
                Leave blank to keep the existing key.
              </p>
            </div>

            {/* 3. Model Section with Latest Model Chips */}
            <div>
              <label className="block text-xs font-semibold text-zinc-200 mb-2">
                Model
              </label>

              <input
                type="text"
                value={currentModel}
                onChange={(e) => handleModelChange(e.target.value)}
                placeholder="e.g. gemini-3.7-flash"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-mono mb-2.5"
              />

              {/* Preset Model Pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentMeta.presetModels.map((preset) => {
                  const isCurrentModel = currentModel === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleModelChange(preset)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                        isCurrentModel
                          ? "bg-zinc-950 border-zinc-500 text-white font-semibold shadow-xs"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>

              <p className="text-[11px] font-mono text-zinc-500">
                Or type any model ID supported by your provider.
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-white text-xs font-semibold transition-all shadow-md active:scale-95 hover:border-zinc-500"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Settings Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Settings</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Done
              </button>
            </div>
          </form>
        </div>

        {/* 4. Saved API Keys Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-zinc-200">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <span>Saved API Keys</span>
          </div>

          {savedList.length === 0 ? (
            <p className="text-xs text-zinc-500 font-mono py-2">
              No saved keys found. Keys you save will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {savedList.map((item) => (
                <div
                  key={item.provider}
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-200 font-medium">
                      {item.label}
                    </span>
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
                    title={`Delete ${item.label} key`}
                  >
                    <Trash2 className="w-4 h-4" />
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
