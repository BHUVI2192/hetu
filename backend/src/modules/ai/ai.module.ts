import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { GeminiProvider } from './providers/gemini.provider';
@Module({ providers: [AiService, GeminiProvider], exports: [AiService] })
export class AiModule {}
