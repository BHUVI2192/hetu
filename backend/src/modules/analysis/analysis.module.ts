import { AiModule } from '../ai/ai.module';
import { ParserModule } from '../parser/parser.module';
import { TimelineModule } from '../timeline/timeline.module';
import { GraphModule } from '../graph/graph.module';
import { EvidenceModule } from '../evidence/evidence.module';
import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
@Module({ imports: [AiModule, ParserModule, TimelineModule, GraphModule, EvidenceModule], controllers: [AnalysisController], providers: [AnalysisService], exports: [AnalysisService] })
export class AnalysisModule {}
