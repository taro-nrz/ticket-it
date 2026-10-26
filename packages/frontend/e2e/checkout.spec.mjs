import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-37: checkout del pago con tarjetas de prueba (compra 2 de Sofía, pendiente, $ 24.000)

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, SOFIA);
  await page.goto("/compra/2/pagar");
  await expect(page.getByRole("heading", { name: "Pagar", level: 1 })).toBeVisible();
});

test("pagar escribiendo la tarjeta, con el número agrupado de a 4", async ({ page }) => {
  await page.getByLabel("Número de tarjeta").fill("4242424242424242");
  await expect(page.getByLabel("Número de tarjeta")).toHaveValue("4242 4242 4242 4242");
  await page.getByLabel("Nombre del titular").fill("SOFIA PEREZ");
  await page.getByLabel("Vencimiento").fill("1230");
  await expect(page.getByLabel("Vencimiento")).toHaveValue("12/30");
  await page.getByLabel("Código de seguridad").fill("123");
  await page.getByRole("button", { name: /^Pagar \$/ }).click();

  await expect(page).toHaveURL(/\/compra\/2$/);
  await expect(page.getByText("Confirmada").first()).toBeVisible();
});

test("una tarjeta rechazada se informa y la compra sigue pendiente", async ({ page }) => {
  await page.getByRole("button", { name: /4000 0000 0000 0002/ }).click();
  await page.getByRole("button", { name: /^Pagar \$/ }).click();
  await expect(page.getByRole("alert")).toContainText("Pago rechazado: la tarjeta no tiene fondos");
  await expect(page).toHaveURL(/\/compra\/2\/pagar/);
});

test("los datos incompletos se marcan y el foco va al primero", async ({ page }) => {
  await page.getByRole("button", { name: /^Pagar \$/ }).click();
  await expect(page.getByRole("alert")).toContainText("Revisá 4 datos");
  await expect(page.getByLabel("Número de tarjeta")).toBeFocused();
});

test("el checkout no tiene violaciones WCAG A/AA", async ({ page }) => {
  await page.getByRole("button", { name: /^Pagar \$/ }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
