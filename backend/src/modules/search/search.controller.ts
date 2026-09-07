import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
@ApiTags('Search') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('search')
export class SearchController {
  constructor(private svc: SearchService) {}
}
