// Colores por estado real de tarea (catalogo estado_tarea) — un solo lugar
// para no repetir el mapa entre la lista de Tareas y el tablero Kanban, que
// ahora viven en la misma pantalla y deben verse coherentes entre si.
export const ESTADO_TAREA_COLOR = {
  'pendiente': '#f59e0b',
  'en curso': '#3b82f6',
  'completada': '#10b981',
  'vencida': '#ef4444',
  'cancelada': '#6b7280',
  'reasignada': '#8b5cf6',
};

export function estadoTareaColor(estado) {
  return ESTADO_TAREA_COLOR[String(estado || '').toLowerCase()] || '#9ca3af';
}
