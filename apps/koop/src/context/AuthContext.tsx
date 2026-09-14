import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useEffect,
  type PropsWithChildren,
} from 'react';
import { useAuthSession } from '@repo/auth';
import { refreshApi } from '../api/auth';
import { koopAuthProvider, normalizeRoles } from '../auth/KoopCustomApiProvider';
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

// normalizeRoles (con el alias de roles en espanol -> admin/lawyer/client/user)
// vive en KoopCustomApiProvider.ts. Antes habia una segunda copia aqui, sin el
// alias, que sobreescribia la normalizacion ya hecha al hacer login: el rol
// terminaba resuelto como 'user' para cualquier usuario real (super_admin,
// socio, abogado...). Se importa la unica implementacion en vez de duplicarla.

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
      const authSession = await koopAuthProvider.signIn({ email, password });
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
      const authSession = await koopAuthProvider.signUp(name, email, password, roles);
      if (authSession) setSession(authSession);
      return { ok: true, data: authSession ? { accessToken: authSession.accessToken } : undefined };
    } catch (err: unknown) {
      return { ok: false, error: (err as Error).message };
    } finally {
      loadingRef.current = false;
    }
  };

  const logout = async () => {
    await koopAuthProvider.signOut();
    clearSession();
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

  // Configurar interceptores de axios una sola vez. Se hace en el cuerpo del
  // render (guardado por un ref), NO dentro de un useEffect: los efectos de
  // componentes hijos (p.ej. el fetch inicial de la pagina de Expedientes)
  // se disparan antes que los efectos de este provider (React corre los
  // useEffect de abajo hacia arriba). Si el interceptor se registraba en un
  // useEffect de aqui, la primera tanda de peticiones en una carga en frio
  // salia sin el header Authorization -> 401 "No autenticado" aunque hubiera
  // sesion valida en sessionStorage.
  const interceptorsReady = useRef(false);
  if (!interceptorsReady.current) {
    setupAxiosInterceptors({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      setAccessToken: (newToken: string) => {
        const current = sessionRef.current;
        if (current) setSessionRef.current({ ...current, accessToken: newToken });
      },
      onLogout: () => logoutRef.current(),
    });
    interceptorsReady.current = true;
  }

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
