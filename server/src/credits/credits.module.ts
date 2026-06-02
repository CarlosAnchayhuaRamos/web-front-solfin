import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService, PrismaService],
})
export class CreditsModule {}
