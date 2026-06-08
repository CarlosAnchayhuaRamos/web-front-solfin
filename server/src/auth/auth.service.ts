import { createHmac, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserDto, LoginInput, LoginResponse } from './auth.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const demoPassword = 'admin';
const demoUsers = [
  { creditLimit: 0, dni: '77777777', email: 'admin@solfin.pe', fullName: 'Admin SOLFIN', id: 'user_demo_admin', phone: '900000000', position: 'Administrador', role: UserRole.ADMIN },
  { creditLimit: 3500, dni: '70000001', email: 'analista@solfin.pe', fullName: 'Rosa Huaman', id: 'user_demo_analyst', phone: '900000001', position: 'Analista', role: UserRole.ANALYST },
  { creditLimit: 0, dni: '70000003', email: 'caja@solfin.pe', fullName: 'Elena Torres', id: 'user_demo_cashier', phone: '900000003', position: 'Caja', role: UserRole.CASHIER },
];

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    await this.ensureDemoUsers();

    const identifier = input.identifier?.trim().toLowerCase();

    if (!identifier || !input.password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const users = await this.prisma.$queryRawUnsafe<Array<AuthUserDto & { passwordHash: string | null }>>(
      `
        SELECT id, dni, email, "fullName", role, "passwordHash"
        FROM app_users
        WHERE lower(email) = $1 OR dni = $2
        ORDER BY
          CASE WHEN "passwordHash" IS NULL THEN 1 ELSE 0 END,
          "isActive" DESC,
          "updatedAt" DESC
        LIMIT 1
      `,
      identifier,
      identifier,
    );
    const user = users[0];

    if (!user?.passwordHash || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const authUser = {
      dni: user.dni,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      role: user.role,
    };

    return {
      token: this.signToken(authUser),
      user: authUser,
    };
  }

  private async ensureDemoUsers() {
    const organization = await this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
    const passwordHash = this.hashPassword(demoPassword);

    await Promise.all(
      demoUsers.map((user) =>
        this.prisma.$executeRawUnsafe(
          `
            INSERT INTO app_users (id, "organizationId", email, "fullName", dni, phone, position, "creditLimit", "passwordHash", role, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10::"UserRole", true, now(), now())
            ON CONFLICT (id) DO UPDATE SET
              email = EXCLUDED.email,
              "fullName" = EXCLUDED."fullName",
              dni = EXCLUDED.dni,
              phone = EXCLUDED.phone,
              position = EXCLUDED.position,
              "creditLimit" = EXCLUDED."creditLimit",
              "passwordHash" = EXCLUDED."passwordHash",
              role = EXCLUDED.role,
              "updatedAt" = now()
          `,
          user.id,
          organization.id,
          user.email,
          user.fullName,
          user.dni,
          user.phone,
          user.position,
          user.creditLimit,
          passwordHash,
          user.role,
        ),
      ),
    );
  }

  private hashPassword(password: string) {
    const salt = 'solfin-demo-salt';
    const iterations = 120000;
    const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  private verifyPassword(password: string, storedHash: string) {
    const [, iterationsValue, salt, hash] = storedHash.split('$');
    const iterations = Number(iterationsValue);
    const candidate = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const stored = Buffer.from(hash, 'base64url');

    if (candidate.length !== stored.length) return false;
    return timingSafeEqual(candidate, stored);
  }

  private signToken(user: AuthUserDto) {
    const header = this.toBase64Url({ alg: 'HS256', typ: 'JWT' });
    const payload = this.toBase64Url({
      dni: user.dni,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      name: user.fullName,
      role: user.role,
      sub: user.id,
    });
    const signature = createHmac('sha256', this.getJwtSecret()).update(`${header}.${payload}`).digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  private toBase64Url(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private getJwtSecret() {
    return this.configService.get<string>('JWT_SECRET') ?? 'solfin-dev-secret';
  }
}
