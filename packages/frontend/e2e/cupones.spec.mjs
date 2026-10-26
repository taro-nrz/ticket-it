import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-38: cupones de descuento (semilla: INDIE20 y INDIE2X1 en el evento 1)

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("el comprador aplica un cupón y compra con descuento", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/evento/1");
  await page.getByRole("button", { name: /^General/ }).click();
  await page.getByRole("button", { name: /Agregar una/ }).click(); // 2 entradas: $ 30.000

  await page.getByRole("button", { name: "¿Tenés un cupón de descuento?" }).click();
  await page.getByLabel("Cupón de descuento").fill("indie20");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("INDIE20 · 20% de descuento")).toBeVisible();
  await expect(page.getByText("$ 24.000")).toBeVisible();

  await page.getByRole("button", { name: "Comprar", exact: true }).click();
  await expect(page.getByText(/Cupón INDIE20/)).toBeVisible();
  await expect(page.getByText(/− \$ 6.000/)).toBeVisible();
});

test("un cupón que no aplica se explica (2×1 con una sola entrada)", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/evento/1");
  await page.getByRole("button", { name: /^General/ }).click();
  await page.getByRole("button", { name: "¿Tenés un cupón de descuento?" }).click();
  await page.getByLabel("Cupón de descuento").fill("INDIE2X1");
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByText("El 2×1 se aplica comprando al menos 2 entradas")).toBeVisible();
});

test("el organizador crea y desactiva un cupón", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/evento/1");
  await page.getByRole("button", { name: "Cupones de descuento" }).click();
  await expect(page.getByRole("heading", { name: "Cupones", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Monto fijo" }).click();
  await page.getByLabel("Código").fill("promo500");
  await page.getByLabel("Monto a descontar ($)").fill("500");
  await page.getByRole("button", { name: "Crear cupón" }).click();
  await expect(page.getByRole("status")).toContainText("Creaste el cupón PROMO500");
  await expect(page.getByText("$ 500 de descuento")).toBeVisible();

  await page.getByRole("button", { name: "Desactivar" }).last().click();
  await page.getByRole("dialog").getByRole("button", { name: "Sí, desactivar" }).click();
  await expect(page.getByText("Desactivado")).toBeVisible();
});

test("la pantalla de cupones no tiene violaciones WCAG A/AA", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/evento/1/cupones");
  await expect(page.getByText("INDIE20")).toBeVisible();
  await page.getByRole("button", { name: "Crear cupón" }).click();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
