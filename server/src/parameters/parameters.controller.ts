import { Body, Controller, Get, Put } from '@nestjs/common';
import { ParametersService } from './parameters.service';
import type { UpdateCashPolicyInput, UpdateCreditPolicyInput } from './parameters.types';

@Controller('parameters')
export class ParametersController {
  constructor(private readonly parametersService: ParametersService) {}

  @Get('credit-policy')
  getCreditPolicy() {
    return this.parametersService.getCreditPolicy();
  }

  @Put('credit-policy')
  updateCreditPolicy(@Body() input: UpdateCreditPolicyInput) {
    return this.parametersService.updateCreditPolicy(input);
  }

  @Get('cash-policy')
  getCashPolicy() {
    return this.parametersService.getCashPolicy();
  }

  @Put('cash-policy')
  updateCashPolicy(@Body() input: UpdateCashPolicyInput) {
    return this.parametersService.updateCashPolicy(input);
  }
}
