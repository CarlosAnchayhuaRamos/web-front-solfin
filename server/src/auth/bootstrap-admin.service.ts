import { randomBytes, pbkdf2Sync } from 'crypto';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BootstrapAdminService implements OnModuleInit {
  constructor(private readonly configService: ConfigService, private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (await this.prisma.appUser.count()) return;
    const password = this.configService.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    if (!password) return;
    const email = this.configService.get<string>('BOOTSTRAP_ADMIN_EMAIL')?.trim().toLowerCase();
    if (!email || password.length < 12) throw new Error('Bootstrap requires email and password of at least 12 characters');

    const salt = randomBytes(16).toString('base64url');
    const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('base64url');
    await this.prisma.$transaction(async (tx) => {
      // Serialize initial provisioning across application replicas.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(8142001)::text`;
      if (await tx.appUser.count()) return;
      const organization = await tx.organization.upsert({
        create: {
          clerkOrganizationId: 'org_demo_solfin',
          name: this.configService.get<string>('ORGANIZATION_NAME') ?? 'SOLFIN PERU',
          ruc: this.configService.get<string>('ORGANIZATION_RUC'),
        },
        update: {},
        where: { clerkOrganizationId: 'org_demo_solfin' },
      });
      await tx.appUser.create({ data: {
        id: 'user_bootstrap_admin', organizationId: organization.id, email,
        fullName: this.configService.get<string>('BOOTSTRAP_ADMIN_NAME') ?? 'Administrador SOLFIN',
        passwordHash: `pbkdf2$120000$${salt}$${hash}`, role: UserRole.ADMIN,
      } });
    });
  }
}
