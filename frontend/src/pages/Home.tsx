import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import ReferenceLanding from "./ReferenceLanding";
import { supabase } from "../lib/supabase";
import "../app/globals.css";

/* ═══════════════════════════════════════════════════════════════════
   404 AI — CAUSAL INTELLIGENCE PLATFORM
   Phase 1 + Phase 2 Complete
   UI matched to 404-ai.cofounder.company screenshots
   ═══════════════════════════════════════════════════════════════════ */

const FONT = "https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;600&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap";

// ═══ THEME — matches cofounder landing exactly ═══════════════════
const C = {
  bg: "#EEEDF5",          // lavender-gray background
  bgWhite: "#FFFFFF",      // card backgrounds
  bgDark: "#0F0F1A",       // dark sections
  border: "#DDDCE6",       // subtle borders
  borderHover: "#C5C4D0",
  text: "#111827",         // sharp main text
  textSec: "#374151",      // crisp dark charcoal secondary text
  textMut: "#4B5563",      // clear graphite muted text
  accent: "#5B5FC7",       // purple/indigo CTA
  accentLight: "#EEEDFA",  // purple tint bg
  accentHover: "#4A4EB5",
  des: "#C0392B",          // DES red
  desLight: "#FDF2F0",
  impact: "#D4880F",
  impactLight: "#FDF8EE",
  ok: "#1D8348",
  okLight: "#EDF8F2",
  okBorder: "#B8E6CC",
  dot: "#5B5FC7",          // blue/purple dot
  tag: "#F4F3FA",
  tagBorder: "#E0DFF0",
};

// ═══ SAMPLES ═════════════════════════════════════════════════════
const SAMPLES = {
  cascading: {
    name: "Cascading Semantic Failure",
    desc: "A data agent pulls Q3 instead of Q4. Every HTTP 200. Silent cascade through 4 agents into a wrong report.",
    tag: "TRACE / SEMANTIC",
    trace: [
      { span_id: "orch-001", parent_span_id: null, agent: "Orchestrator", operation: "plan_task", status: "ok", timestamp: 1e3, duration_ms: 120, tokens: 450, reasoning: "User requested Q4 2025 revenue report.", output_summary: "Task plan: retrieve → analyze → write → review", hands_off_to: "DataRetrieval", hallucination_risk: 0 },
      { span_id: "data-001", parent_span_id: "orch-001", agent: "DataRetrieval", operation: "parse_request", status: "ok", timestamp: 1200, duration_ms: 80, tokens: 320, reasoning: "Checking schema.", output_summary: "Target: revenue_quarterly table", hallucination_risk: 0.1 },
      { span_id: "data-002", parent_span_id: "data-001", agent: "DataRetrieval", operation: "tool_invocation", tool: "sql_query", status: "ok", timestamp: 1350, duration_ms: 250, tokens: 180, reasoning: "Quarter field uses integer encoding — selecting quarter=3 for Q4.", output_summary: "Revenue: $14.2M. Period: Q3 2025.", hallucination_risk: 0.85 },
      { span_id: "data-003", parent_span_id: "data-002", agent: "DataRetrieval", operation: "format_output", status: "ok", timestamp: 1650, duration_ms: 60, tokens: 200, reasoning: "Formatting as JSON.", output_summary: "{revenue: 14.2M, period: Q3-2025}", hands_off_to: "Analysis", hallucination_risk: 0 },
      { span_id: "analysis-001", parent_span_id: "orch-001", agent: "Analysis", operation: "receive_data", status: "ok", timestamp: 1750, duration_ms: 40, tokens: 150, reasoning: "Received revenue data.", output_summary: "$14.2M revenue", hallucination_risk: 0 },
      { span_id: "analysis-002", parent_span_id: "analysis-001", agent: "Analysis", operation: "compute_metrics", status: "ok", timestamp: 1800, duration_ms: 180, tokens: 520, reasoning: "YoY growth = 10.9%", output_summary: "Comparing Q3 against Q4 baseline.", hallucination_risk: 0 },
      { span_id: "analysis-003", parent_span_id: "analysis-002", agent: "Analysis", operation: "generate_insights", status: "ok", timestamp: 2e3, duration_ms: 220, tokens: 680, reasoning: "Generating insights.", output_summary: "Revenue grew 10.9% YoY.", hands_off_to: "Writer", hallucination_risk: 0 },
      { span_id: "writer-001", parent_span_id: "orch-001", agent: "Writer", operation: "draft_report", status: "ok", timestamp: 2250, duration_ms: 350, tokens: 1200, reasoning: "Drafting Q4 report.", output_summary: "Q4 2025: 10.9% growth.", hallucination_risk: 0 },
      { span_id: "writer-002", parent_span_id: "writer-001", agent: "Writer", operation: "format_document", status: "ok", timestamp: 2650, duration_ms: 150, tokens: 400, reasoning: "Formatting.", output_summary: "12 pages, 4 charts.", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "review-001", parent_span_id: "orch-001", agent: "Reviewer", operation: "validate_report", status: "failed", timestamp: 2850, duration_ms: 200, tokens: 600, reasoning: "DISCREPANCY: Report says Q4 but data is Q3.", output_summary: "VALIDATION FAILED.", error: "Data period mismatch: Q4 expected, Q3 received", hallucination_risk: 0 },
      { span_id: "orch-002", parent_span_id: "orch-001", agent: "Orchestrator", operation: "handle_failure", status: "error", timestamp: 3100, duration_ms: 80, tokens: 200, reasoning: "Rejected.", output_summary: "TASK FAILED.", error: "Wrong data period", hallucination_risk: 0 }
    ]
  },
  loop: {
    name: "Infinite Review Loop",
    desc: "Coder-reviewer non-converging feedback. 6 iterations. 4,500 tokens burned before timeout.",
    tag: "TRACE / LOOP",
    trace: [
      { span_id: "pm-001", parent_span_id: null, agent: "ProjectManager", operation: "assign_task", status: "ok", timestamp: 1e3, duration_ms: 100, tokens: 300, reasoning: "CSV parser task.", output_summary: "Task: csv_parser()", hands_off_to: "Coder", hallucination_risk: 0 },
      { span_id: "c-001", parent_span_id: "pm-001", agent: "Coder", operation: "write_code", status: "ok", timestamp: 1150, duration_ms: 300, tokens: 800, reasoning: "Writing csv_parser().", output_summary: "Initial implementation", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "r-001", parent_span_id: "c-001", agent: "Reviewer", operation: "review_code", tool: "code_review", input_hash: "r1", status: "ok", timestamp: 1500, duration_ms: 200, tokens: 600, reasoning: "No error handling.", output_summary: "REVISION: Add try/except", hands_off_to: "Coder", hallucination_risk: 0.1 },
      { span_id: "c-002", parent_span_id: "r-001", agent: "Coder", operation: "revise_code", tool: "code_edit", input_hash: "e2", status: "ok", timestamp: 1750, duration_ms: 250, tokens: 700, reasoning: "Adding handling.", output_summary: "Added error handling", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "r-002", parent_span_id: "c-002", agent: "Reviewer", operation: "review_code", tool: "code_review", input_hash: "r2", status: "ok", timestamp: 2050, duration_ms: 200, tokens: 600, reasoning: "Return type wrong.", output_summary: "REVISION: Fix type", hands_off_to: "Coder", hallucination_risk: 0.3 },
      { span_id: "c-003", parent_span_id: "r-002", agent: "Coder", operation: "revise_code", tool: "code_edit", input_hash: "e3", status: "ok", timestamp: 2300, duration_ms: 200, tokens: 600, reasoning: "Fixing.", output_summary: "Fixed", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "r-003", parent_span_id: "c-003", agent: "Reviewer", operation: "review_code", tool: "code_review", input_hash: "r3", status: "ok", timestamp: 2550, duration_ms: 200, tokens: 600, reasoning: "Style issue.", output_summary: "Use docstring", hands_off_to: "Coder", hallucination_risk: 0.4 },
      { span_id: "c-004", parent_span_id: "r-003", agent: "Coder", operation: "revise_code", tool: "code_edit", input_hash: "e4", status: "ok", timestamp: 2800, duration_ms: 200, tokens: 600, reasoning: "Adding docstring.", output_summary: "Added docstring", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "r-004", parent_span_id: "c-004", agent: "Reviewer", operation: "review_code", tool: "code_review", input_hash: "r4", status: "ok", timestamp: 3050, duration_ms: 200, tokens: 600, reasoning: "Redundant comments.", output_summary: "Remove comments", hands_off_to: "Coder", hallucination_risk: 0.5 },
      { span_id: "c-005", parent_span_id: "r-004", agent: "Coder", operation: "revise_code", tool: "code_edit", input_hash: "e5", status: "ok", timestamp: 3300, duration_ms: 200, tokens: 600, reasoning: "Removing.", output_summary: "Removed", hands_off_to: "Reviewer", hallucination_risk: 0 },
      { span_id: "r-005", parent_span_id: "c-005", agent: "Reviewer", operation: "review_code", tool: "code_review", input_hash: "r5", status: "ok", timestamp: 3550, duration_ms: 200, tokens: 600, reasoning: "Docstring incomplete.", output_summary: "Expand docstring", hands_off_to: "Coder", hallucination_risk: 0.6 },
      { span_id: "c-006", parent_span_id: "r-005", agent: "Coder", operation: "revise_code", tool: "code_edit", input_hash: "e6", status: "timeout", timestamp: 3800, duration_ms: 3e4, tokens: 4500, reasoning: "6th revision. Budget gone.", output_summary: "TIMEOUT", error: "Token budget exceeded", hallucination_risk: 0 },
      { span_id: "pm-002", parent_span_id: "pm-001", agent: "ProjectManager", operation: "handle_timeout", status: "error", timestamp: 33900, duration_ms: 50, tokens: 100, reasoning: "Timed out.", output_summary: "FAILED.", error: "Loop timeout", hallucination_risk: 0 }
    ]
  },
  memory: {
    name: "Memory Poisoning",
    desc: "Hallucinated drug approval stored in memory. 15 sessions later, dangerous medical advice given to patient.",
    tag: "TRACE / MEMORY",
    trace: [
      { span_id: "s1-research", parent_span_id: null, agent: "Researcher", operation: "web_search", tool: "search_api", status: "ok", timestamp: 1e3, duration_ms: 500, tokens: 400, reasoning: "Searching FDA status of XR-7.", output_summary: "5 results about trials.", hallucination_risk: 0.1 },
      { span_id: "s1-synth", parent_span_id: "s1-research", agent: "Researcher", operation: "synthesize", status: "ok", timestamp: 1600, duration_ms: 300, tokens: 800, reasoning: "One source mentions Phase 3. Inferring FDA approval.", output_summary: "XR-7 has FDA approval (HALLUCINATED)", hallucination_risk: 0.88 },
      { span_id: "s1-write", parent_span_id: "s1-synth", agent: "Researcher", operation: "memory_write", memory_op: "write", memory_key: "drug_xr7_status", status: "ok", timestamp: 2e3, duration_ms: 50, tokens: 100, reasoning: "Storing to memory.", output_summary: "Wrote: drug_xr7_status = FDA Approved", hallucination_risk: 0.88 },
      { span_id: "s1-done", parent_span_id: "s1-synth", agent: "Reporter", operation: "summarize", status: "ok", timestamp: 2100, duration_ms: 200, tokens: 500, reasoning: "Session complete.", output_summary: "Findings stored.", hallucination_risk: 0 },
      { span_id: "s15-query", parent_span_id: null, agent: "Advisor", operation: "receive_query", status: "ok", timestamp: 5e4, duration_ms: 80, tokens: 200, reasoning: "Patient asks about XR-7.", output_summary: "Query received.", hallucination_risk: 0 },
      { span_id: "s15-read", parent_span_id: "s15-query", agent: "Advisor", operation: "memory_read", memory_op: "read", memory_key: "drug_xr7_status", status: "ok", timestamp: 50100, duration_ms: 30, tokens: 100, reasoning: "Retrieving from memory.", output_summary: "Retrieved: FDA Approved", hallucination_risk: 0 },
      { span_id: "s15-rec", parent_span_id: "s15-read", agent: "Advisor", operation: "recommend", status: "ok", timestamp: 50200, duration_ms: 250, tokens: 600, reasoning: "XR-7 approved per memory.", output_summary: "Recommending unapproved drug.", hallucination_risk: 0 },
      { span_id: "s15-deliver", parent_span_id: "s15-rec", agent: "Advisor", operation: "deliver", status: "ok", timestamp: 50500, duration_ms: 100, tokens: 300, reasoning: "Delivering.", output_summary: "XR-7 is FDA approved.", hallucination_risk: 0 },
      { span_id: "s15-check", parent_span_id: "s15-query", agent: "Compliance", operation: "verify_claims", status: "failed", timestamp: 50600, duration_ms: 400, tokens: 500, reasoning: "XR-7 NOT in FDA database.", output_summary: "VIOLATION.", error: "Recommended unapproved drug", hallucination_risk: 0 },
      { span_id: "s15-alert", parent_span_id: "s15-check", agent: "Compliance", operation: "raise_alert", status: "error", timestamp: 51e3, duration_ms: 50, tokens: 100, reasoning: "Critical.", output_summary: "CRITICAL.", error: "Hallucinated drug approval", hallucination_risk: 0 }
    ]
  }
};

// ═══ PHASE 1 ENGINE (CIA Algorithm) ══════════════════════════════
function convertTrace(i: any) {
  let d;
  try { d = typeof i === "string" ? JSON.parse(i) : i; } catch { throw new Error("Invalid JSON trace format. Paste raw JSON or select a demo trace."); }
  if (!Array.isArray(d)) { d = d.spans || d.trace || d.runs || d.data || [d]; }
  return d.map((s: any, x: number) => ({
    span_id: s.span_id || s.id || `s${x}`,
    parent_span_id: s.parent_span_id || null,
    agent: s.agent || s.name || `Agent${x}`,
    operation: s.operation || s.op || s.type || "unknown",
    tool: s.tool || null,
    status: nS(s.status || (s.error ? "error" : "ok")),
    timestamp: s.timestamp || 1e3 + x * 500,
    duration_ms: s.duration_ms || 100,
    tokens: s.tokens || 0,
    reasoning: s.reasoning || "",
    output_summary: s.output_summary || s.output || "",
    error: s.error || null,
    hallucination_risk: s.hallucination_risk || 0,
    hands_off_to: s.hands_off_to || null,
    memory_op: s.memory_op || null,
    memory_key: s.memory_key || null,
    input_hash: s.input_hash || null
  }));
}

function nS(s: any) {
  if (!s) return "ok";
  const l = String(s).toLowerCase();
  return ["error", "failed", "failure"].some(e => l.includes(e)) ? "error" : l.includes("timeout") ? "timeout" : "ok";
}

function gD(ed: any[], s: string) {
  const d = new Set(); const q = [s];
  while (q.length) {
    const c = q.shift()!;
    ed.forEach(e => { if (e.source === c && !d.has(e.target)) { d.add(e.target); q.push(e.target); } });
  }
  return d;
}

function sD(ed: any[], f: string, t: string) {
  const v = new Set(); const q: [string, number][] = [[f, 0]];
  while (q.length) {
    const [c, d] = q.shift()!;
    if (c === t) return d;
    v.add(c);
    ed.forEach(e => { if (e.source === c && !v.has(e.target)) q.push([e.target, d + 1]); });
  }
  return 99;
}

function analyze(raw: any) {
  const t0 = performance.now();
  const spans = convertTrace(raw);
  const nm = new Map(); const edges: any[] = [];
  spans.forEach((s: any) => nm.set(s.span_id, { ...s }));
  spans.forEach((s: any) => { if (s.parent_span_id && nm.has(s.parent_span_id)) edges.push({ source: s.parent_span_id, target: s.span_id, type: "INVOKES" }); });
  spans.forEach((s: any) => {
    if (s.hands_off_to) {
      const t = spans.find((t: any) => t.agent === s.hands_off_to && t.timestamp > s.timestamp && !edges.some(e => e.source === s.span_id && e.target === t.span_id));
      if (t) edges.push({ source: s.span_id, target: t.span_id, type: "HANDS_OFF" });
    }
  });

  const an: any[] = [];
  nm.forEach((d, id) => { if (["error", "failed", "timeout"].includes(d.status)) an.push({ type: "error", node: id, severity: .9, detail: d.error || "Unknown" }); });
  const tc: any = {};
  nm.forEach((d, id) => { if (d.tool) { const k = `${d.agent}|${d.tool}`; (tc[k] = tc[k] || []).push(id); } });
  Object.entries(tc).forEach(([k, ids]: [string, any]) => { if (ids.length >= 3) an.push({ type: "infinite_loop", node: ids[0], nodes: ids, severity: .88, detail: `${k.split("|")[0]} called ${k.split("|")[1]} ${ids.length}x` }); });
  nm.forEach((d, id) => { if ((d.hallucination_risk || 0) > .7) an.push({ type: "hallucination", node: id, severity: d.hallucination_risk, detail: `Hallucination risk ${Math.round(d.hallucination_risk * 100)}%` }); });
  nm.forEach((d, id) => {
    if (d.memory_op === "write" && (d.hallucination_risk || 0) > .5) {
      const r: any[] = [];
      nm.forEach((rd, rid) => { if (rd.memory_op === "read" && rd.memory_key === d.memory_key && rd.timestamp > d.timestamp) r.push(rid); });
      if (r.length) an.push({ type: "memory_poisoning", node: id, severity: .95, detail: `Poisoned '${d.memory_key}'` });
    }
  });

  const eN = new Set();
  nm.forEach((d, id) => { if (["error", "failed", "timeout"].includes(d.status)) eN.add(id); });
  const aT = [...nm.values()].map((n: any) => n.timestamp), mT = Math.min(...aT), xT = Math.max(...aT), tR = xT - mT || 1;

  let bRC: any = null, bS = -1;
  an.forEach(a => {
    if (!nm.has(a.node)) return;
    const desc = gD(edges, a.node);
    let res = 0;
    desc.forEach(d => { if (eN.has(d)) res++; });
    const score = a.severity * .3 + (res / Math.max(eN.size, 1)) * .3 + (desc.size / Math.max(nm.size, 1)) * .2 + (1 - ((nm.get(a.node).timestamp - mT) / tR)) * .2;
    if (score > bS) {
      bS = score;
      bRC = { node: a.node, confidence: Math.round(Math.min(score * 1.25, .98) * 100) / 100, type: a.type, detail: a.detail, impact_radius: desc.size, resolved_errors: res, agent: nm.get(a.node).agent, operation: nm.get(a.node).operation };
    }
  });
  if (!bRC) bRC = { node: null, confidence: 0, type: "none", detail: "No anomalies" };

  const ic: any[] = [];
  if (bRC.node) {
    gD(edges, bRC.node).forEach((nid: any) => {
      const nd = nm.get(nid);
      if (nd) ic.push({ node: nid, agent: nd.agent, operation: nd.operation, distance: sD(edges, bRC.node, nid), status: nd.status, degradation: Math.max(1 - sD(edges, bRC.node, nid) * .15, .1) });
    });
    ic.sort((a, b) => a.distance - b.distance);
  }

  const agents = new Set([...nm.values()].map((n: any) => n.agent));
  const aS: any = {};
  agents.forEach(ag => {
    const ns = [...nm.values()].filter((n: any) => n.agent === ag);
    const er = ns.filter((n: any) => ["error", "failed", "timeout"].includes(n.status)).length;
    const hr = ns.reduce((s, n) => s + (n.hallucination_risk || 0), 0) / ns.length;
    aS[ag] = Math.max(0, Math.round((1 - er / ns.length - hr * .5 - (bRC.agent === ag ? .3 : 0)) * 100));
  });

  const impS = new Set(ic.map(i => i.node));
  const gN = [...nm.entries()].map(([id, d]) => {
    let vs = "ok";
    if (id === bRC.node) vs = "root_cause";
    else if (impS.has(id)) vs = "impacted";
    else if (["error", "failed", "timeout"].includes(d.status)) vs = "error";
    return { id, ...d, visual_status: vs, is_root_cause: id === bRC.node, degradation: ic.find(i => i.node === id)?.degradation || null };
  });

  const gE = edges.map((e, i) => ({ ...e, id: `e${i}`, is_impact_path: (e.source === bRC.node || impS.has(e.source)) && (impS.has(e.target) || e.target === bRC.node) }));
  const tT = [...nm.values()].reduce((s, n) => s + (n.tokens || 0), 0);
  let tW = 0;
  Object.values(tc).forEach((ids: any) => { if (ids.length >= 3) ids.forEach((id: any) => { tW += nm.get(id)?.tokens || 0; }); });

  const ev = xEv(gN, bRC, ic);
  const es = xSc(ev);
  const prop = xPr(gN, bRC, ic);
  const dec = xDe(bRC, ev, ic, aS, { wasted_tokens: tW });
  const ck = xCk(bRC, ic);
  const report = xRp(bRC, ev, es, ic, dec, ck, aS, { total_spans: nm.size, agent_count: agents.size, analysis_time_ms: Math.round(performance.now() - t0), algorithm: "Counterfactual Impact Analysis" });

  return {
    graph: { nodes: gN, edges: gE },
    root_cause: bRC,
    impact_chain: ic,
    agent_scores: aS,
    evidence: ev,
    evidenceScore: es,
    propagation: prop,
    decisions: dec,
    checklist: ck,
    summaryReport: report,
    summary: { total_spans: nm.size, agent_count: agents.size, error_count: eN.size, anomaly_count: an.length, total_tokens: tT, wasted_tokens: tW, analysis_time_ms: Math.round(performance.now() - t0), root_cause_found: !!bRC.node, root_cause_confidence: bRC.confidence, algorithm: "Counterfactual Impact Analysis" }
  };
}

// ═══ PHASE 2 ENGINES ════════════════════════════════════════════
function xEv(nodes: any[], rc: any, chain: any[]) {
  const ev: any[] = [];
  if (!rc.node) return ev;
  const nd = nodes.find(n => n.id === rc.node) || {};
  if (nd.error) ev.push({ id: `ev${ev.length + 1}`, type: "error", cat: "observable", sev: "critical", title: "Explicit Error", desc: `${nd.error}`, step: rc.node, agent: nd.agent });
  if ((nd.hallucination_risk || 0) > .5) ev.push({ id: `ev${ev.length + 1}`, type: "hallucination", cat: "observable", sev: nd.hallucination_risk > .8 ? "critical" : "high", title: `Hallucination Risk: ${Math.round(nd.hallucination_risk * 100)}%`, desc: `Output from '${nd.agent}' during '${nd.operation}'.`, step: rc.node, agent: nd.agent });
  const o = nd.output_summary || "";
  ["mismatch", "Q3", "HALLUCINATED", "DANGEROUS"].forEach(s => { if (o.toLowerCase().includes(s.toLowerCase()) && !ev.some(e => e.type === "anomaly")) ev.push({ id: `ev${ev.length + 1}`, type: "anomaly", cat: "observable", sev: "high", title: "Anomalous Output", desc: `Contains '${s}': "${o.slice(0, 90)}"`, step: rc.node, agent: nd.agent }); });
  if (nd.tool) ev.push({ id: `ev${ev.length + 1}`, type: "tool", cat: "observable", sev: "medium", title: `Tool: ${nd.tool}`, desc: `DES at tool invocation.`, step: rc.node, agent: nd.agent });
  if (nd.memory_op) ev.push({ id: `ev${ev.length + 1}`, type: `memory`, cat: "observable", sev: (nd.hallucination_risk || 0) > .5 ? "critical" : "medium", title: `Memory ${nd.memory_op}: ${nd.memory_key}`, desc: `${nd.memory_op === "write" ? "Wrote to" : "Read from"} '${nd.memory_key}'.`, step: rc.node, agent: nd.agent });
  chain.filter(i => ["error", "failed"].includes(i.status)).slice(0, 3).forEach(it => { const n2 = nodes.find(n => n.id === it.node) || {}; ev.push({ id: `ev${ev.length + 1}`, type: "cascade", cat: "observable", sev: "high", title: `Cascade → ${n2.agent}`, desc: `Failed at '${n2.operation}'. Distance: ${it.distance}.`, step: it.node, agent: n2.agent }); });
  if (nd.status === "ok" && rc.type === "hallucination") ev.push({ id: `ev${ev.length + 1}`, type: "silent", cat: "inferred", sev: "critical", title: "Silent Semantic Failure", desc: "Status OK but output semantically wrong.", step: rc.node, agent: nd.agent });
  if (rc.type === "infinite_loop") ev.push({ id: `ev${ev.length + 1}`, type: "loop", cat: "inferred", sev: "high", title: "Loop Pattern", desc: `'${nd.agent}' repeated '${nd.tool}' without convergence.`, step: rc.node, agent: nd.agent });
  return ev;
}

function xSc(ev: any[]) {
  if (!ev.length) return { score: 0, explanation: "No evidence.", obs: 0, inf: 0 };
  const obs = ev.filter(e => e.cat === "observable"), inf = ev.filter(e => e.cat === "inferred");
  const w: any = { critical: 25, high: 18, medium: 10 };
  const raw = obs.reduce((s, e) => s + (w[e.sev] || 5), 0) + inf.reduce((s, e) => s + (w[e.sev] || 5) * .5, 0);
  const score = Math.min(100, Math.round(raw * 100 / (raw + 30)));
  return { score, explanation: score >= 80 ? `Strong: ${obs.length} observable indicators.` : score >= 50 ? `Moderate: ${obs.length} observable, ${inf.length} inferred.` : `Limited: ${obs.length} observable.`, obs: obs.length, inf: inf.length };
}

function xPr(nodes: any[], rc: any, chain: any[]) {
  if (!rc.node) return { stages: [] };
  const nd = nodes.find(n => n.id === rc.node) || {};
  const stages: any[] = [{ id: "origin", label: cSt(nd), agent: nd.agent, desc: dSt(nd, rc), sev: "critical", step: rc.node }];
  const seen = new Set([nd.agent]);
  chain.forEach((it, i) => {
    const n2 = nodes.find(n => n.id === it.node) || {};
    if (seen.has(n2.agent) && !["error", "failed"].includes(n2.status)) return;
    seen.add(n2.agent);
    stages.push({ id: `s${i}`, label: cSt(n2), agent: n2.agent, desc: dSt(n2, rc), sev: ["error", "failed"].includes(n2.status) ? "critical" : "warning", step: it.node, deg: it.degradation });
  });
  const t = nodes.filter(n => ["error", "failed"].includes(n.status) && n.id !== rc.node);
  if (t.length) stages.push({ id: "fail", label: "System Failure", agent: t[t.length - 1].agent, desc: t[t.length - 1].error || "Task failed", sev: "critical", step: t[t.length - 1].id });
  return { stages };
}

function cSt(n: any) {
  const o = (n.operation || "").toLowerCase();
  if (n.tool) return "Tool";
  if (o.includes("plan") || o.includes("assign")) return "Planner";
  if (n.memory_op) return "Memory";
  if (o.includes("review") || o.includes("valid")) return "Validator";
  if (o.includes("comput")) return "Analyzer";
  return "Agent";
}

function dSt(n: any, rc: any) {
  if (n.id === rc.node) {
    if (rc.type === "hallucination") return `${n.agent} produced hallucinated output.`;
    if (rc.type === "infinite_loop") return `${n.agent} entered non-converging loop.`;
    if (rc.type === "memory_poisoning") return `${n.agent} wrote hallucinated data to memory.`;
    return `${n.agent} error: ${n.error || "unknown"}.`;
  }
  return ["error", "failed"].includes(n.status) ? `${n.agent} failed: ${n.error || "error"}` : `${n.agent} processed corrupted input.`;
}

function xDe(rc: any, ev: any[], chain: any[], scores: any, sum: any) {
  if (!rc.node) return [];
  const ds: any[] = [];
  const ag = rc.agent;
  if (rc.type === "hallucination") {
    ds.push({ id: "d1", title: "Add output validation layer", pri: "P0", why: `${ag} produced semantically wrong output accepted as valid.`, impact: `Prevents ${chain.length} downstream corruptions.`, risks: "50-200ms added latency.", conf: "high", effort: "3–5 days", refs: ev.filter(e => ["hallucination", "anomaly", "silent"].includes(e.type)).map(e => e.id) });
    ds.push({ id: "d2", title: "Add verification agent", pri: "P1", why: "Cross-check outputs against source data.", impact: "Reduces hallucination 60-80%.", risks: "Increases tokens ~30%.", conf: "high", effort: "1–2 weeks", refs: ev.filter(e => e.type === "hallucination").map(e => e.id) });
  } else if (rc.type === "infinite_loop") {
    ds.push({ id: "d1", title: "Add convergence detection + iteration limit", pri: "P0", why: `${ag} entered non-converging loop.`, impact: `Eliminates ${(sum.wasted_tokens || 0).toLocaleString()} wasted tokens.`, risks: "Limit too low may terminate early.", conf: "high", effort: "1–2 days", refs: ev.filter(e => ["loop", "error"].includes(e.type)).map(e => e.id) });
  } else if (rc.type === "memory_poisoning") {
    ds.push({ id: "d1", title: "Gate memory writes on confidence", pri: "P0", why: `${ag} wrote hallucinated data to memory.`, impact: "Prevents cross-session contamination.", risks: "May reduce persisted volume.", conf: "high", effort: "1–2 days", refs: ev.filter(e => e.type === "memory").map(e => e.id) });
    ds.push({ id: "d2", title: "Purge poisoned memory key", pri: "P0", why: "Key contains hallucinated data.", impact: "Stops ongoing contamination.", risks: "Legitimate data also purged.", conf: "high", effort: "< 1 day", refs: ev.filter(e => e.type === "memory").map(e => e.id) });
  } else {
    ds.push({ id: "d1", title: "Add error handling with fallback", pri: "P0", why: `${ag} hit unhandled error.`, impact: `Prevents ${chain.length} downstream failures.`, risks: "Fallback may produce lower quality.", conf: "high", effort: "1–2 days", refs: ev.filter(e => e.type === "error").map(e => e.id) });
  }
  ds.push({ id: `d${ds.length + 1}`, title: "Add trace-based regression test", pri: "P1", why: "Capture this trace as CI/CD test.", impact: "Prevents reintroduction.", risks: "May be too specific.", conf: "high", effort: "< 1 day", refs: ev.length ? [ev[0].id] : [] });
  return ds;
}

function xCk(rc: any, chain: any[]) {
  if (!rc.node) return [];
  const items: any[] = [{ id: "v1", text: "Replay failing trace with fix applied", ck: false }, { id: "v2", text: "Run regression tests", ck: false }];
  if (rc.type === "hallucination") items.push({ id: "v3", text: `Verify ${rc.agent} output against schema`, ck: false }, { id: "v4", text: "Confirm downstream rejects malformed data", ck: false });
  else if (rc.type === "infinite_loop") items.push({ id: "v3", text: "Verify loop terminates within limit", ck: false }, { id: "v4", text: "Confirm token budget preserved", ck: false });
  else if (rc.type === "memory_poisoning") items.push({ id: "v3", text: "Confirm poisoned key purged", ck: false }, { id: "v4", text: "Verify write validation gate", ck: false });
  else items.push({ id: "v3", text: "Verify error handling works", ck: false });
  items.push({ id: `v${items.length + 1}`, text: "Deploy with monitoring", ck: false });
  return items;
}

function xRp(rc: any, ev: any[], es: any, chain: any[], dec: any[], ck: any[], scores: any, sum: any) {
  const L: string[] = [];
  L.push(`# HETU — Investigation Report\n\n**Algorithm:** ${sum.algorithm} · **Spans:** ${sum.total_spans} · **Agents:** ${sum.agent_count} · **Time:** ${sum.analysis_time_ms}ms\n`);
  if (rc.node) { L.push(`## Decisive Error Step\n- Node: \`${rc.node}\`\n- Agent: ${rc.agent}\n- Type: ${rc.type}\n- Confidence: ${Math.round(rc.confidence * 100)}%\n`); }
  L.push(`## Evidence Score: ${es.score}/100\n${es.explanation}\n`);
  L.push(`## Evidence\n`);
  ev.forEach(e => L.push(`- [${e.cat}] **${e.title}** — ${e.desc}`));
  L.push(`\n## Actions\n`);
  dec.forEach(d => L.push(`### [${d.pri}] ${d.title}\n${d.why}\n`));
  L.push(`## Checklist\n`);
  ck.forEach(c => L.push(`- [ ] ${c.text}`));
  L.push(`\n---\n*Generated by HETU*`);
  return L.join("\n");
}

// ═══ LAYOUT ═════════════════════════════════════════════════════
function layoutN(gn: any[], ge: any[]) {
  const ch: any = {}, pa: any = {};
  gn.forEach(n => { ch[n.id] = []; pa[n.id] = []; });
  ge.forEach(e => { if (ch[e.source]) ch[e.source].push(e.target); if (pa[e.target]) pa[e.target].push(e.source); });
  const layers: any = {};
  const vis = new Set();
  function assign(id: string, d: number) {
    if (layers[id] === undefined || d > layers[id]) layers[id] = d;
    if (vis.has(id + ":" + d)) return;
    vis.add(id + ":" + d);
    (ch[id] || []).forEach((c: any) => assign(c, d + 1));
  }
  gn.filter(n => pa[n.id].length === 0).forEach(n => assign(n.id, 0));
  gn.forEach(n => { if (layers[n.id] === undefined) layers[n.id] = 0; });
  const groups: any = {};
  Object.entries(layers).forEach(([id, l]: [string, any]) => { (groups[l] = groups[l] || []).push(id); });
  const W = 200, H = 68, GX = 32, GY = 64;
  const pos: any = {};
  Object.entries(groups).forEach(([layer, ids]: [string, any]) => {
    const tw = ids.length * W + (ids.length - 1) * GX;
    ids.forEach((id: string, i: number) => { pos[id] = { x: -tw / 2 + i * (W + GX), y: Number(layer) * (H + GY) }; });
  });
  return pos;
}

// ═══ STYLES — Matched strictly to Landing Page (DM Sans, DM Mono, Newsreader) ════
const mono = { fontFamily: "'DM Mono', monospace", fontWeight: 500 };
const sans = { fontFamily: "'DM Mono', monospace", fontWeight: 500 };
const serif = { fontFamily: "'DM Mono', monospace", fontWeight: 500 };
const label = { fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: C.textMut };
const card = { background: C.bgWhite, border: `1px solid ${C.border}`, borderRadius: 10 };
const dot = (color = C.dot) => ({ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 });

// ═══ APP ════════════════════════════════════════════════════════
export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "workspace">("landing");
  const [analysis, setAnalysis] = useState<any>(null);
  const [selNode, setSelNode] = useState<any>(null);
  const [section, setSection] = useState("report");
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ckState, setCkState] = useState<any>({});
  const [fb, setFb] = useState<any>(null);
  const [fbText, setFbText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [userHistory, setUserHistory] = useState<Array<{ id: string; name: string; trace: any }>>([
    { id: "s1", name: "Cascading Semantic Failure", trace: SAMPLES.cascading.trace },
    { id: "s2", name: "Infinite Review Loop", trace: SAMPLES.loop.trace },
    { id: "s3", name: "Memory Poisoning", trace: SAMPLES.memory.trace },
  ]);

  // Load history from Supabase on mount
  useEffect(() => {
    async function loadSupabaseHistory() {
      try {
        const { data, error } = await supabase
          .from("hetu_history")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(15);

        if (!error && data && data.length > 0) {
          const dbHistory = data.map((item: any) => ({
            id: item.id || `db_${Math.random()}`,
            name: item.name || "Trace Analysis Run",
            trace: item.trace_data || item.trace
          }));
          setUserHistory(prev => {
            const combined = [...dbHistory, ...prev];
            return combined.filter((v, i, a) => a.findIndex(t => JSON.stringify(t.trace) === JSON.stringify(v.trace)) === i);
          });
        }
      } catch (e) {
        console.warn("Supabase history sync fallback to local state", e);
      }
    }
    loadSupabaseHistory();
  }, []);

  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<any>(null);
  const [drag, setDrag] = useState(false);
  const [dragS, setDragS] = useState<any>(null);

  const run = useCallback((trace: any) => {
    setLoading(true); setErr(null); setFb(null); setCkState({});
    setTimeout(() => {
      try {
        let traceData = trace;
        if (typeof trace === "string") {
          try {
            traceData = JSON.parse(trace);
          } catch {
            traceData = trace;
          }
        }
        const r = analyze(traceData);
        setAnalysis(r);
        setViewMode("workspace");
        setSelNode(r.root_cause.node);
        setSection("report");
        const pos = layoutN(r.graph.nodes, r.graph.edges);
        const xs = Object.values(pos).map((p: any) => p.x), ys = Object.values(pos).map((p: any) => p.y);
        setVb({ x: Math.min(...xs) - 100, y: Math.min(...ys) - 80, w: Math.max(...xs) - Math.min(...xs) + 240 + 200, h: Math.max(...ys) - Math.min(...ys) + 100 + 160 });
        
        // Add to history and save to Supabase
        const traceName = Array.isArray(traceData) && traceData[0]?.agent ? `${traceData[0].agent} Trace Run` : "Custom OpenTelemetry Trace";
        setUserHistory(prev => {
          if (prev.some(h => JSON.stringify(h.trace) === JSON.stringify(traceData))) return prev;
          return [{ id: `h_${Date.now()}`, name: traceName, trace: traceData }, ...prev];
        });

        // Persist to Supabase
        (async () => {
          try {
            await supabase.from("hetu_history").insert([{ name: traceName, trace_data: traceData }]);
          } catch {
            // Ignore table error if not migrated
          }
        })();

      } catch (e: any) {
        setErr(e.message);
      }
      setLoading(false);
    }, 300);
  }, []);

  const submit = () => {
    if (!input.trim()) return;
    try { run(input); } catch (e: any) { setErr(e.message); }
  };

  const positions = useMemo(() => analysis ? layoutN(analysis.graph.nodes, analysis.graph.edges) : {}, [analysis]);
  const selData = useMemo(() => analysis && selNode ? analysis.graph.nodes.find((n: any) => n.id === selNode) : null, [analysis, selNode]);

  const onMD = (e: any) => { if (e.target.closest('.gn')) return; setDrag(true); setDragS({ x: e.clientX, y: e.clientY, vb: { ...vb } }); };
  const onMM = (e: any) => {
    if (!drag || !dragS || !vb || !svgRef.current) return;
    const r = svgRef.current.getBoundingClientRect();
    setVb({ ...dragS.vb, x: dragS.vb.x - (e.clientX - dragS.x) * (vb.w / r.width), y: dragS.vb.y - (e.clientY - dragS.y) * (vb.h / r.height) });
  };
  const onMU = () => setDrag(false);
  const onWh = (e: any) => {
    if (!vb) return;
    const f = e.deltaY > 0 ? 1.1 : .9;
    setVb({ x: vb.x - (vb.w - vb.w * f) / 2, y: vb.y - (vb.h - vb.h * f) / 2, w: vb.w * f, h: vb.h * f });
  };

  // ═══ LANDING PAGE VIEW ════════════════════════════
  if (viewMode === "landing") {
    return (
      <ReferenceLanding
        onRunTrace={(t) => {
          run(t);
          setViewMode("workspace");
        }}
        samples={SAMPLES}
        loading={loading}
        onStart={() => setViewMode("workspace")}
      />
    );
  }

  // ═══ WORKSPACE VIEW (Spacious Sidebar + Clean Landing Typography + No Emojis) ═════════
  return (
    <div style={{ display: "flex", width: "100vw", height: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', monospace", fontWeight: 500, overflow: "hidden" }}>
      <link href={FONT} rel="stylesheet" />

      {/* DOCS MODAL OVERLAY */}
      {showDocs && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,15,26,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.bgWhite, border: `1px solid ${C.border}`, borderRadius: 12, width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto", padding: 28, boxShadow: "0 20px 50px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500, color: C.text }}>HETU Documentation & Guide</span>
              </div>
              <button onClick={() => setShowDocs(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.textMut }}>✕</button>
            </div>
            
            <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.6, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>How HETU Works</h3>
              <p style={{ marginBottom: 16 }}>
                HETU ingests OpenTelemetry execution spans from multi-agent frameworks (LangGraph, CrewAI, AutoGen) and constructs a <strong>Multi-Agent Cognitive Execution Graph</strong>. It applies <em>Counterfactual Causal Traversal</em> to pinpoint the <strong>Decisive Error Step (DES)</strong>—the earliest step where an error altered the run outcome.
              </p>

              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>Expected JSON Trace Format</h3>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, ...mono, fontSize: 12, color: C.text, marginBottom: 16, whiteSpace: "pre-wrap" }}>
{`[
  {
    "span_id": "orch-001",
    "parent_span_id": null,
    "agent": "Orchestrator",
    "operation": "plan_task",
    "status": "ok",
    "reasoning": "User requested Q4 revenue report",
    "output_summary": "Task plan generated",
    "hallucination_risk": 0
  }
]`}
              </div>

              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 8 }}>AI Prompt Template</h3>
              <p style={{ marginBottom: 8, fontSize: 13 }}>Copy this prompt and paste into ChatGPT/Claude/Gemini to generate compatible execution traces:</p>
              <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, ...mono, fontSize: 11, color: C.textSec, marginBottom: 20, whiteSpace: "pre-wrap", maxHeight: 150, overflowY: "auto" }}>
{`Generate a realistic JSON execution trace for a multi-agent AI system experiencing a failure.
Include fields: span_id, parent_span_id, agent, operation, status, duration_ms, tokens, reasoning, output_summary, error (if any), hallucination_risk (0-1).
Ensure there is one clear Decisive Error Step (DES).`}
              </div>

              <button onClick={() => setShowDocs(false)} className="primary-button" style={{ width: "100%" }}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT SIDEBAR (Spacious & Clean Typography, No Emojis) */}
      <div style={{ width: sidebarOpen ? 260 : 0, transition: "width 0.2s ease", background: "#FAFAFC", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", position: "relative" }}>
        {/* Sidebar Header */}
        <div style={{ padding: "20px 18px 16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setViewMode("landing")}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color: "#111827", letterSpacing: "-0.04em" }}>HETU</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: C.accent, background: C.accentLight, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.08em", fontWeight: 600 }}>STUDIO</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: C.textMut, cursor: "pointer", padding: 4 }} title="Close Sidebar">
            ✕
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: "0 18px 16px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => { setAnalysis(null); setInput(""); }}
            className="primary-button"
            style={{ width: "100%", justifyContent: "center", borderRadius: 8, fontSize: 13 }}
          >
            + New Trace
          </button>

          <button
            onClick={() => setShowDocs(true)}
            className="secondary-button"
            style={{ width: "100%", justifyContent: "center", borderRadius: 8, fontSize: 12, minHeight: 36 }}
          >
            Docs & Guide
          </button>
        </div>

        {/* Sidebar Content */}
        <div style={{ flex: 1, overflowY: "auto", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", padding: "0 18px 18px 18px" }}>
          {/* Pinned Scenarios */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              PINNED DEMOS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(SAMPLES).map(([key, sample]: [string, any]) => (
                <div
                  key={key}
                  onClick={() => run(sample.trace)}
                  style={{ padding: "10px 12px", borderRadius: 8, background: "#FFFFFF", border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s ease" }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{sample.name}</div>
                  <div style={{ fontSize: 10, color: "#6B7280", fontFamily: "'DM Mono', monospace" }}>{sample.tag}</div>
                </div>
              ))}
            </div>
          </div>

          {/* History */}
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
              HISTORY (SUPABASE)
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {userHistory.map(h => (
                <div
                  key={h.id}
                  onClick={() => run(h.trace)}
                  style={{ padding: "8px 10px", borderRadius: 6, fontSize: 12, color: "#374151", fontFamily: "'DM Mono', monospace", fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", background: analysis && JSON.stringify(analysis.spans) === JSON.stringify(h.trace) ? "#EEEDFA" : "transparent" }}
                >
                  {h.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer Link */}
        <div style={{ padding: "14px 18px", borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => setViewMode("landing")} style={{ background: "none", border: "none", fontSize: 12, fontFamily: "'DM Mono', monospace", fontWeight: 500, color: "#6B7280", cursor: "pointer", padding: 0 }}>
            ← Back to Landing Page
          </button>
        </div>
      </div>

      {/* Sidebar Re-open Button */}
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} className="secondary-button small" style={{ position: "absolute", top: 14, left: 14, zIndex: 100 }}>
          ☰ Menu
        </button>
      )}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: C.bg }}>

        {/* VIEW 1: NO TRACE RUNNING -> PROMPT INPUT SCREEN */}
        {!analysis ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px 60px 24px", position: "relative" }}>
            
            {/* Header Title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <span className="eyebrow-pill" style={{ marginBottom: 16 }}>
                <i /> HETU CAUSAL DEBUGGER
              </span>
              <h1 style={{ fontFamily: "'DM Mono', monospace", fontSize: 44, fontWeight: 500, color: "#111827", letterSpacing: "-0.04em", margin: "12px 0 8px 0" }}>
                What do you want to analyze?
              </h1>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: "#6B7280", margin: 0, maxWidth: 540 }}>
                Paste raw OpenTelemetry JSON traces below or select a pinned demo scenario from the sidebar.
              </p>
            </div>

            {/* Prompt Input Box */}
            <div style={{ width: "100%", maxWidth: 720, background: C.bgWhite, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px", boxShadow: "0 12px 40px rgba(17,24,39,0.06)" }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                placeholder={`[\n  {\n    "span_id": "orch-001",\n    "parent_span_id": null,\n    "agent": "Orchestrator"\n  }\n]`}
                rows={5}
                style={{ width: "100%", border: "none", outline: "none", resize: "none", fontSize: 13, ...mono, color: C.text, background: "transparent" }}
              />

              {/* Bottom Toolbar inside card */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, ...mono, color: "#6B7280", background: C.tag, padding: "4px 10px", borderRadius: 4, border: `1px solid ${C.tagBorder}` }}>
                    Model: HETU-Causal-v1
                  </span>
                </div>

                <button
                  onClick={submit}
                  disabled={loading || !input.trim()}
                  className="primary-button"
                  style={{ borderRadius: 7, fontSize: 13, minHeight: 38 }}
                >
                  {loading ? "ANALYZING..." : "START ANALYSIS ↗"}
                </button>
              </div>
            </div>
            {err && <div style={{ marginTop: 14, color: C.des, fontSize: 12, ...mono }}>{err}</div>}

            {/* Quick Demo Cards */}
            <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center", maxWidth: 720 }}>
              {Object.entries(SAMPLES).map(([key, sample]: [string, any]) => (
                <div
                  key={key}
                  onClick={() => {
                    const formatted = JSON.stringify(sample.trace, null, 2);
                    setInput(formatted);
                    run(sample.trace);
                  }}
                  style={{ background: C.bgWhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s" }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#111827", fontFamily: "'DM Mono', monospace" }}>{sample.name}</span>
                  <span style={{ fontSize: 11, color: C.accent, ...mono }}>Run →</span>
                </div>
              ))}
            </div>

          </div>
        ) : (
          
          /* VIEW 2: GRAPH & ENGINEERING REPORT VIEW (Matching Image 2) */
          <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 52, background: C.bgWhite, borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 500, cursor: "pointer", color: "#111827", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.04em" }} onClick={() => setAnalysis(null)}>HETU</span>
                <span style={{ ...label, fontSize: 9, marginLeft: 8, color: C.textMut }}>INVESTIGATION REPORT</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span style={{ fontSize: 10, ...mono, color: C.textMut }}>{analysis.summary.algorithm} · {analysis.summary.analysis_time_ms}ms</span>
                {analysis.summary.root_cause_found && <span style={{ fontSize: 10, color: C.des, background: C.desLight, padding: "4px 12px", borderRadius: 4, ...mono }}>DES IDENTIFIED</span>}
                <button onClick={() => setAnalysis(null)} style={{ ...card, padding: "5px 14px", fontSize: 11, ...mono, color: C.textSec, cursor: "pointer" }}>New trace</button>
              </div>
            </div>

            {/* Split View: Left Graph SVG, Right Report Panel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", flex: 1, overflow: "hidden" }}>
              {/* Graph */}
              <div style={{ position: "relative", overflow: "hidden" }}>
                <svg ref={svgRef} width="100%" height="100%" viewBox={vb ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}` : "0 0 800 600"} onMouseDown={onMD} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU} onWheel={onWh} style={{ cursor: drag ? "grabbing" : "grab", background: C.bg }}>
                  <defs><pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r=".6" fill={C.border} /></pattern></defs>
                  <rect x={vb ? vb.x - 3e3 : -3e3} y={vb ? vb.y - 3e3 : -3e3} width={(vb?.w || 800) + 6e3} height={(vb?.h || 600) + 6e3} fill="url(#g)" />
                  {analysis.graph.edges.map((e: any) => {
                    const sp = positions[e.source], tp = positions[e.target]; if (!sp || !tp) return null;
                    const x1 = sp.x + 100, y1 = sp.y + 68, x2 = tp.x + 100, y2 = tp.y, mid = (y1 + y2) / 2;
                    return <g key={e.id}><path d={`M${x1},${y1} C${x1},${mid} ${x2},${mid} ${x2},${y2}`} fill="none" stroke={e.is_impact_path ? C.impact : e.type === "HANDS_OFF" ? "#A8A0D0" : C.border} strokeWidth={e.is_impact_path ? 2.5 : 1.2} strokeDasharray={e.type === "HANDS_OFF" ? "5,3" : "none"} /><polygon points={`${x2 - 3},${y2 - 5} ${x2 + 3},${y2 - 5} ${x2},${y2}`} fill={e.is_impact_path ? C.impact : C.border} /></g>;
                  })}
                  {analysis.graph.nodes.map((n: any) => {
                    const p = positions[n.id]; if (!p) return null;
                    const nC: any = { root_cause: { bg: C.desLight, border: C.des, text: "#8B2020" }, impacted: { bg: C.impactLight, border: C.impact, text: "#8B6914" }, error: { bg: "#FDF2F0", border: "#E74C3C30", text: "#C0392B" }, ok: { bg: C.bgWhite, border: C.border, text: C.textSec } };
                    const c = nC[n.visual_status] || nC.ok;
                    const sel = n.id === selNode;
                    return <g key={n.id} className="gn" onClick={() => setSelNode(n.id)} style={{ cursor: "pointer" }}>
                      {n.is_root_cause && <rect x={p.x - 4} y={p.y - 4} width={208} height={76} rx={12} fill="none" stroke={C.des} strokeWidth={2} strokeDasharray="5,3"><animate attributeName="opacity" values="1;.3;1" dur="2.5s" repeatCount="indefinite" /></rect>}
                      {sel && !n.is_root_cause && <rect x={p.x - 2} y={p.y - 2} width={204} height={72} rx={11} fill="none" stroke={C.accent} strokeWidth={1.5} />}
                      <rect x={p.x} y={p.y} width={200} height={68} rx={10} fill={c.bg} stroke={c.border} strokeWidth={1.2} />
                      <text x={p.x + 10} y={p.y + 20} fill={c.text} fontSize={11} fontWeight={500} fontFamily="'DM Mono', monospace">{n.agent}</text>
                      {n.is_root_cause && <><rect x={p.x + 158} y={p.y + 8} width={32} height={14} rx={3} fill={C.desLight} stroke={C.des} strokeWidth={.5} /><text x={p.x + 174} y={p.y + 18} fill={C.des} fontSize={7} fontWeight={700} textAnchor="middle" fontFamily="'DM Mono'">DES</text></>}
                      <text x={p.x + 10} y={p.y + 36} fill={C.textMut} fontSize={9} fontFamily="'DM Mono',monospace">{n.operation}{n.tool ? ` → ${n.tool}` : ""}</text>
                      <text x={p.x + 10} y={p.y + 50} fill={C.textMut} fontSize={8} fontFamily="'DM Mono',monospace">{n.tokens}tok · {n.duration_ms}ms</text>
                      {n.degradation != null && <><rect x={p.x + 10} y={p.y + 59} width={110} height={2.5} rx={1} fill={C.bg} /><rect x={p.x + 10} y={p.y + 59} width={110 * n.degradation} height={2.5} rx={1} fill={C.impact} /></>}
                    </g>;
                  })}
                </svg>
              </div>

              {/* Right panel */}
              <div style={{ background: C.bgWhite, borderLeft: `1px solid ${C.border}`, display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                {/* Stats */}
                <div style={{ display: "flex", padding: "10px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                  {[{ v: analysis.summary.total_spans, l: "Spans" }, { v: analysis.summary.agent_count, l: "Agents" }, { v: analysis.summary.error_count, l: "Errors", c: C.des }, { v: analysis.evidenceScore.score, l: "Evidence", c: analysis.evidenceScore.score >= 70 ? C.ok : analysis.evidenceScore.score >= 40 ? C.impact : C.des }].map(s => (
                    <div key={s.l} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{ fontSize: 16, ...mono, fontWeight: 600, color: s.c || "#111827" }}>{s.v}</div>
                      <div style={{ ...label, fontSize: 8, color: "#4B5563" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Confidence */}
                {analysis.summary.root_cause_found && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                    <span style={{ ...label, fontSize: 8, color: "#4B5563" }}>CIA SCORE</span>
                    <div style={{ flex: 1, height: 5, background: C.bg, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${analysis.summary.root_cause_confidence * 100}%`, height: "100%", borderRadius: 3, background: analysis.summary.root_cause_confidence > .7 ? C.des : C.impact }} /></div>
                    <span style={{ fontSize: 12, ...mono, fontWeight: 600, color: analysis.summary.root_cause_confidence > .7 ? C.des : C.impact }}>{Math.round(analysis.summary.root_cause_confidence * 100)}%</span>
                  </div>
                )}

                {/* Tabs */}
                <div style={{ display: "flex", gap: 3, padding: "8px 12px", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", flexShrink: 0, background: "#FAFAFD" }}>
                  {["report", "evidence", "propagation", "decisions", "checklist", "export"].map(t => (
                    <button key={t} onClick={() => setSection(t)} style={{ ...label, padding: "6px 10px", background: section === t ? C.accentLight : "#F3F4F6", color: section === t ? C.accent : "#374151", border: `1px solid ${section === t ? C.accent + "50" : C.border}`, borderRadius: 5, fontSize: 9, fontWeight: 600, cursor: "pointer", letterSpacing: "1.2px" }}>{t}</button>
                  ))}
                </div>

                {/* Tab Content (Scrollable Container) */}
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", scrollBehavior: "smooth", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", padding: "14px 16px 28px 16px" }}>
                  {section === "report" && (
                    <div>
                      <div style={{ ...card, padding: 16, borderLeft: `3px solid ${C.des}`, marginBottom: 14 }}>
                        <div style={{ ...label, color: C.des, marginBottom: 6, fontSize: 9, fontWeight: 700 }}>DECISIVE ERROR STEP</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{analysis.root_cause.agent} → {analysis.root_cause.operation}</div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6, marginBottom: 6 }}>{analysis.root_cause.detail}</div>
                        <div style={{ display: "flex", gap: 12 }}><span style={{ fontSize: 10, ...mono, color: "#4B5563", fontWeight: 500 }}>Node: {analysis.root_cause.node}</span><span style={{ fontSize: 10, ...mono, color: C.des, fontWeight: 600 }}>Confidence: {Math.round(analysis.root_cause.confidence * 100)}%</span></div>
                      </div>
                      <div style={{ ...card, padding: 14, marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ ...label, fontSize: 9, color: "#374151" }}>EVIDENCE SCORE</span><span style={{ fontSize: 20, ...mono, fontWeight: 600, color: analysis.evidenceScore.score >= 70 ? C.ok : analysis.evidenceScore.score >= 40 ? C.impact : C.des }}>{analysis.evidenceScore.score}</span></div>
                        <div style={{ height: 5, background: C.bg, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}><div style={{ width: `${analysis.evidenceScore.score}%`, height: "100%", borderRadius: 3, background: analysis.evidenceScore.score >= 70 ? C.ok : analysis.evidenceScore.score >= 40 ? C.impact : C.des }} /></div>
                        <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{analysis.evidenceScore.explanation}</div>
                        <div style={{ display: "flex", gap: 10, marginTop: 6 }}><span style={{ fontSize: 10, ...mono, color: C.ok, fontWeight: 600 }}>● {analysis.evidenceScore.obs} observable</span><span style={{ fontSize: 10, ...mono, color: "#4B5563", fontWeight: 500 }}>○ {analysis.evidenceScore.inf} inferred</span></div>
                      </div>
                      {analysis.decisions.length > 0 && (
                        <div style={{ ...card, padding: 14, borderLeft: `3px solid ${C.ok}`, marginBottom: 14 }}>
                          <div style={{ ...label, color: C.ok, fontSize: 9, marginBottom: 6, fontWeight: 700 }}>RECOMMENDED ACTION</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>[{analysis.decisions[0].pri}] {analysis.decisions[0].title}</div>
                          <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.6 }}>{analysis.decisions[0].why}</div>
                          <div style={{ fontSize: 10, ...mono, color: "#4B5563", marginTop: 4, fontWeight: 500 }}>Effort: {analysis.decisions[0].effort} · Confidence: {analysis.decisions[0].conf}</div>
                        </div>
                      )}
                      <div style={{ ...card, padding: 14 }}>
                        <div style={{ ...label, fontSize: 9, color: "#374151", marginBottom: 10 }}>AGENT TRUST</div>
                        {Object.entries(analysis.agent_scores).sort((a: any, b: any) => a[1] - b[1]).map(([ag, sc]: [string, any]) => (
                          <div key={ag} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 600, minWidth: 90, color: "#111827" }}>{ag}</span>
                            <div style={{ flex: 1, height: 5, background: C.bg, borderRadius: 2.5, overflow: "hidden" }}><div style={{ width: `${sc}%`, height: "100%", borderRadius: 2.5, background: sc > 70 ? C.ok : sc > 40 ? C.impact : C.des }} /></div>
                            <span style={{ fontSize: 11, ...mono, fontWeight: 600, color: sc > 70 ? C.ok : sc > 40 ? C.impact : C.des, minWidth: 34 }}>{sc}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section === "evidence" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {analysis.evidence.map((e: any) => (
                        <div key={e.id} onClick={() => setSelNode(e.step)} style={{ ...card, padding: 14, cursor: "pointer", borderLeft: `3px solid ${e.sev === "critical" ? C.des : e.sev === "high" ? C.impact : "#4B5563"}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>{e.title}</span>
                            <div style={{ display: "flex", gap: 3 }}>
                              <span style={{ ...label, fontSize: 9, padding: "2px 6px", borderRadius: 3, background: e.cat === "observable" ? C.okLight : C.tag, color: e.cat === "observable" ? C.ok : "#4B5563", letterSpacing: "1px" }}>{e.cat}</span>
                              <span style={{ ...label, fontSize: 9, padding: "2px 6px", borderRadius: 3, background: e.sev === "critical" ? C.desLight : C.tag, color: e.sev === "critical" ? C.des : "#4B5563", letterSpacing: "1px" }}>{e.sev}</span>
                            </div>
                          </div>
                          <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{e.desc}</div>
                          <div style={{ fontSize: 10, ...mono, color: "#4B5563", marginTop: 3 }}>Step: {e.step}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "propagation" && (
                    <div>
                      <div style={{ ...label, fontSize: 9, color: "#374151", marginBottom: 10 }}>FAILURE PROPAGATION</div>
                      {analysis.propagation.stages.map((s: any, i: number) => (
                        <div key={s.id}>
                          <div onClick={() => setSelNode(s.step)} style={{ ...card, padding: 14, cursor: "pointer", borderLeft: `3px solid ${s.sev === "critical" ? C.des : C.impact}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <div style={{ ...label, fontSize: 9, color: s.sev === "critical" ? C.des : C.impact, letterSpacing: "1.5px" }}>{s.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "#111827", marginTop: 3 }}>{s.agent}</div>
                              </div>
                              {s.deg && <span style={{ fontSize: 10, ...mono, fontWeight: 600, color: C.impact }}>{Math.round(s.deg * 100)}%</span>}
                            </div>
                            <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5, marginTop: 4 }}>{s.desc}</div>
                          </div>
                          {i < analysis.propagation.stages.length - 1 && <div style={{ display: "flex", justifyContent: "center", padding: "2px 0" }}><div style={{ width: 1, height: 18, background: C.border }} /></div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "decisions" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ ...label, fontSize: 9, color: "#374151", marginBottom: 2 }}>RANKED ACTIONS</div>
                      {analysis.decisions.map((d: any) => (
                        <div key={d.id} style={{ ...card, padding: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{d.title}</span><span style={{ fontSize: 10, color: d.pri === "P0" ? C.des : C.impact, ...mono, fontWeight: 600, background: d.pri === "P0" ? C.desLight : C.impactLight, padding: "2px 8px", borderRadius: 4 }}>{d.pri}</span></div>
                          {[{ l: "Why", v: d.why }, { l: "Impact", v: d.impact }, { l: "Risks", v: d.risks }].map(f => (
                            <div key={f.l} style={{ marginBottom: 4 }}>
                              <div style={{ ...label, fontSize: 8, color: "#4B5563", marginBottom: 1 }}>{f.l}</div>
                              <div style={{ fontSize: 11, color: "#374151", lineHeight: 1.5 }}>{f.v}</div>
                            </div>
                          ))}
                          <div style={{ display: "flex", gap: 14, marginTop: 3 }}><span style={{ fontSize: 10, ...mono, color: "#4B5563" }}>Confidence: {d.conf}</span><span style={{ fontSize: 10, ...mono, color: "#4B5563" }}>Effort: {d.effort}</span></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {section === "checklist" && (
                    <div>
                      <div style={{ ...label, fontSize: 9, color: "#374151", marginBottom: 10 }}>VALIDATION CHECKLIST</div>
                      {analysis.checklist.map((c: any) => (
                        <div key={c.id} onClick={() => setCkState((p: any) => ({ ...p, [c.id]: !p[c.id] }))} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", ...card, marginBottom: 4, cursor: "pointer", background: ckState[c.id] ? C.okLight : C.bgWhite, borderColor: ckState[c.id] ? C.okBorder : C.border }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${ckState[c.id] ? C.ok : C.border}`, background: ckState[c.id] ? C.ok : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{ckState[c.id] && <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
                          <span style={{ fontSize: 12, color: ckState[c.id] ? "#4B5563" : "#111827", textDecoration: ckState[c.id] ? "line-through" : "none", lineHeight: 1.5 }}>{c.text}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 8, fontSize: 11, ...mono, color: "#4B5563", textAlign: "center" }}>{Object.values(ckState).filter(Boolean).length} / {analysis.checklist.length} completed</div>
                    </div>
                  )}

                  {section === "export" && (
                    <div>
                      <div style={{ ...label, fontSize: 9, color: "#374151", marginBottom: 10 }}>ENGINEERING SUMMARY</div>
                      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                        <button onClick={() => navigator.clipboard.writeText(analysis.summaryReport)} style={{ flex: 1, padding: "10px", ...mono, fontSize: 11, fontWeight: 500, background: C.accent, color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" }}>Copy</button>
                        <button onClick={() => { const b = new Blob([analysis.summaryReport], { type: "text/markdown" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "404ai-report.md"; a.click(); }} style={{ flex: 1, padding: "10px", ...mono, fontSize: 11, fontWeight: 500, ...card, cursor: "pointer", color: "#111827" }}>Download .md</button>
                      </div>
                      <div style={{ ...card, padding: 14, ...mono, fontSize: 10, lineHeight: 1.7, color: "#374151", whiteSpace: "pre-wrap", maxHeight: 300, overflowY: "auto" }}>{analysis.summaryReport}</div>
                      <div style={{ ...card, padding: 16, marginTop: 14 }}>
                        <div style={{ fontSize: 12, marginBottom: 8, fontFamily: "'DM Mono', monospace", color: "#111827" }}>Was this diagnosis helpful?</div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => setFb("yes")} style={{ flex: 1, padding: "8px", ...card, fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: "pointer", background: fb === "yes" ? C.okLight : C.bgWhite, color: fb === "yes" ? C.ok : "#374151", borderColor: fb === "yes" ? C.okBorder : C.border }}>✓ Correct</button>
                          <button onClick={() => setFb("no")} style={{ flex: 1, padding: "8px", ...card, fontSize: 12, fontFamily: "'DM Mono', monospace", cursor: "pointer", background: fb === "no" ? C.desLight : C.bgWhite, color: fb === "no" ? C.des : "#374151" }}>✕ Incorrect</button>
                        </div>
                        {fb === "yes" && <div style={{ fontSize: 11, color: C.ok, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>Thank you. Feedback recorded.</div>}
                        {fb === "no" && <div style={{ marginTop: 6 }}><textarea value={fbText} onChange={e => setFbText(e.target.value)} placeholder="What actually caused the issue?" style={{ width: "100%", minHeight: 50, padding: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 11, ...mono, resize: "vertical", outline: "none", color: "#111827" }} /><button onClick={() => setFb("sent")} style={{ marginTop: 4, padding: "6px 14px", background: C.accent, color: "#fff", border: "none", borderRadius: 4, ...mono, fontSize: 10, cursor: "pointer" }}>Submit</button></div>}
                        {fb === "sent" && <div style={{ fontSize: 11, color: C.ok, marginTop: 6, fontFamily: "'DM Mono', monospace" }}>Feedback recorded.</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Node detail inspector */}
                {selData && (
                  <div style={{ borderTop: `1px solid ${C.border}`, padding: 14, maxHeight: "35%", overflowY: "auto", flexShrink: 0, background: C.bgWhite }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ ...label, fontSize: 9, padding: "2px 7px", borderRadius: 3, background: selData.visual_status === "root_cause" ? C.desLight : C.tag, color: selData.visual_status === "root_cause" ? C.des : "#4B5563", letterSpacing: "1px" }}>{selData.visual_status === "root_cause" ? "DES" : selData.visual_status}</span>
                        <span style={{ fontSize: 12, ...mono, fontWeight: 600, color: "#111827" }}>{selData.id}</span>
                      </div>
                      <button onClick={() => setSelNode(null)} style={{ background: "none", border: "none", fontSize: 14, cursor: "pointer", color: "#4B5563", padding: "0 4px" }} title="Close Inspector">✕</button>
                    </div>
                    {[{ l: "Agent", v: selData.agent }, { l: "Operation", v: selData.operation + (selData.tool ? ` → ${selData.tool}` : "") }, selData.reasoning && { l: "Reasoning", v: selData.reasoning }, selData.output_summary && { l: "Output", v: selData.output_summary }, selData.error && { l: "Error", v: selData.error, c: C.des }].filter(Boolean).map((f: any) => (
                      <div key={f.l} style={{ marginBottom: 6 }}>
                        <div style={{ ...label, fontSize: 8, color: "#4B5563", marginBottom: 2 }}>{f.l}</div>
                        <div style={{ fontSize: 11, color: f.c || "#111827", lineHeight: 1.5, background: "#F3F4F6", padding: "6px 10px", borderRadius: 5, border: `1px solid ${C.border}`, ...mono, wordBreak: "break-word" }}>{f.v}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
      <style>{`::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#f1f1f8}::-webkit-scrollbar-thumb{background:#b0b0cc;border-radius:4px}`}</style>
    </div>
  );
}
