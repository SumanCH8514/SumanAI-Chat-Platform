# Changelog

All notable changes to the **SumanAI** platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.4.0] - 2026-09-29

### 🚀 Added
- **NVIDIA NIM Cloud Multi-Model Inference**:
  - Integrated high-performance models via Cloudflare AI proxy and NVIDIA NIM microservices:
    - `z-ai/glm-5.3` & `z-ai/glm-5.3-flash` for high-throughput reasoning.
    - `moonshotai/kimi-k3` for extended context retention.
    - `google/gemma-4-31b-it` & `google/diffusiongemma-26b-a4b-it` for analytical thinking and creative generation.
    - `meta/muse-glimmer-30b` for code and mathematical synthesis.
    - `meta/llama-3.2-11b-vision-instruct` for multimodal vision inspection and image queries.
- **Enterprise Legal & Company Pages**:
  - **Terms of Service** (`/terms`, `/terms-of-service`, `/pages/Terms Of Service`): Production clauses governing user accounts, acceptable use, AI output disclaimers, liability limitations, and IP ownership.
  - **Privacy Policy** (`/privacy`, `/privacy-policy`, `/pages/Privacy Policy`): Comprehensive data sovereignty disclosure, zero-training guarantee on user prompts, and GDPR/CCPA data export/deletion mechanisms.
  - **About Us** (`/about`, `/about-us`, `/about_project`, `/pages/about us`): Platform mission, core engineering pillars, performance metrics, and founder spotlight.
- **Support & Contact Portal** (`/contact`, `/support`, `/pages/contact`, `/pages/support`):
  - Interactive support ticket draft engine with automatic diagnostic data compilation (user UID, timestamp, client platform).
  - Multi-channel assistance: direct email (`support_sumanai@sumanonline.com`) with instant clipboard copy, GitHub issue tracking, and LinkedIn developer connection.
  - Interactive FAQ accordion covering common user inquiries.
  - Live system status monitor tracking Groq LPUs, NVIDIA NIM, Cloudflare Edge, and Firestore database sync.
- **Dedicated Route Aliases**: Added seamless navigation for `/about_project`, `/about-project`, `/pages/Terms Of Service`, `/pages/Privacy Policy`, and `/pages/about us`.

### 🛠️ Fixed & Improved
- **Mobile Experience & Layout Overhaul**:
  - Resolved background layout shift when opening the AI Model Selection modal and Auth modal by standardizing viewport scrollbar gutters.
  - Centered and optimized the AI Model Selector modal on mobile viewports for fluid touch interactions.
  - Fixed chat dropdown menu clipping on bottom items by dynamically reversing dropdown orientation (`.dropdown-up`).
  - Adjusted toast notification positioning: top-right on desktop displays and top-center on mobile viewports.
  - Fixed vertical scrolling restriction across Terms of Service, Privacy Policy, and About Us pages by introducing `.legal-page-wrapper` with smooth scrolling and custom scrollbar styles.
- **Support Communication**:
  - Standardized enterprise contact email to `support_sumanai@sumanonline.com` across Settings, Auth modal, Terms, Privacy Policy, and Support portal.

### 🔒 Security & Privacy
- **Zero AI Training Guarantee**: User prompts and outputs are guaranteed not to be retained for foundational model training.
- **Local Client Processing**: Background removal operates 100% locally in browser memory via WebAssembly without cloud transmission.

---

## [1.0.0] - 2026-09-28

### 🚀 Initial Release
- Core AI chat platform architecture with React 19, Vite, and Groq LPU streaming inference.
- Firebase Authentication with Google OAuth 2.0 and guest session tier.
- Google Cloud Firestore real-time synchronization.
- Interactive Canvas workspace with live code execution and markdown formatting.
- Client-side AI Background Remover utility.
- Responsive dark and light theme glassmorphic design system.
