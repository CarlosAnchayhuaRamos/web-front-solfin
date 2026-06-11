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

## Despliegue piloto economico

Arquitectura:

- Render Static Site Free para `web`.
- Render Web Service Free para `server`.
- Neon Free para PostgreSQL.

### 1. Crear PostgreSQL en Neon

1. Crea un proyecto Neon Free.
2. Copia la URL de conexion pooled.
3. Desde una maquina segura, aplica el esquema:

```bash
cd server
DATABASE_URL="<neon-pooled-url>" npx prisma db push
```

Neon Free duerme tras inactividad. Crea un snapshot manual antes de cambios de esquema.

### 2. Crear servicios en Render

1. Conecta este repositorio desde Render Blueprints.
2. Usa `render.yaml`.
3. Configura variables pendientes:
   - API: `DATABASE_URL`, `FRONTEND_URL`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME`.
   - Web: `REACT_APP_API_URL`.
4. Usa URL del sitio Render como `FRONTEND_URL`.
5. Usa URL publica de API Render como `REACT_APP_API_URL`.
6. Despliega API y web nuevamente despues de configurar URLs.

`JWT_SECRET` se genera automaticamente desde Blueprint. No lo reemplaces entre despliegues.

### 3. Cerrar bootstrap

1. Inicia sesion con administrador configurado.
2. Elimina `BOOTSTRAP_ADMIN_PASSWORD` del servicio API.
3. Despliega API nuevamente.

### Verificacion

- `GET <api-url>/health` responde `200`.
- Peticiones sin token a `/clients` responden `401`.
- Login administrador funciona.
- Recargar una ruta interna del frontend no responde `404`.
- Crear datos, reiniciar API y confirmar persistencia.

Render Free duerme tras 15 minutos sin trafico y puede tardar cerca de un minuto al despertar. No usar este stack para produccion financiera.
