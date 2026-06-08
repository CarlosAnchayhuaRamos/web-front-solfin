import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CashController } from './cash.controller';
import { CashService } from './cash.service';

@Module({
  controllers: [CashController],
  providers: [CashService, PrismaService],
})
export class CashModule {}
