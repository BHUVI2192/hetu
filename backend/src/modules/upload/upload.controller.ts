import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
@ApiTags('Upload') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('uploads')
export class UploadController {
  constructor(private svc: UploadService) {}
}
