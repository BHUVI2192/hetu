import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}
  findAll(filter: any) { return this.prisma.workspace.findMany({ where: { ...filter, deletedAt: null }, orderBy: { createdAt: 'desc' } }); }
  async findOne(id: string) { const r = await this.prisma.workspace.findFirst({ where: { id, deletedAt: null } }); if (!r) throw new NotFoundException(); return r; }
  create(data: any) { return this.prisma.workspace.create({ data }); }
  update(id: string, data: any) { return this.prisma.workspace.update({ where: { id }, data }); }
  remove(id: string) { return this.prisma.workspace.update({ where: { id }, data: { deletedAt: new Date() } }); }
}