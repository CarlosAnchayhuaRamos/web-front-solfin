import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApprovalRequestsModule } from './approval-requests/approval-requests.module';
import { AuthModule } from './auth/auth.module';
import { CashModule } from './cash/cash.module';
import { ClientsModule } from './clients/clients.module';
import { CreditsModule } from './credits/credits.module';
import { ParametersModule } from './parameters/parameters.module';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, CashModule, ClientsModule, CreditsModule, ApprovalRequestsModule, ParametersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
