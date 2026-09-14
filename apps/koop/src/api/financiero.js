import api from './axios';
import { toListResponse } from './utils';

// ─── Honorarios ───────────────────────────────────────────────────────────────

export async function listHonorarios(idExpediente) {
  const response = await api.get('/financiero/honorarios', { params: { id_expediente: idExpediente } });
  return toListResponse(response.data);
}

export async function createHonorario(data) {
  const response = await api.post('/financiero/honorarios', data);
  return response.data;
}

export async function updateHonorario(id, data) {
  const response = await api.put(`/financiero/honorarios/${id}`, data);
  return response.data;
}

export async function deleteHonorario(id) {
  const response = await api.delete(`/financiero/honorarios/${id}`);
  return response.data;
}

// ─── Pagos ────────────────────────────────────────────────────────────────────

export async function listPagos(idExpediente, idHonorario) {
  const params = { id_expediente: idExpediente };
  if (idHonorario !== undefined) params.id_honorario = idHonorario;
  const response = await api.get('/financiero/pagos', { params });
  return toListResponse(response.data);
}

export async function createPago(data) {
  const response = await api.post('/financiero/pagos', data);
  return response.data;
}

// El spec no expone DELETE para pagos — solo GET/PUT
export async function updatePago(id, data) {
  const response = await api.put(`/financiero/pagos/${id}`, data);
  return response.data;
}

// ─── Gastos ───────────────────────────────────────────────────────────────────

export async function listGastos(idExpediente) {
  const response = await api.get('/financiero/gastos', { params: { id_expediente: idExpediente } });
  return toListResponse(response.data);
}

export async function createGasto(data) {
  const response = await api.post('/financiero/gastos', data);
  return response.data;
}

export async function updateGasto(id, data) {
  const response = await api.put(`/financiero/gastos/${id}`, data);
  return response.data;
}

export async function deleteGasto(id) {
  const response = await api.delete(`/financiero/gastos/${id}`);
  return response.data;
}

// ─── Resumen ──────────────────────────────────────────────────────────────────

export async function getResumenFinanciero(idExpediente) {
  const response = await api.get(`/financiero/resumen/${idExpediente}`);
  return response.data;
}
