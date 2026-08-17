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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[88vh] bg-zinc-900 border border-cyan-500/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header: Breadcrumbs & Navigation */}
        <div className="p-4 sm:px-6 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between gap-4">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setFocusNodeId(null)}
              className="flex items-center gap-1 text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
              title="Return to Main Conversation"
            >
              <Home className="w-3.5 h-3.5 text-emerald-400" />
              <span>Main Path</span>
            </button>

            {ancestors.map((anc) => (
              <React.Fragment key={anc.id}>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                <button
                  onClick={() => setFocusNodeId(anc.id)}
                  className="px-2 py-1 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-zinc-800 transition-colors truncate max-w-[140px] shrink-0"
                >
                  {anc.anchor ? `📍 ${anc.anchor.text}` : anc.promptQuestion || anc.type}
                </button>
              </React.Fragment>
            ))}

            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="px-2 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold truncate shrink-0">
              {currentNode.anchor ? `📍 ${currentNode.anchor.text}` : "Active Branch"}
            </span>
          </div>

          {/* Quick Exit Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {parentNode && (
              <button
                onClick={() => setFocusNodeId(parentNode.id)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                title="Back to parent node"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Parent</span>
              </button>
            )}
            <button
              onClick={() => setFocusNodeId(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md active:scale-95"
            >
              <span>Return to Main</span>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Focus Mode Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Active Anchor & Question Banner */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-cyan-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                Focus Exploration
              </span>
              {currentNode.anchor && (
                <span className="text-xs text-zinc-400">
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
              <p className="mt-2 text-xs text-zinc-400 italic border-l-2 border-indigo-500 pl-3">
                &ldquo;{currentNode.metadata.contextSentence}&rdquo;
              </p>
            )}
          </div>

          {/* AI Exploration Explanation */}
          <div className="p-6 rounded-2xl bg-zinc-950/70 border border-zinc-800">
            <SelectableText
              nodeId={currentNode.id}
              content={currentNode.content}
              anchors={anchors}
              className="text-sm leading-relaxed text-zinc-200 select-text"
            />
          </div>

          {/* Summary Section if generated */}
          {currentNode.summary ? (
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-700/50 text-xs text-indigo-200">
              <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-1">
                <FileText className="w-4 h-4" />
                <span>Exploration Summary</span>
              </div>
              <p className="whitespace-pre-wrap">{currentNode.summary}</p>
            </div>
          ) : (
            <button
              onClick={() => generateBranchSummary(currentNode.id)}
              className="py-2.5 px-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Summarize this entire branch</span>
            </button>
          )}

          {/* Sub-branches (Recursive Children) */}
          {children.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cyan-400" />
                <span>Nested Sub-Explorations ({children.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map((child) => (
                  <div
                    key={child.id}
                    onClick={() => setFocusNodeId(child.id)}
                    className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-cyan-400 hover:bg-zinc-950 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CornerDownRight className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-bold text-xs text-cyan-300 group-hover:text-cyan-200 truncate">
                          {child.anchor ? child.anchor.text : child.promptQuestion || "Sub-branch"}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-3">
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
        <div className="p-4 sm:p-6 border-t border-zinc-800 bg-zinc-950/80">
          <form onSubmit={handleSubSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={subQuestion}
              onChange={(e) => setSubQuestion(e.target.value)}
              placeholder={`Ask a follow-up question inside "${currentNode.anchor?.text || "this node"}"...`}
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!subQuestion.trim() || isGenerating}
              className="p-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
