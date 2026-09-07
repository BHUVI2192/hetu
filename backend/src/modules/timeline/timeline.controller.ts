import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TimelineService } from './timeline.service';
@ApiTags('Timeline') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('timeline')
export class TimelineController {
  constructor(private svc: TimelineService) {}
}
