import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BootstrapAdminService } from './bootstrap-admin.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BootstrapAdminService, ConfigService],
})
export class AuthModule {}
