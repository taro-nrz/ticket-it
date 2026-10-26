import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-23: menú "Cuenta" con cerrar sesión explícito y diálogos propios accesibles

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, SOFIA);
});

test("cerrar sesión desde el menú Cuenta, con confirmación", async ({ page }) => {
  await page.goto("/explorar");

  // ACTUAR: el botón tiene texto visible "Cuenta" y abre un diálogo
  await page.getByRole("button", { name: /Cuenta/ }).click();
  const menu = page.getByRole("dialog", { name: "Tu cuenta" });
  await expect(menu.getByText("Sofía Pérez")).toBeVisible();
  await menu.getByRole("button", { name: "Cerrar sesión" }).click();

  // La confirmación dice exactamente qué pasa
  const confirmacion = page.getByRole("dialog", { name: "¿Cerrar sesión?" });
  await expect(confirmacion).toBeVisible();
  await confirmacion.getByRole("button", { name: "Sí, cerrar sesión" }).click();

  // VERIFICAR: vuelve al inicio y se anuncia el resultado (role="status")
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("status")).toContainText("Cerraste sesión");
});

test("arrepentirse de cerrar sesión deja todo como estaba", async ({ page }) => {
  await page.goto("/explorar");
  await page.getByRole("button", { name: /Cuenta/ }).click();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await page.getByRole("button", { name: "Seguir en mi cuenta" }).click();

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/explorar/);
});

test("el menú se cierra con Esc y el foco vuelve al botón Cuenta", async ({ page }) => {
  await page.goto("/explorar");
  const cuenta = page.getByRole("button", { name: /Cuenta/ });
  await cuenta.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Tu cuenta" })).toBeVisible();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(cuenta).toBeFocused();
});

test("el menú Cuenta abierto no tiene violaciones WCAG A/AA", async ({ page }) => {
  await page.goto("/explorar");
  await page.getByRole("button", { name: /Cuenta/ }).click();
  await expect(page.getByRole("dialog", { name: "Tu cuenta" })).toBeVisible();

  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});

test("el diálogo de cancelar una compra es propio y accesible", async ({ page }) => {
  await page.goto("/compra/1");
  await page.getByRole("button", { name: "Cancelar y pedir reembolso" }).click();

  const dialogo = page.getByRole("dialog", { name: "¿Cancelar la compra?" });
  await expect(dialogo).toContainText("Se te reembolsarán $ 30.000");
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);

  await dialogo.getByRole("button", { name: "No, conservarla" }).click();
  await expect(page.getByText("Confirmada").first()).toBeVisible();
});

test("D-30: editar el perfil y cambiar la contraseña", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/explorar");
  await page.getByRole("button", { name: /Cuenta/ }).click();
  await page
    .getByRole("dialog", { name: "Tu cuenta" })
    .getByRole("button", { name: "Mi perfil" })
    .click();
  await expect(page.getByRole("heading", { name: "Mi perfil", level: 1 })).toBeVisible();

  // Datos
  await page.getByLabel("Nombre").fill("Sofi");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("status")).toContainText("Guardamos tus datos");

  // Contraseña: la actual incorrecta se marca en su campo
  await page.getByLabel("Contraseña actual").fill("incorrecta1");
  await page.getByLabel("Contraseña nueva", { exact: true }).fill("nueva4567");
  await page.getByLabel("Repetir contraseña nueva").fill("nueva4567");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText("La contraseña actual no es correcta")).toBeVisible();

  await page.getByLabel("Contraseña actual").fill("ticketit123");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByRole("status")).toContainText("Cambiaste tu contraseña");
});
