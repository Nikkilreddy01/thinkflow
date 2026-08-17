"use client";

import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { useGraph } from "@/context/GraphContext";

export function AnchorEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  label,
}: EdgeProps) {
  const { setSelectedNodeId } = useGraph();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const anchorLabel = (label as string) || (data?.anchorText as string);
  const isAnchor = data?.isAnchorEdge ?? true;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: isAnchor ? 3 : 2,
          stroke: isAnchor ? "#06b6d4" : "#818cf8",
          strokeDasharray: isAnchor ? "6 6" : "4 4",
          opacity: 0.9,
          animation: "dashdraw 0.8s linear infinite",
          ...style,
        }}
      />
      {anchorLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan z-30"
          >
            <div
              onClick={() => {
                if (data?.targetNodeId) {
                  setSelectedNodeId(data.targetNodeId as string);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#181818] border border-cyan-500/60 text-[11px] font-semibold text-cyan-300 shadow-xl backdrop-blur-md hover:border-cyan-400 hover:scale-105 transition-all cursor-pointer group"
              title="Click to select branch"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="truncate max-w-[150px] font-mono">
                &ldquo;{anchorLabel}&rdquo;
              </span>
              <span className="text-[10px] text-cyan-400 opacity-60 group-hover:opacity-100">
                →
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
