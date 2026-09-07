# 404 AI — Causal Intelligence Platform

## Quick Start

```bash
cp .env.example .env
docker compose up -d postgres redis
cd backend && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run db:seed && npm run dev
cd frontend && npm install && npm run dev
```

Backend: http://localhost:4000 · Swagger: http://localhost:4000/api/docs
Frontend: http://localhost:3000
Demo: demo@404ai.dev / demo1234

## The React Artifact (404ai-platform.jsx)

The complete Phase 1 + Phase 2 application as a single React component:
- Landing page matching 404-ai.cofounder.company design
- Smart trace converter (any format)
- CIA algorithm for DES attribution
- Evidence panel, propagation graph, decision report
- Validation checklist, engineering summary, feedback loop

Open in Claude Artifacts or any React environment.

## Backend: 15 NestJS Modules

auth, workspace, project, upload, parser, timeline, graph, evidence, analysis, ai, report, chat, search, audit, notification

## Database: 26 Prisma Tables

Full schema with UUIDs, soft deletes, indexes, relations.

© 2026 404 AI
