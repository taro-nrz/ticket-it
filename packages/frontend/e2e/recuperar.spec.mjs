import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { API_URL, reiniciarDatos } from "./utils.mjs";

// D-44: recuperar la contraseña con el código del email simulado

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

const ultimoCodigo = async (request) => {
  const [email] = await (await request.get(`${API_URL}/dev/emails`)).json();
  return email.texto.match(/\b(\d{6})\b/)[1];
};

test("recuperar la contraseña e ingresar con la nueva", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("juan@ticketit.com");
  await page.getByRole("link", { name: "¿Olvidaste tu contraseña?" }).click();

  await expect(page.getByRole("heading", { name: "Recuperá tu cuenta." })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue("juan@ticketit.com");
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  await expect(page.getByText("Paso 2 de 2")).toBeVisible();

  await page.getByLabel("Código de 6 números").fill(await ultimoCodigo(request));
  await page.getByLabel("Contraseña nueva", { exact: true }).fill("nueva4567");
  await page.getByLabel("Repetir contraseña nueva").fill("nueva4567");
  await page.getByRole("button", { name: "Cambiar la contraseña" }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText("ya podés ingresar");
  await page.getByLabel("Email").fill("juan@ticketit.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("nueva4567");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).toHaveURL(/\/explorar/);
});

test("un código incorrecto se marca en su campo", async ({ page }) => {
  await page.goto("/recuperar");
  await page.getByLabel("Email").fill("juan@ticketit.com");
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  await page.getByLabel("Código de 6 números").fill("000000");
  await page.getByLabel("Contraseña nueva", { exact: true }).fill("nueva4567");
  await page.getByLabel("Repetir contraseña nueva").fill("nueva4567");
  await page.getByRole("button", { name: "Cambiar la contraseña" }).click();
  await expect(page.getByLabel("Código de 6 números")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Código de 6 números")).toBeFocused();
});

test("la recuperación no tiene violaciones WCAG A/AA", async ({ page }) => {
  await page.goto("/recuperar");
  await page.getByLabel("Email").fill("juan@ticketit.com");
  await page.getByRole("button", { name: "Enviarme el código" }).click();
  await expect(page.getByText("Paso 2 de 2")).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
