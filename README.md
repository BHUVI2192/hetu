# HETU.ai — Multi-Agent System Causal Debugger

> **Trace the cause. Test the fix. Make multi-agent reasoning failures explainable.**

HETU.ai is a specialized causal debugger and cognitive execution visualizer designed for multi-agent AI systems (LangGraph, CrewAI, AutoGen, and custom OpenTelemetry traces). Instead of scrolling through thousands of disconnected logs, HETU isolates the **Decisive Error Step (DES)**—the exact earliest point where an agent's reasoning went off track—and allows you to test counterfactual fixes.

---

## ⚡ Key Features

- **Multi-Agent Cognitive Execution Graph (MACEG)**: Auto-constructs a interactive visual graph connecting agent handoffs, tool calls, and memory state mutations.
- **Counterfactual Causal Traversal (CCT)**: Pinpoints the root cause step and calculates confidence scores, impact radius, and failure propagation routes.
- **Evidence & Trust Analytics**: Generates an evidence score (observable vs. inferred), agent reliability rankings, and automated P0/P1 remediation steps.
- **Deterministic Branch Replay**: Re-simulate span boundaries with controlled temperatures, seeds, or mocked tool outputs to verify fixes.
- **Supabase & Telemetry Integration**: Store trace execution history persistently in Supabase with zero setup friction.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/BHUVI2192/hetu.git

# 2. Enter the repository directory
cd hetu

# 3. Install dependencies
npm install

# 4. Start the development server
npm run dev
```

The application will be running live at **`http://localhost:3000`** (or `http://localhost:3001`).

---

## 🛠️ Project Architecture

```
hetu/
├── frontend/             # Next.js 14 App Router + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── ui-pages/     # Core views: Home, Workspace Studio, and Phase 2 workflow panels
│   │   ├── app/          # Next.js app layout & global CSS tokens
│   │   └── lib/          # Supabase client & tRPC configurations
├── backend/              # NestJS backend API & Prisma database schemas
└── hetu/                 # Core trace normalization engine & counterfactual algorithms
```

---

## 📜 Available Scripts

Run these scripts from the repository root:

- `npm run dev`: Starts the Next.js frontend development server.
- `npm run build`: Generates an optimized production build (`✓ Generating static pages`).
- `npm run start`: Starts the Next.js production server.
- `npm run dev:backend`: Starts the NestJS backend in watch mode.

## Phase 2 debugging workflow

The backend now persists the complete investigation lineage: **execution → snapshot → replay/fork → new execution → diff → RCA comparison**. Snapshots capture a redacted state at a normalized span and are immutable. Replays default to `SANDBOX`, `MOCK_TOOLS`, `RECORDED_TOOLS`, or `READ_ONLY`; `LIVE` is rejected by the API until an explicit authorization flow is added. Forks accept only controlled prompt, model, tools, context, retrieval, memory, validation, and agent-configuration changes.

The authenticated endpoints are:

| Capability | Endpoint |
| --- | --- |
| Create/list/read snapshots | `POST /api/snapshots`, `GET /api/snapshots`, `GET /api/snapshots/:id` |
| Replay a snapshot/read replay | `POST /api/replays`, `GET /api/replays/:id` |
| Create/run/read a fork | `POST /api/forks`, `POST /api/forks/:id/run`, `GET /api/forks/:id` |
| Create/read an execution diff | `POST /api/diffs`, `GET /api/diffs/:id` |

All Phase 2 resource lookups are owner-scoped. Secret fields, credentials, bearer tokens, and private reasoning keys are recursively removed before snapshot or derived execution metadata is persisted. Source executions and snapshots are never updated by replay or fork operations. The current replay adapter is framework-agnostic at the normalized-event layer and safely reproduces captured events; it does not claim to invoke arbitrary LangGraph, LangChain, CrewAI, AutoGen, MCP, or custom runtime code.

---

## 📄 License & Attribution

© 2026 HETU.ai — Built for multi-agent system reliability.
