import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, CreditStatus, CreditType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ApprovalRequestListItem, CreditContractData, ReviewApprovalInput, ReviewApprovalResult } from './approval-requests.types';

const demoOrganization = {
  clerkOrganizationId: 'org_demo_solfin',
  name: 'SOLFIN PERU',
  ruc: '20600000001',
};

const demoReviewer = {
  email: 'admin@solfin.pe',
  fullName: 'Admin SOLFIN',
  id: 'user_demo_admin',
  role: UserRole.ADMIN,
};

@Injectable()
export class ApprovalRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const organization = await this.getOrganization();
    await this.ensureMissingApprovalRequests(organization.id);

    const requests = await this.prisma.approvalRequest.findMany({
      include: {
        credit: {
          include: {
            analyst: true,
            client: true,
            documents: true,
          },
        },
      },
      orderBy: { requestedAt: 'desc' },
      where: { organizationId: organization.id },
    });

    return requests.map((request) => this.toListItem(request));
  }

  async approve(id: string, input: ReviewApprovalInput, reviewerId: string): Promise<ReviewApprovalResult> {
    return this.review(id, ApprovalStatus.APPROVED, CreditStatus.APPROVED, input, reviewerId);
  }

  async reject(id: string, input: ReviewApprovalInput, reviewerId: string): Promise<ReviewApprovalResult> {
    return this.review(id, ApprovalStatus.REJECTED, CreditStatus.REJECTED, input, reviewerId);
  }

  private async review(id: string, approvalStatus: ApprovalStatus, creditStatus: CreditStatus, input: ReviewApprovalInput, reviewerId: string) {
    const organization = await this.getOrganization();
    const reviewer = await this.prisma.appUser.findFirst({
      where: {
        id: reviewerId,
        isActive: true,
        organizationId: organization.id,
        role: UserRole.ADMIN,
      },
    });

    if (!reviewer) {
      throw new NotFoundException('Aprobador no encontrado');
    }

    const request = await this.prisma.approvalRequest.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('La solicitud ya fue revisada');
    }

    const updatedRequest = await this.prisma.$transaction(async (tx) => {
      await tx.credit.update({
        data: {
          approvedById: approvalStatus === ApprovalStatus.APPROVED ? reviewer.id : undefined,
          status: creditStatus,
        },
        where: { id: request.creditId },
      });
      await tx.creditStatusHistory.create({
        data: {
          changedById: reviewer.id,
          creditId: request.creditId,
          fromStatus: CreditStatus.PENDING_APPROVAL,
          notes: input.notes?.trim() || null,
          toStatus: creditStatus,
        },
      });

      return tx.approvalRequest.update({
        data: {
          reviewedAt: new Date(),
          reviewedById: reviewer.id,
          reviewerNotes: input.notes?.trim() || null,
          status: approvalStatus,
        },
        include: {
          credit: {
            include: {
              analyst: true,
              client: true,
              documents: true,
            },
          },
        },
        where: { id },
      });
    });

    return {
      contract: approvalStatus === ApprovalStatus.APPROVED ? await this.getContractData(request.creditId, reviewer.fullName) : null,
      request: this.toListItem(updatedRequest),
    };
  }

  private async getContractData(creditId: string, approvedByName: string): Promise<CreditContractData> {
    const credit = await this.prisma.credit.findUnique({
      include: { analyst: true, client: true, schedules: { orderBy: { installmentNo: 'asc' } } },
      where: { id: creditId },
    });

    if (!credit) {
      throw new NotFoundException('Credito no encontrado');
    }

    const policy = await this.prisma.creditPolicy.findUnique({ where: { organizationId: credit.organizationId } });

    return {
      advisorName: credit.analyst.fullName,
      approvedAt: new Date().toISOString(),
      approvedByName,
      clientAddress: [credit.client.personalAddress, credit.client.district, credit.client.province, credit.client.department].filter(Boolean).join(', ') || null,
      clientDni: credit.client.dni,
      clientName: `${credit.client.firstName} ${credit.client.lastName}`,
      creditCode: credit.code,
      installmentAmount: Number(credit.installmentAmount),
      installmentCount: credit.installmentCount,
      interestCalculationMethod: credit.interestCalculationMethod,
      interestRate: Number(credit.interestRate),
      paymentFrequency: credit.paymentFrequency,
      penaltyRate: Number(policy?.defaultPenaltyRate ?? 0),
      principalAmount: Number(credit.principalAmount),
      schedules: credit.schedules.map((schedule) => ({
        dueDate: schedule.dueDate.toISOString(),
        installmentNo: schedule.installmentNo,
        interest: Number(schedule.interest),
        principal: Number(schedule.principal),
        totalDue: Number(schedule.totalDue),
      })),
      totalAmount: Number(credit.totalAmount),
    };
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private async getReviewer(organizationId: string) {
    const existingReviewerByEmail = await this.prisma.appUser.findFirst({
      where: { email: demoReviewer.email, organizationId },
    });
    const existingDemoReviewer = await this.prisma.appUser.findFirst({
      where: { id: demoReviewer.id, organizationId },
    });
    const existingReviewer = existingReviewerByEmail ?? existingDemoReviewer;

    if (existingReviewer) {
      return this.prisma.appUser.update({
        data: {
          email: demoReviewer.email,
          fullName: demoReviewer.fullName,
          role: demoReviewer.role,
        },
        where: { id: existingReviewer.id },
      });
    }

    return this.prisma.appUser.create({
      data: {
        email: demoReviewer.email,
        fullName: demoReviewer.fullName,
        id: demoReviewer.id,
        organizationId,
        role: demoReviewer.role,
      },
    });
  }

  private async ensureMissingApprovalRequests(organizationId: string) {
    const reviewer = await this.getReviewer(organizationId);
    const credits = await this.prisma.credit.findMany({
      include: {
        analyst: true,
        approvalRequest: true,
      },
      where: {
        approvalRequest: null,
        organizationId,
        status: CreditStatus.PENDING_APPROVAL,
      },
    });

    if (!credits.length) return;

    await this.prisma.$transaction(
      credits.map((credit) =>
        this.prisma.credit.update({
          data: {
            approvalRequest: {
              create: {
                analystLimit: credit.analyst.creditLimit,
                organizationId,
                reason: 'Solicitud generada automaticamente para revision',
                requestedAmount: credit.principalAmount,
                requestedById: reviewer.id,
              },
            },
            status: CreditStatus.PENDING_APPROVAL,
          },
          where: { id: credit.id },
        }),
      ),
    );
  }

  private toListItem(
    request: Prisma.ApprovalRequestGetPayload<{
      include: {
        credit: {
          include: {
            analyst: true;
            client: true;
            documents: true;
          };
        };
      };
    }>,
  ): ApprovalRequestListItem {
    return {
      analystLimit: Number(request.analystLimit),
      analystName: request.credit.analyst.fullName,
      amount: Number(request.requestedAmount),
      clientName: `${request.credit.client.firstName} ${request.credit.client.lastName}`,
      creditCode: request.credit.code,
      creditId: request.creditId,
      creditType: request.credit.type === CreditType.EXPRESS ? 'Express' : 'Garantia',
      files: request.credit.documents.map((document) => ({
        fileName: document.fileName,
        id: document.id,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        url: document.publicUrl,
      })),
      id: request.id,
      requestedAt: request.requestedAt.toISOString(),
      reviewerNotes: request.reviewerNotes,
      status: request.status,
    };
  }
}
