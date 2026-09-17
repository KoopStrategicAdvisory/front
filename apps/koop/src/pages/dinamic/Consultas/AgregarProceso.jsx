import React, { useEffect, useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { listClientes } from '../../../api/clientes';
import { listExpedientes } from '../../../api/expedientes';
import { agregarSeguimiento } from '../../../api/consultas';
import { CONSULTATION_PORTALS } from '../../../constants/consultaPortals';

export default function AgregarProceso({ onClose, onAdded }) {
  const [busqueda, setBusqueda] = useState('');
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState('');
  const [expedientes, setExpedientes] = useState([]);
  const [expediente, setExpediente] = useState('');
  const [organismo, setOrganismo] = useState('');
  const [modalidad, setModalidad] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingExpedientes, setLoadingExpedientes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const exp = expedientes.find((e) => String(e.id) === expediente);
  const portal = CONSULTATION_PORTALS.find((p) => p.label === organismo);

  useEffect(() => {
    let cancelled = false;
    setLoadingClientes(true);
    const timer = setTimeout(() => {
      listClientes({ search: busqueda, limit: 50 }).then((data) => {
        if (!cancelled) setClientes(data.items || []);
      }).catch(() => { if (!cancelled) setError('No se pudieron cargar los clientes. Intenta buscar nuevamente.'); })
        .finally(() => { if (!cancelled) setLoadingClientes(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [busqueda]);

  useEffect(() => {
    if (!cliente) return;
    let cancelled = false;
    setLoadingExpedientes(true);
    (async () => {
      try {
        let items = [], page;
        do {
          page = await listExpedientes({ id_cliente: cliente, con_radicado: true, limit: 100, offset: items.length });
          items = items.concat(page.items || []);
        } while (!cancelled && page.items?.length && items.length < page.total);
        if (!cancelled) setExpedientes(items);
      } catch { if (!cancelled) setError('No se pudieron cargar los expedientes del cliente.'); }
      finally { if (!cancelled) setLoadingExpedientes(false); }
    })();
    return () => { cancelled = true; };
  }, [cliente]);

  const guardar = async (event) => {
    event.preventDefault();
    if (!exp || !organismo || !modalidad || saving) return;
    setSaving(true); setError('');
    try { await agregarSeguimiento({ id_expediente: exp.id, organismo, modalidad }); onAdded(); }
    catch (e) { setError(e?.response?.data?.message || 'No se pudo agregar el proceso.'); }
    finally { setSaving(false); }
  };

  return <Modal show onClose={() => { if (!saving) onClose(); }} title="Agregar proceso a revisión diaria">
    <form onSubmit={guardar} className="consulta-form">
      {error && <p role="alert" className="alert alert-error">{error}</p>}
      <fieldset disabled={saving}>
        <label>1. Cliente
          <input className="input" aria-label="Buscar cliente" placeholder="Buscar por nombre o documento" value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setCliente(''); setExpedientes([]); setExpediente(''); setOrganismo(''); setModalidad(''); }} />
          <select className="input" required value={cliente} disabled={loadingClientes} onChange={(e) => {
            setCliente(e.target.value); setExpedientes([]); setExpediente(''); setOrganismo(''); setModalidad(''); setError('');
          }}>
            <option value="">{loadingClientes ? 'Buscando clientes…' : 'Selecciona el cliente'}</option>
            {clientes.map((c) => <option key={c.id} value={String(c.id)}>{c.nombre}{c.numero_documento ? ` · ${c.numero_documento}` : ''}</option>)}
          </select>
        </label>
        {clientes.length === 50 && <small>Afina la búsqueda para encontrar más clientes.</small>}
        {cliente && <label>2. Expediente · radicado del juzgado/despacho
          <select className="input" required value={expediente} disabled={loadingExpedientes} onChange={(e) => { setExpediente(e.target.value); setOrganismo(''); setModalidad(''); }}>
            <option value="">{loadingExpedientes ? 'Cargando expedientes…' : 'Selecciona el radicado'}</option>
            {expedientes.map((e) => <option key={e.id} value={String(e.id)}>{e.numero_radicado_despacho}{e.nombre_tipo_proceso ? ` · ${e.nombre_tipo_proceso}` : ''}</option>)}
          </select>
          {!loadingExpedientes && !expedientes.length && <small>Este cliente no tiene expedientes con radicado externo. Regístralo en el expediente para poder agregarlo.</small>}
        </label>}
        {exp && <>
          <div className="consulta-radicado"><small>Radicado que se consultará</small><strong>{exp.numero_radicado_despacho}</strong></div>
          <label>3. Página de consulta
            <select className="input" required value={organismo} onChange={(e) => {
              setOrganismo(e.target.value);
              setModalidad(CONSULTATION_PORTALS.find((p) => p.label === e.target.value)?.automatica ? '' : 'manual');
            }}>
              <option value="">Selecciona la página</option>
              {CONSULTATION_PORTALS.map((p) => <option key={p.label} value={p.label}>{p.label}</option>)}
            </select>
          </label>
        </>}
        {portal && <label>4. Modalidad de consulta
          <select className="input" required value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
            {portal.automatica && <option value="">Selecciona la modalidad</option>}
            <option value="manual">Consulta de procesos (manual)</option>
            {portal.automatica && <option value="automatica">Consulta de procesos (automática)</option>}
          </select>
          <small>{modalidad === 'automatica' ? 'El sistema consulta a las 6:00 a.m., hora de Bogotá. El abogado confirma el resultado del día.' : 'Abre la página, completa el acceso o captcha si lo solicita y registra el resultado.'}</small>
        </label>}
      </fieldset>
      <div className="kf-modal-footer">
        <button type="button" className="btn btn-secondary" disabled={saving} onClick={onClose}>Cancelar</button>
        <button className="btn btn-gold" disabled={saving || !exp || !modalidad || !portal}>{saving ? 'Agregando…' : 'Agregar a la lista diaria'}</button>
      </div>
    </form>
  </Modal>;
}
