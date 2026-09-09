import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ClientStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ClientListItem, CreateClientInput, UpdateClientInput } from './clients.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const organization = await this.getOrganization();

    const clients = await this.prisma.client.findMany({
      where: { organizationId: organization.id },
      include: {
        _count: { select: { credits: true } },
        credits: {
          select: { status: true, totalAmount: true },
          where: { status: { in: ['ACTIVE', 'OVERDUE', 'DEFAULTED'] } },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });

    return clients.map((client) => this.toListItem(client));
  }

  async findPage(page: number, name: string, dni: string) {
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) {
      throw new BadRequestException('Pagina invalida');
    }
    if (name.length > 200 || dni.length > 8) throw new BadRequestException('Filtro invalido');
    const organization = await this.getOrganization();
    const pageSize = 25;
    const where: Prisma.ClientWhereInput = {
      organizationId: organization.id,
      dni: { contains: dni.trim() },
      AND: name.trim().split(/\s+/).filter(Boolean).map((part) => ({ OR: [
        { firstName: { contains: part, mode: 'insensitive' as const } },
        { lastName: { contains: part, mode: 'insensitive' as const } },
      ] })),
    };
    return this.prisma.$transaction(async (tx) => {
      const total = await tx.client.count({ where });
      const clients = await tx.client.findMany({
        where, skip: (page - 1) * pageSize, take: pageSize,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
      });
      const totals = await tx.credit.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clients.map((client) => client.id) }, status: { in: ['ACTIVE', 'OVERDUE', 'DEFAULTED'] } },
        _sum: { totalAmount: true }, _count: { _all: true },
      });
      const summary = new Map(totals.map((row) => [row.clientId, row]));
      return { total, page, pageSize, items: clients.map((client) => {
        const row = summary.get(client.id);
        return this.toListItem({ ...client, _count: { credits: row?._count._all ?? 0 },
          credits: row?._sum.totalAmount ? [{ totalAmount: row._sum.totalAmount }] : [],
        });
      }) };
    }, { isolationLevel: 'RepeatableRead' });
  }

  async create(input: CreateClientInput) {
    this.validateCreateInput(input);

    const organization = await this.getOrganization();

    try {
      const client = await this.prisma.client.create({
        data: {
          birthDate: this.toDate(input.birthDate),
          businessAddress: this.emptyToNull(input.businessAddress),
          department: this.emptyToNull(input.department),
          district: this.emptyToNull(input.district),
          dni: input.dni.trim(),
          email: this.emptyToNull(input.email),
          firstName: input.firstName.trim(),
          isSpecial: input.isSpecial ?? false,
          lastName: input.lastName.trim(),
          monthlyIncome: input.monthlyIncome,
          notes: this.emptyToNull(input.notes),
          occupation: this.emptyToNull(input.occupation),
          organizationId: organization.id,
          personalAddress: this.emptyToNull(input.personalAddress),
          phone: input.phone.trim(),
          province: this.emptyToNull(input.province),
          status: input.status ?? ClientStatus.ACTIVE,
          specialInterestRate: input.isSpecial ? input.specialInterestRate ?? null : null,
        },
      });

      return this.toListItem({ ...client, _count: { credits: 0 }, credits: [] });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ya existe un cliente con ese DNI');
      }

      throw error;
    }
  }

  async update(id: string, input: UpdateClientInput) {
    this.validateCreateInput(input);

    const organization = await this.getOrganization();

    try {
      const client = await this.prisma.client.update({
        data: {
          birthDate: this.toDate(input.birthDate),
          businessAddress: this.emptyToNull(input.businessAddress),
          department: this.emptyToNull(input.department),
          district: this.emptyToNull(input.district),
          dni: input.dni.trim(),
          email: this.emptyToNull(input.email),
          firstName: input.firstName.trim(),
          isSpecial: input.isSpecial ?? false,
          lastName: input.lastName.trim(),
          monthlyIncome: input.monthlyIncome,
          notes: this.emptyToNull(input.notes),
          occupation: this.emptyToNull(input.occupation),
          personalAddress: this.emptyToNull(input.personalAddress),
          phone: input.phone.trim(),
          province: this.emptyToNull(input.province),
          status: input.status ?? ClientStatus.ACTIVE,
          specialInterestRate: input.isSpecial ? input.specialInterestRate ?? null : null,
        },
        include: {
          _count: { select: { credits: true } },
          credits: {
            select: { status: true, totalAmount: true },
            where: { status: { in: ['ACTIVE', 'OVERDUE', 'DEFAULTED'] } },
          },
        },
        where: {
          id,
          organizationId: organization.id,
        },
      });

      return this.toListItem(client);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Ya existe un cliente con ese DNI');
      }

      if (this.isNotFoundError(error)) {
        throw new NotFoundException('Cliente no encontrado');
      }

      throw error;
    }
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private validateCreateInput(input: CreateClientInput) {
    if (!input.firstName?.trim()) {
      throw new BadRequestException('El nombre es obligatorio');
    }

    if (!input.lastName?.trim()) {
      throw new BadRequestException('El apellido es obligatorio');
    }

    if (!input.dni?.trim()) {
      throw new BadRequestException('El DNI es obligatorio');
    }

    if (!/^\d{8}$/.test(input.dni.trim())) {
      throw new BadRequestException('El DNI debe tener 8 digitos');
    }

    if (!input.phone?.trim()) {
      throw new BadRequestException('El telefono es obligatorio');
    }

    if (input.specialInterestRate != null && input.specialInterestRate < 0) {
      throw new BadRequestException('La tasa especial no puede ser negativa');
    }
  }

  private emptyToNull(value: string | undefined) {
    if (!value?.trim()) return null;
    return value.trim();
  }

  private toDate(value: string | undefined) {
    if (!value?.trim()) return null;
    return new Date(`${value.trim()}T00:00:00.000Z`);
  }

  private toListItem(client: {
    _count: { credits: number };
    credits: Array<{ totalAmount: Prisma.Decimal }>;
    dni: string;
    email: string | null;
    personalAddress: string | null;
    businessAddress: string | null;
    birthDate: Date | null;
    firstName: string;
    id: string;
    isSpecial: boolean;
    lastName: string;
    phone: string;
    status: ClientStatus;
    specialInterestRate: Prisma.Decimal | null;
  }): ClientListItem {
    const totalDebt = client.credits.reduce((total, credit) => {
      return total + Number(credit.totalAmount);
    }, 0);

    return {
      activeCredits: client._count.credits,
      dni: client.dni,
      email: client.email,
      birthDate: client.birthDate?.toISOString().slice(0, 10) ?? null,
      businessAddress: client.businessAddress,
      firstName: client.firstName,
      fullName: `${client.firstName} ${client.lastName}`,
      id: client.id,
      isSpecial: client.isSpecial,
      lastName: client.lastName,
      personalAddress: client.personalAddress,
      phone: client.phone,
      status: client.status,
      specialInterestRate: client.specialInterestRate == null ? null : Number(client.specialInterestRate),
      totalDebt,
    };
  }

  private isUniqueConstraintError(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    return error.code === 'P2002';
  }

  private isNotFoundError(error: unknown) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
    return error.code === 'P2025';
  }
}
