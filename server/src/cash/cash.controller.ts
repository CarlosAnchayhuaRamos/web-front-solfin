import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/auth.decorators';
import { CashService } from './cash.service';
import type { AddCashSessionBalanceInput, AssignCashBoxInput, CloseCashSessionInput, CreateCashBoxInput, OpenCashSessionInput } from './cash.types';

@Controller('cash')
@Roles(UserRole.ADMIN, UserRole.CASHIER)
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('sessions')
  findSessions() {
    return this.cashService.findSessions();
  }

  @Get('boxes')
  findCashBoxes() {
    return this.cashService.findCashBoxes();
  }

  @Post('boxes')
  @Roles(UserRole.ADMIN)
  createCashBox(@Body() input: CreateCashBoxInput) {
    return this.cashService.createCashBox(input);
  }

  @Put('boxes/:id/assign')
  @Roles(UserRole.ADMIN)
  assignCashBox(@Param('id') id: string, @Body() input: AssignCashBoxInput) {
    return this.cashService.assignCashBox(id, input);
  }

  @Get('cashiers')
  findCashiers() {
    return this.cashService.findCashiers();
  }

  @Post('vault/open')
  @Roles(UserRole.ADMIN)
  openVault() {
    return this.cashService.openVault();
  }

  @Post('vault/close')
  @Roles(UserRole.ADMIN)
  closeVault() {
    return this.cashService.closeVault();
  }

  @Get('vault/status')
  getVaultStatus() {
    return this.cashService.getVaultStatus();
  }

  @Post('sessions/open')
  openCashSession(@Body() input: OpenCashSessionInput) {
    return this.cashService.openCashSession(input);
  }

  @Post('sessions/:id/close')
  closeCashSession(@Param('id') id: string, @Body() input: CloseCashSessionInput) {
    return this.cashService.closeCashSession(id, input);
  }

  @Post('sessions/:id/add-balance')
  @Roles(UserRole.ADMIN)
  addCashSessionBalance(@Param('id') id: string, @Body() input: AddCashSessionBalanceInput) {
    return this.cashService.addCashSessionBalance(id, input);
  }
}
