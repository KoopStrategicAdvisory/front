import { useAudiencias as useAudienciasBase } from '@repo/hooks';
import {
  listAudiencias,
  createAudiencia,
  updateAudiencia,
  deleteAudiencia,
} from '../api/audiencias';

const audienciasApiClient = {
  list: listAudiencias,
  create: createAudiencia,
  update: updateAudiencia,
  delete: deleteAudiencia,
};

export function useAudiencias(expedienteId) {
  return useAudienciasBase(audienciasApiClient, expedienteId);
}
