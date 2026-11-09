# Dev Server Startup Fix, Build Fix & Mahr Memory, Knowledge Graph & Obsidian Vault Studio Plan

## 1. Executive Summary & Root Cause Analysis
1. **Dev Server Startup & Production Build Fix**:
   - **Root Cause**: During development startup, the backend server invokes Vite's `createServer` prior to binding the HTTP listener on port `3000`. Because the Vite configuration references two deleted build modules (`pixiExtensionIdempotencyPlugin` and `viteBuildConstants`), `createViteServer` throws a module resolution exception and aborts the startup sequence before `server.listen(3000)` is reached.
   - **Resolution**: Inline the `NODE_POLYFILL_OPTIONS` configuration and both `pixiExtensionIdempotencyPlugin` (Rollup `transform` hook) and `pixiExtensionIdempotencyEsbuildPlugin` (esbuild `onLoad` hook) directly inside the Vite configuration file, and add resilient error handling around the Vite middleware initialization so the Express + WebSocket server reliably starts and binds to port `3000` in both development and production.
2. **Multi-Tier Cognitive Memory Engine**:
   - Upgrade Mahr's memory system into a structured **Episodic, Semantic, and Procedural** memory architecture featuring retention strength, importance weighting, pinning, usage tracking, and AI-driven memory consolidation.
3. **Interactive Force-Directed Knowledge Graph**:
   - Deliver an interactive neural graph with live physics controls, community cluster coloring, 1-hop/2-hop ego-network isolation, AI semantic auto-linking, and a shortest-path connection finder between any two knowledge nodes.
4. **Full Obsidian Markdown Vault Studio**:
   - Provide a bidirectional Markdown workspace supporting `[[wikilinks]]`, `#tags`, YAML frontmatter, Daily Notes, custom note templates, a live Backlinks & Unlinked Mentions detector, and two-way sync via both local folders and `.zip` vault archives.

---

## 2. Three-Layer System Architecture

```
+-----------------------------------------------------------------------------------+
|                        PRESENTATION & UI LAYER (Modular Views)                    |
|                                                                                   |
|  +-------------------------+  +------------------------+  +--------------------+  |
|  |   Memory Bank Studio    |  | Neural Graph Explorer  |  | Obsidian Vault IDE |  |
|  | - Episodic / Semantic / |  | - Force Physics Engine |  | - Split MD Editor  |  |
|  |   Procedural Tabs       |  | - Shortest-Path Finder |  | - YAML Frontmatter |  |
|  | - Importance & Decay    |  | - 1/2-Hop Ego Filter   |  | - Live Backlinks & |  |
|  | - AI Consolidation      |  | - Cluster Highlighting |  |   Unlinked Mentions|  |
|  +------------+------------+  +-----------+------------+  +---------+----------+  |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
                v                           v                         v
+-----------------------------------------------------------------------------------+
|                     DOMAIN & SERVICE LAYER (Hooks & Services)                     |
|                                                                                   |
|  +-------------------------+  +------------------------+  +--------------------+  |
|  |   Memory Domain Logic   |  |  Graph Analytics Svc   |  | Obsidian Sync Svc  |  |
|  | - Tier Classification   |  | - BFS Pathfinding      |  | - [[Wikilink]] AST |  |
|  | - Retention & Pinning   |  | - Cluster Detection    |  | - Unlinked Scanner |  |
|  | - Context Injection     |  | - Physics Simulation   |  | - Local Dir & ZIP  |  |
|  +------------+------------+  +-----------+------------+  +---------+----------+  |
+---------------|---------------------------|-------------------------|-------------+
                |                           |                         |
                v                           v                         v
+-----------------------------------------------------------------------------------+
|                  DATA & INFRASTRUCTURE LAYER (Server, Vite & Storage)             |
|                                                                                   |
|  +-------------------------+  +------------------------+  +--------------------+  |
|  | Dev Server & Vite Build |  | Gemini Semantic Engine |  | Dual-Write Storage |  |
|  | - Inlined Pixi Patch    |  | - Auto-Connect Nodes   |  | - SQLite + Cloud   |  |
|  | - Inlined Node Polyfill |  | - Memory Consolidation |  |   Firestore Sync   |  |
|  | - Resilient Port 3000   |  |                        |  |                    |  |
|  +-------------------------+  +------------------------+  +--------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 3. Core Capabilities & Functional Specifications

### A. Dev Server Startup & Build Pipeline Fix
- **Self-Contained Vite Configuration**: Replace the broken external imports by embedding `NODE_POLYFILL_OPTIONS`, `pixiExtensionIdempotencyPlugin`, and `pixiExtensionIdempotencyEsbuildPlugin` directly inside the Vite configuration file.
- **Idempotent PixiJS Extension Guard**: Wrap `extensions.add(...)` calls in `@pixi` modules inside a safe `try / catch` block during both development `optimizeDeps` pre-bundling and production Rollup bundling.
- **Guaranteed Dev Server Startup on Port 3000**: Ensure `createViteServer` loads cleanly without module resolution errors and restart the development server immediately after applying the fix.

### B. Hybrid Cognitive Memory Bank
- **Three Memory Tiers**:
  - **Episodic**: Time-anchored session events, user milestones, and learning breakthroughs.
  - **Semantic**: Core conceptual facts, domain knowledge, and synthesized study notes.
  - **Procedural**: User preferences, coding style rules, tutoring pace, and workflow habits.
- **Retention & Importance Metrics**: Track importance score (`0–100%`), retention strength (`tabular-nums`), access count, and pinned status so core memories never decay.
- **AI Memory Consolidation**: One-click semantic synthesis that merges redundant or overlapping memories into clean, high-signal knowledge entries and links them to graph nodes.

### C. Interactive Knowledge Graph & Connection Intelligence
- **Customizable Physics Engine**: Real-time controls for node repulsion, link distance, center gravity, layout freeze/unfreeze, and zoom-to-fit.
- **Shortest-Path Connection Finder**: Select any source and target node to compute and highlight the shortest conceptual path across intermediate bridge nodes.
- **Ego-Network & Cluster Lens**: Isolate 1-hop or 2-hop neighborhoods around an active node and color-code nodes by semantic cluster or category.
- **AI Semantic Auto-Linking**: Server-side Gemini analysis that discovers latent semantic relationships across notes and memories, creating weighted edges (`related_to`, `prerequisite_for`, `synthesizes`, `contradicts`, `part_of`) with human-readable explanations.

### D. Obsidian Markdown Vault Studio
- **Rich Markdown & Frontmatter Editor**: Split-pane Markdown editor and live preview supporting YAML frontmatter (`tags`, `aliases`, `type`, `updated`), clickable `[[Wikilinks]]`, and `#tag` extraction.
- **Live Backlinks & Unlinked Mentions**:
  - **Linked Mentions**: Lists every vault note referencing the active note via `[[Note Title]]` with context snippets.
  - **Unlinked Mentions Detector**: Scans all vault notes for plain-text occurrences of the active note's title or aliases and provides a one-click **"Link"** button to convert them into `[[Wikilinks]]` and generate the corresponding graph edge.
- **Daily Notes & Templates**: Instant one-click **Daily Note** creation (`YYYY-MM-DD`) and customizable note templates (Concept Note, Research Summary, Project Spec, Feynman Breakdown).
- **Bidirectional Local Folder & ZIP Sync**: Two-way synchronization with a local Obsidian vault directory via `showDirectoryPicker` as well as full `.zip` vault import and export.

---

## 4. Verification & Acceptance Criteria
1. **Dev Server & Build Health**: The development server starts cleanly on port `3000`, and `vite build` completes with zero unresolved module errors.
2. **Bidirectional Vault Sync**: Creating or editing a note with `[[Target Note]]` in the Obsidian Studio immediately updates the Knowledge Graph edges and appears in the Target Note's Backlinks panel.
3. **Unlinked Mention Conversion**: Clicking "Link" on an unlinked mention wraps the text in `[[...]]` and creates a live edge in the graph.
4. **Graph Pathfinding & AI Linking**: Selecting two nodes highlights their shortest connection path, and triggering AI Auto-Connect generates semantic edges with relationship explanations.
