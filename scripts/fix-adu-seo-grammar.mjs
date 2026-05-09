import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const projects = await prisma.project.findMany({
  where: {
    deletedAt: null,
    categoryId: { in: ['adu', 'adu1'] },
  },
});

let updated = 0;
for (const project of projects) {
  const seoDescription = String(project.seoDescription || '').replace(' is a ADU ', ' is an ADU ');
  const content = String(project.content || '').replaceAll(' is a ADU interior design', ' is an ADU interior design');
  if (seoDescription === project.seoDescription && content === project.content) continue;

  await prisma.project.update({
    where: { id: project.id },
    data: {
      seoDescription,
      content,
      updatedAt: new Date().toISOString(),
    },
  });
  updated += 1;
}

console.log(JSON.stringify({ updated }, null, 2));
await prisma.$disconnect();
