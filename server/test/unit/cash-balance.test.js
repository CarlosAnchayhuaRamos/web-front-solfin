const { CashService } = require('../../src/cash/cash.service');

function fixture() {
  const vault = { id: 'vault', openedAt: new Date(), balance: 30000 };
  const session = { id: 'session', userId: 'cashier', openingAmount: 500, status: 'OPEN' };
  const tx = {
    $queryRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(async () => [{ ...session, countedAmount: 450, expectedAmount: 450 }]),
    vault: { findUnique: jest.fn(async () => vault), update: jest.fn() },
    cashSession: { count: jest.fn(async () => 0), findFirst: jest.fn(async () => session) },
    cashMovement: { groupBy: jest.fn(async () => [{ direction: 'OUT', _sum: { amount: 50 } }]), create: jest.fn() },
    auditLog: { create: jest.fn() },
  };
  const prisma = {
    $transaction: async (run) => run(tx),
    $queryRawUnsafe: async () => [{ id: 'box', name: 'Caja principal', assignedUserId: 'cashier' }],
    appUser: { findFirst: async () => ({ id: 'cashier', fullName: 'Cashier', role: 'ADMIN' }) },
  };
  const service = new CashService(prisma);
  service.getOrganization = async () => ({ id: 'org' });
  service.ensureCashSetup = async () => {};
  service.getVaultStatus = async () => ({ isOpen: true });
  service.getMaxCashBoxBalance = async () => 10000;
  service.getMaxCashDifference = async () => 0.5;
  service.toSessionDto = (value) => value;
  service.getCashMovementTotals = async () => ({ income: 0, expenses: 50 });
  service.getCashMovementDetails = async () => [];
  service.findSessions = async () => [session];
  return { service, tx, vault, session };
}
const opening = { userId: 'cashier', cashierName: 'Cashier', cashBoxName: 'Caja principal', openingAmount: 500, denominations: [{ value: 100, quantity: 5 }] };

test('opening a box debits its allocation from the vault once', async () => {
  const { service, tx } = fixture();
  await service.openCashSession(opening);
  expect(tx.vault.update).toHaveBeenCalledWith({ where: { id: 'vault' }, data: { balance: { decrement: 500 } } });
  tx.cashSession.count.mockResolvedValue(1);
  await expect(service.openCashSession(opening)).rejects.toThrow('sesion abierta');
  expect(tx.vault.update).toHaveBeenCalledTimes(1);
});

test('insufficient vault funds reject opening and topup', async () => {
  const { service, tx, vault } = fixture();
  vault.balance = 10;
  await expect(service.openCashSession(opening)).rejects.toThrow('Saldo insuficiente');
  await expect(service.addCashSessionBalance('session', { amount: 100, userId: 'cashier' })).rejects.toThrow('Saldo insuficiente');
  expect(tx.vault.update).not.toHaveBeenCalled();
  expect(tx.cashMovement.create).not.toHaveBeenCalled();
});

test('closing returns counted cash, and repeated closing cannot credit again', async () => {
  const { service, tx } = fixture();
  const input = { countedAmount: 450, denominations: [{ value: 100, quantity: 4 }, { value: 50, quantity: 1 }] };
  await service.closeCashSession('session', input);
  expect(tx.vault.update).toHaveBeenCalledWith({ where: { id: 'vault' }, data: { balance: { increment: 450 } } });
  tx.cashSession.findFirst.mockResolvedValue(null);
  await expect(service.closeCashSession('session', input)).rejects.toThrow('no existe');
  expect(tx.vault.update).toHaveBeenCalledTimes(1);
});

test('topup moves existing vault funds into the cash session', async () => {
  const { service, tx } = fixture();
  await service.addCashSessionBalance('session', { amount: 100, userId: 'cashier' });
  expect(tx.cashMovement.create).toHaveBeenCalledWith({ data: expect.objectContaining({ amount: 100, direction: 'IN', type: 'WITHDRAWAL_FROM_VAULT' }) });
  expect(tx.vault.update).toHaveBeenCalledWith({ where: { id: 'vault' }, data: { balance: { decrement: 100 } } });
});
