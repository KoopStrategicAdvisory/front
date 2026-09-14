import { useKanban as useKanbanBase } from '@repo/hooks';
import {
  getTablero,
  listColumnas,
  listPosiciones,
  crearPosicion,
  eliminarPosicion,
  asignarUsuario,
  createTablero,
} from '../api/kanban';

const kanbanApiClient = {
  getTablero,
  listColumnas,
  listPosiciones,
  crearPosicion,
  eliminarPosicion,
  asignarUsuario,
  createTablero,
};

export function useKanban() {
  return useKanbanBase(kanbanApiClient);
}
