import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
@ApiTags('Chat') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('chat')
export class ChatController {
  constructor(private svc: ChatService) {}
}
