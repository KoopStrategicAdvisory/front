import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
  type PropsWithChildren,
} from 'react';
import { useAuthSession, type AuthSession } from '@repo/auth';
import { loginApi, registerApi, logoutApi, refreshApi } from '../api/auth';
import { setupAxiosInterceptors } from '../api/axios';
import type { KoopUser, KoopRole } from '@repo/types';

interface AuthContextValue {
  accessToken: string | null;
  user: KoopUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    roles?: KoopRole[]
  ) => Promise<{ ok: boolean; error?: string; data?: unknown }>;
  logout: () => Promise<void>;
  refresh: () => Promise<unknown>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildKoopUser(
  jwtPayload: Record<string, unknown> | null,
  fallback?: Record<string, unknown> | null
): KoopUser | null {
  const src = jwtPayload ?? fallback;
  if (!src) return null;
  return {
    id: String(src.sub ?? src.id ?? ''),
    name: String(src.name ?? ''),
    email: String(src.email ?? ''),
    roles: normalizeRoles(src.roles),
    active: src.active !== false,
    driveFolders: Array.isArray(src.driveFolders) ? (src.driveFolders as string[]) : [],
  };
}

function sessionFromLoginResponse(
  accessToken: string,
  rawUser?: Record<string, unknown>
): AuthSession {
  const payload = decodeJwt(accessToken);
  const user = buildKoopUser(payload, rawUser);
  return {
    accessToken,
    provider: 'custom-api',
    issuedAt: Date.now(),
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          provider: 'custom-api',
          raw: rawUser,
        }
      : null,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const { session, setSession, clearSession } = useAuthSession();
  const loadingRef = useRef(false);

  const accessToken = session?.accessToken ?? null;
  const isAuthenticated = !!accessToken;

  const user = useMemo<KoopUser | null>(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      roles: normalizeRoles(session.user.roles),
      active: true,
      driveFolders: [],
    };
  }, [session]);

  const login = async (email: string, password: string) => {
    loadingRef.current = true;
    try {
      const data = await loginApi({ email, password });
      const authSession = sessionFromLoginResponse(data.accessToken, data.user);
      setSession(authSession);
      return { ok: true };
    } catch (err: unknown) {
      return { ok: false, error: (err as Error).message };
    } finally {
      loadingRef.current = false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    roles?: KoopRole[]
  ) => {
    loadingRef.current = true;
    try {
      const hasRoles = Array.isArray(roles) && roles.length > 0;
      const data = await registerApi({
        name,
        email,
        password,
        roles: hasRoles ? normalizeRoles(roles) : undefined,
      });
      if (data?.accessToken) {
        const authSession = sessionFromLoginResponse(data.accessToken, data.user);
        setSession(authSession);
      }
      return { ok: true, data };
    } catch (err: unknown) {
      return { ok: false, error: (err as Error).message };
    } finally {
      loadingRef.current = false;
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // no bloquear el cierre local si el servidor falla
    } finally {
      clearSession();
    }
  };

  // Ref siempre actualizado para que los interceptores de axios no capturen sesión stale
  const sessionRef = useRef(session);
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const setSessionRef = useRef(setSession);
  useEffect(() => {
    setSessionRef.current = setSession;
  }, [setSession]);

  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Configurar interceptores de axios una sola vez
  const interceptorsReady = useRef(false);
  useEffect(() => {
    if (interceptorsReady.current) return;
    setupAxiosInterceptors({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      setAccessToken: (newToken: string) => {
        const current = sessionRef.current;
        if (current) setSessionRef.current({ ...current, accessToken: newToken });
      },
      onLogout: () => logoutRef.current(),
    });
    interceptorsReady.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      isAuthenticated,
      loading: loadingRef.current,
      login,
      register,
      logout,
      refresh: refreshApi,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [accessToken, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
