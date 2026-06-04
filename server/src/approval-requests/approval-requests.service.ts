import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, CreditStatus, CreditType, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { ApprovalRequestListItem, ReviewApprovalInput } from './approval-requests.types';

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

  async approve(id: string, input: ReviewApprovalInput) {
    return this.review(id, ApprovalStatus.APPROVED, CreditStatus.APPROVED, input);
  }

  async reject(id: string, input: ReviewApprovalInput) {
    return this.review(id, ApprovalStatus.REJECTED, CreditStatus.REJECTED, input);
  }

  private async review(id: string, approvalStatus: ApprovalStatus, creditStatus: CreditStatus, input: ReviewApprovalInput) {
    const organization = await this.getOrganization();
    const reviewer = await this.getReviewer(organization.id);

    const request = await this.prisma.approvalRequest.findFirst({
      where: {
        id,
        organizationId: organization.id,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    await this.prisma.credit.update({
      data: { status: creditStatus },
      where: { id: request.creditId },
    });

    const updatedRequest = await this.prisma.approvalRequest.update({
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

    return this.toListItem(updatedRequest);
  }

  private async getOrganization() {
    return this.prisma.organization.upsert({
      create: demoOrganization,
      update: { name: demoOrganization.name },
      where: { clerkOrganizationId: demoOrganization.clerkOrganizationId },
    });
  }

  private async getReviewer(organizationId: string) {
    return this.prisma.appUser.upsert({
      create: {
        email: demoReviewer.email,
        fullName: demoReviewer.fullName,
        id: demoReviewer.id,
        organizationId,
        role: demoReviewer.role,
      },
      update: {
        email: demoReviewer.email,
        fullName: demoReviewer.fullName,
        role: demoReviewer.role,
      },
      where: { id: demoReviewer.id },
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
