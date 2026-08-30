# 404 AI — Causal Intelligence Platform

404 AI is a full-stack React, Express, tRPC, MySQL/TiDB workspace for ingesting AI-agent traces, normalizing framework events, exploring causal failures, capturing state snapshots, queuing safe replay/fork branches, and evaluating saved executions.

## Current capabilities

The application includes a reference-aligned landing page, branded workspace, Manus OAuth, framework-aware normalization for OpenTelemetry, LangGraph, LangChain, CrewAI, AutoGen, and generic logs, tenant-scoped agent/execution/experiment/evaluation persistence, snapshot/replay/fork APIs, execution-derived evaluation scoring, and REST aliases under `/api/v1` for implemented resources.

## Local setup

Install Node.js 22 and pnpm, copy `.env.example` to `.env`, provide the existing Manus and MySQL/TiDB variables, then run `pnpm install`, `pnpm drizzle-kit generate`, and `pnpm dev`. Run `pnpm check`, `pnpm test`, and `pnpm build` before deployment.

## API surfaces

The canonical application API is tRPC under `/api/trpc`. Implemented REST aliases include trace normalization, agents, executions, snapshots, replays, forks, evaluations, and evaluation runs under `/api/v1`. Persistent routes require a valid Manus session.

## Safety

Normalization removes fields that look like chain-of-thought, API keys, tokens, or similar secrets. Replay records default to safe modes and currently persist requested replay intent; arbitrary user code is not executed by the web process.

## Genuine limitations

Worker-backed sandbox execution, live replay, full execution-event tables, project/workspace version graphs, model gateway/BYOK, CLI/SDK packages, deployment orchestration, monitoring, copilot, and knowledge services remain future implementation areas. See `IMPLEMENTATION_AUDIT.md` for the detailed matrix.
