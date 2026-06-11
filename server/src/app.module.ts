import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApprovalRequestsModule } from './approval-requests/approval-requests.module';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/auth.guard';
import { CashModule } from './cash/cash.module';
import { ClientsModule } from './clients/clients.module';
import { CreditsModule } from './credits/credits.module';
import { ParametersModule } from './parameters/parameters.module';
import { PrismaService } from './prisma/prisma.service';
import { UsersModule } from './users/users.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, CashModule, ClientsModule, CreditsModule, ApprovalRequestsModule, ParametersModule, UsersModule],
  controllers: [AppController],
  providers: [AppService, PrismaService, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
