import { expect, test } from "@playwright/test";
import { entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-43: compartir un evento y agregarlo al calendario

test.beforeEach(async ({ request, page, context }) => {
  await reiniciarDatos(request);
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  // Navegador sin hoja de compartir del sistema: la app copia el enlace
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
  await entrarComo(page, SOFIA);
  await page.goto("/evento/1");
  await expect(page.getByRole("heading", { name: "Noche Indie en Obras", level: 1 })).toBeVisible();
});

test("compartir copia el enlace del evento", async ({ page }) => {
  await page.getByRole("button", { name: "Compartir el evento" }).click();
  await expect(page.getByRole("status")).toContainText("Copiamos el enlace del evento");
  const copiado = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiado).toContain("Noche Indie en Obras");
  expect(copiado).toMatch(/http:\/\/localhost:\d+\/evento\/1$/);
});

test("agregar al calendario descarga el .ics del evento", async ({ page }) => {
  const [descarga] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Agregar al calendario" }).click(),
  ]);
  expect(descarga.suggestedFilename()).toBe("noche-indie-en-obras.ics");
});
