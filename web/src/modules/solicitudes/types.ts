export type CreditStatusColor = 'blue' | 'yellow' | 'red' | 'gray' | 'black';

export interface CreditStatusInfo {
  label: string;
  color: CreditStatusColor;
}

export interface ApprovalRequest {
  id: string;
  creditCode: string;
  creditId: string;
  clientName: string;
  analystName: string;
  creditType: 'Express' | 'Garantia';
  amount: number;
  analystLimit: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
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

export interface ApprovalRequestFilters {
  dateFrom: string;
  dateTo: string;
  status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELED';
}
