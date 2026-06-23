import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CashPolicyDto, CreditPolicyDto, PenaltyFrequencySetting, PenaltyMethod, PenaltySettings, UpdateCashPolicyInput, UpdateCreditPolicyInput } from './parameters.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const defaultCreditPolicy = {
  defaultInterestRate: 0.12,
  defaultPenaltyRate: 0.005,
  graceDays: 2,
  maxAnalystApprovalAmount: 3500,
  maxInstallments: 12,
  maxRequestFiles: 5,
  requireApprovalAboveLimit: true,
  specialInterestRate: 0.1,
};

export const defaultPenaltySettings: PenaltySettings = {
  DAILY: {
    capRate: 0.2,
    fixedDailyAmount: 2,
    graceDays: 2,
    method: 'CAPPED_SIMPLE',
    rate: 0.005,
  },
  WEEKLY: {
    capRate: 0.2,
    fixedDailyAmount: 2,
    graceDays: 2,
    method: 'CAPPED_SIMPLE',
    rate: 0.005,
  },
  MONTHLY: {
    capRate: 0.2,
    fixedDailyAmount: 2,
    graceDays: 2,
    method: 'CAPPED_SIMPLE',
    rate: 0.005,
  },
};

const createCreditPolicyData = (organizationId: string) => ({
  ...defaultCreditPolicy,
  organizationId,
  penaltySettings: defaultPenaltySettings,
});

const defaultCashPolicy = {
  allowNegativeCash: false,
  maxCashDifference: 0.5,
  maxCashBoxBalance: 15000,
  requireDailyClosing: true,
  vaultWarningThreshold: 5000,
};

@Injectable()
export class ParametersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCreditPolicy(): Promise<CreditPolicyDto> {
    const organization = await this.getOrganization();
    const policy = await this.prisma.creditPolicy.upsert({
      create: createCreditPolicyData(organization.id) as never,
      update: {},
      where: { organizationId: organization.id },
    });

    return this.toCreditPolicyDto(policy);
  }

  async updateCreditPolicy(input: UpdateCreditPolicyInput): Promise<CreditPolicyDto> {
    this.validateCreditPolicyInput(input);

    const organization = await this.getOrganization();
    const policy = await this.prisma.creditPolicy.upsert({
      create: { ...input, organizationId: organization.id } as never,
      update: input as never,
      where: { organizationId: organization.id },
    });

    return this.toCreditPolicyDto(policy);
  }

  async getCashPolicy(): Promise<CashPolicyDto> {
    const organization = await this.getOrganization();
    const policy = await this.prisma.cashPolicy.upsert({
      create: {
        ...defaultCashPolicy,
        organizationId: organization.id,
      } as never,
      update: {},
      where: { organizationId: organization.id },
    });

    return this.toCashPolicyDto(policy);
  }

  async updateCashPolicy(input: UpdateCashPolicyInput): Promise<CashPolicyDto> {
    this.validateCashPolicyInput(input);

    const organization = await this.getOrganization();
    const policy = await this.prisma.cashPolicy.upsert({
      create: {
        ...input,
        organizationId: organization.id,
      } as never,
      update: input as never,
      where: { organizationId: organization.id },
    });

    return this.toCashPolicyDto(policy);
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private toCreditPolicyDto(policy: {
    defaultInterestRate: unknown;
    defaultPenaltyRate: unknown;
    graceDays: number;
    maxAnalystApprovalAmount: unknown;
    maxInstallments: number;
    maxRequestFiles?: number;
    penaltySettings?: unknown;
    requireApprovalAboveLimit: boolean;
    specialInterestRate?: unknown;
  }): CreditPolicyDto {
    return {
      defaultInterestRate: Number(policy.defaultInterestRate),
      defaultPenaltyRate: Number(policy.defaultPenaltyRate),
      graceDays: policy.graceDays,
      maxAnalystApprovalAmount: Number(policy.maxAnalystApprovalAmount),
      maxInstallments: policy.maxInstallments,
      maxRequestFiles: policy.maxRequestFiles ?? defaultCreditPolicy.maxRequestFiles,
      penaltySettings: normalizePenaltySettings(policy.penaltySettings, Number(policy.defaultPenaltyRate), policy.graceDays),
      requireApprovalAboveLimit: policy.requireApprovalAboveLimit,
      specialInterestRate: Number(policy.specialInterestRate ?? defaultCreditPolicy.specialInterestRate),
    };
  }

  private toCashPolicyDto(policy: {
    allowNegativeCash: boolean;
    maxCashDifference?: unknown;
    maxCashBoxBalance: unknown;
    requireDailyClosing: boolean;
    vaultWarningThreshold: unknown;
  }): CashPolicyDto {
    return {
      allowNegativeCash: policy.allowNegativeCash,
      maxCashDifference: Number(policy.maxCashDifference ?? defaultCashPolicy.maxCashDifference),
      maxCashBoxBalance: Number(policy.maxCashBoxBalance),
      requireDailyClosing: policy.requireDailyClosing,
      vaultWarningThreshold: Number(policy.vaultWarningThreshold),
    };
  }

  private validateCreditPolicyInput(input: UpdateCreditPolicyInput) {
    if (input.defaultInterestRate < 0) {
      throw new BadRequestException('La tasa de interes no puede ser negativa');
    }

    if (input.specialInterestRate < 0) {
      throw new BadRequestException('La tasa especial no puede ser negativa');
    }

    if (input.defaultPenaltyRate < 0) {
      throw new BadRequestException('La mora no puede ser negativa');
    }

    this.validatePenaltySettings(input.penaltySettings);

    if (input.maxAnalystApprovalAmount <= 0) {
      throw new BadRequestException('El limite de analista debe ser mayor a cero');
    }

    if (input.maxInstallments <= 0) {
      throw new BadRequestException('Las cuotas maximas deben ser mayores a cero');
    }

    if (input.maxRequestFiles <= 0) {
      throw new BadRequestException('El maximo de archivos debe ser mayor a cero');
    }

    if (input.graceDays < 0) {
      throw new BadRequestException('Los dias de gracia no pueden ser negativos');
    }
  }

  private validatePenaltySettings(settings: PenaltySettings) {
    for (const setting of Object.values(settings)) {
      if (setting.rate < 0) {
        throw new BadRequestException('La tasa de mora no puede ser negativa');
      }

      if (setting.capRate < 0) {
        throw new BadRequestException('El tope de mora no puede ser negativo');
      }

      if (setting.fixedDailyAmount < 0) {
        throw new BadRequestException('La mora fija diaria no puede ser negativa');
      }

      if (setting.graceDays < 0) {
        throw new BadRequestException('Los dias de gracia no pueden ser negativos');
      }
    }
  }

  private validateCashPolicyInput(input: UpdateCashPolicyInput) {
    if (input.maxCashDifference < 0) {
      throw new BadRequestException('La diferencia maxima no puede ser negativa');
    }

    if (input.maxCashBoxBalance <= 0) {
      throw new BadRequestException('El tope de caja debe ser mayor a cero');
    }

    if (input.vaultWarningThreshold < 0) {
      throw new BadRequestException('La alerta de boveda no puede ser negativa');
    }
  }
}

const penaltyMethods: PenaltyMethod[] = ['SIMPLE', 'CAPPED_SIMPLE', 'FIXED_DAILY'];
const paymentFrequencyKeys = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

export const normalizePenaltySettings = (value: unknown, fallbackRate = defaultCreditPolicy.defaultPenaltyRate, fallbackGraceDays = defaultCreditPolicy.graceDays): PenaltySettings => {
  if (!isRecord(value)) return createFallbackPenaltySettings(fallbackRate, fallbackGraceDays);

  return paymentFrequencyKeys.reduce((settings, frequency) => {
    const setting = isRecord(value[frequency]) ? value[frequency] : {};
    const fallback = createFallbackPenaltySetting(fallbackRate, fallbackGraceDays);
    const method = typeof setting.method === 'string' && penaltyMethods.includes(setting.method as PenaltyMethod) ? setting.method as PenaltyMethod : fallback.method;

    return {
      ...settings,
      [frequency]: {
        capRate: getNumberSetting(setting.capRate, fallback.capRate),
        fixedDailyAmount: getNumberSetting(setting.fixedDailyAmount, fallback.fixedDailyAmount),
        graceDays: Math.trunc(getNumberSetting(setting.graceDays, fallback.graceDays)),
        method,
        rate: getNumberSetting(setting.rate, fallback.rate),
      },
    };
  }, {} as PenaltySettings);
};

const createFallbackPenaltySettings = (fallbackRate: number, fallbackGraceDays: number): PenaltySettings => {
  return {
    DAILY: createFallbackPenaltySetting(fallbackRate, fallbackGraceDays),
    WEEKLY: createFallbackPenaltySetting(fallbackRate, fallbackGraceDays),
    MONTHLY: createFallbackPenaltySetting(fallbackRate, fallbackGraceDays),
  };
};

const createFallbackPenaltySetting = (fallbackRate: number, fallbackGraceDays: number): PenaltyFrequencySetting => {
  return {
    ...defaultPenaltySettings.DAILY,
    graceDays: fallbackGraceDays,
    rate: fallbackRate,
  };
};

const getNumberSetting = (value: unknown, fallback: number) => {
  if (typeof value !== 'number') return fallback;
  if (!Number.isFinite(value)) return fallback;
  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};
