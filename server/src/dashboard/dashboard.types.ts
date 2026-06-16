export interface DashboardSummary {
  activeClientCount: number;
  activeCreditCount: number;
  averageTicket: number;
  collectedToday: number;
  overdueAmount: number;
  overdueCreditCount: number;
  overdueRate: number;
  pendingApprovalCount: number;
  portfolioAmount: number;
  scope: 'GENERAL' | 'ANALYST_PORTFOLIO';
}
