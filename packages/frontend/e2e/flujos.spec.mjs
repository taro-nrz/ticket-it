import { expect, test } from "@playwright/test";
import { entrarComo, JUAN, LUCIA, reiniciarDatos, SOFIA } from "./utils.mjs";

// Flujos críticos (preparar → actuar → verificar) con selectores por rol y etiqueta,
// que sólo funcionan porque la interfaz es accesible.

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  page.on("dialog", (dialogo) => dialogo.accept());
});

test("se ingresa sólo con el teclado", async ({ page }) => {
  // PREPARAR
  await page.goto("/login");
  const sofia = page.getByRole("button", { name: /Sofía Pérez/ });
  await expect(sofia).toBeVisible();

  // ACTUAR: Tab hasta el botón de Sofía y Enter
  for (let i = 0; i < 10 && !(await sofia.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press("Tab");
  }
  await expect(sofia).toBeFocused();
  await page.keyboard.press("Enter");

  // VERIFICAR
  await expect(page).toHaveURL(/\/explorar/);
  await expect(page.getByRole("heading", { name: "¿Qué salimos a ver?" })).toBeVisible();
});

test("HU-04: comprar entradas y pagar", async ({ page }) => {
  // PREPARAR
  await entrarComo(page, SOFIA);
  await page.goto("/explorar");

  // ACTUAR
  await page.getByRole("button", { name: /Noche Indie en Obras/ }).click();
  await page.getByRole("button", { name: /^Platea/ }).click();
  await page.getByRole("button", { name: /Agregar una/ }).click();
  await page.getByRole("button", { name: "Comprar", exact: true }).click();

  // VERIFICAR: la compra queda pendiente con el total correcto y se puede pagar
  await expect(page.getByRole("heading", { name: /Compra #\d+/ })).toBeVisible();
  await expect(page.getByText("Pendiente de pago").first()).toBeVisible();
  await page.getByRole("button", { name: "Pagar $ 50.000" }).click();
  await expect(
    page.getByText("Faltan 20 días").or(page.getByText(/Faltan \d+ días/)),
  ).toBeVisible();
});

test("HU-09: cancelar una compra confirmada la reembolsa", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/compra/1");

  await page.getByRole("button", { name: "Cancelar y pedir reembolso" }).click();
  await page
    .getByRole("dialog", { name: "¿Cancelar la compra?" })
    .getByRole("button", { name: "Sí, cancelar la compra" })
    .click();

  await expect(page.getByRole("status")).toContainText("Compra cancelada");
  await expect(page.getByText("Reembolsada").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Cancelar/ })).toHaveCount(0);
});

test("HU-11: calificar un evento con la entrada utilizada", async ({ page }) => {
  await entrarComo(page, JUAN);
  await page.goto("/compra/6");

  await page.getByRole("button", { name: "Calificar el evento" }).click();
  await page.getByRole("button", { name: "4 estrellas" }).click();
  await page.getByLabel("Comentario").fill("Muy lindo show acústico.");
  await page.getByRole("button", { name: "Enviar reseña" }).click();

  await expect(page.getByRole("button", { name: "Calificar el evento" })).toHaveCount(0);
});

test("HU-12: el organizador lee sus reseñas desde Mis eventos", async ({ page }) => {
  await entrarComo(page, LUCIA);
  await page.goto("/mis-eventos");

  await page.getByRole("button", { name: /mis reseñas/ }).click();

  await expect(page.getByRole("heading", { name: "Mis reseñas", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reseñas", level: 2 })).toBeVisible();
});

test("si el servidor falla se muestra un aviso comprensible", async ({ page }) => {
  // PREPARAR: la API de eventos responde 500
  await entrarComo(page, SOFIA);
  await page.route("**/evento?*", (ruta) =>
    ruta.fulfill({ status: 500, json: { status: "error", message: "Algo salió mal" } }),
  );

  // ACTUAR
  await page.goto("/explorar");

  // VERIFICAR: role="alert" con el mensaje y una forma de reintentar
  await expect(page.getByRole("alert")).toContainText("Algo salió mal");
  await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
});
