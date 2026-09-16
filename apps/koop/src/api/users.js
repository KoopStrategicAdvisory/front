import api from './axios';
import { toListResponse } from './utils';

export async function listUsers() {
  const response = await api.get('/users');
  return toListResponse(response.data);
}

export async function getUser(id) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}

export async function createUser(data) {
  const response = await api.post('/users', data);
  return response.data;
}

export async function updateUser(id, data) {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
}

export async function deleteUser(id) {
  const response = await api.delete(`/users/${id}`);
  return response.data;
}

export async function addRole(id, idRol) {
  const response = await api.post(`/users/${id}/roles`, { id_rol: idRol });
  return response.data;
}

export async function removeRole(id, rolId) {
  const response = await api.delete(`/users/${id}/roles/${rolId}`);
  return response.data;
}

// Prospectos: gente que se registro pero su cedula nunca hizo match con
// ningun cliente — no son cuentas rotas, pueden ser gente real que quiere
// una asesoria y aun no es clienta.
export async function listProspectos() {
  const response = await api.get('/users/prospectos');
  return response.data;
}

export async function deleteProspecto(id) {
  const response = await api.delete(`/users/prospectos/${id}`);
  return response.data;
}
