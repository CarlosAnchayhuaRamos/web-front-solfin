import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/auth.decorators';
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
  approve(@Param('id') id: string, @Body() input: ReviewApprovalInput) {
    return this.approvalRequestsService.approve(id, input);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() input: ReviewApprovalInput) {
    return this.approvalRequestsService.reject(id, input);
  }
}
