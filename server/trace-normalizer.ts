export type TraceFramework = "opentelemetry" | "langgraph" | "langchain" | "crewai" | "autogen" | "generic";
export type NormalizedEventType = "AGENT_START" | "AGENT_END" | "MODEL_CALL" | "TOOL_CALL" | "TOOL_RESULT" | "RETRIEVAL" | "MEMORY_READ" | "MEMORY_WRITE" | "SUB_AGENT" | "STATE_CHANGE" | "RETRY" | "ERROR" | "CHECKPOINT" | "SNAPSHOT" | "USER_INPUT" | "AGENT_OUTPUT" | "CUSTOM_EVENT";

export type NormalizedEvent = {
  id: string;
  timestamp?: string;
  type: NormalizedEventType;
  name: string;
  agent?: string;
  parentId?: string;
  status?: "ok" | "error" | "unknown";
  input?: string;
  output?: string;
  metadata: Record<string, string | number | boolean | null>;
};

export type NormalizedTrace = {
  framework: TraceFramework;
  runId: string;
  events: NormalizedEvent[];
  summary: { agents: number; tools: number; errors: number; durationMs?: number };
  warnings: string[];
};

const text = (value: unknown) => typeof value === "string" ? value : value == null ? undefined : JSON.stringify(value);
const bounded = (value: string | undefined) => value?.slice(0, 1200);
const stringRecord = (value: Record<string, unknown>) => Object.fromEntries(Object.entries(value).filter(([key]) => !/(thought|chain.?of.?thought|reasoning|api.?key|token)/i.test(key)).slice(0, 24).map(([key, item]) => [key, typeof item === "string" || typeof item === "number" || typeof item === "boolean" || item == null ? item : JSON.stringify(item).slice(0, 400)]));

function eventFromObject(item: Record<string, unknown>, index: number): NormalizedEvent {
  const rawType = String(item.event ?? item.type ?? item.kind ?? item.name ?? "CUSTOM_EVENT").toLowerCase();
  const name = String(item.name ?? item.operation ?? item.action ?? item.event ?? `event_${index + 1}`);
  let type: NormalizedEventType = "CUSTOM_EVENT";
  if (/tool.*(call|start)|function/.test(rawType)) type = "TOOL_CALL";
  else if (/tool.*(result|end)|function_result/.test(rawType)) type = "TOOL_RESULT";
  else if (/retriev|vector|search/.test(rawType)) type = "RETRIEVAL";
  else if (/memory.*(read|get)/.test(rawType)) type = "MEMORY_READ";
  else if (/memory.*(write|set|save)/.test(rawType)) type = "MEMORY_WRITE";
  else if (/llm|model|chat|generation/.test(rawType)) type = "MODEL_CALL";
  else if (/error|exception|fail/.test(rawType) || item.error) type = "ERROR";
  else if (/agent.*start|chain_start|on_chain_start/.test(rawType)) type = "AGENT_START";
  else if (/agent.*end|chain_end|on_chain_end/.test(rawType)) type = "AGENT_END";
  else if (/retry/.test(rawType)) type = "RETRY";
  else if (/checkpoint/.test(rawType)) type = "CHECKPOINT";
  else if (/snapshot/.test(rawType)) type = "SNAPSHOT";
  else if (/input|user/.test(rawType)) type = "USER_INPUT";
  else if (/output|response/.test(rawType)) type = "AGENT_OUTPUT";
  const status = item.error || /error|fail/.test(rawType) ? "error" : item.status === "ok" || item.status === "success" ? "ok" : "unknown";
  const metadata = stringRecord(item) as Record<string, string | number | boolean | null>;
  return { id: String(item.id ?? item.span_id ?? item.run_id ?? `evt_${index + 1}`), timestamp: text(item.timestamp ?? item.start_time ?? item.time), type, name, agent: text(item.agent ?? item.assistant ?? item.node ?? item.component), parentId: text(item.parent_id ?? item.parent_run_id ?? item.parentSpanId), status, input: bounded(text(item.input ?? item.inputs)), output: bounded(text(item.output ?? item.outputs ?? item.result)), metadata };
}

function flatten(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.filter((item): item is Record<string, unknown> => !!item && typeof item === "object");
  if (!value || typeof value !== "object") return [];
  const object = value as Record<string, unknown>;
  for (const key of ["events", "spans", "runs", "trace", "records", "steps"]) if (Array.isArray(object[key])) return flatten(object[key]);
  if (object.resourceSpans) return flatten((object.resourceSpans as Record<string, unknown>[]).flatMap((resource) => ((resource.scopeSpans as Record<string, unknown>[]) ?? []).flatMap((scope) => Array.isArray(scope.spans) ? scope.spans : [])));
  return [object];
}

export function detectFramework(raw: string, parsed: unknown): TraceFramework {
  const haystack = `${raw.slice(0, 10000)} ${JSON.stringify(parsed ?? "")}`.toLowerCase();
  if (/resourceSpans|opentelemetry|otel|trace_id|span_id/.test(haystack)) return "opentelemetry";
  if (/langgraph|langgraph_checkpoint|pregel|stategraph/.test(haystack)) return "langgraph";
  if (/langchain|on_chain_start|langsmith|lc_run/.test(haystack)) return "langchain";
  if (/crewai|crew|task_started|agent_started/.test(haystack)) return "crewai";
  if (/autogen|conversation_id/.test(haystack)) return "autogen";
  return "generic";
}

export function normalizeTrace(raw: string): NormalizedTrace {
  const trimmed = raw.trim();
  let parsed: unknown;
  try { parsed = JSON.parse(trimmed); } catch { parsed = trimmed.split(/\r?\n/).filter(Boolean).map((line) => ({ name: line.slice(0, 100), event: /error|fail/i.test(line) ? "error" : /tool|query|retriev/i.test(line) ? "tool_call" : "custom_event", raw: line })); }
  const records = flatten(parsed);
  const events = records.map(eventFromObject);
  const framework = detectFramework(raw, parsed);
  const runId = String((records[0]?.run_id ?? records[0]?.trace_id ?? records[0]?.id ?? `run_${Date.now()}`));
  const agents = new Set(events.map((event) => event.agent).filter(Boolean)).size;
  const tools = events.filter((event) => event.type === "TOOL_CALL" || event.type === "TOOL_RESULT").length;
  const errors = events.filter((event) => event.status === "error").length;
  const timestamps = events.map((event) => event.timestamp ? Date.parse(event.timestamp) : NaN).filter(Number.isFinite);
  const durationMs = timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : undefined;
  return { framework, runId, events, summary: { agents, tools, errors, durationMs }, warnings: events.length ? [] : ["No structured events were detected. Add event, span, run, or step records for richer RCA."] };
}
