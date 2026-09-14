import { useNotificaciones as useNotificacionesBase } from '@repo/hooks';
import {
  listNotificaciones,
  getNotificacion,
  createNotificacion,
  updateNotificacion,
  deleteNotificacion,
  listNotificacionesProximasVencer,
} from '../api/notificaciones';

const notificacionesApiClient = {
  list: listNotificaciones,
  get: getNotificacion,
  create: createNotificacion,
  update: updateNotificacion,
  delete: deleteNotificacion,
  proximasVencer: listNotificacionesProximasVencer,
};

export function useNotificaciones() {
  return useNotificacionesBase(notificacionesApiClient);
}
