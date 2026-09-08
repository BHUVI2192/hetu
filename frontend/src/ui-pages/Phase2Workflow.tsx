'use client';

import { useEffect, useState } from 'react';
import { Camera, GitCompare, GitFork, Loader2, Play, ShieldCheck } from 'lucide-react';
import { phase2Api, Phase2Diff, Phase2Fork, Phase2Replay, Phase2Snapshot } from '../lib/phase2-api';

type Props = { executionId: string };

export default function Phase2Workflow({ executionId }: Props) {
  const [snapshots, setSnapshots] = useState<Phase2Snapshot[]>([]);
  const [snapshot, setSnapshot] = useState<Phase2Snapshot | null>(null);
  const [replay, setReplay] = useState<Phase2Replay | null>(null);
  const [fork, setFork] = useState<Phase2Fork | null>(null);
  const [diff, setDiff] = useState<Phase2Diff | null>(null);
  const [spanId, setSpanId] = useState('');
  const [mode, setMode] = useState<'SANDBOX' | 'MOCK_TOOLS' | 'RECORDED_TOOLS' | 'READ_ONLY'>('SANDBOX');
  const [model, setModel] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try { setSnapshots(await phase2Api.listSnapshots(executionId)); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load snapshots.'); }
  };
  useEffect(() => { void load(); }, [executionId]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key); setError('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Phase 2 operation failed.'); } finally { setBusy(''); }
  };

  return <section className="phase2-workflow" aria-labelledby="phase2-title">
    <div className="phase2-header"><div><span className="section-eyebrow">PHASE 2 LINEAGE</span><h3 id="phase2-title">Reproduce the decisive step</h3><p>Persist a checkpoint, run it safely, change one variable, and compare the resulting execution.</p></div><span className="phase2-safety"><ShieldCheck size={14} /> SAFE BY DEFAULT</span></div>
    <div className="phase2-lineage"><span className="active">Execution</span><i>→</i><span className={snapshot ? 'active' : ''}>Snapshot</span><i>→</i><span className={replay ? 'active' : ''}>Replay</span><i>→</i><span className={fork ? 'active' : ''}>Fork</span><i>→</i><span className={diff ? 'active' : ''}>Diff</span></div>
    <div className="phase2-grid">
      <div className="phase2-card"><div className="phase2-card-head"><Camera size={15} /><strong>Create snapshot</strong></div><p>Capture a persisted state from a specific normalized span. The source execution stays immutable.</p><div className="phase2-form"><input value={spanId} onChange={(event) => setSpanId(event.target.value)} placeholder="span id (optional; defaults to first)" /><button className="secondary-button small" disabled={busy === 'snapshot'} onClick={() => void run('snapshot', async () => { const created = await phase2Api.createSnapshot({ executionId, spanId: spanId || undefined, reason: 'Phase 2 investigation' }); setSnapshot(created); await load(); })}>{busy === 'snapshot' ? <Loader2 className="spin" size={13} /> : <Camera size={13} />} Snapshot</button></div>{snapshots.length > 0 && <div className="phase2-list">{snapshots.map((item) => <button key={item.id} className={`phase2-list-item ${snapshot?.id === item.id ? 'selected' : ''}`} onClick={() => setSnapshot(item)}><span>{item.spanId}</span><small>{new Date(item.createdAt).toLocaleString()}</small></button>)}</div>}{snapshots.length === 0 && <small className="phase2-muted">No snapshots created for this execution.</small>}</div>
      <div className="phase2-card"><div className="phase2-card-head"><Play size={15} /><strong>Replay safely</strong></div><p>{snapshot ? `Using snapshot ${snapshot.id.slice(0, 8)}…` : 'Select a snapshot to restore the captured execution state.'}</p><div className="phase2-form"><select value={mode} onChange={(event) => setMode(event.target.value as typeof mode)} disabled={!snapshot}><option value="SANDBOX">Sandbox</option><option value="MOCK_TOOLS">Mock tools</option><option value="RECORDED_TOOLS">Recorded tools</option><option value="READ_ONLY">Read only</option></select><button className="secondary-button small" disabled={!snapshot || !!busy} onClick={() => void run('replay', async () => { setReplay(await phase2Api.replay({ snapshotId: snapshot!.id, mode, idempotencyKey: `${executionId}:${snapshot!.id}:${mode}` })); })}>{busy === 'replay' ? <Loader2 className="spin" size={13} /> : <Play size={13} />} Run replay</button></div>{replay && <div className="phase2-result"><b>{replay.status}</b><span>{replay.resultExecutionId ? 'New execution persisted.' : 'No result execution returned.'}</span></div>}</div>
      <div className="phase2-card"><div className="phase2-card-head"><GitFork size={15} /><strong>Fork and modify</strong></div><p>Branch from the snapshot with an explicit, reviewable configuration change.</p><div className="phase2-form"><input value={model} onChange={(event) => setModel(event.target.value)} placeholder="model override (optional)" disabled={!snapshot} /><button className="secondary-button small" disabled={!snapshot || !!busy} onClick={() => void run('fork', async () => { const created = await phase2Api.createFork({ snapshotId: snapshot!.id, name: 'Investigation fork', modifications: model ? { model: { name: model } } : { validation: { enabled: true } } }); setFork(created); })}>{busy === 'fork' ? <Loader2 className="spin" size={13} /> : <GitFork size={13} />} Create fork</button></div>{fork && <div className="phase2-result"><b>{fork.status}</b><button className="link-button" onClick={() => void run('fork-run', async () => { setFork(await phase2Api.runFork(fork.id)); })}>Run fork</button></div>}</div>
      <div className="phase2-card"><div className="phase2-card-head"><GitCompare size={15} /><strong>Compare executions</strong></div><p>Compare actual persisted execution data, including errors, tokens, latency, and RCA evidence.</p><button className="secondary-button small" disabled={!replay?.resultExecutionId && !fork?.resultExecutionId} onClick={() => void run('diff', async () => { const right = replay?.resultExecutionId ?? fork?.resultExecutionId; if (!right) return; setDiff(await phase2Api.createDiff({ leftExecutionId: executionId, rightExecutionId: right })); })}>{busy === 'diff' ? <Loader2 className="spin" size={13} /> : <GitCompare size={13} />} Compare with source</button>{diff && <div className="phase2-result"><b>{diff.rcaComparison?.conclusion ?? diff.summary}</b><span>{diff.rcaComparison?.errorRemoved ? 'Original failure resolved.' : 'Available evidence does not prove the fix.'}</span></div>}</div>
    </div>
    {error && <div className="phase2-error">{error}</div>}
  </section>;
}
