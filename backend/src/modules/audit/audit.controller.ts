import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
@ApiTags('Audit') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('audit')
export class AuditController {
  constructor(private svc: AuditService) {}
}
