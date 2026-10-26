export const API_URL = "http://localhost:3999";

// Usuarios de los datos semilla
export const SOFIA = 3; // compradora
export const JUAN = 4; // comprador (compra 6 utilizada sin reseñar)
export const LUCIA = 1; // organizadora

// Cada test arranca con los mismos datos (fixtures): recarga la semilla del backend
export async function reiniciarDatos(request) {
  const respuesta = await request.post(`${API_URL}/dev/reset`);
  if (!respuesta.ok()) throw new Error("No se pudo reiniciar el backend de pruebas");
}

// Entra como un usuario guardando la sesión antes de que cargue la app (evita repetir el login)
export async function entrarComo(page, usuarioId) {
  await page.addInitScript((id) => {
    window.localStorage.setItem("ticket-it:usuarioId", String(id));
  }, usuarioId);
}
