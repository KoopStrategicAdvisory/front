import { useCatalogos as useCatalogosBase } from '@repo/hooks';
import {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listTiposProceso,
  createTipoProceso,
  updateTipoProceso,
  deleteTipoProceso,
  listEtapasProcesales,
  createEtapaProcesal,
  updateEtapaProcesal,
  deleteEtapaProcesal,
  listTipoProcCombo,
  createTipoProcCombo,
  deleteTipoProcCombo,
} from '../api/catalogos';

const catalogosApiClient = {
  listRoles,
  createRole,
  updateRole,
  deleteRole,
  listTiposProceso,
  createTipoProceso,
  updateTipoProceso,
  deleteTipoProceso,
  listEtapasProcesales,
  createEtapaProcesal,
  updateEtapaProcesal,
  deleteEtapaProcesal,
  listTipoProcCombo,
  createTipoProcCombo,
  deleteTipoProcCombo,
};

export function useCatalogos() {
  return useCatalogosBase(catalogosApiClient);
}
