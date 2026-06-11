import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { pbkdf2Sync, randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateUserInput, UpdateUserInput } from './users.types';

const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.ANALYST, UserRole.CASHIER];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const organization = await this.getOrganization();
    const users = await this.prisma.appUser.findMany({
      orderBy: { fullName: 'asc' },
      where: { organizationId: organization.id },
    });

    return users.map((user) => this.toDto(user));
  }

  async create(input: CreateUserInput) {
    this.validateInput(input, true);
    const organization = await this.getOrganization();

    try {
      const user = await this.prisma.appUser.create({
        data: {
          creditLimit: input.creditLimit ?? 0,
          dni: input.dni.trim(),
          email: input.email.trim().toLowerCase(),
          fullName: input.fullName.trim(),
          id: randomUUID(),
          organizationId: organization.id,
          passwordHash: this.hashPassword(input.password),
          phone: input.phone?.trim() || null,
          position: input.position?.trim() || null,
          role: input.role,
        },
      });

      return this.toDto(user);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  async update(id: string, input: UpdateUserInput) {
    this.validateInput(input, false);
    const organization = await this.getOrganization();
    const existing = await this.prisma.appUser.findFirst({ where: { id, organizationId: organization.id } });

    if (!existing) {
      throw new NotFoundException('Usuario no encontrado');
    }

    try {
      const user = await this.prisma.appUser.update({
        data: {
          creditLimit: input.creditLimit ?? 0,
          dni: input.dni.trim(),
          email: input.email.trim().toLowerCase(),
          fullName: input.fullName.trim(),
          isActive: input.isActive,
          passwordHash: input.password?.trim() ? this.hashPassword(input.password) : existing.passwordHash,
          phone: input.phone?.trim() || null,
          position: input.position?.trim() || null,
          role: input.role,
        },
        where: { id },
      });

      return this.toDto(user);
    } catch (error) {
      this.handleUniqueError(error);
      throw error;
    }
  }

  private validateInput(input: CreateUserInput | UpdateUserInput, passwordRequired: boolean) {
    if (!input.fullName?.trim()) throw new BadRequestException('El nombre es obligatorio');
    if (!/^\d{8}$/.test(input.dni?.trim())) throw new BadRequestException('El DNI debe tener 8 digitos');
    if (!input.email?.trim() || !input.email.includes('@')) throw new BadRequestException('El correo es invalido');
    if (!allowedRoles.includes(input.role)) throw new BadRequestException('El rol es invalido');
    if (Number(input.creditLimit ?? 0) < 0) throw new BadRequestException('El limite de credito no puede ser negativo');
    if (passwordRequired && !input.password?.trim()) throw new BadRequestException('La contraseña es obligatoria');
    if (input.password?.trim() && input.password.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString('base64url');
    const iterations = 120000;
    const hash = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('base64url');
    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  private handleUniqueError(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return;
    throw new BadRequestException('DNI o correo ya registrado');
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: { clerkOrganizationId: 'org_demo_solfin', name: 'SOLFIN PERU', ruc: '20600000001' },
      update: {},
      where: { clerkOrganizationId: 'org_demo_solfin' },
    });
  }

  private toDto(user: {
    creditLimit: Prisma.Decimal;
    dni: string | null;
    email: string;
    fullName: string;
    id: string;
    isActive: boolean;
    phone: string | null;
    position: string | null;
    role: UserRole;
  }) {
    return {
      creditLimit: Number(user.creditLimit),
      dni: user.dni ?? '',
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      isActive: user.isActive,
      phone: user.phone,
      position: user.position,
      role: user.role,
    };
  }
}
