// Inicia sesión por la pantalla real de login, como lo haría una persona.
export async function loginPorUI(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

// Igual que loginPorUI pero espera a que la sesión quede abierta (llega al
// dashboard). Necesario antes de navegar a otra ruta: si no, la navegación
// corta el login a medias y la app te devuelve a /login.
export async function iniciarSesion(page, usuario) {
  await loginPorUI(page, usuario);
  await page.waitForURL(/\/dashboard$/);
}
