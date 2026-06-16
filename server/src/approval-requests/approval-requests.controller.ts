import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import type { AuthTokenPayload } from '../auth/auth.types';
import { ApprovalRequestsService } from './approval-requests.service';
import type { ReviewApprovalInput } from './approval-requests.types';

@Controller('approval-requests')
@Roles(UserRole.ADMIN)
export class ApprovalRequestsController {
  constructor(private readonly approvalRequestsService: ApprovalRequestsService) {}

  @Get()
  findAll() {
    return this.approvalRequestsService.findAll();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() input: ReviewApprovalInput, @CurrentUser() user: AuthTokenPayload) {
    return this.approvalRequestsService.approve(id, input, user.sub);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() input: ReviewApprovalInput, @CurrentUser() user: AuthTokenPayload) {
    return this.approvalRequestsService.reject(id, input, user.sub);
  }
}
