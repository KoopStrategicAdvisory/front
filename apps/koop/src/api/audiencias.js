import api from './axios';
import { toListResponse } from './utils';

export async function listAudiencias(expedienteId, params = {}) {
  const response = await api.get('/audiencias', { params: { id_expediente: expedienteId, ...params } });
  return toListResponse(response.data);
}

export async function createAudiencia(data) {
  const response = await api.post('/audiencias', data);
  return response.data;
}

export async function updateAudiencia(id, data) {
  const response = await api.put(`/audiencias/${id}`, data);
  return response.data;
}

export async function deleteAudiencia(id) {
  const response = await api.delete(`/audiencias/${id}`);
  return response.data;
}
