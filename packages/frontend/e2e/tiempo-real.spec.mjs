import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-45: chat y notificaciones en vivo con WebSockets. Dos navegadores: Sofía (compradora) y Lucía (organizadora).
// El sondeo de respaldo tarda 4 s (chat) y 15 s (campana): los tiempos de espera cortos prueban que es en vivo.
const EN_VIVO_MS = 2500;

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

async function abrirComo(browser, usuario, ruta) {
  const contexto = await browser.newContext();
  const pagina = await contexto.newPage();
  await entrarComo(pagina, usuario);
  await pagina.goto(ruta);
  return { contexto, pagina };
}

test("el mensaje y el 'escribiendo…' llegan al instante al otro lado", async ({ browser }) => {
  const sofia = await abrirComo(browser, SOFIA, "/compra/1/chat");
  const lucia = await abrirComo(browser, LUCIA, "/compra/1/chat");
  await expect(sofia.pagina.getByText("En vivo")).toBeVisible();
  await expect(lucia.pagina.getByText("En vivo")).toBeVisible();

  const campo = lucia.pagina.getByLabel("Mensaje para Sofía");
  await campo.pressSequentially("Las puertas abren", { delay: 30 });
  await expect(sofia.pagina.getByText("Lucía está escribiendo…")).toBeVisible({
    timeout: EN_VIVO_MS,
  });

  await campo.press("Enter");
  await expect(sofia.pagina.getByText("Las puertas abren", { exact: true })).toBeVisible({
    timeout: EN_VIVO_MS,
  });
  await expect(sofia.pagina.getByText("Lucía está escribiendo…")).toHaveCount(0);

  await sofia.contexto.close();
  await lucia.contexto.close();
});

test("la campana se actualiza en vivo cuando llega un mensaje", async ({ browser }) => {
  const sofia = await abrirComo(browser, SOFIA, "/explorar");
  await expect(
    sofia.pagina.getByRole("button", { name: "Notificaciones, ninguna sin leer" }),
  ).toBeVisible();

  const lucia = await abrirComo(browser, LUCIA, "/compra/1/chat");
  await expect(lucia.pagina.getByText("En vivo")).toBeVisible();
  await lucia.pagina.getByLabel("Mensaje para Sofía").fill("¿Te sirvió la info?");
  await lucia.pagina.getByRole("button", { name: "Enviar mensaje" }).click();

  await expect(
    sofia.pagina.getByRole("button", { name: "Notificaciones, 1 sin leer" }),
  ).toBeVisible({
    timeout: EN_VIVO_MS,
  });

  await sofia.contexto.close();
  await lucia.contexto.close();
});

test("sin WebSocket la app avisa y sigue funcionando con el sondeo", async ({ browser }) => {
  const contexto = await browser.newContext();
  const pagina = await contexto.newPage();
  // Simula una red que bloquea WebSockets
  await pagina.routeWebSocket(/socket\.io/, (ws) => ws.close());
  await entrarComo(pagina, SOFIA);
  await pagina.goto("/compra/1/chat");
  await expect(pagina.getByText(/Sin conexión en vivo: se actualiza cada 4 s/)).toBeVisible();

  const lucia = await abrirComo(browser, LUCIA, "/compra/1/chat");
  await lucia.pagina.getByLabel("Mensaje para Sofía").fill("Llegó por sondeo");
  await lucia.pagina.getByRole("button", { name: "Enviar mensaje" }).click();
  await expect(pagina.getByText("Llegó por sondeo", { exact: true })).toBeVisible({
    timeout: 8000,
  });

  await contexto.close();
  await lucia.contexto.close();
});

test("al abrir el chat no se anuncian como nuevos los mensajes viejos", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/compra/1/chat");
  await expect(page.getByText("En vivo")).toBeVisible();
  await expect(page.getByText("Genial, ¡gracias!")).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(page.getByText(/Nuevo mensaje de/)).toHaveCount(0);
});
