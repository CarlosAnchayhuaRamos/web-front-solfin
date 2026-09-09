const { ClientsService } = require('../../src/clients/clients.service');

test('pagination bounds and name filters are applied before loading clients', async () => {
  const tx = {
    client: { count: jest.fn(async () => 60), findMany: jest.fn(async () => []) },
    credit: { groupBy: jest.fn(async () => []) },
  };
  const service = new ClientsService({ $transaction: async (run) => run(tx) });
  service.getOrganization = async () => ({ id: 'solfin' });
  const result = await service.findPage(2, 'Ana Ramos', '123');
  expect(result).toEqual({ items: [], total: 60, page: 2, pageSize: 25 });
  expect(tx.client.findMany).toHaveBeenCalledWith(expect.objectContaining({
    skip: 25, take: 25, where: expect.objectContaining({ dni: { contains: '123' }, AND: expect.any(Array) }),
  }));
  expect(tx.client.findMany.mock.calls[0][0].where.AND).toHaveLength(2);
  await expect(service.findPage(NaN, '', '')).rejects.toThrow('Pagina invalida');
  await expect(service.findPage(0, '', '')).rejects.toThrow('Pagina invalida');
  expect(tx.client.findMany).toHaveBeenCalledTimes(1);
});
