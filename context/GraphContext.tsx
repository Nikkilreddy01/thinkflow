"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import {
  GraphNode,
  TextAnchor,
  Conversation,
  ConversationRecord,
  TextSelectionPayload,
  QuickActionType,
  ViewMode,
  AISettings,
  AIProvider,
  ContextInheritancePackage,
} from "@/types/graph";
import {
  DEMO_CONVERSATION_SAD_GAANA,
  DEMO_CONVERSATION_RECURSION,
} from "@/lib/demo-data";
import { computeGraphLayout } from "@/lib/layout";
import { buildActionPrompt, generateAIResponse } from "@/lib/ai";

const STORAGE_KEY_SETTINGS = "thinkflow_ai_settings_v2";
const STORAGE_KEY_CONVERSATIONS = "thinkflow_all_conversations_v3";
const STORAGE_KEY_ACTIVE_ID = "thinkflow_active_conv_id_v3";

const DEFAULT_SETTINGS: AISettings = {
  activeProvider: "gemini",
  keys: {},
  models: {
    gemini: "gemini-3.7-flash",
    openai: "gpt-4o",
    anthropic: "claude-3-7-sonnet-latest",
    deepseek: "deepseek-reasoner",
    groq: "deepseek-r1-distill-llama-70b",
    xai: "grok-3",
    openrouter: "anthropic/claude-3.7-sonnet",
    mock: "smart-tutor",
  },
};

function createInitialSandbox(): ConversationRecord {
  const id = `conv-sandbox-${Date.now()}`;
  return {
    id,
    title: "New Chat",
    rootNodeId: "",
    currentNodeId: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes: [],
    anchors: [],
    activeDemoId: "sandbox",
  };
}

interface GraphContextType {
  conversation: Conversation;
  nodes: GraphNode[];
  anchors: TextAnchor[];
  conversations: ConversationRecord[];
  activeConversationId: string;
  isSidebarOpen: boolean;
  viewMode: ViewMode;
  selectedNodeId: string | null;
  focusNodeId: string | null;
  activeSelection: TextSelectionPayload | null;
  searchQuery: string;
  isGenerating: boolean;
  settings: AISettings;
  activeDemoId: string;
  isSettingsOpen: boolean;

  // Navigation & Multi-Chat
  setIsSidebarOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  toggleSidebar: () => void;
  createNewChat: () => void;
  switchConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;

  // Node persistence
  updateNodeDimensions: (nodeId: string, width: number, height: number) => void;
  updateNodesBatch: (updatedNodes: GraphNode[]) => void;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  setSelectedNodeId: (id: string | null) => void;
  setFocusNodeId: (id: string | null) => void;
  setActiveSelection: (payload: TextSelectionPayload | null) => void;
  setSearchQuery: (query: string) => void;
  setIsSettingsOpen: (open: boolean) => void;
  updateSettings: (newSettings: Partial<AISettings>) => void;
  saveProviderKey: (provider: AIProvider, key: string, model?: string) => void;
  deleteProviderKey: (provider: AIProvider) => void;
  setActiveProvider: (provider: AIProvider) => void;
  loadDemo: (demoKey: "sandbox" | "sad-gaana" | "recursion") => void;
  recomputeLayout: () => void;
  clearSandbox: () => void;

  // Branching & Messaging
  sendUserMessage: (text: string) => Promise<void>;
  createAnchoredBranch: (
    payload: TextSelectionPayload,
    actionType?: QuickActionType,
    customQuestion?: string
  ) => Promise<void>;
  createDirectBranch: (
    parentNodeId: string,
    question: string
  ) => Promise<void>;
  toggleCollapseNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  generateBranchSummary: (nodeId: string) => Promise<string>;

  // Graph Traversal Helpers
  getNode: (id: string) => GraphNode | undefined;
  getAncestors: (nodeId: string) => GraphNode[];
  getChildren: (nodeId: string) => GraphNode[];
  getAnchorsForNode: (nodeId: string) => TextAnchor[];
  getMainPathNodes: () => GraphNode[];
}

const GraphContext = createContext<GraphContextType | null>(null);

export function GraphProvider({ children }: { children: React.ReactNode }) {
  // Load saved conversations list from localStorage
  const [conversations, setConversations] = useState<ConversationRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [createInitialSandbox()];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const storedId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
        if (storedId) return storedId;
      } catch {}
    }
    return conversations[0]?.id || `conv-sandbox-${Date.now()}`;
  });

  // Current active conversation state
  const activeRecord = useMemo(() => {
    return (
      conversations.find((c) => c.id === activeConversationId) || conversations[0]
    );
  }, [conversations, activeConversationId]);

  const [conversation, setConversation] = useState<Conversation>(() => ({
    id: activeRecord.id,
    title: activeRecord.title,
    rootNodeId: activeRecord.rootNodeId,
    currentNodeId: activeRecord.currentNodeId,
    createdAt: activeRecord.createdAt,
    updatedAt: activeRecord.updatedAt,
  }));

  const [nodes, setNodes] = useState<GraphNode[]>(() => activeRecord.nodes || []);
  const [anchors, setAnchors] = useState<TextAnchor[]>(
    () => activeRecord.anchors || []
  );
  const [activeDemoId, setActiveDemoId] = useState<string>(
    () => activeRecord.activeDemoId || "sandbox"
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [activeSelection, setActiveSelection] =
    useState<TextSelectionPayload | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<AISettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...DEFAULT_SETTINGS,
            ...parsed,
            keys: { ...DEFAULT_SETTINGS.keys, ...(parsed.keys || {}) },
            models: { ...DEFAULT_SETTINGS.models, ...(parsed.models || {}) },
          };
        }
      } catch {}
    }
    return DEFAULT_SETTINGS;
  });

  // Save conversation changes to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          STORAGE_KEY_CONVERSATIONS,
          JSON.stringify(conversations)
        );
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeConversationId);
      } catch {}
    }
  }, [conversations, activeConversationId]);

  // Helper to update active conversation in conversations list
  const syncActiveConversation = useCallback(
    (newNodes: GraphNode[], newAnchors: TextAnchor[], newTitle?: string) => {
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              title: newTitle || c.title,
              nodes: newNodes,
              anchors: newAnchors,
              updatedAt: Date.now(),
            };
          }
          return c;
        });
      });
    },
    [activeConversationId]
  );

  const updateNodeDimensions = useCallback(
    (nodeId: string, width: number, height: number) => {
      setNodes((prev) => {
        const updated = prev.map((n) =>
          n.id === nodeId ? { ...n, width, height } : n
        );
        syncActiveConversation(updated, anchors);
        return updated;
      });
    },
    [anchors, syncActiveConversation]
  );

  const updateNodesBatch = useCallback(
    (updatedNodes: GraphNode[]) => {
      setNodes(updatedNodes);
      syncActiveConversation(updatedNodes, anchors);
    },
    [anchors, syncActiveConversation]
  );

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Create fresh new chat
  const createNewChat = useCallback(() => {
    const fresh = createInitialSandbox();
    setConversations((prev) => [fresh, ...prev]);
    setActiveConversationId(fresh.id);
    setConversation({
      id: fresh.id,
      title: fresh.title,
      rootNodeId: fresh.rootNodeId,
      currentNodeId: fresh.currentNodeId,
      createdAt: fresh.createdAt,
      updatedAt: fresh.updatedAt,
    });
    setNodes([]);
    setAnchors([]);
    setActiveDemoId("sandbox");
    setSelectedNodeId(null);
    setFocusNodeId(null);
    setActiveSelection(null);
  }, []);

  // Switch conversation from sidebar
  const switchConversation = useCallback(
    (id: string) => {
      const target = conversations.find((c) => c.id === id);
      if (!target) return;

      setActiveConversationId(target.id);
      setConversation({
        id: target.id,
        title: target.title,
        rootNodeId: target.rootNodeId,
        currentNodeId: target.currentNodeId,
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      });
      setNodes(target.nodes || []);
      setAnchors(target.anchors || []);
      setActiveDemoId(target.activeDemoId || "sandbox");
      setSelectedNodeId(null);
      setFocusNodeId(null);
      setActiveSelection(null);
    },
    [conversations]
  );

  // Delete conversation from sidebar
  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        const finalConversations =
          remaining.length > 0 ? remaining : [createInitialSandbox()];

        if (activeConversationId === id) {
          const nextActive = finalConversations[0];
          setActiveConversationId(nextActive.id);
          setConversation({
            id: nextActive.id,
            title: nextActive.title,
            rootNodeId: nextActive.rootNodeId,
            currentNodeId: nextActive.currentNodeId,
            createdAt: nextActive.createdAt,
            updatedAt: nextActive.updatedAt,
          });
          setNodes(nextActive.nodes || []);
          setAnchors(nextActive.anchors || []);
          setActiveDemoId(nextActive.activeDemoId || "sandbox");
        }

        return finalConversations;
      });
    },
    [activeConversationId]
  );

  // Rename conversation
  const renameConversation = useCallback(
    (id: string, newTitle: string) => {
      if (!newTitle.trim()) return;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim() } : c))
      );
      if (conversation.id === id) {
        setConversation((prev) => ({ ...prev, title: newTitle.trim() }));
      }
    },
    [conversation.id]
  );

  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const saveProviderKey = useCallback(
    (provider: AIProvider, key: string, model?: string) => {
      setSettings((prev) => {
        const updatedKeys = { ...prev.keys };
        if (key && key.trim()) {
          updatedKeys[provider] = key.trim();
        }
        const updatedModels = { ...prev.models };
        if (model && model.trim()) {
          updatedModels[provider] = model.trim();
        }
        const updated: AISettings = {
          ...prev,
          activeProvider: provider,
          keys: updatedKeys,
          models: updatedModels,
        };
        try {
          localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    },
    []
  );

  const deleteProviderKey = useCallback((provider: AIProvider) => {
    setSettings((prev) => {
      const updatedKeys = { ...prev.keys };
      delete updatedKeys[provider];
      const updated: AISettings = {
        ...prev,
        activeProvider:
          prev.activeProvider === provider ? "gemini" : prev.activeProvider,
        keys: updatedKeys,
      };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const setActiveProvider = useCallback((provider: AIProvider) => {
    setSettings((prev) => {
      const updated = { ...prev, activeProvider: provider };
      try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Helpers
  const getNode = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  const getAncestors = useCallback(
    (nodeId: string): GraphNode[] => {
      const chain: GraphNode[] = [];
      let curr = getNode(nodeId);
      while (curr && curr.parentId) {
        const parent = getNode(curr.parentId);
        if (parent) {
          chain.unshift(parent);
          curr = parent;
        } else {
          break;
        }
      }
      return chain;
    },
    [getNode]
  );

  const getChildren = useCallback(
    (nodeId: string): GraphNode[] => {
      return nodes.filter((n) => n.parentId === nodeId);
    },
    [nodes]
  );

  const getAnchorsForNode = useCallback(
    (nodeId: string): TextAnchor[] => {
      return anchors.filter((a) => a.sourceNodeId === nodeId);
    },
    [anchors]
  );

  const getMainPathNodes = useCallback((): GraphNode[] => {
    return nodes
      .filter((n) => n.isMainPath)
      .sort((a, b) => (a.mainPathIndex ?? 0) - (b.mainPathIndex ?? 0));
  }, [nodes]);

  // Recompute Layout
  const recomputeLayout = useCallback(() => {
    setNodes((prevNodes) => {
      const { nodes: layouted } = computeGraphLayout(prevNodes, anchors);
      syncActiveConversation(layouted, anchors);
      return layouted;
    });
  }, [anchors, syncActiveConversation]);

  // Load Preset Demos or Clear to Sandbox
  const loadDemo = useCallback(
    (demoKey: "sandbox" | "sad-gaana" | "recursion") => {
      setActiveSelection(null);
      setSelectedNodeId(null);
      setFocusNodeId(null);
      setSearchQuery("");

      if (demoKey === "sad-gaana") {
        const demoConv: ConversationRecord = {
          id: DEMO_CONVERSATION_SAD_GAANA.conversation.id,
          title: "🎵 Sad Gaana — Hindi Lyrics",
          rootNodeId: DEMO_CONVERSATION_SAD_GAANA.conversation.rootNodeId,
          currentNodeId: DEMO_CONVERSATION_SAD_GAANA.conversation.currentNodeId,
          createdAt: DEMO_CONVERSATION_SAD_GAANA.conversation.createdAt,
          updatedAt: Date.now(),
          nodes: DEMO_CONVERSATION_SAD_GAANA.nodes,
          anchors: DEMO_CONVERSATION_SAD_GAANA.anchors,
          activeDemoId: "sad-gaana",
        };
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== demoConv.id);
          return [demoConv, ...filtered];
        });
        setActiveConversationId(demoConv.id);
        setConversation({
          id: demoConv.id,
          title: demoConv.title,
          rootNodeId: demoConv.rootNodeId,
          currentNodeId: demoConv.currentNodeId,
          createdAt: demoConv.createdAt,
          updatedAt: demoConv.updatedAt,
        });
        setNodes(DEMO_CONVERSATION_SAD_GAANA.nodes);
        setAnchors(DEMO_CONVERSATION_SAD_GAANA.anchors);
        setActiveDemoId("sad-gaana");
      } else if (demoKey === "recursion") {
        const recConv: ConversationRecord = {
          id: DEMO_CONVERSATION_RECURSION.conversation.id,
          title: "🧠 Recursion & Call Stacks",
          rootNodeId: DEMO_CONVERSATION_RECURSION.conversation.rootNodeId,
          currentNodeId: DEMO_CONVERSATION_RECURSION.conversation.currentNodeId,
          createdAt: DEMO_CONVERSATION_RECURSION.conversation.createdAt,
          updatedAt: Date.now(),
          nodes: DEMO_CONVERSATION_RECURSION.nodes,
          anchors: DEMO_CONVERSATION_RECURSION.anchors,
          activeDemoId: "recursion",
        };
        setConversations((prev) => {
          const filtered = prev.filter((c) => c.id !== recConv.id);
          return [recConv, ...filtered];
        });
        setActiveConversationId(recConv.id);
        setConversation({
          id: recConv.id,
          title: recConv.title,
          rootNodeId: recConv.rootNodeId,
          currentNodeId: recConv.currentNodeId,
          createdAt: recConv.createdAt,
          updatedAt: recConv.updatedAt,
        });
        setNodes(DEMO_CONVERSATION_RECURSION.nodes);
        setAnchors(DEMO_CONVERSATION_RECURSION.anchors);
        setActiveDemoId("recursion");
      } else {
        createNewChat();
      }
    },
    [createNewChat]
  );

  const clearSandbox = useCallback(() => {
    createNewChat();
  }, [createNewChat]);

  // Send Main Path User Message
  const sendUserMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isGenerating) return;

      const mainNodes = getMainPathNodes();
      const lastMainNode = mainNodes[mainNodes.length - 1];
      const nextIndex = mainNodes.length;

      let newTitle = conversation.title;
      // Auto-title conversation on first message if currently "New Chat"
      if (mainNodes.length === 0 && conversation.title === "New Chat") {
        newTitle = text.slice(0, 36) + (text.length > 36 ? "..." : "");
        setConversation((prev) => ({ ...prev, title: newTitle }));
      }

      const userNodeId = `node-user-${Date.now()}`;
      const userNode: GraphNode = {
        id: userNodeId,
        conversationId: conversation.id,
        type: "user",
        content: text,
        parentId: lastMainNode ? lastMainNode.id : null,
        isMainPath: true,
        mainPathIndex: nextIndex,
        position: {
          x: 60,
          y: lastMainNode ? lastMainNode.position.y + 240 : 60,
        },
        collapsed: false,
        createdAt: Date.now(),
      };

      const aiNodeId = `node-ai-${Date.now() + 1}`;
      const placeholderAiNode: GraphNode = {
        id: aiNodeId,
        conversationId: conversation.id,
        type: "assistant",
        content: "Thinking...",
        parentId: userNodeId,
        isMainPath: true,
        mainPathIndex: nextIndex + 1,
        position: {
          x: 60,
          y: userNode.position.y + 200,
        },
        collapsed: false,
        createdAt: Date.now() + 1,
      };

      const nextNodes = [...nodes, userNode, placeholderAiNode];
      setNodes(nextNodes);
      syncActiveConversation(nextNodes, anchors, newTitle);
      setSelectedNodeId(aiNodeId);
      setIsGenerating(true);

      // Context construction
      const pkg: ContextInheritancePackage = {
        isMainPath: true,
        sourceNodeId: userNodeId,
        sourceNodeContent: text,
        selectedText: text,
        contextSentence: text,
        ancestorChain: mainNodes.map((n) => ({
          id: n.id,
          type: n.type,
          textSnippet: n.content.slice(0, 80),
        })),
        userQuestion: text,
        actionType: "explore",
      };

      try {
        await generateAIResponse(pkg, settings, (chunk) => {
          setNodes((prev) => {
            const updated = prev.map((n) =>
              n.id === aiNodeId ? { ...n, content: chunk } : n
            );
            syncActiveConversation(updated, anchors, newTitle);
            return updated;
          });
        });
      } catch (err) {
        console.error("AI Generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      conversation.id,
      conversation.title,
      getMainPathNodes,
      nodes,
      anchors,
      isGenerating,
      settings,
      syncActiveConversation,
    ]
  );

  // Create Anchored Branch
  const createAnchoredBranch = useCallback(
    async (
      payload: TextSelectionPayload,
      actionType?: QuickActionType,
      customQuestion?: string
    ) => {
      if (isGenerating) return;

      const sourceNode = getNode(payload.sourceNodeId);
      if (!sourceNode) return;

      const promptQuestion = buildActionPrompt(
        actionType,
        payload.text,
        customQuestion
      );
      const explorationNodeId = `node-exp-${Date.now()}`;
      const anchorId = `anchor-${Date.now()}`;

      // Calculate initial position: to the right of sourceNode
      const siblings = getChildren(sourceNode.id).filter((n) => !n.isMainPath);
      const branchIndex = siblings.length;
      const targetX = sourceNode.position.x + 480;
      const targetY = sourceNode.position.y + branchIndex * 280;

      const newAnchor: TextAnchor = {
        id: anchorId,
        sourceNodeId: sourceNode.id,
        targetNodeId: explorationNodeId,
        text: payload.text,
        start: payload.start,
        end: payload.end,
        actionType: actionType || "explain",
        createdAt: Date.now(),
      };

      const newExplorationNode: GraphNode = {
        id: explorationNodeId,
        conversationId: conversation.id,
        type: "exploration",
        promptQuestion: promptQuestion,
        actionType: actionType || "explain",
        content: "Exploring context...",
        parentId: sourceNode.id,
        isMainPath: false,
        position: { x: targetX, y: targetY },
        collapsed: false,
        createdAt: Date.now(),
        anchor: {
          sourceNodeId: sourceNode.id,
          text: payload.text,
          start: payload.start,
          end: payload.end,
          actionType: actionType || "explain",
        },
        metadata: {
          contextSentence: payload.contextSentence,
        },
      };

      const updatedAnchors = [...anchors, newAnchor];
      const updatedNodes = [...nodes, newExplorationNode];
      setAnchors(updatedAnchors);
      setNodes(updatedNodes);
      syncActiveConversation(updatedNodes, updatedAnchors);
      setSelectedNodeId(explorationNodeId);
      setActiveSelection(null);
      setIsGenerating(true);

      // Context Inheritance Packaging
      const ancestors = getAncestors(sourceNode.id);
      const pkg: ContextInheritancePackage = {
        isMainPath: false,
        sourceNodeId: sourceNode.id,
        sourceNodeContent: sourceNode.content,
        selectedText: payload.text,
        contextSentence: payload.contextSentence,
        parentExplanation: sourceNode.content,
        ancestorChain: ancestors.map((a) => ({
          id: a.id,
          type: a.type,
          textSnippet: a.content.slice(0, 100),
          question: a.promptQuestion,
        })),
        userQuestion: promptQuestion,
        actionType: actionType || "explain",
      };

      try {
        await generateAIResponse(pkg, settings, (chunk) => {
          setNodes((prev) => {
            const updated = prev.map((n) =>
              n.id === explorationNodeId ? { ...n, content: chunk } : n
            );
            syncActiveConversation(updated, updatedAnchors);
            return updated;
          });
        });
      } catch (err) {
        console.error("Exploration generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      conversation.id,
      getAncestors,
      getChildren,
      getNode,
      nodes,
      anchors,
      isGenerating,
      settings,
      syncActiveConversation,
    ]
  );

  // Create Direct Branch without text highlight
  const createDirectBranch = useCallback(
    async (parentNodeId: string, question: string) => {
      const parentNode = getNode(parentNodeId);
      if (!parentNode || !question.trim()) return;

      const explorationNodeId = `node-exp-${Date.now()}`;
      const siblings = getChildren(parentNode.id).filter((n) => !n.isMainPath);
      const targetX = parentNode.position.x + 480;
      const targetY = parentNode.position.y + siblings.length * 280;

      const newExplorationNode: GraphNode = {
        id: explorationNodeId,
        conversationId: conversation.id,
        type: "exploration",
        promptQuestion: question,
        actionType: "ask",
        content: "Investigating query...",
        parentId: parentNode.id,
        isMainPath: false,
        position: { x: targetX, y: targetY },
        collapsed: false,
        createdAt: Date.now(),
      };

      const updatedNodes = [...nodes, newExplorationNode];
      setNodes(updatedNodes);
      syncActiveConversation(updatedNodes, anchors);
      setSelectedNodeId(explorationNodeId);
      setIsGenerating(true);

      const ancestors = getAncestors(parentNode.id);
      const pkg: ContextInheritancePackage = {
        isMainPath: false,
        sourceNodeId: parentNode.id,
        sourceNodeContent: parentNode.content,
        selectedText: question,
        contextSentence: parentNode.content.slice(0, 120),
        parentExplanation: parentNode.content,
        ancestorChain: ancestors.map((a) => ({
          id: a.id,
          type: a.type,
          textSnippet: a.content.slice(0, 100),
          question: a.promptQuestion,
        })),
        userQuestion: question,
        actionType: "ask",
      };

      try {
        await generateAIResponse(pkg, settings, (chunk) => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === explorationNodeId ? { ...n, content: chunk } : n
            )
          );
        });
      } catch (err) {
        console.error("Direct branch generation error:", err);
      } finally {
        setIsGenerating(false);
      }
    },
    [
      conversation.id,
      getAncestors,
      getChildren,
      getNode,
      nodes,
      anchors,
      settings,
      syncActiveConversation,
    ]
  );

  // Toggle Collapse
  const toggleCollapseNode = useCallback((nodeId: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, collapsed: !n.collapsed } : n))
    );
  }, []);

  // Delete Node
  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => {
        // Find all descendants recursively
        const toDelete = new Set<string>([nodeId]);
        let changed = true;
        while (changed) {
          changed = false;
          prev.forEach((n) => {
            if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
              toDelete.add(n.id);
              changed = true;
            }
          });
        }
        const remaining = prev.filter((n) => !toDelete.has(n.id));
        setAnchors((prevAnchors) => {
          const remAnchors = prevAnchors.filter(
            (a) => a.sourceNodeId !== nodeId && a.targetNodeId !== nodeId
          );
          syncActiveConversation(remaining, remAnchors);
          return remAnchors;
        });
        return remaining;
      });

      setSelectedNodeId(null);
    },
    [syncActiveConversation]
  );

  // Generate Branch Summary
  const generateBranchSummary = useCallback(
    async (nodeId: string): Promise<string> => {
      const node = getNode(nodeId);
      if (!node) return "";
      const children = getChildren(nodeId);

      const summary = `### Summary for "${
        node.anchor?.text || node.promptQuestion || "Branch"
      }"\n\n• **Core Insight:** ${node.content.slice(0, 120)}...\n• **Explorations Explored:** ${
        children.length
      } connected sub-topics.\n• **Status:** Fully mapped and indexed into knowledge graph.`;

      setNodes((prev) => {
        const updated = prev.map((n) =>
          n.id === nodeId ? { ...n, summary } : n
        );
        syncActiveConversation(updated, anchors);
        return updated;
      });
      return summary;
    },
    [anchors, getChildren, getNode, syncActiveConversation]
  );

  const value = useMemo(
    () => ({
      conversation,
      nodes,
      anchors,
      conversations,
      activeConversationId,
      isSidebarOpen,
      viewMode,
      selectedNodeId,
      focusNodeId,
      activeSelection,
      searchQuery,
      isGenerating,
      settings,
      activeDemoId,
      isSettingsOpen,
      setIsSidebarOpen,
      toggleSidebar,
      createNewChat,
      switchConversation,
      deleteConversation,
      renameConversation,
      updateNodeDimensions,
      updateNodesBatch,
      setViewMode,
      setSelectedNodeId,
      setFocusNodeId,
      setActiveSelection,
      setSearchQuery,
      setIsSettingsOpen,
      updateSettings,
      saveProviderKey,
      deleteProviderKey,
      setActiveProvider,
      loadDemo,
      clearSandbox,
      recomputeLayout,
      sendUserMessage,
      createAnchoredBranch,
      createDirectBranch,
      toggleCollapseNode,
      deleteNode,
      generateBranchSummary,
      getNode,
      getAncestors,
      getChildren,
      getAnchorsForNode,
      getMainPathNodes,
    }),
    [
      conversation,
      nodes,
      anchors,
      conversations,
      activeConversationId,
      isSidebarOpen,
      viewMode,
      selectedNodeId,
      focusNodeId,
      activeSelection,
      searchQuery,
      isGenerating,
      settings,
      activeDemoId,
      isSettingsOpen,
      toggleSidebar,
      createNewChat,
      switchConversation,
      deleteConversation,
      renameConversation,
      updateNodeDimensions,
      updateNodesBatch,
      updateSettings,
      saveProviderKey,
      deleteProviderKey,
      setActiveProvider,
      loadDemo,
      clearSandbox,
      recomputeLayout,
      sendUserMessage,
      createAnchoredBranch,
      createDirectBranch,
      toggleCollapseNode,
      deleteNode,
      generateBranchSummary,
      getNode,
      getAncestors,
      getChildren,
      getAnchorsForNode,
      getMainPathNodes,
    ]
  );

  return (
    <GraphContext.Provider value={value}>{children}</GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error("useGraph must be used within a GraphProvider");
  }
  return context;
}
