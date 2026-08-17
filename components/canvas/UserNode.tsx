"use client";

import React, { memo, useRef, useEffect } from "react";
import { Handle, Position, NodeResizer } from "@xyflow/react";
import { GraphNode } from "@/types/graph";
import { useGraph } from "@/context/GraphContext";
import { User, Maximize2, GripHorizontal } from "lucide-react";

export const UserNode = memo(({ data }: { data: GraphNode }) => {
  const { selectedNodeId, setSelectedNodeId, setFocusNodeId } = useGraph();
  const isSelected = selectedNodeId === data.id;
  const scrollRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      onClick={() => setSelectedNodeId(data.id)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setFocusNodeId(data.id);
      }}
      className={`relative min-w-[320px] min-h-[110px] w-full h-full rounded-2xl p-4 shadow-xl transition-all duration-150 backdrop-blur-md cursor-pointer border flex flex-col justify-between ${
        isSelected
          ? "border-emerald-400/90 bg-[#1c1c1c] ring-2 ring-emerald-500/30 shadow-emerald-500/10"
          : "border-[#333333] bg-[#1f1f1f]/90 hover:border-[#444444] hover:bg-[#242424]"
      }`}
    >
      {/* Node Resizer */}
      <NodeResizer
        minWidth={300}
        minHeight={90}
        isVisible={isSelected}
        lineClassName="!border-emerald-500"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-500 !rounded-sm"
      />

      {/* Target handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#1c1c1c]"
      />

      {/* Drag Handle Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2e2e2e] shrink-0 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-3.5 h-3.5 text-[#666666]" />
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30 shrink-0">
            <User className="w-3 h-3" />
          </div>
          <span className="text-xs font-semibold text-zinc-100">
            User Prompt
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setFocusNodeId(data.id);
            }}
            className="p-1 rounded text-[#8e8e8e] hover:text-emerald-300 transition-colors"
            title="Maximize (Double click card)"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Scrollable Content (Hold Option/Alt + Scroll to scroll text) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto max-h-[420px] select-text pr-1 scrollbar-thin"
        title="Hold Option (Alt) + Scroll to scroll text"
      >
        <p className="text-xs sm:text-sm font-medium text-zinc-100 whitespace-pre-wrap leading-relaxed">
          {data.content}
        </p>
      </div>

      {/* Source handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-[#1c1c1c]"
      />
    </div>
  );
});

UserNode.displayName = "UserNode";
