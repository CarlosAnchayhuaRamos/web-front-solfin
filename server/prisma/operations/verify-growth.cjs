const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const [checks] = await prisma.$queryRaw`
    SELECT to_regclass('credit_code_seq') IS NOT NULL AS sequence,
           to_regclass('customer_accounts') IS NOT NULL AS accounts,
           to_regclass('customer_sessions') IS NOT NULL AS sessions,
           (SELECT COUNT(*)::int FROM pg_constraint WHERE conname IN (
             'payments_positive_amount', 'payments_allocation_amounts',
             'receipts_positive_amount', 'credits_positive_terms',
             'schedules_nonnegative_amounts', 'payments_receiptId_fkey',
             'payment_receipts_creditId_fkey', 'payment_receipts_userId_fkey'
           ) AND convalidated) AS constraints
  `;
  if (!checks.sequence || !checks.accounts || !checks.sessions || checks.constraints !== 8) {
    throw new Error('Missing migration objects');
  }
  await prisma.payment.findFirst({ select: { receiptId: true, baseAmount: true, penaltyAmount: true } });
  console.log('Growth migration verified: sequence, customer tables, payment columns and 8 constraints.');
}

verify().catch(() => {
  console.error('Growth migration verification failed.');
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
