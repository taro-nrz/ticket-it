import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos } from "./utils.mjs";

// D-32: campana con el contador y pantalla de notificaciones

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("la campana muestra cuántas hay sin leer y lleva a la lista", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/mis-eventos");

  const campana = page.getByRole("button", { name: "Notificaciones, 2 sin leer" });
  await expect(campana).toBeVisible();
  await campana.click();

  await expect(page.getByRole("heading", { name: "Notificaciones", level: 1 })).toBeVisible();
  await expect(page.getByText("Mensaje de Sofía Pérez")).toBeVisible();
  await expect(page.getByText("Nueva", { exact: true })).toHaveCount(2);
});

test("tocar una notificación la marca como leída y abre lo que avisa", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/notificaciones");

  await page.getByRole("button", { name: /Mensaje de Sofía Pérez/ }).click();
  await expect(page).toHaveURL(/\/compra\/1\/chat/);
  await expect(page.getByRole("heading", { name: "Sofía Pérez", level: 1 })).toBeVisible();

  await page.goto("/mis-eventos");
  await expect(page.getByRole("button", { name: "Notificaciones, 1 sin leer" })).toBeVisible();
});

test("marcar todas como leídas", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/notificaciones");
  await page.getByRole("button", { name: "Marcar todas como leídas" }).click();

  await expect(page.getByText("Nueva", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Estás al día")).toBeVisible();
});

test("la pantalla de notificaciones no tiene violaciones WCAG A/AA", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/notificaciones");
  await expect(page.getByText("Mensaje de Sofía Pérez")).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
