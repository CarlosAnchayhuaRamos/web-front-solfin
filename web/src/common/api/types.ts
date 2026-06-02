export interface AppUser {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'ANALYST' | 'CASHIER' | 'VIEWER';
  organizationName: string;
}
