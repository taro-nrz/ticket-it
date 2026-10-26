import { defineConfig, devices } from "@playwright/test";

// Tests E2E + accesibilidad (como en la clase): el mismo test corre en web y en mobile.
// Levanta su propio backend (puerto 3999) y la app web (puerto 8099) con datos semilla.
const API_URL = "http://localhost:3999";
const APP_URL = "http://localhost:8099";
// D-39: la misma app con MSW en modo "sin backend" (apunta a un puerto donde no hay nada)
const APP_SIN_BACKEND_URL = "http://localhost:8098";

// Para usar un Chromium ya instalado en el sistema: CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
// Si no, instalar el de Playwright una vez con: npx playwright install chromium
const launchOptions = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH }
  : {};

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1, // los datos viven en memoria en un único backend: los tests no corren en paralelo
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: APP_URL,
    locale: "es-AR",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions,
  },
  projects: [
    { name: "web", use: { ...devices["Desktop Chrome"] }, testIgnore: /sin-backend/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testIgnore: /sin-backend/ },
    // Modo oscuro (D-22): la app sigue la preferencia del sistema; se valida accesibilidad y contraste
    {
      name: "mobile-oscuro",
      use: { ...devices["Pixel 7"], colorScheme: "dark" },
      testMatch:
        /accesibilidad|tema|cuenta|calendario|mejoras|auth|notificaciones|entrada|checkout|cupones|carga|lista-espera|transferir|fotos/,
    },
    {
      name: "sin-backend",
      use: { ...devices["Pixel 7"], baseURL: APP_SIN_BACKEND_URL },
      testMatch: /sin-backend/,
    },
  ],
  webServer: [
    {
      command: "node index.js",
      cwd: "../backend",
      url: `${API_URL}/health`,
      env: { PORT: "3999", NODE_ENV: "development" },
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npx expo start --web --port 8099",
      url: APP_URL,
      env: { EXPO_PUBLIC_API_URL: API_URL, BROWSER: "none", CI: "1" },
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npx expo start --web --port 8098",
      url: APP_SIN_BACKEND_URL,
      env: {
        EXPO_PUBLIC_API_URL: "http://localhost:3997",
        EXPO_PUBLIC_MSW: "sin-backend",
        EXPO_PUBLIC_MSW_DEMORA: "300",
        BROWSER: "none",
        CI: "1",
      },
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});

export { API_URL };
