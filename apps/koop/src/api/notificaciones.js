import api from './axios';
import { toListResponse } from './utils';

export async function listNotificaciones(idExpediente) {
  const params = idExpediente ? { id_expediente: idExpediente } : {};
  const response = await api.get('/notificaciones', { params });
  return toListResponse(response.data);
}

export async function getNotificacion(id) {
  const response = await api.get(`/notificaciones/${id}`);
  return response.data;
}

export async function createNotificacion(data) {
  const response = await api.post('/notificaciones', data);
  return response.data;
}

export async function updateNotificacion(id, data) {
  const response = await api.put(`/notificaciones/${id}`, data);
  return response.data;
}

export async function deleteNotificacion(id) {
  const response = await api.delete(`/notificaciones/${id}`);
  return response.data;
}

export async function listNotificacionesProximasVencer(dias) {
  const params = dias !== undefined ? { dias } : {};
  const response = await api.get('/notificaciones/proximas-vencer', { params });
  return toListResponse(response.data).items;
}
