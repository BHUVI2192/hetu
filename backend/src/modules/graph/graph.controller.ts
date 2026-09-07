import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GraphService } from './graph.service';
@ApiTags('Graph') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('graph')
export class GraphController {
  constructor(private svc: GraphService) {}
}
