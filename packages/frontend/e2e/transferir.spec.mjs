import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, JUAN, reiniciarDatos, SOFIA } from "./utils.mjs";

// D-41: transferir una entrada (compra 1 de Sofía, confirmada)

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

test("Sofía le pasa su entrada a Juan, que la recibe con un QR nuevo", async ({
  page,
  context,
}) => {
  await entrarComo(page, SOFIA);
  await page.goto("/compra/1");
  await page.getByRole("button", { name: "Transferir a otra persona" }).click();
  const dialogo = page.getByRole("dialog", { name: "Transferir la entrada" });
  await dialogo.getByLabel("Email de quien la recibe").fill("juan@ticketit.com");
  await dialogo.getByRole("button", { name: "Transferir" }).click();

  await expect(page).toHaveURL(/\/mis-compras/);
  await expect(page.getByRole("status")).toContainText("Le pasaste la entrada a Juan Rodríguez");

  // Juan la ve en sus entradas, con el aviso de quién se la pasó
  const paginaJuan = await context.newPage();
  await entrarComo(paginaJuan, JUAN);
  await paginaJuan.goto("/compra/1");
  await expect(paginaJuan.getByText("Recibiste esta entrada de Sofía Pérez.")).toBeVisible();
  await expect(paginaJuan.getByRole("img", { name: /Código QR de la entrada/ })).toBeVisible();
});

test("un email sin cuenta se informa en el diálogo", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/compra/1");
  await page.getByRole("button", { name: "Transferir a otra persona" }).click();
  const dialogo = page.getByRole("dialog", { name: "Transferir la entrada" });
  await dialogo.getByLabel("Email de quien la recibe").fill("nadie@ticketit.com");
  await dialogo.getByRole("button", { name: "Transferir" }).click();
  await expect(dialogo.getByText("No hay ninguna cuenta con ese email")).toBeVisible();
});

test("el diálogo de transferencia no tiene violaciones WCAG A/AA", async ({ page }) => {
  await entrarComo(page, SOFIA);
  await page.goto("/compra/1");
  await page.getByRole("button", { name: "Transferir a otra persona" }).click();
  await expect(page.getByRole("dialog", { name: "Transferir la entrada" })).toBeVisible();
  const resultado = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(resultado.violations).toEqual([]);
});
