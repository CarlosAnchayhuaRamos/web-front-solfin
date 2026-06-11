import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/auth.decorators';
import { UsersService } from './users.service';
import type { CreateUserInput, UpdateUserInput } from './users.types';

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  create(@Body() input: CreateUserInput) {
    return this.usersService.create(input);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() input: UpdateUserInput) {
    return this.usersService.update(id, input);
  }
}
