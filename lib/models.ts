import { AIProvider } from "@/types/graph";

export interface ModelInfo {
  id: string;
  name: string;
  tag: string;
  badge?: string;
  description: string;
}

export interface ProviderInfo {
  id: AIProvider;
  name: string;
  shortName: string;
  models: ModelInfo[];
  defaultModel: string;
}

export const PROVIDER_REGISTRY: Record<AIProvider, ProviderInfo> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    shortName: "Google",
    defaultModel: "gemini-3.7-flash",
    models: [
      {
        id: "gemini-3.7-flash",
        name: "Gemini 3.7 Flash",
        tag: "Frontier Hybrid Reasoning",
        badge: "Latest Flagship",
        description: "Google's newest frontier model with hybrid reasoning & lightning speed",
      },
      {
        id: "gemini-3.6-flash",
        name: "Gemini 3.6 Flash",
        tag: "High Speed Intelligence",
        badge: "New",
        description: "Advanced intelligence with sub-second response times",
      },
      {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        tag: "Real-time Multimodal",
        badge: "Recommended",
        description: "Standard fast multimodal production model",
      },
      {
        id: "gemini-2.0-flash-thinking-exp-01-21",
        name: "Gemini 2.0 Flash Thinking",
        tag: "Chain of Thought",
        badge: "Thinking",
        description: "Generates explicit reasoning traces before answering",
      },
      {
        id: "gemini-2.0-pro-exp-02-05",
        name: "Gemini 2.0 Pro",
        tag: "Complex Problem Solving",
        badge: "Pro",
        description: "Frontier code generation and complex logic synthesis",
      },
      {
        id: "gemini-1.5-pro",
        name: "Gemini 1.5 Pro",
        tag: "2M Token Context",
        description: "Massive context window for deep document and codebase analysis",
      },
      {
        id: "gemini-1.5-flash",
        name: "Gemini 1.5 Flash",
        tag: "Lightweight & Reliable",
        description: "High speed for high frequency daily queries",
      },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    shortName: "OpenAI",
    defaultModel: "gpt-4o",
    models: [
      {
        id: "o3-mini",
        name: "o3-mini",
        tag: "High-Efficiency Reasoning",
        badge: "New Reasoning",
        description: "Next-generation STEM, coding, and multi-branch logic engine",
      },
      {
        id: "o1",
        name: "o1 (Full Reasoning)",
        tag: "Frontier Deep Thinking",
        badge: "o1",
        description: "Deep thinking model designed for complex science & algorithm design",
      },
      {
        id: "gpt-4o",
        name: "GPT-4o (Omni)",
        tag: "Flagship Intelligence",
        badge: "Flagship",
        description: "Versatile flagship model with exceptional nuance and reasoning",
      },
      {
        id: "gpt-4o-mini",
        name: "GPT-4o Mini",
        tag: "Fast & Lightweight",
        badge: "Fast",
        description: "Fast, affordable model for rapid everyday question answering",
      },
      {
        id: "gpt-4.5-preview",
        name: "GPT-4.5 Preview",
        tag: "Frontier Scale",
        badge: "Preview",
        description: "Next-generation scale architecture preview",
      },
    ],
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    shortName: "Claude",
    defaultModel: "claude-3-7-sonnet-latest",
    models: [
      {
        id: "claude-3-7-sonnet-latest",
        name: "Claude 3.7 Sonnet",
        tag: "Hybrid Reasoning",
        badge: "Latest SOTA",
        description: "Anthropic's most advanced model with flexible thinking mode",
      },
      {
        id: "claude-3-5-sonnet-latest",
        name: "Claude 3.5 Sonnet",
        tag: "Industry Standard Coding",
        badge: "Top Code",
        description: "Exceptional coding, complex architecture analysis, and writing",
      },
      {
        id: "claude-3-5-haiku-latest",
        name: "Claude 3.5 Haiku",
        tag: "Sub-Second Latency",
        badge: "Fast",
        description: "Near-instant responses with high quality reasoning",
      },
      {
        id: "claude-3-opus-latest",
        name: "Claude 3 Opus",
        tag: "Deep Philosophy & Nuance",
        description: "Complex writing, deep analysis, and long-form synthesis",
      },
    ],
  },
  deepseek: {
    id: "deepseek",
    name: "DeepSeek",
    shortName: "DeepSeek",
    defaultModel: "deepseek-reasoner",
    models: [
      {
        id: "deepseek-reasoner",
        name: "DeepSeek R1 (Reasoner)",
        tag: "Chain of Thought Reasoning",
        badge: "R1 Reasoning",
        description: "Frontier reasoning model with deep self-reflection steps",
      },
      {
        id: "deepseek-chat",
        name: "DeepSeek V3 (Chat)",
        tag: "671B MoE Architecture",
        badge: "V3",
        description: "Massive Mixture-of-Experts general chat model",
      },
    ],
  },
  groq: {
    id: "groq",
    name: "Groq LPU",
    shortName: "Groq",
    defaultModel: "deepseek-r1-distill-llama-70b",
    models: [
      {
        id: "deepseek-r1-distill-llama-70b",
        name: "DeepSeek R1 Distill 70B",
        tag: "Instant Reasoning",
        badge: "Fast R1",
        description: "DeepSeek R1 reasoning running on Groq LPUs at 300+ tok/s",
      },
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        tag: "500+ tokens/sec",
        badge: "Ultra Fast",
        description: "Meta's flagship open model with blazing inference speed",
      },
      {
        id: "qwen-2.5-coder-32b",
        name: "Qwen 2.5 Coder 32B",
        tag: "Polyglot Coding",
        description: "High performance programming and algorithmic solutions",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B Instant",
        tag: "Sub-100ms First Token",
        description: "Instant responses for lightweight chats",
      },
    ],
  },
  xai: {
    id: "xai",
    name: "xAI",
    shortName: "Grok",
    defaultModel: "grok-3",
    models: [
      {
        id: "grok-3",
        name: "Grok 3",
        tag: "Frontier Compute",
        badge: "Latest",
        description: "xAI's flagship frontier reasoning and research engine",
      },
      {
        id: "grok-2-latest",
        name: "Grok 2",
        tag: "Direct & Witty",
        badge: "Grok 2",
        description: "Direct, witty, and accurate conversational model",
      },
      {
        id: "grok-beta",
        name: "Grok Beta",
        tag: "Experimental",
        description: "Experimental preview release",
      },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    shortName: "OpenRouter",
    defaultModel: "anthropic/claude-3.7-sonnet",
    models: [
      {
        id: "anthropic/claude-3.7-sonnet",
        name: "Claude 3.7 Sonnet",
        tag: "Frontier Router",
        badge: "3.7",
        description: "Direct unified routing to Claude 3.7 Sonnet",
      },
      {
        id: "deepseek/deepseek-r1",
        name: "DeepSeek R1",
        tag: "Open Weights SOTA",
        badge: "R1",
        description: "DeepSeek R1 reasoning via OpenRouter",
      },
      {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Free)",
        tag: "Community Tier",
        badge: "Free",
        description: "Free tier community endpoint for Gemini 2.0",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B Instruct",
        tag: "Open Source Flagship",
        description: "Capable open weights for broad knowledge exploration",
      },
    ],
  },
  mock: {
    id: "mock",
    name: "Smart Tutor (Built-in)",
    shortName: "Offline",
    defaultModel: "smart-tutor",
    models: [
      {
        id: "smart-tutor",
        name: "ThinkFlow Smart Tutor",
        tag: "Zero-Config / Offline",
        badge: "Offline",
        description: "Built-in knowledge engine with real-time streaming",
      },
    ],
  },
};
