export interface Employee {
  id: string;
  fullName: string;
  role: string;
  creditLimit: number;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}
