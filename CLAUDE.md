# KOOP — frontend (guía para quien trabaje en este proyecto)

App React + Vite en `apps/koop` (monorepo pnpm). El backend vive al lado: `C:\Workspace\koop\back`. Quien usa la plataforma **no es técnico**: explica en lenguaje simple.

## Regla de oro: nada está terminado sin pruebas, reporte y manual

Toda funcionalidad nueva, corrección de error o cambio de flujo se entrega **completa por defecto**, sin que nadie tenga que pedirlo:

1. **Prueba E2E** en `apps/koop/e2e/NN-nombre.spec.js` para todo lo que el usuario ve o hace (y una de regresión si es un error).
2. **Pruebas del backend** si el cambio toca la API (en `C:\Workspace\koop\back\__tests__`).
3. **Manual de usuario actualizado** si el cambio es visible: texto en `apps/koop/docs/manual/manual-de-usuario.md`, captura en `apps/koop/manual/manual.spec.js`, y `pnpm manual`. Si no es visible, decirlo.
4. **Reporte de pruebas**: desde `C:\Workspace\koop\back`, `npm run verificar` debe terminar en **TODO EN VERDE**; el resumen final pega la tabla de `reports/reporte-de-pruebas.md`.

El procedimiento completo y las plantillas están en el skill **`entrega-koop`**, que vive en el back: `C:\Workspace\koop\back\.claude\skills\entrega-koop\SKILL.md` (y `plantillas.md`). Léelo y síguelo cada vez que implementes algo.

## Comandos (desde `apps/koop`)

| Qué | Comando |
|---|---|
| Pruebas de navegador | `pnpm test:e2e` (o `pnpm test:e2e:ui` para verlas en ventana) |
| Manual de usuario (capturas + PDF) | `pnpm manual` |
| Verificación total con reporte | en el back: `npm run verificar` |

## Cosas que hay que saber

- El E2E y el manual levantan una **instancia aislada** (backend :4100 sobre la base `koop_e2e`, front :5199, S3/correo/Rama Judicial simulados). No tocan los datos reales. Requieren **Docker Desktop abierto**.
- Siempre `await iniciarSesion(...)` antes de navegar a otra ruta en una prueba; cada prueba crea sus propios datos por API (`e2e/helpers/api.js`).
- Datos del manual: **solo ejemplos inventados**, nunca clientes reales.
- Commits (commitlint): título en minúscula, ≤ 72 caracteres, `tipo: descripción`; líneas del cuerpo ≤ 100. Agrega archivos por nombre, no `git add -A`.
- Se versionan el manual `.md`, las imágenes `.jpg` y el `.pdf`; el `.html` generado no.
