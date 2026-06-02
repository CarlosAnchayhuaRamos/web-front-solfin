# SOLFIN PERU

Monorepo base para la aplicacion operativa de SOLFIN PERU.

## Estructura

```text
solfin-peru/
  web/      Frontend React
  server/   Backend NestJS + Prisma
```

## Comandos

Frontend:

```bash
npm run start:web
npm run build:web
```

Backend:

```bash
npm run start:server
npm run build:server
```

Prisma:

```bash
npm run prisma:generate
npm run prisma:push
```

## Variables

El backend usa `server/.env` basado en `server/.env.example`.
