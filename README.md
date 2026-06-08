# PWA Estados / PWA Ventas

Sistema web para gestion de ventas, clientes, productos con stock, reservas, kardex, pedidos, envios, evidencias, usuarios, auditoria y eventos realtime.

El MVP usa Next.js 16 App Router con Route Handlers como backend. La sesion se firma con JWT y se guarda solo en cookie `httpOnly` (`sales_session`). Las reglas criticas de negocio viven en backend.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon PostgreSQL
- JWT `httpOnly` con `jose`
- `bcryptjs`
- `zod`
- Pusher realtime
- SweetAlert2
- lucide-react
- Vercel

Firebase fue descartado historicamente y no forma parte de la arquitectura actual.

## Arquitectura

```txt
src/
  app/
    (public)/login
    (public)/change-password
    (app)/dashboard
    (app)/orders
    (app)/shipping
    (app)/reports
    (app)/audit
    (app)/admin/users
    api/auth
    api/admin/users
    api/clients
    api/orders
    api/products
    api/audit
    api/pusher
  components/
  lib/
    alerts.ts
    api-client.ts
    order-status.ts
    pusher-client.ts
    validation.ts
  server/
    audit/
    auth/
    clients/
    db/
    http/
    orders/
    realtime/
    seed/
drizzle/
```

## Variables De Entorno

```env
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="replace-with-at-least-32-random-characters"

PUSHER_APP_ID=""
NEXT_PUBLIC_PUSHER_KEY=""
PUSHER_SECRET=""
NEXT_PUBLIC_PUSHER_CLUSTER=""

SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="Admin12345!"
SEED_ADMIN_NAME="Admin"

FORCE_SECURE_COOKIES="false"
UBIGEO_API_URL=""
```

En local HTTP la cookie no usa `Secure`. En Vercel/HTTPS se marca como segura.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run lint
npx tsc --noEmit
npm run db:generate
npm run db:push
npm run db:seed
npm run db:reset-seed
```

## Neon

1. Crear proyecto PostgreSQL en Neon.
2. Copiar connection string con SSL.
3. Guardarla como `DATABASE_URL`.
4. Aplicar schema:

```bash
npm run db:push
```

## Pusher

Configurar `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET` y `NEXT_PUBLIC_PUSHER_CLUSTER`.

Canales:

- `private-orders`
- `private-order-{orderId}`

Eventos usados:

- `order.created`
- `order.statusChanged`
- `order.evidenceUploaded`
- `order.shipmentRegistered`
- Eventos legacy de compatibilidad: `order-created`, `order-status-changed`, `order-evidence-created`, `order-shipment-updated`

Si Pusher no esta configurado, el dashboard usa polling cada 30 segundos.

## Seed

```bash
npm run db:seed
```

Admin inicial:

- Email: `admin@example.com`
- Password temporal: `Admin12345!`
- Rol: `admin`
- `mustChangePassword`: `true`

## Modulos

- Login: `/login`, endpoint `POST /api/auth/login`.
- Logout: `POST /api/auth/logout`.
- Sesion actual: `GET /api/auth/me`.
- Cambio obligatorio de contrasena: `/change-password`, endpoint `POST /api/auth/change-password`.
- Dashboard: `/dashboard`.
- Usuarios admin: `/admin/users`, endpoints `/api/admin/users`.
- Clientes: `/clients`, endpoints `/api/clients`, `/api/clients/find`, `/api/clients/upsert`.
- Productos: `/products`, endpoints `/api/products`.
- Pedidos: `/orders`, `/orders/new`, `/orders/[id]`.
- Envios: `/shipping`.
- Auditoria: `/audit`, endpoint `GET /api/audit` solo admin.

## Modelo De Stock

Cada producto/SKU representa una variante exacta de prenda. El stock se controla con:

- `stockOnHand`: stock fisico.
- `stockReserved`: stock reservado por pedidos.
- Stock disponible calculado: `stockOnHand - stockReserved`.

Al crear pedido, el backend reserva el disponible. Si no alcanza, registra `missingQuantity`, marca el pedido con `hasMissingProducts=true` y escribe movimiento `PENDING_PRODUCTION`.

Cuando el pedido pasa a listo para envio, la reserva se convierte en venta:

- `stockOnHand -= quantity`
- `stockReserved -= quantity`
- Kardex `OUT`

Si se cancela, se libera reserva con kardex `RELEASE`.

## Kardex

Tabla: `stock_movements`.

Tipos:

- `IN`
- `RESERVE`
- `RELEASE`
- `OUT`
- `ADJUSTMENT`
- `PENDING_PRODUCTION`

Endpoints:

- `GET /api/kardex?productId=&orderId=&movementType=`
- `GET /api/products/[id]/kardex`
- `POST /api/products/[id]/stock-in`
- `POST /api/products/[id]/adjust-stock`

## Flujo Real De Pedido

1. Registrar pedido
   - Se registra o actualiza cliente.
   - Se guarda `orderDetails`.
   - Se guarda `totalProductsAmount` y `totalOrderAmount`.
   - Estado inicial: `CREATED`.
   - Reserva stock disponible por item.
   - Registra faltantes de confeccion si no hay stock suficiente.

2. Registrar pago de productos y programar envio
   - Endpoint: `POST /api/orders/[id]/register-payment`.
   - Guarda `productPaymentAmount`, `productPaymentDate`, `productPaymentConfirmed=true`.
   - Guarda `productPaymentMethod`.
   - Cambia a `PAID`.

3. Alistar productos
   - Endpoints: `POST /api/orders/[id]/mark-products-incomplete` y `POST /api/orders/[id]/complete-products`.
   - Si hay faltantes, estado `PRODUCTS_INCOMPLETE`.
   - Si todos los items estan completos, estado `PRODUCTS_COMPLETE`.

4. Marcar listo para envio
   - Endpoint: `POST /api/orders/[id]/ready-to-ship`.
   - Exige todos los items completos.
   - Convierte reservas en salida vendida con kardex `OUT`.
   - Cambia a `READY_TO_SHIP`.

5. Registrar pago de embalaje
   - Endpoint: `POST /api/orders/[id]/register-packaging-payment`.
   - Guarda `packagingPaymentAmount`, `packagingPaymentMethod`, `packagingPaymentDate`, `packagingPaymentConfirmed=true`.
   - Cambia a `PACKAGING_PAID`.

6. Registrar envio
   - Endpoint: `POST /api/orders/[id]/ship`.
   - Exige `shippingType` y `providerName`.
   - Si `COURIER`, exige `trackingNumber`.
   - Si `MOTORIZED`, exige `deliveryOrderNumber`.
   - Guarda `shippedAt`.
   - Cambia a `SHIPPED`.

7. Cerrar pedido
   - Endpoint: `POST /api/orders/[id]/close`.
   - Exige `customerPickupConfirmed=true`.
   - Guarda `customerPickupConfirmedAt` y `closedAt`.
   - Cambia directo a `CLOSED`.

## Estados

Estados operativos principales:

- `REGISTERED`: Pedido registrado
- `CREATED`: Pedido creado
- `PAID`: Pedido pagado
- `PRODUCTS_INCOMPLETE`: Productos incompletos
- `PRODUCTS_COMPLETE`: Productos completos
- `READY_TO_SHIP`: Listo para enviar
- `PACKAGING_PAID`: Embalaje pagado
- `SHIPPED`: Enviado
- `CLOSED`: Pedido cerrado
- `OBSERVED`: Observado
- `CANCELLED`: Cancelado

Estados legacy en enum por compatibilidad:

- `PAYMENT_CONFIRMED`
- `SCHEDULED`
- `DELIVERED`

La UI no debe mostrar estados crudos.

## Reglas Backend

Las transiciones viven en `src/server/orders/rules.ts`.

No permitido:

- `REGISTERED -> READY_TO_SHIP`
- `REGISTERED -> SHIPPED`
- `PAID -> SHIPPED`
- `SHIPPED -> PAID`
- `CLOSED -> otro estado`
- Cerrar sin confirmar recepcion de cliente y entrega del proveedor

Todo cambio de estado pasa por `changeOrderStatus`, escribe `order_status_history`, audita y publica Pusher.

## Endpoints De Pedidos

- `GET /api/orders`
- `GET /api/orders?status=PAID`
- `POST /api/orders`
- `GET /api/orders/[id]`
- `POST /api/orders/[id]/register-payment`
- `POST /api/orders/[id]/register-product-payment`
- `POST /api/orders/[id]/mark-products-incomplete`
- `POST /api/orders/[id]/complete-products`
- `POST /api/orders/[id]/ready-to-ship`
- `POST /api/orders/[id]/register-packaging-payment`
- `POST /api/orders/[id]/mark-ready-to-ship`
- `POST /api/orders/[id]/ship`
- `POST /api/orders/[id]/close`
- `POST /api/orders/[id]/cancel`
- `POST /api/orders/[id]/evidence`

Endpoints legacy aun presentes por compatibilidad:

- `POST /api/orders/[id]/packaging-payment`
- `POST /api/orders/[id]/ready`
- `POST /api/orders/[id]/status`
- `POST /api/orders/[id]/transition`
- `POST /api/orders/[id]/schedule`
- `POST /api/orders/[id]/delivered`
- `POST /api/orders/[id]/deliver`

## Dashboard

El dashboard tiene dos paneles desplegables:

- Panel Ventas: ventas del dia, ventas de la semana, pedidos pagados, ticket promedio, total productos acumulado y cerrados.
- Panel Pedidos: total, registrados, pagados, listos para enviar, enviados, cerrados, observados y cancelados.

Tambien muestra proximos envios ordenados por fecha con indicador: vencido, hoy, 24h o programado.

## Roles

- `admin`: administra usuarios, ve auditoria y opera pedidos.
- `promoter`: crea clientes y pedidos, y opera el flujo comercial.

Pendiente: agregar rol `ops` si se requiere separar operaciones/logistica.

## Auditoria

Tabla: `audit_logs`.

Se registra:

- creacion y actualizacion de cliente
- creacion de pedido
- pago de productos
- pago de embalaje
- envio
- cierre
- cambios de estado
- evidencias
- acciones admin
- cambio de contrasena

## Checklist QA Manual

- [ ] Login con admin seed.
- [ ] Cambiar contrasena obligatoria.
- [ ] Crear usuario promotor.
- [ ] Crear pedido desde `/orders/new`.
- [ ] Ver pedido en `/orders`.
- [ ] Abrir detalle.
- [ ] Registrar pago de productos y fecha de envio.
- [ ] Confirmar estado `Pedido pagado`.
- [ ] Registrar pago de embalaje.
- [ ] Confirmar estado `Listo para enviar`.
- [ ] Registrar envio courier con tracking.
- [ ] Registrar envio motorizado con numero de envio.
- [ ] Cerrar pedido con ambas confirmaciones.
- [ ] Revisar timeline.
- [ ] Revisar dashboard.
- [ ] Revisar auditoria con admin.
- [ ] Validar actualizacion realtime o polling.

## Deploy Vercel

- [ ] Configurar variables de entorno.
- [ ] Ejecutar migraciones contra Neon.
- [ ] Ejecutar seed.
- [ ] Validar `npm run build`.
- [ ] Deploy.
- [ ] Probar cookie segura en HTTPS.
- [ ] Probar Pusher en produccion.

## Pendientes Tecnicos

- Ocultar opciones de sidebar segun rol.
- Pantallas reales de ventas/reportes avanzados.
- Storage real para evidencias con Vercel Blob o compatible.
- Integracion completa de API externa de ubigeo.
- Tests automatizados de reglas de transicion.
- Retirar endpoints legacy cuando no haya clientes antiguos usandolos.

## Canal Venta En Tienda

Ruta principal: `/sales`.

Ruta de historial: `/sales/history`.

La venta en tienda es un canal distinto al pedido web:

- No genera reserva.
- No tiene flujo de envio.
- Valida stock disponible antes de registrar.
- Descuenta `stockOnHand` inmediatamente.
- Registra kardex `OUT` con `sourceType=STORE_SALE`.
- Audita la venta y la salida de stock.
- Emite eventos realtime `sale.created`, `stock.updated` y `kardex.created`.

Cliente opcional:

- Si no se registra cliente, el backend usa/crea cliente generico.
- Cliente generico: `documentType=GENERIC`, `documentNumber=00000000`, `Cliente Generico`.

Endpoints de ventas:

- `GET /api/sales`
- `GET /api/sales/[id]`
- `POST /api/sales`
- `GET /api/sales/summary`

## Kardex Por Canal

`stock_movements` soporta:

- `sourceType`: `ORDER`, `STORE_SALE`, `MANUAL`, `PRODUCTION`
- `sourceId`: id del pedido, venta u origen relacionado

Filtros de kardex:

- `GET /api/kardex?productId=`
- `GET /api/kardex?sourceType=STORE_SALE`
- `GET /api/kardex?sourceId=`
- `GET /api/kardex?movementType=OUT`
- `GET /api/kardex?dateFrom=&dateTo=`

## Facturacion Electronica Futura

No hay integracion con SUNAT ni proveedor externo.

La tabla `sales` queda preparada con placeholders:

- `electronicInvoiceStatus`
- `electronicInvoiceType`
- `electronicInvoiceSeries`
- `electronicInvoiceNumber`
- `electronicInvoiceHash`
- `customerDocumentType`
- `customerDocumentNumber`
- `customerLegalName`
- `taxableAmount`
- `igvAmount`

Estados previstos:

- `PENDING`
- `NOT_REQUIRED`
- `READY`
- `SENT`
- `ACCEPTED`
- `REJECTED`
- `VOIDED`

TODO: integrar proveedor de facturacion electronica cuando el negocio lo defina.

## QA Venta En Tienda

- [ ] Crear producto con stock fisico.
- [ ] Ir a `/sales`.
- [ ] Buscar producto por SKU o descripcion.
- [ ] Agregar item, editar cantidad y precio.
- [ ] Registrar venta con medio de pago.
- [ ] Verificar que stock fisico disminuye.
- [ ] Verificar kardex `OUT` con `sourceType=STORE_SALE`.
- [ ] Revisar `/sales/history`.
- [ ] Confirmar estado de facturacion `NOT_REQUIRED` o `READY`.

## Alistado Parcial

En pedidos `PAID`, `PRODUCTS_INCOMPLETE` o `PRODUCTS_COMPLETE` existe accion "Alistar productos".

Endpoint:

- `POST /api/orders/[id]/prepare-products`

Reglas:

- No permite alistar mas que la cantidad solicitada.
- No permite alistar mas que la cantidad reservada.
- Guarda avance parcial por item en `fulfilledQuantity`.
- Recalcula `missingQuantity`.
- Si quedan pendientes, el pedido queda en `PRODUCTS_INCOMPLETE`.
- Si todos los items estan completos, pasa a `PRODUCTS_COMPLETE`.
- Audita cada cambio.
- Escribe timeline en `order_status_history`.
- Emite `order.updated` y `order.statusChanged`.

`READY_TO_SHIP` sigue siendo el punto donde la reserva se convierte en salida vendida `OUT`.

## Inventario Imprimible

Ruta:

- `/inventory`

Solo admin puede verla en el MVP actual.

Incluye:

- SKU
- descripcion
- stock fisico
- stock reservado
- stock disponible
- stock minimo
- ultima actualizacion
- columna de conteo manual
- columna de observaciones

Acciones:

- Imprimir inventario.
- Exportar CSV.

La vista incluye CSS para impresion con `@media print`.

## Stock Minimo

`products.minStock` define el umbral de stock bajo.

El dashboard marca stock bajo cuando:

```txt
stockOnHand - stockReserved <= minStock
```
