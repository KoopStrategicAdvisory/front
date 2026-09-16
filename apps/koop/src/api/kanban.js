import api from './axios';
import { toListResponse } from './utils';

// ─── Tableros ─────────────────────────────────────────────────────────────────

export async function listTableros(params = {}) {
  const response = await api.get('/kanban/tableros', { params });
  return toListResponse(response.data);
}

export async function getTablero(id) {
  const response = await api.get(`/kanban/tableros/${id}`);
  return response.data;
}

export async function createTablero(data) {
  const response = await api.post('/kanban/tableros', data);
  return response.data;
}

export async function updateTablero(id, data) {
  const response = await api.put(`/kanban/tableros/${id}`, data);
  return response.data;
}

export async function deleteTablero(id) {
  const response = await api.delete(`/kanban/tableros/${id}`);
  return response.data;
}

export async function asignarUsuario(tableroId, idUsuario) {
  const response = await api.post(`/kanban/tableros/${tableroId}/usuarios`, { id_usuario: idUsuario });
  return response.data;
}

export async function quitarUsuario(tableroId, usuarioId) {
  const response = await api.delete(`/kanban/tableros/${tableroId}/usuarios/${usuarioId}`);
  return response.data;
}

// ─── Columnas ─────────────────────────────────────────────────────────────────

export async function listColumnas(tableroId) {
  const response = await api.get(`/kanban/tableros/${tableroId}/columnas`);
  return toListResponse(response.data).items;
}

export async function createColumna(tableroId, data) {
  const response = await api.post(`/kanban/tableros/${tableroId}/columnas`, data);
  return response.data;
}

// Swagger: rutas planas, no anidadas bajo el tablero
export async function updateColumna(columnaId, data) {
  const response = await api.put(`/kanban/columnas/${columnaId}`, data);
  return response.data;
}

export async function deleteColumna(columnaId) {
  const response = await api.delete(`/kanban/columnas/${columnaId}`);
  return response.data;
}

export async function mapearEstadoColumna(columnaId, data) {
  const response = await api.post(`/kanban/columnas/${columnaId}/estados`, data);
  return response.data;
}

// ─── Posiciones ───────────────────────────────────────────────────────────────
// El backend no expone "todas las posiciones de un tablero" en un solo
// endpoint — el GET real es por columna (/kanban/columnas/:id/posiciones).
// Se listan las columnas del tablero y se piden sus posiciones en paralelo,
// para no cambiar el contrato que ya usa useKanban (listPosiciones(tableroId)).
export async function listPosicionesPorColumna(columnaId) {
  const response = await api.get(`/kanban/columnas/${columnaId}/posiciones`);
  return toListResponse(response.data).items;
}

export async function listPosiciones(tableroId) {
  const columnas = await listColumnas(tableroId);
  const porColumna = await Promise.all(columnas.map((c) => listPosicionesPorColumna(c.id)));
  return porColumna.flat();
}

// Swagger: no existe un update batch — mover una tarjeta es crear una posición nueva
// y eliminar la anterior (ver useKanban.moverTarea en @repo/hooks).
export async function crearPosicion(data) {
  const response = await api.post('/kanban/posiciones', data);
  return response.data;
}

export async function eliminarPosicion(id) {
  const response = await api.delete(`/kanban/posiciones/${id}`);
  return response.data;
}
