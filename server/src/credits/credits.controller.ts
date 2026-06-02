import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreditsService } from './credits.service';
import type { CreateCreditInput, CreditSimulationInput, PayInstallmentsInput } from './credits.types';

@Controller('credits')
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Post('simulate')
  simulate(@Body() input: CreditSimulationInput) {
    return this.creditsService.simulate(input);
  }

  @Post()
  create(@Body() input: CreateCreditInput) {
    return this.creditsService.create(input);
  }

  @Get('client/:clientId/approved')
  findApprovedByClient(@Param('clientId') clientId: string) {
    return this.creditsService.findApprovedByClient(clientId);
  }

  @Post(':creditId/pay-installments')
  payInstallments(@Param('creditId') creditId: string, @Body() input: PayInstallmentsInput) {
    return this.creditsService.payInstallments(creditId, input);
  }
}
