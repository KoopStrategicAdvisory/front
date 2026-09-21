// Convierte docs/manual/manual-de-usuario.md en un manual listo para compartir:
//   - Manual-de-Usuario-KOOP.html  (un solo archivo, con las imágenes incluidas)
//   - Manual-de-Usuario-KOOP.pdf   (paginado, con portada e índice)
// Uso: pnpm manual:build   (las capturas las genera `pnpm manual:capturas`)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { chromium } from '@playwright/test';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirManual = path.join(raiz, 'docs/manual');
const md = fs.readFileSync(path.join(dirManual, 'manual-de-usuario.md'), 'utf8');
const logo = path.join(raiz, 'src/Images/Koop Logo.png');

const fecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'America/Bogota' }).format(new Date());
const dataUri = (archivo, mime = 'image/png') => `data:${mime};base64,${fs.readFileSync(archivo).toString('base64')}`;

// ── Markdown → HTML, con ids en los títulos para el índice ──────────────────
const indice = [];
const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const renderer = new marked.Renderer();
renderer.heading = (texto, nivel) => {
  const limpio = texto.replace(/<[^>]+>/g, '');
  const id = slug(limpio);
  if (nivel === 2 || nivel === 3) indice.push({ nivel, texto: limpio, id });
  return `<h${nivel} id="${id}">${texto}</h${nivel}>\n`;
};
// Imágenes → incrustadas, con su pie de figura
renderer.image = (href, _titulo, texto) => {
  const archivo = path.join(dirManual, href);
  if (!fs.existsSync(archivo)) return `<p class="falta">[Falta la imagen ${href}]</p>`;
  return `<figure><img src="${dataUri(archivo)}" alt="${texto}"><figcaption>${texto}</figcaption></figure>`;
};
marked.use({ renderer, gfm: true });

let cuerpo = marked.parse(md);
// Recuadros: "> **Consejo:** …", "> **Importante:** …", "> **Ojo:** …"
cuerpo = cuerpo.replace(/<blockquote>\s*<p><strong>(Consejo|Importante|Ojo|Ejemplo|Recuerda):/g,
  (_m, tipo) => `<blockquote class="caja caja-${slug(tipo)}"><p><strong>${tipo}:`);

const toc = indice.map((i) => `<li class="n${i.nivel}"><a href="#${i.id}">${i.texto}</a></li>`).join('\n');

const css = `
  @page { size: A4; margin: 18mm 16mm 20mm; }
  * { box-sizing: border-box; }
  body { font: 11.5pt/1.55 'Segoe UI', system-ui, Arial, sans-serif; color: #1e293b; margin: 0; }
  main { max-width: 860px; margin: 0 auto; padding: 0 24px 60px; }
  .portada { min-height: 92vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
  .portada img { width: 150px; margin-bottom: 28px; }
  .portada h1 { font-size: 34pt; margin: 0 0 8px; color: #0d1b2a; letter-spacing: .5px; }
  .portada .sub { font-size: 15pt; color: #c9932a; margin: 0 0 40px; font-weight: 600; }
  .portada .meta { color: #64748b; font-size: 11pt; }
  .indice { page-break-after: always; }
  .indice h2 { border: 0; }
  .indice ul { list-style: none; padding: 0; margin: 0; }
  .indice li { padding: 3px 0; }
  .indice li.n2 { font-weight: 700; margin-top: 10px; }
  .indice li.n3 { margin-left: 22px; font-size: 10.5pt; }
  .indice a { color: inherit; text-decoration: none; }
  h1, h2, h3 { color: #0d1b2a; line-height: 1.25; }
  h2 { font-size: 21pt; border-bottom: 3px solid #c9932a; padding-bottom: 6px; margin: 0 0 16px; page-break-before: always; }
  h2:first-of-type { page-break-before: auto; }
  h3 { font-size: 14.5pt; margin: 26px 0 8px; color: #1d3a5f; }
  h4 { font-size: 12pt; margin: 18px 0 6px; }
  p, li { orphans: 3; widows: 3; }
  a { color: #0b6bcb; }
  ol, ul { padding-left: 24px; }
  li { margin: 4px 0; }
  figure { margin: 16px 0 22px; text-align: center; page-break-inside: avoid; }
  figure img { max-width: 100%; border: 1px solid #cbd5e1; border-radius: 8px; box-shadow: 0 2px 8px rgba(15,23,42,.18); }
  figcaption { font-size: 9.5pt; color: #64748b; margin-top: 6px; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 10.5pt; page-break-inside: avoid; }
  th { background: #0d1b2a; color: #fff; text-align: left; }
  th, td { border: 1px solid #cbd5e1; padding: 7px 10px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8fafc; }
  code { background: #eef2f7; padding: 1px 6px; border-radius: 4px; font-size: 10pt; }
  blockquote { margin: 14px 0; padding: 10px 16px; border-left: 5px solid #94a3b8; background: #f1f5f9; border-radius: 0 8px 8px 0; page-break-inside: avoid; }
  blockquote p { margin: 4px 0; }
  .caja-consejo { border-color: #0ea5a4; background: #ecfeff; }
  .caja-importante { border-color: #e11d48; background: #fff1f2; }
  .caja-ojo { border-color: #d97706; background: #fffbeb; }
  .caja-ejemplo, .caja-recuerda { border-color: #2563eb; background: #eff6ff; }
  .falta { color: #e11d48; font-weight: 700; }
  @media screen { body { background: #e2e8f0; } main { background: #fff; margin: 24px auto; padding: 32px 40px; border-radius: 12px; box-shadow: 0 4px 24px rgba(15,23,42,.15); } }
`;

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manual de usuario — KOOP Strategic Advisory</title><style>${css}</style></head><body><main>
<section class="portada">
  ${fs.existsSync(logo) ? `<img src="${dataUri(logo)}" alt="KOOP">` : ''}
  <h1>Manual de usuario</h1>
  <p class="sub">Plataforma de gestión jurídica KOOP</p>
  <p class="meta">Koop Strategic Advisory<br>Versión generada el ${fecha}</p>
</section>
<section class="indice"><h2>Contenido</h2><ul>${toc}</ul></section>
${cuerpo}
</main></body></html>`;

const salidaHtml = path.join(dirManual, 'Manual-de-Usuario-KOOP.html');
fs.writeFileSync(salidaHtml, html);
console.log('HTML:', salidaHtml);

const navegador = await chromium.launch({ channel: 'msedge' });
try {
  const page = await navegador.newPage();
  await page.goto(`file:///${salidaHtml.replace(/\\/g, '/')}`);
  const salidaPdf = path.join(dirManual, 'Manual-de-Usuario-KOOP.pdf');
  await page.pdf({
    path: salidaPdf, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="width:100%;font-size:8px;color:#64748b;text-align:center;font-family:Arial">Manual de usuario · KOOP Strategic Advisory · Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>',
    margin: { top: '18mm', bottom: '20mm', left: '16mm', right: '16mm' },
  });
  console.log('PDF :', salidaPdf);
} finally {
  await navegador.close();
}
