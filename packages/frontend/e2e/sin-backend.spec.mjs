import { expect, test } from "@playwright/test";

// D-39: la app con MSW en modo "sin backend": no hay ningún servidor de API levantado para este proyecto
// (EXPO_PUBLIC_API_URL apunta a un puerto vacío). Todo lo que se ve sale de los mocks generados.

test("se puede ingresar y recorrer el catálogo sin backend", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sofía/ }).click();
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page.getByRole("heading", { name: "¿Qué salimos a ver?" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ })).toBeVisible();

  // Los filtros funcionan sobre los datos de prueba
  await page
    .getByRole("group", { name: "Filtrar por categoría" })
    .getByRole("button", { name: "Teatro" })
    .click();
  await expect(page.getByRole("button", { name: /Hamlet/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ })).toHaveCount(0);
});

test("el detalle, las entradas y las notificaciones salen de los mocks", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sofía/ }).click();
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "¿Qué salimos a ver?" })).toBeVisible();

  await page.goto("/evento/1");
  await expect(page.getByRole("heading", { name: "Noche Indie en Obras", level: 1 })).toBeVisible();

  await page.goto("/mis-compras");
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ }).first()).toBeVisible();
});

test("una operación que modifica datos explica que hace falta el backend", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sofía/ }).click();
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("heading", { name: "¿Qué salimos a ver?" })).toBeVisible();

  await page.goto("/evento/1");
  await page.getByRole("button", { name: /^General/ }).click();
  await page.getByRole("button", { name: "Comprar", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("modo sin backend");
});
