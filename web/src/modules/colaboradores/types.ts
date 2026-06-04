export interface Employee {
  dni: string;
  email: string;
  id: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
}
