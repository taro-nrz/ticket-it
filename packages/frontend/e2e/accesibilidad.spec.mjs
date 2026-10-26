import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { entrarComo, LUCIA, reiniciarDatos, SOFIA } from "./utils.mjs";

// Chequeo automático de las pautas WCAG 2.2 A/AA con axe en cada pantalla.
// Una violación hace fallar el test, igual que un error funcional.
const PANTALLAS = [
  { nombre: "Login", ruta: "/login", usuario: null, titulo: "Ingresar" },
  { nombre: "Crear cuenta", ruta: "/registro", usuario: null, titulo: "Crear cuenta" },
  { nombre: "Explorar", ruta: "/explorar", usuario: SOFIA, titulo: "¿Qué salimos a ver?" },
  {
    nombre: "Detalle de evento",
    ruta: "/evento/1",
    usuario: SOFIA,
    titulo: "Noche Indie en Obras",
  },
  { nombre: "Mis entradas", ruta: "/mis-compras", usuario: SOFIA, titulo: "Mis entradas" },
  { nombre: "Detalle de compra", ruta: "/compra/1", usuario: SOFIA, titulo: "Compra #1" },
  { nombre: "Chat", ruta: "/compra/1/chat", usuario: SOFIA, titulo: "Lucía Fernández" },
  {
    nombre: "Reseñas del organizador",
    ruta: "/organizador/1",
    usuario: SOFIA,
    titulo: "Reseñas del organizador",
  },
  {
    nombre: "Reseñas del evento",
    ruta: "/evento/7/resenias",
    usuario: LUCIA,
    titulo: "Reseñas del evento",
  },
  {
    nombre: "Detalle de evento realizado",
    ruta: "/evento/7",
    usuario: SOFIA,
    titulo: "Recital Acústico en el Konex",
  },
  { nombre: "Mi perfil", ruta: "/perfil", usuario: SOFIA, titulo: "Mi perfil" },
  { nombre: "Mis eventos", ruta: "/mis-eventos", usuario: LUCIA, titulo: "Mis eventos" },
  {
    nombre: "Compras de un evento",
    ruta: "/evento/1/compras",
    usuario: LUCIA,
    titulo: "Noche Indie en Obras",
  },
  { nombre: "Publicar evento", ruta: "/crear-evento", usuario: LUCIA, titulo: "Publicar evento" },
  { nombre: "Editar evento", ruta: "/evento/1/editar", usuario: LUCIA, titulo: "Editar evento" },
  {
    nombre: "Estadísticas",
    ruta: "/evento/7/estadisticas",
    usuario: LUCIA,
    titulo: "Estadísticas",
  },
];

test.beforeEach(async ({ request }) => {
  await reiniciarDatos(request);
});

for (const pantalla of PANTALLAS) {
  test(`${pantalla.nombre} no tiene violaciones WCAG A/AA`, async ({ page }) => {
    if (pantalla.usuario) await entrarComo(page, pantalla.usuario);
    await page.goto(pantalla.ruta);
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    const resultado = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(resultado.violations).toEqual([]);

    // WCAG 3.1.1 y 2.4.2: idioma de la página y título propio
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page).toHaveTitle(`${pantalla.titulo} · AI Ticket It`);
  });
}

test("el formulario con errores marca los campos, anuncia el resumen y mueve el foco", async ({
  page,
}) => {
  await entrarComo(page, LUCIA);
  await page.goto("/crear-evento");
  await page.getByRole("button", { name: "Publicar evento" }).click();

  // Pauta 9: resumen anunciado y foco en el primer campo a corregir
  await expect(page.getByRole("alert")).toContainText("Revisá");
  const nombre = page.getByLabel("Nombre", { exact: true });
  await expect(nombre).toBeFocused();
  // Pauta 3: el error está asociado al campo y dice cómo corregirlo
  await expect(nombre).toHaveAttribute("aria-invalid", "true");
  await expect(nombre).toHaveAccessibleDescription(/al menos 3 caracteres/);

  // Al corregirlo, el campo deja de estar marcado
  await nombre.fill("Recital accesible");
  await expect(nombre).not.toHaveAttribute("aria-invalid", "true");
});
