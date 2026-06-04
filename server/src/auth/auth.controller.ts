import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { LoginInput } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() input: LoginInput) {
    return this.authService.login(input);
  }
}
