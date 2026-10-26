import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { API_URL, entrarComo, LUCIA, reiniciarDatos } from "./utils.mjs";

// D-42: fotos del evento subidas desde el dispositivo

// PNG válido de 1×1 píxel
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, LUCIA);
  await page.goto("/crear-evento");
  await expect(page.getByRole("heading", { name: "Publicar evento", level: 1 })).toBeVisible();
});

async function subirFoto(page) {
  const [selector] = await Promise.all([
    page.waitForEvent("filechooser"),
    page.getByRole("button", { name: "Subir foto" }).click(),
  ]);
  await selector.setFiles({ name: "escenario.png", mimeType: "image/png", buffer: PNG });
}

test("subir una foto la agrega como portada y se publica con el evento", async ({ page }) => {
  const subida = page.waitForResponse(`${API_URL}/archivos/imagenes`);
  await subirFoto(page);
  expect((await subida).status()).toBe(201);
  await expect(page.getByText("Portada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Quitar la foto 1" })).toBeVisible();

  // Una segunda foto por URL, que después pasa a ser la portada
  await page
    .getByLabel("O pegá el enlace de una imagen")
    .fill("https://picsum.photos/seed/x/800/450");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await page.getByRole("button", { name: "Usar la foto 2 como portada" }).click();
  await expect(page.getByRole("button", { name: "Usar la foto 2 como portada" })).toBeVisible();

  await page.getByRole("button", { name: "Quitar la foto 2" }).click();
  await expect(page.getByRole("button", { name: "Quitar la foto 2" })).toHaveCount(0);
});

test("una dirección inválida se marca en el campo", async ({ page }) => {
  await page.getByLabel("O pegá el enlace de una imagen").fill("no es una url");
  await page.getByRole("button", { name: "Agregar", exact: true }).click();
  await expect(page.getByText("Pegá un enlace que empiece con http:// o https://")).toBeVisible();
});

test("el gestor de fotos no tiene violaciones WCAG A/AA", async ({ page }) => {
  await subirFoto(page);
  await expect(page.getByText("Portada", { exact: true })).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
