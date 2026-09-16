// Colores por estado real del proceso (catalogo estado_proceso). Un solo lugar
// para no repetir el mapa en cada pantalla que muestra el estado de un expediente
// (Mis Casos, detalle del expediente, listado de expedientes...).
export const ESTADO_PROCESO_COLOR = {
  'en preparación': '#3b82f6',
  'activo': '#10b981',
  'suspendido': '#f59e0b',
  'en recurso': '#8b5cf6',
  'conciliado': '#10b981',
  'desistido': '#64748b',
  'terminado por sentencia': '#3b82f6',
  'archivado': '#64748b',
  'inactivo': '#64748b',
  'perdido': '#ef4444',
  'ganado': '#f0b942',
};

export function estadoProcesoColor(estado) {
  return ESTADO_PROCESO_COLOR[String(estado || '').toLowerCase()] || '#3b82f6';
}
