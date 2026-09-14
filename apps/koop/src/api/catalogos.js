import api from './axios';
import { toListResponse } from './utils';

// ─── Roles ────────────────────────────────────────────────────────────────────

export async function listRoles() {
  const response = await api.get('/catalogos/roles');
  return toListResponse(response.data).items;
}

export async function createRole(data) {
  const response = await api.post('/catalogos/roles', data);
  return response.data;
}

export async function updateRole(id, data) {
  const response = await api.put(`/catalogos/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id) {
  const response = await api.delete(`/catalogos/roles/${id}`);
  return response.data;
}

// ─── Tipo de proceso ──────────────────────────────────────────────────────────

export async function listTiposProceso() {
  const response = await api.get('/catalogos/tipo-proceso');
  return toListResponse(response.data).items;
}

export async function createTipoProceso(data) {
  const response = await api.post('/catalogos/tipo-proceso', data);
  return response.data;
}

export async function updateTipoProceso(id, data) {
  const response = await api.put(`/catalogos/tipo-proceso/${id}`, data);
  return response.data;
}

export async function deleteTipoProceso(id) {
  const response = await api.delete(`/catalogos/tipo-proceso/${id}`);
  return response.data;
}

// ─── Subtipo de proceso ───────────────────────────────────────────────────────

export async function listSubtiposProceso() {
  const response = await api.get('/catalogos/subtipo-proceso');
  return toListResponse(response.data).items;
}

// ─── Tipo de pretensión ───────────────────────────────────────────────────────

export async function listTiposPretension() {
  const response = await api.get('/catalogos/tipo-pretension');
  return toListResponse(response.data).items;
}

// ─── Etapas procesales ────────────────────────────────────────────────────────

export async function listEtapasProcesales(idTipoProceso) {
  const params = idTipoProceso ? { id_tipo_proceso: idTipoProceso } : {};
  const response = await api.get('/catalogos/etapas-procesales', { params });
  return toListResponse(response.data).items;
}

export async function createEtapaProcesal(data) {
  const response = await api.post('/catalogos/etapas-procesales', data);
  return response.data;
}

export async function updateEtapaProcesal(id, data) {
  const response = await api.put(`/catalogos/etapas-procesales/${id}`, data);
  return response.data;
}

export async function deleteEtapaProcesal(id) {
  const response = await api.delete(`/catalogos/etapas-procesales/${id}`);
  return response.data;
}

// ─── Combinación tipo de proceso + subtipo + pretensión ──────────────────────

export async function listTipoProcCombo() {
  const response = await api.get('/catalogos/tipo-proc-combo');
  return toListResponse(response.data).items;
}

export async function createTipoProcCombo(data) {
  const response = await api.post('/catalogos/tipo-proc-combo', data);
  return response.data;
}

export async function deleteTipoProcCombo(id) {
  const response = await api.delete(`/catalogos/tipo-proc-combo/${id}`);
  return response.data;
}
