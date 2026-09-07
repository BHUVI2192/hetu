import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { ProjectModule } from './modules/project/project.module';
import { UploadModule } from './modules/upload/upload.module';
import { ParserModule } from './modules/parser/parser.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { GraphModule } from './modules/graph/graph.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { AiModule } from './modules/ai/ai.module';
import { ReportModule } from './modules/report/report.module';
import { ChatModule } from './modules/chat/chat.module';
import { SearchModule } from './modules/search/search.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationModule } from './modules/notification/notification.module';
import { Controller, Get } from '@nestjs/common';
@Controller('health') class HealthCtrl { @Get() check() { return { status: 'ok' }; } }
@Module({ imports: [ConfigModule.forRoot({isGlobal:true}),PrismaModule,AuthModule,WorkspaceModule,ProjectModule,UploadModule,ParserModule,TimelineModule,GraphModule,EvidenceModule,AnalysisModule,AiModule,ReportModule,ChatModule,SearchModule,AuditModule,NotificationModule], controllers: [HealthCtrl] })
export class AppModule {}
