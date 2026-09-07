import { AiModule } from '../ai/ai.module';
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
@Module({ imports: [AiModule], controllers: [ChatController], providers: [ChatService], exports: [ChatService] })
export class ChatModule {}
