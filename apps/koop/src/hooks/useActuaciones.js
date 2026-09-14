import { useActuaciones as useActuacionesBase } from '@repo/hooks';
import {
  listActuaciones,
  createActuacion,
  updateActuacion,
  deleteActuacion,
} from '../api/actuaciones';

const actuacionesApiClient = {
  list: listActuaciones,
  create: createActuacion,
  update: updateActuacion,
  delete: deleteActuacion,
};

export function useActuaciones(expedienteId) {
  return useActuacionesBase(actuacionesApiClient, expedienteId);
}
