import { Injectable } from '@nestjs/common';
import { CreditStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthTokenPayload } from '../auth/auth.types';
import type { PortfolioReport, PortfolioReportClient } from './reports.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortfolioReport(user: AuthTokenPayload): Promise<PortfolioReport> {
    const organization = await this.getOrganization();
    const isAnalyst = user.role === UserRole.ANALYST;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const credits = await this.prisma.credit.findMany({
      where: {
        analystId: isAnalyst ? user.sub : undefined,
        organizationId: organization.id,
        status: { in: [CreditStatus.APPROVED, CreditStatus.ACTIVE, CreditStatus.OVERDUE] },
      },
      include: {
        client: true,
        schedules: { orderBy: { installmentNo: 'asc' } },
      },
      orderBy: [{ client: { lastName: 'asc' } }, { createdAt: 'desc' }],
    });
    const clients = new Map<string, PortfolioReportClient>();

    credits.forEach((credit) => {
      const currentClient = clients.get(credit.clientId) ?? {
        clientDni: credit.client.dni,
        clientName: `${credit.client.firstName} ${credit.client.lastName}`.trim(),
        clientPhone: credit.client.phone,
        creditCount: 0,
        nextDueDate: null,
        outstandingAmount: 0,
        overdueAmount: 0,
        overdueRate: 0,
        principalAmount: 0,
      };
      const outstandingAmount = this.getPendingAmount(credit.schedules);
      const overdueAmount = this.getOverdueAmount(credit.schedules, todayStart);
      const nextDueDate = this.getNextDueDate(credit.schedules);

      currentClient.creditCount += 1;
      currentClient.outstandingAmount = this.roundMoney(currentClient.outstandingAmount + outstandingAmount);
      currentClient.overdueAmount = this.roundMoney(currentClient.overdueAmount + overdueAmount);
      currentClient.principalAmount = this.roundMoney(currentClient.principalAmount + Number(credit.principalAmount));
      currentClient.nextDueDate = this.getEarlierDate(currentClient.nextDueDate, nextDueDate);
      currentClient.overdueRate = currentClient.outstandingAmount ? this.roundMoney((currentClient.overdueAmount / currentClient.outstandingAmount) * 100) : 0;
      clients.set(credit.clientId, currentClient);
    });

    const reportClients = [...clients.values()].sort((left, right) => right.overdueAmount - left.overdueAmount || left.clientName.localeCompare(right.clientName));
    const summary = reportClients.reduce(
      (currentSummary, client) => ({
        clientCount: currentSummary.clientCount + 1,
        creditCount: currentSummary.creditCount + client.creditCount,
        outstandingAmount: this.roundMoney(currentSummary.outstandingAmount + client.outstandingAmount),
        overdueAmount: this.roundMoney(currentSummary.overdueAmount + client.overdueAmount),
        overdueRate: 0,
        principalAmount: this.roundMoney(currentSummary.principalAmount + client.principalAmount),
      }),
      { clientCount: 0, creditCount: 0, outstandingAmount: 0, overdueAmount: 0, overdueRate: 0, principalAmount: 0 },
    );

    summary.overdueRate = summary.outstandingAmount ? this.roundMoney((summary.overdueAmount / summary.outstandingAmount) * 100) : 0;

    return {
      clients: reportClients,
      generatedAt: new Date().toISOString(),
      scope: isAnalyst ? 'ANALYST_PORTFOLIO' : 'GENERAL',
      summary,
    };
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private getPendingAmount(schedules: Array<{ paidAmount: unknown; penalty: unknown; status: PaymentStatus; totalDue: unknown }>) {
    return schedules.reduce((total, schedule) => {
      if (schedule.status === PaymentStatus.CANCELED) return total;
      return this.roundMoney(total + Math.max(0, Number(schedule.totalDue) + Number(schedule.penalty) - Number(schedule.paidAmount)));
    }, 0);
  }

  private getOverdueAmount(schedules: Array<{ dueDate: Date; paidAmount: unknown; penalty: unknown; status: PaymentStatus; totalDue: unknown }>, todayStart: Date) {
    return schedules.reduce((total, schedule) => {
      if (schedule.status === PaymentStatus.CANCELED || schedule.status === PaymentStatus.PAID) return total;
      if (schedule.dueDate >= todayStart) return total;
      return this.roundMoney(total + Math.max(0, Number(schedule.totalDue) + Number(schedule.penalty) - Number(schedule.paidAmount)));
    }, 0);
  }

  private getNextDueDate(schedules: Array<{ dueDate: Date; status: PaymentStatus }>) {
    const schedule = schedules.find((item) => item.status === PaymentStatus.PENDING || item.status === PaymentStatus.PARTIAL || item.status === PaymentStatus.OVERDUE);

    if (!schedule) return null;
    return schedule.dueDate.toISOString();
  }

  private getEarlierDate(currentDate: string | null, nextDate: string | null) {
    if (!currentDate) return nextDate;
    if (!nextDate) return currentDate;
    if (new Date(nextDate) < new Date(currentDate)) return nextDate;
    return currentDate;
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
