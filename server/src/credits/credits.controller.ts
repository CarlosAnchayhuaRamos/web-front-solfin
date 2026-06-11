import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/auth.decorators';
import { CreditsService } from './credits.service';
import type { CreateCreditInput, CreditSimulationInput, DisburseCreditInput, PayInstallmentsInput } from './credits.types';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('simulate')
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  simulate(@Body() input: CreditSimulationInput) {
    return this.creditsService.simulate(input);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ANALYST)
  create(@Body() input: CreateCreditInput) {
    return this.creditsService.create(input);
  }

  @Get('client/:clientId/approved')
  findApprovedByClient(@Param('clientId') clientId: string) {
    return this.creditsService.findApprovedByClient(clientId);
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
