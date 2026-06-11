import { UserRole } from '@prisma/client';

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface AuthUserDto {
  dni: string;
  email: string;
  fullName: string;
  id: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  user: AuthUserDto;
}

export interface AuthTokenPayload {
  dni: string | null;
  email: string;
  exp: number;
  name: string;
  role: UserRole;
  sub: string;
}
