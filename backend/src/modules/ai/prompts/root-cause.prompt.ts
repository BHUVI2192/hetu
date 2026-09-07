export const RCA_SYS = 'You are an expert SRE. Analyze evidence and determine root cause. Return JSON only: { rootCause: { title, description, confidence: 0-100 }, hypotheses: [{ title, explanation, confidence }], recommendations: [{ category, text, priority }], summary, confidence: 0-100 }';
export const RCA_USER = (ctx: any) => `Analyze:\n${JSON.stringify(ctx.events?.slice(0, 50))}`;
