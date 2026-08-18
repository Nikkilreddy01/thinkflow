# ThinkFlow — Project Reference & Architecture Context

---

## 1. What Has Already Been Implemented

### 🧠 Core Interaction & Anchored Exploration System
* **Exact-Text Anchoring:** Users can highlight any text span (words, sentences, formulas, code lines) inside any AI response or branch to open an anchor exploration toolbar.
* **Recursive Multi-Level Branching:** AI responses inside child branches can themselves be highlighted to create nested sub-explorations ($A \to B \to C \dots$).
* **Dual Synchronized Views:**
  * **💬 Chat View:** Linear full-screen ChatGPT-style messaging with inline anchor indicators (`[anchor] 🔵 2`), attached exploration chips, and slide-over branch inspection drawer.
  * **🧠 Canvas View:** 2D visual tree powered by `@xyflow/react` with custom styled cards (`UserNode`, `AssistantNode`, `ExplorationNode`), minimap, background grid, auto-layout, and animated directional flow arrows.
* **Interactive Selection Toolbar:** Floating minimalist action bar featuring:
  * `✨ Ask AI` (Custom sub-question input)
  * `❓ Explain` (Context-aware focused breakdown)
  * `⚡ Simplify` (Minimal ELI5 summary under 50 words)
  * `🌐 Translate` (Linguistic & cultural nuance)
  * `? Why?` (Contextual rationale)
  * `↗ Explore` (Key takeaways + example)
* **Focus Mode Modal:** Double-clicking any card opens an isolated deep-dive view with breadcrumbs (`Main Path → 📍 anchor 1 → 📍 anchor 2`), sub-branch navigation, and quick `Esc` / Back return.

### 🔌 Multi-Provider AI Engine & Authentication
* **Two Legitimate Connection Modes:**
  1. **API Key Connection:** Secure client-to-server validation and streaming for **Google Gemini**, **OpenAI**, **Anthropic Claude**, **DeepSeek**, **Groq LPU**, **xAI Grok**, and **OpenRouter**.
  2. **Official Account / OAuth 2.0 PKCE:**
     * **OpenAI / ChatGPT Login:** Direct PKCE OAuth flow (`auth.openai.com`) matching Codex / OpenClaw without cookie scraping.
     * **Google Cloud / Vertex AI OAuth 2.0:** Official Google OAuth authorization flow.
     * **OpenRouter OAuth:** Direct token connection.
* **Context Inheritance Engine:** Constructs prompt context snapshots packaging `[Selected Anchor Text + Surrounding Sentence + Immediate Ancestor Chain + User Question + User Name]`.
* **Zero-Config Offline Mode:** Built-in smart tutor engine for instant offline usage without API keys.
* **Live Markdown Pipeline:** `react-markdown` + `remark-gfm` + `remark-math` + `rehype-katex` + `rehype-highlight` with 1-click **Copy Code** blocks and LaTeX math notation.

### 🎨 Desktop UI/UX Polish
* **ChatGPT-Style Resizable Sidebar:** Draggable horizontal width resize (`200px`–`480px`), clean text branding, and chronological recent conversations.
* **No Unwanted Autoscroll:** Reading position remains stable when spawning branches.
* **Option + Scroll:** Holding `⌥ Option` (Mac) or `Alt` (Windows) scrolls card text up/down, while normal wheel scrolls zoom/pan the canvas.
* **Persistent Node Resizing:** Custom card dimensions persist across view switches in `localStorage`.
* **Finder File Uploads (`+` button):** Upload files directly via native file picker with removable badge chips attached to prompts.

---

## 2. Current Architecture

```text
                      ┌─────────────────────────────────┐
                      │          USER CLIENT            │
                      │   (Chat View ⟷ Canvas View)     │
                      └────────────────┬────────────────┘
                                       │ Text Selection / Prompt
                                       ▼
                      ┌─────────────────────────────────┐
                      │     Context Inheritance Engine  │
                      │  [Anchor + Sentence + Ancestor] │
                      └────────────────┬────────────────┘
                                       │
                 ┌─────────────────────┴─────────────────────┐
                 ▼                                           ▼
  ┌─────────────────────────────┐             ┌─────────────────────────────┐
  │     Next.js API Routes      │             │    Built-in Smart Tutor     │
  │     /api/generate (SSE)     │             │    (Offline Fallback)       │
  │     /api/providers/validate │             └─────────────────────────────┘
  │     /api/auth/* (OAuth/PKCE)│
  └──────────────┬──────────────┘
                 │
  ┌──────────────┴───────────────────────────────────────────────────────┐
  ▼                     ▼                     ▼                          ▼
Google Gemini        OpenAI                Anthropic Claude           DeepSeek / Groq
(API / OAuth)        (API / ChatGPT OAuth) (API Key)                  (API Key)
```

---

## 3. Important Files

| Path | Purpose |
| :--- | :--- |
| `types/graph.ts` & `types/provider.ts` | Data models for nodes, anchors, conversations, OAuth tokens, and user profiles. |
| `context/GraphContext.tsx` | Central state store (multi-chat, active selection, focus mode, auto-save persistence). |
| `lib/ai.ts` | Context prompt constructor, sub-exploration constraints, and offline smart tutor. |
| `lib/models.ts` | Central registry of AI providers and models with speed/intelligence badges. |
| `lib/layout.ts` | Hierarchical tree layout algorithm for 2D canvas nodes and anchor edges. |
| `lib/auth/pkce.ts` | Cryptographic PKCE challenge generation, state management, and token exchange. |
| `components/chat/ChatView.tsx` | Full-screen ChatGPT-style chat view with floating input capsule and model selector. |
| `components/canvas/CanvasView.tsx` | 60FPS React Flow 2D visual canvas with in-canvas prompt input. |
| `components/canvas/UserNode.tsx` | Resizable user prompt card with drag grip handle. |
| `components/canvas/AssistantNode.tsx` | Resizable AI response card with selectable text and direct branching. |
| `components/canvas/ExplorationNode.tsx` | Resizable anchored sub-exploration card. |
| `components/canvas/AnchorEdge.tsx` | Animated directional flow lines with interactive anchor labels. |
| `components/MarkdownRenderer.tsx` | Full Markdown, LaTeX math, and syntax-highlighted code block pipeline. |
| `components/SelectionToolbar.tsx` | Dark-themed floating action popup with outside-click dismissal. |
| `components/SettingsModal.tsx` | Multi-provider connection modal (`[Connect with API]` & `[Connect Account]`). |
| `components/Sidebar.tsx` | Draggable resizable left sidebar with recent conversations history. |
| `app/api/generate/route.ts` | Server-side multi-provider streaming handler (SSE / ReadableStream). |
| `app/api/auth/openai/route.ts` | OpenAI ChatGPT PKCE OAuth initialization route. |
| `app/api/auth/openai/callback/route.ts` | OpenAI OAuth token exchange callback. |
| `app/api/auth/google/route.ts` | Google Cloud / Vertex AI OAuth 2.0 initialization route. |
| `app/api/auth/revoke/route.ts` | OAuth token revocation and disconnect handler. |
| `app/api/providers/validate/route.ts` | Live server-side API credential validator. |

---

## 4. Decisions Already Made

1. **Security & Privacy (No Cookie Scraping):** Strict refusal to scrape or replay browser session cookies. All authentications use documented official APIs or standard PKCE OAuth 2.0 flows.
2. **Dual-View Symmetry:** Chat View and Canvas View share the exact same reactive graph state; switching views never causes state desynchronization.
3. **Sub-Exploration Precision:** Sub-question prompts are strictly constrained to answer **only the specific doubt** in 2–4 concise points rather than repeating the parent message.
4. **Local Persistence:** All conversations, node dimensions, active providers, and profiles persist locally in the browser's `localStorage` with zero cloud lock-in.

---

## 5. Bugs Currently Monitored / Investigated

* **Localhost OAuth Callback Redirection:** When running behind proxies or custom ports (other than `:3000`), ensuring the `redirect_uri` matches the originating host.
* **Large Node Tree Layout:** When graphs exceed 50+ nested sub-branches, refining horizontal spacing offsets to prevent edge crossings.

---

## 6. Remaining TODOs & Roadmap

- [ ] **Export Options:** Export entire visual exploration graph as an interactive HTML document or nested Markdown outline (`.md`).
- [ ] **Bi-Directional Highlighting:** Hovering over an anchor in the chat highlights the corresponding connected card on the canvas and vice versa.
- [ ] **Custom System Prompt Editing:** Allow users to set global system prompt instructions in Settings.
- [ ] **Vector Embeddings (V2):** Local in-browser embedding index for semantic graph search across all conversations.
