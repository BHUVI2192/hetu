import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
export interface AiResponse { text: string; json: any; tokensUsed: number; model: string; }
@Injectable()
export class GeminiProvider {
  private logger = new Logger('Gemini');
  private client: GoogleGenerativeAI | null = null;
  constructor(config: ConfigService) { const k = config.get('GEMINI_API_KEY'); if (k) this.client = new GoogleGenerativeAI(k); }
  async generate(sys: string, user: string): Promise<AiResponse> {
    if (!this.client) return { text: '{}', json: { rootCause: { title: 'AI not configured', description: 'Set GEMINI_API_KEY', confidence: 0 }, hypotheses: [], recommendations: [], summary: 'Configure GEMINI_API_KEY.', confidence: 0 }, tokensUsed: 0, model: 'mock' };
    try {
      const m = this.client.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction: sys, generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } });
      const r = await m.generateContent(user); const t = r.response.text(); let j: any = {}; try { j = JSON.parse(t); } catch { j = { raw: t }; }
      return { text: t, json: j, tokensUsed: (r.response.usageMetadata?.promptTokenCount || 0) + (r.response.usageMetadata?.candidatesTokenCount || 0), model: 'gemini-1.5-flash' };
    } catch (e) { this.logger.error(e); return this.generate('', ''); }
  }
}
