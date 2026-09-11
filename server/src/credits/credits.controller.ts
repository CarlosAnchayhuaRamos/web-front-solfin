import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import type { ConfirmCreditDocumentInput } from './credits.types';
import { CreditsService } from './credits.service';
import { CreditReversalsService } from './credit-reversals.service';
import type { ReverseCreditInput } from './credits.types';
import type { AssignCreditAdvisorInput, CreateCreditInput, CreditSimulationInput, DisburseCreditInput, PayInstallmentsInput } from './credits.types';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService, private readonly reversals: CreditReversalsService) {}

  @Post(':creditId/reverse')
  @Roles(UserRole.ADMIN)
  async reverse(@Param('creditId') creditId: string, @Body() input: ReverseCreditInput, @CurrentUser() user: AuthTokenPayload) {
    const result = await this.reversals.reverse(creditId, input, user.sub);
    return { credits: await this.creditsService.findApprovedByClient(result.clientId), voucher: result.voucher };
  }

  @Get()
  @Public()
  getInfo() {
    return {
      endpoints: ['POST /credits', 'POST /credits/simulate', 'GET /credits/client/:clientId/approved'],
      name: 'SOLFIN Credits API',
      status: 'ok',
    };
  }

  @Post('simulate')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  simulate(@Body() input: CreditSimulationInput) {
    return this.creditsService.simulate(input);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  create(@Body() input: CreateCreditInput, @CurrentUser() user: AuthTokenPayload) {
    return this.creditsService.create(input, user.sub);
  }

  @Get('advisors')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  findAdvisors() {
    return this.creditsService.findAdvisors();
  }

  @Get('client/:clientId/approved')
  findApprovedByClient(@Param('clientId') clientId: string) {
    return this.creditsService.findApprovedByClient(clientId);
  }

  @Patch(':creditId/advisor')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  assignAdvisor(@Param('creditId') creditId: string, @Body() input: AssignCreditAdvisorInput) {
    return this.creditsService.assignAdvisor(creditId, input);
  }

  @Post(':creditId/pay-installments')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  payInstallments(@Param('creditId') creditId: string, @Body() input: PayInstallmentsInput, @CurrentUser() user: AuthTokenPayload) {
    return this.creditsService.payInstallments(creditId, { ...input, userId: user.sub });
  }

  @Post(':creditId/disburse')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  disburse(@Param('creditId') creditId: string, @Body() input: DisburseCreditInput, @CurrentUser() user: AuthTokenPayload) {
    return this.creditsService.disburse(creditId, { ...input, userId: user.sub });
  }

  @Post(':creditId/prepare-documents')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  prepareDocuments(@Param('creditId') creditId: string) {
    return this.creditsService.prepareDocuments(creditId);
  }

  @Post(':creditId/confirm-document')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  confirmDocument(@Param('creditId') creditId: string, @Body() input: ConfirmCreditDocumentInput) {
    return this.creditsService.confirmDocument(creditId, input);
  }
}
