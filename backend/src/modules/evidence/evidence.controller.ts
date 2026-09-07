import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EvidenceService } from './evidence.service';
@ApiTags('Evidence') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('evidence')
export class EvidenceController {
  constructor(private svc: EvidenceService) {}
}
