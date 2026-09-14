import api from './axios';
import { toListResponse } from './utils';

// ─── Etiquetas ────────────────────────────────────────────────────────────────

export async function listEtiquetas() {
  const response = await api.get('/colaboracion/etiquetas');
  return toListResponse(response.data);
}

export async function createEtiqueta(data) {
  const response = await api.post('/colaboracion/etiquetas', data);
  return response.data;
}

export async function updateEtiqueta(id, data) {
  const response = await api.put(`/colaboracion/etiquetas/${id}`, data);
  return response.data;
}

export async function deleteEtiqueta(id) {
  const response = await api.delete(`/colaboracion/etiquetas/${id}`);
  return response.data;
}

export async function asignarEtiqueta(data) {
  const response = await api.post('/colaboracion/etiquetas/entidad', data);
  return response.data;
}

// ─── Comentarios ──────────────────────────────────────────────────────────────

export async function listComentarios(params = {}) {
  const response = await api.get('/colaboracion/comentarios', { params });
  return toListResponse(response.data);
}

export async function createComentario(data) {
  const response = await api.post('/colaboracion/comentarios', data);
  return response.data;
}

export async function updateComentario(id, data) {
  const response = await api.put(`/colaboracion/comentarios/${id}`, data);
  return response.data;
}

export async function deleteComentario(id) {
  const response = await api.delete(`/colaboracion/comentarios/${id}`);
  return response.data;
}

export async function listReplies(id) {
  const response = await api.get(`/colaboracion/comentarios/${id}/replies`);
  return toListResponse(response.data);
}

export async function addMencion(id, idUsuario) {
  const response = await api.post(`/colaboracion/comentarios/${id}/menciones`, { id_usuario: idUsuario });
  return response.data;
}

export async function removeMencion(id, usuarioId) {
  const response = await api.delete(`/colaboracion/comentarios/${id}/menciones/${usuarioId}`);
  return response.data;
}

// ─── Adjuntos ─────────────────────────────────────────────────────────────────

export async function listAdjuntos(params = {}) {
  const response = await api.get('/colaboracion/adjuntos', { params });
  return toListResponse(response.data);
}

export async function createAdjunto(data) {
  const response = await api.post('/colaboracion/adjuntos', data);
  return response.data;
}

export async function deleteAdjunto(id) {
  const response = await api.delete(`/colaboracion/adjuntos/${id}`);
  return response.data;
}

// ─── Dependencias ─────────────────────────────────────────────────────────────

export async function listDependencias(idTareaOrigen) {
  const params = idTareaOrigen !== undefined ? { id_tarea_origen: idTareaOrigen } : {};
  const response = await api.get('/colaboracion/dependencias', { params });
  return toListResponse(response.data);
}

export async function createDependencia(data) {
  const response = await api.post('/colaboracion/dependencias', data);
  return response.data;
}

export async function deleteDependencia(id) {
  const response = await api.delete(`/colaboracion/dependencias/${id}`);
  return response.data;
}
