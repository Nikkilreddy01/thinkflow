"use client";

import React, { useState } from "react";
import { useGraph } from "@/context/GraphContext";
import { SelectableText } from "@/components/SelectableText";
import {
  Compass,
  X,
  Maximize2,
  GitBranch,
  ArrowRight,
  Sparkles,
  ChevronRight,
  FileText,
} from "lucide-react";

export function BranchPreviewDrawer() {
  const {
    selectedNodeId,
    setSelectedNodeId,
    setFocusNodeId,
    getNode,
    getChildren,
    getAnchorsForNode,
    createDirectBranch,
    generateBranchSummary,
    isGenerating,
  } = useGraph();

  const [subQuestion, setSubQuestion] = useState("");

  const activeNode = selectedNodeId ? getNode(selectedNodeId) : null;
  if (!activeNode || activeNode.isMainPath) {
    return null;
  }

  const childBranches = getChildren(activeNode.id);
  const nodeAnchors = getAnchorsForNode(activeNode.id);

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subQuestion.trim() || isGenerating) return;
    await createDirectBranch(activeNode.id, subQuestion);
    setSubQuestion("");
  };

  return (
    <div className="w-96 border-l border-[#2e2e2e] bg-[#1a1a1a] text-[#ececec] flex flex-col h-full z-20 animate-in slide-in-from-right duration-150 font-sans shadow-2xl">
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#2e2e2e] flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30 shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
              {activeNode.actionType || "Exploration"}
            </span>
            <h3 className="text-xs font-semibold text-white truncate">
              {activeNode.anchor
                ? `📍 "${activeNode.anchor.text}"`
                : activeNode.promptQuestion || "Branch Node"}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setFocusNodeId(activeNode.id)}
            className="p-1.5 rounded-lg hover:bg-[#282828] text-[#8e8e8e] hover:text-cyan-300 transition-colors"
            title="Open Focus Mode"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="p-1.5 rounded-lg hover:bg-[#282828] text-[#8e8e8e] hover:text-white transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Source Anchor context box */}
        {activeNode.anchor && (
          <div className="p-3 rounded-xl bg-[#212121] border border-[#2e2e2e] text-xs">
            <span className="text-[10px] text-[#8e8e8e] font-semibold uppercase tracking-wider block mb-1">
              Source Anchor
            </span>
            <div className="text-zinc-300">
              Selected:{" "}
              <span className="font-semibold text-cyan-300 underline decoration-cyan-500/50">
                &ldquo;{activeNode.anchor.text}&rdquo;
              </span>
            </div>
            {activeNode.metadata?.contextSentence && (
              <p className="text-[11px] text-[#8e8e8e] italic mt-1 border-l-2 border-indigo-500 pl-2">
                &ldquo;{activeNode.metadata.contextSentence}&rdquo;
              </p>
            )}
          </div>
        )}

        {/* Prompt Question */}
        {activeNode.promptQuestion && (
          <div className="text-xs font-medium text-indigo-300 bg-indigo-950/40 border border-indigo-900/60 p-2.5 rounded-xl">
            {activeNode.promptQuestion}
          </div>
        )}

        {/* Exploration AI Content */}
        <div className="p-3.5 rounded-xl bg-[#212121] border border-[#2e2e2e]">
          <SelectableText
            nodeId={activeNode.id}
            content={activeNode.content}
            anchors={nodeAnchors}
            className="text-xs text-[#ececec] leading-relaxed"
          />
        </div>

        {/* Branch summary if available */}
        {activeNode.summary ? (
          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200">
            <div className="font-bold text-cyan-300 flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Summary</span>
            </div>
            <p className="whitespace-pre-wrap text-[11px]">
              {activeNode.summary}
            </p>
          </div>
        ) : (
          <button
            onClick={() => generateBranchSummary(activeNode.id)}
            className="w-full py-2 px-3 rounded-xl bg-[#212121] hover:bg-[#282828] border border-[#2e2e2e] text-[#8e8e8e] hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Generate Branch Recap</span>
          </button>
        )}

        {/* Sub-branches list */}
        {childBranches.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-[#2e2e2e]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#8e8e8e]">
              <span className="flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sub-Explorations ({childBranches.length})</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {childBranches.map((child) => (
                <div
                  key={child.id}
                  onClick={() => setSelectedNodeId(child.id)}
                  className="p-2.5 rounded-lg bg-[#212121] border border-[#2e2e2e] hover:border-cyan-500/50 hover:bg-[#262626] cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div className="truncate">
                    <span className="font-semibold text-cyan-300">
                      {child.anchor
                        ? `📍 ${child.anchor.text}`
                        : child.promptQuestion || "Exploration"}
                    </span>
                    <p className="text-[11px] text-[#8e8e8e] truncate mt-0.5">
                      {child.content.slice(0, 60)}...
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#8e8e8e] shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Direct Sub-Question Input */}
      <div className="p-3 border-t border-[#2e2e2e] bg-[#1a1a1a]">
        <form onSubmit={handleSubSubmit} className="flex items-center gap-1.5">
          <input
            type="text"
            value={subQuestion}
            onChange={(e) => setSubQuestion(e.target.value)}
            placeholder="Ask sub-question inside branch..."
            className="flex-1 bg-[#212121] border border-[#333333] rounded-lg px-3 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={!subQuestion.trim() || isGenerating}
            className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-40"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
