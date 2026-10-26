import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { API_URL, entrarComo, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-40: lista de espera. Superclásico (evento 5), Platea (tipo 2): queda 1 libre en la semilla.

async function tokenDe(request, email) {
  const respuesta = await request.post(`${API_URL}/auth/login`, {
    data: { email, password: "ticketit123" },
  });
  return (await respuesta.json()).token;
}

// Juan compra la última platea por la API: queda agotada. Devuelve cómo cancelar esa compra.
async function agotarPlatea(request) {
  const token = await tokenDe(request, "juan@ticketit.com");
  const compra = await request.post(`${API_URL}/compra`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { eventoId: 5, tipoEntradaId: 2, cantidad: 1 },
  });
  const { id } = await compra.json();
  return () =>
    request.post(`${API_URL}/compra/${id}/cancelar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
}

test.beforeEach(async ({ request, page }) => {
  await reiniciarDatos(request);
  await entrarComo(page, SOFIA);
});

test("anotarse en un tipo agotado y ver el puesto", async ({ page, request }) => {
  await agotarPlatea(request);
  await page.goto("/evento/5");

  await page.getByRole("button", { name: "Avisarme si se libera" }).click();
  await page.getByRole("button", { name: "Anotarme" }).click();
  await expect(page.getByRole("status")).toContainText("Te anotamos en la lista de espera");
  await expect(page.getByText("Estás en la lista de espera · puesto 1")).toBeVisible();

  await page.getByRole("button", { name: "Salir de la lista" }).click();
  await expect(page.getByRole("button", { name: "Avisarme si se libera" })).toBeVisible();
});

test("cuando se libera, la entrada queda guardada y se puede comprar", async ({
  page,
  request,
}) => {
  const cancelarCompraDeJuan = await agotarPlatea(request);
  await page.goto("/evento/5");
  await page.getByRole("button", { name: "Avisarme si se libera" }).click();
  await page.getByRole("button", { name: "Anotarme" }).click();
  await expect(page.getByText(/puesto 1/)).toBeVisible();

  await cancelarCompraDeJuan();
  await page.reload();
  await expect(page.getByText(/¡Te guardamos 1 entrada hasta las \d{2}:\d{2}!/)).toBeVisible();

  await page.getByRole("button", { name: /^Platea/ }).click();
  await page.getByRole("button", { name: "Comprar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Compra #\d+/ })).toBeVisible();
});

test("la lista de espera no tiene violaciones WCAG A/AA", async ({ page, request }) => {
  await agotarPlatea(request);
  await page.goto("/evento/5");
  await page.getByRole("button", { name: "Avisarme si se libera" }).click();
  await expect(page.getByRole("button", { name: "Anotarme" })).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
