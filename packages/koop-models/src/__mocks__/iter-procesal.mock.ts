import type { IterProcesalPlantilla, TareaPlantilla } from '../iter-procesal';

export const mockIterProcesalPlantilla = (
  overrides?: Partial<IterProcesalPlantilla>
): IterProcesalPlantilla => ({
  id: 1,
  id_tipo_proc_subtipo_proc_tipo_pre: 1,
  id_etapa: 1,
  orden: 1,
  plazo_dias: 10,
  dias_habiles: true,
  dispara_notificacion: false,
  es_obligatoria: true,
  active: true,
  ...overrides,
});

export const mockTareaPlantilla = (overrides?: Partial<TareaPlantilla>): TareaPlantilla => ({
  id: 1,
  id_iter_plantilla: 1,
  titulo: 'Redactar escrito de demanda',
  dias_desde_etapa: 3,
  dias_habiles: true,
  id_prioridad: 1,
  es_hito_critico: true,
  active: true,
  ...overrides,
});
