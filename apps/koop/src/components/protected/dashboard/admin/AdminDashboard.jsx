// AdminDashboard - Portal del cliente (pagina principal para administradores)
// Estructura general: Acciones rapidas, KPIs, widgets personalizados y documentos recientes
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../../api/axios";
import { listClientes } from "../../../../api/clientes";
import { listNotificacionesProximasVencer } from "../../../../api/notificaciones";
import { useAuth } from "../../../../context/AuthContext";
import useCalendarEvents from "../../../../hooks/useCalendarEvents";
import { normalizeUpperAscii } from "../../../../utils/strings.js";
import "../../../../styles/dashboard.css";
import UploadDocumentAction from "../common/UploadDocumentAction.jsx";
import CalendarWidget from "../common/CalendarWidget.jsx";
import AiChat from "./AiChat.jsx";
import KpiCard from "./KpiCard";
import RecentDocuments from "./RecentDocuments";

function toDateKey(date) {
  if (!(date instanceof Date)) return null;
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const displayName = normalizeUpperAscii(user?.name || "Dashboard");
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [docsRefreshKey, setDocsRefreshKey] = useState(0);

  const [alertas, setAlertas] = useState([]);
  const [alertasLoading, setAlertasLoading] = useState(true);

  const [calendarEvents, setCalendarEvents] = useCalendarEvents();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);

  const [noteText, setNoteText] = useState("");
  const [publishToAll, setPublishToAll] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [kbOffset, setKbOffset] = useState(0);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const toolsMenuRef = useRef(null);

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState(null);
  const tasksCount = useMemo(() => Array.isArray(calendarEvents) ? calendarEvents.length : 0, [calendarEvents]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/kpis/overview");
        setKpis(data);
      } catch (e) {
        // El endpoint de KPIs todavia no existe en el backend nuevo (quedo
        // pendiente de reconstruir, igual que paso con Consultas) — no tiene
        // caso mostrarle al usuario un volcado crudo de un 404.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setAlertasLoading(true);
        const items = await listNotificacionesProximasVencer(10);
        setAlertas(Array.isArray(items) ? items : []);
      } catch (e) {
        setAlertas([]);
      } finally {
        setAlertasLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setClientsLoading(true);
        setClientsError(null);
        const response = await listClientes();
        if (ignore) return;
        const items = Array.isArray(response?.items) ? response.items : [];
        setClients(
          items
            .map((item) => ({
              id: String(item?.id ?? '').trim(),
              name: item?.nombre || item?.email || 'Cliente sin nombre',
              email: item?.email,
            }))
            .filter((entry) => entry.id)
        );
      } catch (err) {
        if (!ignore) {
          setClientsError(err?.response?.data?.message || err?.message || 'No se pudo cargar clientes');
        }
      } finally {
        if (!ignore) {
          setClientsLoading(false);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!isToolsOpen) return undefined;
    const handleClick = (e) => {
      try {
        if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target)) {
          setIsToolsOpen(false);
        }
      } catch (_) {}
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setIsToolsOpen(false);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClick);
      window.addEventListener('keydown', handleKey);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('click', handleClick);
        window.removeEventListener('keydown', handleKey);
      }
    };
  }, [isToolsOpen]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients;
    const normalized = searchTerm.trim().toLowerCase();
    return clients.filter((client) =>
      [client.id, client.name, client.email].some((value) =>
        String(value || '').toLowerCase().includes(normalized)
      )
    );
  }, [clients, searchTerm]);

  const selectedDayEvents = useMemo(() => {
    const events = calendarEvents.filter((event) => event?.date === selectedDateKey);
    return events.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }, [calendarEvents, selectedDateKey]);

  const handleToggleClient = (clientId) => {
    const normalized = String(clientId);
    setSelectedClientIds((prev) => {
      if (prev.includes(normalized)) {
        return prev.filter((id) => id !== normalized);
      }
      return [...prev, normalized];
    });
  };

  const handleSaveNote = () => {
    const trimmed = noteText.trim();
    if (!selectedDateKey || !trimmed) return;
    if (!publishToAll && selectedClientIds.length === 0) return;

    const newEvent = {
      id: generateEventId(),
      date: selectedDateKey,
      note: trimmed,
      audience: publishToAll
        ? { type: 'all' }
        : { type: 'clients', clientIds: selectedClientIds.map((id) => String(id).trim()) },
      createdAt: new Date().toISOString(),
      createdBy: user?.id || user?.sub || 'admin',
    };

    setCalendarEvents((prev) => [...prev, newEvent]);
    setNoteText('');
    setSelectedClientIds([]);
    setPublishToAll(true);
    setIsComposeOpen(false);
  };

  // Orden pensado segun lo mas importante del dia a dia: expedientes,
  // tareas pendientes (con su contador), clientes, y la revision diaria
  // de consultas externas — no es un orden definitivo/quemado, se puede
  // seguir ajustando segun lo que realmente se use mas.
  const adminPrimaryActions = [
    { key: 'expedientes', label: 'Expedientes', to: '/admin/expedientes', icon: '📁' },
    { key: 'tareas', label: 'Tareas', to: '/admin/tareas', icon: '✅', badge: tasksCount },
    { key: 'clientes', label: 'Clientes', to: '/admin/clientes-activos', icon: '👥' },
    { key: 'consultas', label: 'Consultas diarias', to: '/consultas', icon: '🔎' },
  ];

  const selectedDateLabel = useMemo(
    () =>
      selectedDate?.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [selectedDate]
  );

  const handleCalendarChange = (date) => {
    setSelectedDate(date);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsComposeOpen(true);
    }
  };

  const handleDeleteDayNotes = () => {
    if (!selectedDateKey || selectedDayEvents.length === 0) return;
    const message = `¿Borrar todas las anotaciones del ${selectedDateLabel}?`;
    if (typeof window !== 'undefined') {
      const ok = window.confirm(message);
      if (!ok) return;
    }
    setCalendarEvents((prev) => prev.filter((evt) => evt?.date !== selectedDateKey));
  };

  useEffect(() => {
    if (!isComposeOpen) {
      setKbOffset(0);
      return undefined;
    }
    const updateOffset = () => {
      try {
        const vv = window.visualViewport;
        if (vv) {
          const offset = Math.max(0, Math.round(window.innerHeight - vv.height));
          setKbOffset(offset);
        } else {
          setKbOffset(0);
        }
      } catch (_) {
        setKbOffset(0);
      }
    };
    updateOffset();
    const vv = window.visualViewport;
    vv && vv.addEventListener('resize', updateOffset);
    window.addEventListener('resize', updateOffset);
    return () => {
      vv && vv.removeEventListener('resize', updateOffset);
      window.removeEventListener('resize', updateOffset);
    };
  }, [isComposeOpen]);

  return (
    <div
      className="dash-page"
      style={{
        backgroundImage:
          "linear-gradient(rgba(13,27,42,0.65), rgba(27,38,59,0.65)), url('/fondodashboard.jpg')",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
      }}
    >
      <div className="dash-card" style={{ maxWidth: 1200 }}>
        <style>{`
          .admin-main-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
          @media (min-width: 1024px) { .admin-main-grid { grid-template-columns: repeat(3, 1fr); } }
          .admin-main-left { grid-column: span 1; display: flex; flex-direction: column; gap: 16px; }
          @media (min-width: 1024px) { .admin-main-left { grid-column: span 2; } }
          .admin-main-right { display: flex; flex-direction: column; gap: 16px; }
          .admin-clients-list { max-height: 200px; overflow-y: auto; border: 1px solid var(--border); border-radius: 10px; padding: 8px; }
          .admin-clients-item { display: flex; align-items: center; justify-content: space-between; padding: 7px 6px; border-bottom: 1px solid var(--border-subtle); border-radius: 6px; transition: background 0.15s ease; }
          .admin-clients-item:hover { background: rgba(148,163,184,0.06); }
          .admin-clients-item:last-child { border-bottom: none; }
          /* Oculta el panel de redaccion en pantallas pequeñas para usar modal */
          @media (max-width: 1023px) { .compose-panel { display: none; } }
          /* Modal flotante para redaccion en móvil */
          .compose-overlay { position: fixed; inset: 0; background: rgba(4,8,16,0.68); backdrop-filter: blur(3px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
          .compose-modal { background: linear-gradient(180deg, #101c2e 0%, #0b1524 100%); color: var(--text-primary); width: min(680px, 92vw); border-radius: var(--r-lg); padding: 20px; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-lg); max-height: 100dvh; overflow: auto; }
          @media (min-width: 1024px) { .compose-overlay { display: none; } }
        `}</style>

        <div className="dash-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 16, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-gold-soft), var(--accent-gold) 65%, var(--accent-gold-deep))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'var(--shadow-gold)', fontFamily: 'var(--ff-heading)', fontWeight: 700, fontSize: 20, color: '#241a04',
            }}>
              {(displayName || '?').trim().charAt(0)}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent-gold-soft)' }}>
                Bienvenido de nuevo
              </p>
              <div className="dash-title" style={{ marginTop: 2 }}>{displayName}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <UploadDocumentAction
              buttonClassName="btn btn-primary"
              allowFolderInput
              onUploaded={() => setDocsRefreshKey((value) => value + 1)}
            />
          </div>
        </div>

        {/* Accesos rápidos: lo más importante del día a día, en grande y
            visible — expedientes, tareas, clientes y la revisión diaria. */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {adminPrimaryActions.map((action) => (
            <Link key={action.key} className="koop-tile-lg" to={action.to} title={action.label}>
              <span className="koop-tile-lg-icon" aria-hidden="true">{action.icon}</span>
              <span className="koop-tile-lg-label">{action.label}</span>
              {action.badge != null && action.badge > 0 && (
                <span className="koop-tile-lg-badge">{action.badge}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="admin-main-grid" style={{ marginTop: 16 }}>
          <div className="admin-main-left">
            <div className="dash-item">
              <div className="koop-section-head">
                <span className="koop-section-icon" aria-hidden="true">🏛️</span>
                <span className="koop-section-title">Centro administrativo</span>
              </div>
              <p style={{ marginBottom: 14, color: 'var(--text-secondary)', fontSize: 13.5, lineHeight: 1.5 }}>
                Supervisa la operación del portal, gestiona usuarios y da seguimiento a la información más reciente.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Link className="btn btn-primary btn-sm" to="/admin/usuarios" title="Administrar usuarios">
                  Administrar usuarios
                </Link>
                <Link className="btn btn-secondary btn-sm" to="/admin/prospectos" title="Personas registradas que no son clientes todavía">
                  Prospectos
                </Link>
              </div>
            </div>

            <CalendarWidget
              value={selectedDate}
              onChange={handleCalendarChange}
              events={calendarEvents}
            />
          </div>

          <div className="admin-main-right">
            <div className="dash-item">
              <div className="koop-section-head" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="koop-section-icon" aria-hidden="true" style={{ background: 'linear-gradient(135deg, rgba(240,185,66,0.22), rgba(239,68,68,0.14))', borderColor: 'rgba(240,185,66,0.3)' }}>🔔</span>
                  <span className="koop-section-title">Alertas de vencimiento</span>
                </div>
                {alertas.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.14)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                    {alertas.length}
                  </span>
                )}
              </div>
              {alertasLoading ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Cargando alertas...</div>
              ) : alertas.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin términos próximos a vencer. 🎉</div>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {alertas.slice(0, 6).map((n) => {
                    const dias = n.fecha_vencimiento
                      ? Math.ceil((new Date(n.fecha_vencimiento) - new Date()) / 86400000)
                      : null;
                    const urgent = dias != null && dias <= 2;
                    return (
                      <Link
                        key={n.id}
                        to={n.id_expediente ? `/admin/expedientes/${n.id_expediente}` : '#'}
                        style={{
                          display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center',
                          padding: '9px 12px', borderRadius: 10, textDecoration: 'none',
                          background: urgent ? 'rgba(239,68,68,0.06)' : 'rgba(148,163,184,0.05)',
                          border: `1px solid ${urgent ? 'rgba(239,68,68,0.22)' : 'var(--border-subtle)'}`,
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {n.objeto_notificacion || n.nombre_tipo_notificacion || 'Notificación'}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: urgent ? '#fca5a5' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {dias != null ? (dias <= 0 ? 'Vence hoy' : `${dias} día${dias === 1 ? '' : 's'}`) : ''}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <AiChat
              title="Asistente IA"
              systemPrompt={"Eres un asistente interno de Koop Strategic Advisory. Responde de forma breve, clara y profesional."}
            />

            <div className="dash-item compose-panel">
              <div className="koop-section-head">
                <span className="koop-section-icon" aria-hidden="true">📝</span>
                <span className="koop-section-title">{selectedDateLabel || 'Selecciona un día'}</span>
              </div>
              <p style={{ marginTop: -2, marginBottom: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                Registra recordatorios o publicaciones para clientes específicos o para todos.
              </p>

              <textarea
                className="textarea"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Agregar nota o detalle del evento"
                rows={4}
                style={{ width: '100%', marginTop: 12, boxSizing: 'border-box' }}
              />

              <div style={{ marginTop: 12 }}>
                <label className="kf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={publishToAll}
                    onChange={(event) => {
                      setPublishToAll(event.target.checked);
                      if (event.target.checked) {
                        setSelectedClientIds([]);
                      }
                    }}
                  />
                  <span>Publicar para todos los clientes</span>
                </label>
              </div>

              {!publishToAll && (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="input"
                    type="search"
                    placeholder="Buscar por nombre, email o ID"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  {clientsError && (
                    <div className="alert alert-error" style={{ marginTop: 8 }}>{clientsError}</div>
                  )}
                  <div className="admin-clients-list" style={{ marginTop: 8 }}>
                    {clientsLoading && <div style={{ opacity: 0.7 }}>Cargando clientes...</div>}
                    {!clientsLoading && filteredClients.length === 0 && (
                      <div style={{ opacity: 0.7 }}>No se encontraron clientes</div>
                    )}
                    {filteredClients.map((client) => {
                      const checked = selectedClientIds.includes(client.id);
                      return (
                        <label key={client.id} className="admin-clients-item">
                          <span style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{client.name}</span>
                            <span style={{ fontSize: 12, opacity: 0.75 }}>{client.id}</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleClient(client.id)}
                          />
                        </label>
                      );
                    })}
                  </div>
                  {selectedClientIds.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                      Seleccionados: {selectedClientIds.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setNoteText('');
                    setPublishToAll(true);
                    setSelectedClientIds([]);
                  }}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteDayNotes}
                  disabled={!selectedDateKey || selectedDayEvents.length === 0}
                >
                  Borrar anotaciones
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || (!publishToAll && selectedClientIds.length === 0)}
                >
                  Guardar anotación
                </button>
              </div>

              {selectedDayEvents.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Anotaciones del día</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: 10,
                          background: 'linear-gradient(180deg, #1b273c 0%, #161f31 100%)',
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>{event.note}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {event.audience?.type === 'all'
                            ? 'Visible para todos los clientes'
                            : `Visible para: ${Array.isArray(event.audience?.clientIds) && event.audience.clientIds.length > 0 ? event.audience.clientIds.join(", ") : "—"}` }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="dash-item">
              <div className="koop-section-head">
                <span className="koop-section-icon" aria-hidden="true">📢</span>
                <span className="koop-section-title">Recordatorios del equipo</span>
              </div>
              <p style={{ marginBottom: 0, fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Comparte novedades internas, carga reportes de gestión o establece tareas prioritarias para tu equipo desde esta sección.
              </p>
            </div>
            <div className="dash-item">
              <div className="koop-section-head">
                <span className="koop-section-icon" aria-hidden="true">🎵</span>
                <span className="koop-section-title">Reproductor Spotify</span>
              </div>
              <p style={{ marginBottom: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Está disponible como ventana flotante en la esquina inferior izquierda.
                La música continuará reproduciéndose mientras navegas entre páginas.
              </p>
            </div>

          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <RecentDocuments refreshKey={docsRefreshKey} />
        </div>
      </div>
      {isComposeOpen && (
        <div className="compose-overlay" role="dialog" aria-modal="true">
          <div
            className="compose-modal"
            style={{
              marginBottom: kbOffset > 0 ? kbOffset : 0,
              maxHeight: `calc(100dvh - ${kbOffset}px)`,
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{selectedDateLabel || 'Selecciona un dia'}</div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsComposeOpen(false)} aria-label="Cerrar">
                Cerrar
              </button>
            </div>

            <div className="dash-item" style={{ padding: 0 }}>
              <p style={{ marginTop: 4, fontSize: 13, color: 'var(--text-secondary)' }}>
                Registra recordatorios o publicaciones para clientes específicos o para todos.
              </p>

              <textarea
                className="textarea"
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                placeholder="Agregar nota o detalle del evento"
                rows={4}
                style={{ width: '100%', marginTop: 12, boxSizing: 'border-box' }}
              />

              <div style={{ marginTop: 12 }}>
                <label className="kf-checkbox-label">
                  <input
                    type="checkbox"
                    checked={publishToAll}
                    onChange={(event) => {
                      setPublishToAll(event.target.checked);
                      if (event.target.checked) {
                        setSelectedClientIds([]);
                      }
                    }}
                  />
                  <span>Publicar para todos los clientes</span>
                </label>
              </div>

              {!publishToAll && (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="input"
                    type="search"
                    placeholder="Buscar por nombre, email o ID"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                  {clientsError && (
                    <div className="alert alert-error" style={{ marginTop: 8 }}>{clientsError}</div>
                  )}
                  <div className="admin-clients-list" style={{ marginTop: 8 }}>
                    {clientsLoading && <div style={{ opacity: 0.7 }}>Cargando clientes...</div>}
                    {!clientsLoading && filteredClients.length === 0 && (
                      <div style={{ opacity: 0.7 }}>No se encontraron clientes</div>
                    )}
                    {filteredClients.map((client) => {
                      const checked = selectedClientIds.includes(client.id);
                      return (
                        <label key={client.id} className="admin-clients-item">
                          <span style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 600 }}>{client.name}</span>
                            <span style={{ fontSize: 12, opacity: 0.75 }}>{client.id}</span>
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleClient(client.id)}
                          />
                        </label>
                      );
                    })}
                  </div>
                  {selectedClientIds.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                      Seleccionados: {selectedClientIds.join(', ')}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setNoteText('');
                    setPublishToAll(true);
                    setSelectedClientIds([]);
                  }}
                >
                  Limpiar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteDayNotes}
                  disabled={!selectedDateKey || selectedDayEvents.length === 0}
                >
                  Borrar anotaciones
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={handleSaveNote}
                  disabled={!noteText.trim() || (!publishToAll && selectedClientIds.length === 0)}
                >
                  Guardar anotación
                </button>
              </div>

              {selectedDayEvents.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Anotaciones del día</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {selectedDayEvents.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          padding: 10,
                          background: 'linear-gradient(180deg, #1b273c 0%, #161f31 100%)',
                        }}
                      >
                        <div style={{ marginBottom: 6 }}>{event.note}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {event.audience?.type === 'all'
                            ? 'Visible para todos los clientes'
                            : `Visible para: ${Array.isArray(event.audience?.clientIds) && event.audience.clientIds.length > 0 ? event.audience.clientIds.join(", ") : "-"}` }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      
    </div>
  );
}































