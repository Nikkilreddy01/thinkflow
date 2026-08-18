"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGraph } from "@/context/GraphContext";
import { SelectableText } from "@/components/SelectableText";
import { BranchPreviewDrawer } from "./BranchPreviewDrawer";
import { PROVIDER_REGISTRY } from "@/lib/models";
import {
  Bot,
  ArrowUp,
  Plus,
  Globe,
  Type,
  Mic,
  GitBranch,
  Sparkles,
  Compass,
  ChevronDown,
  Check,
  FileText,
  X,
  FileCode,
  Image as ImageIcon,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  contentSnippet?: string;
}

export function ChatView() {
  const {
    getMainPathNodes,
    sendUserMessage,
    isGenerating,
    getAnchorsForNode,
    getChildren,
    setSelectedNodeId,
    selectedNodeId,
    createDirectBranch,
    settings,
    userProfile,
    saveProviderKey,
    setIsSettingsOpen,
  } = useGraph();

  const userInitials = (userProfile?.name || "NR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [inputMessage, setInputMessage] = useState("");
  const [activeBranchingNodeId, setActiveBranchingNodeId] = useState<string | null>(null);
  const [directQuestion, setDirectQuestion] = useState("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mainNodes = getMainPathNodes();

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as Node)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle file uploads via Finder file picker
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploaded: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      let snippet = "";
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(txt|md|json|ts|tsx|js|jsx|py|html|css|csv)$/i)
      ) {
        try {
          const text = await file.text();
          snippet = text.slice(0, 3000);
        } catch {}
      }

      newUploaded.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: sizeStr,
        type: file.type,
        contentSnippet: snippet,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newUploaded]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendMessage = async (customText?: string) => {
    const text = customText || inputMessage;
    if ((!text.trim() && uploadedFiles.length === 0) || isGenerating) return;

    let fullPrompt = text;
    if (uploadedFiles.length > 0) {
      const fileDetails = uploadedFiles
        .map((f) => {
          let str = `[Attached File: ${f.name} (${f.size})]`;
          if (f.contentSnippet) {
            str += `\n\`\`\`\n${f.contentSnippet}\n\`\`\``;
          }
          return str;
        })
        .join("\n\n");

      fullPrompt = `${fileDetails}\n\n${text || "Analyze the attached file(s)."}`;
    }

    setInputMessage("");
    setUploadedFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Only autoscroll when user explicitly sends a new main chat message
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    await sendUserMessage(fullPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDirectBranchSubmit = async (
    e: React.FormEvent,
    nodeId: string
  ) => {
    e.preventDefault();
    if (!directQuestion.trim() || isGenerating) return;
    await createDirectBranch(nodeId, directQuestion);
    setDirectQuestion("");
    setActiveBranchingNodeId(null);
  };

  // Provider and available models
  const currentProviderInfo =
    PROVIDER_REGISTRY[settings.activeProvider] || PROVIDER_REGISTRY.gemini;

  const currentKey = settings.keys?.[settings.activeProvider];

  const currentModelId =
    settings.models?.[settings.activeProvider] ||
    currentProviderInfo.defaultModel;

  const activeModelMeta =
    currentProviderInfo.models.find((m) => m.id === currentModelId) ||
    currentProviderInfo.models[0];

  const handleSelectModel = (modelId: string) => {
    saveProviderKey(
      settings.activeProvider,
      settings.keys?.[settings.activeProvider] || "",
      modelId
    );
    setIsModelDropdownOpen(false);
  };

  return (
    <div className="flex w-full h-full bg-[#212121] text-[#ececec] overflow-hidden relative font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Chat Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Messages Scroll Area - Expanded Horizontally & Hidden Scrollbar */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-5xl xl:max-w-6xl mx-auto w-full scrollbar-none">
          {mainNodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-200">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-indigo-500/10 to-cyan-400/20 border border-indigo-500/30 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-500/5">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                What would you like to explore?
              </h2>

              <p className="text-xs sm:text-sm text-[#8e8e8e] max-w-lg mb-6 leading-relaxed">
                Powered by <strong>{currentProviderInfo.name}</strong> (
                {activeModelMeta.name}). Select any text in responses to spawn
                anchored graph branches.
              </p>

              {/* Starter Topics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      "Teach me about neuroscience and synaptic transmission."
                    )
                  }
                  className="p-4 text-left rounded-2xl bg-[#282828] hover:bg-[#2f2f2f] border border-[#333333] hover:border-indigo-500/50 text-xs text-[#ececec] transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xs"
                >
                  <span className="font-semibold text-white block mb-0.5 group-hover:text-indigo-300 transition-colors text-sm">
                    🧠 Neuroscience
                  </span>
                  <span className="text-xs text-[#8e8e8e]">
                    Synaptic transmission, action potentials &amp; neural networks
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      "Explain the song 'Sad Gaana' to me and help me understand the Hindi."
                    )
                  }
                  className="p-4 text-left rounded-2xl bg-[#282828] hover:bg-[#2f2f2f] border border-[#333333] hover:border-pink-500/50 text-xs text-[#ececec] transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xs"
                >
                  <span className="font-semibold text-white block mb-0.5 group-hover:text-pink-300 transition-colors text-sm">
                    🎵 Hindi Song Lyrics
                  </span>
                  <span className="text-xs text-[#8e8e8e]">
                    Poetic slang, &apos;फ़क्र&apos; &amp; cultural lyric breakdown
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      "Explain recursion and call stack memory with code examples."
                    )
                  }
                  className="p-4 text-left rounded-2xl bg-[#282828] hover:bg-[#2f2f2f] border border-[#333333] hover:border-cyan-500/50 text-xs text-[#ececec] transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xs"
                >
                  <span className="font-semibold text-white block mb-0.5 group-hover:text-cyan-300 transition-colors text-sm">
                    💻 Computer Science
                  </span>
                  <span className="text-xs text-[#8e8e8e]">
                    Call stacks, stack frames, base cases &amp; memory unwinding
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSendMessage(
                      "How do quantum computers work compared to classical computers?"
                    )
                  }
                  className="p-4 text-left rounded-2xl bg-[#282828] hover:bg-[#2f2f2f] border border-[#333333] hover:border-emerald-500/50 text-xs text-[#ececec] transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-xs"
                >
                  <span className="font-semibold text-white block mb-0.5 group-hover:text-emerald-300 transition-colors text-sm">
                    ⚛️ Quantum Computing
                  </span>
                  <span className="text-xs text-[#8e8e8e]">
                    Qubits, superposition &amp; entanglement mechanics
                  </span>
                </button>
              </div>
            </div>
          ) : (
            mainNodes.map((node) => {
              const isUser = node.type === "user";
              const anchors = getAnchorsForNode(node.id);
              const branchChildren = getChildren(node.id).filter(
                (c) => !c.isMainPath
              );

              return (
                <div
                  key={node.id}
                  className={`w-full flex ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* Message Bubble Container */}
                  <div
                    className={`flex gap-3.5 ${
                      isUser
                        ? "justify-end max-w-[82%]"
                        : "justify-start w-full"
                    }`}
                  >
                    {isUser ? (
                      <div className="w-8 h-8 rounded-full bg-[#a855f7] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-1 shadow-xs order-2">
                        {userInitials}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#2f2f2f] text-white border border-[#383838] flex items-center justify-center shrink-0 mt-1 shadow-xs">
                        <Bot className="w-4 h-4 text-indigo-400" />
                      </div>
                    )}

                    {/* Content Box */}
                    <div
                      className={`transition-all ${
                        isUser
                          ? "rounded-3xl rounded-tr-md px-5 py-3.5 bg-[#2f2f2f] text-white text-sm font-normal shadow-sm leading-relaxed"
                          : "flex-1 w-full text-[#ececec]"
                      }`}
                    >
                      {/* Node Header for AI */}
                      {!isUser && (
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e2e] text-xs text-[#8e8e8e]">
                          <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>AI Response</span>
                            <span className="text-[11px] text-[#8e8e8e] font-mono">
                              ({activeModelMeta.name})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveBranchingNodeId(
                                activeBranchingNodeId === node.id ? null : node.id
                              )
                            }
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2a2a2a] hover:bg-[#333333] text-[#b4b4b4] hover:text-white text-xs transition-colors border border-[#383838]"
                            title="Branch without text selection"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Explore</span>
                          </button>
                        </div>
                      )}

                      {/* Direct exploration input if active */}
                      {activeBranchingNodeId === node.id && (
                        <form
                          onSubmit={(e) => handleDirectBranchSubmit(e, node.id)}
                          className="mb-4 p-2.5 rounded-2xl bg-[#1a1a1a] border border-indigo-500/40 flex items-center gap-2"
                        >
                          <Compass className="w-4 h-4 text-indigo-400 ml-1" />
                          <input
                            type="text"
                            value={directQuestion}
                            onChange={(e) => setDirectQuestion(e.target.value)}
                            placeholder="Ask a question branching from this response..."
                            className="flex-1 bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="submit"
                            disabled={!directQuestion.trim() || isGenerating}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                          >
                            Branch ↗
                          </button>
                        </form>
                      )}

                      {/* Selectable text with full markdown rendering */}
                      <SelectableText
                        nodeId={node.id}
                        content={node.content}
                        anchors={anchors}
                        className="text-sm leading-relaxed"
                      />

                      {/* Attached Exploration Chips */}
                      {branchChildren.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-[#2e2e2e] flex flex-wrap gap-2 items-center">
                          <span className="text-[11px] font-semibold text-[#8e8e8e] uppercase tracking-wider flex items-center gap-1">
                            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                            Explorations:
                          </span>
                          {branchChildren.map((branch) => {
                            const subKids = getChildren(branch.id);
                            const totalCount = 1 + subKids.length;
                            const isBranchSelected = selectedNodeId === branch.id;

                            return (
                              <button
                                key={branch.id}
                                type="button"
                                onClick={() => setSelectedNodeId(branch.id)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                                  isBranchSelected
                                    ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-sm"
                                    : "bg-[#1e1e1e] border-[#383838] text-cyan-300 hover:border-cyan-500 hover:bg-[#252525]"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span>
                                  {branch.anchor
                                    ? branch.anchor.text
                                    : branch.promptQuestion?.slice(0, 20) || "Branch"}
                                </span>
                                <span className="text-[10px] bg-cyan-900/80 px-1.5 py-0.2 rounded-full text-white font-mono font-bold">
                                  {totalCount}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Bottom Input Capsule - Expanded Horizontally */}
        <div className="p-4 bg-transparent relative">
          <div className="max-w-4xl xl:max-w-5xl mx-auto relative">
            {/* Attached Files Bar */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-xl">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#282828] border border-[#3d3d3d] text-xs text-white"
                  >
                    {file.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                      <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                    ) : file.name.match(/\.(ts|tsx|js|jsx|py|json|html)$/i) ? (
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span className="truncate max-w-[160px] font-medium">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-[#8e8e8e] font-mono">
                      {file.size}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-0.5 hover:text-red-400 rounded transition-colors"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Capsule Box */}
            <div className="rounded-3xl bg-[#2f2f2f] border border-[#383838] shadow-2xl p-3 sm:p-3.5 flex flex-col gap-2 transition-all focus-within:border-[#555555]">
              {/* Text Input */}
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(220, e.target.scrollHeight)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                rows={1}
                disabled={isGenerating}
                className="w-full bg-transparent px-2.5 py-1 text-sm text-white placeholder-[#8e8e8e] focus:outline-none resize-none max-h-48 scrollbar-none font-sans leading-relaxed"
              />

              {/* Bottom Controls Row */}
              <div className="flex items-center justify-between pt-1 relative">
                {/* Left Action Buttons & Model Picker */}
                <div className="flex items-center gap-1.5 text-[#b4b4b4]">
                  {/* + Button: Finder upload */}
                  <button
                    type="button"
                    onClick={handleFileClick}
                    className="p-1.5 rounded-full hover:bg-[#3d3d3d] hover:text-white transition-colors"
                    title="Upload File / Document (Open Finder)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsWebSearchActive(!isWebSearchActive)}
                    className={`p-1.5 rounded-full transition-colors ${
                      isWebSearchActive
                        ? "bg-indigo-600/80 text-white"
                        : "hover:bg-[#3d3d3d] hover:text-white"
                    }`}
                    title="Web Search"
                  >
                    <Globe className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1.5 rounded-full hover:bg-[#3d3d3d] hover:text-white transition-colors"
                    title="Formatting & Settings"
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  {/* Interactive Dynamic Model Dropdown */}
                  <div className="relative ml-1" ref={modelDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#383838] hover:bg-[#444444] text-xs font-medium text-[#ececec] transition-colors border border-transparent hover:border-[#555555]"
                      title="Select Model for active provider"
                    >
                      <span className="font-semibold">{activeModelMeta.name}</span>
                      <span className="text-[10px] text-[#8e8e8e] font-mono">
                        ({currentKey?.startsWith("ya29.") ? "OAuth" : currentKey ? "API" : "Offline"})
                      </span>
                      <ChevronDown className="w-3 h-3 text-[#8e8e8e]" />
                    </button>

                    {/* Dynamic Models Popup */}
                    {isModelDropdownOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-80 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                        <div className="px-2 py-1 text-[10px] font-semibold text-[#8e8e8e] uppercase flex items-center justify-between">
                          <span>{currentProviderInfo.name} Models</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsModelDropdownOpen(false);
                              setIsSettingsOpen(true);
                            }}
                            className="text-indigo-400 hover:underline lowercase text-[10px]"
                          >
                            settings
                          </button>
                        </div>

                        <div className="space-y-1 mt-1 max-h-72 overflow-y-auto scrollbar-thin">
                          {currentProviderInfo.models.map((m) => {
                            const isSelected = m.id === currentModelId;

                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => handleSelectModel(m.id)}
                                className={`w-full flex items-start justify-between p-2.5 rounded-xl text-xs text-left transition-colors ${
                                  isSelected
                                    ? "bg-[#2e2e2e] text-white font-medium border border-indigo-500/30"
                                    : "text-[#b4b4b4] hover:bg-[#282828] hover:text-white"
                                }`}
                              >
                                <div className="space-y-0.5 max-w-[85%]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-white">
                                      {m.name}
                                    </span>
                                    {m.badge && (
                                      <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded font-mono">
                                        {m.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#8e8e8e] leading-tight">
                                    {m.description}
                                  </p>
                                </div>

                                {isSelected && (
                                  <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Voice & Send Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-[#3d3d3d] text-[#b4b4b4] hover:text-white transition-colors"
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={
                      (!inputMessage.trim() && uploadedFiles.length === 0) ||
                      isGenerating
                    }
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      (inputMessage.trim() || uploadedFiles.length > 0) &&
                      !isGenerating
                        ? "bg-white text-black hover:bg-[#e0e0e0] shadow-sm active:scale-95"
                        : "bg-[#424242] text-[#8e8e8e] cursor-not-allowed"
                    }`}
                    title="Send"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-over Branch Preview Drawer */}
      <BranchPreviewDrawer />
    </div>
  );
}
