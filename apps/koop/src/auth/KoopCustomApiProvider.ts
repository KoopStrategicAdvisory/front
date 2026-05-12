import type { AuthProvider, AuthSession } from '@repo/auth';
import type { KoopRole } from '@repo/types';
import { loginApi, logoutApi, refreshApi, registerApi } from '../api/auth';

interface KoopCredentials {
  email: string;
  password: string;
}

const ALLOWED_ROLES: KoopRole[] = ['admin', 'lawyer', 'user', 'client'];

function normalizeRoles(value: unknown, defaultRole: KoopRole = 'user'): KoopRole[] {
  const safeDefault: KoopRole = ALLOWED_ROLES.includes(defaultRole) ? defaultRole : 'user';
  const roles = Array.isArray(value) ? value : [value];
  const normalized = roles
    .map((r) => String(r || '').trim().toLowerCase() as KoopRole)
    .filter((r) => ALLOWED_ROLES.includes(r));
  if (normalized.includes('admin')) return ['admin'];
  if (normalized.includes('lawyer')) return ['lawyer'];
  if (normalized.includes('client')) return ['client'];
  if (normalized.includes('user')) return ['user'];
  return [safeDefault];
}

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
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
    roles?: KoopRole[],
  ): Promise<AuthSession | null> {
    const data = await registerApi({ name, email, password, roles }) as { accessToken?: string; user?: Record<string, unknown> };
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
