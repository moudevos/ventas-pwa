# AGENTS.md

## Proyecto

PWA Estados / PWA Ventas

Sistema web para gestión de pedidos, clientes, envíos, evidencias, usuarios, auditoría y eventos realtime.

## Stack oficial

* Next.js 16 App Router
* TypeScript
* Tailwind CSS
* Drizzle ORM
* Neon PostgreSQL
* Vercel
* JWT firmado con `jose`
* Cookie `httpOnly`
* `bcryptjs` para passwords
* `zod` para validación
* Pusher para realtime
* Vercel Blob o alternativa compatible para evidencias

## Prohibido

No usar:

* Firebase
* Firebase Auth
* Firestore
* Cloud Functions
* Data Connect
* Firebase Storage
* Prisma
* Supabase Auth
* localStorage para sesión real

## Principio principal

El frontend solo presenta datos y captura formularios.

Las reglas críticas viven en backend.

## Reglas de backend

Toda acción crítica debe:

1. Validar sesión.
2. Validar rol.
3. Validar payload con Zod.
4. Ejecutar operación en base de datos.
5. Registrar auditoría.
6. Devolver error controlado si falla.

## Auth

La autenticación usa:

* email/password
* bcryptjs
* JWT
* cookie httpOnly
* helper central para leer sesión
* guards por rol

El token nunca debe exponerse al cliente.

## Roles base

* admin
* promoter
* ops

Regla:

* admin puede todo.
* promoter puede crear clientes y pedidos.
* ops puede operar pedidos/envíos según reglas.
* cualquier endpoint sensible debe validar rol en backend.

## Estados de pedido

Estados válidos:

* REGISTERED
* PAYMENT_CONFIRMED
* SCHEDULED
* READY_TO_SHIP
* SHIPPED
* DELIVERED
* CLOSED
* OBSERVED
* CANCELLED

## Flujo operativo

1. Promotor registra cliente y prendas.
2. Pedido queda REGISTERED.
3. Se confirma pago de embalaje con evidencia.
4. Pasa a PAYMENT_CONFIRMED.
5. Se programa fecha de envío.
6. Pasa a SCHEDULED.
7. Se marca listo para envío.
8. Pasa a READY_TO_SHIP.
9. Se registra delivery/courier.
10. Pasa a SHIPPED.
11. Se marca entregado.
12. Pasa a DELIVERED.
13. Se cierra con confirmación o evidencia.
14. Pasa a CLOSED.

## Transiciones

Las transiciones deben validarse en `src/server/orders/rules.ts` o módulo equivalente.

No permitir transiciones libres desde frontend.

## Totales

El backend recalcula:

* subtotal por item
* total productos
* costo embalaje
* costo envío
* total final

No confiar en totales enviados por frontend.

## Auditoría

Registrar en `audit_logs`:

* login relevante si aplica
* creación de usuario
* reset de contraseña
* deshabilitar usuario
* creación de cliente
* creación de pedido
* cambio de estado
* subida de evidencia
* registro de envío
* cierre de pedido

## Historial de estado

Todo cambio de estado debe escribir en `order_status_history`.

Debe incluir:

* pedido
* estado anterior
* estado nuevo
* usuario
* comentario/motivo
* fecha

## Realtime

Usar Pusher para eventos realtime.

Eventos mínimos:

* order.created
* order.updated
* order.statusChanged
* order.evidenceUploaded
* order.shipmentRegistered

No implementar WebSocket propio dentro de Vercel Serverless.

## Base de datos

Usar Drizzle ORM con Neon PostgreSQL.

La fuente de verdad es PostgreSQL.

## Estructura esperada

src/
app/
api/
login/
dashboard/
pedidos/
envios/
reportes/
auditoria/
admin/
components/
lib/
server/
auth/
db/
orders/
validators/
realtime/
services/
types/

## Comandos de verificación

Antes de terminar cualquier tarea ejecutar:

npm run lint
npx tsc --noEmit
npm run build

Si hay cambios de base de datos:

npm run db:generate

## README

Mantener README.md actualizado.

Debe documentar:

* objetivo del sistema
* stack
* arquitectura
* módulos
* flujo de pedidos
* estados
* roles
* variables de entorno
* comandos
* migraciones
* seed
* ejecución local
* deploy en Vercel
* checklist QA
* pendientes técnicos

## Criterio de finalización

Una tarea no está terminada si:

* TypeScript falla.
* Build falla.
* Hay imports muertos.
* Hay endpoints sin validación.
* Hay reglas críticas en frontend.
* Hay referencias a Firebase.
* Hay referencias a Prisma.
* El README queda desactualizado.
