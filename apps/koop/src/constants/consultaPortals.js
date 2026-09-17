// Organismos/portales externos donde se consultan procesos — un mismo
// expediente puede tener un radicado distinto en cada uno. Usado tanto por
// la pagina de Consultas externas (links + selector de organismo) como por
// la pestaña "Radicados" del detalle de expediente (donde se cargan).
export const CONSULTATION_PORTALS = [
  { label: 'Consulta de procesos Rama Judicial', url: 'https://consultaprocesos.ramajudicial.gov.co/Procesos/Index', automatica: true },
  { label: 'Publicaciones Procesales Rama Judicial', url: 'https://publicacionesprocesales.ramajudicial.gov.co/' },
  { label: 'SIUGJ', url: 'https://siugj.ramajudicial.gov.co/principalPortal/index.php' },
  { label: 'Consultas Fiscalía', url: 'https://consulta-web.fiscalia.gov.co/' },
  { label: 'Consultas Jurisdiccionales SuperFinanciera', url: 'https://www.superfinanciera.gov.co/formulesuqueja/faces/consulta/jurisdiccional.xhtml' },
];

export const ORGANISMO_OPTIONS = CONSULTATION_PORTALS.map((p) => ({ value: p.label, label: p.label }));
