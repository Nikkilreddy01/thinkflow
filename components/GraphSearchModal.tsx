"use client";

import React, { useState, useEffect } from "react";
import { useGraph } from "@/context/GraphContext";
import { Search, X, ArrowRight } from "lucide-react";

interface GraphSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GraphSearchModal({ isOpen, onClose }: GraphSearchModalProps) {
  const { nodes, setSelectedNodeId, setFocusNodeId } = useGraph();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNodes = query.trim()
    ? nodes.filter((n) => {
        const q = query.toLowerCase();
        return (
          n.content.toLowerCase().includes(q) ||
          n.anchor?.text.toLowerCase().includes(q) ||
          n.promptQuestion?.toLowerCase().includes(q)
        );
      })
    : nodes;

  const handleSelectResult = (nodeId: string, openInFocus = false) => {
    setSelectedNodeId(nodeId);
    if (openInFocus) {
      setFocusNodeId(nodeId);
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150 font-sans select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#1c1c1c] border border-[#333333] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] text-[#ececec]"
      >
        {/* Search Header */}
        <div className="p-4 border-b border-[#2a2a2a] flex items-center gap-3 bg-[#171717]">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words, anchors, questions, or concepts..."
            className="flex-1 bg-transparent text-sm text-white placeholder-[#666666] focus:outline-none font-sans"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded text-[#8e8e8e] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-[#8e8e8e] bg-[#242424] border border-[#333333] px-2 py-0.5 rounded font-mono">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-[#8e8e8e] text-xs font-mono">
              No matching nodes or anchors found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredNodes.map((node) => {
              const isMain = node.isMainPath;
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectResult(node.id, !isMain)}
                  className="p-3 rounded-2xl bg-[#141414] border border-[#2e2e2e] hover:border-indigo-500/60 hover:bg-[#181818] cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="space-y-1 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isMain
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800/50"
                            : "bg-cyan-950/80 text-cyan-300 border border-cyan-800/50"
                        }`}
                      >
                        {isMain ? "Main Path" : "Exploration Branch"}
                      </span>

                      {node.anchor && (
                        <span className="text-xs font-semibold text-cyan-300">
                          📍 &ldquo;{node.anchor.text}&rdquo;
                        </span>
                      )}
                    </div>

                    {node.promptQuestion && (
                      <p className="text-xs font-medium text-white truncate">
                        {node.promptQuestion}
                      </p>
                    )}

                    <p className="text-xs text-[#8e8e8e] line-clamp-2 leading-relaxed">
                      {node.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center text-xs text-indigo-400 font-medium">
                    <span>Jump</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
