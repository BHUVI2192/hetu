import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@ApiTags('Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analyses')
export class AnalysisController {
  constructor(private readonly svc: AnalysisService) {}

  @Post('executions')
  ingest(@Req() req: any, @Body() body: any) {
    return this.svc.ingestExecution(req.user.id, body);
  }

  @Get('executions/:executionId/rca')
  rca(@Req() req: any, @Param('executionId') executionId: string) {
    return this.svc.getRca(req.user.id, executionId);
  }

  @Get('executions/:executionId/graph')
  graph(@Req() req: any, @Param('executionId') executionId: string) {
    return this.svc.getGraph(req.user.id, executionId);
  }

  @Get('executions/:executionId/timeline')
  timeline(@Req() req: any, @Param('executionId') executionId: string) {
    return this.svc.getTimeline(req.user.id, executionId);
  }
}
