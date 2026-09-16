import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useKanban } from '../../hooks/useKanban';
import { toTask } from '../../hooks/useAdminTasks';
import { listTableros, createTablero as apiCreateTablero, createColumna } from '../../api/kanban';
import { listTareas, updateTarea } from '../../api/tareas';
import { estadoTareaColor } from '../../constants/estadoTareaColor';

const borderCol = '#394b61';

// Empareja una columna con su estado real de tarea por nombre — asi es como
// se crean las columnas de un tablero nuevo (una por cada fila de
// estado_tarea, con el mismo nombre y color). Si el tablero tiene columnas
// con otros nombres (renombradas a mano, o de un tablero mas viejo),
// simplemente no hay sincronizacion para esa columna: el arrastre solo mueve
// la tarjeta, sin tocar el estado real.
function estadoIdForColumna(columna, estadosCatalog) {
  const nombre = String(columna?.nombre || '').trim().toLowerCase();
  return estadosCatalog.find((e) => String(e.nombre).trim().toLowerCase() === nombre)?.id ?? null;
}

// ─── Drag helpers ─────────────────────────────────────────────────────────────
// El drag-and-drop nativo de HTML5 (draggable + dragstart/dragover/drop)
// resulto poco confiable con un mouse real: en uso real la tarjeta se quedaba
// "pegada" sin mandar ninguna peticion al backend (dragover/drop nunca
// llegaban a completarse). Se usa mousedown/mousemove/mouseup en su lugar —
// el mismo enfoque que usan Trello/Linear.
function usePointerDnD(onCardDrop, onCardClick) {
  const dragRef = useRef(null);
  const [draggingId, setDraggingId] = useState(null);
  const [hoverColumnId, setHoverColumnId] = useState(null);

  const onCardMouseDown = useCallback((e, pos, tarea) => {
    if (pos.tipo_entidad !== 'tarea' || !tarea || e.button !== 0) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    dragRef.current = { pos, tarea, dragging: false };

    const onMove = (ev) => {
      const st = dragRef.current;
      if (!st) return;
      if (!st.dragging) {
        // Umbral de unos pocos pixeles para distinguir un clic (abrir detalle)
        // de un arrastre de verdad.
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
        st.dragging = true;
        setDraggingId(st.pos.id);
      }
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const colEl = el?.closest('[data-columna-id]');
      setHoverColumnId(colEl?.getAttribute('data-columna-id') ?? null);
    };

    const onUp = (ev) => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      const st = dragRef.current;
      dragRef.current = null;
      setDraggingId(null);
      setHoverColumnId(null);
      if (!st) return;
      if (st.dragging) {
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const columnaId = el?.closest('[data-columna-id]')?.getAttribute('data-columna-id');
        if (columnaId && String(columnaId) !== String(st.pos.id_columna)) onCardDrop(st.pos, columnaId);
      } else {
        onCardClick(st.tarea);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [onCardDrop, onCardClick]);

  return { onCardMouseDown, draggingId, hoverColumnId };
}

// ─── Card component ───────────────────────────────────────────────────────────
// Clic (sin arrastrar) abre el mismo panel de detalle que la lista de tareas.
// El color de cada tarjeta refleja su estado real (mismo color que la
// columna donde vive), para reconocerlas de un vistazo.
function KanbanCard({ pos, tarea, onCardMouseDown, isDragging }) {
  const titulo = tarea?.titulo || pos.titulo_tarea || `Tarea #${pos.id_tarea}`;
  const estado = tarea?.nombre_estado_tarea || '';
  const limite = tarea?.fecha_limite;
  const color = estadoTareaColor(estado);

  const isOverdue = limite && new Date(limite) < new Date() && !/completad/i.test(estado);
  const isTarea = pos.tipo_entidad === 'tarea';

  return (
    <div
      onMouseDown={(e) => onCardMouseDown(e, pos, tarea)}
      style={{
        background: 'linear-gradient(135deg, #283447, #1c2c3e)',
        border: `1px solid ${color}55`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: isTarea ? 'grab' : 'default',
        userSelect: 'none',
        marginBottom: 8,
        opacity: isDragging ? 0.4 : 1,
        transition: 'box-shadow 0.15s, opacity 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.4 }}>{titulo}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {estado && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: `${color}22`, color, border: `1px solid ${color}44`, fontWeight: 600 }}>
            {estado}
          </span>
        )}
        {limite && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: isOverdue ? 'rgba(239,68,68,0.12)' : 'rgba(100,116,139,0.12)', color: isOverdue ? '#f87171' : '#64748b' }}>
            ⏰ {new Date(limite).toLocaleDateString('es-CO', { month: 'short', day: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Column component ─────────────────────────────────────────────────────────
function KanbanColumn({ columna, cards, tareasById, onCardMouseDown, draggingId, isHovered }) {
  const wipExceeded = columna.wip_limit && cards.length > columna.wip_limit;
  const color = columna.color || estadoTareaColor(columna.nombre);
  return (
    <div
      data-columna-id={columna.id}
      style={{
        minWidth: 260,
        maxWidth: 300,
        flex: '0 0 auto',
        background: isHovered ? '#22304a' : '#1a2535',
        border: `1px solid ${isHovered ? color : borderCol}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 320px)',
        transition: 'background 0.1s, border-color 0.1s',
      }}
    >
      {/* Column header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        background: `${color}18`,
        borderLeft: `3px solid ${color}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{columna.nombre}</span>
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 10,
          background: wipExceeded ? 'rgba(239,68,68,0.15)' : `${color}22`,
          color: wipExceeded ? '#f87171' : color,
          border: `1px solid ${wipExceeded ? 'rgba(239,68,68,0.3)' : `${color}44`}`,
        }}>
          {cards.length}{columna.wip_limit ? `/${columna.wip_limit}` : ''}
        </span>
      </div>

      {/* Cards */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10, minHeight: 80 }}>
        {cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#394b61', fontSize: 12, userSelect: 'none' }}>
            Arrastra una tarjeta aquí
          </div>
        ) : (
          cards
            .sort((a, b) => (a.orden_vertical ?? 0) - (b.orden_vertical ?? 0))
            .map((pos) => (
              <KanbanCard key={pos.id} pos={pos} tarea={tareasById[pos.id_tarea]} onCardMouseDown={onCardMouseDown} isDragging={draggingId === pos.id} />
            ))
        )}
      </div>
    </div>
  );
}

// ─── Tablero selector ─────────────────────────────────────────────────────────
function TableroSelector({ tableroId, onSelect, refreshKey }) {
  const [tableros, setTableros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listTableros().then((res) => { setTableros(res.items ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <span style={{ color: '#9fb3cc', fontSize: 13 }}>Cargando tableros...</span>;

  return (
    <select
      value={tableroId || ''}
      onChange={(e) => onSelect(e.target.value)}
      style={{ padding: '8px 12px', background: '#1e2a3a', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
    >
      <option value="">Seleccionar tablero...</option>
      {tableros.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
    </select>
  );
}

// ─── Create Tablero Modal ─────────────────────────────────────────────────────
function CreateTableroModal({ onClose, onCreate }) {
  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const handleCreate = async () => {
    if (!nombre.trim()) { setErr('El nombre es obligatorio'); return; }
    setLoading(true); setErr(null);
    try {
      const created = await apiCreateTablero({ nombre: nombre.trim(), descripcion: desc.trim() || undefined });
      await onCreate(created);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Error al crear tablero');
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#1e2a3a', borderRadius: 12, padding: 24, maxWidth: 440, width: '90%', border: `1px solid ${borderCol}` }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>➕ Nuevo Tablero Kanban</h3>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#9fb3cc' }}>Arranca con una columna por cada estado de tarea (Pendiente, En curso, Completada...), listas para usar.</p>
        {err && <div style={{ color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>{err}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9fb3cc', marginBottom: 6 }}>Nombre *</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tablero de Tareas" style={{ width: '100%', padding: '10px 12px', background: '#0f1923', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#9fb3cc', marginBottom: 6 }}>Descripción</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descripción opcional" style={{ width: '100%', padding: '10px 12px', background: '#0f1923', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }} disabled={loading}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCreate} style={{ padding: '10px 20px' }} disabled={loading}>{loading ? 'Creando...' : 'Crear'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Board ─────────────────────────────────────────────────────────────────────
// Antes era una pagina aparte (/admin/kanban) — vivia desconectada de
// /admin/tareas, con su propio menu y su propia carga de catalogos, sin
// relacion visible con la lista de tareas de al lado. Ahora es un modo de
// vista dentro de la misma pantalla de Tareas (Lista/Tablero), reutilizando
// los catalogos y el panel de edicion que ya carga el padre — asi cambiar de
// vista es instantaneo, sin duplicar nada.
export default function KanbanBoard({ canManage, admins, expedientes, estadosCatalog, user, openEditModal, notifySuccess, notifyError }) {
  const { tablero, columnas, posiciones, loading, error, loadTablero, getTarjetasPorColumna, moverTarea } = useKanban();

  const [tableroId, setTableroId] = useState('');
  const [showCreateTablero, setShowCreateTablero] = useState(false);
  const [tableroListKey, setTableroListKey] = useState(0);
  const [tareasById, setTareasById] = useState({});

  const onSelectTablero = (id) => {
    setTableroId(id);
    if (id) loadTablero(id);
  };

  // "Mis tareas": un tablero personal por usuario, creado la primera vez que
  // entra, que arranca ya con una columna por estado real — asi el tablero
  // se ve poblado desde el primer momento. No pisa una seleccion manual
  // (solo corre mientras tableroId sigue vacio).
  useEffect(() => {
    if (tableroId || !user?.id || estadosCatalog.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await listTableros();
        const propios = res.items ?? [];
        let personal = propios.find((t) => t.tipo_ambito === 'personal' && String(t.id_usuario_propietario) === String(user.id));
        if (!personal) {
          personal = await apiCreateTablero({ nombre: 'Mis tareas', tipo_ambito: 'personal' });
          await Promise.all(estadosCatalog.map((e, i) => createColumna(personal.id, { nombre: e.nombre, orden: i, color: estadoTareaColor(e.nombre) })));
          if (cancelled) return;
          setTableroListKey((k) => k + 1);
        }
        if (!cancelled) onSelectTablero(String(personal.id));
      } catch { /* si falla, el usuario igual puede elegir un tablero a mano */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, estadosCatalog, tableroId]);

  const refreshTareas = useCallback(() => {
    return listTareas({ limit: 500 }).then((res) => {
      const map = {};
      (res.items ?? []).forEach((t) => { map[t.id] = t; });
      setTareasById(map);
      return map;
    }).catch(() => ({}));
  }, []);

  useEffect(() => {
    if (!tablero) { setTareasById({}); return; }
    refreshTareas();
  }, [tablero, refreshTareas]);

  const onCardDrop = useCallback(async (pos, columnaId) => {
    try {
      await moverTarea(pos.id_tarea, columnaId);
      const columnaDestino = columnas.find((c) => String(c.id) === String(columnaId));
      const estadoId = estadoIdForColumna(columnaDestino, estadosCatalog);
      if (estadoId != null) await updateTarea(pos.id_tarea, { id_estado_tarea: estadoId });
    } catch (e) {
      notifyError?.('No se pudo mover la tarjeta: ' + (e?.response?.data?.message || e?.message || ''));
    } finally {
      await refreshTareas();
    }
  }, [moverTarea, columnas, estadosCatalog, refreshTareas, notifyError]);

  const esTableroPersonalPropio = tablero?.tipo_ambito === 'personal' && String(tablero?.id_usuario_propietario) === String(user?.id);

  // Reconciliacion: si el estado real de una tarea cambio por fuera del
  // tablero (editandola en la lista), la tarjeta se reubica sola. Y en el
  // tablero personal, cualquier tarea asignada a esa persona que todavia no
  // tenga tarjeta se agrega sola.
  useEffect(() => {
    if (!tablero || columnas.length === 0 || Object.keys(tareasById).length === 0) return;

    const columnaPara = (tarea) => columnas.find((c) => {
      const estadoColumna = estadoIdForColumna(c, estadosCatalog);
      return estadoColumna != null && String(estadoColumna) === String(tarea.id_estado_tarea);
    });

    posiciones
      .filter((p) => p.tipo_entidad === 'tarea' && tareasById[p.id_tarea])
      .forEach((p) => {
        const columnaCorrecta = columnaPara(tareasById[p.id_tarea]);
        if (columnaCorrecta && String(columnaCorrecta.id) !== String(p.id_columna)) {
          moverTarea(p.id_tarea, columnaCorrecta.id).catch(() => {});
        }
      });

    if (esTableroPersonalPropio) {
      const posicionadas = new Set(posiciones.filter((p) => p.tipo_entidad === 'tarea').map((p) => String(p.id_tarea)));
      Object.values(tareasById)
        .filter((t) => String(t.id_usuario_asignado) === String(user.id) && !posicionadas.has(String(t.id)))
        .forEach((t) => {
          const columnaCorrecta = columnaPara(t);
          if (columnaCorrecta) moverTarea(t.id, columnaCorrecta.id).catch(() => {});
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablero, columnas, tareasById, estadosCatalog, posiciones, esTableroPersonalPropio]);

  const onTableroCreated = async (t) => {
    try {
      await Promise.all(estadosCatalog.map((estado, i) => createColumna(t.id, { nombre: estado.nombre, orden: i, color: estadoTareaColor(estado.nombre) })));
    } catch { /* el tablero queda creado igual; se pueden agregar columnas despues */ }
    setShowCreateTablero(false);
    setTableroListKey((k) => k + 1);
    onSelectTablero(String(t.id));
  };

  const onCardClick = useCallback((tareaRaw) => { openEditModal(toTask(tareaRaw)); }, [openEditModal]);

  const { onCardMouseDown, draggingId, hoverColumnId } = usePointerDnD(onCardDrop, onCardClick);

  const columnasOrdenadas = useMemo(() => [...columnas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)), [columnas]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, color: '#9fb3cc' }}>
          {tablero?.nombre || 'Selecciona un tablero'}{tablero?.descripcion ? ` — ${tablero.descripcion}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <TableroSelector tableroId={tableroId} onSelect={onSelectTablero} refreshKey={tableroListKey} />
          {canManage && (
            <button className="btn btn-primary" onClick={() => setShowCreateTablero(true)} style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}>
              ➕ Nuevo tablero
            </button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {!tableroId ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9fb3cc' }}>
          <h3 style={{ margin: '0 0 8px', color: '#e2e8f0' }}>Selecciona un tablero</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Elige un tablero existente o crea uno nuevo.</p>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9fb3cc' }}>Cargando tablero...</div>
      ) : (
        <div style={{ overflowX: 'auto', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', minWidth: 'max-content' }}>
            {columnasOrdenadas.length === 0 ? (
              <div style={{ padding: '40px 60px', color: '#9fb3cc', fontSize: 14, background: '#1e2a3a', borderRadius: 12, border: `1px solid ${borderCol}` }}>
                Este tablero no tiene columnas configuradas.
              </div>
            ) : (
              columnasOrdenadas.map((col) => (
                <KanbanColumn
                  key={col.id}
                  columna={col}
                  cards={getTarjetasPorColumna(col.id)}
                  tareasById={tareasById}
                  onCardMouseDown={onCardMouseDown}
                  draggingId={draggingId}
                  isHovered={String(hoverColumnId) === String(col.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {showCreateTablero && (
        <CreateTableroModal onClose={() => setShowCreateTablero(false)} onCreate={onTableroCreated} />
      )}
    </div>
  );
}
