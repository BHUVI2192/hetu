import { useState } from "react";
import { ArrowRight, CheckCircle2, CircleHelp, FlaskConical, FolderKanban, Gauge, LockKeyhole, Play, Plus, RotateCcw, Sparkles, Workflow } from "lucide-react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

type ModuleProps = { onBackToOverview: () => void };

function ModuleHeader({ eyebrow, title, description, action, onBackToOverview }: { eyebrow: string; title: string; description: string; action?: React.ReactNode; onBackToOverview: () => void }) {
  return <div className="module-header"><div><button className="module-back" onClick={onBackToOverview}>← Overview</button><span className="workspace-eyebrow"><i /> {eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="module-empty"><RotateCcw size={18} className="spin" /><p>Checking workspace access…</p></div>;
  if (!isAuthenticated) return <div className="module-auth"><LockKeyhole size={22} /><h2>Connect your workspace</h2><p>Sign in to save agents, executions, experiments, and evaluations to your private workspace.</p><button className="analyze-trace" onClick={() => startLogin()}>Sign in to continue <ArrowRight size={14} /></button></div>;
  return <>{children}</>;
}

export function AgentRegistry({ onBackToOverview }: ModuleProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [framework, setFramework] = useState("LangGraph");
  const { isAuthenticated } = useAuth();
  const agents = trpc.workspace.agents.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const create = trpc.workspace.createAgent.useMutation({ onSuccess: () => { setName(""); setShowForm(false); utils.workspace.agents.invalidate(); } });
  return <><ModuleHeader eyebrow="Agent registry" title="Your agents, versioned." description="Connect existing agents, keep their runtime configuration visible, and make every execution traceable to a version." action={<button className="analyze-trace" onClick={() => setShowForm((value) => !value)}><Plus size={15} /> New agent</button>} onBackToOverview={onBackToOverview} /><AuthGate><div className="module-summary-row"><div><b>{agents.data?.length ?? 0}</b><span>registered agents</span></div><div><b>v1</b><span>latest promoted version</span></div><div><b>7</b><span>framework adapters planned</span></div></div>{showForm && <form className="module-form" onSubmit={(event) => { event.preventDefault(); create.mutate({ name, framework, config: { runtime: "sandbox", evaluationPolicy: "default" } }); }}><div><label>Agent name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Revenue analyst" required /></div><div><label>Framework</label><select value={framework} onChange={(event) => setFramework(event.target.value)}><option>LangGraph</option><option>LangChain</option><option>CrewAI</option><option>AutoGen</option><option>Custom Python</option><option>Custom TypeScript</option></select></div><button className="analyze-trace" disabled={create.isPending}>{create.isPending ? "Saving…" : "Create agent"} <ArrowRight size={14} /></button></form>}<div className="module-list">{(agents.data ?? []).map((agent) => <article className="module-card" key={agent.id}><div className="module-card-icon"><FolderKanban size={17} /></div><div><span className="module-card-kicker">{agent.framework} · {agent.version}</span><h3>{agent.name}</h3><p>Active agent configuration · sandbox-ready</p></div><span className="module-status">{agent.status}</span><ArrowRight size={15} /></article>)}{!agents.isLoading && !agents.data?.length && <div className="module-empty"><FolderKanban size={19} /><p>No agents yet. Create the first registry entry or connect one from the CLI.</p></div>}</div></AuthGate></>;
}

export function ExecutionHistory({ onBackToOverview }: ModuleProps) {
  const { isAuthenticated } = useAuth();
  const executions = trpc.workspace.executions.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  return <><ModuleHeader eyebrow="Execution explorer" title="Every run, one lineage." description="Review normalized executions, their originating agent version, and the root cause signals that shaped the outcome." onBackToOverview={onBackToOverview} /><AuthGate><div className="module-list execution-list">{(executions.data ?? []).map((execution) => <article className="module-card" key={execution.id}><div className={`execution-status ${execution.status}`}><GitBranchIcon /></div><div><span className="module-card-kicker">{execution.framework} · {execution.externalId}</span><h3>{execution.rootCause || "Completed execution"}</h3><p>{execution.eventCount} normalized events · {execution.status}</p></div><span className="module-date">{new Date(execution.createdAt).toLocaleDateString()}</span><ArrowRight size={15} /></article>)}{!executions.isLoading && !executions.data?.length && <div className="module-empty"><GitBranchIcon /><p>No saved executions yet. Analyze a trace from Overview to create the first lineage record.</p></div>}</div></AuthGate></>;
}

function GitBranchIcon() { return <Workflow size={17} />; }

export function EvaluationWorkspace({ onBackToOverview }: ModuleProps) {
  const { isAuthenticated } = useAuth();
  const evaluations = trpc.workspace.evaluations.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [rubric, setRubric] = useState("Correctness, groundedness, and trajectory efficiency");
  const utils = trpc.useUtils();
  const create = trpc.workspace.createEvaluation.useMutation({ onSuccess: () => { setName(""); setShowForm(false); utils.workspace.evaluations.invalidate(); } });
  return <><ModuleHeader eyebrow="Evaluation lab" title="Prove quality before deploy." description="Create rubric-driven evaluations and track quality, cost, latency, and trajectory behavior against real runs." action={<button className="analyze-trace" onClick={() => setShowForm((value) => !value)}><Plus size={15} /> New evaluation</button>} onBackToOverview={onBackToOverview} /><AuthGate><div className="evaluation-banner"><div><Sparkles size={17} /><b>Regression gates</b><p>Minimum quality · maximum cost · maximum latency</p></div><span>Ready to configure</span></div>{showForm && <form className="module-form evaluation-form" onSubmit={(event) => { event.preventDefault(); create.mutate({ name, rubric }); }}><div><label>Evaluation name</label><input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Q4 retrieval correctness" required /></div><div><label>Rubric</label><textarea value={rubric} onChange={(event) => setRubric(event.target.value)} /></div><button className="analyze-trace" disabled={create.isPending}>{create.isPending ? "Creating…" : "Create evaluation"} <ArrowRight size={14} /></button></form>}<div className="module-list">{(evaluations.data ?? []).map((evaluation) => <article className="module-card" key={evaluation.id}><div className="module-card-icon evaluation-icon"><Gauge size={17} /></div><div><span className="module-card-kicker">{evaluation.status} · {evaluation.score == null ? "not scored" : `${evaluation.score}/100`}</span><h3>{evaluation.name}</h3><p>{evaluation.rubric}</p></div><span className="module-status">{evaluation.score == null ? "draft" : "scored"}</span><ArrowRight size={15} /></article>)}{!evaluations.isLoading && !evaluations.data?.length && <div className="module-empty"><FlaskConical size={19} /><p>No evaluations yet. Create a rubric to turn trace evidence into a regression gate.</p></div>}</div></AuthGate></>;
}
