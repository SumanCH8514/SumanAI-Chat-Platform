# SumanAI 🤖

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-Zero_Latency-F38020?logo=cloudflare-workers&logoColor=white)](https://workers.cloudflare.com/)

SumanAI is a professional-grade, high-performance AI chat interface designed to bridge the gap between users and state-of-the-art LLMs. Built with a "Zero-Logic" backend philosophy, it delivers a lightning-fast, streaming-first experience with advanced interactive tools.

---

## 🚀 Project Prototype (proto)

| Aspect | Detail |
| :--- | :--- |
| **Purpose** | A unified hub for interacting with multiple AI models (Gemini, DeepSeek, Gemma) with a specialized focus on code execution and real-time previews. |
| **Scope** | Core chat orchestration, model-specific providers, persistent thread management, and a side-by-side "Canvas" workspace. |
| **Core Tech** | React 19, Vite 8, Zustand, Cloudflare Workers, Lucide Icons. |
| **Quickstart** | `npm install && npm run dev` |

---

## ✨ Features

### 👤 User-Facing Functionality
- **Multi-Model Orchestration**: Toggle between Google Gemini (2.5/3.1), DeepSeek-V3.2, Gemma 3, and more within a single interface.
- **Real-Time Streaming**: SSE-based (Server-Sent Events) response streaming for zero-wait interactions.
- **Interactive Canvas**: A dedicated side-panel for code blocks that allows users to view, edit, and preview generated code in real-time.
- **Adaptive UI**: A premium, responsive layout featuring a glassmorphic sidebar, dark/light theme persistence, and smooth transitions.
- **Smart Conversational Threads**: Automated thread naming and persistent history managed via UUIDs for reliable data retrieval.

### ⚙️ Non-Functional Aspects
- **Performance**: Optimized with Vite's blazing-fast HMR and Cloudflare's global edge network to minimize TTFB (Time To First Byte).
- **Accessibility**: Built with semantic HTML5 and ARIA-standard descriptors to ensure a wide range of usability.
- **Security**: Robust separation of concerns; all API keys and sensitive logic are handled on the backend (Cloudflare Workers) using encrypted secrets.
- **Extensibility**: Modular provider architecture allows for adding new LLM adapters in minutes.

---

## 🛠️ Tech Stack & Rationale

### Frontend
- **React 19**: Leverages the latest concurrent rendering features and hooks for a fluid UI.
- **Vite 8**: Chosen for its near-instant cold starts and highly optimized production builds.
- **Zustand**: A minimalistic state management library that provides high performance with zero boilerplate.
- **React Router 7**: Enables declarative, URL-driven navigation for individual chat threads.

### Backend & Infrastructure
- **Cloudflare Workers**: Serves as a high-speed proxy/gateway. Chosen for its edge-execution capabilities, which eliminate traditional server latency.
- **Vanilla CSS**: Used to implement a bespoke design system with complex gradients and glassmorphism without the constraints of a framework.

### APIs & Tooling
- **Inference**: Google Generative AI (Gemini) and NVIDIA NIM (DeepSeek/Gemma).
- **Icons**: Lucide React for consistent, lightweight vector iconography.
- **Markdown**: `react-markdown` with GFM support for high-fidelity message rendering.

---

## 📝 Setup & Installation

### Prerequisites
- Node.js (v18 or higher)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (for backend development)

### Local Development
1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/SumanAI.git
   cd SumanAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env` file in the root for frontend variables:
   ```env
   VITE_WORKER_URL=http://localhost:8787
   ```
   For the backend (in `/worker`), add secrets:
   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

4. **Launch the application**:
   ```bash
   npm run dev
   ```

### Build & Deployment
- **Frontend Build**: `npm run build`
- **Worker Deployment**: `cd worker && npx wrangler deploy`

---

## 📜 Credits & Acknowledgments

- **Lead Developer**: Suman
- **Libraries**: Lucide, Zustand, React Markdown, Remark GFM, UUID.
- **License**: This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Attribution Guidelines
If you use this project for your own research or development, please attribute the original creator (Suman) and link back to this repository. For commercial usage, please refer to the MIT license terms.
