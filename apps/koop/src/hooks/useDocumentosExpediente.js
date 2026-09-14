import { useDocumentosExpediente as useDocumentosExpedienteBase } from '@repo/hooks';
import {
  listDocumentos,
  getDocumento,
  createDocumento,
  updateDocumento,
  deleteDocumento,
} from '../api/documentosExpediente';

const documentosExpedienteApiClient = {
  list: listDocumentos,
  get: getDocumento,
  create: createDocumento,
  update: updateDocumento,
  delete: deleteDocumento,
};

export function useDocumentosExpediente() {
  return useDocumentosExpedienteBase(documentosExpedienteApiClient);
}
