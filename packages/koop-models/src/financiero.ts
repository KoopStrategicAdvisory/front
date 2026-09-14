import type { Id } from './shared';

export interface Honorario {
  id: Id;
  id_expediente: Id;
  id_usuario?: Id;
  modalidad?: string;
  monto_total_pactado?: number;
  moneda?: string;
  porcentaje_cuota_litis?: number;
  fecha_pacto?: string;
  forma_pago?: string;
  numero_cuotas?: number;
  valor_cuota?: number;
  estado?: string;
  active: boolean;
}

export type CreateHonorarioInput = Pick<Honorario, 'id_expediente'> & {
  modalidad?: string;
  monto_total_pactado?: number;
  moneda?: string;
  porcentaje_cuota_litis?: number;
  fecha_pacto?: string;
};

export type UpdateHonorarioInput = Partial<CreateHonorarioInput>;

export interface Pago {
  id: Id;
  id_expediente: Id;
  id_honorario?: Id;
  fecha_pago: string;
  monto: number;
  moneda?: string;
  metodo_pago?: string;
  numero_referencia?: string;
  estado?: string;
  active: boolean;
}

export type CreatePagoInput = Pick<Pago, 'id_expediente' | 'fecha_pago' | 'monto'> & {
  id_honorario?: Id;
  moneda?: string;
  metodo_pago?: string;
};

/** `/financiero/pagos/{id}` solo soporta GET y PUT — no hay DELETE en el spec */
export type UpdatePagoInput = Partial<CreatePagoInput>;

export interface GastoProceso {
  id: Id;
  id_expediente: Id;
  fecha_gasto: string;
  categoria_gasto?: string;
  descripcion?: string;
  monto: number;
  moneda?: string;
  proveedor?: string;
  reembolsable?: boolean;
  reembolsado?: boolean;
  active: boolean;
}

export type CreateGastoInput = Pick<GastoProceso, 'id_expediente' | 'fecha_gasto' | 'monto'> & {
  categoria_gasto?: string;
  descripcion?: string;
};

export type UpdateGastoInput = Partial<CreateGastoInput>;

/** Agregado calculado por `/financiero/resumen/:idExpediente` — no es una entidad con `id` */
export interface ResumenFinanciero {
  honorarios_pactados: number;
  total_pagado: number;
  saldo_pendiente: number;
  total_gastos: number;
}
