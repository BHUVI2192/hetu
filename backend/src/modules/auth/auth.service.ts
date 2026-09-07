import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async register(dto: RegisterDto) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email } })) throw new ConflictException('Email exists');
    const u = await this.prisma.user.create({ data: { fullName: dto.fullName, email: dto.email, passwordHash: await bcrypt.hash(dto.password, 12) } });
    await this.prisma.workspace.create({ data: { ownerId: u.id, name: `${dto.fullName}'s Workspace` } });
    return { user: { id: u.id, email: u.email, fullName: u.fullName }, token: this.jwt.sign({ sub: u.id, email: u.email }) };
  }
  async login(dto: LoginDto) {
    const u = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!u?.passwordHash || !(await bcrypt.compare(dto.password, u.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    await this.prisma.user.update({ where: { id: u.id }, data: { lastLogin: new Date() } });
    return { user: { id: u.id, email: u.email, fullName: u.fullName }, token: this.jwt.sign({ sub: u.id, email: u.email }) };
  }
  async me(id: string) { return this.prisma.user.findUnique({ where: { id }, select: { id: true, email: true, fullName: true, avatarUrl: true, createdAt: true } }); }
}