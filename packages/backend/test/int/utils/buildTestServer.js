import jwt from "jsonwebtoken";
import { crearApp } from "../../../app.js";
import { RelojFijo } from "../../../utils/reloj.js";

// "Ahora" fijo para todos los tests de integración (hora local). Los datos semilla son relativos a esta fecha.
export const AHORA = new Date(2026, 9, 26, 15, 0, 0);

export const CONFIG_TEST = {
  port: 0,
  host: "127.0.0.1",
  allowedOrigins: "*",
  nodeEnv: "test",
  maxEntradasPorCompra: 10,
  jwtSecret: "secreto-de-test",
  jwtExpiracion: "1h",
  bcryptRondas: 4, // rápido para los tests; en producción 10+
  loginMaxIntentos: 5,
  loginVentanaMs: 60 * 1000,
};

// Header de autenticación de un usuario de la semilla (D-29): firma un JWT como lo haría el login
export function auth(usuarioId, opciones = { expiresIn: "1h" }) {
  const token = jwt.sign({ sub: String(usuarioId) }, CONFIG_TEST.jwtSecret, opciones);
  return { Authorization: `Bearer ${token}` };
}

// D-37: tarjeta de prueba aprobada por la pasarela simulada
export const TARJETA_PRUEBA = {
  numero: "4242 4242 4242 4242",
  titular: "SOFIA PEREZ",
  vencimiento: "12/30",
  cvv: "123",
};

// Usuarios de los datos semilla
export const ORGANIZADORA_LUCIA = "1";
export const ORGANIZADOR_MARTIN = "2";
export const COMPRADORA_SOFIA = "3";
export const COMPRADOR_JUAN = "4";
export const COMPRADORA_VALENTINA = "5";

// Cada test arma una app nueva con datos frescos
export async function buildTestServer() {
  const { app } = await buildTestServerConReloj();
  return app;
}

// Variante que expone el reloj para poder "adelantar el tiempo" dentro de un test
export async function buildTestServerConReloj() {
  const reloj = new RelojFijo(AHORA);
  const server = await crearApp({ reloj, config: CONFIG_TEST });
  return { app: server.app, reloj };
}
