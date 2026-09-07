import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ParserService } from './parser.service';
@ApiTags('Parser') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('parser')
export class ParserController {
  constructor(private svc: ParserService) {}
}
