"use client";

import React, { useState, useEffect, useRef } from "react";
import { useGraph } from "@/context/GraphContext";
import { QuickActionType } from "@/types/graph";
import {
  Sparkles,
  HelpCircle,
  Zap,
  Languages,
  Compass,
  ArrowRight,
  X,
  MessageSquarePlus,
} from "lucide-react";

export function SelectionToolbar() {
  const { activeSelection, createAnchoredBranch, setActiveSelection, isGenerating } =
    useGraph();
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customQuestion, setCustomQuestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const prevTextRef = useRef<string | undefined>(undefined);
  if (prevTextRef.current !== activeSelection?.text) {
    prevTextRef.current = activeSelection?.text;
    if (isCustomMode) setIsCustomMode(false);
    if (customQuestion) setCustomQuestion("");
  }

  useEffect(() => {
    if (isCustomMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCustomMode]);

  // Handle outside click and escape key to close toolbar
  useEffect(() => {
    if (!activeSelection) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveSelection(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(e.target as unknown as HTMLElement)
      ) {
        // Small delay to allow button click handler to fire first
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) {
            setActiveSelection(null);
          }
        }, 150);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [activeSelection, setActiveSelection]);

  if (!activeSelection || !activeSelection.rect) {
    return null;
  }

  const { rect, text } = activeSelection;

  // Calculate position (centered above selection, with window boundary checks)
  const top = Math.max(10, rect.top - 56 + window.scrollY);
  const left = Math.max(
    16,
    Math.min(
      window.innerWidth - 380,
      rect.left + rect.width / 2 - 190 + window.scrollX
    )
  );

  const handleActionClick = async (actionType: QuickActionType) => {
    if (isGenerating) return;
    await createAnchoredBranch(activeSelection, actionType);
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || isGenerating) return;
    await createAnchoredBranch(activeSelection, "ask", customQuestion);
  };

  return (
    <div
      ref={toolbarRef}
      style={{
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 9999,
      }}
      className="animate-in fade-in zoom-in-95 duration-100 select-none shadow-2xl rounded-2xl border border-[#333333] bg-[#1e1e1e]/98 backdrop-blur-xl text-[#ececec] p-1.5 flex flex-col gap-1.5 font-sans"
    >
      {/* Header with selected snippet preview */}
      <div className="flex items-center justify-between px-2.5 py-0.5 border-b border-[#2a2a2a] text-[11px] text-[#8e8e8e]">
        <div className="flex items-center gap-1.5 truncate max-w-[280px]">
          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <span className="font-medium text-zinc-300 truncate">
            &ldquo;{text}&rdquo;
          </span>
        </div>
        <button
          type="button"
          onClick={() => setActiveSelection(null)}
          className="text-[#8e8e8e] hover:text-white p-0.5 rounded transition-colors ml-2"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {!isCustomMode ? (
        /* Action buttons bar */
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCustomMode(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#2e2e2e] hover:bg-[#383838] text-white text-xs font-semibold transition-all shadow-xs active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Ask AI</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("explain")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#282828] text-[#d4d4d4] hover:text-white text-xs font-medium transition-colors"
            title="Explain specifically in this context"
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            <span>Explain</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("simplify")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#282828] text-[#d4d4d4] hover:text-white text-xs font-medium transition-colors"
            title="Minimal plain-English summary"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simplify</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("translate")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#282828] text-[#d4d4d4] hover:text-white text-xs font-medium transition-colors"
            title="Linguistic and slang breakdown"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400" />
            <span>Translate</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("why")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#282828] text-[#d4d4d4] hover:text-white text-xs font-medium transition-colors"
            title="Why is this used here?"
          >
            <span className="font-bold text-violet-400 text-xs">?</span>
            <span>Why?</span>
          </button>

          <button
            type="button"
            onClick={() => handleActionClick("explore")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-[#282828] text-[#d4d4d4] hover:text-white text-xs font-medium transition-colors"
            title="Deep dive exploration"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explore ↗</span>
          </button>
        </div>
      ) : (
        /* Custom prompt input box */
        <form
          onSubmit={handleCustomSubmit}
          className="flex items-center gap-1.5 w-[320px] p-0.5"
        >
          <div className="relative flex-1">
            <MessageSquarePlus className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8e8e8e]" />
            <input
              ref={inputRef}
              type="text"
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder={`Ask about "${text}"...`}
              className="w-full bg-[#141414] border border-[#333333] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-[#666666] focus:outline-none focus:border-zinc-500 font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={!customQuestion.trim() || isGenerating}
            className="p-1.5 rounded-xl bg-white text-black hover:bg-[#e0e0e0] disabled:opacity-40 text-xs font-semibold transition-all"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
