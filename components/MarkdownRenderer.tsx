"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";
import { Copy, Check, Terminal } from "lucide-react";
import { TextAnchor } from "@/types/graph";
import { useGraph } from "@/context/GraphContext";

interface MarkdownRendererProps {
  content: string;
  anchors?: TextAnchor[];
  className?: string;
}

// Safely extract raw text from nested React element tree for clipboard copying
function extractRawText(node: React.ReactNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractRawText).join("");
  if (React.isValidElement(node) && node.props) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children) {
      return extractRawText(props.children);
    }
  }
  return "";
}

function CodeBlockContainer({
  language,
  rawCode,
  children,
}: {
  language: string;
  rawCode: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(rawCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative my-3.5 rounded-2xl bg-[#141414] border border-[#333333] overflow-hidden text-xs font-mono group shadow-lg">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1e1e1e] border-b border-[#2e2e2e] text-[#8e8e8e]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-300">
            {language || "code"}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md hover:bg-[#2e2e2e] text-zinc-400 hover:text-white transition-colors text-[11px]"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-sans">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3.5 overflow-x-auto text-[#ececec] leading-relaxed scrollbar-thin">
        {children}
      </div>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  anchors = [],
  className = "",
}: MarkdownRendererProps) {
  const { setSelectedNodeId, getNode, getChildren } = useGraph();

  return (
    <div className={`markdown-body select-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // Pre & Code blocks
          pre: ({ children }) => {
            const rawCode = extractRawText(children);
            let language = "code";

            if (React.isValidElement(children)) {
              const childProps = children.props as { className?: string };
              const match = /language-(\w+)/.exec(childProps?.className || "");
              if (match) language = match[1];
            }

            return (
              <CodeBlockContainer language={language} rawCode={rawCode}>
                <pre className="!bg-transparent !p-0 !m-0 !overflow-x-auto text-xs font-mono leading-relaxed">
                  {children}
                </pre>
              </CodeBlockContainer>
            );
          },

          // Inline Code
          code: ({ className, children, ...props }) => {
            const isBlock = className && className.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[#2d2d2d] text-[#f43f5e] font-mono text-[11px] font-medium border border-[#3d3d3d]"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-4 mb-2 pb-1 border-b border-[#333333] tracking-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-bold text-white mt-3.5 mb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-bold text-zinc-100 mt-3 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-semibold text-zinc-200 mt-2 mb-1">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-[#ececec] font-normal text-xs sm:text-sm">
              {children}
            </p>
          ),

          // Bold and Italic
          strong: ({ children }) => (
            <strong className="font-bold text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-300">{children}</em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-xs sm:text-sm text-[#ececec]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1 text-xs sm:text-sm text-[#ececec]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-1">{children}</li>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-3 border-l-4 border-indigo-500 bg-[#262626]/60 rounded-r-xl px-3.5 py-2 italic text-zinc-300 text-xs sm:text-sm shadow-xs">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="my-4 border-[#333333]" />,

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-[#333333]">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#282828] text-white font-semibold border-b border-[#333333]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-[#2e2e2e] bg-[#1e1e1e]">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-[#262626]/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-zinc-200 font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[#ececec]">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Render Attached Anchors Footer if this node has exploration branches */}
      {anchors.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[#333333] flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-semibold text-[#8e8e8e] uppercase tracking-wider flex items-center gap-1">
            <span>📍 Active Anchors:</span>
          </span>
          {anchors.map((anchor) => {
            const targetNode = getNode(anchor.targetNodeId);
            const subKids = targetNode ? getChildren(targetNode.id) : [];
            const count = 1 + subKids.length;

            return (
              <span
                key={anchor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(anchor.targetNodeId);
                }}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] font-medium cursor-pointer hover:bg-indigo-900/80 hover:border-indigo-500 transition-all shadow-xs"
                title={`Click to inspect branch: "${anchor.text}"`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="underline decoration-indigo-400/50 underline-offset-2">
                  {anchor.text}
                </span>
                <span className="text-[9px] bg-indigo-800/80 px-1.5 py-0.2 rounded-full text-white font-mono font-bold">
                  {count}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
