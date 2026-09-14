import type { Honorario, Pago, GastoProceso, ResumenFinanciero } from '../financiero';

export const mockHonorario = (overrides?: Partial<Honorario>): Honorario => ({
  id: 1,
  id_expediente: 1,
  id_usuario: 2,
  modalidad: 'cuota_litis',
  monto_total_pactado: 5000000,
  moneda: 'COP',
  porcentaje_cuota_litis: 20,
  fecha_pacto: new Date().toISOString().slice(0, 10),
  estado: 'vigente',
  active: true,
  ...overrides,
});

export const mockPago = (overrides?: Partial<Pago>): Pago => ({
  id: 1,
  id_expediente: 1,
  id_honorario: 1,
  fecha_pago: new Date().toISOString().slice(0, 10),
  monto: 1000000,
  moneda: 'COP',
  metodo_pago: 'transferencia',
  active: true,
  ...overrides,
});

export const mockGasto = (overrides?: Partial<GastoProceso>): GastoProceso => ({
  id: 1,
  id_expediente: 1,
  fecha_gasto: new Date().toISOString().slice(0, 10),
  categoria_gasto: 'notificaciones',
  descripcion: 'Gastos de notificación judicial',
  monto: 50000,
  moneda: 'COP',
  reembolsable: true,
  reembolsado: false,
  active: true,
  ...overrides,
});

export const mockResumenFinanciero = (overrides?: Partial<ResumenFinanciero>): ResumenFinanciero => ({
  honorarios_pactados: 5000000,
  total_pagado: 1000000,
  saldo_pendiente: 4000000,
  total_gastos: 50000,
  ...overrides,
});
