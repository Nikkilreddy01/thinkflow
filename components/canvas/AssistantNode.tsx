"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { GraphNode } from "@/types/graph";
import { useGraph } from "@/context/GraphContext";
import { SelectableText } from "@/components/SelectableText";
import {
  Bot,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Plus,
  Compass,
  Maximize2,
  GripHorizontal,
} from "lucide-react";

export const AssistantNode = memo(({ data }: { data: GraphNode }) => {
  const {
    selectedNodeId,
    setSelectedNodeId,
    setFocusNodeId,
    getAnchorsForNode,
    getChildren,
    toggleCollapseNode,
    createDirectBranch,
    isGenerating,
  } = useGraph();

  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [directQuestion, setDirectQuestion] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const isSelected = selectedNodeId === data.id;
  const nodeAnchors = getAnchorsForNode(data.id);
  const childBranches = getChildren(data.id).filter((c) => !c.isMainPath);

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

  const handleCreateDirectBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directQuestion.trim() || isGenerating) return;
    await createDirectBranch(data.id, directQuestion);
    setDirectQuestion("");
    setIsAddingBranch(false);
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
          ? "border-indigo-400/90 bg-[#1c1c1c] ring-2 ring-indigo-500/30 shadow-indigo-500/10"
          : "border-[#333333] bg-[#1f1f1f]/90 hover:border-[#444444] hover:bg-[#242424]"
      }`}
    >
      {/* Node Resizer */}
      <NodeResizer
        minWidth={340}
        minHeight={140}
        isVisible={isSelected}
        lineClassName="!border-indigo-500"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border-2 !border-indigo-500 !rounded-sm"
      />

      {/* Target handle from user prompt */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-[#1c1c1c]"
      />

      {/* Drag Handle Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e2e] shrink-0 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-[#666666]" />
          <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30 shrink-0">
            <Bot className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-zinc-100 flex items-center gap-1.5">
            <span>AI Response</span>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          </span>
        </div>

        <div className="flex items-center gap-1">
          {childBranches.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapseNode(data.id);
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-[10px] font-medium hover:bg-indigo-900/60 transition-colors"
              title="Toggle branch visibility"
            >
              <GitBranch className="w-3 h-3 text-indigo-400" />
              <span>{childBranches.length} branches</span>
              {data.collapsed ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronUp className="w-3 h-3" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFocusNodeId(data.id);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-indigo-300 transition-colors"
            title="Maximize (Double click card)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingBranch(!isAddingBranch);
            }}
            className="p-1 rounded-lg bg-[#2e2e2e] hover:bg-[#383838] text-zinc-300 hover:text-white transition-colors"
            title="Create exploration branch"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Direct Branch input form */}
      {isAddingBranch && (
        <form
          onSubmit={handleCreateDirectBranch}
          onClick={(e) => e.stopPropagation()}
          className="mb-3 p-2 rounded-xl bg-[#141414] border border-indigo-500/40 animate-in fade-in flex items-center gap-1.5 shrink-0"
        >
          <Compass className="w-3.5 h-3.5 text-indigo-400 ml-1" />
          <input
            type="text"
            value={directQuestion}
            onChange={(e) => setDirectQuestion(e.target.value)}
            placeholder="Ask a question from this node..."
            className="flex-1 bg-transparent text-xs text-white placeholder-[#666666] focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            disabled={!directQuestion.trim() || isGenerating}
            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium disabled:opacity-40"
          >
            Branch ↗
          </button>
        </form>
      )}

      {/* Selectable Content area (Hold Option/Alt + Scroll to scroll text) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-[460px] select-text pr-1 scrollbar-thin"
        title="Hold Option (Alt) + Scroll to scroll text"
      >
        <SelectableText
          nodeId={data.id}
          content={data.content}
          anchors={nodeAnchors}
          className="text-xs text-zinc-200 leading-relaxed"
        />
      </div>

      {/* Main path bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-[#1c1c1c]"
      />

      {/* Right handle for anchored exploration branches */}
      <Handle
        type="source"
        position={Position.Right}
        id="branch-out"
        className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-[#1c1c1c]"
      />
    </div>
  );
});

AssistantNode.displayName = "AssistantNode";
