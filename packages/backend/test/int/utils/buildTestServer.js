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
