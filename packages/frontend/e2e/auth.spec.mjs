import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-29: inicio de sesión real con email y contraseña, registro y sesión vencida

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("ingresar con una cuenta de prueba", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Lucía/ }).click();
  await expect(page.getByLabel("Email")).toHaveValue("lucia@ticketit.com");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/mis-eventos/);
});

test("una contraseña incorrecta se informa sin revelar si la cuenta existe", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("sofia@ticketit.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("incorrecta1");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByRole("alert")).toContainText("Email o contraseña incorrectos");
  await expect(page).toHaveURL(/\/login/);
});

test("el formulario vacío marca los campos y mueve el foco", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Email")).toBeFocused();
});

test("mostrar la contraseña", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByLabel("Contraseña", { exact: true });
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Mostrar contraseña" }).click();
  await expect(password).not.toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Mostrar contraseña" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("crear una cuenta de comprador y quedar adentro", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Creá una gratis" }).click();
  await expect(page.getByRole("heading", { name: "Creá tu cuenta." })).toBeVisible();

  await page.getByRole("radio", { name: /Quiero comprar entradas/ }).click();
  await page.getByLabel("Nombre").fill("Ana");
  await page.getByLabel("Apellido").fill("Suárez");
  await page.getByLabel("Email").fill("ana@mail.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("secreta123");
  await page.getByLabel("Repetir contraseña").fill("secreta123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/explorar/);
  await expect(page.getByRole("status")).toContainText("Tu cuenta está lista");
});

test("el registro valida contraseña y email repetido", async ({ page }) => {
  await page.goto("/registro");
  await page.getByRole("radio", { name: /Quiero publicar eventos/ }).click();
  await page.getByLabel("Nombre").fill("Lu");
  await page.getByLabel("Apellido").fill("Otra");
  await page.getByLabel("Email").fill("lucia@ticketit.com");
  await page.getByLabel("Contraseña", { exact: true }).fill("sinnumeros");
  await page.getByLabel("Repetir contraseña").fill("distinta");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByRole("alert")).toContainText("contraseña");
  await expect(page.getByLabel("Contraseña", { exact: true })).toBeFocused();

  // Corregida la contraseña, el backend responde que el email ya existe
  await page.getByLabel("Contraseña", { exact: true }).fill("secreta123");
  await page.getByLabel("Repetir contraseña").fill("secreta123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Ya existe una cuenta con ese email")).toBeVisible();
});

test("si el token deja de ser válido se cierra la sesión y se avisa", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/explorar");
  await expect(page.getByRole("heading", { name: "¿Qué salimos a ver?" })).toBeVisible();

  // Simula un token vencido: el backend responde 401 al validar la sesión
  await page.route("**/auth/me", (ruta) =>
    ruta.fulfill({
      status: 401,
      json: { status: "fail", message: "Tu sesión venció. Volvé a ingresar" },
    }),
  );
  await page.reload();

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("dialog", { name: "Tu sesión terminó" })).toContainText("venció");
});

test("el registro con errores no tiene violaciones WCAG A/AA", async ({ page }) => {
  await page.goto("/registro");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
