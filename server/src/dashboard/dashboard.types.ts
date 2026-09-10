export interface DashboardPortfolio {
  activeClientCount: number;
  activeCreditCount: number;
  averageTicket: number;
  collectedToday: number;
  overdueAmount: number;
  overdueCreditCount: number;
  overdueRate: number;
  pendingApprovalCount: number;
  portfolioAmount: number;
  dueTodayAmount: number;
  dueTodayCount: number;
  pendingDisbursementCount: number;
}

export interface DashboardCash {
  vault: { balance: number; isOpen: boolean } | null;
  collectedToday: number;
  disbursedToday: number;
  sessions: Array<{ id: string; name: string; cashier: string; openedAt: string; balance: number }>;
}

export interface DashboardSummary {
  scope: 'GENERAL' | 'ANALYST_PORTFOLIO' | 'OWN_CASH';
  generatedAt: string;
  portfolio: DashboardPortfolio | null;
  cash: DashboardCash | null;
}
