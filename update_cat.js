import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.category.update({where: {id: 82}, data: {navigationStatus: 1, homeStatus: 1}})
  .then(c => console.log('updated category', c.id))
  .catch(e => console.error(e))
  .finally(() => p.$disconnect());
