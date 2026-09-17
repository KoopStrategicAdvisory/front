import api from './axios';

export async function agregarSeguimiento(payload) {
  const { data } = await api.post('/consultas-externas/seguimientos', payload);
  return data;
}

export async function configurarSeguimiento(id, modalidad) {
  const { data } = await api.put(`/consultas-externas/radicados/${id}/seguimiento`, { modalidad });
  return data;
}

// Bitácora de consultas externas diarias — reconstruida sobre
// /api/consultas-externas (el /api/admin/consultas viejo nunca llegó a
// existir en el backend real, dependía de un modelo mongoose muerto).

export async function listRadicadosActivos(fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const { data } = await api.get(`/consultas-externas/radicados${query}`);
  return data;
}

export async function listConsultationLogs(fecha) {
  const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
  const { data } = await api.get(`/consultas-externas${query}`);
  return data;
}

export async function createConsultationLog(payload) {
  const { data } = await api.post('/consultas-externas', payload);
  return data;
}

// Para corregir un registro marcado por error (radicado equivocado,
// resultado mal puesto, etc.) — la bitácora no es de solo agregar.
export async function deleteConsultationLog(id) {
  const { data } = await api.delete(`/consultas-externas/${id}`);
  return data;
}

// Dispara ahora mismo la verificacion automatica contra la API publica de
// Rama Judicial (sin captcha) para todos los radicados de ese organismo —
// el mismo chequeo que corre solo cada dia a las 6am.
export async function verificarRamaJudicial() {
  const { data } = await api.post('/consultas-externas/verificar-rama-judicial');
  return data;
}

export async function downloadConsultationPdf(fecha) {
  const { data } = await api.get(`/consultas-externas/pdf${fecha ? `?fecha=${encodeURIComponent(fecha)}` : ''}`, {
    responseType: 'blob',
  });
  return data;
}
