"use client";

import React, { useRef, useCallback } from "react";
import { useGraph } from "@/context/GraphContext";
import { TextAnchor, TextSelectionPayload } from "@/types/graph";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface SelectableTextProps {
  nodeId: string;
  content: string;
  anchors?: TextAnchor[];
  className?: string;
  allowSelection?: boolean;
}

export function SelectableText({
  nodeId,
  content,
  anchors = [],
  className = "",
  allowSelection = true,
}: SelectableTextProps) {
  const { setActiveSelection } = useGraph();
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract precise selection on mouseup over rendered markdown elements
  const handleMouseUp = useCallback(() => {
    if (!allowSelection) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Check if selection happened inside our container
      if (
        containerRef.current &&
        containerRef.current.contains(range.commonAncestorContainer)
      ) {
        const fullText = content;
        const start = fullText.indexOf(selectedText);
        const end =
          start !== -1 ? start + selectedText.length : selectedText.length;

        // Extract surrounding sentence
        let contextSentence = selectedText;
        if (start !== -1) {
          const sentenceStart = Math.max(0, fullText.lastIndexOf(".", start) + 1);
          let sentenceEnd = fullText.indexOf(".", end);
          if (sentenceEnd === -1) sentenceEnd = fullText.length;
          contextSentence = fullText.slice(sentenceStart, sentenceEnd).trim();
        }

        const payload: TextSelectionPayload = {
          sourceNodeId: nodeId,
          text: selectedText,
          start: start !== -1 ? start : 0,
          end: end,
          contextSentence: contextSentence || selectedText,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            bottom: rect.bottom,
            right: rect.right,
          },
        };

        setActiveSelection(payload);
      }
    } catch {
      // Ignore range extraction error
    }
  }, [allowSelection, content, nodeId, setActiveSelection]);

  return (
    <div
      ref={containerRef}
      onMouseUp={handleMouseUp}
      className={`relative select-text ${className}`}
    >
      <MarkdownRenderer
        content={content}
        anchors={anchors}
      />
    </div>
  );
}
