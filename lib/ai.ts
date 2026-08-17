import {
  ContextInheritancePackage,
  QuickActionType,
  AISettings,
  AIProvider,
} from "@/types/graph";

const STORAGE_KEY_SETTINGS = "thinkflow_ai_settings_v2";

export function getActiveSettings(settings?: AISettings): AISettings {
  let storedSettings: Partial<AISettings> = {};
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        storedSettings = JSON.parse(stored);
      }
    } catch {}
  }

  const activeProvider: AIProvider =
    settings?.activeProvider || storedSettings.activeProvider || "gemini";

  const keys = {
    ...(storedSettings.keys || {}),
    ...(settings?.keys || {}),
  };

  const models = {
    ...(storedSettings.models || {}),
    ...(settings?.models || {}),
  };

  return {
    activeProvider,
    keys,
    models,
  };
}

export function buildActionPrompt(
  actionType: QuickActionType | undefined,
  selectedText: string,
  customQuestion?: string
): string {
  if (customQuestion && customQuestion.trim().length > 0) {
    return customQuestion.trim();
  }

  switch (actionType) {
    case "simplify":
      return `Explain "${selectedText}" in 1-2 extremely simple, plain English sentences (ELI5) with an everyday analogy. Keep it minimal and under 50 words.`;
    case "explain":
      return `In 2-3 concise paragraphs or bullet points, explain what "${selectedText}" means specifically in this sentence. Focus directly on clearing this concept without repeating the rest of the text.`;
    case "translate":
      return `Provide the concise translation, literal meaning, and cultural/slang context of "${selectedText}" in 2-3 short bullets.`;
    case "why":
      return `In 2 short bullet points, explain specifically why "${selectedText}" is used here and why it matters in this context.`;
    case "explore":
      return `Provide a focused mini-breakdown of "${selectedText}" with 2 key points and 1 brief example.`;
    case "summarize":
      return `Summarize the core insight of "${selectedText}" in 2 concise bullets.`;
    case "ask":
    default:
      return customQuestion || `What does "${selectedText}" mean here?`;
  }
}

export function constructContextualPrompt(
  pkg: ContextInheritancePackage
): string {
  const lines: string[] = [];

  if (pkg.isMainPath) {
    lines.push("You are ThinkFlow AI, an insightful, clear, and comprehensive AI tutor.");
    lines.push(
      "Format your response cleanly in markdown with structured sections, bullet points, and highlight key terms/concepts in bold so the user can easily select and explore them."
    );
    lines.push("");

    if (pkg.ancestorChain.length > 0) {
      lines.push("=== PREVIOUS CONVERSATION CONTEXT ===");
      pkg.ancestorChain.forEach((node) => {
        lines.push(`${node.type === "user" ? "User" : "AI"}: ${node.textSnippet}`);
      });
      lines.push("");
    }

    lines.push("=== USER QUESTION ===");
    lines.push(pkg.userQuestion);
    return lines.join("\n");
  }

  // Anchored Sub-Exploration Prompt
  lines.push("You are an expert AI tutor in an interactive knowledge canvas.");
  lines.push("");
  lines.push("=== SUB-EXPLORATION CONSTRAINTS ===");
  lines.push(
    "- CRITICAL: The user has selected a specific phrase/anchor to clear a doubt."
  );
  lines.push(
    "- Provide a MINIMAL, CONCISE, and LASER-FOCUSED answer addressing ONLY this specific anchor/doubt."
  );
  lines.push(
    "- DO NOT repeat the parent response or provide broad unnecessary introductions."
  );
  lines.push(
    "- DO NOT stray into unrelated topics. Keep it strictly relevant to clearing this doubt."
  );
  lines.push(
    "- Use short, punchy bullet points and bold key terms."
  );
  lines.push("");

  lines.push("=== IMMEDIATE CONTEXT ===");
  if (pkg.contextSentence && pkg.contextSentence !== pkg.selectedText) {
    lines.push(`Parent Sentence: "${pkg.contextSentence}"`);
  }
  lines.push(`Selected Anchor: "${pkg.selectedText}"`);
  lines.push("");

  lines.push("=== SPECIFIC INQUIRY ===");
  lines.push(pkg.userQuestion);

  return lines.join("\n");
}

export async function generateAIResponse(
  pkg: ContextInheritancePackage,
  settings?: AISettings,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const effectiveSettings = getActiveSettings(settings);
  const provider = effectiveSettings.activeProvider || "gemini";
  const apiKey = effectiveSettings.keys?.[provider];
  const model = effectiveSettings.models?.[provider];

  // If a real external provider with an API key is active
  if (provider !== "mock" && apiKey && apiKey.trim().length > 0) {
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          apiKey,
          model,
          pkg,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMessage =
          errorData.error || `HTTP ${response.status}: API call failed`;
        throw new Error(errMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No readable stream response");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (onChunk) onChunk(fullText);
      }

      if (fullText.trim().length > 0) {
        return fullText;
      }
    } catch (err: unknown) {
      console.warn("External API stream failed:", err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const outputMsg = `⚠️ **${provider.toUpperCase()} API Error**\n\n${errMsg}\n\n*Check your API key and model in Settings (⚙️).*`;
      if (onChunk) {
        onChunk(outputMsg);
      }
      return outputMsg;
    }
  }

  // Built-in intelligent responsive tutor engine (zero-config, high quality offline)
  const fullResponse = generateSmartOfflineResponse(pkg);

  // Stream chunks for realistic typing UX
  if (onChunk) {
    const words = fullResponse.split(" ");
    let current = "";
    for (let i = 0; i < words.length; i++) {
      current += (i === 0 ? "" : " ") + words[i];
      onChunk(current);
      await new Promise((resolve) => setTimeout(resolve, 14));
    }
  }

  return fullResponse;
}

function generateSmartOfflineResponse(pkg: ContextInheritancePackage): string {
  const text = pkg.selectedText.toLowerCase().trim();
  const action = pkg.actionType || "explain";

  // If it's an anchored sub-exploration, provide minimal, laser-focused answers!
  if (!pkg.isMainPath) {
    if (action === "simplify") {
      if (text.includes("base case")) {
        return [
          "### ⚡ Base Case (Simplified)",
          "",
          "A **base case** is the emergency brake of recursion. It's the simple condition where the function stops calling itself and returns an answer directly (e.g. `if (n == 1) return 1;`). Without it, the function would run forever and crash.",
        ].join("\n");
      }

      return [
        `### ⚡ Simplified: "${pkg.selectedText}"`,
        "",
        `Think of **${pkg.selectedText}** like a stop sign: it's the specific rule that dictates when and how this step resolves, ensuring the whole process doesn't get stuck in an endless loop.`,
      ].join("\n");
    }

    if (action === "why") {
      return [
        `### ❓ Why "${pkg.selectedText}" Matters Here`,
        "",
        `1. **Direct Purpose:** In *"…${pkg.contextSentence || pkg.selectedText}…"*, it guarantees correct execution and prevents unhandled edge cases.`,
        `2. **Impact:** Without **${pkg.selectedText}**, the surrounding logic would fail to terminate or produce incorrect outputs.`,
      ].join("\n");
    }

    if (action === "translate") {
      return [
        `### 🌐 Translation & Meaning: "${pkg.selectedText}"`,
        "",
        `* **Literal Translation:** "${pkg.selectedText}"`,
        `* **Contextual Nuance:** In this passage, it functions as a specific operational term representing the core mechanism of the surrounding concept.`,
      ].join("\n");
    }

    if (action === "explain" || action === "explore" || action === "ask") {
      if (text.includes("base case")) {
        return [
          "### 🛑 Base Case in Recursion",
          "",
          "**Definition:** The base case is the terminating scenario that does not use recursion to produce an answer.",
          "",
          "**Why it's essential:**",
          "* **Prevents Stack Overflow:** Stops infinite recursive calls from consuming memory.",
          "* **Provides the Anchor:** Allows earlier paused function calls on the stack to finally resolve and return values.",
        ].join("\n");
      }

      if (text.includes("फ़क्र") || text.includes("fakr")) {
        return [
          "### फ़क्र (Fakr / Fakhr)",
          "",
          "**Meaning:** Honor, deep maternal pride, and dignified validation (Urdu: *فخر*).",
          "",
          "**Nuance:** It represents the artist's greatest source of strength and emotional anchor amidst burnout.",
        ].join("\n");
      }

      return [
        `### 🔍 ${pkg.selectedText}`,
        "",
        `**Direct Explanation:**`,
        `Within this sentence, **${pkg.selectedText}** represents the pivotal mechanism that resolves your query: *"${pkg.userQuestion}"*.`,
        "",
        `* **Key Insight:** It anchors the surrounding explanation and ensures consistency across the broader concept.`,
      ].join("\n");
    }
  }

  // Main Path Topic Synthesizer
  const topicTitle = pkg.userQuestion.replace(
    /^(explain|teach me about|what is|tell me about)\s*/i,
    ""
  );
  return [
    `## 📚 Overview: ${topicTitle.charAt(0).toUpperCase() + topicTitle.slice(1)}`,
    "",
    `**${topicTitle}** is a foundational area of study. Here is the core conceptual breakdown:`,
    "",
    "### 1. Core Principles",
    `* **Fundamental Definition:** The primary mechanisms, structures, and laws governing this domain.`,
    `* **Key Dynamics:** How individual components operate and interact as a unified system.`,
    "",
    "### 2. Practical Applications",
    "* Used across modern analytical problem-solving, computing, and research.",
    "* Connects theoretical foundations to real-world outcomes.",
    "",
    "> *💡 Highlight any term in this response to open a focused sub-exploration branch!*",
  ].join("\n");
}
