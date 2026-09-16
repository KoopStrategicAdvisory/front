import api from './axios';
import { toListResponse } from './utils';

export async function listExpedientes(params = {}) {
  const response = await api.get('/expedientes', { params });
  return toListResponse(response.data);
}

export async function getExpediente(id) {
  const response = await api.get(`/expedientes/${id}`);
  return response.data;
}

export async function createExpediente(data) {
  const response = await api.post('/expedientes', data);
  return response.data;
}

export async function updateExpediente(id, data) {
  const response = await api.put(`/expedientes/${id}`, data);
  return response.data;
}

export async function deleteExpediente(id) {
  const response = await api.delete(`/expedientes/${id}`);
  return response.data;
}

export async function listEtapas(expedienteId) {
  const response = await api.get(`/expedientes/${expedienteId}/etapas`);
  return toListResponse(response.data);
}

export async function createEtapa(expedienteId, data) {
  const response = await api.post(`/expedientes/${expedienteId}/etapas`, data);
  return response.data;
}

export async function updateEtapa(expedienteId, etapaId, data) {
  const response = await api.put(`/expedientes/${expedienteId}/etapas/${etapaId}`, data);
  return response.data;
}

export async function deleteEtapa(expedienteId, etapaId) {
  const response = await api.delete(`/expedientes/${expedienteId}/etapas/${etapaId}`);
  return response.data;
}

// Radicados publicos: un mismo expediente puede tener varios, uno por cada
// organismo externo donde exista (Rama Judicial, Fiscalia, Publicaciones
// Procesales, SIUGJ, SuperFinanciera...).
export async function listRadicadosPublicos(expedienteId) {
  const response = await api.get(`/expedientes/${expedienteId}/radicados-publicos`);
  return response.data;
}

export async function createRadicadoPublico(expedienteId, data) {
  const response = await api.post(`/expedientes/${expedienteId}/radicados-publicos`, data);
  return response.data;
}

export async function deleteRadicadoPublico(expedienteId, radicadoId) {
  const response = await api.delete(`/expedientes/${expedienteId}/radicados-publicos/${radicadoId}`);
  return response.data;
}
