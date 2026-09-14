import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

// ─── Permissions matrix ───────────────────────────────────────────────────────
// Each key is a resource; values define what each role can do.
const PERMISSIONS = {
  expedientes: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    user:   { view: true, create: false, edit: false, delete: false },
  },
  tareas: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    user:   { view: true, create: false, edit: false, delete: false },
  },
  kanban: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: false, create: false, edit: false, delete: false },
    user:   { view: false, create: false, edit: false, delete: false },
  },
  actuaciones: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    user:   { view: true, create: false, edit: false, delete: false },
  },
  audiencias: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    user:   { view: true, create: false, edit: false, delete: false },
  },
  etapas: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: true, create: false, edit: false, delete: false },
    user:   { view: true, create: false, edit: false, delete: false },
  },
  usuarios: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: false, create: false, edit: false, delete: false },
    client: { view: false, create: false, edit: false, delete: false },
    user:   { view: false, create: false, edit: false, delete: false },
  },
  consultas: {
    admin:  { view: true, create: true, edit: true, delete: true },
    lawyer: { view: true, create: true, edit: true, delete: false },
    client: { view: false, create: false, edit: false, delete: false },
    user:   { view: false, create: false, edit: false, delete: false },
  },
};

const AccessContext = createContext(null);

function resolveRole(user) {
  if (!user) return 'guest';
  const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : []);
  const normalized = roles.map((r) => String(r || '').trim().toLowerCase());
  if (normalized.includes('admin')) return 'admin';
  if (normalized.includes('lawyer')) return 'lawyer';
  if (normalized.includes('client')) return 'client';
  return 'user';
}

export function AccessProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const value = useMemo(() => {
    const role = resolveRole(user);

    const can = (resource, action) => {
      if (!isAuthenticated) return false;
      return PERMISSIONS[resource]?.[role]?.[action] ?? false;
    };

    const canView = (resource) => can(resource, 'view');
    const canCreate = (resource) => can(resource, 'create');
    const canEdit = (resource) => can(resource, 'edit');
    const canDelete = (resource) => can(resource, 'delete');

    return { role, can, canView, canCreate, canEdit, canDelete, isAuthenticated };
  }, [user, isAuthenticated]);

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}

export function useAccess() {
  const ctx = useContext(AccessContext);
  if (!ctx) throw new Error('useAccess must be used inside AccessProvider');
  return ctx;
}
