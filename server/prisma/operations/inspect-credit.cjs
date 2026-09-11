require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const credits = await prisma.credit.findMany({
    where: { code: 'CRE-00001' },
    select: {
      id: true, code: true, createdAt: true, disbursedAt: true, firstDueDate: true,
      documentDate: true, status: true, paymentFrequency: true,
      schedules: { orderBy: { installmentNo: 'asc' }, select: { installmentNo: true, dueDate: true, paidAmount: true, penalty: true } },
      _count: { select: { payments: true } },
    },
  });
  console.log(JSON.stringify(credits, null, 2));
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
