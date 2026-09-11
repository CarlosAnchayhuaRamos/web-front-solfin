import { Module } from '@nestjs/common';
import { CreditsController } from './credits.controller';
import { CreditsService } from './credits.service';
import { CreditReversalsService } from './credit-reversals.service';

@Module({
  controllers: [CreditsController],
  providers: [CreditsService, CreditReversalsService],
})
export class CreditsModule {}
