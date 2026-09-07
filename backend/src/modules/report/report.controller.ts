import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportService } from './report.service';
@ApiTags('Report') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('reports')
export class ReportController {
  constructor(private svc: ReportService) {}
}
