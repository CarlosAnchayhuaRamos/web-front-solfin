import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AssignCashBoxInput,
  CashBoxDto,
  CashDenominationCountDto,
  CashierDto,
  CashSessionDto,
  CloseCashSessionInput,
  CreateCashBoxInput,
  OpenCashSessionInput,
  VaultOpeningDto,
} from './cash.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const adminUser = {
  id: 'user_demo_admin',
};

const defaultCashBoxes = ['Caja principal', 'Caja auxiliar'];
const defaultVaultName = 'Boveda principal';

@Injectable()
export class CashService {
  constructor(private readonly prisma: PrismaService) {}

  async findSessions(): Promise<CashSessionDto[]> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);

    const sessions = await this.prisma.$queryRawUnsafe<CashSessionRecord[]>(
      `
        SELECT
          cs.id,
          cb.name AS "cashBox",
          au."fullName" AS cashier,
          cs.status::text AS status,
          cs."openingAmount",
          CASE
            WHEN cs.status = 'OPEN'::"CashSessionStatus" THEN cs."openingAmount" + COALESCE((
              SELECT SUM(
                CASE
                  WHEN cm.direction = 'IN'::"CashMovementDirection" THEN cm.amount
                  ELSE -cm.amount
                END
              )
              FROM cash_movements cm
              WHERE cm."cashSessionId" = cs.id
            ), 0)
            ELSE cs."expectedAmount"
          END AS "expectedAmount",
          cs."countedAmount",
          cs.difference,
          cs.denominations,
          cs."closingDenominations"
        FROM cash_sessions cs
        INNER JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
        INNER JOIN app_users au ON au.id = cs."userId"
        WHERE cb."organizationId" = $1::uuid
        ORDER BY cs."openedAt" DESC
      `,
      organization.id,
    );

    return sessions.map((session) => this.toSessionDto(session));
  }

  async findCashBoxes(): Promise<CashBoxDto[]> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const boxes = await this.prisma.$queryRawUnsafe<CashBoxRecord[]>(
      `
        SELECT
          cb.id,
          cb.name,
          cb."isActive",
          cb."assignedUserId" AS "assignedCashierId",
          au."fullName" AS "assignedCashierName"
        FROM cash_boxes cb
        LEFT JOIN app_users au ON au.id = cb."assignedUserId"
        WHERE cb."organizationId" = $1::uuid
        ORDER BY cb."createdAt" ASC
      `,
      organization.id,
    );

    return boxes.map((box) => this.toCashBoxDto(box));
  }

  async findCashiers(): Promise<CashierDto[]> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const cashiers = await this.prisma.$queryRawUnsafe<CashierRecord[]>(
      `
        SELECT id, "fullName"
        FROM app_users
        WHERE "organizationId" = $1::uuid
          AND role = 'CASHIER'::"UserRole"
          AND "isActive" = true
        ORDER BY "fullName" ASC
      `,
      organization.id,
    );

    return cashiers;
  }

  async createCashBox(input: CreateCashBoxInput): Promise<CashBoxDto> {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('El nombre de caja es obligatorio');
    }

    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const boxes = await this.prisma.$queryRawUnsafe<CashBoxRecord[]>(
      `
        INSERT INTO cash_boxes (id, "organizationId", name, "isActive", "createdAt", "updatedAt")
        VALUES ($1::uuid, $2::uuid, $3, true, now(), now())
        ON CONFLICT ("organizationId", name) DO UPDATE SET
          "isActive" = true,
          "updatedAt" = now()
        RETURNING id, name, "isActive", "assignedUserId" AS "assignedCashierId", NULL::text AS "assignedCashierName"
      `,
      randomUUID(),
      organization.id,
      name,
    );

    return this.toCashBoxDto(boxes[0]);
  }

  async assignCashBox(id: string, input: AssignCashBoxInput): Promise<CashBoxDto> {
    if (!input.cashierId?.trim()) {
      throw new BadRequestException('El cajero es obligatorio');
    }

    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const cashier = await this.findCashierById(organization.id, input.cashierId);

    if (!cashier) {
      throw new BadRequestException('El cajero no existe o no esta activo');
    }

    const boxes = await this.prisma.$queryRawUnsafe<CashBoxRecord[]>(
      `
        UPDATE cash_boxes
        SET "assignedUserId" = $1,
            "updatedAt" = now()
        WHERE id = $2::uuid AND "organizationId" = $3::uuid
        RETURNING id, name, "isActive", "assignedUserId" AS "assignedCashierId", $4 AS "assignedCashierName"
      `,
      input.cashierId,
      id,
      organization.id,
      cashier.fullName,
    );
    const box = boxes[0];

    if (!box) {
      throw new BadRequestException('La caja no existe');
    }

    return this.toCashBoxDto(box);
  }

  async openVault(): Promise<VaultOpeningDto> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);

    const vaults = await this.prisma.$queryRawUnsafe<VaultRecord[]>(
      `
        UPDATE vaults
        SET "openedAt" = COALESCE("openedAt", now()),
            "openedByUserId" = $1,
            "updatedAt" = now()
        WHERE "organizationId" = $2::uuid AND name = $3
        RETURNING name, balance, "openedAt"
      `,
      adminUser.id,
      organization.id,
      defaultVaultName,
    );
    const vault = vaults[0];

    return {
      balance: Number(vault.balance),
      isOpen: Boolean(vault.openedAt),
      vaultName: vault.name,
    };
  }

  async closeVault(): Promise<VaultOpeningDto> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const unclosedCashBoxes = await this.findUnclosedCashBoxes(organization.id);

    if (unclosedCashBoxes.length) {
      throw new BadRequestException({
        message: 'Cierre las cajas abiertas antes de cerrar boveda',
        unclosedCashBoxes,
      });
    }

    const vaults = await this.prisma.$queryRawUnsafe<VaultRecord[]>(
      `
        UPDATE vaults
        SET "openedAt" = NULL,
            "openedByUserId" = NULL,
            "updatedAt" = now()
        WHERE "organizationId" = $1::uuid AND name = $2
        RETURNING name, balance, "openedAt"
      `,
      organization.id,
      defaultVaultName,
    );
    const vault = vaults[0];

    return {
      balance: Number(vault.balance),
      isOpen: Boolean(vault.openedAt),
      vaultName: vault.name,
    };
  }

  async getVaultStatus(): Promise<VaultOpeningDto> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const vaults = await this.prisma.$queryRawUnsafe<VaultRecord[]>(
      `
        SELECT name, balance, "openedAt"
        FROM vaults
        WHERE "organizationId" = $1::uuid AND name = $2
        LIMIT 1
      `,
      organization.id,
      defaultVaultName,
    );
    const vault = vaults[0];

    return {
      balance: Number(vault.balance),
      isOpen: Boolean(vault.openedAt),
      vaultName: vault.name,
    };
  }

  async openCashSession(input: OpenCashSessionInput): Promise<CashSessionDto> {
    this.validateOpenCashSession(input);

    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const vaultStatus = await this.getVaultStatus();

    if (!vaultStatus.isOpen) {
      throw new BadRequestException('La boveda debe estar abierta');
    }

    const cashBoxes = await this.prisma.$queryRawUnsafe<Array<{ assignedUserId: string | null; id: string; name: string }>>(
      `
        SELECT id, name, "assignedUserId"
        FROM cash_boxes
        WHERE "organizationId" = $1::uuid
          AND name = $2
          AND "isActive" = true
        LIMIT 1
      `,
      organization.id,
      input.cashBoxName,
    );
    const cashBox = cashBoxes[0];

    if (!cashBox) {
      throw new BadRequestException('La caja no existe');
    }

    if (cashBox.assignedUserId !== input.userId) {
      throw new BadRequestException('La caja no esta asignada al cajero');
    }

    const maxCashBoxBalance = await this.getMaxCashBoxBalance(organization.id);

    if (input.openingAmount > maxCashBoxBalance) {
      throw new BadRequestException('El efectivo de apertura supera el maximo permitido');
    }

    const sessions = await this.prisma.$queryRawUnsafe<CashSessionRecord[]>(
      `
        INSERT INTO cash_sessions (
          id,
          "cashBoxId",
          "userId",
          status,
          "openingAmount",
          "expectedAmount",
          denominations,
          "createdAt",
          "updatedAt"
        )
        VALUES ($1::uuid, $2::uuid, $3, 'OPEN'::"CashSessionStatus", $4, $4, $5::jsonb, now(), now())
        RETURNING
          id,
          $6 AS "cashBox",
          $7 AS cashier,
          status::text AS status,
          "openingAmount",
          "expectedAmount",
          "countedAmount",
          NULL::numeric AS difference,
          denominations,
          NULL::jsonb AS "closingDenominations"
      `,
      randomUUID(),
      cashBox.id,
      input.userId,
      input.openingAmount,
      JSON.stringify(input.denominations),
      cashBox.name,
      input.cashierName,
    );

    return this.toSessionDto(sessions[0]);
  }

  async closeCashSession(id: string, input: CloseCashSessionInput): Promise<CashSessionDto> {
    this.validateCloseCashSession(input);

    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const expectedAmount = await this.getExpectedCashSessionAmount(id, organization.id);
    const maxCashDifference = await this.getMaxCashDifference(organization.id);
    const difference = this.roundMoney(input.countedAmount - expectedAmount);

    if (Math.abs(difference) > maxCashDifference) {
      throw new BadRequestException(`La diferencia supera el maximo permitido de S/ ${maxCashDifference}`);
    }

    const sessions = await this.prisma.$queryRawUnsafe<CashSessionRecord[]>(
      `
        UPDATE cash_sessions cs
        SET status = 'CLOSED'::"CashSessionStatus",
            "closedAt" = now(),
            "expectedAmount" = $3,
            "countedAmount" = $4,
            difference = $5,
            "closingDenominations" = $6::jsonb,
            "updatedAt" = now()
        FROM cash_boxes cb, app_users au
        WHERE cs.id = $1::uuid
          AND cs."cashBoxId" = cb.id
          AND cs."userId" = au.id
          AND cb."organizationId" = $2::uuid
          AND cs.status = 'OPEN'::"CashSessionStatus"
        RETURNING
          cs.id,
          cb.name AS "cashBox",
          au."fullName" AS cashier,
          cs.status::text AS status,
          cs."openingAmount",
          cs."expectedAmount",
          cs."countedAmount",
          cs.difference,
          cs.denominations,
          cs."closingDenominations"
      `,
      id,
      organization.id,
      expectedAmount,
      input.countedAmount,
      difference,
      JSON.stringify(input.denominations),
    );
    const session = sessions[0];

    if (!session) {
      throw new BadRequestException('La caja abierta no existe');
    }

    return this.toSessionDto(session);
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private async ensureCashSetup(organizationId: string) {
    await this.ensureVault(organizationId);
    await Promise.all(
      defaultCashBoxes.map((name) =>
        this.prisma.cashBox.upsert({
          create: {
            name,
            organizationId,
          },
          update: { isActive: true },
          where: {
            organizationId_name: {
              name,
              organizationId,
            },
          },
        }),
      ),
    );
  }

  private async ensureVault(organizationId: string) {
    return this.prisma.vault.upsert({
      create: {
        balance: 0,
        name: defaultVaultName,
        organizationId,
      },
      update: { isActive: true },
      where: {
        organizationId_name: {
          name: defaultVaultName,
          organizationId,
        },
      },
    });
  }

  private async findCashierById(organizationId: string, cashierId: string) {
    const cashiers = await this.prisma.$queryRawUnsafe<CashierRecord[]>(
      `
        SELECT id, "fullName"
        FROM app_users
        WHERE id = $1
          AND "organizationId" = $2::uuid
          AND role = 'CASHIER'::"UserRole"
          AND "isActive" = true
        LIMIT 1
      `,
      cashierId,
      organizationId,
    );

    return cashiers[0] ?? null;
  }

  private async findUnclosedCashBoxes(organizationId: string) {
    return this.prisma.$queryRawUnsafe<UnclosedCashBoxRecord[]>(
      `
        SELECT
          cb.name AS "cashBox",
          au."fullName" AS cashier,
          cs."openedAt",
          cs."openingAmount"
        FROM cash_sessions cs
        INNER JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
        INNER JOIN app_users au ON au.id = cs."userId"
        WHERE cb."organizationId" = $1::uuid
          AND cs.status = 'OPEN'::"CashSessionStatus"
        ORDER BY cs."openedAt" ASC
      `,
      organizationId,
    );
  }

  private async getMaxCashBoxBalance(organizationId: string) {
    const policies = await this.prisma.$queryRawUnsafe<Array<{ maxCashBoxBalance: unknown }>>(
      `
        SELECT "maxCashBoxBalance"
        FROM cash_policies
        WHERE "organizationId" = $1::uuid
        LIMIT 1
      `,
      organizationId,
    );

    return Number(policies[0]?.maxCashBoxBalance ?? 15000);
  }

  private async getMaxCashDifference(organizationId: string) {
    const policies = await this.prisma.$queryRawUnsafe<Array<{ maxCashDifference: unknown }>>(
      `
        SELECT "maxCashDifference"
        FROM cash_policies
        WHERE "organizationId" = $1::uuid
        LIMIT 1
      `,
      organizationId,
    );

    return Number(policies[0]?.maxCashDifference ?? 0.5);
  }

  private async getExpectedCashSessionAmount(sessionId: string, organizationId: string) {
    const sessions = await this.prisma.$queryRawUnsafe<Array<{ expectedAmount: unknown }>>(
      `
        SELECT cs."openingAmount" + COALESCE((
          SELECT SUM(
            CASE
              WHEN cm.direction = 'IN'::"CashMovementDirection" THEN cm.amount
              ELSE -cm.amount
            END
          )
          FROM cash_movements cm
          WHERE cm."cashSessionId" = cs.id
        ), 0) AS "expectedAmount"
        FROM cash_sessions cs
        INNER JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
        WHERE cs.id = $1::uuid
          AND cb."organizationId" = $2::uuid
          AND cs.status = 'OPEN'::"CashSessionStatus"
        LIMIT 1
      `,
      sessionId,
      organizationId,
    );
    const session = sessions[0];

    if (!session) {
      throw new BadRequestException('La caja abierta no existe');
    }

    return Number(session.expectedAmount);
  }

  private validateOpenCashSession(input: OpenCashSessionInput) {
    if (!input.userId?.trim()) {
      throw new BadRequestException('El cajero es obligatorio');
    }

    if (!input.cashierName?.trim()) {
      throw new BadRequestException('El nombre del cajero es obligatorio');
    }

    if (!input.cashBoxName?.trim()) {
      throw new BadRequestException('La caja es obligatoria');
    }

    if (input.openingAmount < 0) {
      throw new BadRequestException('El monto de apertura no puede ser negativo');
    }

    if (!input.denominations?.length && input.openingAmount === 0) {
      return;
    }

    if (!input.denominations?.length) {
      throw new BadRequestException('El detalle de denominaciones es obligatorio');
    }

    const hasInvalidDenomination = input.denominations.some((denomination) => {
      if (Number(denomination.value) <= 0) return true;
      if (Number(denomination.quantity) < 0) return true;
      return !Number.isInteger(Number(denomination.quantity));
    });

    if (hasInvalidDenomination) {
      throw new BadRequestException('Las denominaciones tienen valores invalidos');
    }

    const hasPositiveQuantity = input.denominations.some((denomination) => Number(denomination.quantity) > 0);

    if (!hasPositiveQuantity && input.openingAmount > 0) {
      throw new BadRequestException('Debe registrar al menos una denominacion');
    }

    const denominationTotal = input.denominations.reduce((total, denomination) => {
      return total + Number(denomination.value) * Number(denomination.quantity);
    }, 0);

    if (Math.abs(denominationTotal - input.openingAmount) > 0.01) {
      throw new BadRequestException('El conteo no coincide con el monto de apertura');
    }
  }

  private validateCloseCashSession(input: CloseCashSessionInput) {
    if (input.countedAmount < 0) {
      throw new BadRequestException('El monto contado no puede ser negativo');
    }

    if (!input.denominations?.length && input.countedAmount === 0) {
      return;
    }

    if (!input.denominations?.length) {
      throw new BadRequestException('El detalle de denominaciones es obligatorio');
    }

    const hasInvalidDenomination = input.denominations.some((denomination) => {
      if (Number(denomination.value) <= 0) return true;
      if (Number(denomination.quantity) < 0) return true;
      return !Number.isInteger(Number(denomination.quantity));
    });

    if (hasInvalidDenomination) {
      throw new BadRequestException('Las denominaciones tienen valores invalidos');
    }

    const denominationTotal = input.denominations.reduce((total, denomination) => {
      return total + Number(denomination.value) * Number(denomination.quantity);
    }, 0);

    if (Math.abs(denominationTotal - input.countedAmount) > 0.01) {
      throw new BadRequestException('El conteo no coincide con el monto contado');
    }
  }

  private roundMoney(amount: number) {
    return Math.round(amount * 100) / 100;
  }

  private toSessionDto(session: CashSessionRecord): CashSessionDto {
    return {
      cashBox: session.cashBox,
      cashier: session.cashier,
      closingDenominations: this.toDenominations(session.closingDenominations),
      countedAmount: session.countedAmount === null ? null : Number(session.countedAmount),
      difference: session.difference === null ? null : Number(session.difference),
      denominations: this.toDenominations(session.denominations),
      expectedAmount: Number(session.expectedAmount ?? session.openingAmount),
      id: session.id,
      openingAmount: Number(session.openingAmount),
      status: session.status === 'CLOSED' ? 'CLOSED' : 'OPEN',
    };
  }

  private toCashBoxDto(box: CashBoxRecord): CashBoxDto {
    return {
      assignedCashierId: box.assignedCashierId,
      assignedCashierName: box.assignedCashierName,
      id: box.id,
      isActive: box.isActive,
      name: box.name,
    };
  }

  private toDenominations(value: unknown): CashDenominationCountDto[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CashDenominationCountDto => {
      if (typeof item !== 'object' || item === null) return false;

      const denomination = item as CashDenominationCountDto;
      return typeof denomination.label === 'string' && typeof denomination.quantity === 'number' && typeof denomination.value === 'number';
    });
  }
}

interface CashSessionRecord {
  id: string;
  cashBox: string;
  cashier: string;
  countedAmount: unknown | null;
  closingDenominations: unknown;
  denominations: unknown;
  difference: unknown | null;
  expectedAmount: unknown | null;
  openingAmount: unknown;
  status: string;
}

interface VaultRecord {
  balance: unknown;
  name: string;
  openedAt: Date | null;
}

interface CashBoxRecord {
  assignedCashierId: string | null;
  assignedCashierName: string | null;
  id: string;
  isActive: boolean;
  name: string;
}

interface CashierRecord {
  fullName: string;
  id: string;
}

interface UnclosedCashBoxRecord {
  cashBox: string;
  cashier: string;
  openedAt: Date;
  openingAmount: unknown;
}
