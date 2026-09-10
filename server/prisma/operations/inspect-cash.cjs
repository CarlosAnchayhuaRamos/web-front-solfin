const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.$queryRaw`
    SELECT v.name, v.balance,
      (SELECT count(*)::int FROM cash_sessions cs JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
       WHERE cb."organizationId" = v."organizationId" AND cs.status = 'OPEN') AS open_sessions,
      (SELECT COALESCE(sum(cs."openingAmount"), 0) FROM cash_sessions cs JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
       WHERE cb."organizationId" = v."organizationId") AS openings,
      (SELECT COALESCE(sum(cs."countedAmount"), 0) FROM cash_sessions cs JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
       WHERE cb."organizationId" = v."organizationId" AND cs.status = 'CLOSED') AS returns,
      (SELECT COALESCE(sum(CASE WHEN cm.direction = 'IN' THEN cm.amount ELSE -cm.amount END), 0)
       FROM cash_movements cm WHERE cm."vaultId" = v.id AND cm.type IN ('WITHDRAWAL_FROM_VAULT', 'DEPOSIT_TO_VAULT')) AS transfers
    FROM vaults v
  `;
  console.log(JSON.stringify(rows));
}
main().catch(() => { console.error('Cash inspection failed'); process.exitCode = 1; }).finally(() => prisma.$disconnect());
