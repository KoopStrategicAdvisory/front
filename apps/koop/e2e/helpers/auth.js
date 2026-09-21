// Inicia sesión por la pantalla real de login, como lo haría una persona.
export async function loginPorUI(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}
