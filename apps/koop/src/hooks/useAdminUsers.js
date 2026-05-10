/**
 * Re-exporta useAdminUsers de @repo/hooks inyectando el cliente axios de koop.
 */
import { useAdminUsers as useAdminUsersBase, ROLE_OPTIONS } from '@repo/hooks';
import { useAuth } from '../context/AuthContext';
import { listUsers, setUserActive, deleteUser, setUserRole } from '../api/adminUsers';
import { createClientFromUser } from '../api/clients';

export { ROLE_OPTIONS };

const adminUsersApiClient = {
  listUsers,
  setUserActive,
  deleteUser,
  setUserRole,
  createClientFromUser,
};

export function useAdminUsers() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
  const isAdmin = roles.some((r) => String(r || '').toLowerCase() === 'admin');
  return useAdminUsersBase(adminUsersApiClient, isAdmin);
}

// Mantener compatibilidad con importaciones directas de normalizeRoles
export function normalizeRoles(value, { defaultRole = 'user' } = {}) {
  const ALLOWED = ['admin', 'lawyer', 'client', 'user'];
  const roles = Array.isArray(value) ? value : [value];
  const normalized = roles.map((r) => String(r || '').trim().toLowerCase()).filter((r) => ALLOWED.includes(r));
  if (normalized.includes('admin')) return ['admin'];
  if (normalized.includes('lawyer')) return ['lawyer'];
  if (normalized.includes('client')) return ['client'];
  if (normalized.includes('user')) return ['user'];
  return [defaultRole];
}
