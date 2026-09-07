import { Injectable } from '@nestjs/common';
import { GeminiProvider } from './providers/gemini.provider';
import { RCA_SYS, RCA_USER } from './prompts/root-cause.prompt';
@Injectable()
export class AiService {
  constructor(private gemini: GeminiProvider) {}
  async analyze(events: any[]) {
    const r = await this.gemini.generate(RCA_SYS, RCA_USER({ events }));
    const d = r.json;
    return { hypotheses: d.hypotheses?.length ? d.hypotheses : [{ title: d.rootCause?.title || 'Unknown', explanation: d.rootCause?.description || '', confidence: d.rootCause?.confidence || 0 }], recommendations: d.recommendations || [], confidence: d.confidence || 0, summary: d.summary || 'Done.', tokensUsed: r.tokensUsed, model: r.model };
  }
  async chat(q: string, ctx: any) { const r = await this.gemini.generate('You are an investigation assistant. Answer based on evidence only.', `Context: ${ctx.summary}\nQuestion: ${q}`); return { answer: r.text, tokensUsed: r.tokensUsed }; }
}
