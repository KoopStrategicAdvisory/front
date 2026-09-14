import { useExpedientes as useExpedientesBase } from '@repo/hooks';
import {
  listExpedientes,
  getExpediente,
  createExpediente,
  updateExpediente,
  deleteExpediente,
  listEtapas,
} from '../api/expedientes';

const expedientesApiClient = {
  list: listExpedientes,
  get: getExpediente,
  create: createExpediente,
  update: updateExpediente,
  delete: deleteExpediente,
  listEtapas,
};

export function useExpedientes(options = {}) {
  return useExpedientesBase(expedientesApiClient, options);
}
