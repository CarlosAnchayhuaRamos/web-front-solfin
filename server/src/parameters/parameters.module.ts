import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ParametersController } from './parameters.controller';
import { ParametersService } from './parameters.service';

@Module({
  controllers: [ParametersController],
  providers: [ParametersService, PrismaService],
})
export class ParametersModule {}
