/**
 * Re-exporta useActiveClients de @repo/hooks inyectando el cliente axios de koop.
 */
import { useActiveClients as useActiveClientsBase } from '@repo/hooks';
import { useAuth } from '../context/AuthContext';
import { listActiveClients, updateClient, assignClientAdmin, deleteClient } from '../api/clients';
import { listUsers } from '../api/adminUsers';
import { listRecentDocs } from '../api/docs';

const activeClientsApiClient = {
  listActiveClients,
  updateClient,
  assignClientAdmin,
  deleteClient,
  listUsers,
  listRecentDocs,
};

export function useActiveClients() {
  const { user } = useAuth();
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.roles].filter(Boolean);
  const isAdmin = roles.some((r) => String(r || '').toLowerCase() === 'admin');
  return useActiveClientsBase(activeClientsApiClient, isAdmin);
}
