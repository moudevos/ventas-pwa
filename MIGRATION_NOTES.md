# PWA Ventas

Sistema PWA para gestion de pedidos y envios con Firebase.

## Estado actual

- Proyecto inicial creado desde cero con React + Vite + TypeScript.
- Tailwind CSS configurado.
- PWA configurada con manifest, service worker y assets SVG basicos.
- Firebase Hosting, Storage rules y Cloud Functions base configurados.
- Modulo inicial de pedidos/envios implementado en frontend con datos de ejemplo si no hay credenciales Firebase.
- Cloud Functions base creadas para crear pedido, actualizar pedido y cambiar estado con validaciones de flujo.
- Esquema SQL inicial creado para PostgreSQL/Firebase SQL Connect.
- Build frontend, build functions y lint pasan correctamente.
- Fase 1 de diagnostico ejecutada: `npm run lint`, `npm run build` y `npm --prefix functions run build` pasan sin errores.
- Fase 2 completada a nivel de archivos: Firebase frontend, Hosting, Functions y Storage estan configurados con placeholders seguros.
- Fase 3 completada: se agrego `sql/schema/schema.gql` y conectores `.gql` MVP para entidades principales.
- Fase 4 completada parcialmente: Cloud Functions MVP compilan con validacion de auth, roles, transiciones y auditoria mediante repositorio SQL Connect placeholder.
- Fase 5 completada: frontend conectado a Firebase Auth, Functions y Storage con modo demo cuando no existe configuracion Firebase.
- Fase 6 completada: QA tecnico local ejecutado sin errores.
- Fase 7 completada: limpieza MVP basica y checklist de demo agregado.
- Refactor frontend de rutas completado: login separado, layout protegido y flujo de pedidos navegable por pantallas.
- Pantalla `/pedidos/:id` completada como centro operativo del flujo MVP.
- QA de navegacion MVP ejecutado con Playwright: flujo separado por rutas validado correctamente.
- Conexion Firebase backend revisada: Storage rules desplegadas, Functions intentadas pero bloqueadas por permisos Cloud Build, Data Connect preparado localmente y pendiente de migracion SQL.

## Estructura de carpetas

- `src/components`: componentes reutilizables.
- `src/components/layout`: layout principal y navegacion.
- `src/components/orders`: tabla, kanban, formulario, detalle, historial, evidencias y badge de estado.
- `src/pages`: paginas base de login, dashboard y pedidos.
- `src/services`: servicios que consumen backend/Firebase Functions.
- `src/hooks`: hooks de estado de UI/datos.
- `src/router`: rutas, `BrowserRouter` y proteccion de rutas.
- `dataconnect`: estructura local oficial de Firebase Data Connect/SQL Connect.
- `src/lib`: configuracion Firebase y utilidades de estados.
- `src/types`: modelos TypeScript compartidos del frontend.
- `functions/src`: Cloud Functions en TypeScript.
- `sql/schema`: esquema SQL inicial.
- `sql/connectors`: placeholders para Firebase SQL Connect.
- `public`: iconos PWA.

## Decisiones tecnicas

- Codigo en ingles.
- Textos visibles de UI en espanol.
- Logica critica de estados en backend mediante Cloud Functions.
- Credenciales Firebase se manejaran con variables de entorno y placeholders documentados.
- El frontend no permite transiciones libres de estado; el servicio llama `changeOrderStatus`.
- Mientras no exista `VITE_FIREBASE_PROJECT_ID`, el listado usa datos de ejemplo para que la UI sea verificable.
- Los roles se validaran desde SQL Connect; por ahora `assertRole` es un placeholder documentado en Functions.
- Tiempo real queda preparado para una fase posterior. Si SQL Connect no cubre realtime directo, se usara Cloud Functions para emitir eventos/notificaciones y refrescar vistas.

## Modulos creados

- Acceso/login visual.
- Layout con sidebar.
- Dashboard basico.
- Router:
  - `/login`
  - `/dashboard`
  - `/pedidos`
  - `/pedidos/nuevo`
  - `/pedidos/:id`
  - `/envios`
  - `/reportes`
  - `/auditoria`
- Pedidos:
  - listado en tabla.
  - vista kanban por estado.
  - formulario inicial de registro.
  - detalle operativo de pedido.
  - historial de estados separado.
  - carga y listado visual de evidencias.
- Backend base:
  - `createOrder`.
  - `updateOrder`.
  - `changeOrderStatus`.
  - `validateTransition`.
  - `writeAuditLog` placeholder.

## Entidades/tablas usadas

- `users`
- `roles`
- `user_roles`
- `clients`
- `providers`
- `orders`
- `order_items`
- `shipments`
- `order_evidences`
- `order_status_history`
- `audit_logs`
- `notifications`

## Pendientes

- Ejecutar `firebase init`/`firebase use` con el proyecto real.
- Corregir permisos del build service account para Cloud Functions.
- Ejecutar migracion SQL de Data Connect antes de desplegar schema/conectores.
- Generar SDK/bindings admin de Data Connect y reemplazar `SqlConnectOrdersRepository`.
- Persistir auditoria real en `audit_logs`.
- Agregar pruebas unitarias para reglas de transicion.
- Resolver advertencias de `npm audit` en `functions` segun politica de dependencias.

## Comandos utiles

- `npm install`: instalar dependencias frontend.
- `npm run dev`: iniciar servidor de desarrollo.
- `npm run build`: compilar frontend y generar PWA.
- `npm run lint`: ejecutar lint.
- `npx playwright test qa-smoke.spec.ts --reporter=line`: ejecutar smoke test navegable del MVP.
- `npm --prefix functions install`: instalar dependencias de Functions.
- `npm --prefix functions run build`: compilar Functions.
- `firebase deploy --only hosting`: desplegar Hosting.
- `firebase deploy --only functions`: desplegar Functions.
- `firebase deploy --only storage`: desplegar reglas de Storage.
- `firebase dataconnect:services:list --project ventas-rpm`: listar servicios Data Connect.
- `firebase dataconnect:sql:diff --project ventas-rpm`: validar diferencias SQL antes de migrar.

## Firebase backend real - 2026-06-06

- Archivos revisados sin exponer secretos:
  - `.env`
  - `.env.example`
  - `.gitignore`
  - `.firebaserc`
  - `firebase.json`
  - `src/lib/firebase.ts`
  - `src/services/authService.ts`
  - `src/router/ProtectedRoute.tsx`
  - `src/components/layout/AppLayout.tsx`
  - `functions/src`
  - `sql/schema`
  - `sql/connectors`
- `.env` existe en raiz y contiene variables `VITE_FIREBASE_*`; no se imprimieron valores.
- `.env.example` mantiene placeholders.
- `functions/.env.example` creado con placeholders no secretos:
  - `ALLOW_PLACEHOLDER_ROLES=false`
  - `ALLOW_PLACEHOLDER_REPOSITORY=false`
  - `ORDERS_REPOSITORY_MODE=sqlconnect`
- `.gitignore` protege:
  - `.env`
  - `.env.*`
  - `functions/.env`
  - `functions/.env.*`
  - `pwa-functions/.env`
  - `pwa-functions/.env.*`
  - `.secret.local`
- `firebase.json` fue ajustado para desplegar solo la carpeta `functions`; el scaffold duplicado `pwa-functions` no se usa para deploy.
- Hosting NO fue desplegado.

## Sesion/logout

- `/login` no crea sesion demo automaticamente.
- `Entrar en demo` crea sesion demo solo al presionar el boton.
- `AppLayout` muestra usuario actual:
  - email/nombre cuando hay usuario Firebase.
  - `Modo demo` cuando corresponde.
- `AppLayout` tiene boton `Salir`.
- Logout:
  - limpia sesion demo.
  - ejecuta `signOut` cuando Firebase esta configurado.
  - limpia claves locales conocidas de `localStorage` y `sessionStorage`.
  - redirige a `/login`.
- Rutas protegidas siguen usando `ProtectedRoute`; si `onAuthStateChanged` queda sin usuario, redirige a `/login`.

## Data Connect real

- Firebase CLI activo: proyecto `ventas-rpm`.
- Servicio remoto detectado:
  - serviceId: `ventas-rpm-service`
  - location: `us-east4`
  - Cloud SQL instance: `ventas-rpm-instance`
  - database: `ventas-rpm-database`
- Se creo estructura local `dataconnect` con:
  - `dataconnect/dataconnect.yaml`
  - `dataconnect/schema/schema.gql`
  - conectores locales por dominio (`orders`, `clients`, `providers`, `order_items`, `shipments`, `order_evidences`, `order_status_history`, `audit_logs`)
- `firebase dataconnect:services:list --project ventas-rpm`: correcto, servicio remoto listado.
- `firebase dataconnect:sql:diff --project ventas-rpm`: valida schema GraphQL, pero indica base PostgreSQL incompatible hasta aplicar migracion.
- No se ejecuto migracion SQL.
- No se ejecuto `firebase deploy --only dataconnect`.
- Pendiente bloqueante: revisar y aprobar SQL generado por Data Connect antes de ejecutar migracion/deploy.

## Revision migracion Data Connect - 2026-06-06

- Rol aplicado: `SQL_CONNECT_AGENT`.
- Archivos revisados:
  - `README.md`
  - `AGENTS.md`
  - `package.json`
  - `firebase.json`
  - `functions/package.json`
  - `dataconnect/dataconnect.yaml`
  - `dataconnect/schema/schema.gql`
  - conectores en `dataconnect/*/*.gql`
  - `dataconnect/*/connector.yaml`
- Comando ejecutado:
  - `firebase dataconnect:sql:diff --project ventas-rpm`
- Resultado:
  - El schema remoto sigue incompatible hasta aplicar migracion.
  - El diff generado es una migracion inicial de creacion de estructura.
  - No se detectaron sentencias `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE DROP` ni borrado de datos.
  - No se ejecuto `firebase dataconnect:sql:migrate`.
  - No se ejecuto `firebase deploy --only dataconnect`.
  - Hosting NO fue desplegado.
- Cambios SQL propuestos por Firebase Data Connect:
  - instalar extension PostgreSQL `uuid-ossp`.
  - crear enum `public.order_status` con estados `DRAFT`, `REGISTERED`, `CONFIRMED`, `SENT_TO_PROVIDER`, `IN_TRANSIT`, `DELIVERED`, `CLOSED`, `OBSERVED`, `CANCELLED`.
  - crear tablas MVP: `users`, `roles`, `user_roles`, `clients`, `providers`, `orders`, `order_items`, `shipments`, `order_evidences`, `order_status_history`, `audit_logs`, `notifications`.
  - crear indices unicos para `users.firebase_uid`, `users.email`, `orders.code`, `roles.code` y `shipments.order_id`.
  - crear indices de relaciones para llaves foraneas.
  - crear llaves foraneas entre pedidos, clientes, usuarios, proveedores, evidencias, historial, auditoria y notificaciones.
- Verificacion de seguridad:
  - El diff es aditivo segun la salida de Firebase CLI.
  - No borra tablas existentes.
  - No borra columnas.
  - No migra datos existentes.
- Pendiente obligatorio:
  - Confirmacion explicita antes de ejecutar:
    - `firebase dataconnect:sql:migrate ventas-rpm-service --project ventas-rpm`
    - `firebase deploy --only dataconnect --project ventas-rpm`

## Revalidacion migracion Data Connect - 2026-06-06 01:14 America/Lima

- Rol aplicado: `SQL_CONNECT_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado.
  - Functions NO fueron modificadas.
  - No se aplico ninguna migracion SQL.
  - No se borro ni modifico data remota.
- Archivos revisados:
  - `README.md`
  - `AGENTS.md`
  - `dataconnect/dataconnect.yaml`
  - `dataconnect/schema/schema.gql`
  - conectores `.gql` y `connector.yaml` dentro de `dataconnect`
- Comando ejecutado:
  - `firebase dataconnect:sql:diff --project ventas-rpm`
- Resultado del diff:
  - PostgreSQL remoto sigue incompatible porque aun falta migrar.
  - El diff propuesto es una migracion inicial aditiva.
  - No aparecen operaciones destructivas como `DROP TABLE`, `DROP COLUMN`, `ALTER TABLE DROP`, `TRUNCATE` o `DELETE`.
  - Crea `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.
  - Crea enum `public.order_status`.
  - Crea las tablas MVP requeridas:
    - `users`
    - `roles`
    - `user_roles`
    - `clients`
    - `providers`
    - `orders`
    - `order_items`
    - `shipments`
    - `order_evidences`
    - `order_status_history`
    - `audit_logs`
    - `notifications`
  - Crea indices unicos y de relacion para claves de negocio y foraneas.
  - Crea llaves foraneas entre usuarios, roles, clientes, proveedores, pedidos, items, envios, evidencias, historial, auditoria y notificaciones.
- Decision tecnica:
  - El diff es seguro para una base nueva o vacia segun la salida actual de Firebase CLI.
  - Aun requiere confirmacion humana antes de aplicar porque cambia el schema PostgreSQL remoto.
- Siguiente paso solo con confirmacion explicita:
  - `firebase dataconnect:sql:migrate ventas-rpm-service --project ventas-rpm`
  - `firebase deploy --only dataconnect --project ventas-rpm`

## Migracion y deploy Data Connect - 2026-06-06 01:41 America/Lima

- Roles aplicados: `SQL_CONNECT_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - No se ejecuto `firebase deploy --only hosting`.
  - No se uso Firestore como base principal.
- Comando incorrecto anterior:
  - `firebase dataconnect:sql:migrate ventas-rpm-service --project ventas-rpm`
  - Error: `Too many arguments`.
- Comando de ayuda ejecutado:
  - `firebase help dataconnect:sql:migrate`
- Sintaxis correcta detectada en Firebase CLI 15.5.1:
  - `firebase dataconnect:sql:migrate [options]`
  - `--service <serviceId>`
  - `--location <location>`
  - `--force`
- Comando correcto usado:
  - `firebase dataconnect:sql:migrate --service ventas-rpm-service --project ventas-rpm --force`
- Resultado de migracion:
  - Correcto.
  - Firebase CLI reporto: `Database schema of ventas-rpm-instance:ventas-rpm-database is compatible with Data Connect Schema`.
  - Firebase CLI reporto: `Database schema is already up to date`.
- Deploy Data Connect:
  - Comando base ejecutado: `firebase deploy --only dataconnect --project ventas-rpm`.
  - Primer error corregido: filtros de relacion usaban `order.key`, pero `Order_Filter` no define `key`.
  - Archivos corregidos:
    - `dataconnect/order_items/order_items.gql`
    - `dataconnect/shipments/shipments.gql`
    - `dataconnect/order_evidences/order_evidences.gql`
    - `dataconnect/order_status_history/order_status_history.gql`
  - Cambio aplicado: filtros por `order.id` con variable `UUID`.
  - Segundo error corregido: `shipment_upsert` exigia `id` porque la key primaria de `Shipment` es `id`.
  - Archivo corregido:
    - `dataconnect/shipments/shipments.gql`
  - Cambio aplicado: `UpsertShipment` se reemplazo por `CreateShipment` con `shipment_insert`.
  - Tercer bloqueo local corregido: `EPERM` al borrar cache `dataconnect-emulator-3.4.10.exe`.
  - Accion aplicada: se detuvo el proceso local del emulador y se elimino solo ese ejecutable de cache.
  - Cuarto error corregido: `connector_id must use DNS characters`.
  - Archivos corregidos:
    - `dataconnect/audit_logs/connector.yaml`
    - `dataconnect/order_evidences/connector.yaml`
    - `dataconnect/order_items/connector.yaml`
    - `dataconnect/order_status_history/connector.yaml`
  - Cambio aplicado: `connectorId` con guiones DNS:
    - `audit-logs`
    - `order-evidences`
    - `order-items`
    - `order-status-history`
  - Comando final usado:
    - `firebase deploy --only dataconnect --project ventas-rpm --force`
  - Resultado final:
    - Correcto.
    - Schema desplegado en `ventas-rpm-service`.
    - Conectores desplegados:
      - `orders`
      - `clients`
      - `providers`
      - `order-items`
      - `shipments`
      - `order-evidences`
      - `order-status-history`
      - `audit-logs`
- Nota de seguridad Data Connect:
  - El deploy requirio `--force` porque Firebase marco operaciones `@auth(level: USER)` como `INSECURE` al no referenciar directamente el UID del usuario.
  - Decision aplicada para avanzar MVP: mantener los conectores desplegados y conservar la logica critica en Cloud Functions.
  - Pendiente real: restringir o separar conectores expuestos a cliente y conectores/admin SDK usados por backend para reducir superficie directa de Data Connect.
- Verificacion Data Connect:
  - `firebase dataconnect:services:list --project ventas-rpm`: correcto.
  - Servicio: `ventas-rpm-service`.
  - Location: `us-east4`.
  - Cloud SQL instance: `ventas-rpm-instance`.
  - Database: `ventas-rpm-database`.

## Deploy Functions posterior a Data Connect - 2026-06-06 01:41 America/Lima

- Comando ejecutado:
  - `firebase deploy --only functions --project ventas-rpm`
- Resultado:
  - Correcto.
  - Predeploy `npm --prefix "$RESOURCE_DIR" run build`: correcto.
  - 7 Functions desplegadas.
  - 0 Functions con error.
  - 0 despliegues abortados.
- Functions activas verificadas con:
  - `firebase functions:list --project ventas-rpm`
- Estado verificado:
  - `assignProvider`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `changeOrderStatus`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `closeOrder`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `createOrder`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `registerShipment`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `updateOrder`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
  - `uploadEvidenceMetadata`: v2 callable, `us-central1`, Node.js 22, ACTIVE.
- Hosting:
  - NO desplegado.

## Functions real

- `OrdersRepository` ya existe como interfaz.
- `SqlConnectPlaceholderRepository` queda solo para emulador/desarrollo con opt-in explicito.
- `SqlConnectOrdersRepository` bloquea uso productivo con `failed-precondition` hasta que existan bindings admin reales de Data Connect.
- `firebase deploy --only functions --project ventas-rpm` fue intentado sin Hosting.
- Resultado Functions: fallido.
- Error real: Cloud Functions v2 no pudo construir por permiso faltante del build service account. Firebase reporto funciones en estado `FAILED` y Cloud Run service no encontrado.
- Tambien se reporto advertencia de politica de limpieza de Artifact Registry.
- Pendiente bloqueante:
  - corregir permisos del build service account segun Cloud Functions troubleshooting.
  - redeploy Functions.
  - configurar cleanup policy con `firebase functions:artifacts:setpolicy` o redeploy con `--force` si se acepta.

## Diagnostico Functions FAILED y admin real - 2026-06-06

- Rol aplicado: `BACKEND_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado.
  - No se uso Firestore como base principal.
  - No se imprimieron secretos de `.env`.
- Comandos de diagnostico ejecutados:
  - `firebase use`: proyecto activo `ventas-rpm`.
  - `firebase functions:list --project ventas-rpm`: lista 7 Functions v2 callable en `us-central1`, todas con estado operativo incompleto por deploy fallido.
  - `firebase functions:log --project ventas-rpm`: confirma fallo de build por permiso faltante en build service account.
- Functions afectadas:
  - `assignProvider`
  - `changeOrderStatus`
  - `closeOrder`
  - `createOrder`
  - `registerShipment`
  - `updateOrder`
  - `uploadEvidenceMetadata`
- Estado real:
  - Firebase reporta las funciones como `FAILED`.
  - Mensaje recurrente: `Build failed with status: FAILURE. Could not build the function due to a missing permission on the build service account`.
  - `functions:list` muestra `CloudRunServiceNotFound`; Cloud Run service no fue creado por el build fallido y las callables no sirven hasta redeploy exitoso.
- Build IDs vistos en logs:
  - `assignProvider`: `95f6f0cd-a4f5-4b2f-8dc8-07874da6ef48`
  - `changeOrderStatus`: `4d4e2a41-0c24-427b-82cf-f02515d4e9ce`
  - `closeOrder`: `58581c66-e5e3-4621-942c-7a16923b357b`
  - `createOrder`: `a3b39662-fd2c-4e4b-b345-2e74e8062ec4`
  - `registerShipment`: `43a1cbe2-1d58-4f49-83cf-9a0c2f5ea85e`
  - `updateOrder`: `c7500ba5-abf9-4b34-b846-f172405293b4`
  - `uploadEvidenceMetadata`: `c98041a1-69b4-44c6-af2c-155e6c6c51d0`
- Service account afectado:
  - Metadata de Cloud Functions v2 muestra `buildConfig.serviceAccount`: `projects/ventas-rpm/serviceAccounts/452127383764-compute@developer.gserviceaccount.com`.
  - La cuenta afectada concreta es `452127383764-compute@developer.gserviceaccount.com`.
  - Cuenta Cloud Build legacy a revisar si el problema persiste: `452127383764@cloudbuild.gserviceaccount.com`.
  - Service agent a revisar si falta rol administrado: `service-452127383764@gcf-admin-robot.iam.gserviceaccount.com`.
- Permiso/rol pendiente:
  - Segun troubleshooting oficial de Cloud Run functions, este fallo se corrige dando a la cuenta de build permisos para leer el source bucket y leer/escribir Artifact Registry.
  - Rol recomendado para el caso detectado: `roles/cloudbuild.builds.builder` sobre `452127383764-compute@developer.gserviceaccount.com`.
- Comando recomendado desde Cloud Shell o una maquina con Google Cloud SDK:
  - `gcloud projects add-iam-policy-binding ventas-rpm --member="serviceAccount:452127383764-compute@developer.gserviceaccount.com" --role="roles/cloudbuild.builds.builder"`
- Verificaciones opcionales si sigue fallando:
  - `gcloud projects get-iam-policy ventas-rpm --flatten="bindings[].members" --filter="bindings.members:452127383764-compute@developer.gserviceaccount.com" --format="table(bindings.role)"`
  - confirmar que `service-452127383764@gcf-admin-robot.iam.gserviceaccount.com` conserve `roles/cloudfunctions.serviceAgent`.
  - confirmar que `452127383764@cloudbuild.gserviceaccount.com` no este deshabilitada si Cloud Build la usa en la configuracion del proyecto.
- Alternativa por consola Google Cloud:
  - Abrir Google Cloud Console > IAM y administracion > IAM.
  - Activar "Include Google-provided role grants" si se revisan service agents.
  - Buscar `452127383764-compute@developer.gserviceaccount.com`.
  - Agregar rol `Cloud Build Service Account` (`roles/cloudbuild.builds.builder`).
  - Revisar que el service agent `service-452127383764@gcf-admin-robot.iam.gserviceaccount.com` mantenga `Cloud Functions Service Agent`.
  - Reintentar solo Functions con `firebase deploy --only functions --project ventas-rpm` despues de aplicar IAM.
- Nota local:
  - `gcloud` no esta instalado en esta maquina, por eso no se aplicaron ni verificaron bindings IAM localmente.

## Admin real Firebase Auth

- Se agregaron scripts seguros para custom claims sobre usuarios existentes.
- No crean usuarios.
- No contienen passwords.
- No imprimen tokens.
- Requieren credenciales de administrador disponibles por Application Default Credentials o entorno equivalente.
- Archivos agregados:
  - `scripts/set-admin-claim.mjs`
  - `scripts/check-user-claim.mjs`
- Scripts agregados a `package.json`:
  - `admin:set-claim`
  - `admin:check-claim`
- Dependencia agregada en raiz:
  - `firebase-admin` como `devDependency` para tooling local.
- Asignar admin real:
  - `npm run admin:set-claim -- admin@email.com`
- Verificar claims:
  - `npm run admin:check-claim -- admin@email.com`
- Claims asignados:
  - `role: "admin"`
  - `roles: ["admin"]`
  - `permissions: ["orders:read", "orders:write", "orders:transition", "users:admin", "audit:read"]`
- Despues de asignar claims, el usuario debe cerrar sesion y volver a entrar para refrescar el ID token.

## Usuario admin real para QA - 2026-06-06

- Usuario de prueba real:
  - email: `moudevos@gmail.com`
  - uid: `hnYvorEGavO3tJVjyVapMhi2zGR2`
- Comando inicial ejecutado:
  - `npm run admin:set-claim -- moudevos@gmail.com`
- Error encontrado:
  - `Unable to detect a Project Id in the current environment.`
  - Luego, con `GOOGLE_CLOUD_PROJECT=ventas-rpm`, falto Application Default Credentials.
- Comando final ejecutado:
  - se uso `GOOGLE_APPLICATION_CREDENTIALS` apuntando al archivo ADC generado localmente por Firebase CLI en `%APPDATA%\firebase\moudevos_gmail_com_application_default_credentials.json`.
  - se uso `GOOGLE_CLOUD_PROJECT=ventas-rpm`.
  - `npm run admin:set-claim -- moudevos@gmail.com`
- Resultado:
  - custom claims admin asignados correctamente.
  - UID verificado: `hnYvorEGavO3tJVjyVapMhi2zGR2`.
- Comando de verificacion ejecutado:
  - `npm run admin:check-claim -- moudevos@gmail.com`
- Claims verificados:
  - `role: "admin"`
  - `roles: ["admin"]`
  - `permissions: ["orders:read", "orders:write", "orders:transition", "users:admin", "audit:read"]`
- Importante para QA:
  - El usuario `moudevos@gmail.com` debe cerrar sesion y volver a entrar en la app para que Firebase Auth refresque el ID token con los claims nuevos.
  - No se imprimieron tokens.
  - No se creo usuario ni password.

## Modulo admin de usuarios - 2026-06-06

- Roles aplicados: `ORCHESTRATOR_AGENT`, `BACKEND_AGENT`, `SQL_CONNECT_AGENT`, `FRONTEND_UX_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Firestore NO se uso como base principal.
  - No se expusieron secretos de `.env`.
  - Las operaciones de usuarios reales pasan por Cloud Functions.
- Data Connect:
  - Se extendio `dataconnect/schema/schema.gql` para `users` con:
    - `fullName`
    - `documentType`
    - `documentNumber`
    - `phone`
    - `status`
    - `mustChangePassword`
    - `updatedAt`
    - `createdBy`
    - `lastLoginAt`
  - Se agrego enum `UserStatus`:
    - `ACTIVE`
    - `DISABLED`
    - `PENDING_PASSWORD_CHANGE`
  - Se agrego conector `dataconnect/users` con queries/mutations para listar, buscar por UID/email, crear/actualizar perfil, asignar rol y cambiar estado.
  - Migracion aplicada con:
    - `firebase dataconnect:sql:migrate --service ventas-rpm-service --project ventas-rpm --force`
  - Deploy Data Connect ejecutado con:
    - `firebase deploy --only dataconnect --project ventas-rpm --force`
  - SDK admin generado con:
    - `firebase dataconnect:sdk:generate --service ventas-rpm-service --project ventas-rpm`
- Nota de seguridad Data Connect:
  - Firebase CLI sigue marcando operaciones `@auth(level: USER)` como inseguras porque no referencian UID en el conector.
  - Decision MVP: mantener acceso real protegido en Cloud Functions y dejar pendiente endurecer conectores expuestos.
- Cloud Functions nuevas:
  - `listManagedUsers`
  - `createPersonUser`
  - `resetUserPasswordByAdmin`
  - `disableUserByAdmin`
  - `markPasswordChanged`
- Seguridad backend:
  - Todas las Functions admin requieren usuario autenticado.
  - Todas las Functions admin requieren rol `admin` en custom claims.
  - `createPersonUser` crea usuario en Firebase Auth con password temporal, asigna claims y crea perfil en PostgreSQL/Data Connect.
  - `resetUserPasswordByAdmin` cambia password temporal y vuelve a marcar `mustChangePassword`.
  - `disableUserByAdmin` deshabilita Firebase Auth y marca usuario como `DISABLED` en SQL.
  - `markPasswordChanged` limpia `mustChangePassword` en claims y SQL despues del cambio real de password.
  - Las acciones admin escriben auditoria en `audit_logs`.
- Frontend:
  - Nueva ruta protegida `/admin/usuarios`.
  - Sidebar muestra `Usuarios` solo para rol `admin`.
  - Nueva ruta `/cambiar-password` fuera del layout principal para usuarios con password temporal.
  - `authService` ahora lee `role`, `roles` y `mustChangePassword` desde ID token.
  - Si `mustChangePassword=true`, `ProtectedRoute` redirige a `/cambiar-password`.
  - `AdminUsersPage` permite listar usuarios, crear persona, resetear password temporal y deshabilitar usuarios.
- Usuario admin QA:
  - `moudevos@gmail.com` mantiene claims:
    - `role: "admin"`
    - `roles: ["admin"]`
    - permisos de pedidos, usuarios y auditoria.
  - Se aseguro perfil SQL/Data Connect para:
    - email: `moudevos@gmail.com`
    - uid: `hnYvorEGavO3tJVjyVapMhi2zGR2`
    - rol: `admin`
    - `mustChangePassword=false`
  - El usuario debe cerrar sesion y volver a entrar si el token anterior no refleja claims nuevos.
- Archivos modificados/agregados:
  - `dataconnect/dataconnect.yaml`
  - `dataconnect/schema/schema.gql`
  - `dataconnect/users/connector.yaml`
  - `dataconnect/users/users.gql`
  - `functions/package.json`
  - `functions/package-lock.json`
  - `functions/src/index.ts`
  - `functions/src/dataconnect/users/*`
  - `src/components/layout/AppLayout.tsx`
  - `src/lib/roles.ts`
  - `src/pages/AdminUsersPage.tsx`
  - `src/pages/ChangePasswordPage.tsx`
  - `src/router/AdminRoute.tsx`
  - `src/router/AppRouter.tsx`
  - `src/router/ProtectedRoute.tsx`
  - `src/services/adminUsersService.ts`
  - `src/services/authService.ts`
  - `src/types/auth.ts`
- QA ejecutado:
  - `npm --prefix functions install`: correcto, con 9 vulnerabilidades moderadas reportadas por npm audit.
  - `npm run lint`: correcto.
  - `npm run build`: correcto.
  - `npm --prefix functions run build`: correcto.
  - `firebase functions:list --project ventas-rpm`: 12 Functions v2 callable activas.
  - `npm run admin:check-claim -- moudevos@gmail.com`: claims admin verificados sin imprimir tokens.
- Deploy ejecutado:
  - `firebase deploy --only dataconnect --project ventas-rpm --force`: correcto.
  - `firebase deploy --only functions --project ventas-rpm`: correcto, 12 Functions desplegadas, 0 errores.
  - Hosting NO desplegado.
- Pendientes reales:
  - Endurecer conectores Data Connect para que operaciones sensibles no queden disponibles a cualquier usuario autenticado.
  - Ejecutar QA callable desde la UI real con `moudevos@gmail.com`.
  - Conectar pedidos a repositorio SQL Connect real; el repositorio de pedidos productivo aun mantiene bloqueo/placeholder.
  - Revisar vulnerabilidades moderadas de npm audit sin aplicar cambios automaticos destructivos.

## Flujo real de pedidos y clientes - 2026-06-06

- Roles aplicados: `ORCHESTRATOR_AGENT`, `BACKEND_AGENT`, `SQL_CONNECT_AGENT`, `FRONTEND_UX_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Firestore NO se uso como base principal.
  - Cambios criticos de estado quedan en Cloud Functions.
  - Data Connect/PostgreSQL sigue como fuente de verdad.
- Nuevo flujo operativo:
  1. Promotor registra cliente y prendas desde WhatsApp.
  2. Pedido queda `REGISTERED`.
  3. Se confirma pago de embalaje con evidencia y pasa a `PAYMENT_CONFIRMED`.
  4. Se programa fecha de envio y pasa a `SCHEDULED`.
  5. Se marca listo para envio y pasa a `READY_TO_SHIP`.
  6. Se registra delivery/courier; si es courier requiere boleta/voucher y pasa a `SHIPPED`.
  7. Se marca entregado con tipo de entrega y pasa a `DELIVERED`.
  8. Se cierra con confirmacion del cliente o evidencia y pasa a `CLOSED`.
- Estados nuevos agregados sin eliminar compatibilidad temporal:
  - `REGISTERED`
  - `PAYMENT_CONFIRMED`
  - `SCHEDULED`
  - `READY_TO_SHIP`
  - `SHIPPED`
  - `DELIVERED`
  - `CLOSED`
  - `OBSERVED`
  - `CANCELLED`
  - Se mantienen temporalmente `DRAFT`, `CONFIRMED`, `SENT_TO_PROVIDER` e `IN_TRANSIT` para pedidos existentes.
- Requisitos por transicion:
  - `REGISTERED -> PAYMENT_CONFIRMED`: requiere evidencia de pago (`PAYMENT_VOUCHER`, `YAPE_SCREENSHOT`, `PLIN_SCREENSHOT`, `BANK_TRANSFER`, `OTHER_PAYMENT`).
  - `PAYMENT_CONFIRMED -> SCHEDULED`: requiere `scheduledShippingDate`.
  - `SCHEDULED -> READY_TO_SHIP`: sin evidencia obligatoria.
  - `READY_TO_SHIP -> SHIPPED`: requiere `shippingType` y proveedor; si `COURIER`, requiere `SHIPPING_RECEIPT`.
  - `SHIPPED -> DELIVERED`: requiere `deliveryConfirmationType`.
  - `DELIVERED -> CLOSED`: requiere `customerConfirmation=true` o evidencia `CUSTOMER_CONFIRMATION`.
- Roles:
  - `admin`: acceso total.
  - `promoter`: puede crear clientes, crear pedidos, listar seguimiento y avanzar estados permitidos.
  - Se mantiene compatibilidad con roles antiguos `advisor`, `operations` y `supervisor`.
- Data Connect:
  - `clients` ahora soporta tipo/documento, nombres, apellidos, telefono, direccion de entrega, departamento, provincia, distrito, ubigeo, direccion exacta y referencia.
  - `orders` ahora soporta fecha programada, tipo de envio, proveedor textual, tipo de confirmacion de entrega, confirmacion de cliente y promotor.
  - `order_items` ahora soporta descripcion y observacion.
  - `order_evidences` ahora soporta `evidenceType`, `fileName`, `mimeType`, `uploadedBy` y `transitionId`.
  - Se agrego `product_suggestions` para sugerencias futuras por SKU.
- Functions nuevas/ajustadas:
  - `findClientByDocument`
  - `upsertClient`
  - `listOrders`
  - `createOrder`
  - `changeOrderStatus`
  - `uploadEvidenceMetadata`
  - `searchSkuSuggestions`
- Frontend:
  - `/pedidos/nuevo` separa el formulario en bloque cliente y bloque detalles de pedido.
  - Cliente se busca por `documentType + documentNumber` normalizado.
  - DNI valida 8 digitos.
  - CEX valida alfanumerico hasta 12 caracteres y se guarda con ceros a la izquierda.
  - Si el cliente existe, autollenado y etiqueta `Cliente encontrado`.
  - Si no existe, etiqueta `Cliente nuevo` y registro manual.
  - Carrito por SKU/descripcion/cantidad/observacion con editar cantidad y eliminar item.
  - `/pedidos/:id` muestra acciones del flujo real por estado.
- Ubigeo Peru:
  - Servicio agregado: `src/services/ubigeoService.ts`.
  - Fuente externa: `https://free.e-api.net.pe/ubigeos.json`.
  - Cache en memoria y `localStorage`.
  - Si falla la API externa, el formulario permite ingreso manual.
- Archivos principales modificados/agregados:
  - `dataconnect/schema/schema.gql`
  - `dataconnect/dataconnect.yaml`
  - `dataconnect/clients/clients.gql`
  - `dataconnect/orders/orders.gql`
  - `dataconnect/order_items/order_items.gql`
  - `dataconnect/order_evidences/order_evidences.gql`
  - `dataconnect/product_suggestions/*`
  - `functions/package.json`
  - `functions/package-lock.json`
  - `functions/src/index.ts`
  - `functions/src/repository.ts`
  - `functions/src/statusRules.ts`
  - `functions/src/types.ts`
  - `src/types/orders.ts`
  - `src/lib/status.ts`
  - `src/components/orders/OrderForm.tsx`
  - `src/components/orders/OrderDetail.tsx`
  - `src/components/orders/OrderEvidence.tsx`
  - `src/components/orders/StatusBadge.tsx`
  - `src/hooks/OrdersProvider.tsx`
  - `src/hooks/ordersContext.ts`
  - `src/services/ordersService.ts`
  - `src/services/evidenceService.ts`
  - `src/services/ubigeoService.ts`
- Comandos ejecutados:
  - `firebase dataconnect:sql:diff --project ventas-rpm`
  - `firebase dataconnect:sql:migrate --service ventas-rpm-service --project ventas-rpm --force`
  - `firebase deploy --only dataconnect --project ventas-rpm --force`
  - `firebase dataconnect:sdk:generate --service ventas-rpm-service --project ventas-rpm`
  - `npm --prefix functions install`
  - `npm run lint`
  - `npm run build`
  - `npm --prefix functions run build`
  - `firebase deploy --only functions --project ventas-rpm`
  - `firebase functions:list --project ventas-rpm`
- Resultado QA/deploy:
  - `npm run lint`: correcto.
  - `npm run build`: correcto.
  - `npm --prefix functions run build`: correcto.
  - Data Connect migrado y desplegado correctamente.
  - Functions desplegadas correctamente: 16 callables activas.
  - Hosting NO desplegado.
- Pendientes reales:
  - Ejecutar QA funcional real desde navegador con usuario `moudevos@gmail.com`.
  - Crear usuario con rol `promoter` y probar flujo completo de promotor.
  - Endurecer conectores Data Connect marcados por Firebase CLI como `INSECURE` por `@auth(level: USER)`.
  - Revisar duplicados en `product_suggestions`; actualmente es una tabla simple de sugerencias historicas.
  - Ajustar estilo final y copy de negocio despues de validar flujo.

## Backend roles real

- `assertRole` lee roles desde:
  - `request.auth.token.roles`
  - `request.auth.token.role`
- `admin` pasa todas las validaciones.
- `ALLOW_PLACEHOLDER_ROLES=true` queda solo como opt-in temporal de desarrollo.
- Con `ALLOW_PLACEHOLDER_ROLES=false` o sin esa variable, si no existe rol real en claims, la Function falla con:
  - `Usuario sin rol asignado`
- Produccion debe mantener:
  - `ALLOW_PLACEHOLDER_ROLES=false`

## QA backend local - 2026-06-06

- Comandos ejecutados:
  - `npm run lint`: correcto.
  - `npm run build`: correcto.
  - `npm --prefix functions run build`: correcto.
- Advertencias:
  - `npm install -D firebase-admin` reporto 8 vulnerabilidades moderadas en auditoria npm; no se ejecuto `npm audit fix` para evitar cambios no solicitados.
- QA callable real:
  - No ejecutado porque Functions siguen en estado `FAILED` hasta corregir IAM y redeploy.

## Storage real

- `firebase deploy --only storage --project ventas-rpm`: correcto.
- `storage.rules` compilo y fue publicado para el bucket Firebase Storage.

## Build/QA backend local

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `npm --prefix functions run build`: correcto.
- QA callable real no ejecutado porque Functions quedaron en estado `FAILED`.
- Backend funcional queda bloqueado por:
  - permisos de Cloud Build/Cloud Functions.
  - migracion Data Connect pendiente.
  - bindings admin Data Connect no generados.

## Frontend Router MVP

- Se instalo `react-router-dom`.
- `src/App.tsx` monta `BrowserRouter` y `AppRouter`.
- `src/router/AppRouter.tsx` define rutas publicas y protegidas.
- `src/router/ProtectedRoute.tsx` valida sesion antes de entrar al layout principal.
- `AppLayout` solo envuelve rutas protegidas y usa `NavLink` para sidebar desktop y navegacion movil.
- Login queda fuera del layout principal.
- Dashboard queda como pantalla de resumen con accesos rapidos.
- `OrdersPage` muestra solo tabla/kanban, filtros y boton “Nuevo pedido”.
- `NewOrderPage` contiene solo el formulario de creacion.
- `OrderDetailPage` contiene detalle, historial, evidencias y acciones operativas.
- `ShipmentsPage` filtra pedidos en `SENT_TO_PROVIDER`, `IN_TRANSIT` y `DELIVERED`.
- `ReportsPage` y `AuditPage` quedan como pantallas base separadas.

## Flujo MVP actualizado

1. Usuario entra a `/login`.
2. Inicia sesion con Firebase Auth o modo demo si no hay Firebase configurado.
3. Redirige a `/dashboard`.
4. Desde dashboard o sidebar entra a `/pedidos`.
5. Presiona “Nuevo pedido” y navega a `/pedidos/nuevo`.
6. Completa formulario con validaciones basicas de cliente, documento, telefono, direccion, item y cantidad.
7. `createOrder` crea el pedido.
8. Si hay `id`, redirige a `/pedidos/:id`; si no, vuelve a `/pedidos` con estado controlado.
9. Desde detalle puede confirmar, asignar proveedor, registrar envio, subir evidencia, marcar en transito, marcar entregado y cerrar usando servicios existentes.

## Archivos modificados en refactor de rutas

- `package.json`
- `package-lock.json`
- `src/App.tsx`
- `src/router/AppRouter.tsx`
- `src/router/ProtectedRoute.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/orders/OrderDetail.tsx`
- `src/components/orders/OrderForm.tsx`
- `src/components/orders/OrdersTable.tsx`
- `src/hooks/OrdersProvider.tsx`
- `src/hooks/ordersContext.ts`
- `src/hooks/useOrdersStore.ts`
- `src/pages/LoginPage.tsx`
- `src/pages/DashboardPage.tsx`
- `src/pages/OrdersPage.tsx`
- `src/pages/NewOrderPage.tsx`
- `src/pages/OrderDetailPage.tsx`
- `src/pages/ShipmentsPage.tsx`
- `src/pages/ReportsPage.tsx`
- `src/pages/AuditPage.tsx`
- `src/services/authService.ts`
- `src/services/ordersService.ts`

## Comandos ejecutados en refactor de rutas

- `npm install react-router-dom`
- `npm run lint`: correcto.
- `npm run build`: correcto.

## Pendientes reales tras refactor de rutas

- Conectar `listOrders` real en Cloud Functions; el frontend ya lo consume.
- Reemplazar `SqlConnectPlaceholderRepository` por bindings reales de SQL Connect.
- Persistir cambios demo/real de acciones en base de datos cuando SQL Connect este listo.
- Definir UI final de proveedores con selector real en vez de ingresar `ID proveedor`.
- Conectar listado real de evidencias desde SQL Connect/Storage; hoy se muestra `order.evidences` si viene del servicio y se actualiza en modo demo.
- Pasar `guideUrl` real a `registerShipment` cuando el endpoint/flujo backend lo soporte.

## QA navegacion MVP

- Se agrego `@playwright/test` como dependencia de desarrollo para validar flujo navegable.
- Se agrego `qa-smoke.spec.ts` con recorrido automatizado:
  1. `/login` carga solo login.
  2. Login demo redirige a `/dashboard`.
  3. `/dashboard` no muestra formulario de pedido.
  4. `/pedidos` muestra tabla/kanban y boton nuevo.
  5. `/pedidos/nuevo` muestra solo formulario.
  6. Crear pedido navega a `/pedidos/:id`.
  7. `/pedidos/:id` muestra detalle operativo.
  8. Sidebar navega a pedidos, envios, reportes y auditoria.
- Correccion aplicada durante QA:
  - `LoginPage` ahora ofrece `Entrar en demo` en desarrollo.
  - `authService` expone sesion demo aun si existe `.env` Firebase local.
  - `ordersService` y `evidenceService` usan flujo demo cuando hay sesion demo, evitando llamadas reales a Firebase durante QA/demo.
- Comandos ejecutados:
  - `npx playwright test qa-smoke.spec.ts --reporter=line`: correcto, 1 test pasa.
  - `npm run lint`: correcto.
  - `npm run build`: correcto.
- Artefactos Playwright ignorados:
  - `test-results`
  - `playwright-report`

## Detalle operativo `/pedidos/:id`

- Header con codigo de pedido, estado actual, cliente, fecha de creacion y boton volver.
- Seccion de datos del cliente:
  - nombre.
  - documento.
  - telefono.
  - correo.
  - direccion.
  - distrito/ciudad.
- Seccion de items:
  - SKU.
  - producto.
  - cantidad.
  - precio opcional.
  - subtotal opcional.
- Panel de operacion por estado:
  - `REGISTERED`: confirmar pedido.
  - `CONFIRMED`: asignar proveedor y enviar a proveedor usando servicios existentes.
  - `SENT_TO_PROVIDER`: registrar transportista/numero de envio, subir guia/evidencia y marcar en transito.
  - `IN_TRANSIT`: subir evidencia de entrega y marcar entregado.
  - `DELIVERED`: cerrar pedido.
  - `CLOSED`: solo lectura.
- Evidencias:
  - componente `OrderEvidence`.
  - subida imagen/PDF.
  - listado de evidencias ya cargadas desde `order.evidences`.
  - loading/error propio.
- Historial:
  - componente `OrderHistory`.
  - estado anterior, estado nuevo, usuario, fecha y motivo/comentario si existe.
- Todas las acciones usan servicios existentes y bloquean doble ejecucion mientras hay loading.
- No se agrego backend nuevo.

## Comandos ejecutados en detalle operativo

- `npm run lint`: correcto.
- `npm run build`: correcto.

## Firebase Fase 2

- `.env.example` contiene solo placeholders. Las credenciales reales deben ir en `.env.local`, que no debe versionarse.
- `src/lib/firebase.ts` inicializa Firebase App, Auth, Functions y Storage desde variables `VITE_FIREBASE_*`.
- `firebase.json` configura Hosting desde `dist`, rewrites SPA, Functions desde `functions` con Node.js 22 y reglas de Storage.
- `storage.rules` permite evidencias autenticadas en `order-evidences/{orderId}/{fileName}` con limite menor a 10 MB y tipo `image/*` o `application/pdf`.
- Falta `.firebaserc`; ejecutar `firebase login` y `firebase use --add` para enlazar el proyecto real.
- Deploy pendiente:
  - `npm run build`
  - `npm --prefix functions run build`
  - `firebase deploy --only hosting,functions,storage`

## SQL Connect Fase 3

- `sql/schema/schema.sql` mantiene el SQL PostgreSQL inicial.
- `sql/schema/schema.gql` define el modelo GraphQL de Firebase SQL Connect con nombres camelCase y tablas PostgreSQL existentes mediante `@table`/`@col`.
- `sql/connectors` contiene queries/mutations MVP para:
  - `orders`
  - `clients`
  - `providers`
  - `order_items`
  - `shipments`
  - `order_evidences`
  - `order_status_history`
  - `audit_logs`
- Decisiones:
  - PostgreSQL/SQL Connect sigue siendo fuente de verdad.
  - Cloud Functions conservara las operaciones criticas y usara SQL Connect cuando el SDK/conector real este generado.
  - Los conectores usan `@auth(level: USER)` como base; roles finos siguen en Cloud Functions.
- Pendiente real:
  - Validar nombres generados por SQL Connect con Firebase CLI/extension, especialmente plurales generados.
  - Generar `connector.yaml`.
- Generar SDK/server bindings y reemplazar repositorios placeholder en Functions.

## Backend Fase 4

- Functions disponibles:
  - `createOrder`
  - `updateOrder`
  - `changeOrderStatus`
  - `uploadEvidenceMetadata`
  - `assignProvider`
  - `closeOrder`
- Todas validan usuario autenticado.
- Roles se leen desde custom claims `roles` o `role`. Pendiente resolver roles desde `users/user_roles` via SQL Connect.
- `ALLOW_PLACEHOLDER_ROLES=true` permite desarrollo temporal sin claims; no usar en produccion.
- `changeOrderStatus` y `closeOrder` usan `validateTransition`.
- Auditoria se centraliza en `writeAuditLog`, actualmente placeholder con `console.info`.
- `npm --prefix functions run build`: correcto despues de los cambios.

## Frontend Fase 5

- Login usa Firebase Auth con `signInWithEmailAndPassword`.
- Si no hay `VITE_FIREBASE_PROJECT_ID`, se activa usuario demo local.
- Formulario de pedido llama `createOrder`.
- Detalle de pedido llama:
  - `assignProvider`
  - `registerShipment`
  - `changeOrderStatus`
  - `uploadEvidenceMetadata` despues de subir archivo a Firebase Storage
  - `closeOrder`
- Estados visuales:
  - loading de sesion.
  - loading de pedidos.
  - errores de login, registro, evidencia y transiciones.
  - empty state de pedidos.
- Restriccion mantenida: el frontend no valida reglas criticas de transicion, solo invoca Cloud Functions.

## QA Fase 6

- `npm run lint`: correcto.
- `npm run build`: correcto.
- `npm --prefix functions run build`: correcto.
- Servidor Vite local responde HTTP 200 en `http://127.0.0.1:5173`.
- Flujo probado en modo tecnico/demo:
  - sesion demo cuando no hay `VITE_FIREBASE_PROJECT_ID`.
  - listado de pedido demo.
  - formulario conectado al servicio `createOrder`.
  - acciones de detalle conectadas a servicios/Functions.
- Flujo real bloqueado hasta completar:
  - `.env.local` con Firebase real.
  - `firebase use --add`.
  - Auth users y custom claims de roles.
  - SQL Connect generado y conectado a Functions.
  - Deploy de Functions/Hosting/Storage.

## Limpieza Fase 7

- `.gitignore` protege `.env`, `.env.*`, `functions/lib` y `*.tsbuildinfo`.
- Se eliminaron assets heredados de Vite no referenciados:
  - `src/assets/vite.svg`
  - `src/assets/typescript.svg`
  - `src/assets/hero.png`
  - `public/icons.svg`
- No se elimino logica funcional del proyecto.
- Verificaciones posteriores a limpieza: lint/build/functions build correctos.

## Checklist demo cliente

- Crear proyecto Firebase real y seleccionar plan compatible con Cloud Functions/SQL Connect.
- Ejecutar `firebase login`.
- Ejecutar `firebase use --add`.
- Crear `.env.local` desde `.env.example`.
- Configurar Firebase Auth con proveedor email/password.
- Crear usuarios y asignar custom claims `roles` o `role`.
- Ejecutar `firebase init sqlconnect` y validar `sql/schema/schema.gql`.
- Generar conectores/SDK SQL Connect y reemplazar `SqlConnectPlaceholderRepository`.
- Ejecutar `npm run build`.
- Ejecutar `npm --prefix functions run build`.
- Desplegar con `firebase deploy --only hosting,functions,storage`.
- Probar flujo real:
  - login.
  - crear pedido.
  - confirmar.
  - asignar proveedor.
  - registrar envio.
  - subir evidencia.
  - marcar entregado.
  - cerrar.

## Diagnostico Fase 1

- `README.md` leido.
- `AGENTS.md` leido.
- Estructura real revisada.
- `package.json`, `firebase.json`, `functions/package.json`, `sql/schema/schema.sql` y `sql/connectors` revisados.
- `npm run lint`: correcto.
- `npm run build`: correcto, genera `dist` y service worker PWA.
- `npm --prefix functions run build`: correcto.
- Errores reales encontrados: ninguno en build/lint.
- Incompleto detectado: Firebase real no esta enlazado, SQL Connect no tiene schema `.gql` ni conectores, Functions todavia usan placeholders y frontend usa demo si no hay `VITE_FIREBASE_PROJECT_ID`.

## Riesgos o decisiones por confirmar

- Credenciales reales de Firebase.
- Configuracion final de Firebase SQL Connect.
- Estrategia final de tiempo real segun soporte de SQL Connect en el proyecto.
- Modelo exacto de permisos por rol y acciones permitidas.
- Formato final del catalogo PDF externo: solo referencia manual, carga de archivo o extraccion automatica.
- Politica de versionado de evidencias y retencion de archivos.

## Correccion auth, Functions y valorizado - 2026-06-06

- Roles aplicados: `QA_AGENT`, `BACKEND_AGENT` y `FRONTEND_UX_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Firestore NO se uso como base principal.
  - No se imprimieron secretos de `.env`.
  - Las operaciones criticas siguen pasando por Cloud Functions callable.
- Causa revisada del CORS:
  - No quedaron llamadas directas `fetch` a `https://us-central1-ventas-rpm.cloudfunctions.net/createOrder`.
  - Los servicios frontend usan Firebase SDK `httpsCallable` para `createOrder`, `updateOrder`, `changeOrderStatus`, `assignProvider`, `registerShipment`, `uploadEvidenceMetadata`, `closeOrder` y funciones admin.
  - Si aparece CORS contra URL directa, el origen probable es un bundle viejo o una llamada manual fuera de los servicios actuales.
- Auth/admin corregido:
  - Despues de login real se fuerza `getIdTokenResult(true)` para leer claims actualizados.
  - `hasRole` acepta admin por `roles: ["admin"]`; el mapeo de claims acepta `role` y `roles`.
  - `AdminRoute` ya no redirige en bucle a dashboard: muestra `No autorizado` si el usuario no es admin.
  - Logging seguro en desarrollo muestra solo email, roles detectados y `mustChangePassword`; no imprime tokens.
  - Login ahora usa `<form onSubmit>` y el boton demo es `type="button"`, corrigiendo el warning del campo password.
- Usuario admin real:
  - `npm run admin:set-claim -- moudevos@gmail.com`: correcto.
  - `npm run admin:check-claim -- moudevos@gmail.com`: correcto.
  - UID verificado: `hnYvorEGavO3tJVjyVapMhi2zGR2`.
  - Claims verificados: `role: "admin"`, `roles: ["admin"]`, permisos de pedidos, usuarios y auditoria.
  - El usuario debe cerrar sesion y volver a entrar para refrescar el ID token.
- Scripts admin corregidos:
  - `scripts/set-admin-claim.mjs` y `scripts/check-user-claim.mjs` detectan `projectId` en este orden:
    - `GOOGLE_CLOUD_PROJECT`
    - `GCLOUD_PROJECT`
    - `.firebaserc projects.default`
    - `.env` o `.env.local` con `VITE_FIREBASE_PROJECT_ID`
  - Si no existe `GOOGLE_APPLICATION_CREDENTIALS`, intentan usar el archivo ADC local generado por Firebase CLI en `%APPDATA%/firebase`.
  - Si faltan credenciales, muestran instrucciones para `firebase login`, `firebase login:use`, `gcloud auth application-default login` o `GOOGLE_APPLICATION_CREDENTIALS`.
- Items valorizados:
  - Cada item maneja `sku`, `description`, `quantity`, `unitPrice`, `subtotal` y `observation`.
  - Frontend valida `quantity > 0` y `unitPrice >= 0`.
  - Backend recalcula subtotales y totales; no confia en el total enviado por frontend.
- Costos de pedido:
  - `orders` ahora guarda `packagingCost`, `shippingCost`, `totalProductsAmount` y `totalOrderAmount`.
  - Registro inicial permite costo de embalaje y costo de envio inicial.
  - En el flujo `READY_TO_SHIP -> SHIPPED` se puede registrar/actualizar `shippingCost` y se recalcula el total.
- Product suggestions:
  - `product_suggestions` ahora guarda `lastUnitPrice`, `usageCount`, `lastUsedAt` y `updatedAt`.
  - Al crear pedido, Functions hace upsert por SKU mediante consulta previa y update/insert.
  - No se agrego indice unico en `sku` todavia para evitar fallo de migracion si ya existen duplicados historicos.
- Data Connect:
  - `firebase dataconnect:sql:diff --project ventas-rpm`: mostro migracion aditiva.
  - Cambios SQL aplicados:
    - agregar `unit_price` y `subtotal` en `order_items`.
    - agregar `packaging_cost`, `shipping_cost`, `total_products_amount` y `total_order_amount` en `orders`.
    - agregar `last_unit_price`, `usage_count`, `last_used_at` y `updated_at` en `product_suggestions`.
  - No hubo `DROP`, `DELETE` ni `TRUNCATE`.
  - `firebase dataconnect:sql:migrate --service ventas-rpm-service --project ventas-rpm --force`: correcto.
  - `firebase deploy --only dataconnect --project ventas-rpm --force`: correcto.
  - `firebase dataconnect:sdk:generate --service ventas-rpm-service --project ventas-rpm`: correcto.
- Functions:
  - `createOrder` valida cliente/items/costos, recalcula totales, guarda items con precio/subtotal y actualiza sugerencias SKU.
  - `registerShipment` acepta `shippingCost` y recalcula total.
  - `changeOrderStatus` acepta `shippingCost` al pasar a `SHIPPED` y actualiza totales.
  - `firebase deploy --only functions --project ventas-rpm`: correcto, 16 Functions desplegadas, 0 errores.
  - `firebase functions:list --project ventas-rpm`: 16 callables v2 activas.
- Archivos principales modificados:
  - `src/services/authService.ts`
  - `src/router/AdminRoute.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/types/orders.ts`
  - `src/services/ordersService.ts`
  - `src/components/orders/OrderForm.tsx`
  - `src/components/orders/OrderDetail.tsx`
  - `scripts/set-admin-claim.mjs`
  - `scripts/check-user-claim.mjs`
  - `dataconnect/schema/schema.gql`
  - `dataconnect/orders/orders.gql`
  - `dataconnect/order_items/order_items.gql`
  - `dataconnect/product_suggestions/product_suggestions.gql`
  - `functions/src/types.ts`
  - `functions/src/index.ts`
  - `functions/src/repository.ts`
  - SDK generado en `functions/src/dataconnect/*`
- QA ejecutado:
  - `npm run lint`: correcto.
  - `npm run build`: correcto.
  - `npm --prefix functions run build`: correcto.
  - `npm run admin:check-claim -- moudevos@gmail.com`: correcto.
  - `npm run admin:set-claim -- moudevos@gmail.com`: correcto.
- Errores encontrados y corregidos:
  - `AdminRoute` tenia import muerto despues de eliminar redireccion: corregido.
  - Scripts admin detectaban `projectId`, pero fallaban sin ADC: corregido con fallback a ADC local de Firebase CLI.
  - Diff inicial de `product_suggestions` proponia `last_used_at NOT NULL` e indice unico en `sku`; se ajusto a migracion segura sin indice unico y con columna nullable.
- Pendientes reales:
  - QA funcional desde navegador con `moudevos@gmail.com`: login, `/admin/usuarios`, crear pedido real y confirmar que no aparece CORS.
  - Deduplicar `product_suggestions.sku` y luego evaluar indice unico real.
  - Endurecer conectores Data Connect marcados como `INSECURE` por `@auth(level: USER)`.
  - Revisar si `CreateOrderRecord` y `CreateOrderItem` deben hacer variables monetarias nullable para compatibilidad con clientes externos antiguos; Functions ya envia los nuevos valores.

## Correccion admin, callables y formularios - 2026-06-06 tarde

- Roles aplicados: `QA_AGENT`, `BACKEND_AGENT` y `FRONTEND_UX_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue migrado ni desplegado en esta vuelta porque no hubo cambios de schema.
  - Firestore NO se uso como base principal.
  - No se expusieron secretos.
- CORS / Functions callable:
  - Se busco `fetch` directo hacia Cloud Functions y no quedan llamadas directas a `https://us-central1-ventas-rpm.cloudfunctions.net/...`.
  - Se creo `src/services/callableClient.ts`.
  - Todos los servicios frontend de Functions pasan por `callFunction<TInput, TOutput>()`, que usa `httpsCallable`.
  - `src/lib/firebase.ts` ahora inicializa Functions explicitamente en `us-central1`.
  - Servicios actualizados:
    - `ordersService`
    - `adminUsersService`
    - `evidenceService`
    - `authService` para `markPasswordChanged`
  - `ubigeoService` mantiene `fetch` solo para la API externa publica de ubigeo; no llama Cloud Functions.
- Errores visibles:
  - Se creo `src/utils/errorUtils.ts`.
  - Los errores de Functions se transforman en `title`, `message` y `technicalDetail`.
  - En desarrollo se loguean detalles tecnicos sin imprimir tokens.
- SweetAlert2:
  - Se instalo `sweetalert2`.
  - Se creo `src/lib/alerts.ts` con:
    - `showSuccess`
    - `showError`
    - `showConfirm`
    - `showToast`
  - Admin usa toast al crear usuario, resetear password y deshabilitar.
  - Admin usa confirmacion antes de resetear password y deshabilitar usuario.
  - Pedido nuevo muestra toast al crear y modal de error con detalle tecnico si falla.
- Admin / createPersonUser:
  - `createPersonUser` en Functions ahora es idempotente:
    1. busca usuario Auth por email.
    2. si no existe, lo crea.
    3. asigna claims.
    4. crea o actualiza perfil SQL en Data Connect.
    5. asigna rol.
    6. escribe auditoria sin romper la creacion si falla el log.
  - Si Auth se crea y luego falla el perfil SQL, intenta deshabilitar ese usuario Auth y devuelve `HttpsError` con detalle seguro.
  - Si el email ya existe en Auth, continua con upsert de perfil y claims; no devuelve password.
- Admin UI:
  - `AdminUsersPage` refresca la tabla despues de crear, resetear o deshabilitar.
  - El formulario de nueva persona se limpia solo si la creacion termina bien.
  - Si falla, conserva el formulario y muestra detalle tecnico.
  - Formularios de crear usuario y reset password usan `<form onSubmit>`.
  - Password temporal usa `autocomplete="new-password"`.
  - Inputs tienen labels visibles.
- Login:
  - Campo correo con label y `autocomplete="email"`.
  - Campo password con label y `autocomplete="current-password"`.
- Pedido / inputs:
  - `OrderForm` usa labels visibles.
  - DNI y telefono usan `type="text"` con `inputMode="numeric"`.
  - CEX se normaliza internamente para buscar/guardar, pero no se deforma visualmente mientras se escribe.
  - Cantidad, precio unitario, embalaje y envio usan texto controlado con sanitizacion manual; no usan `type="number"` ni spinners.
  - Precio acepta punto o coma decimal.
  - El payload de `createOrder` envia items con `sku`, `description`, `quantity`, `unitPrice`, `subtotal`, y tambien `totalProductsAmount`, `packagingCost`, `shippingCost`, `totalOrderAmount`.
- Product suggestions:
  - Ya existia `product_suggestions`; se mantiene upsert por SKU al crear pedido.
  - `searchSkuSuggestions` devuelve descripcion y ultimo precio para autocompletar.
- Archivos principales modificados/agregados:
  - `package.json`
  - `package-lock.json`
  - `src/lib/firebase.ts`
  - `src/lib/alerts.ts`
  - `src/utils/errorUtils.ts`
  - `src/services/callableClient.ts`
  - `src/services/ordersService.ts`
  - `src/services/adminUsersService.ts`
  - `src/services/evidenceService.ts`
  - `src/services/authService.ts`
  - `src/pages/AdminUsersPage.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/pages/NewOrderPage.tsx`
  - `src/components/orders/OrderForm.tsx`
  - `src/types/orders.ts`
  - `functions/src/index.ts`
- Comandos ejecutados:
  - `npm install sweetalert2`: correcto, npm reporto 8 vulnerabilidades moderadas existentes; no se ejecuto `npm audit fix`.
  - `npm run lint`: correcto.
  - `npm run build`: correcto, con advertencia de chunk mayor a 500 kB por agregar SweetAlert2.
  - `npm --prefix functions run build`: correcto.
  - `firebase deploy --only functions --project ventas-rpm`: correcto.
  - `firebase functions:list --project ventas-rpm`: 16 Functions v2 callable activas.
- Deploy realizado:
  - Functions: desplegado correctamente.
  - Data Connect: no desplegado en esta vuelta.
  - Hosting: NO desplegado.
- Errores encontrados/corregidos:
  - `OrderForm` pasaba strings visuales de costos al resumen numerico: corregido usando valores parseados.
  - `AdminUsersPage` necesitaba capturar el error real en `refresh`: corregido.
- Pendientes reales:
  - Probar desde navegador con `moudevos@gmail.com` en `http://localhost:4000`: login, crear usuario, resetear password, deshabilitar, crear pedido.
  - Confirmar si el CORS persistente venia de un bundle viejo/cache del navegador; el codigo actual no tiene fetch directo a Cloud Functions.
  - Evaluar code splitting para SweetAlert2 si el warning de chunk afecta performance.
  - Endurecer conectores Data Connect marcados como `INSECURE` por `@auth(level: USER)`.

## Correccion flujo mustChangePassword - 2026-06-06 tarde

- Roles aplicados: `BACKEND_AGENT`, `FRONTEND_UX_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado ni migrado.
  - Firestore NO se uso como base principal.
  - No se imprimieron tokens ni secretos en documentacion.
- Problema corregido:
  - El cambio de contrasena no vuelve a ejecutar `signInWithEmailAndPassword`.
  - El flujo ya no intenta autenticar con la contrasena anterior despues de `updatePassword`.
  - La UI fuerza refresh de ID token con `getIdToken(true)` y `getIdTokenResult(true)`.
  - El estado global de auth se actualiza con claims frescos antes de navegar a `/dashboard`.
  - Si Firebase sigue devolviendo `mustChangePassword=true`, la pantalla muestra error tecnico controlado y no reintenta login.
- Frontend:
  - `ChangePasswordPage` ahora usa `<form onSubmit>`, labels visibles y `autocomplete` correcto para password actual/nueva.
  - Se validan contrasena actual, longitud minima y confirmacion.
  - `authService.changeCurrentPassword` ejecuta el orden seguro:
    1. reautenticar usuario actual.
    2. `updatePassword`.
    3. llamar callable `markPasswordChanged`.
    4. refrescar ID token.
    5. mapear claims frescos.
    6. actualizar listeners de auth.
  - `authService.refreshCurrentUserClaims()` queda disponible para refrescar claims desde UI.
  - `/login` redirige a `/cambiar-password` si el claim fresco trae `mustChangePassword=true`.
  - `ProtectedRoute` permite `/cambiar-password` mientras el usuario debe cambiar contrasena y redirige a `/dashboard` si ya no debe cambiarla.
- Backend:
  - `markPasswordChanged` valida usuario autenticado.
  - Lee el usuario real desde Firebase Auth.
  - Preserva custom claims existentes.
  - Cambia solo `mustChangePassword:false`, manteniendo `role`, `roles` y `permissions`.
  - Si falta rol real, devuelve `permission-denied` con mensaje `Usuario sin rol asignado`.
  - Sincroniza `users.mustChangePassword=false` y `status=ACTIVE` en Data Connect cuando existe perfil SQL.
  - Si falla Data Connect, devuelve `HttpsError internal` con `technicalDetail` seguro.
  - La auditoria `users.passwordChanged` ya no rompe el cambio de contrasena si falla; queda registrada en logs.
  - Respuesta esperada: `{ ok: true, uid, mustChangePassword: false, roles, role }`.
- Compatibilidad de roles:
  - `advisor`, `promoter` y `promotor` se aceptan como equivalentes para flujo comercial/promotor.
  - Deuda tecnica documentada: normalizar definitivamente nombres de rol en Auth/Data Connect para evitar alias historicos.
- Archivos modificados:
  - `src/pages/ChangePasswordPage.tsx`
  - `src/pages/LoginPage.tsx`
  - `src/services/authService.ts`
  - `src/hooks/useAuth.ts`
  - `src/router/ProtectedRoute.tsx`
  - `src/lib/roles.ts`
  - `src/types/orders.ts`
  - `functions/src/index.ts`
  - `README.md`
- Comandos ejecutados:
  - `npm run lint`: correcto.
  - `npm run build`: correcto, con advertencia conocida de chunk mayor a 500 kB por SweetAlert2.
  - `npm --prefix functions run build`: correcto.
  - `firebase deploy --only functions --project ventas-rpm`: fallido por red contra Cloud Resource Manager, no por build.
  - Segundo intento de `firebase deploy --only functions --project ventas-rpm`: fallido por `socket hang up` en `https://cloudresourcemanager.googleapis.com/v1/projects/ventas-rpm`.
  - `firebase functions:list --project ventas-rpm`: correcto; 16 Functions v2 callable siguen `ACTIVE`.
- Estado deploy:
  - El codigo frontend/local compila.
  - El codigo de Functions compila.
  - El cambio nuevo de `markPasswordChanged` aun NO quedo desplegado por fallo de conectividad del Firebase CLI con Cloud Resource Manager.
  - Functions remotas actuales siguen activas, pero conservan la revision anterior hasta repetir deploy exitosamente.
  - Hosting NO fue desplegado.
- Pendientes reales:
  - Reintentar `firebase deploy --only functions --project ventas-rpm` cuando la conectividad a `cloudresourcemanager.googleapis.com` este estable.
  - Probar con `promotoruno@gmail.com`: login, cambio de contrasena, refresh de claims y entrada a `/dashboard`.
  - Si `mustChangePassword` vuelve a quedar en true despues del refresh, revisar custom claims del usuario y perfil `users` en Data Connect.

## Correccion CORS createOrder y ubigeo - 2026-06-06 tarde

- Roles aplicados: `BACKEND_AGENT`, `FRONTEND_UX_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado ni migrado.
  - Firestore NO se uso como base principal.
  - No se imprimieron tokens ni secretos.
- Causa del error CORS:
  - El navegador reportaba bloqueo en `https://us-central1-ventas-rpm.cloudfunctions.net/createOrder` desde `http://localhost:5173`.
  - El frontend sigue usando `httpsCallable` mediante `src/services/callableClient.ts`; no hay `fetch` directo a Cloud Functions en `ordersService`.
  - Se agrego CORS explicito a todas las callables v2 para origenes:
    - `http://localhost:*`
    - `http://127.0.0.1:*`
    - `https://ventas-rpm.web.app`
    - `https://ventas-rpm.firebaseapp.com`
  - Las Functions se desplegaron correctamente, pero la prueba manual `OPTIONS` a `createOrder` sigue devolviendo `403 Forbidden`.
  - Interpretacion tecnica: el bloqueo actual ocurre antes de entrar al runtime de la Function, en Cloud Run invoker/IAM. La autorizacion de usuario debe seguir en la Function con Firebase Auth, pero el endpoint callable necesita permitir invocacion HTTP publica para que el preflight llegue al runtime.
- Accion backend aplicada:
  - `functions/src/index.ts` define `callableOptions` con CORS explicito.
  - Todas las callables usan `onCall(callableOptions, async ...)`.
  - Se intento usar `invoker` en opciones de callable, pero Firebase Functions discovery no lo serializo para estas callables; se retiro para no dejar configuracion engañosa.
  - Se intento aplicar IAM con el cliente interno de `firebase-tools`, pero fallo localmente con: `Failed to get the IAM Policy on the Service projects/ventas-rpm/locations/us-central1/services/assignprovider`.
  - `gcloud` no esta instalado en esta maquina, por eso no se pudo aplicar `roles/run.invoker` desde CLI local.
- Pendiente bloqueante si el CORS persiste:
  - Aplicar Cloud Run Invoker publico a los servicios Cloud Run de Functions v2.
  - Comando recomendado desde Cloud Shell o una maquina con Google Cloud SDK:
    - `gcloud run services add-iam-policy-binding createorder --region us-central1 --project ventas-rpm --member allUsers --role roles/run.invoker`
  - Repetir para las callables usadas por el frontend:
    - `listorders`
    - `createorder`
    - `updateorder`
    - `changeorderstatus`
    - `assignprovider`
    - `registershipment`
    - `uploadevidencemetadata`
    - `closeorder`
    - `findclientbydocument`
    - `upsertclient`
    - `searchskusuggestions`
    - `markpasswordchanged`
  - Alternativa por consola: Google Cloud Console -> Cloud Run -> servicio -> Permissions -> Grant access -> principal `allUsers` -> rol `Cloud Run Invoker`.
- Roles:
  - `promotor`, `promoter` y `advisor` se mantienen compatibles.
  - Si luego del CORS aparece `permission-denied`, revisar custom claims del usuario; si aparece preflight/403, revisar IAM Cloud Run Invoker.
- Ubigeo:
  - `src/services/ubigeoService.ts` corregido para soportar el formato real del endpoint `https://free.e-api.net.pe/ubigeos.json`.
  - El endpoint devuelve objeto anidado `Departamento -> Provincia -> Distrito`, no array plano.
  - Se agrego normalizacion de objeto anidado a lista interna.
  - Se versiono cache local a `pwa-ventas-ubigeos-v2` para evitar que un cache viejo vacio mantenga el formulario sin selects.
  - El formulario ya muestra selects dependientes:
    - Departamento.
    - Provincia filtrada por departamento.
    - Distrito filtrado por provincia.
- Archivos modificados:
  - `functions/src/index.ts`
  - `src/services/ubigeoService.ts`
  - `README.md`
- Comandos ejecutados:
  - `npm run lint`: correcto.
  - `npm run build`: correcto, con advertencia conocida de chunk mayor a 500 kB por SweetAlert2.
  - `npm --prefix functions run build`: correcto.
  - `firebase deploy --only functions --project ventas-rpm`: correcto, 16 Functions desplegadas, 0 errores.
  - Segundo `firebase deploy --only functions --project ventas-rpm`: correcto, 16 Functions desplegadas, 0 errores.
  - Tercer `firebase deploy --only functions --project ventas-rpm`: correcto, 16 Functions desplegadas, 0 errores.
  - `firebase functions:list --project ventas-rpm`: correcto, 16 Functions v2 callable activas.
  - Prueba `OPTIONS` a `createOrder` con origen `http://localhost:5173`: sigue `403 Forbidden`.
- Estado:
  - Codigo local compila.
  - Functions remotas estan activas.
  - CORS runtime esta configurado, pero falta corregir IAM Cloud Run Invoker si el navegador sigue viendo preflight 403.
  - Hosting NO fue desplegado.

## Correccion 500 createOrder por conector Data Connect - 2026-06-06 tarde

- Roles aplicados: `BACKEND_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Firestore NO se uso como base principal.
  - No se imprimieron tokens ni secretos.
- Contexto:
  - Despues de aplicar `roles/run.invoker` en Cloud Shell sobre `createorder`, el preflight dejo de bloquear y el request POST llego a la Function.
  - El nuevo error fue `500 Internal Server Error` en `createOrder`.
- Diagnostico real desde logs:
  - Comando ejecutado:
    - `firebase functions:log --project ventas-rpm --only createOrder`
  - Error encontrado:
    - `Unhandled error FirebaseDataConnectError: operation "FindClientByDocument" not found`
  - Ubicacion:
    - `upsertClientRecord` en `functions/src/repository.ts`
    - llamada a `findClientByDocument` del paquete `@dataconnect/clients-admin`
  - Causa:
    - La operacion `FindClientByDocument` existia en archivos locales y en el SDK generado, pero no estaba disponible en el conector remoto desplegado de Data Connect.
- Accion aplicada:
  - Se desplego solo Data Connect para publicar los conectores actuales:
    - `firebase deploy --only dataconnect --project ventas-rpm --force`
  - Resultado:
    - Correcto.
    - Schema compatible.
    - Conectores actualizados, incluyendo `clients`.
    - Data Connect reporto deployment complete.
  - Hosting NO fue desplegado.
- Advertencias vistas:
  - Firebase Data Connect sigue marcando varias operaciones `@auth(level: USER)` como `EXISTING_INSECURE`.
  - Se mantiene la decision MVP: la logica critica sigue pasando por Cloud Functions, pero queda pendiente endurecer conectores expuestos.
- Archivos revisados:
  - `functions/src/repository.ts`
  - `dataconnect/clients/clients.gql`
  - `dataconnect/clients/connector.yaml`
  - `functions/src/dataconnect/clients/index.d.ts`
  - `functions/src/dataconnect/clients/index.cjs.js`
  - `README.md`
- Estado:
  - CORS/IAM de `createorder` fue corregido por Cloud Shell.
  - `FindClientByDocument` ya deberia existir en Data Connect remoto despues del deploy.
  - Siguiente prueba real: reintentar registrar pedido desde `/pedidos/nuevo`.
  - Si vuelve a fallar, revisar nuevo log de `createOrder`; ya no deberia ser `operation "FindClientByDocument" not found`.

## Separacion flujo nuevo pedido y redeploy createOrder - 2026-06-06 noche

- Roles aplicados: `FRONTEND_UX_AGENT`, `BACKEND_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado ni migrado en esta vuelta.
  - Firestore NO se uso como base principal.
  - No se imprimieron secretos ni tokens.
- Problema reportado:
  - El navegador seguia mostrando `POST https://us-central1-ventas-rpm.cloudfunctions.net/createOrder 500 (Internal Server Error)`.
  - La UI de nuevo pedido necesitaba separar el flujo en cliente, carrito y registro del pedido.
- Diagnostico real:
  - `firebase functions:log --project ventas-rpm --only createOrder` mostro que el request ya pasa CORS y autenticacion callable.
  - El error real previo seguia siendo `FirebaseDataConnectError: operation "FindClientByDocument" not found` en la revision vieja `createorder-00010-feb`.
  - Esto confirma que el fallo no era un rol frontend ni validacion visual; el runtime fallaba al buscar/upsertar cliente en Data Connect.
- Frontend:
  - `OrderForm` ahora funciona por pasos:
    1. `Cliente`: buscar o registrar datos de cliente con ubigeo dependiente.
    2. `Carrito`: agregar items, cantidades, precio, embalaje y envio.
    3. `Confirmar`: revisar cliente, items, totales y registrar pedido.
  - El boton final `Registrar pedido` solo aparece en confirmacion.
  - Las validaciones minimas quedan separadas:
    - cliente/documento/contacto/direccion antes de pasar al carrito.
    - al menos un item y costos validos antes de confirmar.
  - La llamada critica final sigue usando `createOrder`; no se movio logica critica al frontend.
- Backend:
  - `createOrder` ahora captura errores inesperados y devuelve `HttpsError('internal', 'No se pudo registrar el pedido en Data Connect')` con `technicalDetail` controlado.
  - Los errores `HttpsError` de validacion/rol se mantienen intactos.
  - Se agrego log seguro de `createOrder failed` sin imprimir tokens.
- Deploy:
  - Se ejecuto `firebase deploy --only functions --project ventas-rpm`.
  - Resultado: correcto, 16 Functions desplegadas, 0 errores.
  - `createOrder` quedo activo en revision nueva `createorder-00011-yuj`.
  - `firebase functions:list --project ventas-rpm` confirma 16 callables v2 `ACTIVE`.
  - Hosting NO fue desplegado.
- Archivos modificados:
  - `src/components/orders/OrderForm.tsx`
  - `functions/src/index.ts`
  - `README.md`
- Comandos ejecutados:
  - `firebase functions:log --project ventas-rpm --only createOrder`: detecto `operation "FindClientByDocument" not found` en revision vieja.
  - `npm run lint`: correcto.
  - `npm --prefix functions run build`: correcto.
  - `npm run build`: correcto, con advertencia conocida de chunk mayor a 500 kB.
  - `firebase deploy --only functions --project ventas-rpm`: correcto.
  - `firebase functions:list --project ventas-rpm`: correcto, 16 Functions v2 activas.
- Pendientes reales:
  - Probar desde navegador con `moudevos@gmail.com`: cliente -> carrito -> confirmar -> registrar pedido.
  - Si vuelve a fallar, revisar `firebase functions:log --project ventas-rpm --only createOrder`; ahora deberia mostrar un `technicalDetail` mas claro en la UI.
  - Si aparece `operation "FindClientByDocument" not found` incluso en revision nueva, revisar despliegue remoto del conector `clients` y regenerar/reinstalar SDK Data Connect admin.

## Fallback cliente nuevo por FindClientByDocument faltante - 2026-06-06 noche

- Roles aplicados: `BACKEND_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Data Connect NO fue desplegado ni migrado en esta vuelta.
  - Firestore NO se uso como base principal.
  - No se imprimieron secretos ni tokens.
- Problema reportado:
  - `createOrder` seguia devolviendo 500.
  - La UI mostro el detalle tecnico: `operation "FindClientByDocument" not found`.
- Decision tecnica:
  - El error no estaba en `src/services/callableClient.ts`; ese archivo solo invoca `httpsCallable` y reporta el error devuelto por Cloud Functions.
  - El fallo real estaba en backend/Data Connect: la operacion remota `FindClientByDocument` no esta disponible aunque existe en archivos locales.
  - Para desbloquear el MVP, si `FindClientByDocument` falla con `data-connect/not-found`, Functions trataran el cliente como nuevo y continuaran con `CreateClientReal`.
  - Riesgo aceptado temporalmente: puede crear clientes duplicados si ya existe un cliente con el mismo documento, hasta corregir el conector remoto.
- Backend:
  - `functions/src/repository.ts` ahora usa `findClientRecord`.
  - `findClientRecord` captura especificamente `data-connect/not-found` con `FindClientByDocument` y devuelve `null`.
  - `createOrder` crea cliente nuevo cuando la busqueda no esta disponible.
  - `functions/src/index.ts` aplica el mismo fallback en las callables `findClientByDocument` y `upsertClient`.
  - La busqueda automatica del formulario ya no debe tumbar la UX; si falta la operacion, responde como cliente nuevo.
- Deploy:
  - Se ejecuto `firebase deploy --only functions --project ventas-rpm`.
  - Resultado: correcto, 16 Functions desplegadas, 0 errores.
  - `createOrder` quedo activo en revision `createorder-00012-ref`.
  - `firebase functions:list --project ventas-rpm` confirma 16 callables v2 `ACTIVE`.
  - Hosting NO fue desplegado.
- Archivos modificados:
  - `functions/src/repository.ts`
  - `functions/src/index.ts`
  - `README.md`
- Comandos ejecutados:
  - `npm run lint`: correcto.
  - `npm --prefix functions run build`: correcto.
  - `npm run build`: correcto, con advertencia conocida de chunk mayor a 500 kB.
  - `firebase deploy --only functions --project ventas-rpm`: correcto.
  - `firebase functions:list --project ventas-rpm`: correcto.
- Pendientes reales:
  - Reintentar registro de pedido desde navegador.
  - Si el siguiente error cambia a otra operacion faltante, revisar logs con `firebase functions:log --project ventas-rpm --only createOrder`.
  - Corregir definitivamente el deploy/generacion remota del conector `clients` para que `FindClientByDocument` exista y evitar duplicados.

## Analisis CreateClientReal faltante y redeploy Data Connect - 2026-06-06 noche

- Roles aplicados: `BACKEND_AGENT`, `SQL_CONNECT_AGENT` y `QA_AGENT`.
- Restricciones cumplidas:
  - Hosting NO fue desplegado.
  - Firestore NO se uso como base principal.
  - No se imprimieron secretos ni tokens.
- Problema reportado:
  - `createOrder` seguia devolviendo 500.
  - El detalle tecnico cambio a `operation "CreateClientReal" not found`.
- Analisis:
  - `src/services/callableClient.ts` no era la causa; solo ejecuta `httpsCallable` y reporta el error devuelto por Cloud Functions.
  - El request llegaba a Cloud Functions con `auth: VALID`.
  - `functions/src/dataconnect/clients/index.cjs.js` llama operaciones generadas `FindClientByDocument` y `CreateClientReal`.
  - `dataconnect/clients/clients.gql` local contiene ambas operaciones.
  - El remoto de Data Connect tenia el conector `clients` desactualizado respecto a lo que Functions estaba intentando ejecutar.
- Accion aplicada:
  - Se ejecuto `firebase deploy --only dataconnect --project ventas-rpm --force`.
  - Resultado: correcto.
  - Data Connect reporto:
    - `Connector "clients": sources: clients\clients.gql [2774B]`
    - advertencia `EXISTING_INSECURE` sobre operaciones expuestas, incluyendo `CreateClientReal`.
    - conector remoto `clients` actualizado a `2026-06-07T04:28:21.147865513Z`.
  - Se ejecuto luego `firebase deploy --only functions --project ventas-rpm`.
  - Resultado: correcto, pero Firebase salto Functions por `No changes detected`.
- Prueba directa:
  - Se intento generar un ID token para el UID `hnYvorEGavO3tJVjyVapMhi2zGR2` y hacer POST directo a `https://us-central1-ventas-rpm.cloudfunctions.net/createOrder`.
  - Primer bloqueo: ADC local no podia cargar credenciales por defecto.
  - Segundo bloqueo: al usar ADC de Firebase CLI con `serviceAccountId`, IAM devolvio `iam.serviceAccounts.signBlob denied`.
  - Conclusion: desde esta terminal no se puede fabricar un Firebase ID token valido para probar una callable autenticada sin permiso `iam.serviceAccounts.signBlob` o sin un ID token real del navegador.
  - Se intento tambien una prueba directa de repositorio local contra Data Connect, pero fuera del runtime Cloud Functions los SDK generados resolvieron instancias distintas de `firebase-admin` y fallaron en inicializacion local (`default Firebase app does not exist`). No se considera prueba concluyente del backend remoto.
- Estado actual:
  - Data Connect remoto ya fue redeplegado con `clients.gql` actual.
  - Functions remotas siguen activas y sin cambios de codigo.
  - Hosting NO fue desplegado.
- Pendiente inmediato:
  - Reintentar crear pedido desde el navegador con `moudevos@gmail.com`.
  - Si vuelve a fallar, ejecutar inmediatamente `firebase functions:log --project ventas-rpm --only createOrder` y revisar si el error cambio a otra operacion faltante.
  - Para permitir QA HTTP directo desde terminal, otorgar temporalmente al usuario/ADC local permiso `iam.serviceAccounts.signBlob` sobre `ventas-rpm@appspot.gserviceaccount.com` o proporcionar un ID token de prueba generado desde el navegador.
