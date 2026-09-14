import { useIterProcesal as useIterProcesalBase } from '@repo/hooks';
import {
  listIterProcesal,
  getIterProcesal,
  createIterProcesal,
  updateIterProcesal,
  deleteIterProcesal,
  listTareasPlantilla,
  createTareaPlantilla,
  updateTareaPlantilla,
  deleteTareaPlantilla,
} from '../api/iterProcesal';

const iterProcesalApiClient = {
  list: listIterProcesal,
  get: getIterProcesal,
  create: createIterProcesal,
  update: updateIterProcesal,
  delete: deleteIterProcesal,
  listTareas: listTareasPlantilla,
  createTarea: createTareaPlantilla,
  updateTarea: updateTareaPlantilla,
  deleteTarea: deleteTareaPlantilla,
};

export function useIterProcesal() {
  return useIterProcesalBase(iterProcesalApiClient);
}
