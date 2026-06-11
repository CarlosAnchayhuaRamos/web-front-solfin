import { randomBytes, pbkdf2Sync } from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const password = this.configService.get<string>('BOOTSTRAP_ADMIN_PASSWORD');

    if (!password) return;

    if (password.length < 12) {
      throw new Error('BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters');
    }

    const email = this.configService.get<string>('BOOTSTRAP_ADMIN_EMAIL')?.trim().toLowerCase();

    if (!email) {
      throw new Error('BOOTSTRAP_ADMIN_EMAIL is required when BOOTSTRAP_ADMIN_PASSWORD is set');
    }

    const organization = await this.prisma.organization.upsert({
      create: {
        clerkOrganizationId: 'org_demo_solfin',
        name: this.configService.get<string>('ORGANIZATION_NAME') ?? 'SOLFIN PERU',
        ruc: this.configService.get<string>('ORGANIZATION_RUC') ?? undefined,
      },
      update: {},
      where: { clerkOrganizationId: 'org_demo_solfin' },
    });
    const existingAdmin = await this.prisma.appUser.findFirst({
      where: { email, organizationId: organization.id },
    });
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

    await this.prisma.appUser.upsert({
      create: {
        email,
        fullName: this.configService.get<string>('BOOTSTRAP_ADMIN_NAME') ?? 'Administrador SOLFIN',
        id: 'user_bootstrap_admin',
        organizationId: organization.id,
        passwordHash: `pbkdf2$${iterations}$${salt}$${hash}`,
        role: UserRole.ADMIN,
      },
      update: {
        isActive: true,
        passwordHash: `pbkdf2$${iterations}$${salt}$${hash}`,
        role: UserRole.ADMIN,
      },
      where: { id: existingAdmin?.id ?? 'user_bootstrap_admin' },
    });
  }
}
