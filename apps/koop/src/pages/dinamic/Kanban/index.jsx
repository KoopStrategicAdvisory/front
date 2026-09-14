import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useKanban } from '../../../hooks/useKanban';
import { useAccess } from '../../../context/AccessContext';
import { listTableros, createTablero as apiCreateTablero } from '../../../api/kanban';
import '../../../styles/dashboard.css';
import '../../../styles/mi-expediente.css';

const borderCol = '#394b61';

// ─── DnD helpers ──────────────────────────────────────────────────────────────
function useDnD(posiciones, reordenarPosiciones, tablero) {
  const dragging = useRef(null);

  const onDragStart = useCallback((e, posId) => {
    dragging.current = posId;
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e, columnaId) => {
    e.preventDefault();
    const posId = dragging.current;
    dragging.current = null;
    if (!posId || !tablero) return;

    const pos = posiciones.find((p) => p._id === posId);
    if (!pos || pos.ID_COLUMNA === columnaId) return;

    const inCol = posiciones.filter((p) => p.ID_COLUMNA === columnaId && p._id !== posId);
    const newOrd = inCol.length;

    const batch = posiciones
      .filter((p) => p._id)
      .map((p) =>
        p._id === posId
          ? { _id: p._id, ID_COLUMNA: columnaId, ORDEN_VERTICAL: newOrd }
          : { _id: p._id, ID_COLUMNA: p.ID_COLUMNA, ORDEN_VERTICAL: p.ORDEN_VERTICAL ?? 0 }
      );

    reordenarPosiciones(batch);
  }, [posiciones, reordenarPosiciones, tablero]);

  return { onDragStart, onDragOver, onDrop };
}

// ─── Card component ───────────────────────────────────────────────────────────
function KanbanCard({ pos, onDragStart }) {
  const titulo = pos.ID_TAREA?.TITULO ?? pos.TITULO ?? `Tarea ${pos.ID_TAREA?._id || pos.ID_TAREA || ''}`;
  const estado = pos.ID_TAREA?.ID_ESTADO_TAREA?.NOMBRE || '';
  const limite = pos.ID_TAREA?.FECHA_LIMITE;

  const isOverdue = limite && new Date(limite) < new Date();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, pos._id)}
      style={{
        background: 'linear-gradient(135deg, #283447, #1c2c3e)',
        border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : borderCol}`,
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'grab',
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
function KanbanColumn({ columna, cards, onDragStart, onDragOver, onDrop }) {
  const wipExceeded = columna.WIP_LIMIT && cards.length > columna.WIP_LIMIT;
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
      onDrop={(e) => onDrop(e, columna._id)}
    >
      {/* Column header */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px solid ${borderCol}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        background: columna.COLOR ? `${columna.COLOR}18` : '#1e2a3a',
        borderLeft: columna.COLOR ? `3px solid ${columna.COLOR}` : 'none',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{columna.NOMBRE}</span>
        <span style={{
          fontSize: 11, padding: '2px 7px', borderRadius: 10,
          background: wipExceeded ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.1)',
          color: wipExceeded ? '#f87171' : '#a5b4fc',
          border: `1px solid ${wipExceeded ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
        }}>
          {cards.length}{columna.WIP_LIMIT ? `/${columna.WIP_LIMIT}` : ''}
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
            .sort((a, b) => (a.ORDEN_VERTICAL ?? 0) - (b.ORDEN_VERTICAL ?? 0))
            .map((pos) => (
              <KanbanCard key={pos._id} pos={pos} onDragStart={onDragStart} />
            ))
        )}
      </div>
    </div>
  );
}

// ─── Tablero selector ─────────────────────────────────────────────────────────
function TableroSelector({ tableroId, onSelect }) {
  const [tableros, setTableros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listTableros().then((res) => { setTableros(res.items ?? []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <span style={{ color: '#9fb3cc', fontSize: 13 }}>Cargando tableros...</span>;

  return (
    <select
      value={tableroId || ''}
      onChange={(e) => onSelect(e.target.value)}
      style={{ padding: '8px 12px', background: '#1e2a3a', border: `1px solid ${borderCol}`, borderRadius: 8, color: '#e2e8f0', fontSize: 13 }}
    >
      <option value="">Seleccionar tablero...</option>
      {tableros.map((t) => <option key={t._id} value={t._id}>{t.NOMBRE}</option>)}
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
      const created = await apiCreateTablero({ NOMBRE: nombre.trim(), DESCRIPCION: desc.trim() || undefined, ES_PUBLICO: false, ACTIVE: true });
      onCreate(created);
    } catch (e) {
      setErr(e?.message || 'Error al crear tablero');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#1e2a3a', borderRadius: 12, padding: 24, maxWidth: 440, width: '90%', border: `1px solid ${borderCol}` }}>
        <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600, color: '#e2e8f0' }}>➕ Nuevo Tablero Kanban</h3>
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
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px' }}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCreate} style={{ padding: '10px 20px' }} disabled={loading}>Crear</button>
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

  const { tablero, columnas, posiciones, loading, error, loadTablero, getTarjetasPorColumna, moverTarea, reordenarPosiciones, createTablero } = useKanban();

  const [tableroId, setTableroId] = useState('');
  const [showCreateTablero, setShowCreateTablero] = useState(false);

  const onSelectTablero = (id) => {
    setTableroId(id);
    if (id) loadTablero(id);
  };

  const onTableroCreated = (t) => {
    setShowCreateTablero(false);
    onSelectTablero(t._id);
  };

  const { onDragStart, onDragOver, onDrop } = useDnD(posiciones, reordenarPosiciones, tablero);

  return (
    <div
      className="dash-page"
      style={{ backgroundImage: "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh', padding: '20px' }}
    >
      <div style={{ width: '100%', maxWidth: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, background: '#1e2a3a', borderRadius: 12, padding: '16px 20px', border: `1px solid ${borderCol}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="5" height="18" rx="1" stroke="white" strokeWidth="2"/><rect x="10" y="3" width="5" height="13" rx="1" stroke="white" strokeWidth="2"/><rect x="17" y="3" width="4" height="9" rx="1" stroke="white" strokeWidth="2"/></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
                {tablero ? tablero.NOMBRE : 'Tablero Kanban'}
              </h1>
              {tablero?.DESCRIPCION && <p style={{ margin: 0, fontSize: 12, color: '#9fb3cc' }}>{tablero.DESCRIPCION}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <TableroSelector tableroId={tableroId} onSelect={onSelectTablero} />
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
              {columnas.length === 0 ? (
                <div style={{ padding: '40px 60px', color: '#9fb3cc', fontSize: 14, background: '#1e2a3a', borderRadius: 12, border: `1px solid ${borderCol}` }}>
                  Este tablero no tiene columnas configuradas.
                </div>
              ) : (
                columnas
                  .sort((a, b) => (a.ORDEN ?? 0) - (b.ORDEN ?? 0))
                  .map((col) => (
                    <KanbanColumn
                      key={col._id}
                      columna={col}
                      cards={getTarjetasPorColumna(col._id)}
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
