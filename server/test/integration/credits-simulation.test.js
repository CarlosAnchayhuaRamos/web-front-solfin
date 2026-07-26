const { CreditsService } = require('../../dist/credits/credits.service');

const createPrismaMock = ({ client, policy } = {}) => ({
  client: {
    findFirst: jest.fn().mockResolvedValue(client ?? null),
  },
  creditPolicy: {
    upsert: jest.fn().mockResolvedValue({
      defaultInterestRate: 0.12,
      maxInstallments: 12,
      specialInterestRate: 0.09,
      ...policy,
    }),
  },
  creditProduct: {
    upsert: jest.fn().mockResolvedValue({
      minAmount: 100,
      name: 'Credito Express',
    }),
  },
  organization: {
    upsert: jest.fn().mockResolvedValue({ id: 'org-1' }),
  },
});

describe('CreditsService simulation integration', () => {
  it('simulates special-client equal installments through policy and client lookup', async () => {
    const prisma = createPrismaMock({
      client: { isSpecial: true, specialInterestRate: null },
      policy: { specialInterestRate: 0.05 },
    });
    const service = new CreditsService(prisma);

    const result = await service.simulate({
      amount: 1000,
      clientId: 'client-1',
      installments: 12,
      interestCalculationMethod: 'EQUAL_INSTALLMENTS',
      paymentFrequency: 'MONTHLY',
      productType: 'EXPRESS',
    });

    expect(prisma.client.findFirst).toHaveBeenCalledWith({
      where: { id: 'client-1', organizationId: 'org-1' },
    });
    expect(result.interestRate).toBe(0.05);
    expect(result.installmentAmount).toBe(112.82);
    expect(result.installments[0]).toMatchObject({
      interest: 50,
      principal: 62.83,
      totalDue: 112.83,
    });
  });

  it('rejects amounts below product minimum', async () => {
    const service = new CreditsService(createPrismaMock());

    await expect(service.simulate({
      amount: 50,
      installments: 6,
      interestCalculationMethod: 'CONTINUOUS',
      paymentFrequency: 'MONTHLY',
      productType: 'EXPRESS',
    })).rejects.toThrow('El monto minimo para Credito Express es 100');
  });
});
