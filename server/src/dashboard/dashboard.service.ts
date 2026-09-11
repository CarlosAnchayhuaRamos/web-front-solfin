import { Injectable } from '@nestjs/common';
import { ApprovalStatus, CreditStatus, PaymentStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthTokenPayload } from '../auth/auth.types';
import type { DashboardCash, DashboardPortfolio, DashboardSummary } from './dashboard.types';

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
    // Peru uses UTC-5 throughout the year, independently of the server timezone.
    const now = new Date();
    const peruDay = new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const todayStart = new Date(`${peruDay}T00:00:00-05:00`);
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    if (user.role === UserRole.CASHIER) {
      return { scope: 'OWN_CASH', generatedAt: now.toISOString(), portfolio: null,
        cash: await this.getCashSummary(organization.id, user, todayStart, tomorrowStart) };
    }
    const portfolio = await this.getPortfolio(organization.id, user, todayStart, tomorrowStart);
    if (user.role === UserRole.ANALYST) {
      return { scope: 'ANALYST_PORTFOLIO', generatedAt: now.toISOString(), portfolio, cash: null };
    }
    return { scope: 'GENERAL', generatedAt: now.toISOString(), portfolio,
      cash: await this.getCashSummary(organization.id, user, todayStart, tomorrowStart) };
  }

  private async getPortfolio(organizationId: string, user: AuthTokenPayload, todayStart: Date, tomorrowStart: Date): Promise<DashboardPortfolio> {
    // Schedule dates are calendar days stored at UTC midnight, not event timestamps.
    const dueDayStart = new Date(todayStart.toISOString().slice(0, 10));
    const dueDayEnd = new Date(tomorrowStart.toISOString().slice(0, 10));
    const isAnalyst = user.role === UserRole.ANALYST;
    const creditWhere = {
      analystId: isAnalyst ? user.sub : undefined,
      organizationId,
      status: { in: [CreditStatus.ACTIVE, CreditStatus.OVERDUE] },
    };

    const [portfolio, overdueSchedules, activeCreditCount, overdueCreditCount, pendingApprovalCount, collectedToday, activeClients] = await Promise.all([
      this.prisma.paymentSchedule.aggregate({
        _sum: { paidAmount: true, penalty: true, totalDue: true },
        where: { credit: creditWhere, status: { not: PaymentStatus.CANCELED } },
      }),
      this.prisma.paymentSchedule.aggregate({
        _sum: { paidAmount: true, penalty: true, totalDue: true },
        where: {
          credit: creditWhere,
          dueDate: { lt: dueDayStart },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] },
        },
      }),
      this.prisma.credit.count({ where: creditWhere }),
      this.prisma.credit.count({ where: { ...creditWhere, status: CreditStatus.OVERDUE } }),
      this.prisma.approvalRequest.count({
        where: {
          organizationId,
          requestedById: isAnalyst ? user.sub : undefined,
          status: ApprovalStatus.PENDING,
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          credit: { organizationId, analystId: isAnalyst ? user.sub : undefined },
          paidAt: { gte: todayStart, lt: tomorrowStart },
          reversedAt: null,
        },
      }),
      this.prisma.credit.groupBy({
        by: ['clientId'],
        where: creditWhere,
      }),
    ]);

    const portfolioAmount = this.getPendingAmount(portfolio._sum);
    const overdueAmount = this.getPendingAmount(overdueSchedules._sum);
    const [dueToday, pendingDisbursementCount] = await Promise.all([
      this.prisma.paymentSchedule.aggregate({
        _sum: { paidAmount: true, penalty: true, totalDue: true },
        _count: true,
        where: { credit: creditWhere, dueDate: { gte: dueDayStart, lt: dueDayEnd },
          status: { in: [PaymentStatus.PENDING, PaymentStatus.PARTIAL, PaymentStatus.OVERDUE] } },
      }),
      this.prisma.credit.count({ where: { organizationId, analystId: isAnalyst ? user.sub : undefined, status: CreditStatus.APPROVED } }),
    ]);

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
      dueTodayAmount: this.getPendingAmount(dueToday._sum),
      dueTodayCount: dueToday._count,
      pendingDisbursementCount,
    };
  }

  private async getCashSummary(organizationId: string, user: AuthTokenPayload, todayStart: Date, tomorrowStart: Date): Promise<DashboardCash> {
    const isAdmin = user.role === UserRole.ADMIN;
    const sessionWhere = { cashBox: { organizationId }, userId: isAdmin ? undefined : user.sub };
    const [sessions, movements, vault] = await Promise.all([
      this.prisma.cashSession.findMany({ where: { ...sessionWhere, status: 'OPEN' },
        select: { id: true, openingAmount: true, openedAt: true, cashBox: { select: { name: true } }, user: { select: { fullName: true } } },
        orderBy: { openedAt: 'asc' } }),
      this.prisma.cashMovement.groupBy({ by: ['type', 'direction'], _sum: { amount: true },
        where: { cashSession: sessionWhere, createdAt: { gte: todayStart, lt: tomorrowStart },
          type: { in: ['PAYMENT_COLLECTION', 'CREDIT_DISBURSEMENT'] } } }),
      isAdmin ? this.prisma.vault.findFirst({ where: { organizationId, isActive: true }, select: { balance: true, openedAt: true } }) : null,
    ]);
    const balances = await this.prisma.cashMovement.groupBy({ by: ['cashSessionId', 'direction'], _sum: { amount: true },
      where: { cashSession: { ...sessionWhere, status: 'OPEN' } } });
    return {
      vault: vault ? { balance: Number(vault.balance), isOpen: Boolean(vault.openedAt) } : null,
      collectedToday: movements.filter((row) => row.type === 'PAYMENT_COLLECTION').reduce((n, row) => n + (row.direction === 'OUT' ? -1 : 1) * Number(row._sum.amount ?? 0), 0),
      disbursedToday: movements.filter((row) => row.type === 'CREDIT_DISBURSEMENT').reduce((n, row) => n + (row.direction === 'IN' ? -1 : 1) * Number(row._sum.amount ?? 0), 0),
      sessions: sessions.map((session) => ({ id: session.id, name: session.cashBox.name, cashier: session.user.fullName,
        openedAt: session.openedAt.toISOString(), balance: this.roundMoney(Number(session.openingAmount) + balances
          .filter((row) => row.cashSessionId === session.id)
          .reduce((total, row) => total + (row.direction === 'IN' ? 1 : -1) * Number(row._sum.amount ?? 0), 0)) })),
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
