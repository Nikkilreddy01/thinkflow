export type NodeType = "user" | "assistant" | "exploration";

export type QuickActionType =
  | "ask"
  | "explain"
  | "simplify"
  | "translate"
  | "why"
  | "explore"
  | "summarize";

export type AIProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "deepseek"
  | "groq"
  | "xai"
  | "openrouter"
  | "mock";

export interface SavedAPIKey {
  provider: AIProvider;
  keyMasked: string;
  keyEncrypted: string;
  model: string;
  updatedAt: number;
}

export interface AISettings {
  activeProvider: AIProvider;
  keys: Partial<Record<AIProvider, string>>;
  models: Partial<Record<AIProvider, string>>;
  systemPrompt?: string;
}

export interface TextAnchor {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  text: string;
  start: number;
  end: number;
  actionType?: QuickActionType;
  createdAt: number;
}

export interface GraphNode {
  id: string;
  conversationId: string;
  type: NodeType;
  content: string;
  parentId?: string | null;
  isMainPath: boolean;
  mainPathIndex?: number;
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  collapsed: boolean;
  createdAt: number;
  actionType?: QuickActionType;
  promptQuestion?: string;
  anchor?: {
    sourceNodeId: string;
    text: string;
    start: number;
    end: number;
    actionType?: QuickActionType;
  };
  summary?: string;
  metadata?: {
    model?: string;
    contextSentence?: string;
    tags?: string[];
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  anchorText?: string;
  isAnchorEdge: boolean;
}

export interface ConversationRecord {
  id: string;
  title: string;
  rootNodeId: string;
  currentNodeId: string;
  createdAt: number;
  updatedAt: number;
  nodes: GraphNode[];
  anchors: TextAnchor[];
  activeDemoId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  rootNodeId: string;
  currentNodeId: string;
  createdAt: number;
  updatedAt: number;
}

export interface TextSelectionPayload {
  sourceNodeId: string;
  text: string;
  start: number;
  end: number;
  contextSentence: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
  } | null;
}

export interface ContextInheritancePackage {
  isMainPath?: boolean;
  sourceNodeId: string;
  sourceNodeContent: string;
  selectedText: string;
  contextSentence: string;
  parentExplanation?: string;
  rootPrompt?: string;
  userName?: string;
  userAge?: number;
  ancestorChain: Array<{
    id: string;
    type: NodeType;
    textSnippet: string;
    question?: string;
  }>;
  userQuestion: string;
  actionType?: QuickActionType;
}

export type ViewMode = "chat" | "canvas";
