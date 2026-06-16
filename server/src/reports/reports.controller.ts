import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import { ReportsService } from './reports.service';

@Controller('reports')
@Roles(UserRole.ADMIN, UserRole.ANALYST)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('portfolio')
  getPortfolioReport(@CurrentUser() user: AuthTokenPayload) {
    return this.reportsService.getPortfolioReport(user);
  }
}
