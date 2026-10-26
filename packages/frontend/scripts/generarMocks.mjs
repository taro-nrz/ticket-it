// D-39: genera los datos del modo "sin backend" (MSW) a partir de la API REAL con los datos semilla.
// Así los mocks no se desactualizan: si cambia el backend, se vuelve a correr `npm run mocks:generar`.
import { writeFile } from "node:fs/promises";
import { crearApp } from "../../backend/app.js";
import { obtenerConfig } from "../../backend/config/config.js";

const USUARIOS = {
  1: "lucia@ticketit.com",
  2: "martin@ticketit.com",
  3: "sofia@ticketit.com",
  4: "juan@ticketit.com",
  5: "valentina@ticketit.com",
};
const PASSWORD = "ticketit123";

const server = await crearApp({ config: { ...obtenerConfig({}), loginMaxIntentos: 1000 } });
const http = server.app.listen(0);
const base = `http://127.0.0.1:${http.address().port}`;

async function get(ruta, token) {
  const respuesta = await fetch(base + ruta, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return respuesta.ok ? respuesta.json() : null;
}

const publico = {
  categorias: await get("/categoria"),
  eventos: (await get("/evento?incluirPasados=true&limit=100")).data,
  detalles: {},
  reseniasDeEvento: {},
  reseniasDeOrganizador: {},
};
for (const { id } of publico.eventos) {
  publico.detalles[id] = await get(`/evento/${id}`);
  publico.reseniasDeEvento[id] = await get(`/evento/${id}/resenias?limit=50`);
}
for (const id of [1, 2]) {
  publico.reseniasDeOrganizador[id] = await get(`/usuario/${id}/resenias?limit=50`);
}

// Lo que ve cada usuario de prueba (su sesión, sus compras, sus eventos, sus notificaciones...)
const porUsuario = {};
for (const [id, email] of Object.entries(USUARIOS)) {
  const login = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  }).then((r) => r.json());
  const token = login.token;
  const me = await get("/auth/me", token);
  const datos = {
    usuario: me,
    notificaciones: await get("/notificacion?limit=50", token),
    resumenNotificaciones: await get("/notificacion/resumen", token),
    detallesEvento: {},
    compras: {},
    mensajes: {},
  };
  for (const { id: eventoId } of publico.eventos) {
    datos.detallesEvento[eventoId] = await get(`/evento/${eventoId}`, token);
  }
  if (me.rol === "COMPRADOR") {
    datos.misCompras = (await get("/compra/mias?limit=100", token)).data;
    datos.favoritos = await get("/usuario/me/favoritos?limit=100", token);
    for (const compra of datos.misCompras) {
      datos.compras[compra.id] = await get(`/compra/${compra.id}`, token);
      datos.mensajes[compra.id] = await get(`/compra/${compra.id}/mensajes`, token);
    }
  } else {
    datos.misEventos = await get("/evento/mios?limit=100", token);
    datos.comprasDeEvento = {};
    datos.estadisticas = {};
    datos.cupones = {};
    for (const evento of datos.misEventos.data) {
      const compras = await get(`/evento/${evento.id}/compras?limit=100`, token);
      datos.comprasDeEvento[evento.id] = compras;
      datos.estadisticas[evento.id] = await get(`/evento/${evento.id}/estadisticas`, token);
      datos.cupones[evento.id] = await get(`/evento/${evento.id}/cupones`, token);
      for (const compra of compras.data) {
        datos.compras[compra.id] = await get(`/compra/${compra.id}`, token);
        datos.mensajes[compra.id] = await get(`/compra/${compra.id}/mensajes`, token);
      }
    }
  }
  porUsuario[id] = datos;
}

http.close();
const salida = new URL("../src/mocks/datos.json", import.meta.url);
await writeFile(salida, JSON.stringify({ generadoEn: new Date().toISOString(), publico, porUsuario }));
console.log(`Mocks generados en ${salida.pathname}`);
process.exit(0);
