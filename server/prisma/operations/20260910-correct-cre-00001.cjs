require('dotenv').config({ path: require('path').join(__dirname, '../../.env'), quiet: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.$transaction(async (tx) => {
    const id = '562d77eb-cf10-4e80-8bdd-fd607cd9d3fb';
    await tx.$queryRaw`SELECT id FROM credits WHERE id = ${id}::uuid FOR UPDATE`;
    const credit = await tx.credit.findUnique({ where: { id }, include: { schedules: { orderBy: { installmentNo: 'asc' } }, _count: { select: { payments: true } } } });
    if (!credit || credit.code !== 'CRE-00001' || credit.paymentFrequency !== 'WEEKLY' || credit.status !== 'ACTIVE'
      || credit.disbursedAt?.toISOString() !== '2026-09-10T19:50:08.605Z' || credit._count.payments
      || credit.schedules.some((s) => Number(s.paidAmount) || Number(s.penalty))) throw new Error('El credito cambio; requiere nueva revision');
    const expected = (n) => new Date(Date.UTC(2026, 8, 10 + n * 7));
    if (credit.firstDueDate?.getTime() === expected(1).getTime()) { console.log('Cronograma ya corregido'); return; }
    if (credit.schedules.some((s) => s.dueDate.getTime() !== expected(s.installmentNo - 1).getTime())) throw new Error('Cronograma diferente al revisado');
    const before = credit.schedules.map((s) => ({ installmentNo: s.installmentNo, dueDate: s.dueDate.toISOString() }));
    for (const schedule of credit.schedules) await tx.paymentSchedule.update({ where: { id: schedule.id }, data: { dueDate: expected(schedule.installmentNo) } });
    await tx.credit.update({ where: { id }, data: { firstDueDate: expected(1), generatedDocuments: {} } });
    await tx.auditLog.create({ data: { organizationId: credit.organizationId, entity: 'Credit', entityId: id, action: 'CORRECT_WEEKLY_DUE_DATES',
      before: { schedules: before }, after: { reason: 'Correccion solicitada por el usuario: primera cuota a siete dias del desembolso', schedules: before.map((s) => ({ installmentNo: s.installmentNo, dueDate: expected(s.installmentNo).toISOString() })) } } });
    console.log('CRE-00001 corregido: primera cuota 2026-09-17, ultima cuota 2026-11-05. Montos conservados.');
  }, { timeout: 20000 });
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
