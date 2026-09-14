import api from './axios';
import { toListResponse } from './utils';

export async function listIterProcesal(idCombo) {
  const params = idCombo ? { id_combo: idCombo } : {};
  const response = await api.get('/iter-procesal', { params });
  return toListResponse(response.data).items;
}

export async function getIterProcesal(id) {
  const response = await api.get(`/iter-procesal/${id}`);
  return response.data;
}

export async function createIterProcesal(data) {
  const response = await api.post('/iter-procesal', data);
  return response.data;
}

export async function updateIterProcesal(id, data) {
  const response = await api.put(`/iter-procesal/${id}`, data);
  return response.data;
}

export async function deleteIterProcesal(id) {
  const response = await api.delete(`/iter-procesal/${id}`);
  return response.data;
}

export async function listTareasPlantilla(iterId) {
  const response = await api.get(`/iter-procesal/${iterId}/tareas`);
  return toListResponse(response.data).items;
}

export async function createTareaPlantilla(iterId, data) {
  const response = await api.post(`/iter-procesal/${iterId}/tareas`, data);
  return response.data;
}

export async function updateTareaPlantilla(iterId, tareaId, data) {
  const response = await api.put(`/iter-procesal/${iterId}/tareas/${tareaId}`, data);
  return response.data;
}

export async function deleteTareaPlantilla(iterId, tareaId) {
  const response = await api.delete(`/iter-procesal/${iterId}/tareas/${tareaId}`);
  return response.data;
}
