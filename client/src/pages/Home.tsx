import { useMemo, useState } from "react";
import ReferenceLanding from "./ReferenceLanding";
import WorkspaceHome from "./WorkspaceHome";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clipboard,
  Clock3,
  Code2,
  Database,
  Download,
  Eye,
  FileJson,
  FileText,
  GitBranch,
  Info,
  LayoutDashboard,
  Link2,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Network,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  Upload,
  X,
  Zap,
} from "lucide-react";

type ScenarioKey = "cascading" | "loop" | "memory";
type TabKey = "report" | "evidence" | "propagation" | "decisions" | "checklist" | "export";

type Node = {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  status: "ok" | "warn" | "error" | "des";
  type: string;
  agent: string;
  detail: string;
};

type Evidence = {
  id: string;
  category: "observable" | "inferred";
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  title: string;
  detail: string;
  ref: string;
};

type Scenario = {
  key: ScenarioKey;
  eyebrow: string;
  title: string;
  short: string;
  description: string;
  des: string;
  desLabel: string;
  desAgent: string;
  confidence: number;
  impact: string;
  evidenceScore: number;
  evidenceCounts: { observable: number; inferred: number };
  spans: number;
  agents: number;
  errors: number;
  traceType: string;
  nodes: Node[];
  edges: [string, string][];
  impactEdges: [string, string][];
  evidence: Evidence[];
  propagation: { stage: string; type: string; agent: string; description: string; degradation: number }[];
  decisions: { priority: "P0" | "P1" | "P2"; title: string; why: string; impact: string; risks: string; effort: string; confidence: string; refs: string[] }[];
  checklist: string[];
};

const scenarios: Record<ScenarioKey, Scenario> = {
  cascading: {
    key: "cascading",
    eyebrow: "SCENARIO 01 · SEMANTIC FAILURE",
    title: "Cascading semantic failure",
    short: "Wrong data, right status codes.",
    description: "A retrieval agent misread the schema and pulled Q3 revenue instead of Q4. Every HTTP request returned 200 — but the meaning was already broken.",
    des: "data-002",
    desLabel: "tool_invocation / sql_query",
    desAgent: "DataRetrieval",
    confidence: 86,
    impact: "7 downstream nodes",
    evidenceScore: 82,
    evidenceCounts: { observable: 5, inferred: 2 },
    spans: 14,
    agents: 4,
    errors: 2,
    traceType: "Native JSON · 14 spans",
    nodes: [
      { id: "plan", label: "plan_task", sub: "Orchestrator", x: 90, y: 210, status: "ok", type: "Planner", agent: "Orchestrator", detail: "Task plan created with Q4 revenue target." },
      { id: "parse", label: "parse_request", sub: "DataRetrieval", x: 250, y: 120, status: "ok", type: "Retriever", agent: "DataRetrieval", detail: "Request parsed. Schema reference was ambiguous." },
      { id: "data-002", label: "sql_query", sub: "DataRetrieval", x: 250, y: 300, status: "des", type: "Tool", agent: "DataRetrieval", detail: "Query returned Q3 revenue against a Q4 target. Hallucination risk 0.85." },
      { id: "format", label: "format_output", sub: "DataRetrieval", x: 420, y: 210, status: "warn", type: "Generator", agent: "DataRetrieval", detail: "Formatted the wrong quarter as a valid result." },
      { id: "receive", label: "receive_data", sub: "Analysis", x: 580, y: 120, status: "warn", type: "Analyzer", agent: "Analysis", detail: "Accepted the result without schema validation." },
      { id: "compute", label: "compute_metrics", sub: "Analysis", x: 580, y: 300, status: "warn", type: "Analyzer", agent: "Analysis", detail: "YoY delta computed against the wrong baseline." },
      { id: "insight", label: "generate_insights", sub: "Analysis", x: 740, y: 210, status: "warn", type: "Analyzer", agent: "Analysis", detail: "Narrative reinforced the false comparison." },
      { id: "draft", label: "draft_report", sub: "Writer", x: 880, y: 120, status: "warn", type: "Generator", agent: "Writer", detail: "Draft inherited the semantic mismatch." },
      { id: "format-doc", label: "format_document", sub: "Writer", x: 880, y: 300, status: "warn", type: "Generator", agent: "Writer", detail: "Final document rendered cleanly." },
      { id: "review", label: "validate_report", sub: "Reviewer", x: 1035, y: 210, status: "error", type: "Validator", agent: "Reviewer", detail: "Reviewer caught Q3/Q4 mismatch after four agents propagated it." },
      { id: "handle", label: "handle_failure", sub: "Orchestrator", x: 1160, y: 210, status: "error", type: "Handler", agent: "Orchestrator", detail: "Failure handler opened a corrective investigation." },
    ],
    edges: [["plan", "parse"], ["plan", "data-002"], ["parse", "format"], ["data-002", "format"], ["format", "receive"], ["format", "compute"], ["receive", "insight"], ["compute", "insight"], ["insight", "draft"], ["insight", "format-doc"], ["draft", "review"], ["format-doc", "review"], ["review", "handle"]],
    impactEdges: [["data-002", "format"], ["format", "compute"], ["compute", "insight"], ["insight", "draft"], ["draft", "review"], ["review", "handle"]],
    evidence: [
      { id: "ev-01", category: "observable", severity: "critical", type: "hallucination_detected", title: "Wrong quarter returned by query", detail: "Output summary contains Q3 revenue while the plan explicitly requests Q4. The span is marked 0.85 hallucination risk.", ref: "data-002 · sql_query" },
      { id: "ev-02", category: "observable", severity: "high", type: "planner_assumption", title: "Schema ambiguity was never resolved", detail: "The retrieval step selected a similarly named column without a schema assertion or validation gate.", ref: "parse · parse_request" },
      { id: "ev-03", category: "observable", severity: "high", type: "cascading_failure", title: "Four agents accepted the semantic error", detail: "Analysis, Writer, and Reviewer consumed the result as valid until the final validation pass.", ref: "receive → validate_report" },
      { id: "ev-04", category: "inferred", severity: "medium", type: "silent_failure", title: "HTTP success masked semantic failure", detail: "No infrastructure signal fired because all tool calls completed with status ok.", ref: "trace-wide · 14 spans" },
      { id: "ev-05", category: "observable", severity: "medium", type: "output_anomaly", title: "Narrative and baseline diverged", detail: "The YoY computation used the wrong baseline, producing a confident but incorrect business insight.", ref: "compute · compute_metrics" },
      { id: "ev-06", category: "inferred", severity: "low", type: "tool_invocation", title: "Missing contract at tool boundary", detail: "A typed query contract would have made the quarter mismatch mechanically rejectable.", ref: "data-002 · sql_query" },
    ],
    propagation: [
      { stage: "Origin", type: "Tool", agent: "DataRetrieval", description: "Q3 selected for a Q4 request; risk 0.85.", degradation: 0 },
      { stage: "Interpretation", type: "Analyzer", agent: "Analysis", description: "Wrong baseline accepted and used in YoY calculation.", degradation: 15 },
      { stage: "Narrative", type: "Generator", agent: "Writer", description: "False insight rendered as a polished report.", degradation: 30 },
      { stage: "Validation", type: "Validator", agent: "Reviewer", description: "Mismatch detected only after downstream propagation.", degradation: 55 },
      { stage: "System failure", type: "Handler", agent: "Orchestrator", description: "Corrective investigation opened; decision already delayed.", degradation: 70 },
    ],
    decisions: [
      { priority: "P0", title: "Add a schema-aware output validation gate", why: "The decisive error occurs at the tool boundary and is observable before any downstream agent runs.", impact: "Blocks quarter mismatches before propagation; expected to remove 7 downstream failures.", risks: "Adds one validation round-trip to retrieval latency.", effort: "1–2 days", confidence: "High", refs: ["ev-01", "ev-02"] },
      { priority: "P1", title: "Require typed query contracts for financial retrieval", why: "A contract can reject semantically valid but contextually wrong queries.", impact: "Reduces silent semantic failures across every reporting workflow.", risks: "Schema changes require contract updates.", effort: "3–5 days", confidence: "High", refs: ["ev-02", "ev-06"] },
      { priority: "P2", title: "Create a trace-based regression fixture", why: "This exact Q3/Q4 mismatch should stay reproducible in CI.", impact: "Catches regressions in retrieval and analysis agents.", risks: "Fixtures need quarterly maintenance.", effort: "1–2 days", confidence: "Medium", refs: ["ev-03", "ev-05"] },
    ],
    checklist: ["Replay the original trace and confirm Q4 is selected", "Verify output schema rejects an incorrect quarter", "Run the known-good Q4 regression fixture", "Confirm downstream agents receive typed, validated data", "Test ambiguous schema labels and near-match columns", "Deploy with semantic-failure monitoring enabled"],
  },
  loop: {
    key: "loop",
    eyebrow: "SCENARIO 02 · NON-CONVERGING LOOP",
    title: "Infinite review loop",
    short: "Every fix creates a new nitpick.",
    description: "Coder and reviewer agents entered a non-converging loop. Six iterations burned 4,500 tokens before budget exhaustion, with every HTTP request still healthy.",
    des: "r-001",
    desLabel: "review / first review",
    desAgent: "Reviewer",
    confidence: 94,
    impact: "9 downstream nodes",
    evidenceScore: 91,
    evidenceCounts: { observable: 6, inferred: 1 },
    spans: 18,
    agents: 2,
    errors: 1,
    traceType: "LangSmith · 18 runs",
    nodes: [
      { id: "task", label: "write_code", sub: "Coder", x: 100, y: 210, status: "ok", type: "Generator", agent: "Coder", detail: "Initial implementation completed." },
      { id: "r-001", label: "review_01", sub: "Reviewer", x: 285, y: 210, status: "des", type: "Validator", agent: "Reviewer", detail: "First review introduces open-ended nitpick loop." },
      { id: "fix-01", label: "fix_error", sub: "Coder", x: 470, y: 125, status: "warn", type: "Generator", agent: "Coder", detail: "Error handling added." },
      { id: "r-002", label: "review_02", sub: "Reviewer", x: 470, y: 295, status: "warn", type: "Validator", agent: "Reviewer", detail: "Type refinement requested." },
      { id: "fix-02", label: "fix_type", sub: "Coder", x: 655, y: 125, status: "warn", type: "Generator", agent: "Coder", detail: "Type refined; no convergence check." },
      { id: "r-003", label: "review_03", sub: "Reviewer", x: 655, y: 295, status: "warn", type: "Validator", agent: "Reviewer", detail: "Docstring requested." },
      { id: "fix-03", label: "add_docs", sub: "Coder", x: 840, y: 125, status: "warn", type: "Generator", agent: "Coder", detail: "Documentation expanded." },
      { id: "r-004", label: "review_04", sub: "Reviewer", x: 840, y: 295, status: "warn", type: "Validator", agent: "Reviewer", detail: "Comments requested to be removed." },
      { id: "r-005", label: "review_05", sub: "Reviewer", x: 1025, y: 210, status: "error", type: "Validator", agent: "Reviewer", detail: "Budget exhaustion imminent." },
    ],
    edges: [["task", "r-001"], ["r-001", "fix-01"], ["fix-01", "r-002"], ["r-002", "fix-02"], ["fix-02", "r-003"], ["r-003", "fix-03"], ["fix-03", "r-004"], ["r-004", "r-005"], ["r-005", "r-001"]],
    impactEdges: [["r-001", "fix-01"], ["fix-01", "r-002"], ["r-002", "fix-02"], ["fix-02", "r-003"], ["r-003", "fix-03"], ["fix-03", "r-004"], ["r-004", "r-005"]],
    evidence: [
      { id: "ev-01", category: "observable", severity: "critical", type: "loop_pattern", title: "Same reviewer/coder pair repeated 6 times", detail: "The same (agent, operation) pair recurs without a convergence signal or diminishing return check.", ref: "r-001 → r-005" },
      { id: "ev-02", category: "observable", severity: "high", type: "output_anomaly", title: "Each review introduces a new nitpick", detail: "Review outputs alternate between mutually incompatible requests instead of closing the task.", ref: "review_01 … review_05" },
      { id: "ev-03", category: "observable", severity: "high", type: "cascading_failure", title: "4,500 tokens burned before budget exhaustion", detail: "Token spend accumulates in the detected loop cycle and leaves no budget for a final validator.", ref: "trace metrics · 4,500 tokens" },
      { id: "ev-04", category: "inferred", severity: "medium", type: "silent_failure", title: "No convergence contract exists", detail: "The orchestrator has no objective definition of done beyond reviewer approval.", ref: "orchestrator policy" },
      { id: "ev-05", category: "observable", severity: "medium", type: "tool_invocation", title: "Every iteration completed successfully", detail: "Infrastructure health remained green while the workflow was functionally stuck.", ref: "trace-wide · 18 runs" },
    ],
    propagation: [
      { stage: "Origin", type: "Validator", agent: "Reviewer", description: "First review opens an unbounded critique loop.", degradation: 0 },
      { stage: "Iteration", type: "Generator", agent: "Coder", description: "Coder fixes each nit without measuring progress.", degradation: 15 },
      { stage: "Re-review", type: "Validator", agent: "Reviewer", description: "New nitpick replaces the prior acceptance condition.", degradation: 30 },
      { stage: "Budget", type: "Handler", agent: "Orchestrator", description: "4,500 tokens consumed with no accepted artifact.", degradation: 62 },
      { stage: "System failure", type: "Handler", agent: "Orchestrator", description: "Budget exhausted; task exits without a reliable result.", degradation: 84 },
    ],
    decisions: [
      { priority: "P0", title: "Add convergence detection and an iteration cap", why: "The first review is the earliest node whose correction would eliminate the entire downstream cycle.", impact: "Stops non-converging review loops and protects token budgets.", risks: "A hard cap can terminate a legitimately complex review early.", effort: "1–2 days", confidence: "High", refs: ["ev-01", "ev-03"] },
      { priority: "P1", title: "Define an explicit reviewer acceptance contract", why: "The reviewer must evaluate against stable criteria, not generate fresh style preferences.", impact: "Makes completion measurable and replayable.", risks: "Teams must agree on what done means.", effort: "3–5 days", confidence: "High", refs: ["ev-02", "ev-04"] },
      { priority: "P2", title: "Track diminishing returns per iteration", why: "Token burn without material diff improvement is a leading indicator of a loop.", impact: "Adds early warning before budget exhaustion.", risks: "Diff scoring adds instrumentation complexity.", effort: "1–2 weeks", confidence: "Medium", refs: ["ev-03", "ev-05"] },
    ],
    checklist: ["Verify reviewer stops after an accepted artifact", "Test loop termination at the configured iteration cap", "Confirm token budget is not exhausted", "Replay a known-good review with two iterations", "Test a review with contradictory nitpicks", "Alert when diff improvement falls below threshold"],
  },
  memory: {
    key: "memory",
    eyebrow: "SCENARIO 03 · CROSS-SESSION MEMORY",
    title: "Cross-session memory poisoning",
    short: "One false fact, fifteen sessions later.",
    description: "A researcher hallucinated that drug XR-7 was FDA approved and wrote it to persistent memory. Fifteen sessions later, an advisor recommended it to a patient.",
    des: "s1-synth",
    desLabel: "synthesis / researcher",
    desAgent: "Researcher",
    confidence: 63,
    impact: "2+ downstream nodes",
    evidenceScore: 68,
    evidenceCounts: { observable: 4, inferred: 3 },
    spans: 11,
    agents: 3,
    errors: 1,
    traceType: "Langfuse · 11 observations",
    nodes: [
      { id: "s1-retr", label: "retrieve_papers", sub: "Researcher", x: 100, y: 210, status: "ok", type: "Retriever", agent: "Researcher", detail: "Phase 3 trial papers retrieved." },
      { id: "s1-synth", label: "synthesize", sub: "Researcher", x: 300, y: 210, status: "des", type: "Generator", agent: "Researcher", detail: "FDA approval hallucinated from trial completion signal." },
      { id: "s1-write", label: "memory_write", sub: "Researcher", x: 500, y: 210, status: "error", type: "Memory", agent: "Researcher", detail: "Unverified approval claim written to persistent memory." },
      { id: "s15-read", label: "memory_read", sub: "Advisor", x: 700, y: 210, status: "warn", type: "Memory", agent: "Advisor", detail: "Poisoned key retrieved across session boundary." },
      { id: "advise", label: "recommend", sub: "Advisor", x: 900, y: 210, status: "warn", type: "Generator", agent: "Advisor", detail: "Unapproved drug recommendation composed." },
      { id: "compliance", label: "compliance_check", sub: "Compliance", x: 1090, y: 210, status: "error", type: "Validator", agent: "Compliance", detail: "Approval status mismatch caught before action." },
    ],
    edges: [["s1-retr", "s1-synth"], ["s1-synth", "s1-write"], ["s1-write", "s15-read"], ["s15-read", "advise"], ["advise", "compliance"]],
    impactEdges: [["s1-synth", "s1-write"], ["s1-write", "s15-read"], ["s15-read", "advise"], ["advise", "compliance"]],
    evidence: [
      { id: "ev-01", category: "observable", severity: "critical", type: "hallucination_detected", title: "Approval status contradicted source material", detail: "The synthesis maps Phase 3 completion to FDA approval, a materially different regulatory state.", ref: "s1-synth · synthesize" },
      { id: "ev-02", category: "observable", severity: "critical", type: "memory_write", title: "Unverified claim persisted", detail: "The hallucinated statement was written to a durable key with no confidence gate.", ref: "s1-write · memory_write" },
      { id: "ev-03", category: "observable", severity: "high", type: "memory_read", title: "Poisoned key read 15 sessions later", detail: "Lineage connects the original write to the advisor's later read across sessions.", ref: "s15-read · memory_read" },
      { id: "ev-04", category: "observable", severity: "high", type: "cascading_failure", title: "Advisor used memory in a patient recommendation", detail: "The stale memory became an input to a high-consequence decision.", ref: "advise · recommend" },
      { id: "ev-05", category: "inferred", severity: "medium", type: "silent_failure", title: "Memory freshness was trusted by default", detail: "No source citation, expiry, or approval-status recheck was required on read.", ref: "cross-session lineage" },
    ],
    propagation: [
      { stage: "Origin", type: "Generator", agent: "Researcher", description: "Phase 3 completion misrepresented as approval.", degradation: 0 },
      { stage: "Persistence", type: "Memory", agent: "Researcher", description: "Claim written without confidence or citation gate.", degradation: 18 },
      { stage: "Retrieval", type: "Memory", agent: "Advisor", description: "Poisoned key retrieved across fifteen sessions.", degradation: 35 },
      { stage: "Decision", type: "Generator", agent: "Advisor", description: "Recommendation treated memory as verified fact.", degradation: 58 },
      { stage: "System failure", type: "Validator", agent: "Compliance", description: "Compliance caught risk before external action.", degradation: 72 },
    ],
    decisions: [
      { priority: "P0", title: "Gate persistent memory writes by confidence and citation", why: "The earliest causal break is the hallucinated synthesis before the durable write.", impact: "Prevents unverified claims from surviving across sessions.", risks: "Research workflows may need a human or verifier fallback.", effort: "3–5 days", confidence: "High", refs: ["ev-01", "ev-02"] },
      { priority: "P1", title: "Purge the poisoned XR-7 memory key and add lineage", why: "The contaminated value is still reachable by downstream advisors.", impact: "Removes current exposure and makes future reads auditable.", risks: "Purge may remove useful context if key selection is too broad.", effort: "1–2 days", confidence: "High", refs: ["ev-02", "ev-03"] },
      { priority: "P2", title: "Re-verify regulatory claims on high-consequence reads", why: "A read-time check limits the blast radius of stale or poisoned memory.", impact: "Adds defense in depth for medical and compliance workflows.", risks: "Adds latency and verification cost.", effort: "1–2 weeks", confidence: "Medium", refs: ["ev-04", "ev-05"] },
    ],
    checklist: ["Purge the XR-7 approval key and confirm lineage is closed", "Verify memory writes require citation and confidence", "Replay a known-good Phase 3 research session", "Confirm advisor rejects unverified approval claims", "Test stale memory expiry and source refresh", "Audit other regulatory keys written by the same agent"],
  },
};

const statusColor = (status: Node["status"]) => {
  if (status === "des" || status === "error") return "#dc2626";
  if (status === "warn") return "#d97706";
  return "#059669";
};

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-mark">404</span>
      {!compact && <span className="brand-name">AI</span>}
    </div>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "red" | "amber" | "green" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function ScenarioCard({ scenario, active, onClick }: { scenario: Scenario; active: boolean; onClick: () => void }) {
  const Icon = scenario.key === "cascading" ? Network : scenario.key === "loop" ? RotateCcw : Database;
  return (
    <button className={`scenario-card ${active ? "active" : ""}`} onClick={onClick}>
      <span className="scenario-icon"><Icon size={18} /></span>
      <span className="scenario-copy"><span className="scenario-kicker">{scenario.eyebrow.split(" · ")[1]}</span><strong>{scenario.title}</strong><span>{scenario.short}</span></span>
      <ChevronRight size={16} className="scenario-arrow" />
    </button>
  );
}

function GraphCanvas({ scenario, selectedNode, onSelect }: { scenario: Scenario; selectedNode: string; onSelect: (id: string) => void }) {
  const nodeMap = useMemo(() => Object.fromEntries(scenario.nodes.map((node) => [node.id, node])), [scenario.nodes]);
  const width = 1270;
  const height = 430;
  return (
    <div className="graph-shell">
      <div className="graph-toolbar"><span><span className="live-dot" /> LIVE TRACE VIEW</span><span className="graph-hint"><span className="graph-legend"><i className="legend-dot legend-ok" /> healthy</span><span className="graph-legend"><i className="legend-dot legend-warn" /> impacted</span><span className="graph-legend"><i className="legend-dot legend-des" /> DES / root cause</span></span><button className="icon-button" aria-label="Graph settings"><Settings2 size={15} /></button></div>
      <div className="graph-canvas">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Execution graph">
          <defs>
            <pattern id="dot-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#e5e7eb" /></pattern>
            <filter id="des-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>
          <rect width={width} height={height} fill="url(#dot-grid)" />
          {scenario.edges.map(([from, to]) => {
            const a = nodeMap[from]; const b = nodeMap[to]; if (!a || !b) return null;
            const impact = scenario.impactEdges.some(([x, y]) => x === from && y === to);
            return <line key={`${from}-${to}`} x1={a.x + 56} y1={a.y} x2={b.x - 8} y2={b.y} className={`graph-edge ${impact ? "impact" : ""}`} markerEnd={impact ? "url(#arrow-impact)" : undefined} />;
          })}
          <defs><marker id="arrow-impact" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#d97706" /></marker></defs>
          {scenario.nodes.map((node) => {
            const selected = selectedNode === node.id;
            const color = statusColor(node.status);
            return (
              <g key={node.id} className={`graph-node ${selected ? "selected" : ""}`} onClick={() => onSelect(node.id)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(node.id); }}>
                {node.status === "des" && <rect x={node.x - 12} y={node.y - 44} width="126" height="88" rx="12" fill="none" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.72" filter="url(#des-glow)" />}
                <rect x={node.x} y={node.y - 32} width="110" height="64" rx="8" fill={node.status === "error" || node.status === "des" ? "#fff5f5" : node.status === "warn" ? "#fffbeb" : "#ffffff"} stroke={selected ? "#6e4aff" : color} strokeWidth={selected ? 2.5 : 1.4} />
                <circle cx={node.x + 15} cy={node.y - 14} r="4" fill={color} />
                <text x={node.x + 26} y={node.y - 10} fontSize="10" fontWeight="700" fill="#111827">{node.label}</text>
                <text x={node.x + 12} y={node.y + 10} fontSize="9.5" fill="#6b7280">{node.sub}</text>
                <text x={node.x + 12} y={node.y + 24} fontSize="8.5" fill={color}>{node.status === "des" ? "DECISIVE ERROR" : node.status.toUpperCase()}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="graph-footer"><span><GitBranch size={14} /> 1 connected execution graph</span><span>Drag to pan · scroll to zoom · click a node to inspect</span><button className="text-button"><Eye size={14} /> Fit graph</button></div>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><div><strong>{score}</strong><span>/ 100</span></div></div>;
}

function EvidenceItem({ item, onSelect }: { item: Evidence; onSelect?: () => void }) {
  return <button className="evidence-item" onClick={onSelect}><div className="evidence-top"><Badge tone={item.severity === "critical" ? "red" : item.severity === "high" ? "amber" : "neutral"}>{item.severity}</Badge><Badge tone={item.category === "observable" ? "blue" : "neutral"}>{item.category}</Badge><span className="evidence-type">{item.type.replaceAll("_", " ")}</span></div><strong>{item.title}</strong><p>{item.detail}</p><span className="trace-ref"><Code2 size={12} /> {item.ref}</span></button>;
}

function ReportTab({ scenario, setTab, setSelectedNode }: { scenario: Scenario; setTab: (tab: TabKey) => void; setSelectedNode: (id: string) => void }) {
  return <div className="tab-content report-content">
    <div className="des-card"><div className="des-top"><div><span className="section-eyebrow">DECISIVE ERROR STEP</span><h2>{scenario.des}</h2><p>{scenario.desLabel} · <b>{scenario.desAgent}</b></p></div><div className="des-pulse"><Target size={18} /><span>root cause</span></div></div><p className="des-summary">{scenario.key === "cascading" ? "A semantically incorrect retrieval result passed through the system as a valid response. The failure is causal, not chronological." : scenario.key === "loop" ? "The first review created an unbounded loop. Every downstream iteration is a consequence of missing convergence criteria." : "The hallucinated synthesis was persisted before verification, turning a local research error into a cross-session decision risk."}</p><div className="des-meta"><div><span>Agent</span><strong>{scenario.desAgent}</strong></div><div><span>Impact</span><strong>{scenario.impact}</strong></div><div><span>Confidence</span><strong className="red-text">{scenario.confidence}%</strong></div></div></div>
    <div className="report-two-col"><div className="mini-card evidence-score"><div className="mini-card-head"><div><span className="section-eyebrow">EVIDENCE SCORE</span><strong>Observable support</strong></div><Info size={15} /></div><div className="score-row"><ScoreRing score={scenario.evidenceScore} /><p>Strong evidence supports this attribution. <b>{scenario.evidenceCounts.observable} observable</b> and <b>{scenario.evidenceCounts.inferred} inferred</b> signals were used.</p></div><div className="score-bar"><span style={{ width: `${scenario.evidenceScore}%` }} /></div></div><div className="mini-card action-card"><div className="mini-card-head"><div><span className="section-eyebrow">TOP ACTION · P0</span><strong>{scenario.decisions[0].title}</strong></div><Badge tone="green">{scenario.decisions[0].confidence}</Badge></div><p>{scenario.decisions[0].impact}</p><button className="link-button" onClick={() => setTab("decisions")}>View ranked decisions <ArrowRight size={14} /></button></div></div>
    <div className="subsection-head"><div><span className="section-eyebrow">AGENT TRUST</span><strong>Reliability by agent</strong></div><span className="muted">Derived from error rate, hallucination risk, and root-cause penalty</span></div>
    <div className="trust-list">{(scenario.key === "cascading" ? [["DataRetrieval", 28], ["Analysis", 67], ["Writer", 71], ["Reviewer", 88]] : scenario.key === "loop" ? [["Reviewer", 34], ["Coder", 61]] : [["Researcher", 22], ["Advisor", 54], ["Compliance", 94]]).map(([name, score]) => <div className="trust-row" key={name as string}><span>{name}</span><div className="trust-track"><span className={Number(score) > 70 ? "trust-good" : Number(score) > 40 ? "trust-mid" : "trust-low"} style={{ width: `${score}%` }} /></div><strong>{score}%</strong></div>)}</div>
    <div className="subsection-head evidence-head"><div><span className="section-eyebrow">SUPPORTING EVIDENCE</span><strong>Why this was selected</strong></div><button className="link-button" onClick={() => setTab("evidence")}>View all {scenario.evidence.length} <ArrowRight size={14} /></button></div>
    <div className="evidence-preview">{scenario.evidence.slice(0, 3).map((item) => <EvidenceItem key={item.id} item={item} onSelect={() => { setTab("evidence"); setSelectedNode(item.ref.split(" ")[0]); }} />)}</div>
  </div>;
}

function EvidenceTab({ scenario, setSelectedNode }: { scenario: Scenario; setSelectedNode: (id: string) => void }) {
  return <div className="tab-content"><div className="tab-intro"><div><span className="section-eyebrow">EVIDENCE PANEL</span><h2>Trace-backed attribution</h2><p>Every item below references an observable span or an explicitly marked inference. Nothing is invented outside the trace.</p></div><div className="evidence-counts"><span><b>{scenario.evidenceCounts.observable}</b> observable</span><span><b>{scenario.evidenceCounts.inferred}</b> inferred</span></div></div><div className="evidence-list">{scenario.evidence.map((item) => <EvidenceItem key={item.id} item={item} onSelect={() => setSelectedNode(item.ref.split(" ")[0])} />)}</div></div>;
}

function PropagationTab({ scenario }: { scenario: Scenario }) {
  return <div className="tab-content"><div className="tab-intro"><div><span className="section-eyebrow">FAILURE PROPAGATION GRAPH</span><h2>How the failure spread</h2><p>Impact chain traced forward from the DES with 15% degradation per hop.</p></div><Badge tone="amber">{scenario.impact}</Badge></div><div className="propagation-flow">{scenario.propagation.map((step, index) => <div className="propagation-step" key={step.stage}><div className={`propagation-node ${index === 0 ? "origin" : index === scenario.propagation.length - 1 ? "terminal" : ""}`}><span>{String(index + 1).padStart(2, "0")}</span></div><div className="propagation-copy"><div className="propagation-label"><Badge tone={index === 0 ? "red" : index === scenario.propagation.length - 1 ? "red" : "amber"}>{step.type}</Badge><span>{step.agent}</span><b>{step.degradation === 0 ? "origin" : `−${step.degradation}% fidelity`}</b></div><strong>{step.stage}</strong><p>{step.description}</p></div>{index < scenario.propagation.length - 1 && <div className="propagation-line" />}</div>)}</div></div>;
}

function DecisionsTab({ scenario }: { scenario: Scenario }) {
  return <div className="tab-content"><div className="tab-intro"><div><span className="section-eyebrow">DECISION REPORT</span><h2>Ranked engineering actions</h2><p>Recommendations are generated from the failure type and linked back to the supporting evidence.</p></div><Badge tone="green">3 actions</Badge></div><div className="decision-list">{scenario.decisions.map((decision) => <article className="decision-card" key={decision.title}><div className="decision-marker"><strong>{decision.priority}</strong><span>{decision.effort}</span></div><div className="decision-body"><div className="decision-title"><h3>{decision.title}</h3><Badge tone={decision.confidence === "High" ? "green" : "amber"}>{decision.confidence} confidence</Badge></div><p>{decision.why}</p><div className="decision-grid"><div><span>Expected impact</span><strong>{decision.impact}</strong></div><div><span>Potential risk</span><strong>{decision.risks}</strong></div></div><div className="decision-refs"><span>Evidence refs</span>{decision.refs.map((ref) => <Badge key={ref} tone="blue">{ref}</Badge>)}</div></div></article>)}</div></div>;
}

function ChecklistTab({ scenario }: { scenario: Scenario }) {
  const [done, setDone] = useState<string[]>(scenario.checklist.slice(0, 2));
  const toggle = (item: string) => setDone((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item]);
  return <div className="tab-content"><div className="tab-intro"><div><span className="section-eyebrow">VALIDATION CHECKLIST</span><h2>Prove the fix before shipping</h2><p>Interactive post-fix checks generated for this failure type.</p></div><div className="check-progress"><b>{done.length}/{scenario.checklist.length}</b><span>completed</span></div></div><div className="checklist">{scenario.checklist.map((item, index) => <button className={`check-row ${done.includes(item) ? "checked" : ""}`} key={item} onClick={() => toggle(item)}><span className="check-box">{done.includes(item) && <Check size={14} />}</span><span><b>{String(index + 1).padStart(2, "0")}</b>{item}</span><ChevronRight size={14} /></button>)}</div></div>;
}

function ExportTab({ scenario }: { scenario: Scenario }) {
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const report = `# 404 AI Decision Report\n\n## Failure summary\n${scenario.description}\n\n## Decisive Error Step\n${scenario.des} — ${scenario.desLabel} (${scenario.desAgent})\n\nConfidence: ${scenario.confidence}%\nEvidence score: ${scenario.evidenceScore}/100\nImpact: ${scenario.impact}\n\n## Root cause\n${scenario.evidence[0].detail}\n\n## Recommended actions\n${scenario.decisions.map((d) => `- ${d.priority}: ${d.title} (${d.effort})`).join("\n")}\n\n## Validation checklist\n${scenario.checklist.map((item) => `- [ ] ${item}`).join("\n")}`;
  const copy = async () => { await navigator.clipboard?.writeText(report); };
  const download = () => { const blob = new Blob([report], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `404-ai-${scenario.key}-decision-report.md`; anchor.click(); URL.revokeObjectURL(url); };
  return <div className="tab-content export-content"><div className="tab-intro"><div><span className="section-eyebrow">ENGINEERING SUMMARY</span><h2>Shareable decision report</h2><p>Export the investigation as a clean Markdown artifact for your incident channel or review doc.</p></div><div className="export-actions"><button className="secondary-button" onClick={copy}><Clipboard size={15} /> Copy</button><button className="primary-button small" onClick={download}><Download size={15} /> Download .md</button></div></div><pre className="report-preview">{report}</pre><div className="feedback"><div><span className="section-eyebrow">FEEDBACK LOOP</span><strong>Was this diagnosis helpful?</strong></div><div className="feedback-actions"><button className={feedback === "correct" ? "feedback-selected good" : ""} onClick={() => setFeedback("correct")}><CheckCircle2 size={16} /> Correct</button><button className={feedback === "incorrect" ? "feedback-selected bad" : ""} onClick={() => setFeedback("incorrect")}><AlertTriangle size={16} /> Incorrect</button></div>{feedback === "incorrect" && <textarea className="feedback-input" placeholder="What was the actual cause? This helps calibrate future diagnoses." />}</div></div>;
}

function NodeInspector({ scenario, nodeId }: { scenario: Scenario; nodeId: string }) {
  const node = scenario.nodes.find((item) => item.id === nodeId);
  if (!node) return null;
  const color = statusColor(node.status);
  return <div className="node-inspector"><div className="inspector-title"><div><span className="section-eyebrow">SELECTED SPAN</span><strong>{node.id}</strong></div><Badge tone={node.status === "ok" ? "green" : node.status === "warn" ? "amber" : "red"}>{node.status === "des" ? "DES" : node.status}</Badge></div><div className="inspector-grid"><div><span>Operation</span><strong>{node.label}</strong></div><div><span>Agent</span><strong>{node.agent}</strong></div><div><span>Node type</span><strong>{node.type}</strong></div><div><span>Signal</span><strong style={{ color }}>{node.status === "des" ? "Hallucination risk 0.85" : node.status === "error" ? "Downstream failure" : node.status === "warn" ? "Impact propagated" : "No anomaly"}</strong></div></div><p>{node.detail}</p><button className="link-button"><Link2 size={14} /> Open raw span</button></div>;
}

function Debugger({ scenario, onBack, onScenarioChange }: { scenario: Scenario; onBack: () => void; onScenarioChange: (key: ScenarioKey) => void }) {
  const [tab, setTab] = useState<TabKey>("report");
  const [selectedNode, setSelectedNode] = useState(scenario.des);
  const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard }[] = [{ key: "report", label: "Report", icon: LayoutDashboard }, { key: "evidence", label: "Evidence", icon: ShieldCheck }, { key: "propagation", label: "Propagation", icon: Network }, { key: "decisions", label: "Decisions", icon: Zap }, { key: "checklist", label: "Checklist", icon: ListChecks }, { key: "export", label: "Export", icon: Download }];
  return <div className="app-shell debugger-shell"><header className="topbar debugger-topbar"><div className="topbar-left"><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> All traces</button><span className="topbar-divider" /><Logo compact /><span className="crumb">/ <b>{scenario.title}</b></span></div><div className="topbar-right"><Badge tone="green"><span className="status-dot" /> Analysis complete</Badge><button className="icon-button"><Search size={16} /></button><button className="avatar">AM</button></div></header><main className="debugger-main"><section className="graph-column"><div className="trace-header"><div><div className="trace-kicker"><span className="live-dot" /> INVESTIGATION · {scenario.traceType}</div><h1>{scenario.title}</h1><p>{scenario.description}</p></div><div className="trace-actions"><button className="secondary-button"><Upload size={15} /> Upload another</button><button className="icon-button bordered"><MoreDots /></button></div></div><div className="stats-strip"><div><span>Spans</span><strong>{scenario.spans}</strong></div><div><span>Agents</span><strong>{scenario.agents}</strong></div><div><span>Errors</span><strong className="red-text">{scenario.errors}</strong></div><div><span>Tokens</span><strong>{scenario.key === "loop" ? "4.5k" : scenario.key === "memory" ? "2.8k" : "6.2k"}</strong></div><div><span>Run time</span><strong>&lt;100ms</strong></div><div className="stats-context"><span>Last analyzed</span><strong>Today, 14:32:08 UTC</strong></div></div><GraphCanvas scenario={scenario} selectedNode={selectedNode} onSelect={setSelectedNode} /><NodeInspector scenario={scenario} nodeId={selectedNode} /></section><aside className="report-column"><div className="report-column-head"><div><span className="section-eyebrow">CAUSAL INTELLIGENCE REPORT</span><strong>Decision report</strong></div><button className="icon-button"><ChevronDown size={16} /></button></div><nav className="report-tabs" aria-label="Report sections">{tabs.map(({ key, label, icon: Icon }) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}><Icon size={14} />{label}{key === "evidence" && <span className="tab-count">{scenario.evidence.length}</span>}</button>)}</nav><div className="report-scroll">{tab === "report" && <ReportTab scenario={scenario} setTab={setTab} setSelectedNode={setSelectedNode} />}{tab === "evidence" && <EvidenceTab scenario={scenario} setSelectedNode={setSelectedNode} />}{tab === "propagation" && <PropagationTab scenario={scenario} />}{tab === "decisions" && <DecisionsTab scenario={scenario} />}{tab === "checklist" && <ChecklistTab scenario={scenario} />}{tab === "export" && <ExportTab scenario={scenario} />}</div></aside></main><div className="scenario-switcher"><span className="section-eyebrow">SWITCH TRACE</span><div className="switch-buttons">{Object.values(scenarios).map((item) => <button className={item.key === scenario.key ? "active" : ""} key={item.key} onClick={() => { onScenarioChange(item.key); setSelectedNode(item.des); setTab("report"); }}>{item.key === "cascading" ? "Semantic failure" : item.key === "loop" ? "Review loop" : "Memory poisoning"}</button>)}</div></div></div>;
}

function MoreDots() { return <span className="more-dots"><i /><i /><i /></span>; }

export default function Home() {
  const [mode, setMode] = useState<"landing" | "workspace" | "debugger">("landing");
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>("cascading");
  const [trace, setTrace] = useState("");
  const scenario = scenarios[scenarioKey];
  const openWorkspace = () => { setMode("workspace"); };
  const analyze = (input?: string) => { if (input) setTrace(input); setMode("debugger"); };
  if (mode === "debugger") return <Debugger scenario={scenario} onBack={() => setMode("workspace")} onScenarioChange={setScenarioKey} />;
  if (mode === "workspace") return <WorkspaceHome onBack={() => setMode("landing")} onAnalyze={analyze} />;
  return <ReferenceLanding onStart={openWorkspace} />;
}
