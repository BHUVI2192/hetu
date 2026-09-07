import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationService } from './notification.service';
@ApiTags('Notification') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('notifications')
export class NotificationController {
  constructor(private svc: NotificationService) {}
}
