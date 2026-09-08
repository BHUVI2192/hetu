import { describe, expect, it } from "vitest";
import { analyzeTrace, diffTraces } from "./analysis";
import { normalizeTrace } from "./trace-normalizer";

describe("execution analysis", () => {
  it("identifies the earliest error as the decisive step and records propagation", () => {
    const trace = normalizeTrace(JSON.stringify({ framework: "langgraph", events: [
      { id: "start", event: "agent_start", agent: "researcher", status: "ok" },
      { id: "tool", event: "tool_call", name: "search", agent: "researcher", status: "error", error: "invalid argument" },
      { id: "output", event: "agent_output", agent: "reporter", status: "unknown", parent_id: "tool" },
    ] }));
    const result = analyzeTrace(trace);
    expect(result.decisiveStep).toBe("tool");
    expect(result.category).toBe("tool_failure");
    expect(result.evidence.some((item) => item.kind === "observable")).toBe(true);
    expect(result.propagation[0]?.toEventId).toBe("output");
    expect(result.confidence).toBeGreaterThan(50);
  });

  it("does not fabricate a failure when the trace has no observed error", () => {
    const result = analyzeTrace(normalizeTrace(JSON.stringify({ events: [{ id: "done", event: "agent_end", status: "ok" }] })));
    expect(result.category).toBe("no_observed_failure");
    expect(result.severity).toBe("low");
    expect(result.evidence[0]?.kind).toBe("inferred");
  });

  it("compares normalized executions with actionable change directions", () => {
    const left = { framework: "langgraph", eventCount: 4, normalizedEvents: JSON.stringify([{ type: "TOOL_CALL", status: "ok" }, { type: "ERROR", status: "error" }]), metadata: "{}" };
    const right = { framework: "langgraph", eventCount: 3, normalizedEvents: JSON.stringify([{ type: "TOOL_CALL", status: "ok" }]), metadata: "{}" };
    const diff = diffTraces(1, left, 2, right);
    expect(diff.summary).toContain("improvement");
    expect(diff.changes.find((change) => change.area === "errors")?.direction).toBe("improved");
  });
});
