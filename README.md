# ThinkFlow

> **ThinkFlow — Every thought has a path.**

> *"ThinkFlow is an AI conversation canvas where every piece of generated content can become an anchored starting point for deeper exploration."*

---

## 💡 Overview

**ThinkFlow** is an experimental AI interface designed around a single core observation: **human thinking, learning, and research are inherently non-linear.**

In standard AI chat interfaces, conversations are strictly sequential. However, when reading an in-depth AI response, a curious reader often spots specific words, mathematical steps, code fragments, or cultural nuances they want to investigate. 

In traditional chats, exploring these sub-ideas forces a choice:
- **Derail the conversation:** Ask follow-up questions in the same thread, breaking the original flow and burying the initial topic.
- **Open a separate tab/chat:** Lose the surrounding context, parent explanation, and the exact phrase that sparked the question.
- **Settle for linear scrolling:** Sift through hundreds of flat messages trying to remember where a specific explanation originated.

ThinkFlow treats questions not as interruptions to a conversation, but as **the natural flow of thinking**. It introduces **exact-text anchored exploration**, allowing users to highlight any word, sentence, or code snippet inside an AI response to spawn a connected, context-aware branch on an infinite visual canvas.

---

## 🔄 The Core Experience

```text
ASK
 ↓
AI RESPONSE
 ↓
DISCOVER SOMETHING
 ↓
SELECT TEXT
 ↓
EXPLORE
 ↓
NEW BRANCH
 ↓
DISCOVER SOMETHING ELSE
 ↓
EXPLORE AGAIN
 ↓
...
```

Every generated response becomes an interactive surface for further questions, creating a structured knowledge tree rather than an unstructured stream of text.

---

## 🔍 How It Works: An Example

Suppose you ask an AI model to explain recursion:

```text
[Main Response]
"Recursion is a technique where a function calls itself. It relies on the 
call stack to keep track of active function calls and stack frames."
```

You highlight **"call stack"** and click **Explain**:

```text
[Main Response]
"Recursion is a technique where a function calls itself. It relies on the 
[call stack] 🔵 1 to keep track of active function calls..."
       │
       │ (Anchor: "call stack")
       ▼
  ┌─────────────────────────────────────────────────────────┐
  │ 📍 What is a call stack?                                │
  │ "The call stack is a LIFO memory structure. Each call   │
  │ pushes a stack frame containing local variables..."     │
  └────────────────────────────┬────────────────────────────┘
                               │
                               │ Highlight "stack frame" → Click "Why?"
                               ▼
                        ┌─────────────────────────────────────────┐
                        │ 📍 Why do stack frames matter?          │
                        │ "A stack frame isolates function scope  │
                        │ so inner recursive calls don't overwrite│
                        │ parent state in memory."                │
                        └─────────────────────────────────────────┘
```

The resulting exploration graph:

```text
Main Answer
   ↓
call stack
   ↓
What is a call stack?
   ↓
stack frame
   ↓
Why do stack frames matter?
```

This is **not just a generic branching chatbot**. The exact character origin of every single sub-exploration remains visibly connected, navigable, and collapsible.

---

## ❓ Why ThinkFlow?

Traditional chat interfaces were built for messaging friends, not for deep knowledge synthesis. When exploring complex topics—like distributed systems, neuroscience, philosophy, or foreign literature—information naturally branches into sub-questions, technical terms, and edge cases.

ThinkFlow was created to solve specific structural shortcomings of linear AI chats:
1. **Multiple concepts per response:** A single explanation often introduces 3–4 new terms that require clarification.
2. **Context degradation:** Long, winding chats accumulate noise and make it hard for both the user and the LLM to stay focused.
3. **Loss of provenance:** You find a great insight 30 messages in, but can no longer recall which sentence prompted it.
4. **Cognitive overload:** Flat timelines flatten hierarchies, obscuring the relationship between high-level concepts and low-level details.

By making the generated content itself the starting point for recursive questioning, ThinkFlow preserves mental context and lets you explore deeply without losing your way back.

---

## ⚡ What Makes ThinkFlow Different?

AI conversation branching and 2D canvas interfaces already exist in various forms. **ThinkFlow does not claim to invent canvases or conversation trees.** 

Instead, ThinkFlow focuses on a specific **interaction model and synthesis** of six core principles:

1. **Exact-Text Anchoring:** Branches are not just child messages attached to the bottom of a card. They originate from the exact character span (word, phrase, formula, or code line) highlighted by the user.
2. **Recursive Exploration:** Any text inside an exploration branch can itself be highlighted to create sub-branches, sub-sub-branches, and deeper investigations indefinitely.
3. **Dual Synchronized Views (Chat + Canvas):** Chat and Canvas are two synchronized viewports of the exact same underlying graph data. You can read linearly in Chat view or pan across the 2D visual tree in Canvas view.
4. **Context Inheritance:** Instead of dumping an entire 200-message chat history, ThinkFlow packages only the relevant parent sentence, source node, and immediate ancestor chain into the sub-query context.
5. **Return-to-Source Navigation:** Deep dives are never one-way trips. You can jump directly between a sub-exploration and the exact parent sentence where it was born.
6. **Focus Mode:** Allows you to isolate an individual branch subtree with full breadcrumb navigation (`Main → 📍 call stack → 📍 stack frame`) and return to the main thread with one keystroke (`Esc`).

---

## 🎯 Target Users

ThinkFlow is designed for anyone who uses AI for deep exploratory problem-solving rather than one-off prompts:

- **Students & Learners:** Deconstruct dense academic subjects, textbooks, and lectures word-by-word without getting overwhelmed.
- **Programmers & Engineers:** Break down complex algorithms, memory mechanics, system architectures, and library APIs.
- **Researchers:** Synthesize multi-layered hypotheses, literature reviews, and cross-disciplinary concepts.
- **Writers & Thinkers:** Explore character motivations, plot mechanics, etymology, and linguistic nuances.
- **Technical Problem Solvers:** Keep root-cause investigations structured and clean.

---

## 🛠 Core Features

- **Linear AI Chat:** ChatGPT-style familiar messaging interface with streaming responses.
- **Exact-Text Anchors:** Highlight any word or sentence to spawn a targeted branch.
- **Interactive Action Toolbar:**
  - `✨ Ask AI`: Ask a custom question on the selected phrase.
  - `❓ Explain`: Concise breakdown of the term in its current context.
  - `⚡ Simplify`: Plain-English ELI5 summary (under 50 words) with an everyday analogy.
  - `🌐 Translate`: Literal, linguistic, and slang breakdown.
  - `? Why?`: Clarifies why the term was used and its specific purpose in the statement.
  - `↗ Explore`: 2 key takeaways and a practical example.
- **2D Visual Canvas:** Powered by `@xyflow/react` with custom nodes, animated directional flow arrows, and auto-layout.
- **Persistent Node Resizing:** Drag node borders to customize width/height with state persistence.
- **Option + Scroll:** Hold `⌥ Option` (Mac) or `Alt` (Windows) to scroll internal card text without triggering canvas zoom.
- **Double-Click Maximize:** Double-tap any node card to open it in **Focus Mode**.
- **Context Inheritance Engine:** Constructs focused ancestor snapshots for each sub-question.
- **Multi-Provider AI Engine:**
  - Google Gemini (`Gemini 3.7 Flash`, `Gemini 3.6 Flash`, `Gemini 2.0 Flash`, `Gemini 1.5 Pro`)
  - OpenAI (`GPT-4o`, `o3-mini`, `o1`, `GPT-4o Mini`, `GPT-4.5 Preview`)
  - Anthropic Claude (`Claude 3.7 Sonnet`, `Claude 3.5 Sonnet`, `Claude 3.5 Haiku`)
  - DeepSeek (`DeepSeek R1 Reasoner`, `DeepSeek V3`)
  - Groq (`DeepSeek R1 Distill 70B`, `Llama 3.3 70B`)
  - xAI (`Grok 3`, `Grok 2`)
  - OpenRouter & Built-in Smart Tutor (offline zero-config engine).
- **File Attachments:** Upload files via native Finder dialog (`+` button) to include in analysis.
- **Markdown & Syntax Highlighting:** Full support for headings, bold/italics, lists, tables, LaTeX math equations, and code blocks with 1-click copy.
- **Local Multi-Chat Persistence:** All conversations and graphs auto-save locally in your browser (`localStorage`).

---

## 📌 Current Status

ThinkFlow is currently an **experimental prototype** focused on validating and refining the core interaction model:

$$\text{AI Response} \longrightarrow \text{Select Text} \longrightarrow \text{Anchored Branch} \longrightarrow \text{Recursive Exploration} \longrightarrow \text{Visual Graph}$$

### Roadmap:
- [x] Exact-text selection and anchor extraction
- [x] Recursive sub-branching and Context Inheritance packaging
- [x] Dual synchronized Chat & Canvas views
- [x] Node resizing, drag handles, and Option+Scroll interaction
- [x] Multi-provider LLM streaming (Gemini 3.7, GPT-4o, Claude 3.7, DeepSeek R1)
- [x] Polished Markdown, LaTeX Math & Code syntax highlighting
- [ ] Export graph as Interactive Markdown / HTML report
- [ ] Bi-directional anchor highlighting across canvas and chat
- [ ] Local vector embedding index for graph-wide semantic search

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Nikkilreddy01/thinkflow.git
cd thinkflow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Configure your AI Provider (Optional)
Click the profile pill (**NR**) in the bottom-left of the sidebar to enter your Google Gemini, OpenAI, Anthropic, or DeepSeek API key. The app also includes a zero-config built-in smart tutor for instant offline testing.

---

## 📜 License

MIT License. Feel free to use, modify, and build upon this concept.
