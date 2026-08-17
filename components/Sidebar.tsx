"use client";

import React, { useState } from "react";
import { useGraph } from "@/context/GraphContext";
import { PROVIDER_REGISTRY } from "@/lib/models";
import {
  SquarePen,
  Search,
  FolderPlus,
  Folder,
  Trash2,
  Sparkles,
  BookOpen,
  Box,
  PanelLeftClose,
  PanelLeft,
  Settings,
} from "lucide-react";

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    switchConversation,
    deleteConversation,
    createNewChat,
    isSidebarOpen,
    toggleSidebar,
    setIsSettingsOpen,
    settings,
    searchQuery,
    setSearchQuery,
  } = useGraph();

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const providerInfo =
    PROVIDER_REGISTRY[settings.activeProvider] || PROVIDER_REGISTRY.gemini;

  const hasKey =
    settings.activeProvider === "mock" ||
    (settings.keys?.[settings.activeProvider] &&
      settings.keys[settings.activeProvider]!.trim().length > 0);

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  if (!isSidebarOpen) {
    return (
      <div className="hidden sm:flex flex-col items-center py-3 px-2 border-r border-[#262626] bg-[#171717] z-20 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-[#212121] hover:bg-[#2e2e2e] text-[#b4b4b4] hover:text-white border border-[#2e2e2e] transition-colors mb-3"
          title="Open Sidebar"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <button
          onClick={createNewChat}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all active:scale-95 mb-4"
          title="New Chat"
        >
          <SquarePen className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl bg-[#212121] hover:bg-[#2e2e2e] text-[#b4b4b4] hover:text-white border border-[#2e2e2e] transition-colors"
          title="Settings & Profile"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside className="w-[260px] h-full bg-[#171717] text-[#ececec] border-r border-[#262626] flex flex-col z-20 shrink-0 select-none font-sans">
      {/* Top Bar with Brand & Actions */}
      <div className="pt-3.5 px-3 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 pl-1">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight">
            ThinkFlow
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 text-[#b4b4b4]">
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-[#262626] hover:text-white transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={createNewChat}
            className="p-1.5 rounded-lg hover:bg-[#262626] hover:text-white transition-colors"
            title="New Chat"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-1.5">
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#212121] border border-[#2e2e2e] text-xs text-[#8e8e8e] focus-within:border-[#424242] focus-within:text-[#ececec] transition-colors">
          <Search className="w-3.5 h-3.5 text-[#8e8e8e]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-xs text-[#ececec] placeholder-[#666666] focus:outline-none"
          />
        </div>
      </div>

      {/* Main Navigation Items */}
      <div className="px-2 pt-2 space-y-0.5">
        <button
          type="button"
          onClick={() => {}}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
        >
          <BookOpen className="w-4 h-4 shrink-0 text-[#8e8e8e]" />
          <span>Library</span>
        </button>

        <button
          type="button"
          onClick={() => {}}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
        >
          <Box className="w-4 h-4 shrink-0 text-[#8e8e8e]" />
          <span>Canvas Graphs</span>
        </button>
      </div>

      {/* Projects Section */}
      <div className="px-2 pt-3">
        <div className="px-3 py-1 text-[11px] font-semibold text-[#8e8e8e] tracking-tight">
          Projects
        </div>
        <div className="space-y-0.5 mt-0.5">
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
          >
            <FolderPlus className="w-4 h-4 shrink-0 text-[#8e8e8e]" />
            <span>New project</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
          >
            <Folder className="w-4 h-4 shrink-0 text-[#8e8e8e]" />
            <span>DSA</span>
          </button>
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-[#b4b4b4] hover:text-white hover:bg-[#212121] transition-colors"
          >
            <Folder className="w-4 h-4 shrink-0 text-[#8e8e8e]" />
            <span>German</span>
          </button>
        </div>
      </div>

      {/* Recents List Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 pt-3 space-y-0.5 scrollbar-thin">
        <div className="px-3 py-1 text-[11px] font-semibold text-[#8e8e8e] tracking-tight">
          Recents
        </div>

        {filteredConversations.map((conv) => {
          const isActive = conv.id === activeConversationId;

          return (
            <div
              key={conv.id}
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => switchConversation(conv.id)}
              className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                isActive
                  ? "bg-[#212121] text-white font-medium shadow-xs"
                  : "text-[#b4b4b4] hover:bg-[#212121]/60 hover:text-white"
              }`}
            >
              <span className="truncate flex-1 pr-2">
                {conv.title || "Untitled Chat"}
              </span>

              {hoveredId === conv.id && conversations.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="p-1 rounded text-[#8e8e8e] hover:text-red-400 hover:bg-[#2e2e2e] transition-colors shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* User Profile Pill at Bottom (Opens Settings Modal) */}
      <div className="p-3 border-t border-[#262626] bg-[#171717]">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#212121] transition-colors text-left group"
          title="Profile & AI Settings"
        >
          <div className="flex items-center gap-2.5 truncate">
            {/* User Avatar Circle */}
            <div className="w-7 h-7 rounded-full bg-[#a855f7] text-white flex items-center justify-center font-bold text-[11px] shrink-0 shadow-xs">
              NR
            </div>
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate leading-tight">
                Nikhil Reddy
              </span>
              <span className="text-[10px] text-[#8e8e8e] flex items-center gap-1 font-mono">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasKey ? "bg-[#27c93f]" : "bg-amber-400"
                  }`}
                />
                {providerInfo.name}
              </span>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-[#8e8e8e] group-hover:text-white transition-colors" />
        </button>
      </div>
    </aside>
  );
}
