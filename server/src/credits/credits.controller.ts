import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, Public, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import { CreditsService } from './credits.service';
import type { AssignCreditAdvisorInput, CreateCreditInput, CreditSimulationInput, DisburseCreditInput, PayInstallmentsInput } from './credits.types';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

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
  payInstallments(@Param('creditId') creditId: string, @Body() input: PayInstallmentsInput) {
    return this.creditsService.payInstallments(creditId, input);
  }

  @Post(':creditId/disburse')
  @Roles(UserRole.ADMIN, UserRole.CASHIER)
  disburse(@Param('creditId') creditId: string, @Body() input: DisburseCreditInput) {
    return this.creditsService.disburse(creditId, input);
  }
}
