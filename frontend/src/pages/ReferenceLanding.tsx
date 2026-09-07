import { useState } from "react";
import { ArrowUpRight, Play, RotateCcw, ScanSearch } from "lucide-react";

type Props = {
  onRunTrace: (trace: any) => void;
  samples: Record<string, any>;
  loading?: boolean;
  onStart?: () => void;
};

const steps = [
  ["01", "Ingest the run", "Bring in OpenTelemetry spans from LangGraph, CrewAI, or AutoGen without changing the workflow you are debugging.", "span / tool_call / memory"],
  ["02", "See the causal graph", "Agent steps, tool calls, memory operations, and downstream effects become one Multi-Agent Cognitive Execution Graph.", "MACEG / structure"],
  ["03", "Traverse the failure", "Counterfactual Causal Traversal backtracks to the earliest Decisive Error Step, then tests whether a correction changes the outcome.", "CCT / DES"],
  ["04", "Replay the branch", "Snapshot state at span boundaries and replay with controlled seeds, temperatures, and mocked tool outputs.", "replay / controlled"],
];

const INITIAL_JSON = `[
  {
    "span_id": "orch-001",
    "parent_span_id": null,
    "agent": "Orchestrator"
  }
]`;

export default function ReferenceLanding({ onRunTrace, samples, loading = false, onStart }: Props) {
  const [input, setInput] = useState(INITIAL_JSON);
  const [err, setErr] = useState<string | null>(null);

  const scrollToTrace = () => {
    if (onStart) {
      onStart();
    } else {
      const el = document.getElementById("trace-input");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSeeHowItWorks = (e?: React.MouseEvent) => {
    if (onStart) {
      if (e) e.preventDefault();
      onStart();
    }
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    setErr(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(input);
      } catch {
        parsed = input;
      }
      onRunTrace(parsed);
    } catch (e: any) {
      setErr(e.message || "Failed to parse trace data");
    }
  };

  return (
    <div className="reference-site" id="top">
      <header className="reference-nav">
        <a className="reference-logo" href="#top" aria-label="HETU home">
          <span className="hetu-brand">HETU</span>
        </a>
        <nav>
          <a href="#graph">Product</a>
          <a href="#workflow" onClick={handleSeeHowItWorks}>How it works</a>
          <a href="#replay">Replay</a>
        </nav>
        <button className="reference-nav-cta" onClick={scrollToTrace}>
          Start using HETU <ArrowUpRight size={14} />
        </button>
      </header>
      <main>
        <section className="reference-hero">
          <span className="reference-eyebrow">
            <i /> Debugger for multi-agent systems
          </span>
          <h1>Find the decisive step.</h1>
          <p>See what broke. Replay the fix.</p>
          <div className="reference-hero-actions">
            <button className="violet-button" onClick={scrollToTrace}>
              Start using HETU <ArrowUpRight size={14} />
            </button>
            <a className="plain-link" href="#workflow" onClick={handleSeeHowItWorks}>
              See how it works <ArrowUpRight size={14} />
            </a>
          </div>
          <span className="hero-index">HETU / 01 &nbsp;&nbsp; FIND THE CAUSE. FIX THE BRANCH.</span>
        </section>

        <section className="reference-stats" id="graph">
          <div className="reference-section-label">
            <span>
              <i /> What changes
            </span>
            <p>From a long trace to one defensible next move.</p>
          </div>
          <div className="reference-stat">
            <strong>3</strong>
            <b>framework starting points</b>
            <small>LangGraph · CrewAI · AutoGen</small>
          </div>
          <div className="reference-stat">
            <strong>1</strong>
            <b>decisive error step</b>
            <small>earliest causal break</small>
          </div>
          <div className="reference-stat">
            <strong>4</strong>
            <b>moves from failure to fix</b>
            <small>ingest · graph · traverse · replay</small>
          </div>
        </section>

        <section className="diagnosis-section">
          <div className="reference-section-label">
            <span>
              <i /> The diagnosis
            </span>
          </div>
          <div className="diagnosis-grid">
            <div>
              <h2>A failed run is not the diagnosis.</h2>
              <p>
                Observability can show what happened. HETU follows the causal chain to the earliest step whose correction could change the outcome.
              </p>
            </div>
            <div className="trace-card">
              <div className="trace-card-head">
                <span>TRACE / 8F3A2D</span>
                <span className="trace-failed">failed</span>
              </div>
              <div className="trace-lines">
                <div>
                  <span className="trace-dot good" /> agent / planner <b>plan_task</b>
                </div>
                <div>
                  <span className="trace-dot good" /> tool / retrieval <b>parse_request</b>
                </div>
                <div className="trace-highlight">
                  <span className="trace-dot bad" /> decisive error <b>span_42 · Q3 instead of Q4</b>
                </div>
                <div>
                  <span className="trace-dot warn" /> downstream / analysis <b>propagated</b>
                </div>
                <div>
                  <span className="trace-dot bad" /> system / reviewer <b>caught late</b>
                </div>
              </div>
              <div className="trace-card-foot">
                SIGNAL / EARLIEST BREAK{" "}
                <span>
                  <ScanSearch size={13} /> DES identified
                </span>
              </div>
            </div>
          </div>
          <div className="diagnosis-copy">
            <span className="reference-eyebrow small">Make the signal legible.</span>
            <p>
              See the agent, tool call, memory state, deviation, and downstream impact that support a suspected decisive step. The graph is the explanation, not another log view.
            </p>
            <button className="plain-link" onClick={scrollToTrace}>
              Inspect the workflow <ArrowUpRight size={14} />
            </button>
          </div>
        </section>



        <section className="workflow-section" id="workflow">
          <div className="reference-section-label">
            <span>
              <i /> How it works
            </span>
          </div>
          <div className="workflow-head">
            <h2>
              Trace the cause.
              <br />
              <em>Test the fix.</em>
            </h2>
            <p>A debugging workflow built for systems where one small reasoning step can shape everything downstream.</p>
          </div>
          <div className="workflow-grid">
            {steps.map(([number, title, body, tag]) => (
              <article className={number === "03" ? "workflow-step active" : "workflow-step"} key={number}>
                <span className="step-number">{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <small>{tag}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="replay-section" id="replay">
          <div className="reference-section-label">
            <span>
              <i /> Deterministic control
            </span>
          </div>
          <div className="replay-grid">
            <div>
              <h2>
                When the fix matters,
                <br />
                <em>replay it.</em>
              </h2>
              <p>Snapshot state at span boundaries. Reinject the same context. Change one variable. See whether the branch recovers.</p>
              <button className="plain-link" onClick={scrollToTrace}>
                Replay a branch <ArrowUpRight size={14} />
              </button>
            </div>
            <div className="replay-visual">
              <div className="replay-visual-head">
                REPLAY / CONTROLLED BRANCH <RotateCcw size={14} />
              </div>
              <div className="replay-map">
                <div className="replay-path base" />
                <div className="replay-path selected" />
                <span className="replay-point p1">state_01</span>
                <span className="replay-point p2">span_42</span>
                <span className="replay-point p3">outcome</span>
                <span className="replay-badge">
                  <Play size={11} fill="currentColor" /> branch B
                </span>
              </div>
              <div className="replay-items">
                <div>
                  <b>State snapshots</b>
                  <span>at span boundaries</span>
                </div>
                <div>
                  <b>Controlled variables</b>
                  <span>seeds · temperatures · tool outputs</span>
                </div>
                <div>
                  <b>Counterfactual check</b>
                  <span>did the outcome change?</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="evidence-section">
          <div className="reference-section-label">
            <span>
              <i /> Evidence first
            </span>
          </div>
          <div className="evidence-grid">
            <div>
              <h2>
                Stop rerunning
                <br />
                the whole system.
              </h2>
              <p>Move from broad inspection to a precise question: which step first put the run on the path to failure?</p>
              <span className="plain-link">Confidence and uncertainty stay visible <ArrowUpRight size={14} /></span>
            </div>
            <div className="evidence-panel">
              <div className="evidence-panel-head">
                <span>TRACE SUMMARY</span>
                <b>run_8F3A2D</b>
                <em>failed</em>
              </div>
              <div className="evidence-metrics">
                <div>
                  <b>6</b>
                  <span>Agents</span>
                </div>
                <div>
                  <b>142</b>
                  <span>Steps</span>
                </div>
                <div>
                  <b>27</b>
                  <span>Tools</span>
                </div>
                <div>
                  <b>02:14</b>
                  <span>Duration</span>
                </div>
              </div>
              <div className="evidence-des">
                <span>DECISIVE ERROR STEP</span>
                <strong>span_42</strong>
                <p>
                  Agent: Planner <b>·</b> Downstream impact high
                </p>
              </div>
              <div className="evidence-panel-actions">
                <button onClick={scrollToTrace}>
                  View graph <ArrowUpRight size={13} />
                </button>
                <button onClick={scrollToTrace}>
                  Replay branch <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="reference-cta" id="start">
          <span className="reference-eyebrow">
            <i /> Start with the trace you already have
          </span>
          <h2>Make the next failure explainable.</h2>
          <p>Instrument a workflow. Inspect the causal graph. Replay the branch that matters.</p>
          <button className="violet-button" onClick={scrollToTrace}>
            Start using HETU <ArrowUpRight size={14} />
          </button>
        </section>
      </main>

      <footer className="reference-footer">
        <div>
          <a className="reference-logo" href="#top">
            <span className="hetu-brand">HETU</span>
          </a>
          <p>Find the decisive step. Fix the cause.</p>
        </div>
        <div className="footer-links">
          <a href="#graph">Product</a>
          <a href="#workflow">How it works</a>
          <a href="#start">Start here</a>
        </div>
        <span>© 2026 HETU</span>
      </footer>
    </div>
  );
}
