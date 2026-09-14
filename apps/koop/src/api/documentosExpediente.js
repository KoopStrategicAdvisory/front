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

// El backend espera multipart/form-data con el archivo real (antes solo
// guardaba metadata asumiendo que el archivo ya estaba en algun lado; ahora
// sube el archivo a S3 y guarda la key). `data.file` es un File/Blob del
// input; el resto de campos van como texto en el mismo FormData.
export async function createDocumento(data) {
  const { file, ...fields } = data;
  const form = new FormData();
  if (file) form.append('file', file);
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, value);
  });
  const response = await api.post('/documentos', form);
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

export async function getDownloadUrl(id, expiresIn = 600) {
  const response = await api.get(`/documentos/${id}/download-url`, { params: { expires: expiresIn } });
  return response.data;
}
