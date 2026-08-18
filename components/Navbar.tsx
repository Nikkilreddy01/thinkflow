"use client";

import React, { useState } from "react";
import { useGraph } from "@/context/GraphContext";
import { PROVIDER_REGISTRY } from "@/lib/models";
import { AIProvider } from "@/types/graph";
import {
  MessageSquare,
  Network,
  PanelLeft,
  SquarePen,
  ChevronDown,
  Share2,
  Check,
  Cpu,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const {
    viewMode,
    setViewMode,
    isSidebarOpen,
    toggleSidebar,
    createNewChat,
    settings,
    setActiveProvider,
    setIsSettingsOpen,
  } = useGraph();

  const [isProviderMenuOpen, setIsProviderMenuOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const currentProvider =
    PROVIDER_REGISTRY[settings.activeProvider] || PROVIDER_REGISTRY.gemini;

  const currentKey = settings.keys?.[settings.activeProvider];
  const isOAuth = currentKey && currentKey.startsWith("ya29.");
  const hasConnection = currentKey && currentKey.trim().length > 0;

  const handleShareClick = () => {
    if (typeof window !== "undefined") {
      try {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(window.location.href);
        }
      } catch {}
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleSelectProvider = (provId: AIProvider) => {
    setActiveProvider(provId);
    setIsProviderMenuOpen(false);
  };

  return (
    <header className="h-12 px-3 sm:px-4 bg-[#212121] text-[#ececec] border-b border-[#2e2e2e] flex items-center justify-between z-30 shrink-0 select-none relative">
      {/* Left side: Sidebar toggle (if closed) + Provider Dropdown Pill */}
      <div className="flex items-center gap-2 relative">
        {!isSidebarOpen && (
          <div className="flex items-center gap-1.5 mr-1">
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg hover:bg-[#2e2e2e] text-[#b4b4b4] hover:text-white transition-colors"
              title="Open Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={createNewChat}
              className="p-1.5 rounded-lg hover:bg-[#2e2e2e] text-[#b4b4b4] hover:text-white transition-colors"
              title="New Chat"
            >
              <SquarePen className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Provider Switcher Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProviderMenuOpen(!isProviderMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-[#2e2e2e] text-xs font-semibold text-[#ececec] transition-colors border border-transparent hover:border-[#383838]"
            title="Switch AI Provider Connection"
          >
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasConnection ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                }`}
              />
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentProvider.shortName}</span>
              <span className="text-[10px] text-[#8e8e8e] font-mono hidden sm:inline">
                ({isOAuth ? "OAuth" : hasConnection ? "API" : "offline"})
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#8e8e8e]" />
          </button>

          {/* Provider Dropdown Popup */}
          {isProviderMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider">
                Connected AI Providers
              </div>
              <div className="space-y-0.5 mt-1">
                {Object.values(PROVIDER_REGISTRY)
                  .filter((p) => p.id !== "mock")
                  .map((p) => {
                    const isSelected = settings.activeProvider === p.id;
                    const key = settings.keys?.[p.id];
                    const provOAuth = key && key.startsWith("ya29.");
                    const provHasKey = key && key.trim().length > 0;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProvider(p.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                          isSelected
                            ? "bg-[#2e2e2e] text-white font-medium"
                            : "text-[#b4b4b4] hover:bg-[#282828] hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              provHasKey ? "bg-emerald-400" : "bg-zinc-600"
                            }`}
                          />
                          <span>{p.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-[#8e8e8e] font-mono">
                            {provOAuth ? "OAuth" : provHasKey ? "API" : "no key"}
                          </span>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>

              <div className="pt-1.5 mt-1 border-t border-[#2e2e2e]">
                <button
                  type="button"
                  onClick={() => {
                    setIsProviderMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-indigo-300 hover:text-indigo-200 hover:bg-[#282828] transition-colors font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Configure API Keys &amp; OAuth...</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: View Switcher (Chat vs Canvas only) */}
      <div className="flex items-center bg-[#171717] p-1 rounded-xl border border-[#2e2e2e]">
        <button
          type="button"
          onClick={() => setViewMode("chat")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            viewMode === "chat"
              ? "bg-[#2e2e2e] text-white shadow-xs font-semibold"
              : "text-[#8e8e8e] hover:text-[#ececec]"
          }`}
          title="Chat View"
        >
          <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode("canvas")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
            viewMode === "canvas"
              ? "bg-[#2e2e2e] text-white shadow-xs font-semibold"
              : "text-[#8e8e8e] hover:text-[#ececec]"
          }`}
          title="Canvas Graph View"
        >
          <Network className="w-3.5 h-3.5 text-emerald-400" />
          <span>Canvas</span>
        </button>
      </div>

      {/* Right side: Functional Share Button */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleShareClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            copiedShare
              ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
              : "bg-[#212121] hover:bg-[#2e2e2e] border-[#2e2e2e] text-[#b4b4b4] hover:text-white"
          }`}
          title="Copy Link to Share Workspace"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}
