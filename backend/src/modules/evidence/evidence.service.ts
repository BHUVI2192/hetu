import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class EvidenceService {
  constructor(private prisma: PrismaService) {}
}
