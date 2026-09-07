import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('demo1234', 12);
  const user = await prisma.user.upsert({ where: { email: 'demo@404ai.dev' }, update: {}, create: { email: 'demo@404ai.dev', fullName: 'Demo User', passwordHash: hash } });
  const ws = await prisma.workspace.create({ data: { ownerId: user.id, name: 'Demo Workspace' } });
  await prisma.project.create({ data: { workspaceId: ws.id, name: 'Production API', description: 'Main production API', environment: 'production' } });
  console.log('Seed complete. Login: demo@404ai.dev / demo1234');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
