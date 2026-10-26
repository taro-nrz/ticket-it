import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, JUAN, LUCIA, reiniciarDatos } from "./utils.mjs";

// D-33: entrada digital con QR y control de acceso en la puerta

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("el comprador ve el QR y el código de su entrada pagada", async ({ page }) => {
  await entrarComo(page, JUAN);
  await page.goto("/mis-compras");
  await page
    .getByRole("button", { name: /Stand-up de los jueves/ })
    .first()
    .click();

  await expect(page.getByRole("img", { name: /Código QR de la entrada/ })).toBeVisible();
  await expect(page.getByText("TK-JUAN-H7Y5")).toBeVisible();
});

test("el organizador valida una entrada y la segunda vez se rechaza", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/evento/6/compras");
  await page.getByRole("button", { name: "Validar entradas en la puerta" }).click();
  await expect(page.getByRole("heading", { name: "Validar entradas", level: 1 })).toBeVisible();

  const codigo = page.getByLabel("Código de la entrada");
  await codigo.fill("tk-juan-h7y5");
  await page.getByRole("button", { name: "Validar entrada" }).click();
  await expect(page.getByText("Puede pasar")).toBeVisible();
  await expect(page.getByText(/Juan Rodríguez, 2 × General/)).toBeVisible();

  await codigo.fill("TK-JUAN-H7Y5");
  await page.getByRole("button", { name: "Validar entrada" }).click();
  await expect(page.getByText("No puede pasar")).toBeVisible();
  await expect(page.getByText(/ya se usó/)).toBeVisible();
});

test("un código que no existe se rechaza", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/evento/6/validar");
  await page.getByLabel("Código de la entrada").fill("TK-AAAA-BBBB");
  await page.getByRole("button", { name: "Validar entrada" }).click();
  await expect(page.getByText("No existe ninguna entrada con ese código")).toBeVisible();
});

test("la pantalla de validación no tiene violaciones WCAG A/AA", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/evento/6/validar");
  await page.getByLabel("Código de la entrada").fill("TK-JUAN-H7Y5");
  await page.getByRole("button", { name: "Validar entrada" }).click();
  await expect(page.getByText("Puede pasar")).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
