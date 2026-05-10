import React from 'react';
import { AuthSessionProvider } from '@repo/auth';

/**
 * Envuelve la app con el proveedor de sesión de @repo/auth.
 * La sesión se persiste en sessionStorage; el refresh automático via cookie HTTP-only
 * garantiza re-autenticación transparente al reabrir el navegador.
 */
export function KoopAuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>;
}
