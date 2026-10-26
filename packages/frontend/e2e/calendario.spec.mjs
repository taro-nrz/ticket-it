import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos } from "./utils.mjs";

// D-24: la fecha del evento se elige en un calendario; no se pueden elegir días pasados

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, LUCIA);
  await page.goto("/crear-evento");
  page.on("dialog", (dialogo) => dialogo.accept());
});

const abrirCalendario = async (page) => {
  await page.getByRole("button", { name: /^Fecha: / }).click();
  const calendario = page.getByRole("dialog", { name: "Elegí la fecha del evento" });
  await expect(calendario).toBeVisible();
  return calendario;
};

test("no se pueden elegir días anteriores a hoy ni meses pasados", async ({ page }) => {
  const calendario = await abrirCalendario(page);

  await expect(calendario.getByRole("button", { name: "Mes anterior" })).toBeDisabled();
  await expect(calendario.getByRole("button", { name: /, hoy$/ })).toBeEnabled();
  const pasados = calendario.getByRole("button", { name: /no disponible$/ });
  const cantidad = await pasados.count();
  for (let i = 0; i < cantidad; i++) {
    await expect(pasados.nth(i)).toBeDisabled();
  }
});

test("HU-01: publicar un evento eligiendo la fecha en el calendario", async ({ page }) => {
  // PREPARAR: datos del evento
  await page.getByLabel("Nombre", { exact: true }).fill("Recital con calendario");
  await page
    .getByLabel("Descripción", { exact: true })
    .fill("Un recital para probar el calendario.");
  await page.getByRole("button", { name: "Recitales" }).click();

  // ACTUAR: elegir el 15 del mes que viene
  const calendario = await abrirCalendario(page);
  await calendario.getByRole("button", { name: "Mes siguiente" }).click();
  await calendario.getByRole("button", { name: / 15 de / }).click();
  await expect(calendario).toBeHidden();
  await expect(page.getByRole("button", { name: /^Fecha: .* 15 de / })).toBeVisible();

  await page.getByLabel("Lugar").fill("Luna Park");
  await page.getByLabel("Dirección").fill("Av. Madero 420, CABA");
  await page.getByLabel("Precio ($)").fill("20000");
  await page.getByLabel("Cupo").fill("300");
  await page.getByRole("button", { name: "Publicar evento" }).click();

  // VERIFICAR: se publica y se abre su detalle
  await expect(page.getByRole("status")).toContainText("Evento publicado");
  await expect(page.getByRole("heading", { name: "Recital con calendario" })).toBeVisible();
});

test("el calendario abierto no tiene violaciones WCAG A/AA", async ({ page }) => {
  await abrirCalendario(page);
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
