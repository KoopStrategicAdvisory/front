import { useFinanciero as useFinancieroBase } from '@repo/hooks';
import {
  listHonorarios,
  createHonorario,
  updateHonorario,
  deleteHonorario,
  listPagos,
  createPago,
  updatePago,
  listGastos,
  createGasto,
  updateGasto,
  deleteGasto,
  getResumenFinanciero,
} from '../api/financiero';

const financieroApiClient = {
  listHonorarios,
  createHonorario,
  updateHonorario,
  deleteHonorario,
  listPagos,
  createPago,
  updatePago,
  listGastos,
  createGasto,
  updateGasto,
  deleteGasto,
  getResumen: getResumenFinanciero,
};

export function useFinanciero() {
  return useFinancieroBase(financieroApiClient);
}
