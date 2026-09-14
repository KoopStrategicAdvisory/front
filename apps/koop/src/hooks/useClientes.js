import { useClientes as useClientesBase } from '@repo/hooks';
import { listClientes, getCliente, createCliente, updateCliente, deleteCliente } from '../api/clientes';

const clientesApiClient = {
  list: listClientes,
  get: getCliente,
  create: createCliente,
  update: updateCliente,
  delete: deleteCliente,
};

export function useClientes(options = {}) {
  return useClientesBase(clientesApiClient, options);
}
