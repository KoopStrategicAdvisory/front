import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAccess } from '../context/AccessContext';

/**
 * Renders children only if the user has one of the allowed roles.
 * Otherwise redirects to `redirectTo` (default: /dashboard).
 *
 * Usage: <RequireRole roles={['admin', 'lawyer']}><Page /></RequireRole>
 */
export default function RequireRole({ roles, children, redirectTo = '/dashboard' }) {
  const { role, isAuthenticated } = useAccess();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
