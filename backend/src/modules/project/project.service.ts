import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}
  findAll(filter: any) { return this.prisma.project.findMany({ where: { ...filter, deletedAt: null }, orderBy: { createdAt: 'desc' } }); }
  async findOne(id: string) { const r = await this.prisma.project.findFirst({ where: { id, deletedAt: null } }); if (!r) throw new NotFoundException(); return r; }
  create(data: any) { return this.prisma.project.create({ data }); }
  update(id: string, data: any) { return this.prisma.project.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.project.update({ where: { id }, data: { deletedAt: new Date() } }); }
}