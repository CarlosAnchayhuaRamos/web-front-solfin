export interface PortfolioReportClient {
  clientDni: string;
  clientName: string;
  clientPhone: string;
  creditCount: number;
  nextDueDate: string | null;
  outstandingAmount: number;
  overdueAmount: number;
  overdueRate: number;
  principalAmount: number;
}

export interface PortfolioReportSummary {
  clientCount: number;
  creditCount: number;
  outstandingAmount: number;
  overdueAmount: number;
  overdueRate: number;
  principalAmount: number;
}

export interface PortfolioReport {
  clients: PortfolioReportClient[];
  generatedAt: string;
  scope: 'GENERAL' | 'ANALYST_PORTFOLIO';
  summary: PortfolioReportSummary;
}
