import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Phase2Service } from './phase2.service';

@ApiTags('Phase 2 debugging')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class Phase2Controller {
  constructor(private readonly phase2: Phase2Service) {}

  @Post('snapshots') createSnapshot(@Req() req: any, @Body() body: any) { return this.phase2.createSnapshot(req.user.id, body); }
  @Get('snapshots') listSnapshots(@Req() req: any, @Query() query: any) { return this.phase2.listSnapshots(req.user.id, query); }
  @Get('snapshots/:id') getSnapshot(@Req() req: any, @Param('id') id: string) { return this.phase2.getSnapshot(req.user.id, id); }

  @Post('replays') replay(@Req() req: any, @Body() body: any) { return this.phase2.replaySnapshot(req.user.id, body); }
  @Get('replays/:id') getReplay(@Req() req: any, @Param('id') id: string) { return this.phase2.getReplay(req.user.id, id); }

  @Post('forks') createFork(@Req() req: any, @Body() body: any) { return this.phase2.createFork(req.user.id, body); }
  @Post('forks/:id/run') runFork(@Req() req: any, @Param('id') id: string) { return this.phase2.runFork(req.user.id, id); }
  @Get('forks/:id') getFork(@Req() req: any, @Param('id') id: string) { return this.phase2.getFork(req.user.id, id); }

  @Post('diffs') createDiff(@Req() req: any, @Body() body: any) { return this.phase2.createDiff(req.user.id, body); }
  @Get('diffs/:id') getDiff(@Req() req: any, @Param('id') id: string) { return this.phase2.getDiff(req.user.id, id); }
}
