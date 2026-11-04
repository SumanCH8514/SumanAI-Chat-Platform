# Graph Report - SumanAI  (2026-11-04)

## Corpus Check
- 116 files · ~212,392 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 58 file(s) not represented in the graph (top: .css 49, (none) 4, .example 1)

## Summary
- 571 nodes · 1498 edges · 26 communities (24 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9c202bb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- react
- AdminModels.jsx
- TextToImage.jsx
- ChatThread.jsx
- lucide-react
- AppRoutes.jsx
- InputBar.jsx
- ttsPlaybackEngine
- index.mjs
- frontend/package.json
- FilesPage.jsx
- 🤖 SumanAI
- dependencies
- backend/package.json
- manifest.json
- BGRemover.jsx
- devDependencies
- AdminPayments.jsx
- pages/index.js
- package.json
- compilerOptions
- ImageGenerator.jsx
- GeneratedImageCard.jsx
- vite.config.js
- scripts

## God Nodes (most connected - your core abstractions)
1. `react` - 64 edges
2. `lucide-react` - 48 edges
3. `useAuthStore` - 43 edges
4. `AppRoutes()` - 35 edges
5. `useChatStore` - 35 edges
6. `react-router-dom` - 33 edges
7. `ChatThread()` - 22 edges
8. `ttsPlaybackEngine` - 21 edges
9. `downloadImage()` - 18 edges
10. `MainLayout()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `AppRoutes()`  [EXTRACTED]
  frontend/src/App.jsx → frontend/src/routes/AppRoutes.jsx
- `Canvas()` --calls--> `CodeBlock()`  [EXTRACTED]
  frontend/src/components/Canvas.jsx → frontend/src/components/CodeBlock.jsx
- `ChatThread()` --calls--> `CodeBlock()`  [EXTRACTED]
  frontend/src/components/ChatThread.jsx → frontend/src/components/CodeBlock.jsx
- `ChatThread()` --calls--> `useAuthStore`  [EXTRACTED]
  frontend/src/components/ChatThread.jsx → frontend/src/store/useAuthStore.js
- `ChatThread()` --calls--> `useChatStore`  [EXTRACTED]
  frontend/src/components/ChatThread.jsx → frontend/src/store/useChatStore.js

## Import Cycles
- None detected.

## Communities (26 total, 2 thin omitted)

### Community 0 - "react"
Cohesion: 0.06
Nodes (50): App(), AuthModal(), GoogleIcon(), CheckoutModal(), AuthObserver(), ErrorBoundary, SettingsModal(), ThemeToggle() (+42 more)

### Community 1 - "AdminModels.jsx"
Cohesion: 0.27
Nodes (13): AdminModels(), AlibabaLogo(), DEFAULT_MODELS_CATALOG, GoogleLogo(), MetaLogo(), MODEL_PROVIDER_OPTIONS, MODEL_STATUS_OPTIONS, MODEL_TIER_OPTIONS (+5 more)

### Community 2 - "TextToImage.jsx"
Cohesion: 0.22
Nodes (11): ASPECT_RATIOS, DEFAULT_RECENT_IMAGES, ENGINES, INSPIRATION_PILLS, STYLES, TextToImage(), applySumanAIWatermark(), calculateWatermarkLayout() (+3 more)

### Community 3 - "ChatThread.jsx"
Cohesion: 0.08
Nodes (32): ChatThread(), copyToClipboard(), formatMessageTime(), UserAvatar(), GeneratedImageCard(), ImagePlaceholderCard(), GeneratedVideoCard(), VideoPlaceholderCard() (+24 more)

### Community 4 - "lucide-react"
Cohesion: 0.10
Nodes (35): BottomNav(), Canvas(), EmptyState(), getCleanModelTitle(), getModelBadge(), getModelSubtitle(), ModelSelector(), RenameModal() (+27 more)

### Community 5 - "AppRoutes.jsx"
Cohesion: 0.08
Nodes (35): AppSkeleton(), Skeleton(), NotFoundPage(), CATEGORIES, TOOL_DEFINITIONS, AboutUs, AdminDashboard, AdminLayout (+27 more)

### Community 6 - "InputBar.jsx"
Cohesion: 0.07
Nodes (28): CodeBlock(), EXTENSIONS, getGrammar(), LANGUAGE_NAMES, renderToken(), formatRecentChatTime(), InputBar(), mergeSpeechTranscripts() (+20 more)

### Community 8 - "index.mjs"
Cohesion: 0.20
Nodes (17): ALLOWED_ORIGINS, base64UrlToUint8Array(), fetch(), fetchWithRetry(), getCorsHeaders(), getGooglePublicKeys(), importedCryptoKeys, isAllowedOrigin() (+9 more)

### Community 9 - "frontend/package.json"
Cohesion: 0.16
Nodes (14): name, private, type, version, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh (+6 more)

### Community 10 - "FilesPage.jsx"
Cohesion: 0.53
Nodes (6): FALLBACK_FILES, FilesPage(), deduplicateWorkspaceFiles(), findRedundantCustomFiles(), isFileDeleted(), normalizeFileKey()

### Community 11 - "🤖 SumanAI"
Cohesion: 0.06
Nodes (31): [1.0.0] - 2026-09-28, [2.4.0] - 2026-09-29, 🚀 Added, Changelog, 🛠️ Fixed & Improved, 🚀 Initial Release, 🔒 Security & Privacy, 1. Clone the Repository (+23 more)

### Community 12 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, firebase, @imgly/background-removal, lucide-react, prismjs, react, react-dom, react-helmet-async (+5 more)

### Community 13 - "backend/package.json"
Cohesion: 0.17
Nodes (11): devDependencies, wrangler, name, private, scripts, deploy, dev, tail (+3 more)

### Community 14 - "manifest.json"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, id, name, scope, short_name (+2 more)

### Community 15 - "BGRemover.jsx"
Cohesion: 0.29
Nodes (6): APPROPRIATE_SAMPLE_PRESET, BGRemover(), DEFAULT_RECENT_IMAGES, FaceEnhancer(), SAMPLE_PRESETS, isValidImageUrl()

### Community 16 - "devDependencies"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+2 more)

### Community 17 - "AdminPayments.jsx"
Cohesion: 0.27
Nodes (9): AdminPayments(), CURRENCY_FILTER_OPTIONS, DEFAULT_SAMPLE_TXNS, GATEWAY_FILTER_OPTIONS, PhonePeLogo(), RazorpayLogo(), renderDateTime(), TIME_FILTER_OPTIONS (+1 more)

### Community 18 - "pages/index.js"
Cohesion: 0.08
Nodes (20): AUDIENCES, DOC_TYPES, LENGTHS, TONES, AUDIT_MODES, LANGUAGES, SAMPLE_SNIPPETS, LENGTHS (+12 more)

### Community 19 - "package.json"
Cohesion: 0.20
Nodes (9): name, private, scripts, dev, dev:backend, dev:frontend, lint, version (+1 more)

### Community 20 - "compilerOptions"
Cohesion: 0.22
Nodes (8): compilerOptions, baseUrl, jsx, module, moduleResolution, paths, target, include

### Community 21 - "ImageGenerator.jsx"
Cohesion: 0.25
Nodes (7): DEFAULT_RECENT_IMAGES, ENGINES, ImageGenerator(), INSPIRATION_PILLS, PALETTES, RESOLUTIONS, STYLES

### Community 22 - "GeneratedImageCard.jsx"
Cohesion: 0.26
Nodes (9): STYLE_PRESETS, env, ASPECT_RATIOS, DEFAULT_RECENT_IMAGES, INSPIRATION_PILLS, UncensoredImage(), base64ToBlob(), downloadFile() (+1 more)

### Community 27 - "vite.config.js"
Cohesion: 0.33
Nodes (3): __dirname, vite, @vitejs/plugin-react

### Community 28 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, preview

## Knowledge Gaps
- **169 isolated node(s):** `rateLimitMap`, `SECURITY_HEADERS`, `ALLOWED_ORIGINS`, `importedCryptoKeys`, `name` (+164 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 213 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `AdminModels.jsx`, `TextToImage.jsx`, `ChatThread.jsx`, `lucide-react`, `AppRoutes.jsx`, `InputBar.jsx`, `frontend/package.json`, `FilesPage.jsx`, `BGRemover.jsx`, `AdminPayments.jsx`, `pages/index.js`, `ImageGenerator.jsx`, `GeneratedImageCard.jsx`?**
  _High betweenness centrality (0.169) - this node is a cross-community bridge._
- **What connects `rateLimitMap`, `SECURITY_HEADERS`, `ALLOWED_ORIGINS` to the rest of the system?**
  _169 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.06281920326864147 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `lucide-react` to `react`, `AdminModels.jsx`, `TextToImage.jsx`, `ChatThread.jsx`, `AppRoutes.jsx`, `InputBar.jsx`, `frontend/package.json`, `FilesPage.jsx`, `BGRemover.jsx`, `AdminPayments.jsx`, `pages/index.js`, `ImageGenerator.jsx`, `GeneratedImageCard.jsx`?**
  _High betweenness centrality (0.097) - this node is a cross-community bridge._
- **Should `ChatThread.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08470588235294117 - nodes in this community are weakly interconnected._
- **Why does `ttsPlaybackEngine` connect `ttsPlaybackEngine` to `ChatThread.jsx`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Should `lucide-react` be split into smaller, more focused modules?**
  _Cohesion score 0.102322206095791 - nodes in this community are weakly interconnected._