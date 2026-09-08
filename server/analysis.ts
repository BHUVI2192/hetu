import type { NormalizedEvent, NormalizedTrace } from "./trace-normalizer";

export type AnalysisEvidence = {
  eventId: string;
  kind: "observable" | "inferred";
  claim: string;
  source: string;
  score: number;
};

export type AnalysisPropagation = {
  fromEventId: string;
  toEventId: string;
  relation: "direct" | "indirect" | "branch";
  impact: "low" | "medium" | "high";
};

export type ExecutionAnalysis = {
  decisiveStep?: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  rootCause: string;
  recommendation: string;
  alternatives: string[];
  propagation: AnalysisPropagation[];
  evidence: AnalysisEvidence[];
};

const eventLabel = (event: NormalizedEvent) => `${event.type.toLowerCase().replaceAll("_", " ")} · ${event.name}`;

function categoryFor(event: NormalizedEvent) {
  const haystack = `${event.type} ${event.name} ${event.input ?? ""} ${event.output ?? ""}`.toLowerCase();
  if (event.type === "RETRY") return "retry_storm";
  if (event.type === "TOOL_CALL" || event.type === "TOOL_RESULT") return /invalid|argument|schema|parameter/.test(haystack) ? "invalid_tool_argument" : "tool_failure";
  if (event.type === "RETRIEVAL") return "retrieval_failure";
  if (event.type === "MEMORY_READ" || event.type === "MEMORY_WRITE") return "memory_contamination";
  if (event.type === "MODEL_CALL") return "model_failure";
  if (event.type === "STATE_CHANGE") return "state_corruption";
  return "workflow_failure";
}

function downstream(events: NormalizedEvent[], root: NormalizedEvent) {
  const index = events.findIndex((event) => event.id === root.id);
  return events.slice(Math.max(0, index + 1)).filter((event) => event.id !== root.id).slice(0, 8);
}

export function analyzeTrace(trace: NormalizedTrace): ExecutionAnalysis {
  const explicitErrors = trace.events.filter((event) => event.status === "error" || event.type === "ERROR");
  const retries = trace.events.filter((event) => event.type === "RETRY");
  const root = explicitErrors[0] ?? retries[0] ?? trace.events.find((event) => event.type === "TOOL_RESULT" && event.status !== "ok");
  if (!root) {
    const last = trace.events.at(-1);
    return {
      decisiveStep: last?.id,
      category: "no_observed_failure",
      severity: "low",
      confidence: 34,
      rootCause: "No explicit failure signal was observed in the normalized execution.",
      recommendation: "Add validation, outcome assertions, and error metadata around the final agent output before treating this run as successful.",
      alternatives: ["The trace may be incomplete.", "The failure may be represented in an unrecognized custom event."],
      propagation: [],
      evidence: last ? [{ eventId: last.id, kind: "inferred", claim: `The latest event was ${eventLabel(last)}.`, source: "normalized execution order", score: 34 }] : [],
    };
  }

  const impacted = downstream(trace.events, root);
  const errorCount = explicitErrors.length + retries.length;
  const confidence = Math.min(98, 58 + errorCount * 8 + (root.parentId ? 6 : 0));
  const severity = impacted.length > 4 || errorCount > 2 ? "critical" : impacted.length > 1 || errorCount > 1 ? "high" : "medium";
  const category = categoryFor(root);
  const evidence: AnalysisEvidence[] = [
    { eventId: root.id, kind: "observable", claim: `The decisive candidate emitted ${eventLabel(root)} with status ${root.status}.`, source: "normalized event status and type", score: 96 },
  ];
  if (root.input) evidence.push({ eventId: root.id, kind: "observable", claim: "The decisive event includes input metadata that can be inspected without exposing private reasoning.", source: "event input metadata", score: 82 });
  if (impacted[0]) evidence.push({ eventId: impacted[0].id, kind: "inferred", claim: `${impacted.length} downstream event(s) followed the decisive candidate and may carry its impact.`, source: "event ordering and parent lineage", score: Math.min(90, 58 + impacted.length * 5) });

  return {
    decisiveStep: root.id,
    category,
    severity,
    confidence,
    rootCause: `The earliest observed causal break is ${eventLabel(root)}${root.agent ? ` in agent ${root.agent}` : ""}. It is the first event with an error or recovery signal before ${impacted.length} downstream event(s).`,
    recommendation: category === "tool_failure" || category === "invalid_tool_argument" ? "Validate tool arguments against the registered schema, capture the tool result, and replay with the tool output mocked before changing the model." : category === "retrieval_failure" ? "Inspect retrieval query, result quality, and grounding checks at this span; replay with recorded documents to isolate retrieval from generation." : "Capture a snapshot immediately before this step, replay in a safe mode, and change one controlled variable at a time.",
    alternatives: ["The upstream context may already contain an unrecorded defect.", "The adapter may have normalized a framework-specific failure as a generic event."],
    propagation: impacted.map((event, index) => ({ fromEventId: root.id!, toEventId: event.id, relation: event.parentId === root.id ? "direct" : index < 2 ? "branch" : "indirect", impact: index < 2 ? "high" : "medium" })),
    evidence,
  };
}

export type ExecutionDiff = {
  leftExecutionId: number;
  rightExecutionId: number;
  summary: string;
  changes: Array<{ area: string; left: string | number; right: string | number; direction: "improved" | "regressed" | "changed" | "same" }>;
};

export function diffTraces(leftExecutionId: number, left: { framework: string; eventCount: number; normalizedEvents: string; metadata: string }, rightExecutionId: number, right: { framework: string; eventCount: number; normalizedEvents: string; metadata: string }): ExecutionDiff {
  const leftEvents = JSON.parse(left.normalizedEvents) as NormalizedEvent[];
  const rightEvents = JSON.parse(right.normalizedEvents) as NormalizedEvent[];
  const leftErrors = leftEvents.filter((event) => event.status === "error").length;
  const rightErrors = rightEvents.filter((event) => event.status === "error").length;
  const leftTools = leftEvents.filter((event) => event.type === "TOOL_CALL").length;
  const rightTools = rightEvents.filter((event) => event.type === "TOOL_CALL").length;
  const direction = (a: number, b: number, lowerIsBetter = false): "improved" | "regressed" | "changed" | "same" => a === b ? "same" : lowerIsBetter ? b < a ? "improved" : "regressed" : b > a ? "improved" : "regressed";
  const changes = [
    { area: "framework", left: left.framework, right: right.framework, direction: left.framework === right.framework ? "same" as const : "changed" as const },
    { area: "event count", left: left.eventCount, right: right.eventCount, direction: direction(left.eventCount, right.eventCount, true) },
    { area: "errors", left: leftErrors, right: rightErrors, direction: direction(leftErrors, rightErrors, true) },
    { area: "tool calls", left: leftTools, right: rightTools, direction: direction(leftTools, rightTools, true) },
  ];
  const improved = changes.filter((change) => change.direction === "improved").length;
  const regressed = changes.filter((change) => change.direction === "regressed").length;
  return { leftExecutionId, rightExecutionId, summary: `${improved} improvement(s), ${regressed} regression(s), and ${changes.filter((change) => change.direction === "changed").length} changed area(s) across normalized execution signals.`, changes };
}
