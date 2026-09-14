import api from './axios';
import { toListResponse } from './utils';

export async function listTareas(params = {}) {
  const response = await api.get('/tareas', { params });
  return toListResponse(response.data);
}

export async function getTarea(id) {
  const response = await api.get(`/tareas/${id}`);
  return response.data;
}

export async function createTarea(data) {
  const response = await api.post('/tareas', data);
  return response.data;
}

export async function updateTarea(id, data) {
  const response = await api.put(`/tareas/${id}`, data);
  return response.data;
}

export async function deleteTarea(id) {
  const response = await api.delete(`/tareas/${id}`);
  return response.data;
}
