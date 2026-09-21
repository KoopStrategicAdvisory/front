import type { AuthProvider, AuthSession } from '@repo/auth';
import type { KoopRole } from '@repo/types';
import { loginApi, logoutApi, refreshApi, registerApi } from '../api/auth';

interface KoopCredentials {
  email: string;
  password: string;
}

const ALLOWED_ROLES: KoopRole[] = ['admin', 'lawyer', 'user', 'client'];

// El catalogo real de roles (seed.sql, generado desde el Excel) quedo en
// espanol: admin, super_admin, socio, abogado, asociado, junior, paralegal,
// secretario, contador, cliente, emprendedor. El front (RBAC en
// AccessContext) solo entiende 4 buckets genericos en ingles. Sin este
// alias, un usuario real (p.ej. roles ['super_admin','socio']) caia siempre
// en el default 'user' porque ninguno de esos nombres coincidia con
// ALLOWED_ROLES, perdiendo todo permiso de admin/abogado en la UI. Ajusta
// este mapa si cambian los nombres de roles en la base de datos (debe
// reflejar ROLE_ALIASES en back/src/middleware/auth.js).
const ROLE_ALIASES: Record<string, KoopRole> = {
  admin: 'admin',
  super_admin: 'admin',
  lawyer: 'lawyer',
  abogado: 'lawyer',
  socio: 'lawyer',
  asociado: 'lawyer',
  junior: 'lawyer',
  paralegal: 'lawyer',
  client: 'client',
  cliente: 'client',
  user: 'user',
};

export function normalizeRoles(value: unknown, defaultRole: KoopRole = 'user'): KoopRole[] {
  const safeDefault: KoopRole = ALLOWED_ROLES.includes(defaultRole) ? defaultRole : 'user';
  const roles = Array.isArray(value) ? value : [value];
  const normalized = roles
    .map((r) => ROLE_ALIASES[String(r || '').trim().toLowerCase()])
    .filter((r): r is KoopRole => Boolean(r) && ALLOWED_ROLES.includes(r));
  if (normalized.includes('admin')) return ['admin'];
  if (normalized.includes('lawyer')) return ['lawyer'];
  if (normalized.includes('client')) return ['client'];
  if (normalized.includes('user')) return ['user'];
  return [safeDefault];
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const binario = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    // atob entrega bytes, no texto: sin decodificarlos como UTF-8 los nombres con
    // tilde o ñ (María, Ñañez) se veían dañados (MARAA) en toda la aplicación.
    const json = new TextDecoder('utf-8').decode(Uint8Array.from(binario, (c) => c.charCodeAt(0)));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function buildAuthSession(accessToken: string, rawUser?: Record<string, unknown>): AuthSession {
  const payload = decodeJwt(accessToken);
  const src = payload ?? rawUser;
  return {
    accessToken,
    provider: 'custom-api',
    issuedAt: Date.now(),
    user: src
      ? {
          id: String(src.sub ?? src.id ?? ''),
          name: src.name ? String(src.name) : null,
          email: src.email ? String(src.email) : null,
          roles: normalizeRoles(src.roles),
          provider: 'custom-api',
          raw: rawUser,
        }
      : null,
  };
}

class KoopCustomApiProvider implements AuthProvider<KoopCredentials> {
  readonly name = 'custom-api';
  private session: AuthSession | null = null;

  async signIn(credentials: KoopCredentials): Promise<AuthSession> {
    const data = await loginApi({ email: credentials.email, password: credentials.password }) as { accessToken: string; user?: Record<string, unknown> };
    this.session = buildAuthSession(data.accessToken, data.user);
    return this.session;
  }

  async signOut(): Promise<void> {
    try {
      await logoutApi();
    } catch {
      // always clear local session even if server call fails
    } finally {
      this.session = null;
    }
  }

  async getSession(): Promise<AuthSession | null> {
    return this.session;
  }

  async getAccessToken(): Promise<string | null> {
    return this.session?.accessToken ?? null;
  }

  async isAuthenticated(): Promise<boolean> {
    return this.session !== null;
  }

  async signUp(
    name: string,
    email: string,
    password: string,
    extra?: { roles?: KoopRole[]; tipoDocumento?: string; numeroDocumento?: string; telefono?: string },
  ): Promise<AuthSession | null> {
    const data = await registerApi({
      name, email, password,
      tipoDocumento: extra?.tipoDocumento,
      numeroDocumento: extra?.numeroDocumento,
      telefono: extra?.telefono,
    }) as { accessToken?: string; user?: Record<string, unknown> };
    if (!data?.accessToken) return null;
    this.session = buildAuthSession(data.accessToken, data.user);
    return this.session;
  }

  async refresh(): Promise<AuthSession | null> {
    const data = await refreshApi() as { accessToken?: string; user?: Record<string, unknown> };
    if (data?.accessToken) {
      this.session = buildAuthSession(data.accessToken, data.user);
    }
    return this.session;
  }
}

export const koopAuthProvider = new KoopCustomApiProvider();
