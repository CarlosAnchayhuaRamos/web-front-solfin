import { createHmac, pbkdf2Sync, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUserDto, LoginInput, LoginResponse } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async login(input: LoginInput): Promise<LoginResponse> {
    const identifier = input.identifier?.trim().toLowerCase();

    if (!identifier || !input.password) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const users = await this.prisma.$queryRawUnsafe<Array<AuthUserDto & { passwordHash: string | null }>>(
      `
        SELECT id, dni, email, "fullName", role, "passwordHash"
        FROM app_users
        WHERE "isActive" = true AND (lower(email) = $1 OR dni = $2)
        ORDER BY
          CASE WHEN "passwordHash" IS NULL THEN 1 ELSE 0 END,
          "isActive" DESC,
          "updatedAt" DESC
        LIMIT 1
      `,
      identifier,
      identifier,
    );
    const user = users[0];

    if (!user?.passwordHash || !this.verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const authUser = {
      dni: user.dni,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      role: user.role,
    };

    return {
      token: this.signToken(authUser),
      user: authUser,
    };
  }

  private verifyPassword(password: string, storedHash: string) {
    const [, iterationsValue, salt, hash] = storedHash.split('$');
    const iterations = Number(iterationsValue);
    const candidate = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
    const stored = Buffer.from(hash, 'base64url');

    if (candidate.length !== stored.length) return false;
    return timingSafeEqual(candidate, stored);
  }

  private signToken(user: AuthUserDto) {
    const header = this.toBase64Url({ alg: 'HS256', typ: 'JWT' });
    const payload = this.toBase64Url({
      dni: user.dni,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      name: user.fullName,
      role: user.role,
      sub: user.id,
    });
    const signature = createHmac('sha256', this.getJwtSecret()).update(`${header}.${payload}`).digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  private toBase64Url(value: unknown) {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  }

  private getJwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return secret;
  }
}
