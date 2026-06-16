import { ApprovalStatus } from '@prisma/client';

export interface ApprovalRequestListItem {
  id: string;
  creditCode: string;
  creditId: string;
  clientName: string;
  analystName: string;
  creditType: 'Express' | 'Garantia';
  amount: number;
  analystLimit: number;
  status: ApprovalStatus;
  requestedAt: string;
  reviewerNotes: string | null;
  files: ApprovalRequestFile[];
}

export interface ApprovalRequestFile {
  fileName: string;
  id: string;
  mimeType: string;
  sizeBytes: number;
  url: string | null;
}

export interface ReviewApprovalInput {
  notes?: string;
}

export interface CreditContractData {
  advisorName: string;
  approvedAt: string;
  approvedByName: string;
  clientAddress: string | null;
  clientDni: string;
  clientName: string;
  creditCode: string;
  installmentAmount: number;
  installmentCount: number;
  interestRate: number;
  penaltyRate: number;
  principalAmount: number;
  schedules: CreditContractSchedule[];
  totalAmount: number;
}

export interface CreditContractSchedule {
  dueDate: string;
  installmentNo: number;
  interest: number;
  principal: number;
  totalDue: number;
}

export interface ReviewApprovalResult {
  contract: CreditContractData | null;
  request: ApprovalRequestListItem;
}
