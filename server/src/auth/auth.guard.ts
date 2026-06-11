import { createHmac, timingSafeEqual } from 'crypto';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, ROLES_KEY } from './auth.constants';
import type { AuthTokenPayload } from './auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request & { user?: AuthTokenPayload }>();
    const token = this.getBearerToken(request);
    const payload = this.verifyToken(token);
    const allowedRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);

    if (allowedRoles?.length && !allowedRoles.includes(payload.role)) {
      throw new UnauthorizedException('No autorizado');
    }

    request.user = payload;
    return true;
  }

  private getBearerToken(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token requerido');
    }

    return token;
  }

  private verifyToken(token: string) {
    const [header, payload, signature] = token.split('.');

    if (!header || !payload || !signature) {
      throw new UnauthorizedException('Token invalido');
    }

    const expected = createHmac('sha256', this.getJwtSecret()).update(`${header}.${payload}`).digest();
    const received = Buffer.from(signature, 'base64url');

    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      throw new UnauthorizedException('Token invalido');
    }

    try {
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AuthTokenPayload;

      if (!parsed.sub || !parsed.role || parsed.exp <= Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('Token expirado');
      }

      return parsed;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Token invalido');
    }
  }

  private getJwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is required');
    }

    return secret;
  }
}
