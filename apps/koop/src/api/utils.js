// El backend responde listas de dos formas distintas según el endpoint:
// arreglo plano (p.ej. catálogos, actuaciones) o envelope `{ data, total }` (p.ej. expedientes, tareas).
// Todos los adaptadores normalizan a `{ items, total }` con este helper.
export function toListResponse(data) {
  if (Array.isArray(data)) return { items: data, total: data.length };
  return { items: data?.data ?? [], total: data?.total ?? 0 };
}
