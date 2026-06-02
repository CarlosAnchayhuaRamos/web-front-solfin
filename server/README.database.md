# Estructura de base de datos

Base propuesta para SOLFIN PERU usando PostgreSQL y Prisma. El archivo principal es `schema.prisma`.

## Modulos cubiertos

- `colaboradores`: `AppUser`, `Employee`, roles, estado y limite de aprobacion.
- `clientes`: `Client`, documentos asociados y estado comercial.
- `nuevo credito`: `CreditProduct`, `Credit`, `Collateral`, `PaymentSchedule`, `Payment`, `Document`.
- `solicitudes`: `ApprovalRequest` para creditos que superan el limite del analista.
- `parametros`: `CreditPolicy`, `CashPolicy`.
- `apertura cierre`: `CashBox`, `Vault`, `CashSession`, `CashMovement`.
- `reportes`: `ReportExport`.
- auditoria transversal: `AuditLog`, `CreditStatusHistory`.

## Integracion sugerida en backend

En un backend NestJS con Prisma, mueve o copia `database/schema.prisma` a `server/prisma/schema.prisma` y ejecuta:

```bash
npx prisma generate
npx prisma db push
```

## Decisiones principales

- Multiempresa por `Organization`, compatible con Clerk mediante `clerkOrganizationId`.
- `AppUser.id` usa el id de Clerk para evitar una tabla de mapeo adicional.
- Montos financieros usan `Decimal` con precision `14,2`.
- Los estados de credito estan normalizados en `CreditStatus` y el historial queda en `CreditStatusHistory`.
- Los archivos se guardan como metadata en `Document`; el contenido real vive en S3 o storage local via `storageKey`.
- Caja y boveda separan sesiones diarias (`CashSession`) de movimientos contables (`CashMovement`).
