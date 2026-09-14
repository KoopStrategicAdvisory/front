import api from './axios';
import { toListResponse } from './utils';

export async function listActuaciones(expedienteId, params = {}) {
  const response = await api.get('/actuaciones', { params: { id_expediente: expedienteId, ...params } });
  return toListResponse(response.data);
}

export async function createActuacion(data) {
  const response = await api.post('/actuaciones', data);
  return response.data;
}

export async function updateActuacion(id, data) {
  const response = await api.put(`/actuaciones/${id}`, data);
  return response.data;
}

export async function deleteActuacion(id) {
  const response = await api.delete(`/actuaciones/${id}`);
  return response.data;
}
