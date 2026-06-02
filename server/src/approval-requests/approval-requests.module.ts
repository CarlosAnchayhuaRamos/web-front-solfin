import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalRequestsController } from './approval-requests.controller';
import { ApprovalRequestsService } from './approval-requests.service';

@Module({
  controllers: [ApprovalRequestsController],
  providers: [ApprovalRequestsService, PrismaService],
})
export class ApprovalRequestsModule {}
