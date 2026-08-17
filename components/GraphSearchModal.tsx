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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search words, anchors, lyrics, questions..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 rounded text-zinc-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded font-mono">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredNodes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No matching nodes or anchors found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredNodes.map((node) => {
              const isMain = node.isMainPath;
              return (
                <div
                  key={node.id}
                  onClick={() => handleSelectResult(node.id, !isMain)}
                  className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 hover:border-indigo-500/60 hover:bg-zinc-950 cursor-pointer transition-all flex items-start justify-between group"
                >
                  <div className="space-y-1 max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
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

                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {node.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center text-xs text-indigo-400">
                    <span>Inspect</span>
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
