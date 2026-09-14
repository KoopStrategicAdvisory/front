import { useTareasKoop as useTareasKoopBase } from '@repo/hooks';
import { listTareas, getTarea, createTarea, updateTarea, deleteTarea } from '../api/tareas';

const tareasApiClient = {
  list: listTareas,
  get: getTarea,
  create: createTarea,
  update: updateTarea,
  delete: deleteTarea,
};

export function useTareasKoop(options = {}) {
  return useTareasKoopBase(tareasApiClient, options);
}
