import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
@ApiTags('Auth') @Controller('auth')
export class AuthController {
  constructor(private svc: AuthService) {}
  @Post('register') register(@Body() dto: RegisterDto) { return this.svc.register(dto); }
  @Post('login') login(@Body() dto: LoginDto) { return this.svc.login(dto); }
  @Get('me') @UseGuards(JwtAuthGuard) @ApiBearerAuth() me(@Req() r: any) { return this.svc.me(r.user.id); }
}