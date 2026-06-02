import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CashPolicyDto, CreditPolicyDto, UpdateCashPolicyInput, UpdateCreditPolicyInput } from './parameters.types';

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
};

const createCreditPolicyData = (organizationId: string) => ({
  ...defaultCreditPolicy,
  organizationId,
});

const defaultCashPolicy = {
  allowNegativeCash: false,
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
      },
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
      },
      update: input,
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
    requireApprovalAboveLimit: boolean;
  }): CreditPolicyDto {
    return {
      defaultInterestRate: Number(policy.defaultInterestRate),
      defaultPenaltyRate: Number(policy.defaultPenaltyRate),
      graceDays: policy.graceDays,
      maxAnalystApprovalAmount: Number(policy.maxAnalystApprovalAmount),
      maxInstallments: policy.maxInstallments,
      maxRequestFiles: policy.maxRequestFiles ?? defaultCreditPolicy.maxRequestFiles,
      requireApprovalAboveLimit: policy.requireApprovalAboveLimit,
    };
  }

  private toCashPolicyDto(policy: {
    allowNegativeCash: boolean;
    maxCashBoxBalance: unknown;
    requireDailyClosing: boolean;
    vaultWarningThreshold: unknown;
  }): CashPolicyDto {
    return {
      allowNegativeCash: policy.allowNegativeCash,
      maxCashBoxBalance: Number(policy.maxCashBoxBalance),
      requireDailyClosing: policy.requireDailyClosing,
      vaultWarningThreshold: Number(policy.vaultWarningThreshold),
    };
  }

  private validateCreditPolicyInput(input: UpdateCreditPolicyInput) {
    if (input.defaultInterestRate < 0) {
      throw new BadRequestException('La tasa de interes no puede ser negativa');
    }

    if (input.defaultPenaltyRate < 0) {
      throw new BadRequestException('La mora no puede ser negativa');
    }

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

  private validateCashPolicyInput(input: UpdateCashPolicyInput) {
    if (input.maxCashBoxBalance <= 0) {
      throw new BadRequestException('El tope de caja debe ser mayor a cero');
    }

    if (input.vaultWarningThreshold < 0) {
      throw new BadRequestException('La alerta de boveda no puede ser negativa');
    }
  }
}
