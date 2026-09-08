import { supabase } from './supabase';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const response = await fetch(`${API_URL}/api${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...(init?.headers || {}) },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export type Phase2Snapshot = { id: string; executionId: string; spanId: string; framework: string; runtime?: string | null; environment?: string | null; state: unknown; context?: unknown; createdAt: string };
export type Phase2Replay = { id: string; status: string; mode: string; resultExecutionId?: string | null; sourceSnapshotId?: string | null };
export type Phase2Fork = { id: string; name: string; status: string; sourceSnapshotId?: string | null; resultExecutionId?: string | null; changes: unknown };
export type Phase2Diff = { id: string; summary: string; changes: unknown; rcaComparison?: { conclusion: string; errorRemoved: boolean; confidence: [unknown, unknown] } };

export const phase2Api = {
  listSnapshots: (executionId: string) => request<Phase2Snapshot[]>(`/snapshots?executionId=${encodeURIComponent(executionId)}`),
  createSnapshot: (body: { executionId: string; spanId?: string; label?: string; reason?: string }) => request<Phase2Snapshot>('/snapshots', { method: 'POST', body: JSON.stringify(body) }),
  replay: (body: { snapshotId: string; mode: 'SANDBOX' | 'MOCK_TOOLS' | 'RECORDED_TOOLS' | 'READ_ONLY'; idempotencyKey?: string }) => request<Phase2Replay>('/replays', { method: 'POST', body: JSON.stringify(body) }),
  createFork: (body: { snapshotId: string; name: string; modifications: Record<string, unknown> }) => request<Phase2Fork>('/forks', { method: 'POST', body: JSON.stringify(body) }),
  runFork: (id: string) => request<Phase2Fork>(`/forks/${id}/run`, { method: 'POST', body: '{}' }),
  createDiff: (body: { leftExecutionId: string; rightExecutionId: string }) => request<Phase2Diff>('/diffs', { method: 'POST', body: JSON.stringify(body) }),
};
