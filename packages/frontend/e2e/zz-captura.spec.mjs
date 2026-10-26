import { test } from "@playwright/test";
import { reiniciarDatos } from "./utils.mjs";
const C = "../../docs/capturas/";
test("captura", async ({ page, request }) => {
  await reiniciarDatos(request);
  await page.goto("/login");
  await page.getByLabel("Email").waitFor();
  await page.waitForTimeout(600);
  await page.screenshot({ path: C + "80-login.png", fullPage: true });
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: C + "81-login-errores.png" });
  await page.goto("/registro");
  await page.getByRole("radio", { name: /Quiero comprar/ }).click();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: C + "82-registro.png", fullPage: true });
});
