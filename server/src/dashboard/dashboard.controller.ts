import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@Roles(UserRole.ADMIN, UserRole.ANALYST)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@CurrentUser() user: AuthTokenPayload) {
    return this.dashboardService.getSummary(user);
  }
}
