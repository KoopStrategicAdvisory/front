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
