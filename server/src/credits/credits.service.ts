import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreditStatus, CreditType, DocumentType, PaymentMethod, PaymentStatus, StorageProvider, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateCreditInput, CreditSimulationInput, CreditSimulationResult, PayInstallmentsInput } from './credits.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const demoAnalyst = {
  creditLimit: 3500,
  dni: '70000001',
  fullName: 'Rosa Huaman',
  id: 'user_demo_analyst',
  email: 'analista@solfin.pe',
  phone: '900000001',
  position: 'Analista',
};

const demoRequester = {
  email: 'analista@solfin.pe',
  fullName: 'Rosa Huaman',
  id: 'user_demo_analyst',
  role: UserRole.ANALYST,
};

const productSeed = {
  EXPRESS: {
    approvalLimit: 3500,
    defaultInstallments: 6,
    defaultInterestRate: 0.12,
    maxAmount: 3000,
    minAmount: 300,
    name: 'Credito Express',
    requiresGuarantee: false,
    type: CreditType.EXPRESS,
  },
  GARANTIA: {
    approvalLimit: 8000,
    defaultInstallments: 12,
    defaultInterestRate: 0.1,
    maxAmount: 10000,
    minAmount: 1000,
    name: 'Credito con Garantia',
    requiresGuarantee: true,
    type: CreditType.GARANTIA,
  },
} as const;

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async simulate(input: CreditSimulationInput): Promise<CreditSimulationResult> {
    this.validateSimulationInput(input);

    const organization = await this.getOrganization();
    const product = await this.getProduct(organization.id, input.productType);
    const policy = await this.getCreditPolicy(organization.id);

    if (input.amount < Number(product.minAmount)) {
      throw new BadRequestException(`El monto minimo para ${product.name} es ${product.minAmount}`);
    }

    if (input.installments > policy.maxInstallments) {
      throw new BadRequestException(`El maximo de cuotas permitido es ${policy.maxInstallments}`);
    }

    const monthlyInterestRate = Number(policy.defaultInterestRate);
    const totalAmount = this.roundMoney(input.amount * Math.exp(monthlyInterestRate * input.installments));
    const totalInterest = totalAmount - input.amount;
    const installmentAmount = this.roundMoney(totalAmount / input.installments);
    const principal = this.roundMoney(input.amount / input.installments);
    const interest = this.roundMoney(totalInterest / input.installments);

    const installments = Array.from({ length: input.installments }, (_, index) => {
      const installmentNo = index + 1;
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + installmentNo);
      const isLastInstallment = installmentNo === input.installments;
      const previousPrincipal = principal * (input.installments - 1);
      const previousInterest = interest * (input.installments - 1);
      const installmentPrincipal = isLastInstallment ? this.roundMoney(input.amount - previousPrincipal) : principal;
      const installmentInterest = isLastInstallment ? this.roundMoney(totalInterest - previousInterest) : interest;

      return {
        dueDate: dueDate.toISOString().slice(0, 10),
        installmentNo,
        interest: installmentInterest,
        principal: installmentPrincipal,
        totalDue: this.roundMoney(installmentPrincipal + installmentInterest),
      };
    });

    return {
      amount: input.amount,
      installmentAmount,
      installments,
      interestRate: monthlyInterestRate,
      totalAmount: this.roundMoney(totalAmount),
    };
  }

  async create(input: CreateCreditInput) {
    const simulation = await this.simulate(input);
    const organization = await this.getOrganization();
    const product = await this.getProduct(organization.id, input.productType);
    const policy = await this.getCreditPolicy(organization.id);
    const analyst = await this.getAnalyst(organization.id);
    const client = await this.prisma.client.findFirst({
      where: {
        id: input.clientId,
        organizationId: organization.id,
      },
    });

    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const code = await this.nextCreditCode(organization.id);
    const requester = await this.getRequester(organization.id);
    const fileNames = this.getRequestFileNames(input.fileNames);

    if (fileNames.length > (policy.maxRequestFiles ?? 5)) {
      throw new BadRequestException(`Maximo ${policy.maxRequestFiles ?? 5} archivos permitidos`);
    }

    const requiresAdminApproval = input.amount > Number(analyst.creditLimit);

    return this.prisma.credit.create({
      data: {
        analystId: analyst.id,
        clientId: client.id,
        code,
        firstDueDate: new Date(`${simulation.installments[0].dueDate}T00:00:00.000Z`),
        installmentAmount: simulation.installmentAmount,
        installmentCount: input.installments,
        interestRate: simulation.interestRate,
        organizationId: organization.id,
        principalAmount: input.amount,
        productId: product.id,
        schedules: {
          create: simulation.installments.map((installment) => ({
            dueDate: new Date(`${installment.dueDate}T00:00:00.000Z`),
            installmentNo: installment.installmentNo,
            interest: installment.interest,
            principal: installment.principal,
            totalDue: installment.totalDue,
          })),
        },
        documents: {
          create: fileNames.map((fileName) => ({
            fileName,
            mimeType: 'application/octet-stream',
            organizationId: organization.id,
            provider: StorageProvider.LOCAL,
            sizeBytes: 0,
            storageKey: `credit-requests/${code}/${fileName}`,
            type: DocumentType.OTHER,
            uploadedById: requester.id,
          })),
        },
        approvalRequest: requiresAdminApproval
          ? {
              create: {
                analystLimit: analyst.creditLimit,
                organizationId: organization.id,
                reason: input.notes?.trim() || 'Credito registrado para revision',
                requestedAmount: input.amount,
                requestedById: requester.id,
              },
            }
          : undefined,
        status: requiresAdminApproval ? CreditStatus.PENDING_APPROVAL : CreditStatus.APPROVED,
        totalAmount: simulation.totalAmount,
        type: input.productType,
      },
      include: {
        approvalRequest: true,
        client: true,
        documents: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
    });
  }

  async findApprovedByClient(clientId: string) {
    const organization = await this.getOrganization();

    const credits = await this.prisma.credit.findMany({
      include: {
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      where: {
        clientId,
        organizationId: organization.id,
        status: { in: [CreditStatus.APPROVED, CreditStatus.ACTIVE, CreditStatus.OVERDUE] },
      },
    });

    return credits.map((credit) => {
      const netValue = Number(credit.totalAmount) - Number(credit.principalAmount);
      const overdueAmount = credit.schedules.reduce((total, schedule) => {
        if (schedule.status !== PaymentStatus.OVERDUE) return total;
        return total + Number(schedule.penalty);
      }, 0);

      return {
        code: credit.code,
        id: credit.id,
        installmentAmount: Number(credit.installmentAmount),
        interestRate: Number(credit.interestRate),
        netValue,
        overdueAmount,
        principalAmount: Number(credit.principalAmount),
        schedules: credit.schedules.map((schedule) => ({
          dueDate: schedule.dueDate.toISOString().slice(0, 10),
          id: schedule.id,
          installmentNo: schedule.installmentNo,
          interest: Number(schedule.interest),
          paidAmount: Number(schedule.paidAmount),
          penalty: Number(schedule.penalty),
          principal: Number(schedule.principal),
          status: schedule.status,
          totalDue: Number(schedule.totalDue),
        })),
        status: credit.status,
        totalAmount: Number(credit.totalAmount),
        type: credit.type,
      };
    });
  }

  async payInstallments(creditId: string, input: PayInstallmentsInput) {
    if (!input.scheduleIds?.length) {
      throw new BadRequestException('Seleccione al menos una cuota');
    }

    const organization = await this.getOrganization();
    const credit = await this.prisma.credit.findFirst({
      include: { client: true },
      where: { id: creditId, organizationId: organization.id },
    });

    if (!credit) {
      throw new NotFoundException('Credito no encontrado');
    }

    const schedules = await this.prisma.paymentSchedule.findMany({
      where: {
        creditId,
        id: { in: input.scheduleIds },
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
      },
    });

    if (!schedules.length) {
      throw new BadRequestException('No hay cuotas pendientes seleccionadas');
    }

    await this.prisma.$transaction(
      schedules.flatMap((schedule) => [
        this.prisma.payment.create({
          data: {
            amount: schedule.totalDue,
            creditId,
            method: PaymentMethod.CASH,
            paymentScheduleId: schedule.id,
          },
        }),
        this.prisma.paymentSchedule.update({
          data: {
            paidAmount: schedule.totalDue,
            paidAt: new Date(),
            status: PaymentStatus.PAID,
          },
          where: { id: schedule.id },
        }),
      ]),
    );

    const credits = await this.findApprovedByClient(credit.clientId);
    const amount = schedules.reduce((total, schedule) => total + Number(schedule.totalDue), 0);

    return {
      credits,
      voucher: {
        amount,
        clientName: `${credit.client.firstName} ${credit.client.lastName}`,
        creditCode: credit.code,
        paidAt: new Date().toISOString(),
        scheduleNumbers: schedules.map((schedule) => schedule.installmentNo).sort((a, b) => a - b),
        voucherCode: `VCH-${Date.now()}`,
      },
    };
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private async getProduct(organizationId: string, type: CreditType) {
    const seed = productSeed[type];

    return this.prisma.creditProduct.upsert({
      create: {
        approvalLimit: seed.approvalLimit,
        defaultInstallments: seed.defaultInstallments,
        defaultInterestRate: seed.defaultInterestRate,
        isActive: true,
        maxAmount: seed.maxAmount,
        minAmount: seed.minAmount,
        name: seed.name,
        organizationId,
        requiresGuarantee: seed.requiresGuarantee,
        type: seed.type,
      },
      update: {
        approvalLimit: seed.approvalLimit,
        defaultInstallments: seed.defaultInstallments,
        defaultInterestRate: seed.defaultInterestRate,
        isActive: true,
        maxAmount: seed.maxAmount,
        minAmount: seed.minAmount,
        name: seed.name,
        requiresGuarantee: seed.requiresGuarantee,
      },
      where: {
        organizationId_type: {
          organizationId,
          type,
        },
      },
    });
  }

  private async getCreditPolicy(organizationId: string) {
    return this.prisma.creditPolicy.upsert({
      create: {
        defaultInterestRate: 0.12,
        defaultPenaltyRate: 0.005,
        graceDays: 2,
        maxAnalystApprovalAmount: 3500,
        maxInstallments: 12,
        maxRequestFiles: 5,
        organizationId,
        requireApprovalAboveLimit: true,
      } as never,
      update: {},
      where: { organizationId },
    });
  }

  private async getAnalyst(organizationId: string) {
    return this.prisma.appUser.upsert({
      create: {
        creditLimit: demoAnalyst.creditLimit,
        dni: demoAnalyst.dni,
        email: demoAnalyst.email,
        fullName: demoAnalyst.fullName,
        id: demoAnalyst.id,
        organizationId,
        phone: demoAnalyst.phone,
        position: demoAnalyst.position,
        role: UserRole.ANALYST,
      },
      update: {
        creditLimit: demoAnalyst.creditLimit,
        dni: demoAnalyst.dni,
        email: demoAnalyst.email,
        fullName: demoAnalyst.fullName,
        phone: demoAnalyst.phone,
        position: demoAnalyst.position,
        role: UserRole.ANALYST,
      },
      where: { id: demoAnalyst.id },
    });
  }

  private async getRequester(organizationId: string) {
    return this.prisma.appUser.upsert({
      create: {
        email: demoRequester.email,
        fullName: demoRequester.fullName,
        id: demoRequester.id,
        organizationId,
        role: demoRequester.role,
      },
      update: {
        email: demoRequester.email,
        fullName: demoRequester.fullName,
        role: demoRequester.role,
      },
      where: { id: demoRequester.id },
    });
  }

  private async nextCreditCode(organizationId: string) {
    const count = await this.prisma.credit.count({ where: { organizationId } });
    return `CRE-${String(count + 1).padStart(5, '0')}`;
  }

  private validateSimulationInput(input: CreditSimulationInput) {
    if (!input.productType) {
      throw new BadRequestException('El producto es obligatorio');
    }

    if (!input.amount || input.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    if (!Number.isFinite(input.amount)) {
      throw new BadRequestException('El monto debe ser un numero valido');
    }

    if (!input.installments || input.installments <= 0) {
      throw new BadRequestException('Las cuotas deben ser mayores a cero');
    }

    if (!Number.isInteger(input.installments)) {
      throw new BadRequestException('Las cuotas deben ser un numero entero');
    }
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }

  private getRequestFileNames(fileNames: string[] | undefined) {
    if (!fileNames?.length) return [];

    return fileNames.map((fileName) => fileName.trim()).filter(Boolean);
  }
}
