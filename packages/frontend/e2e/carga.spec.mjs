import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { API_URL, entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-39: estados de carga. Se demoran las respuestas de la API para ver qué muestra cada pantalla.

// Demora las llamadas a la API (sin tocar la app web) y devuelve cómo liberarlas
async function demorarApi(page, ruta) {
  let liberar;
  const liberada = new Promise((resolve) => (liberar = resolve));
  await page.route(`${API_URL}${ruta}`, async (r) => {
    await liberada;
    await r.continue();
  });
  return liberar;
}

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, SOFIA);
});

test("la primera carga del catálogo muestra un esqueleto y después los eventos", async ({
  page,
}) => {
  const liberar = await demorarApi(page, "/evento?*");
  await page.goto("/explorar");

  const esqueleto = page.getByRole("progressbar", { name: "Cargando eventos" });
  await expect(esqueleto).toBeVisible();
  await expect(esqueleto).toHaveAttribute("aria-busy", "true");

  liberar();
  await expect(esqueleto).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ })).toBeVisible();
});

test("cambiar un filtro con resultados a la vista muestra la barra fina, no el esqueleto", async ({
  page,
}) => {
  await page.goto("/explorar");
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ })).toBeVisible();

  const liberar = await demorarApi(page, "/evento?*");
  await page
    .getByRole("group", { name: "Filtrar por categoría" })
    .getByRole("button", { name: "Teatro" })
    .click();
  await expect(page.getByRole("progressbar", { name: "Buscando eventos" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Cargando eventos" })).toHaveCount(0);
  // Los resultados anteriores siguen visibles mientras tanto
  await expect(page.getByRole("button", { name: /Noche Indie en Obras/ })).toBeVisible();

  liberar();
  await expect(page.getByRole("progressbar", { name: "Buscando eventos" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Hamlet/ })).toBeVisible();
});

test("el detalle de un evento y de una compra tienen su propio esqueleto", async ({ page }) => {
  const liberarEvento = await demorarApi(page, "/evento/1");
  await page.goto("/evento/1");
  await expect(page.getByRole("progressbar", { name: "Cargando el evento" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Volver" })).toBeVisible();
  liberarEvento();
  await expect(page.getByRole("heading", { name: "Noche Indie en Obras", level: 1 })).toBeVisible();

  const liberarCompra = await demorarApi(page, "/compra/1");
  await page.goto("/compra/1");
  await expect(page.getByRole("progressbar", { name: "Cargando la compra" })).toBeVisible();
  liberarCompra();
  await expect(page.getByRole("heading", { name: "Compra #1" })).toBeVisible();
});

test("si tarda demasiado se avisa y se puede reintentar", async ({ page }) => {
  test.setTimeout(30_000);
  const liberar = await demorarApi(page, "/compra/mias*");
  await page.goto("/mis-compras");
  await expect(page.getByRole("progressbar", { name: "Cargando tus entradas" })).toBeVisible();
  await expect(page.getByText("Está tardando más de lo normal")).toBeVisible({ timeout: 12_000 });
  liberar();
  await expect(page.getByText("Está tardando más de lo normal")).toHaveCount(0);
});

test("los esqueletos no tienen violaciones WCAG A/AA", async ({ page }) => {
  await demorarApi(page, "/evento?*");
  await page.goto("/explorar");
  await expect(page.getByRole("progressbar", { name: "Cargando eventos" })).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
