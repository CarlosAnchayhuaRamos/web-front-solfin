import { Injectable } from '@nestjs/common';
import { ApprovalStatus, CreditStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthTokenPayload } from '../auth/auth.types';
import type { DashboardSummary } from './dashboard.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: AuthTokenPayload): Promise<DashboardSummary> {
    const organization = await this.getOrganization();
    const isAnalyst = user.role === UserRole.ANALYST;
    const creditWhere = {
      analystId: isAnalyst ? user.sub : undefined,
      organizationId: organization.id,
      status: { in: [CreditStatus.ACTIVE, CreditStatus.OVERDUE] },
    };
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [portfolio, overdueSchedules, activeCreditCount, overdueCreditCount, pendingApprovalCount, collectedToday, activeClients] = await Promise.all([
      this.prisma.paymentSchedule.aggregate({
        _sum: { paidAmount: true, penalty: true, totalDue: true },
        where: { credit: creditWhere, status: { not: PaymentStatus.CANCELED } },
      }),
      this.prisma.paymentSchedule.aggregate({
        _sum: { paidAmount: true, penalty: true, totalDue: true },
        where: {
          credit: creditWhere,
          dueDate: { lt: todayStart },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
      }),
      this.prisma.credit.count({ where: creditWhere }),
      this.prisma.credit.count({ where: { ...creditWhere, status: CreditStatus.OVERDUE } }),
      this.prisma.approvalRequest.count({
        where: {
          organizationId: organization.id,
          requestedById: isAnalyst ? user.sub : undefined,
          status: ApprovalStatus.PENDING,
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          credit: creditWhere,
          paidAt: { gte: todayStart, lt: tomorrowStart },
        },
      }),
      this.prisma.credit.groupBy({
        by: ['clientId'],
        where: creditWhere,
      }),
    ]);

    const portfolioAmount = this.getPendingAmount(portfolio._sum);
    const overdueAmount = this.getPendingAmount(overdueSchedules._sum);

    return {
      activeClientCount: activeClients.length,
      activeCreditCount,
      averageTicket: activeCreditCount ? this.roundMoney(portfolioAmount / activeCreditCount) : 0,
      collectedToday: Number(collectedToday._sum.amount ?? 0),
      overdueAmount,
      overdueCreditCount,
      overdueRate: portfolioAmount ? this.roundMoney((overdueAmount / portfolioAmount) * 100) : 0,
      pendingApprovalCount,
      portfolioAmount,
      scope: isAnalyst ? 'ANALYST_PORTFOLIO' : 'GENERAL',
    };
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private getPendingAmount(sum: { paidAmount?: unknown; penalty?: unknown; totalDue?: unknown }) {
    const totalDue = Number(sum.totalDue ?? 0);
    const penalty = Number(sum.penalty ?? 0);
    const paidAmount = Number(sum.paidAmount ?? 0);

    return this.roundMoney(Math.max(0, totalDue + penalty - paidAmount));
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
