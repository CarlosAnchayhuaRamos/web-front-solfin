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
