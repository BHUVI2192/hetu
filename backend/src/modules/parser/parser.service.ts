import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ParserService {
  constructor(private prisma: PrismaService) {}
}
