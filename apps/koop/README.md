# koop

Aplicación de producción de [Koop Strategic Advisory](https://koopstrategicadvisory.com). SPA construida en React 18 + JSX sobre Vite, integrada en el monorepo pnpm + Turbo.

---

## Arquitectura

### Stack

| Capa | Tecnología |
|---|---|
| Framework | React 18 (JSX) |
| Bundler | Vite 5 |
| Enrutado | React Router DOM 6 |
| Estado global | **Zustand** via `@repo/koop-store` |
| Autenticación | `@repo/auth` + `KoopCustomApiProvider` |
| Componentes específicos | `@repo/koop-ui` |
| Componentes globales | `@repo/ui` |
| Tipos de dominio | `@repo/types` |
| Hooks de API | `@repo/hooks` (DI pattern) |
| HTTP | Axios con interceptores para refresh automático por cookie HTTP-only |

---

## Paquetes del monorepo

### `@repo/koop-store` — Estado global (Zustand)

Zustand stores con persistencia en localStorage.

```
packages/koop-store/src/stores/
  authStore.ts      — KoopUser, accessToken, isAuthenticated (persist: koop.auth)
  calendarStore.ts  — KoopCalendarEvent[] (persist: koop.calendar.events)
  uiStore.ts        — notice global, globalLoading
```

```js
import { useAuthStore, useCalendarStore, useUiStore } from '@repo/koop-store';
```

### `@repo/koop-ui` — Componentes UI específicos de koop

| Componente | Descripción |
|---|---|
| `CalendarWidget` | Selector de fecha con marcadores de eventos |
| `EditForm / EditRow / EditField / EditTextArea / EditSelect` | Primitivos de formulario |
| `KpiCard` | Tarjeta de métrica (label, valor, hint) |
| `SiteFooter` | Pie de página con variantes `marketing` y `simple` |

```js
import { CalendarWidget, KpiCard, SiteFooter, EditForm, EditField } from '@repo/koop-ui';
```

### `@repo/auth` — Autenticación

El proveedor de autenticación es `KoopCustomApiProvider` (`src/auth/KoopCustomApiProvider.ts`), que implementa la interfaz `AuthProvider` de `@repo/auth` usando la API HTTP de koop con `credentials: 'include'` para cookies HTTP-only.

| Método | Endpoint |
|---|---|
| `signIn({ email, password })` | `POST /auth/login` |
| `signOut()` | `POST /auth/logout` |
| `signUp(name, email, password, roles?)` | `POST /auth/register` |
| `refresh()` | `POST /auth/refresh` |

El proveedor es un singleton (`koopAuthProvider`) que `AuthContext.tsx` consume para mantener la sesión en `AuthSessionProvider` de `@repo/auth`.

El interceptor de Axios (`src/api/axios.js`) maneja el refresco transparente: 401 → `POST /auth/refresh` → reintenta la solicitud original.

**Árbol de providers en `App.jsx`:**
```
<KoopAuthProvider>       ← AuthSessionProvider (@repo/auth) — session en sessionStorage
  <AuthProvider>         ← AuthContext de koop (usa koopAuthProvider)
    <FontProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </FontProvider>
  </AuthProvider>
</KoopAuthProvider>
```

**Hook de consumo:**
```js
const { user, isAuthenticated, login, logout, register } = useAuth();
```

### `@repo/hooks` — Hooks de API (DI pattern)

Los hooks base viven en `packages/hooks/src/api/koop/` y aceptan un cliente como parámetro. Los wrappers en `apps/koop/src/hooks/` proveen el cliente axios concreto:

```
src/hooks/
  useTasks.js          ← useTasksBase + tasksApiClient (axios)
  useActiveClients.js  ← useActiveClientsBase + clientsApiClient (axios)
  useAdminUsers.js     ← useAdminUsersBase + adminUsersApiClient (axios)
  useCalendarEvents.js ← useCalendarStore (@repo/koop-store)
```

### `@repo/types` — Tipos de dominio

```
packages/types/src/koop/
  user.ts      → KoopUser, KoopRole
  client.ts    → KoopClient, AssignedAdmin
  task.ts      → KoopTask, TaskStatus, TaskPriority, TaskFilters, TaskPagination, TaskStats
  document.ts  → KoopDocument
  calendar.ts  → KoopCalendarEvent, CalendarEventAudience
```

---

## Estructura de la app

```
apps/koop/src/
  api/            — Clientes axios por dominio (auth, tasks, clients, docs, adminUsers)
  auth/
    KoopAuthProvider.tsx       — Wrapper de AuthSessionProvider (@repo/auth)
    KoopCustomApiProvider.ts   — Implementación de AuthProvider para la API de koop
  components/
    common/
      Notice.jsx               — Re-exporta desde @repo/ui
  context/
    AuthContext.tsx            — AuthProvider + useAuth() hook
  hooks/          — Thin wrappers sobre @repo/hooks y @repo/koop-store
  pages/
    static/       — Páginas informativas (Derecho, Contabilidad, Auditoria…)
    dinamic/      — Páginas del portal protegido (Dashboard, AdminTareas, ClientesActivos…)
```

---

## Scripts

```bash
pnpm dev        # Servidor de desarrollo (Vite)
pnpm build      # Build de producción
pnpm preview    # Preview del build
pnpm lint       # ESLint sobre src/**/*.{js,jsx}
pnpm deploy     # Build + despliegue a GitHub Pages
```

## Variables de entorno

| Variable | Default en dev | Descripción |
|---|---|---|
| `VITE_API_BASE` | `/api` | Base URL de la API de koop |

En desarrollo Vite proxifica `/api` al backend local (ver `vite.config.js`).

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Público | Home marketing |
| `/derecho`, `/contabilidad`, etc. | Público | Páginas de áreas de práctica |
| `/login`, `/register`, `/logout` | Público | Autenticación |
| `/dashboard` | Protegido | Dashboard admin/user según rol |
| `/mi-expediente`, `/mis-casos` | Protegido | Portal de cliente |
| `/panel` | Protegido | Panel general |
| `/admin/usuarios` | Admin/Lawyer | Gestión de usuarios |
| `/admin/clientes-activos` | Admin/Lawyer | Lista de clientes activos |
| `/admin/tareas` | Admin/Lawyer | Gestión de tareas |
