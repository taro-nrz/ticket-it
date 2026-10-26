import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos, SOFIA } from "./utils.mjs";

// M8: mensajes sin leer (D-26), galería (D-27) y reseñas por evento (D-28)

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("D-26: el organizador ve los mensajes sin leer y se borran al abrir el chat", async ({
  page,
}) => {
  // PREPARAR: en la semilla, Sofía escribió en la compra 1 después de la respuesta de Lucía
  await entrarComo(page, LUCIA);
  await page.goto("/mis-eventos");
  const verCompras = page.getByRole("button", { name: /Ver compras \(2\).*1 mensaje sin leer/ });
  await expect(verCompras).toBeVisible();

  // ACTUAR: llegar al chat desde la insignia
  await verCompras.click();
  await page.getByRole("button", { name: /Sofía.*1 mensaje sin leer/ }).click();
  await page.getByRole("button", { name: /Chatear con .* 1 nuevo/ }).click();
  await expect(page.getByText("Genial, ¡gracias!")).toBeVisible();

  // VERIFICAR: al volver, ya no hay mensajes nuevos
  await page.goto("/mis-eventos");
  await expect(
    page.getByRole("button", { name: "Ver compras (2) y controlar acceso", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/^\d+ nuevos?$/)).toHaveCount(1); // queda sólo el del stand-up (Juan)
});

test("D-27: la galería del evento se recorre con los botones", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/evento/1");

  await expect(page.getByText("Foto 1 de 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Foto anterior" })).toBeDisabled();
  await page.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(page.getByText("Foto 2 de 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Foto siguiente" })).toBeDisabled();
});

test("D-28: el organizador abre las reseñas de un evento realizado", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/mis-eventos");

  await page
    .getByRole("button", { name: /Ver reseñas \([1-9]\)/ })
    .first()
    .click();

  await expect(page.getByRole("heading", { name: "Reseñas del evento", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reseñas", level: 2 })).toBeVisible();
});

test("D-28: el detalle de un evento realizado muestra sus reseñas", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/evento/7");

  await expect(page.getByRole("heading", { name: "Reseñas de este evento" })).toBeVisible();
});
