import { Platform } from "react-native";

// D-39: arranca MSW si se pidió con EXPO_PUBLIC_MSW ("latencia" o "sin-backend"). Sólo en web: en el celular
// MSW necesita polyfills extra y la demo de carga se hace en el navegador.
export const MODO_MSW = process.env.EXPO_PUBLIC_MSW || null;

export async function iniciarMocks() {
  if (!MODO_MSW || Platform.OS !== "web") return;
  const { setupWorker } = await import("msw/browser");
  const { crearHandlers } = await import("./handlers.js");
  const worker = setupWorker(...crearHandlers(MODO_MSW));
  await worker.start({ onUnhandledRequest: "bypass", quiet: false });
  console.info(`[MSW] modo ${MODO_MSW} activo`);
}
