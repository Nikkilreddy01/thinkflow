"use client";

import React, { useMemo, useCallback, useEffect, useState, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useGraph } from "@/context/GraphContext";
import { UserNode } from "./UserNode";
import { AssistantNode } from "./AssistantNode";
import { ExplorationNode } from "./ExplorationNode";
import { AnchorEdge } from "./AnchorEdge";
import { PROVIDER_REGISTRY } from "@/lib/models";
import {
  LayoutDashboard,
  Maximize2,
  ArrowUp,
  Plus,
  Globe,
  Type,
  Mic,
  ChevronDown,
  Check,
  FileText,
  X,
  FileCode,
  Image as ImageIcon,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  contentSnippet?: string;
}

const nodeTypes = {
  user: UserNode,
  assistant: AssistantNode,
  exploration: ExplorationNode,
};

const edgeTypes = {
  anchorEdge: AnchorEdge,
};

function CanvasFlowInner() {
  const {
    nodes: graphNodes,
    anchors,
    selectedNodeId,
    setSelectedNodeId,
    recomputeLayout,
    searchQuery,
    sendUserMessage,
    isGenerating,
    settings,
    saveProviderKey,
    setIsSettingsOpen,
    updateNodesBatch,
  } = useGraph();

  const { fitView } = useReactFlow();

  // Floating Chat Bar State inside Canvas View
  const [inputMessage, setInputMessage] = useState("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(e.target as unknown as HTMLElement)
      ) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newUploaded: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.round(file.size / 1024)} KB`;

      let snippet = "";
      if (
        file.type.startsWith("text/") ||
        file.name.match(/\.(txt|md|json|ts|tsx|js|jsx|py|html|css|csv)$/i)
      ) {
        try {
          const text = await file.text();
          snippet = text.slice(0, 3000);
        } catch {}
      }

      newUploaded.push({
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        size: sizeStr,
        type: file.type,
        contentSnippet: snippet,
      });
    }

    setUploadedFiles((prev) => [...prev, ...newUploaded]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedFiles.length === 0) || isGenerating)
      return;

    let fullPrompt = inputMessage;
    if (uploadedFiles.length > 0) {
      const fileDetails = uploadedFiles
        .map((f) => {
          let str = `[Attached File: ${f.name} (${f.size})]`;
          if (f.contentSnippet) {
            str += `\n\`\`\`\n${f.contentSnippet}\n\`\`\``;
          }
          return str;
        })
        .join("\n\n");

      fullPrompt = `${fileDetails}\n\n${inputMessage || "Analyze the attached file(s)."}`;
    }

    setInputMessage("");
    setUploadedFiles([]);
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    await sendUserMessage(fullPrompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Provider and Model Information
  const currentProviderInfo =
    PROVIDER_REGISTRY[settings.activeProvider] || PROVIDER_REGISTRY.gemini;

  const currentKey = settings.keys?.[settings.activeProvider];

  const currentModelId =
    settings.models?.[settings.activeProvider] ||
    currentProviderInfo.defaultModel;

  const activeModelMeta =
    currentProviderInfo.models.find((m) => m.id === currentModelId) ||
    currentProviderInfo.models[0];

  const handleSelectModel = (modelId: string) => {
    saveProviderKey(
      settings.activeProvider,
      settings.keys?.[settings.activeProvider] || "",
      modelId
    );
    setIsModelDropdownOpen(false);
  };

  // Determine hidden nodes based on collapsed parent branches
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();
    const collapsedNodes = graphNodes.filter((n) => n.collapsed);

    collapsedNodes.forEach((parent) => {
      const queue = [parent.id];
      while (queue.length > 0) {
        const currId = queue.shift()!;
        graphNodes.forEach((n) => {
          if (n.parentId === currId && !n.isMainPath) {
            hidden.add(n.id);
            queue.push(n.id);
          }
        });
      }
    });

    return hidden;
  }, [graphNodes]);

  // Convert graphNodes to ReactFlow nodes preserving custom width/height
  const flowNodes: Node[] = useMemo(() => {
    return graphNodes
      .filter((n) => !hiddenNodeIds.has(n.id))
      .map((n) => {
        const matchesSearch =
          searchQuery.trim().length > 0 &&
          (n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.anchor?.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
            n.promptQuestion?.toLowerCase().includes(searchQuery.toLowerCase()));

        return {
          id: n.id,
          type: n.type,
          position: n.position,
          width: n.width,
          height: n.height,
          style: {
            width: n.width ? `${n.width}px` : undefined,
            height: n.height ? `${n.height}px` : undefined,
          },
          data: {
            ...n,
            matchesSearch,
          },
          selected: selectedNodeId === n.id,
        };
      });
  }, [graphNodes, hiddenNodeIds, searchQuery, selectedNodeId]);

  // Convert graph edges to ReactFlow edges
  const flowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const visibleNodeIds = new Set(flowNodes.map((n) => n.id));

    // Linear Main Path Edges
    const mainNodes = graphNodes
      .filter((n) => n.isMainPath && visibleNodeIds.has(n.id))
      .sort((a, b) => (a.mainPathIndex ?? 0) - (b.mainPathIndex ?? 0));

    for (let i = 0; i < mainNodes.length - 1; i++) {
      edges.push({
        id: `flow-main-${mainNodes[i].id}-${mainNodes[i + 1].id}`,
        source: mainNodes[i].id,
        target: mainNodes[i + 1].id,
        animated: true,
        style: { stroke: "#10b981", strokeWidth: 2.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      });
    }

    // Anchor & Branch Edges
    anchors.forEach((a) => {
      if (visibleNodeIds.has(a.sourceNodeId) && visibleNodeIds.has(a.targetNodeId)) {
        edges.push({
          id: `flow-anchor-${a.id}`,
          source: a.sourceNodeId,
          target: a.targetNodeId,
          type: "anchorEdge",
          data: {
            anchorText: a.text,
            targetNodeId: a.targetNodeId,
            isAnchorEdge: true,
          },
          label: a.text,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#06b6d4",
          },
        });
      }
    });

    // Other non-anchor branches
    graphNodes.forEach((n) => {
      if (
        n.parentId &&
        !n.isMainPath &&
        visibleNodeIds.has(n.id) &&
        visibleNodeIds.has(n.parentId)
      ) {
        const hasAnchor = anchors.some(
          (a) => a.sourceNodeId === n.parentId && a.targetNodeId === n.id
        );
        if (!hasAnchor) {
          edges.push({
            id: `flow-branch-${n.parentId}-${n.id}`,
            source: n.parentId,
            target: n.id,
            type: "anchorEdge",
            data: {
              anchorText: n.promptQuestion || "Branch",
              targetNodeId: n.id,
              isAnchorEdge: false,
            },
            label: n.promptQuestion?.slice(0, 20) || "Branch",
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#818cf8",
            },
          });
        }
      }
    });

    return edges;
  }, [anchors, flowNodes, graphNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  // Persist drag position on drag stop (eliminates real-time state lag)
  const handleNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      const updatedGraphNodes = graphNodes.map((gn) =>
        gn.id === node.id ? { ...gn, position: node.position } : gn
      );
      updateNodesBatch(updatedGraphNodes);
    },
    [graphNodes, updateNodesBatch]
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="relative w-full h-full bg-[#181818] overflow-hidden select-none font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStop={handleNodeDragStop}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={true}
        nodesConnectable={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={false}
        fitView
        minZoom={0.15}
        maxZoom={2.5}
        defaultEdgeOptions={{
          animated: true,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#333333"
        />

        <Controls
          showInteractive={false}
          className="!bg-[#212121] !border !border-[#333333] !rounded-xl !shadow-xl !fill-white"
        />

        <MiniMap
          nodeColor={(n) => {
            if (n.type === "user") return "#10b981";
            if (n.type === "assistant") return "#6366f1";
            return "#06b6d4";
          }}
          className="!bg-[#212121]/90 !border !border-[#333333] !rounded-2xl !overflow-hidden"
          maskColor="rgba(0, 0, 0, 0.7)"
        />

        {/* Floating Top-Left Canvas Controls */}
        <Panel position="top-left" className="m-3 sm:m-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              recomputeLayout();
              setTimeout(() => fitView({ duration: 500 }), 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] text-zinc-200 text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Auto Layout</span>
          </button>

          <button
            type="button"
            onClick={() => fitView({ duration: 500 })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#212121] hover:bg-[#2a2a2a] border border-[#333333] text-zinc-200 text-xs font-semibold shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Center View</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#212121]/90 border border-[#333333] text-[11px] text-zinc-400 backdrop-blur-md">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Main
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Anchors ({anchors.length})
            </span>
          </div>
        </Panel>
      </ReactFlow>

      {/* Floating Interactive Bottom Chat Capsule inside Canvas View */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-4xl xl:max-w-5xl px-4 z-40">
        {/* Attached Files Bar */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 p-2 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-xl">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#282828] border border-[#3d3d3d] text-xs text-white"
              >
                {file.name.match(/\.(png|jpg|jpeg|webp|gif)$/i) ? (
                  <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                ) : file.name.match(/\.(ts|tsx|js|jsx|py|json|html)$/i) ? (
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span className="truncate max-w-[140px] font-medium">
                  {file.name}
                </span>
                <span className="text-[10px] text-[#8e8e8e] font-mono">
                  {file.size}
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-0.5 hover:text-red-400 rounded transition-colors"
                  title="Remove file"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-3xl bg-[#282828]/95 border border-[#383838] shadow-2xl p-3 flex flex-col gap-2 backdrop-blur-xl transition-all focus-within:border-[#555555]">
          {/* Text Input */}
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => {
              setInputMessage(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(180, e.target.scrollHeight)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything on the canvas..."
            rows={1}
            disabled={isGenerating}
            className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder-[#8e8e8e] focus:outline-none resize-none max-h-40 scrollbar-none font-sans"
          />

          {/* Bottom Controls Row */}
          <div className="flex items-center justify-between pt-1 relative">
            {/* Left Action Buttons & Model Picker */}
            <div className="flex items-center gap-1 text-[#b4b4b4]">
              {/* + Finder Upload */}
              <button
                type="button"
                onClick={handleFileClick}
                className="p-1.5 rounded-full hover:bg-[#383838] hover:text-white transition-colors"
                title="Upload File (Open Finder)"
              >
                <Plus className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsWebSearchActive(!isWebSearchActive)}
                className={`p-1.5 rounded-full transition-colors ${
                  isWebSearchActive
                    ? "bg-indigo-600/80 text-white"
                    : "hover:bg-[#383838] hover:text-white"
                }`}
                title="Web Search"
              >
                <Globe className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="p-1.5 rounded-full hover:bg-[#383838] hover:text-white transition-colors"
                title="Formatting & Settings"
              >
                <Type className="w-4 h-4" />
              </button>

              {/* In-Canvas Dynamic Model Picker */}
              <div className="relative ml-1" ref={modelDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#383838] hover:bg-[#444444] text-xs font-medium text-[#ececec] transition-colors border border-transparent hover:border-[#555555]"
                  title="Select Model"
                >
                  <span className="font-semibold">{activeModelMeta.name}</span>
                  <span className="text-[10px] text-[#8e8e8e] font-mono">
                    ({currentKey?.startsWith("ya29.") ? "OAuth" : currentKey ? "API" : "Offline"})
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8e8e8e]" />
                </button>

                {/* Model Popup */}
                {isModelDropdownOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl bg-[#1e1e1e] border border-[#333333] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100 font-sans">
                    <div className="px-2 py-1 text-[10px] font-semibold text-[#8e8e8e] uppercase flex items-center justify-between">
                      <span>{currentProviderInfo.name} Models</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsModelDropdownOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="text-indigo-400 hover:underline lowercase text-[10px]"
                      >
                        settings
                      </button>
                    </div>

                    <div className="space-y-1 mt-1 max-h-64 overflow-y-auto scrollbar-thin">
                      {currentProviderInfo.models.map((m) => {
                        const isSelected = m.id === currentModelId;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleSelectModel(m.id)}
                            className={`w-full flex items-start justify-between p-2 rounded-xl text-xs text-left transition-colors ${
                              isSelected
                                ? "bg-[#2e2e2e] text-white font-medium border border-indigo-500/30"
                                : "text-[#b4b4b4] hover:bg-[#282828] hover:text-white"
                            }`}
                          >
                            <div className="space-y-0.5 max-w-[85%]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-white">
                                  {m.name}
                                </span>
                                {m.badge && (
                                  <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-1.5 py-0.2 rounded font-mono">
                                    {m.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#8e8e8e] leading-tight">
                                {m.description}
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-[#383838] text-[#b4b4b4] hover:text-white transition-colors"
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={
                  (!inputMessage.trim() && uploadedFiles.length === 0) ||
                  isGenerating
                }
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  (inputMessage.trim() || uploadedFiles.length > 0) &&
                  !isGenerating
                    ? "bg-white text-black hover:bg-[#e0e0e0] shadow-sm active:scale-95"
                    : "bg-[#424242] text-[#8e8e8e] cursor-not-allowed"
                }`}
                title="Send on Canvas"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CanvasView() {
  return (
    <ReactFlowProvider>
      <CanvasFlowInner />
    </ReactFlowProvider>
  );
}
