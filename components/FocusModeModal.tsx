"use client";

import React, { useState, useEffect } from "react";
import { useGraph } from "@/context/GraphContext";
import { SelectableText } from "./SelectableText";
import {
  ArrowLeft,
  ChevronRight,
  Sparkles,
  GitBranch,
  X,
  FileText,
  CornerDownRight,
  ArrowRight,
  Home,
} from "lucide-react";

export function FocusModeModal() {
  const {
    focusNodeId,
    setFocusNodeId,
    getNode,
    getAncestors,
    getChildren,
    getAnchorsForNode,
    createDirectBranch,
    generateBranchSummary,
    isGenerating,
  } = useGraph();

  const [subQuestion, setSubQuestion] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFocusNodeId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setFocusNodeId]);

  if (!focusNodeId) return null;

  const currentNode = getNode(focusNodeId);
  if (!currentNode) return null;

  const ancestors = getAncestors(currentNode.id);
  const children = getChildren(currentNode.id);
  const anchors = getAnchorsForNode(currentNode.id);
  const parentNode = currentNode.parentId ? getNode(currentNode.parentId) : null;

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subQuestion.trim() || isGenerating) return;
    await createDirectBranch(currentNode.id, subQuestion);
    setSubQuestion("");
  };

  return (
    <div
      onClick={() => setFocusNodeId(null)}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150 font-sans select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl h-[88vh] bg-[#1c1c1c] border border-[#333333] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#ececec]"
      >
        {/* Top Header: Breadcrumbs & Navigation */}
        <div className="p-3.5 sm:px-6 border-b border-[#2a2a2a] bg-[#171717] flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-none py-1">
            <button
              type="button"
              onClick={() => setFocusNodeId(null)}
              className="flex items-center gap-1 text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-[#262626] transition-colors shrink-0 font-medium"
              title="Return to Main Conversation"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Main Path</span>
            </button>

            {ancestors.map((anc) => (
              <React.Fragment key={anc.id}>
                <ChevronRight className="w-3.5 h-3.5 text-[#555555] shrink-0" />
                <button
                  type="button"
                  onClick={() => setFocusNodeId(anc.id)}
                  className="px-2 py-1 rounded-lg text-[#8e8e8e] hover:text-white hover:bg-[#262626] transition-colors truncate max-w-[140px] shrink-0 font-medium"
                >
                  {anc.anchor ? `📍 ${anc.anchor.text}` : anc.promptQuestion || anc.type}
                </button>
              </React.Fragment>
            ))}

            <ChevronRight className="w-3.5 h-3.5 text-[#555555] shrink-0" />
            <span className="px-2.5 py-1 rounded-lg bg-[#282828] border border-[#3d3d3d] text-white font-semibold truncate shrink-0">
              {currentNode.anchor ? `📍 ${currentNode.anchor.text}` : "Active Branch"}
            </span>
          </div>

          {/* Exit Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {parentNode && (
              <button
                type="button"
                onClick={() => setFocusNodeId(parentNode.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#262626] hover:bg-[#333333] text-zinc-200 text-xs font-semibold transition-colors"
                title="Back to parent node"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Parent</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFocusNodeId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-[#e0e0e0] text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <span>Back</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Focus Mode Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-5 select-text">
          {/* Active Anchor & Question Banner */}
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#2e2e2e]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                {currentNode.actionType || "Exploration"}
              </span>
              {currentNode.anchor && (
                <span className="text-xs text-[#8e8e8e]">
                  Anchored on:{" "}
                  <strong className="text-white">&ldquo;{currentNode.anchor.text}&rdquo;</strong>
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-white">
              {currentNode.promptQuestion ||
                `Exploration of "${currentNode.anchor?.text || "Concept"}"`}
            </h2>

            {currentNode.metadata?.contextSentence && (
              <p className="mt-2 text-xs text-[#8e8e8e] italic border-l-2 border-indigo-500 pl-3">
                &ldquo;{currentNode.metadata.contextSentence}&rdquo;
              </p>
            )}
          </div>

          {/* AI Exploration Explanation */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#171717] border border-[#2e2e2e]">
            <SelectableText
              nodeId={currentNode.id}
              content={currentNode.content}
              anchors={anchors}
              className="text-xs sm:text-sm leading-relaxed text-[#ececec]"
            />
          </div>

          {/* Summary Section if generated */}
          {currentNode.summary ? (
            <div className="p-4 rounded-2xl bg-[#141414] border border-indigo-700/50 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                <FileText className="w-4 h-4" />
                <span>Exploration Summary</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed">{currentNode.summary}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => generateBranchSummary(currentNode.id)}
              className="py-2.5 px-4 rounded-xl bg-[#171717] border border-[#2e2e2e] hover:border-indigo-500/50 text-[#8e8e8e] hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Summarize this entire branch</span>
            </button>
          )}

          {/* Sub-branches (Recursive Children) */}
          {children.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-[#2a2a2a]">
              <h3 className="text-xs font-bold text-[#8e8e8e] uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Nested Sub-Explorations ({children.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => setFocusNodeId(child.id)}
                    className="p-4 rounded-xl bg-[#141414] border border-[#2e2e2e] hover:border-cyan-400 hover:bg-[#181818] cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-xs text-cyan-300 group-hover:text-cyan-200 truncate">
                          {child.anchor ? child.anchor.text : child.promptQuestion || "Sub-branch"}
                        </span>
                      </div>
                      <p className="text-xs text-[#8e8e8e] line-clamp-3 leading-relaxed">
                        {child.content}
                      </p>
                    </div>
                    <span className="text-[10px] text-cyan-400 mt-3 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Dive deeper</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sub-question Bottom Prompt */}
        <div className="p-4 sm:p-5 border-t border-[#2a2a2a] bg-[#171717]">
          <form onSubmit={handleSubSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={subQuestion}
              onChange={(e) => setSubQuestion(e.target.value)}
              placeholder={`Ask a follow-up question inside "${currentNode.anchor?.text || "this branch"}"...`}
              className="flex-1 bg-[#141414] border border-[#333333] rounded-2xl px-4 py-2.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-cyan-400 font-sans"
            />
            <button
              type="submit"
              disabled={!subQuestion.trim() || isGenerating}
              className="p-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
