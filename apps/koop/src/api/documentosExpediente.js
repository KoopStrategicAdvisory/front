import api from './axios';
import { toListResponse } from './utils';

// Metadata formal de documentos de expediente (`/documentos`) — distinto de la bóveda
// S3 de archivos del cliente en `api/docs.js` / `useMiExpediente`.
export async function listDocumentos(params = {}) {
  const response = await api.get('/documentos', { params });
  return toListResponse(response.data);
}

export async function getDocumento(id) {
  const response = await api.get(`/documentos/${id}`);
  return response.data;
}

export async function createDocumento(data) {
  const response = await api.post('/documentos', data);
  return response.data;
}

export async function updateDocumento(id, data) {
  const response = await api.put(`/documentos/${id}`, data);
  return response.data;
}

export async function deleteDocumento(id) {
  const response = await api.delete(`/documentos/${id}`);
  return response.data;
}
