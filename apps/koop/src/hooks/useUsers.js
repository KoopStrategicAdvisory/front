import { useEffect, useState } from 'react';
import { useUsers as useUsersBase } from '@repo/hooks';
import { useAuth } from '../context/AuthContext';
import { listUsers, getUser, createUser, updateUser, deleteUser, addRole, removeRole } from '../api/users';
import { listRoles } from '../api/catalogos';

const usersApiClient = {
  list: listUsers,
  get: getUser,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
  addRole,
  removeRole,
};

export function useUsers() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
  const isAdmin = roles.some((r) => String(r || '').toLowerCase() === 'admin');
  const base = useUsersBase(usersApiClient, isAdmin);

  const [roleOptions, setRoleOptions] = useState([]);

  useEffect(() => {
    if (!isAdmin) return;
    listRoles().then(setRoleOptions).catch(() => {});
  }, [isAdmin]);

  return { ...base, roleOptions, isAdmin };
}
