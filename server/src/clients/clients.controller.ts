import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ClientsService } from './clients.service';
import type { CreateClientInput, UpdateClientInput } from './clients.types';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  findAll() {
    return this.clientsService.findAll();
  }

  @Post()
  create(@Body() input: CreateClientInput) {
    return this.clientsService.create(input);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() input: UpdateClientInput) {
    return this.clientsService.update(id, input);
  }
}
