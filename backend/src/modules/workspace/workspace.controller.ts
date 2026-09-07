import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceService } from './workspace.service';
@ApiTags('Workspaces') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('workspaces')
export class WorkspaceController {
  constructor(private svc: WorkspaceService) {}
  @Get() findAll(@Query() q: any) { return this.svc.findAll(q); }
  @Get(':id') findOne(@Param('id') id: string) { return this.svc.findOne(id); }
  @Post() create(@Body() b: any) { return this.svc.create(b); }
  @Patch(':id') update(@Param('id') id: string, @Body() b: any) { return this.svc.update(id, b); }
  @Delete(':id') remove(@Param('id') id: string) { return this.svc.remove(id); }
}