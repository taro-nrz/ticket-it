import { delay, http, HttpResponse, passthrough } from "msw";
import { API_URL } from "../api/cliente.js";
import datosGenerados from "./datos.json";

// D-39: handlers de MSW. Dos modos (EXPO_PUBLIC_MSW):
// - "latencia": todas las llamadas van al backend real, pero con una demora (para ver los estados de carga)
// - "sin-backend": responde con datos generados desde la API real (scripts/generarMocks.mjs), sólo lectura

const DEMORA_BASE = Number(process.env.EXPO_PUBLIC_MSW_DEMORA) || 900;
const PREFIJO_TOKEN = "mock-";

// Demora variable como en una red real (entre 60 % y 160 % de la base); la primera carga de una pantalla
// suele tardar más que una consulta repetida
export const demora = () => Math.round(DEMORA_BASE * (0.6 + Math.random()));

// Las fechas de los datos se corren a "hoy": la demo sigue teniendo eventos futuros, uno de hoy y pasados
const corrimiento = Date.now() - new Date(datosGenerados.generadoEn).getTime();
const FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
function correrFechas(valor) {
  if (Array.isArray(valor)) return valor.map(correrFechas);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([k, v]) => [k, correrFechas(v)]));
  }
  if (typeof valor === "string" && FECHA_ISO.test(valor)) {
    return new Date(new Date(valor).getTime() + corrimiento).toISOString();
  }
  return valor;
}
const datos = correrFechas(datosGenerados);

const json = (cuerpo, status = 200) => HttpResponse.json(cuerpo, { status });
const error = (status, message) => json({ status: "fail", message }, status);
const noEncontrado = () => error(404, "No existe en los datos de prueba");
const jsonO404 = (valor) => (valor ? json(valor) : noEncontrado());

function usuarioDe(request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  if (!token.startsWith(PREFIJO_TOKEN)) return null;
  return datos.porUsuario[token.slice(PREFIJO_TOKEN.length)] ?? null;
}

// Envuelve cada respuesta con la demora y exige sesión si hace falta
const responder =
  (resolver, { conSesion = false } = {}) =>
  async ({ request, params }) => {
    await delay(demora());
    const usuario = usuarioDe(request);
    if (conSesion && !usuario)
      return error(401, "Tenés que iniciar sesión para realizar esta acción");
    return resolver({ request, params, usuario, url: new URL(request.url) });
  };

function paginar(lista, url) {
  const pagina = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limite = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 10));
  return {
    pagina,
    perPage: limite,
    total: lista.length,
    totalPaginas: Math.ceil(lista.length / limite),
    data: lista.slice((pagina - 1) * limite, pagina * limite),
  };
}

const sinAcentos = (texto) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

// Mismos filtros y orden que el backend (HU-02 / HU-03)
function buscarEventos(url, usuario) {
  const texto = sinAcentos(url.searchParams.get("texto"));
  const categoria = Number(url.searchParams.get("categoria")) || null;
  const orden = url.searchParams.get("orden") ?? "fecha";
  const signo = url.searchParams.get("dir") === "desc" ? -1 : 1;
  const favoritos = new Set((usuario?.favoritos?.data ?? []).map((evento) => evento.id));
  const criterios = {
    fecha: (a, b) => new Date(a.fecha) - new Date(b.fecha),
    precio: (a, b) => a.precioDesde - b.precioDesde,
    puntaje: (a, b) =>
      (a.organizador.puntajePromedio ?? -1) - (b.organizador.puntajePromedio ?? -1),
  };
  const eventos = datos.publico.eventos
    .filter((evento) => url.searchParams.get("incluirPasados") === "true" || !evento.yaSeRealizo)
    .filter((evento) => !categoria || evento.categoria.id === categoria)
    .filter(
      (evento) =>
        !texto ||
        [evento.nombre, evento.lugar, evento.categoria.nombre].some((campo) =>
          sinAcentos(campo).includes(texto),
        ),
    )
    .map((evento) => ({ ...evento, esFavorito: favoritos.has(evento.id) }))
    .sort((a, b) => signo * criterios[orden](a, b));
  return paginar(eventos, url);
}

const SOLO_LECTURA =
  "En el modo sin backend sólo se puede recorrer la app. Para comprar o publicar, levantá el backend (npm run start:web).";

const modoSinBackend = (base) => [
  http.post(
    `${base}/auth/login`,
    responder(async ({ request }) => {
      const { email, password } = await request.json();
      const entrada = Object.entries(datos.porUsuario).find(
        ([, d]) => d.usuario.email === String(email).trim().toLowerCase(),
      );
      if (!entrada || password !== "ticketit123")
        return error(401, "Email o contraseña incorrectos");
      return json({ token: `${PREFIJO_TOKEN}${entrada[0]}`, usuario: entrada[1].usuario });
    }),
  ),
  http.get(
    `${base}/auth/me`,
    responder(({ usuario }) => json(usuario.usuario), { conSesion: true }),
  ),
  http.get(
    `${base}/categoria`,
    responder(() => json(datos.publico.categorias)),
  ),
  http.get(
    `${base}/evento`,
    responder(({ url, usuario }) => json(buscarEventos(url, usuario))),
  ),
  http.get(
    `${base}/evento/mios`,
    responder(({ usuario }) => json(usuario.misEventos ?? paginar([], new URL(base))), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/evento/:id/compras`,
    responder(({ usuario, params }) => jsonO404(usuario.comprasDeEvento?.[params.id]), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/evento/:id/estadisticas`,
    responder(({ usuario, params }) => jsonO404(usuario.estadisticas?.[params.id]), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/evento/:id/cupones`,
    responder(({ usuario, params }) => json(usuario.cupones?.[params.id] ?? []), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/evento/:id/resenias`,
    responder(({ params }) => jsonO404(datos.publico.reseniasDeEvento[params.id])),
  ),
  http.get(
    `${base}/evento/:id`,
    responder(({ params, usuario }) => {
      const detalle = usuario?.detallesEvento[params.id] ?? datos.publico.detalles[params.id];
      return detalle ? json({ ...detalle, puedeEditarse: false }) : noEncontrado();
    }),
  ),
  http.get(
    `${base}/usuario/:id/resenias`,
    responder(({ params }) => {
      return jsonO404(datos.publico.reseniasDeOrganizador[params.id]);
    }),
  ),
  http.get(
    `${base}/usuario/me/favoritos`,
    responder(({ usuario }) => json(usuario.favoritos ?? { data: [], total: 0 }), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/compra/mias`,
    responder(
      ({ usuario, url }) => {
        const estado = url.searchParams.get("estado");
        const compras = (usuario.misCompras ?? []).filter((c) => !estado || c.estado === estado);
        return json(paginar(compras, url));
      },
      { conSesion: true },
    ),
  ),
  http.get(
    `${base}/compra/:id/mensajes`,
    responder(({ usuario, params }) => json(usuario.mensajes[params.id] ?? []), {
      conSesion: true,
    }),
  ),
  http.get(
    `${base}/compra/:id`,
    responder(
      ({ usuario, params }) => {
        const compra = usuario.compras[params.id];
        // En modo sólo lectura no se ofrecen acciones que modifican datos (salvo abrir el chat)
        return compra
          ? json({
              ...compra,
              accionesDisponibles: compra.accionesDisponibles.filter((a) => a === "CHATEAR"),
            })
          : noEncontrado();
      },
      { conSesion: true },
    ),
  ),
  http.get(
    `${base}/notificacion/resumen`,
    responder(({ usuario }) => json(usuario.resumenNotificaciones), { conSesion: true }),
  ),
  http.get(
    `${base}/notificacion`,
    responder(({ usuario }) => json(usuario.notificaciones), { conSesion: true }),
  ),
  // Marcar como leído no cambia nada importante: se acepta sin guardar
  http.post(
    `${base}/compra/:id/mensajes/leidos`,
    responder(() => new HttpResponse(null, { status: 204 })),
  ),
  // Cualquier otra operación (comprar, pagar, publicar...) necesita el backend real
  http.all(
    `${base}/*`,
    responder(() => error(503, SOLO_LECTURA)),
  ),
];

const modoLatencia = (base) => [
  http.all(`${base}/*`, async () => {
    await delay(demora());
    return passthrough();
  }),
];

export function crearHandlers(modo, base = API_URL) {
  return modo === "sin-backend" ? modoSinBackend(base) : modoLatencia(base);
}
