import { expect, test } from "@playwright/test";
import { entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-22: modo claro / oscuro, elegido desde el menú "Cuenta"
const fondoDeLaPagina = (page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("el tema se elige en el menú Cuenta y se recuerda", async ({ page }) => {
  // PREPARAR
  await entrarComo(page, SOFIA);
  await page.goto("/explorar");
  await page.getByRole("button", { name: /Cuenta/ }).click();
  const menu = page.getByRole("dialog", { name: "Tu cuenta" });
  await expect(menu).toBeVisible();

  // Por defecto sigue al sistema
  await expect(menu.getByRole("radio", { name: "Sistema" })).toBeChecked();

  // ACTUAR + VERIFICAR: claro
  await menu.getByRole("radio", { name: "Claro" }).click();
  await expect(menu.getByRole("radio", { name: "Claro" })).toBeChecked();
  expect(await fondoDeLaPagina(page)).toBe("rgb(245, 243, 238)");

  // oscuro
  await menu.getByRole("radio", { name: "Oscuro" }).click();
  await expect(menu.getByRole("radio", { name: "Oscuro" })).toBeChecked();
  expect(await fondoDeLaPagina(page)).toBe("rgb(18, 16, 24)");
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");

  // la preferencia sobrevive a recargar la página
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await fondoDeLaPagina(page)).toBe("rgb(18, 16, 24)");
});
