"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { GraphNode } from "@/types/graph";
import { useGraph } from "@/context/GraphContext";
import { SelectableText } from "@/components/SelectableText";
import {
  Compass,
  Sparkles,
  Maximize2,
  Trash2,
  FileText,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Plus,
  GripHorizontal,
} from "lucide-react";

export const ExplorationNode = memo(({ data }: { data: GraphNode }) => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    setFocusNodeId,
    deleteNode,
    getAnchorsForNode,
    getChildren,
    toggleCollapseNode,
    generateBranchSummary,
    createDirectBranch,
    isGenerating,
  } = useGraph();

  const [isAddingSubBranch, setIsAddingSubBranch] = useState(false);
  const [subQuestion, setSubQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === data.id;
  const nodeAnchors = getAnchorsForNode(data.id);
  const childBranches = getChildren(data.id);

  // Native non-passive Option (Alt) + Wheel listener to scroll card text
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (e.altKey || e.shiftKey || e.metaKey || e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop += e.deltaY;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleCreateSubBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subQuestion.trim() || isGenerating) return;
    await createDirectBranch(data.id, subQuestion);
    setSubQuestion("");
    setIsAddingSubBranch(false);
  };

  return (
    <div
      onClick={() => setSelectedNodeId(data.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setFocusNodeId(data.id);
      }}
      className={`relative min-w-[360px] min-h-[160px] w-full h-full rounded-2xl p-4 shadow-2xl transition-all duration-150 backdrop-blur-md cursor-pointer border flex flex-col justify-between ${
        isSelected
          ? "border-cyan-400 bg-[#1c1c1c] ring-2 ring-cyan-500/30 shadow-cyan-500/10"
          : "border-cyan-800/40 bg-[#1a1a1a]/95 hover:border-cyan-600/70 hover:bg-[#202020]"
      }`}
    >
      {/* Node Resizer */}
      <NodeResizer
        minWidth={340}
        minHeight={140}
        isVisible={isSelected}
        lineClassName="!border-cyan-400"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border-2 !border-cyan-400 !rounded-sm"
      />

      {/* Target handle from parent anchor */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-in"
        className="!w-3.5 !h-3.5 !bg-cyan-400 !border-2 !border-[#1c1c1c]"
      />

      {/* Drag Handle Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e2e] shrink-0 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 truncate max-w-[260px]">
          <GripHorizontal className="w-3.5 h-3.5 text-[#666666]" />
          <div className="w-5 h-5 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30 shrink-0">
            <Compass className="w-3 h-3" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/50">
                {data.actionType || "Exploration"}
              </span>
              {data.anchor && (
                <span className="text-xs font-bold text-zinc-100 truncate">
                  📍 &ldquo;{data.anchor.text}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFocusNodeId(data.id);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-cyan-300 transition-colors"
            title="Maximize (Double click card)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              generateBranchSummary(data.id);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-white transition-colors"
            title="Generate Summary"
          >
            <FileText className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingSubBranch(!isAddingSubBranch);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-white transition-colors"
            title="Add Sub-branch"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(data.id);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-red-400 transition-colors"
            title="Delete Branch"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Direct Sub-branch input */}
      {isAddingSubBranch && (
        <form
          onSubmit={handleCreateSubBranch}
          onClick={(e) => e.stopPropagation()}
          className="mb-3 p-2 rounded-xl bg-[#141414] border border-cyan-500/40 animate-in fade-in flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 ml-1" />
          <input
            type="text"
            value={subQuestion}
            onChange={(e) => setSubQuestion(e.target.value)}
            placeholder="Ask sub-question..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!subQuestion.trim() || isGenerating}
            className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-medium disabled:opacity-40"
          >
            Sub-branch ↗
          </button>
        </form>
      )}

      {/* Selectable Content area (Hold Option/Alt + Scroll to scroll text) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-[440px] select-text pr-1 scrollbar-thin"
        title="Hold Option (Alt) + Scroll to scroll text"
      >
        <SelectableText
          nodeId={data.id}
          content={data.content}
          anchors={nodeAnchors}
          className="text-xs text-zinc-200 leading-relaxed"
        />
      </div>

      {/* Branch summary preview if generated */}
      {data.summary && (
        <div className="mt-2.5 p-2 rounded-xl bg-indigo-950/50 border border-indigo-700/50 text-[11px] text-indigo-200 shrink-0">
          <div className="flex items-center gap-1 font-semibold text-indigo-300 mb-0.5">
            <FileText className="w-3 h-3" />
            <span>Branch Summary</span>
          </div>
          <p className="whitespace-pre-wrap">{data.summary}</p>
        </div>
      )}

      {/* Sub-branch count badge */}
      {childBranches.length > 0 && (
        <div className="mt-2 pt-2 border-t border-[#2e2e2e] flex items-center justify-between text-[11px] text-zinc-400 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapseNode(data.id);
            }}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
          >
            <GitBranch className="w-3 h-3" />
            <span>{childBranches.length} sub-explorations</span>
            {data.collapsed ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronUp className="w-3 h-3" />
            )}
          </button>
          <span className="text-[10px] text-[#8e8e8e]">
            Select text to branch deeper
          </span>
        </div>
      )}

      {/* Source handle for recursive child branches */}
      <Handle
        type="source"
        position={Position.Right}
        id="branch-out"
        className="!w-3.5 !h-3.5 !bg-cyan-400 !border-2 !border-[#1c1c1c]"
      />
    </div>
  );
});

ExplorationNode.displayName = "ExplorationNode";
