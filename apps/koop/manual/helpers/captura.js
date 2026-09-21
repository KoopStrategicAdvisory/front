import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR_IMG = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../docs/manual/img');
fs.mkdirSync(DIR_IMG, { recursive: true });

// Saca una captura de lo que se ve en pantalla y, si se pide, dibuja recuadros
// rojos numerados sobre los elementos que el manual explica (1, 2, 3...).
//  - enfocar: elemento que se centra en pantalla ANTES de marcar (para capturas
//    de una tarjeta que queda lejos del inicio de la página).
//  - resaltar: elementos a marcar. Con "enfocar" solo se marcan los que están a
//    la vista; sin él, cada uno se lleva a la vista antes de medirlo.
export async function captura(page, nombre, { resaltar = [], enfocar, pausa = 400 } = {}) {
  if (enfocar) {
    await enfocar.first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  }
  await page.waitForTimeout(pausa);
  const alto = page.viewportSize().height;
  const cajas = [];
  for (const [i, loc] of resaltar.entries()) {
    // Solo cuenta lo que se ve: el primer resultado puede ser un elemento oculto
    // (p. ej. un enlace del menú cerrado con el mismo texto).
    const el = loc.filter({ visible: true }).first();
    if (!enfocar) await el.scrollIntoViewIfNeeded({ timeout: 5000 });
    const b = await el.boundingBox({ timeout: 5000 });
    if (b && b.y >= 0 && b.y + b.height <= alto) cajas.push({ ...b, n: i + 1 });
  }
  await page.evaluate((cs) => {
    cs.forEach((b) => {
      const caja = document.createElement('div');
      caja.setAttribute('data-manual-marca', '1');
      caja.style.cssText = `position:fixed;z-index:2147483647;pointer-events:none;left:${b.x - 4}px;top:${b.y - 4}px;width:${b.width + 8}px;height:${b.height + 8}px;border:3px solid #e11d48;border-radius:8px;box-shadow:0 0 0 2px rgba(255,255,255,.75)`;
      const n = document.createElement('div');
      n.textContent = String(b.n);
      n.style.cssText = 'position:absolute;left:-8px;top:-24px;width:26px;height:26px;border-radius:50%;background:#e11d48;color:#fff;font:700 15px/26px system-ui,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.5)';
      caja.appendChild(n);
      document.body.appendChild(caja);
    });
  }, cajas);
  await page.screenshot({ path: path.join(DIR_IMG, `${nombre}.jpg`), type: 'jpeg', quality: 82 });
  await page.evaluate(() => document.querySelectorAll('[data-manual-marca]').forEach((e) => e.remove()));
}
