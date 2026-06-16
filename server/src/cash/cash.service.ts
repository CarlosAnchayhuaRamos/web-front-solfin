import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type {
  AddCashSessionBalanceInput,
  AssignCashBoxInput,
  CashBoxDto,
  CashDenominationCountDto,
  CashierDto,
  CloseCashSessionResultDto,
  CashSessionDto,
  CloseVaultResultDto,
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
          cs."userId",
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
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);

    if (!input.cashierId?.trim()) {
      const unassignedBoxes = await this.prisma.$queryRawUnsafe<CashBoxRecord[]>(
        `
          UPDATE cash_boxes
          SET "assignedUserId" = NULL,
              "updatedAt" = now()
          WHERE id = $1::uuid AND "organizationId" = $2::uuid
          RETURNING id, name, "isActive", NULL::text AS "assignedCashierId", NULL::text AS "assignedCashierName"
        `,
        id,
        organization.id,
      );

      if (!unassignedBoxes[0]) {
        throw new BadRequestException('La caja no existe');
      }

      return this.toCashBoxDto(unassignedBoxes[0]);
    }

    const cashier = await this.findCashierById(organization.id, input.cashierId);

    if (!cashier) {
      throw new BadRequestException('El cajero no existe o no esta activo');
    }

    const existingAssignment = await this.prisma.cashBox.findFirst({
      where: {
        assignedUserId: input.cashierId,
        id: { not: id },
        organizationId: organization.id,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException(`El cajero ya esta asignado a ${existingAssignment.name}`);
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

  async closeVault(): Promise<CloseVaultResultDto> {
    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const unclosedCashBoxes = await this.findUnclosedCashBoxes(organization.id);

    if (unclosedCashBoxes.length) {
      throw new BadRequestException({
        message: 'Cierre las cajas abiertas antes de cerrar boveda',
        unclosedCashBoxes,
      });
    }

    const reports = await this.findTodayCashCloseReports(organization.id);
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
      report: {
        boxes: reports,
        closedAt: new Date().toISOString(),
        totalCounted: this.sumReportField(reports, 'countedAmount'),
        totalDifference: this.sumReportField(reports, 'difference'),
        totalExpected: this.sumReportField(reports, 'expectedAmount'),
        totalExpenses: this.sumReportField(reports, 'expenses'),
        totalIncome: this.sumReportField(reports, 'income'),
        totalOpening: this.sumReportField(reports, 'openingAmount'),
        vaultName: vault.name,
      },
      vault: {
        balance: Number(vault.balance),
        isOpen: Boolean(vault.openedAt),
        vaultName: vault.name,
      },
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
          "userId",
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

  async closeCashSession(id: string, input: CloseCashSessionInput): Promise<CloseCashSessionResultDto> {
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
          cs."userId",
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

    const movements = await this.getCashMovementTotals(id);
    const movementDetails = await this.getCashMovementDetails(id);

    return {
      report: {
        cashBox: session.cashBox,
        cashier: session.cashier,
        closedAt: new Date().toISOString(),
        countedAmount: Number(session.countedAmount),
        difference: Number(session.difference),
        expectedAmount: Number(session.expectedAmount),
        expenses: movements.expenses,
        expenseMovements: movementDetails.filter((movement) => movement.direction === 'OUT').map(this.toCashCloseMovementDto),
        income: movements.income,
        incomeMovements: movementDetails.filter((movement) => movement.direction === 'IN').map(this.toCashCloseMovementDto),
        openingAmount: Number(session.openingAmount),
      },
      session: this.toSessionDto(session),
    };
  }

  async addCashSessionBalance(id: string, input: AddCashSessionBalanceInput): Promise<CashSessionDto> {
    const amount = this.roundMoney(input.amount);

    if (!Number.isFinite(input.amount) || amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    if (!input.userId?.trim()) {
      throw new BadRequestException('El responsable de boveda es obligatorio');
    }

    const organization = await this.getOrganization();
    await this.ensureCashSetup(organization.id);
    const responsible = await this.prisma.appUser.findFirst({
      where: { id: input.userId, isActive: true, organizationId: organization.id, role: 'ADMIN' },
    });

    if (!responsible) {
      throw new BadRequestException('Solo administrador puede adicionar saldo desde boveda');
    }

    const vaultStatus = await this.getVaultStatus();

    if (!vaultStatus.isOpen) {
      throw new BadRequestException('La boveda debe estar abierta');
    }

    const currentAmount = await this.getExpectedCashSessionAmount(id, organization.id);
    const maxCashBoxBalance = await this.getMaxCashBoxBalance(organization.id);

    if (currentAmount + amount > maxCashBoxBalance) {
      throw new BadRequestException(`El saldo supera el maximo de caja de S/ ${maxCashBoxBalance}`);
    }

    const vault = await this.ensureVault(organization.id);
    await this.prisma.cashMovement.create({
      data: {
        amount,
        cashSessionId: id,
        description: `Saldo adicionado desde boveda por ${responsible.fullName}`,
        direction: 'IN',
        reference: `VAULT-${Date.now()}`,
        type: 'WITHDRAWAL_FROM_VAULT',
        userId: responsible.id,
        vaultId: vault.id,
      },
    });

    const sessions = await this.findSessions();
    const session = sessions.find((currentSession) => currentSession.id === id);

    if (!session) {
      throw new BadRequestException('La caja abierta no existe');
    }

    return session;
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

  private async getCashMovementTotals(sessionId: string) {
    const totals = await this.prisma.$queryRawUnsafe<CashMovementTotalsRecord[]>(
      `
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE direction = 'IN'::"CashMovementDirection"), 0) AS income,
          COALESCE(SUM(amount) FILTER (WHERE direction = 'OUT'::"CashMovementDirection"), 0) AS expenses
        FROM cash_movements
        WHERE "cashSessionId" = $1::uuid
      `,
      sessionId,
    );

    return {
      expenses: Number(totals[0]?.expenses ?? 0),
      income: Number(totals[0]?.income ?? 0),
    };
  }

  private async findTodayCashCloseReports(organizationId: string) {
    const reports = await this.prisma.$queryRawUnsafe<CashCloseReportRecord[]>(
      `
        SELECT
          cb.name AS "cashBox",
          cs.id,
          au."fullName" AS cashier,
          cs."closedAt",
          cs."openingAmount",
          cs."expectedAmount",
          cs."countedAmount",
          cs.difference,
          COALESCE(SUM(cm.amount) FILTER (WHERE cm.direction = 'IN'::"CashMovementDirection"), 0) AS income,
          COALESCE(SUM(cm.amount) FILTER (WHERE cm.direction = 'OUT'::"CashMovementDirection"), 0) AS expenses
        FROM cash_sessions cs
        INNER JOIN cash_boxes cb ON cb.id = cs."cashBoxId"
        INNER JOIN app_users au ON au.id = cs."userId"
        LEFT JOIN cash_movements cm ON cm."cashSessionId" = cs.id
        WHERE cb."organizationId" = $1::uuid
          AND cs.status = 'CLOSED'::"CashSessionStatus"
          AND cs."closedAt" >= date_trunc('day', now())
        GROUP BY cs.id, cb.name, au."fullName"
        ORDER BY cs."closedAt" ASC
      `,
      organizationId,
    );

    return Promise.all(
      reports.map(async (report) => {
        const movementDetails = await this.getCashMovementDetails(report.id);

        return {
          cashBox: report.cashBox,
          cashier: report.cashier,
          closedAt: report.closedAt.toISOString(),
          countedAmount: Number(report.countedAmount),
          difference: Number(report.difference),
          expectedAmount: Number(report.expectedAmount),
          expenses: Number(report.expenses),
          expenseMovements: movementDetails.filter((movement) => movement.direction === 'OUT').map(this.toCashCloseMovementDto),
          income: Number(report.income),
          incomeMovements: movementDetails.filter((movement) => movement.direction === 'IN').map(this.toCashCloseMovementDto),
          openingAmount: Number(report.openingAmount),
        };
      }),
    );
  }

  private async getCashMovementDetails(sessionId: string) {
    return this.prisma.$queryRawUnsafe<CashMovementDetailRecord[]>(
      `
        SELECT
          cm.amount,
          COALESCE(cm.reference, c.code, cm.id::text) AS code,
          COALESCE(cl."firstName" || ' ' || cl."lastName", cm.description) AS client,
          cm."createdAt",
          cm.direction::text AS direction
        FROM cash_movements cm
        LEFT JOIN credits c ON c.id = cm."creditId"
        LEFT JOIN clients cl ON cl.id = c."clientId"
        WHERE cm."cashSessionId" = $1::uuid
        ORDER BY cm."createdAt" ASC
      `,
      sessionId,
    );
  }

  private toCashCloseMovementDto(movement: CashMovementDetailRecord) {
    return {
      amount: Number(movement.amount),
      client: movement.client,
      code: movement.code,
      createdAt: movement.createdAt.toISOString(),
    };
  }

  private sumReportField<T>(reports: T[], field: keyof T) {
    return this.roundMoney(reports.reduce((total, report) => total + Number(report[field] ?? 0), 0));
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
      userId: session.userId,
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
  userId: string;
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

interface CashMovementTotalsRecord {
  expenses: unknown;
  income: unknown;
}

interface CashCloseReportRecord {
  cashBox: string;
  cashier: string;
  closedAt: Date;
  countedAmount: unknown;
  difference: unknown;
  expectedAmount: unknown;
  expenses: unknown;
  income: unknown;
  id: string;
  openingAmount: unknown;
}

interface CashMovementDetailRecord {
  amount: unknown;
  client: string;
  code: string;
  createdAt: Date;
  direction: 'IN' | 'OUT';
}
