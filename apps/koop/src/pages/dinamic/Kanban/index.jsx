import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useKanban } from '../../../hooks/useKanban';
import { useAccess } from '../../../context/AccessContext';
import { listTableros, createTablero as apiCreateTablero, createColumna } from '../../../api/kanban';
import { listTareas } from '../../../api/tareas';
import { listEstadosTarea } from '../../../api/catalogos';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const borderCol = '#394b61';

// ─── DnD helpers ──────────────────────────────────────────────────────────────
// Reescrito: usaba campos SCREAMING_SNAKE_CASE/_id de una version anterior del
// backend (Mongo) — pos._id, pos.ID_COLUMNA, pos.ORDEN_VERTICAL... — que nunca
// existieron en el backend real (snake_case: pos.id, pos.id_columna...), asi
// que el tablero siempre se veia vacio/roto. Tambien llamaba a
// 'reordenarPosiciones', una funcion que el hook real nunca expuso (solo
// existe 'moverTarea', que mueve una tarea a otra columna) — arrastrar
// cualquier tarjeta tiraba un TypeError en consola.
function useDnD(moverTarea) {
  const dragging = useRef(null);

  const onDragStart = useCallback((e, pos) => {
    if (pos.tipo_entidad !== 'tarea') return; // solo se soporta mover tareas por ahora
    dragging.current = pos;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e, columnaId) => {
    e.preventDefault();
    const pos = dragging.current;
    dragging.current = null;
    if (!pos || pos.id_columna === columnaId) return;
    moverTarea(pos.id_tarea, columnaId).catch(() => {});
  }, [moverTarea]);

  return { onDragStart, onDragOver, onDrop };
}

// ─── Card component ───────────────────────────────────────────────────────────
function KanbanCard({ pos, tarea, onDragStart }) {
  const titulo = tarea?.titulo || pos.titulo_tarea || `Tarea #${pos.id_tarea}`;
  const estado = tarea?.nombre_estado_tarea || '';
  const limite = tarea?.fecha_limite;

  const isOverdue = limite && new Date(limite) < new Date() && !/completad/i.test(estado);

  return (
    <div
      draggable={pos.tipo_entidad === 'tarea'}
      onDragStart={(e) => onDragStart(e, pos)}
      style={{
        background: 'linear-gradient(135deg, #283447, #1c2c3e)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : borderCol}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: pos.tipo_entidad === 'tarea' ? 'grab' : 'default',
        userSelect: 'none',
        marginBottom: 8,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 13, fontWeight: 500, color: '#e2e8f0', marginBottom: 6, lineHeight: 1.4 }}>{titulo}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {estado && (
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)' }}>
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
function KanbanColumn({ columna, cards, tareasById, onDragStart, onDragOver, onDrop }) {
  const wipExceeded = columna.wip_limit && cards.length > columna.wip_limit;
  return (
    <div
      style={{
        minWidth: 260,
        maxWidth: 300,
        flex: '0 0 auto',
        background: '#1a2535',
        border: `1px solid ${borderCol}`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 260px)',
      }}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, columna.id)}
    >
      {/* Column header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        background: columna.color ? `${columna.color}18` : '#1e2a3a',
        borderLeft: columna.color ? `3px solid ${columna.color}` : 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{columna.nombre}</span>
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 10,
          background: wipExceeded ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)',
          color: wipExceeded ? '#f87171' : '#a5b4fc',
          border: `1px solid ${wipExceeded ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
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
              <KanbanCard key={pos.id} pos={pos} tarea={tareasById[pos.id_tarea]} onDragStart={onDragStart} />
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

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const { role } = useAccess();
  const isAdmin = role === 'admin';
  const isLawyer = role === 'lawyer';

  const { tablero, columnas, loading, error, loadTablero, getTarjetasPorColumna, moverTarea } = useKanban();

  const [tableroId, setTableroId] = useState('');
  const [showCreateTablero, setShowCreateTablero] = useState(false);
  const [tableroListKey, setTableroListKey] = useState(0);
  const [tareasById, setTareasById] = useState({});

  const onSelectTablero = (id) => {
    setTableroId(id);
    if (id) loadTablero(id);
  };

  // Las posiciones del tablero solo traen el id de la tarea (y, de regalo, su
  // titulo via JOIN) — para mostrar estado y fecha limite en cada tarjeta hay
  // que cruzarlas con el listado real de tareas.
  useEffect(() => {
    if (!tablero) { setTareasById({}); return; }
    let cancelled = false;
    listTareas({ limit: 500 }).then((res) => {
      if (cancelled) return;
      const map = {};
      (res.items ?? []).forEach((t) => { map[t.id] = t; });
      setTareasById(map);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [tablero]);

  // Un tablero recien creado no trae columnas — antes eso dejaba el board
  // permanentemente vacio (no habia ningun botón para agregar columnas). Se
  // arranca con una columna por cada estado real de tarea, en el mismo orden
  // del catalogo, para que quede utilizable de inmediato.
  const onTableroCreated = async (t) => {
    try {
      const estados = await listEstadosTarea();
      await Promise.all(estados.map((estado, i) => createColumna(t.id, { nombre: estado.nombre, orden: i })));
    } catch { /* el tablero queda creado igual; se pueden agregar columnas despues */ }
    setShowCreateTablero(false);
    setTableroListKey((k) => k + 1);
    onSelectTablero(String(t.id));
  };

  const { onDragStart, onDragOver, onDrop } = useDnD(moverTarea);

  const columnasOrdenadas = useMemo(() => [...columnas].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)), [columnas]);

  return (
    <div
      className="dash-page"
      style={{ backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <div style={{ width: '100%', maxWidth: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, background: '#1e2a3a', borderRadius: 12, padding: '16px 20px', border: `1px solid ${borderCol}`, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="5" height="18" rx="1" stroke="white" strokeWidth="2"/><rect x="10" y="3" width="5" height="13" rx="1" stroke="white" strokeWidth="2"/><rect x="17" y="3" width="4" height="9" rx="1" stroke="white" strokeWidth="2"/></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
                {tablero ? tablero.nombre : 'Tablero Kanban'}
              </h1>
              {tablero?.descripcion && <p style={{ margin: 0, fontSize: 12, color: '#9fb3cc' }}>{tablero.descripcion}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableroSelector tableroId={tableroId} onSelect={onSelectTablero} refreshKey={tableroListKey} />
            {(isAdmin || isLawyer) && (
              <button className="btn btn-primary" onClick={() => setShowCreateTablero(true)} style={{ fontSize: 13, padding: '8px 14px', whiteSpace: 'nowrap' }}>
                ➕ Nuevo tablero
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#fca5a5', marginBottom: 16, fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Board */}
        {!tableroId ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: '#9fb3cc' }}>
            <div style={{ width: 72, height: 72, margin: '0 auto 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="5" height="18" rx="1" stroke="white" strokeWidth="2"/><rect x="10" y="3" width="5" height="13" rx="1" stroke="white" strokeWidth="2"/><rect x="17" y="3" width="4" height="9" rx="1" stroke="white" strokeWidth="2"/></svg>
            </div>
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
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showCreateTablero && (
        <CreateTableroModal onClose={() => setShowCreateTablero(false)} onCreate={onTableroCreated} />
      )}
    </div>
  );
}
