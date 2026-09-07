import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalysisService } from './analysis.service';
@ApiTags('Analysis') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('analyses')
export class AnalysisController {
  constructor(private svc: AnalysisService) {}
}
