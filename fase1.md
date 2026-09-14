# Fase 1 — Integración del Portal KOOP

Documentación técnica de la primera fase de desarrollo del portal cliente/abogado de **KOOP Strategic Advisory**, implementada sobre la solución base del monorepo.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura general](#2-arquitectura-general)
3. [Paquetes de la solución base utilizados](#3-paquetes-de-la-solución-base-utilizados)
4. [Paquetes creados específicamente para KOOP](#4-paquetes-creados-específicamente-para-koop)
5. [Providers y contextos](#5-providers-y-contextos)
6. [Capa de API (`apps/koop/src/api/`)](#6-capa-de-api-appskooksrcapi)
7. [Hooks de aplicación (`apps/koop/src/hooks/`)](#7-hooks-de-aplicación-appskooksrchooks)
8. [Páginas implementadas](#8-páginas-implementadas)
9. [Control de acceso (RBAC)](#9-control-de-acceso-rbac)
10. [Modelos de dominio](#10-modelos-de-dominio)
11. [Convenciones de datos con el backend](#11-convenciones-de-datos-con-el-backend)
12. [Tests](#12-tests)
13. [Flujo de datos end-to-end](#13-flujo-de-datos-end-to-end)

---

## 1. Resumen ejecutivo

La Fase 1 integra las funcionalidades centrales del portal operativo de KOOP dentro de la arquitectura monorepo existente. Se construyeron o adaptaron los siguientes módulos:

| Bloque | Descripción | Estado |
|--------|-------------|--------|
| A | Correcciones de API (shapes de respuesta, rutas planas, batch Kanban, params de tareas) | Completado |
| B | Módulo Expedientes completo (listado, detalle, etapas, tareas, paginación server-side) | Completado |
| C | Módulo Kanban (tableros, columnas, DnD HTML5, integración con expediente) | Completado |
| D | Administración de usuarios con roles dinámicos desde catálogos | Completado |
| E | RBAC centralizado (AccessContext, RequireRole, protección de rutas) | Completado |
| F | AdminTareas con API real (reemplaza localStorage) y catálogos de estados/prioridades | Completado |

---

## 2. Arquitectura general

```
apps/koop/                          ← app de producción (JSX + CSS modules)
│
├── src/
│   ├── api/            ← clientes HTTP concretos (axios)
│   ├── auth/           ← adaptadores que implementan interfaces de @repo/auth
│   ├── context/        ← AuthContext, AccessContext (providers React)
│   ├── hooks/          ← thin wrappers que inyectan el cliente axios en @repo/hooks
│   ├── pages/
│   │   ├── dinamic/    ← páginas protegidas del portal
│   │   └── static/     ← páginas públicas del sitio informativo
│   └── components/

packages/
├── hooks/              ← hooks de negocio agnósticos al cliente HTTP (@repo/hooks)
├── koop-models/        ← interfaces TypeScript del dominio KOOP (@repo/koop-models)
├── koop-ui/            ← componentes de diseño específicos de KOOP (@repo/koop-ui)
├── koop-store/         ← estado global específico de KOOP (@repo/koop-store)
├── auth/               ← providers de autenticación reutilizables (@repo/auth)
├── api/                ← factory de clientes HTTP (@repo/api)
├── infrastructure/     ← adaptadores fetch/axios (@repo/infrastructure)
├── persistence/        ← helpers de almacenamiento (@repo/persistence)
└── state/              ← Redux + Zustand agnósticos (@repo/state)
```

El patrón fundamental es **inyección de dependencias**: los hooks en `@repo/hooks` reciben una interfaz `ApiClient` y nunca importan axios directamente. La app `koop` provee las implementaciones concretas mediante thin wrappers en `src/hooks/`.

---

## 3. Paquetes de la solución base utilizados

### `@repo/auth`

Capa de autenticación desacoplada del proveedor. KOOP usa la implementación `custom-api`.

| Símbolo exportado | Uso en KOOP |
|-------------------|-------------|
| `AuthProvider` (interno) / `AuthSessionProvider` | Envuelve la app en `KoopAuthProvider` |
| `useAuthSession()` | Consumido por `AuthContext.tsx` para leer/escribir la sesión activa |
| `AuthProvider` interface | Implementada por `KoopCustomApiProvider` |
| `AuthSession` type | Shape normalizado de sesión (accessToken, user, provider) |

La sesión se persiste automáticamente en `sessionStorage` mediante `@repo/persistence`, permitiendo rehidratación al reabrir el navegador.

---

### `@repo/hooks`

Hooks de negocio agnósticos al cliente HTTP. En Fase 1 se usan y/o crearon las siguientes entradas en `packages/hooks/src/api/koop/`:

| Hook | Propósito |
|------|-----------|
| `useExpedientes` | CRUD de expedientes + etapas, con paginación |
| `useTareasKoop` | CRUD de tareas con filtros (estado, asignado, vencidas) |
| `useActuaciones` | Listado de actuaciones por expediente |
| `useAudiencias` | Listado de audiencias por expediente |
| `useKanban` | Gestión de tableros, columnas y movimiento de tareas (batch) |
| `useAdminUsers` | Listado y gestión de usuarios con roles |
| `useActiveClients` | Consulta de clientes activos |
| `useTasks` | Hook genérico de tareas (base) |

Todos siguen el mismo contrato: reciben un objeto `client: XxxApiClient` y exponen estado reactivo + acciones.

---

### `@repo/api`

Factory de clientes HTTP. Provee `createFetchApiClient` (usado por `KoopCustomApiProvider` para el flujo de autenticación).

---

### `@repo/infrastructure`

Adaptadores de bajo nivel. `apps/koop` usa el adaptador axios configurado en `src/api/axios.js` (instancia singleton con interceptores de token y refresh automático).

---

### `@repo/persistence`

Helpers de almacenamiento. Usado internamente por `@repo/auth` para persistir la sesión normalizada.

---

### `@repo/state`

Estado global con Redux y Zustand. Disponible para uso futuro; en Fase 1 el estado de cada módulo se gestiona localmente con `useState`/`useReducer` dentro de los hooks de `@repo/hooks`.

---

### `@repo/typescript-config` / `@repo/eslint-config`

Configuraciones compartidas de TypeScript y ESLint. Heredadas por todos los paquetes del workspace.

---

## 4. Paquetes creados específicamente para KOOP

### `@repo/koop-models`

Interfaces TypeScript del dominio de negocio de KOOP. Exporta la fuente TypeScript directamente (sin compilación previa), lo que permite consumir los tipos en tiempo de desarrollo sin pasos de build intermedios.

**Módulos de dominio:**

| Archivo | Tipos principales |
|---------|------------------|
| `shared.ts` | `PaginatedResponse<T>`, `ApiEnvelope<T>` |
| `expediente.ts` | `Expediente`, `Etapa`, `ListExpedientesParams` |
| `tarea.ts` | `TareaKoop`, `ListTareasParams`, `EstadoTarea`, `Prioridad` |
| `procesal.ts` | `Actuacion`, `Audiencia` |
| `kanban.ts` | `TableroKanban`, `ColumnaKanban`, `TareaKanbanPosition`, `PosicionUpdate` |
| `catalogos.ts` | `TipoProcSubtipoProcTipoPre`, `Rol` |
| `usuario.ts` | `KoopUser`, `AdminUser` |
| `documento.ts` | `Documento` |
| `financiero.ts` | `Financiero` |
| `colaboracion.ts` | `Colaboracion` |

**Mocks para testing** (`src/__mocks__/`): factories que generan instancias tipadas para tests unitarios.

**Convención de nombres**: todos los campos del backend siguen `SCREAMING_SNAKE_CASE` (ej. `TITULO`, `ID_ESTADO_TAREA`). Los hooks mapean a `camelCase` para el consumo en UI.

---

### `@repo/koop-ui`

Biblioteca de componentes de diseño visual específicos del portal KOOP. Complementa `@repo/ui` con componentes que requieren el tema y el vocabulario visual de la marca.

Componentes desarrollados en Fase 1 (con Storybook stories):

| Componente | Descripción |
|------------|-------------|
| `CalendarWidget` | Widget de calendario para panel |
| `EditFormKit` | Kit de campos de formulario (EditForm, EditRow, EditField, EditSelect, EditTextArea) |
| `KpiCard` | Tarjeta de métrica/KPI para dashboards |
| `SiteFooter` | Pie de página del sitio informativo |

---

### `@repo/koop-store`

Store de estado global específico de KOOP (Zustand). Reservado para estado compartido entre módulos (ej. notificaciones globales, configuración de usuario). En Fase 1 el store sirve de base; el estado modular se gestiona localmente.

---

## 5. Providers y contextos

La app `koop` usa una cadena de providers que envuelven la aplicación en `App.jsx`:

```jsx
<KoopAuthProvider>        // 1. Sesión de autenticación (sessionStorage)
  <AuthProvider>          // 2. Contexto de sesión reactivo + interceptores axios
    <AccessProvider>      // 3. RBAC: rol del usuario + permisos por recurso
      <FontProvider>      // 4. Tipografía del sitio
        <BrowserRouter>
          <Shell />       // 5. Layout: Navbar + Routes + SpotifyWidget
        </BrowserRouter>
      </FontProvider>
    </AccessProvider>
  </AuthProvider>
</KoopAuthProvider>
```

### `KoopAuthProvider` — `apps/koop/src/auth/KoopAuthProvider.tsx`

Thin wrapper sobre `AuthSessionProvider` de `@repo/auth`. Inicializa el almacenamiento de sesión en `sessionStorage`.

---

### `KoopCustomApiProvider` — `apps/koop/src/auth/KoopCustomApiProvider.ts`

Implementa la interface `AuthProvider<KoopCredentials>` de `@repo/auth` contra el backend REST de KOOP.

| Método | Endpoint backend | Descripción |
|--------|-----------------|-------------|
| `signIn(credentials)` | `POST /auth/login` | Login con email/password; construye `AuthSession` desde el JWT |
| `signOut()` | `POST /auth/logout` | Cierra sesión en servidor y limpia sesión local |
| `signUp(...)` | `POST /auth/register` | Registro de usuario; devuelve sesión si hay `accessToken` |
| `refresh()` | `POST /auth/refresh` | Renueva el token de acceso usando cookie HTTP-only |
| `getSession()` | — | Retorna la sesión en memoria |

Incluye un decoder de JWT (`decodeJwt`) y normalización de roles (`normalizeRoles`) que garantiza que el rol final sea siempre uno de `['admin', 'lawyer', 'client', 'user']`.

---

### `AuthProvider` — `apps/koop/src/context/AuthContext.tsx`

Contexto React que expone la sesión activa a toda la app.

**Lo que provee `useAuth()`:**

| Campo / Método | Tipo | Descripción |
|----------------|------|-------------|
| `accessToken` | `string \| null` | JWT activo |
| `user` | `KoopUser \| null` | Usuario normalizado (id, name, email, roles) |
| `isAuthenticated` | `boolean` | Derivado de `!!accessToken` |
| `loading` | `boolean` | Durante operaciones async de auth |
| `login(email, password)` | `Promise<{ok, error?}>` | Delega a `koopAuthProvider.signIn` |
| `register(...)` | `Promise<{ok, error?}>` | Delega a `koopAuthProvider.signUp` |
| `logout()` | `Promise<void>` | Limpia sesión local y en servidor |
| `refresh()` | `Promise<unknown>` | Renueva token |

Configura los interceptores de axios una sola vez al montar (`setupAxiosInterceptors`), usando refs para evitar closures stale sobre la sesión.

---

### `AccessProvider` — `apps/koop/src/context/AccessContext.jsx`

Contexto RBAC centralizado. Lee el usuario de `AuthContext` y expone permisos calculados.

**Matriz de permisos:**

| Recurso | admin | lawyer | client | user |
|---------|-------|--------|--------|------|
| expedientes | VCED | VCE- | V--- | V--- |
| tareas | VCED | VCE- | V--- | V--- |
| kanban | VCED | VCE- | ---- | ---- |
| actuaciones | VCED | VCE- | V--- | V--- |
| audiencias | VCED | VCE- | V--- | V--- |
| etapas | VCED | VCE- | V--- | V--- |
| usuarios | VCED | ---- | ---- | ---- |
| consultas | VCED | VCE- | ---- | ---- |

*V=view, C=create, E=edit, D=delete*

**Lo que provee `useAccess()`:**

| Campo / Método | Descripción |
|----------------|-------------|
| `role` | Rol resuelto: `'admin' \| 'lawyer' \| 'client' \| 'user' \| 'guest'` |
| `can(resource, action)` | Verificación genérica |
| `canView(resource)` | Atajo para `can(resource, 'view')` |
| `canCreate(resource)` | Atajo para `can(resource, 'create')` |
| `canEdit(resource)` | Atajo para `can(resource, 'edit')` |
| `canDelete(resource)` | Atajo para `can(resource, 'delete')` |
| `isAuthenticated` | Delegado de `AuthContext` |

---

### `RequireRole` — `apps/koop/src/components/RequireRole.jsx`

Componente de guarda de rutas. Redirige a `/login` si no está autenticado, o a `/dashboard` si el rol no está en la lista autorizada.

```jsx
<RequireRole roles={['admin', 'lawyer']}>
  <AdminTareas />
</RequireRole>
```

---

## 6. Capa de API (`apps/koop/src/api/`)

Todos los módulos usan la instancia axios configurada en `axios.js` (base URL desde `VITE_API_URL`, token Bearer automático vía interceptor, refresh transparente).

### Convención de respuesta del backend

El backend devuelve siempre un envelope para listas:

```json
{ "data": [...], "total": 50, "page": 1, "limit": 20 }
```

Todos los clientes API mapean `r.data → items` para que los hooks reciban `{ items, total, page, limit }`.

### Módulos

| Archivo | Funciones exportadas | Endpoints |
|---------|---------------------|-----------|
| `expedientes.js` | `listExpedientes`, `getExpediente`, `createExpediente`, `updateExpediente`, `deleteExpediente`, `listEtapas`, `createEtapa`, `updateEtapa`, `deleteEtapa` | `/expedientes`, `/expedientes/:id/etapas` |
| `actuaciones.js` | `listActuaciones`, `createActuacion`, `updateActuacion`, `deleteActuacion` | `/actuaciones?id_expediente=` (ruta plana) |
| `audiencias.js` | `listAudiencias`, `createAudiencia`, `updateAudiencia`, `deleteAudiencia` | `/audiencias?id_expediente=` (ruta plana) |
| `tareas.js` | `listTareas`, `getTarea`, `createTarea`, `updateTarea`, `deleteTarea`, `addComentario`, `listEstadosTarea`, `listPrioridades` | `/tareas`, `/catalogos/estados-tarea`, `/catalogos/prioridades` |
| `kanban.js` | `listTableros`, `getTablero`, `createTablero`, `updateTablero`, `deleteTablero`, `listColumnas`, `createColumna`, `updateColumna`, `deleteColumna`, `listPosiciones`, `updatePosiciones` | `/kanban/tableros`, `/kanban/tableros/:id/posiciones` |
| `catalogos.js` | `listProcSubtipoPretension`, `listRoles`, `listEstadosTarea`, `listPrioridades`, `listTiposActuacion` | `/catalogos/*` |
| `adminUsers.js` | `listUsers`, `createUser`, `updateUser`, `deleteUser` | `/users` |
| `auth.js` | `loginApi`, `logoutApi`, `registerApi`, `refreshApi` | `/auth/*` |

#### Parámetros de tareas — mapeo camelCase → Swagger

`tareas.js` incluye `toQueryParams()` que convierte los nombres de filtros del dominio a los parámetros de query reales del Swagger:

| Parámetro hook | Query param Swagger |
|----------------|---------------------|
| `ID_EXPEDIENTE` | `id_expediente` |
| `ID_USUARIO_ASIGNADO` | `id_asignado` |
| `ID_ESTADO_TAREA` | `id_estado` |
| `vencidas` | `vencidas` |

#### Kanban batch update

El endpoint `PUT /kanban/tableros/:id/posiciones` recibe el lote completo de posiciones en una sola llamada:

```json
{
  "posiciones": [
    { "_id": "...", "ID_COLUMNA": "...", "ORDEN_VERTICAL": 0 },
    { "_id": "...", "ID_COLUMNA": "...", "ORDEN_VERTICAL": 1 }
  ]
}
```

El hook `useKanban` construye el lote internamente en `moverTarea()` antes de llamar al cliente.

---

## 7. Hooks de aplicación (`apps/koop/src/hooks/`)

Thin wrappers que inyectan los clientes axios concretos en los hooks base de `@repo/hooks`:

| Hook app | Hook base | Cliente inyectado |
|----------|-----------|-------------------|
| `useExpedientesKoop.js` | `useExpedientes` | `expedientesApiClient` de `api/expedientes.js` |
| `useTareasKoop.js` | `useTareasKoop` | `tareasApiClient` de `api/tareas.js` |
| `useActuaciones.js` | `useActuaciones` | `actuacionesApiClient` de `api/actuaciones.js` |
| `useAudiencias.js` | `useAudiencias` | `audienciasApiClient` de `api/audiencias.js` |
| `useKanban.js` | `useKanban` | `kanbanApiClient` de `api/kanban.js` |
| `useAdminTasks.js` | — (standalone) | Llama directamente a `api/tareas.js` y `api/adminUsers.js` |

### `useAdminTasks` (standalone)

Hook de orquestación para la página AdminTareas. Gestiona todo el estado del módulo de tareas administrativas:

- Carga en paralelo usuarios, estados, prioridades y tareas (`Promise.all`)
- Mapea tareas del backend al shape UI mediante `toTask(tarea, estados, prioridades, users)`
- Expone acciones CRUD: `handleCreateTask`, `handleEditTask`, `handleDeleteTask`
- `handleStatusChange`: encuentra el estado en el catálogo por nombre y llama `updateTarea`
- Filtrado local: por asignado (`viewMine`), estado, y búsqueda de texto libre
- Notificaciones con auto-dismiss (éxito: 5s, error: 7s)

---

## 8. Páginas implementadas

### `/admin/expedientes` — Expedientes

Lista paginada de expedientes con:

- **Selector en cascada** (`CascadeSelector`): filtra Tipo de proceso → Subtipo → Tipo de pretensión usando el catálogo `/catalogos/proc-subtipo-pretension`. Los tres niveles se derivan mediante `useMemo` del arreglo plano de `TipoProcSubtipoProcTipoPre`.
- **Búsqueda server-side** con debounce de 400ms.
- **Paginación** con tamaño de página 20 (`PAGE_SIZE`), botones prev/next y total de resultados.
- CRUD completo (crear, editar, eliminar) con modal de confirmación.
- Acceso controlado con `useAccess()`.

### `/admin/expedientes/:id` — Detalle de Expediente

Cuatro tabs:

| Tab | Fuente de datos | Funcionalidad |
|-----|----------------|---------------|
| Actuaciones | `useActuaciones` (hook base) | Listado + CRUD |
| Audiencias | `useAudiencias` (hook base) | Listado + CRUD |
| Etapas | API directa (`api/expedientes.js`) | CRUD con estado local `etapaList` |
| Tareas | `useTareasKoop({ initialFilters: { ID_EXPEDIENTE } })` | Listado filtrado por expediente |

Botones de edición/eliminación visibles solo si `canEdit('expedientes')` / `canDelete('expedientes')`.

### `/admin/kanban` — Tablero Kanban

- Selector de tableros (`TableroSelector`) con opción de crear nuevo (`CreateTableroModal`).
- Columnas renderizadas horizontalmente con scroll.
- Tarjetas arrastrables con HTML5 DnD (`useDnD` hook interno): `draggable`, `onDragStart`, `onDragOver`, `onDrop`.
- Al soltar una tarjeta se llama `moverTarea(tareaId, nuevaColumnaId)` que envía el batch completo al backend.
- Indicador de límite WIP por columna.
- Acceso restringido a `admin` y `lawyer`.

### `/admin/tareas` — Administración de Tareas

- Grid de tarjetas con prioridad, estado, fecha límite y asignado.
- Selector de estado inline por tarjeta.
- Modal de creación/edición con campos dinámicos: prioridades y estados cargados desde catálogos.
- Filtros: "mis tareas" / todas, estado, búsqueda de texto.
- Acceso restringido a `admin` y `lawyer`.

### `/admin/usuarios` — Administración de Usuarios

- Tabla de usuarios con roles.
- Roles cargados dinámicamente desde `/catalogos/roles`.
- Acceso exclusivo para `admin`.

### `/admin/clientes-activos` — Clientes Activos

- Vista de clientes con expedientes activos.
- Acceso exclusivo para `admin`.

---

## 9. Control de acceso (RBAC)

### Flujo de resolución de rol

```
JWT (backend) → KoopCustomApiProvider.normalizeRoles()
             → AuthSession.user.roles
             → AuthProvider mapea a KoopUser.roles
             → AccessProvider.resolveRole() → rol único ('admin' | 'lawyer' | 'client' | 'user' | 'guest')
             → useAccess().role
```

La resolución es por prioridad: `admin > lawyer > client > user`. Un usuario con múltiples roles obtiene siempre el de mayor privilegio.

### Protección de rutas

```jsx
// Solo admin:
<RequireRole roles={['admin']}><AdminUsuarios /></RequireRole>

// Admin o lawyer:
const AdminLawyerRoute = ({ children }) => (
  <RequireRole roles={['admin', 'lawyer']}>{children}</RequireRole>
);
```

### Protección de acciones dentro de páginas

```jsx
const { canEdit, canDelete } = useAccess();

{canEdit('expedientes') && <button onClick={() => openEditModal(exp)}>Editar</button>}
{canDelete('expedientes') && <button onClick={() => openDeleteModal(exp)}>Eliminar</button>}
```

---

## 10. Modelos de dominio

### Tipos clave de `@repo/koop-models`

```ts
// Envelope de paginación
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Expediente
interface Expediente {
  _id: string;
  RADICADO: string;
  DESCRIPCION?: string;
  ID_TIPO_PROCESO?: string | TipoProceso;
  ID_SUBTIPO_PROCESO?: string | SubtipoProceso;
  ID_TIPO_PRETENSION?: string | TipoPretension;
  ID_ESTADO?: string;
  FECHA_INICIO?: string;
  // ...
}

// Tarea
interface TareaKoop {
  _id: string;
  TITULO: string;
  DESCRIPCION?: string;
  OBSERVACIONES?: string;
  FECHA_LIMITE?: string;
  ID_ESTADO_TAREA?: string | EstadoTarea;
  ID_PRIORIDAD?: string | Prioridad;
  ID_USUARIO_ASIGNADO?: string | KoopUser;
  // ...
}

// Kanban — batch update
interface PosicionUpdate {
  _id: string;
  ID_COLUMNA: string;
  ORDEN_VERTICAL: number;
}
```

### Catálogo de tipo de proceso en cascada

```ts
interface TipoProcSubtipoProcTipoPre {
  _id: string;
  NOMBRE_TIPO_PROCESO: string;
  NOMBRE_SUBTIPO_PROCESO: string;
  NOMBRE_TIPO_PRETENSION: string;
  // IDs opcionales para referencias
}
```

El frontend extrae los tres niveles únicos con `useMemo` sobre este arreglo plano, evitando tres llamadas separadas al catálogo.

---

## 11. Convenciones de datos con el backend

| Convención | Detalle |
|------------|---------|
| Envelope de lista | `{ data: T[], total, page, limit }` — la capa API mapea `data → items` |
| Nombres de campos | `SCREAMING_SNAKE_CASE` en backend y modelos; `camelCase` en el shape UI de los hooks |
| Rutas planas | `actuaciones` y `audiencias` usan rutas planas con query param `?id_expediente=` (no rutas anidadas) |
| Kanban batch | `PUT /kanban/tableros/:id/posiciones` recibe el lote completo; nunca updates individuales |
| IDs | Siempre `_id` (MongoDB ObjectId como string) |
| Fechas | ISO 8601; los hooks truncan a `YYYY-MM-DD` para campos `<input type="date">` |
| Referencias pobladas | Los campos `ID_*` pueden ser string u objeto poblado; los hooks usan `campo?._id ?? campo` |

---

## 12. Tests

Los tests viven en `packages/hooks/src/api/koop/__tests__/` y usan **Vitest ^3.2.0**.

| Archivo de test | Hook cubierto | Qué verifica |
|-----------------|--------------|--------------|
| `useExpedientes.test.ts` | `useExpedientes` | CRUD, paginación, etapas |
| `useKanban.test.ts` | `useKanban` | `moverTarea` construye batch correcto, `reordenarPosiciones` |
| `useTareasKoop.test.ts` | `useTareasKoop` | Filtros, CRUD, mapeo de params |
| `useActuaciones.test.ts` | `useActuaciones` | Listado por expediente |
| `useAudiencias.test.ts` | `useAudiencias` | Listado por expediente |

Los mocks de clientes API se generan desde `@repo/koop-models/__mocks__/`.

```sh
# Ejecutar tests de hooks
pnpm --filter @repo/hooks test

# Ejecutar tests de modelos
pnpm --filter @repo/koop-models test
```

---

## 13. Flujo de datos end-to-end

Ejemplo: usuario admin mueve una tarjeta en el Kanban.

```
[Usuario arrastra tarjeta]
        ↓
KanbanCard.onDrop
        ↓
useDnD.handleDrop(tareaId, columnaId)
        ↓
useKanban.moverTarea(tareaId, columnaId)  ← hook en @repo/hooks
        ↓
  construye batch: toma posiciones actuales,
  actualiza la tarjeta movida, recalcula ORDEN_VERTICAL
        ↓
client.updatePosiciones(tableroId, batch) ← interfaz KanbanApiClient
        ↓
kanbanApiClient.updatePosiciones(...)     ← implementación en apps/koop/src/api/kanban.js
        ↓
axios.put('/kanban/tableros/:id/posiciones', { posiciones: [...] })
        ↓
Backend REST KOOP
        ↓
Respuesta → setColumnas() / setPosiciones() → re-render del tablero
```

Ejemplo: login de usuario.

```
[Usuario envía form de login]
        ↓
AuthContext.login(email, password)
        ↓
koopAuthProvider.signIn(credentials)  ← KoopCustomApiProvider
        ↓
loginApi({ email, password })         ← api/auth.js (axios)
        ↓
POST /auth/login → { accessToken, user }
        ↓
decodeJwt(accessToken) + normalizeRoles(roles)
        ↓
buildAuthSession() → AuthSession
        ↓
setSession(authSession)               ← useAuthSession (@repo/auth)
        ↓
sessionStorage                        ← @repo/persistence
        ↓
AuthContext re-render → isAuthenticated = true
        ↓
AccessProvider.resolveRole() → role = 'admin' | 'lawyer' | ...
        ↓
RequireRole deja pasar → página protegida visible
```
