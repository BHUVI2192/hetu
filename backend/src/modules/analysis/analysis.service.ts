import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class AnalysisService {
  constructor(private prisma: PrismaService) {}
}
