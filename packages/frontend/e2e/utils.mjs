export const API_URL = "http://localhost:3999";

// Usuarios de los datos semilla (id → email); todos con la contraseña de demo
export const SOFIA = 3; // compradora
export const JUAN = 4; // comprador (compra 6 utilizada sin reseñar)
export const LUCIA = 1; // organizadora
export const PASSWORD_DEMO = "ticketit123";
export const EMAILS = {
  1: "lucia@ticketit.com",
  2: "martin@ticketit.com",
  3: "sofia@ticketit.com",
  4: "juan@ticketit.com",
  5: "valentina@ticketit.com",
};

// Cada test arranca con los mismos datos (fixtures): recarga la semilla del backend
export async function reiniciarDatos(request) {
  const respuesta = await request.post(`${API_URL}/dev/reset`);
  if (!respuesta.ok()) throw new Error("No se pudo reiniciar el backend de pruebas");
}

// D-29: entra como un usuario haciendo login por la API y guardando el token antes de que cargue la app
// (el formulario de login se prueba aparte, en e2e/auth.spec.mjs)
export async function entrarComo(page, usuarioId) {
  const respuesta = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: EMAILS[usuarioId], password: PASSWORD_DEMO },
  });
  if (!respuesta.ok()) throw new Error(`No se pudo iniciar sesión como ${EMAILS[usuarioId]}`);
  const { token } = await respuesta.json();
  await page.addInitScript((valor) => {
    window.localStorage.setItem("ticket-it:token", valor);
  }, token);
}
