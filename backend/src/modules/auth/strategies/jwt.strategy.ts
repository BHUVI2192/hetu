import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({ jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), secretOrKey: config.get('JWT_SECRET') || 'dev-secret' });
  }
  async validate(p: { sub: string }) {
    const u = await this.prisma.user.findUnique({ where: { id: p.sub } });
    if (!u) throw new UnauthorizedException();
    return { id: u.id, email: u.email, fullName: u.fullName };
  }
}