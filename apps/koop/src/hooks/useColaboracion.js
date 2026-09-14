import { useColaboracion as useColaboracionBase } from '@repo/hooks';
import {
  listEtiquetas,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
  asignarEtiqueta,
  listComentarios,
  createComentario,
  updateComentario,
  deleteComentario,
  listReplies,
  addMencion,
  removeMencion,
  listAdjuntos,
  createAdjunto,
  deleteAdjunto,
  listDependencias,
  createDependencia,
  deleteDependencia,
} from '../api/colaboracion';

const colaboracionApiClient = {
  listEtiquetas,
  createEtiqueta,
  updateEtiqueta,
  deleteEtiqueta,
  asignarEtiqueta,
  listComentarios,
  createComentario,
  updateComentario,
  deleteComentario,
  listReplies,
  addMencion,
  removeMencion,
  listAdjuntos,
  createAdjunto,
  deleteAdjunto,
  listDependencias,
  createDependencia,
  deleteDependencia,
};

export function useColaboracion() {
  return useColaboracionBase(colaboracionApiClient);
}
