import { randomBytes, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserDto } from './auth.types';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapAdminService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const password = this.normalizeEnvironmentValue(this.configService.get<string>('BOOTSTRAP_ADMIN_PASSWORD'));

    if (!password) {
      this.logger.warn('Bootstrap admin omitido: BOOTSTRAP_ADMIN_PASSWORD no configurado');
      return;
    }

    if (password.length < 12) {
      throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters');
    }

    const email = this.normalizeEnvironmentValue(this.configService.get<string>('BOOTSTRAP_ADMIN_EMAIL'))?.toLowerCase();

    if (!email) {
      throw new Error('BOOTSTRAP_ADMIN_EMAIL is required when BOOTSTRAP_ADMIN_PASSWORD is set');
    }

    await this.upsertAdmin(email, password);
    this.logger.log(`Bootstrap admin actualizado: ${email}`);
  }

  async authenticate(identifier: string, password: string): Promise<AuthUserDto | null> {
    const configuredEmail = this.normalizeEnvironmentValue(this.configService.get<string>('BOOTSTRAP_ADMIN_EMAIL'))?.toLowerCase();
    const configuredPassword = this.normalizeEnvironmentValue(this.configService.get<string>('BOOTSTRAP_ADMIN_PASSWORD'));

    if (!configuredEmail || !configuredPassword) return null;
    if (identifier !== configuredEmail) return null;
    if (!this.secureEquals(password, configuredPassword)) return null;

    const admin = await this.upsertAdmin(configuredEmail, configuredPassword);

    return {
      dni: admin.dni ?? '',
      email: admin.email,
      fullName: admin.fullName,
      id: admin.id,
      role: admin.role,
    };
  }

  private async upsertAdmin(email: string, password: string) {
    const organization = await this.prisma.organization.upsert({
      create: {
        clerkOrganizationId: 'org_demo_solfin',
        name: this.configService.get<string>('ORGANIZATION_NAME') ?? 'SOLFIN PERU',
        ruc: this.configService.get<string>('ORGANIZATION_RUC') ?? undefined,
      },
      update: {},
      where: { clerkOrganizationId: 'org_demo_solfin' },
    });
    const existingAdminByEmail = await this.prisma.appUser.findFirst({
      where: { email, organizationId: organization.id },
    });
    const existingBootstrapAdmin = await this.prisma.appUser.findFirst({
      where: { id: 'user_bootstrap_admin', organizationId: organization.id },
    });
    const existingAdmin = existingAdminByEmail ?? existingBootstrapAdmin;
    const salt = randomBytes(16).toString('base64url');
    const iterations = 120000;
    const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');

    await this.prisma.appUser.updateMany({
      data: { passwordHash: null },
      where: {
        id: { in: ['user_demo_admin', 'user_demo_analyst', 'user_demo_cashier'] },
        NOT: { email },
      },
    });

    if (existingAdmin) {
      return this.prisma.appUser.update({
        data: {
          email,
          fullName: this.configService.get<string>('BOOTSTRAP_ADMIN_NAME') ?? 'Administrador SOLFIN',
          isActive: true,
          passwordHash: `pbkdf2$${iterations}$${salt}$${hash}`,
          role: UserRole.ADMIN,
        },
        where: { id: existingAdmin.id },
      });
    }

    return this.prisma.appUser.create({
      data: {
        email,
        fullName: this.configService.get<string>('BOOTSTRAP_ADMIN_NAME') ?? 'Administrador SOLFIN',
        id: 'user_bootstrap_admin',
        organizationId: organization.id,
        passwordHash: `pbkdf2$${iterations}$${salt}$${hash}`,
        role: UserRole.ADMIN,
      },
    });
  }

  private normalizeEnvironmentValue(value: string | undefined) {
    const trimmed = value?.trim();

    if (!trimmed) return undefined;
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1);
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1);
    return trimmed;
  }

  private secureEquals(value: string, expected: string) {
    const valueBuffer = Buffer.from(value);
    const expectedBuffer = Buffer.from(expected);

    if (valueBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(valueBuffer, expectedBuffer);
  }
}
