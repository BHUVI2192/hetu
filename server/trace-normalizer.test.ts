import { describe, expect, it } from "vitest";
import { detectFramework, normalizeTrace } from "./trace-normalizer";

describe("trace normalization", () => {
  it("detects OpenTelemetry and flattens resource spans", () => {
    const trace = normalizeTrace(JSON.stringify({ resourceSpans: [{ scopeSpans: [{ spans: [{ span_id: "span-1", name: "sql_query", kind: "tool_call", status: { code: 2 }, agent: "retriever" }] }] }] }));
    expect(trace.framework).toBe("opentelemetry");
    expect(trace.events).toHaveLength(1);
    expect(trace.events[0]?.type).toBe("TOOL_CALL");
    expect(trace.summary.tools).toBe(1);
  });

  it("detects LangChain and normalizes JSON arrays", () => {
    const trace = normalizeTrace(JSON.stringify([{ run_id: "run-1", name: "on_chain_start", event: "on_chain_start", agent: "planner" }, { run_id: "run-2", name: "on_tool_end", event: "tool_result", status: "success" }]));
    expect(trace.framework).toBe("langchain");
    expect(trace.events.map((event) => event.type)).toEqual(["AGENT_START", "TOOL_RESULT"]);
  });

  it("detects CrewAI and converts line logs into structured events", () => {
    const trace = normalizeTrace("crewai task_started planner\ncrew tool_call search\ncrew error timeout");
    expect(detectFramework(trace.framework, trace)).toBe("crewai");
    expect(trace.events).toHaveLength(3);
    expect(trace.summary.errors).toBe(1);
  });

  it("redacts sensitive reasoning and key-shaped metadata", () => {
    const trace = normalizeTrace(JSON.stringify({ framework: "langgraph", event: "model_call", reasoning: "private chain of thought", api_key: "secret", output: "structured answer" }));
    const serialized = JSON.stringify(trace.events[0]);
    expect(serialized).not.toContain("private chain of thought");
    expect(serialized).not.toContain("secret");
    expect(serialized).toContain("structured answer");
  });
});
