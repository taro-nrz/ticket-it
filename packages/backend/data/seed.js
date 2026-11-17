import { Categoria } from "../models/entities/categoria.js";
import { Compra } from "../models/entities/compra.js";
import { Evento } from "../models/entities/evento.js";
import { Resenia } from "../models/entities/resenia.js";
import { RolUsuario } from "../models/entities/rolUsuario.js";
import { TipoEntrada } from "../models/entities/tipoEntrada.js";
import { Usuario } from "../models/entities/usuario.js";
import { Notificacion, TipoNotificacion } from "../models/entities/notificacion.js";
import { sumarDias, sumarHoras } from "../utils/reloj.js";

// D-29: contraseña de todos los usuarios demo (documentada en el README)
export const PASSWORD_DEMO = "ticketit123";

// Datos de prueba en memoria. Las fechas son relativas a "ahora" para que la demo funcione cualquier día:
// hay eventos futuros, uno de hoy (para marcar entradas utilizadas) y pasados (con reseñas),
// y compras en los 5 estados.
export async function cargarDatosSemilla(repositorios, ahora, { hashDemo }) {
  const {
    usuarioRepository,
    categoriaRepository,
    eventoRepository,
    compraRepository,
    reseniaRepository,
    notificacionRepository,
  } = repositorios;

  const enDias = (dias, hora = 21) => {
    const fecha = sumarDias(ahora, dias);
    fecha.setHours(hora, 0, 0, 0);
    return fecha;
  };
  const hoyALaNoche = () => {
    const fecha = new Date(ahora);
    fecha.setHours(23, 30, 0, 0);
    return fecha > ahora ? fecha : sumarHoras(ahora, 1);
  };

  // ---------- USUARIOS ----------
  const usuarioDemo = (nombre, apellido, rol, email) =>
    new Usuario(nombre, apellido, rol, email, hashDemo);
  const lucia = usuarioDemo("Lucía", "Fernández", RolUsuario.ORGANIZADOR, "lucia@ticketit.com"); // id 1
  const martin = usuarioDemo("Martín", "Gómez", RolUsuario.ORGANIZADOR, "martin@ticketit.com"); // id 2
  const sofia = usuarioDemo("Sofía", "Pérez", RolUsuario.COMPRADOR, "sofia@ticketit.com"); // id 3
  const juan = usuarioDemo("Juan", "Rodríguez", RolUsuario.COMPRADOR, "juan@ticketit.com"); // id 4
  const valentina = usuarioDemo(
    "Valentina",
    "López",
    RolUsuario.COMPRADOR,
    "valentina@ticketit.com",
  ); // id 5
  for (const demo of [lucia, martin, sofia, juan, valentina]) {
    await usuarioRepository.save(demo);
  }

  // ---------- CATEGORÍAS ----------
  const [recitales, teatro, festivales, conferencias, deportes] = [
    new Categoria("Recitales", "Shows en vivo de bandas y solistas"),
    new Categoria("Teatro", "Obras de teatro, comedia y stand-up"),
    new Categoria("Festivales", "Festivales de música y cultura de uno o más días"),
    new Categoria("Conferencias", "Charlas, congresos y conferencias"),
    new Categoria("Deportes", "Eventos deportivos"),
  ];
  for (const categoria of [recitales, teatro, festivales, conferencias, deportes]) {
    await categoriaRepository.save(categoria);
  }

  // ---------- EVENTOS ----------
  const imagen = (semilla) => `https://picsum.photos/seed/${semilla}/800/450`;
  const tipo = (nombre, descripcion, precio, cupo) =>
    new TipoEntrada(nombre, descripcion, precio, cupo);

  const datosEventos = [
    // Futuros
    {
      nombre: "Noche Indie en Obras",
      descripcion: "Las bandas indie del momento en una noche única con invitados sorpresa.",
      categoria: recitales,
      fecha: enDias(20),
      lugar: "Estadio Obras",
      direccion: "Av. del Libertador 7395, CABA",
      multimedia: [imagen("indie1"), imagen("indie2")],
      tiposEntrada: [
        tipo("General", "Campo de pie", 15000, 500),
        tipo("Platea", "Ubicación sentada numerada", 25000, 200),
        tipo("VIP", "Acceso preferencial y barra exclusiva", 50000, 20),
      ],
      organizador: lucia,
    },
    {
      nombre: "Hamlet",
      descripcion: "La tragedia de Shakespeare en una puesta moderna del elenco estable.",
      categoria: teatro,
      fecha: enDias(10, 20),
      lugar: "Teatro San Martín",
      direccion: "Av. Corrientes 1530, CABA",
      multimedia: [imagen("hamlet")],
      tiposEntrada: [
        tipo("Platea", "Planta baja", 18000, 150),
        tipo("Pullman", "Primer piso", 12000, 100),
      ],
      organizador: martin,
    },
    {
      nombre: "Festival Primavera",
      descripcion: "Dos escenarios, más de 20 artistas y un patio gastronómico al aire libre.",
      categoria: festivales,
      fecha: enDias(45, 16),
      lugar: "Hipódromo de Palermo",
      direccion: "Av. del Libertador 4101, CABA",
      multimedia: [imagen("primavera1"), imagen("primavera2"), imagen("primavera3")],
      tiposEntrada: [
        tipo("Campo", "Acceso general a ambos escenarios", 30000, 1000),
        tipo("VIP", "Sector elevado con vista preferencial", 70000, 100),
      ],
      organizador: lucia,
    },
    {
      nombre: "Conferencia de IA aplicada al desarrollo",
      descripcion: "Charlas sobre el uso de inteligencia artificial en el desarrollo de software.",
      categoria: conferencias,
      fecha: enDias(5, 18),
      lugar: "UTN FRBA - Sede Medrano",
      direccion: "Av. Medrano 951, CABA",
      multimedia: [imagen("ia-conf")],
      tiposEntrada: [
        tipo("Estudiante", "Con libreta universitaria", 0, 200),
        tipo("General", "Público general", 8000, 100),
      ],
      organizador: martin,
    },
    {
      nombre: "Superclásico de verano",
      descripcion: "El clásico más convocante del fútbol argentino en su edición de verano.",
      categoria: deportes,
      fecha: enDias(30, 19),
      lugar: "Estadio Único de La Plata",
      direccion: "Av. 32 y 25, La Plata",
      multimedia: [imagen("superclasico")],
      tiposEntrada: [
        tipo("Popular", "Tribuna popular", 20000, 2000),
        tipo("Platea", "Platea techada", 45000, 2),
      ],
      organizador: martin,
    },
    // Hoy (para poder marcar entradas como utilizadas en la demo)
    {
      nombre: "Stand-up de los jueves",
      descripcion: "Una noche de humor con cuatro comediantes de la nueva generación.",
      categoria: teatro,
      fecha: hoyALaNoche(),
      lugar: "Paseo La Plaza",
      direccion: "Av. Corrientes 1660, CABA",
      multimedia: [imagen("standup")],
      tiposEntrada: [tipo("General", "Ubicación libre", 9000, 120)],
      organizador: lucia,
    },
    // Pasados (con compras utilizadas y reseñas)
    {
      nombre: "Recital Acústico en el Konex",
      descripcion: "Un formato íntimo y acústico con los clásicos de siempre.",
      categoria: recitales,
      fecha: enDias(-15),
      lugar: "Ciudad Cultural Konex",
      direccion: "Sarmiento 3131, CABA",
      multimedia: [imagen("acustico")],
      tiposEntrada: [tipo("General", "Campo", 12000, 300)],
      organizador: lucia,
    },
    {
      nombre: "Esperando la carroza",
      descripcion: "El clásico de la comedia argentina vuelve a escena.",
      categoria: teatro,
      fecha: enDias(-30, 20),
      lugar: "Teatro Lola Membrives",
      direccion: "Av. Corrientes 1280, CABA",
      multimedia: [imagen("carroza")],
      tiposEntrada: [tipo("Platea", "Planta baja", 14000, 200)],
      organizador: martin,
    },
    {
      nombre: "Festival de Verano 2026",
      descripcion: "La edición de verano con lo mejor del rock nacional.",
      categoria: festivales,
      fecha: enDias(-60, 17),
      lugar: "Parque de la Ciudad",
      direccion: "Av. Escalada y Av. Fernández de la Cruz, CABA",
      multimedia: [imagen("verano")],
      tiposEntrada: [tipo("Campo", "Acceso general", 25000, 800)],
      organizador: lucia,
    },
  ];

  const eventos = [];
  for (const datos of datosEventos) {
    eventos.push(await eventoRepository.save(new Evento(datos)));
  }
  const [
    indie,
    hamlet,
    primavera,
    conferenciaIA,
    superclasico,
    standup,
    acustico,
    carroza,
    verano,
  ] = eventos;

  // ---------- COMPRAS ----------
  // Simula el ciclo de vida usando los mismos métodos de dominio que la API
  const comprar = async (comprador, evento, tipoEntradaId, cantidad, fechaCompra) => {
    const tipoEntrada = evento.buscarTipoEntrada(tipoEntradaId);
    tipoEntrada.reservar(cantidad);
    return new Compra(comprador, evento, tipoEntrada, cantidad, fechaCompra);
  };
  const compras = [];
  const guardar = async (compra) => compras.push(await compraRepository.save(compra));
  const haceDias = (dias) => sumarDias(ahora, -dias);
  const haceMinutos = (minutos) => new Date(ahora.getTime() - minutos * 60 * 1000);
  // D-37: las compras pagadas de la semilla tienen un pago de prueba (sólo marca y últimos 4 dígitos)
  const pagoDemo = (marca, ultimos4) => ({ marca, ultimos4, autorizacion: "SIM-SEMILLA" });

  // Sofía: CONFIRMADA con chat, PENDIENTE, CANCELADA, REEMBOLSADA y UTILIZADA (reseñada)
  const sofiaIndie = await comprar(sofia, indie, 1, 2, haceDias(5));
  // D-33: códigos fijos en las entradas que se usan en la demo (el resto se genera al azar)
  sofiaIndie.pagar(sofia, new Date(haceDias(5).getTime() + 10 * 60 * 1000), {
    codigo: "TK-SOFA-2N7D",
    pago: pagoDemo("Visa", "4242"),
  });
  sofiaIndie.agregarMensaje(sofia, "Hola! ¿A qué hora abren las puertas?", haceDias(4));
  sofiaIndie.agregarMensaje(lucia, "¡Hola Sofía! Las puertas abren a las 19 hs.", haceDias(4));
  sofiaIndie.agregarMensaje(sofia, "Genial, ¡gracias!", haceDias(3));
  await guardar(sofiaIndie);

  // D-36: las PENDIENTES son recientes (vencen a los 15 minutos de la compra)
  await guardar(await comprar(sofia, hamlet, 1, 1, haceMinutos(5)));

  const sofiaSuperclasico = await comprar(sofia, superclasico, 1, 3, haceDias(8));
  sofiaSuperclasico.cancelar(sofia, haceDias(7));
  await guardar(sofiaSuperclasico);

  const sofiaPrimavera = await comprar(sofia, primavera, 1, 2, haceDias(12));
  sofiaPrimavera.pagar(sofia, haceDias(12), { pago: pagoDemo("Visa", "4242") });
  sofiaPrimavera.cancelar(sofia, haceDias(2));
  await guardar(sofiaPrimavera);

  const sofiaAcustico = await comprar(sofia, acustico, 1, 2, sumarDias(acustico.fecha, -20));
  sofiaAcustico.pagar(sofia, sumarDias(acustico.fecha, -20), { pago: pagoDemo("Visa", "4242") });
  sofiaAcustico.utilizar(lucia, acustico.fecha);
  await guardar(sofiaAcustico);

  // Juan: UTILIZADA sin reseña (para probar HU-11), UTILIZADA reseñada, CONFIRMADA de hoy y CONFIRMADA futura
  const juanAcustico = await comprar(juan, acustico, 1, 1, sumarDias(acustico.fecha, -10));
  juanAcustico.pagar(juan, sumarDias(acustico.fecha, -10), { pago: pagoDemo("Visa", "4242") });
  juanAcustico.utilizar(lucia, acustico.fecha);
  await guardar(juanAcustico);

  const juanCarroza = await comprar(juan, carroza, 1, 2, sumarDias(carroza.fecha, -15));
  juanCarroza.pagar(juan, sumarDias(carroza.fecha, -15), { pago: pagoDemo("Visa", "4242") });
  juanCarroza.utilizar(martin, carroza.fecha);
  await guardar(juanCarroza);

  const juanStandup = await comprar(juan, standup, 1, 2, haceDias(3));
  juanStandup.pagar(juan, haceDias(3), {
    codigo: "TK-JUAN-H7Y5",
    pago: pagoDemo("Mastercard", "4444"),
  });
  juanStandup.agregarMensaje(juan, "¿Se puede entrar con comida?", haceDias(2));
  await guardar(juanStandup);

  const juanConferencia = await comprar(juan, conferenciaIA, 1, 1, haceDias(2));
  juanConferencia.pagar(juan, haceDias(2), { pago: pagoDemo("Visa", "4242") });
  await guardar(juanConferencia);

  // Valentina: UTILIZADAS reseñadas, PENDIENTE y la última platea del superclásico (queda 1)
  const valentinaVerano = await comprar(valentina, verano, 1, 4, sumarDias(verano.fecha, -30));
  valentinaVerano.pagar(valentina, sumarDias(verano.fecha, -30), {
    pago: pagoDemo("Visa", "4242"),
  });
  valentinaVerano.utilizar(lucia, verano.fecha);
  await guardar(valentinaVerano);

  const valentinaCarroza = await comprar(valentina, carroza, 1, 1, sumarDias(carroza.fecha, -5));
  valentinaCarroza.pagar(valentina, sumarDias(carroza.fecha, -5), {
    pago: pagoDemo("Visa", "4242"),
  });
  valentinaCarroza.utilizar(martin, carroza.fecha);
  await guardar(valentinaCarroza);

  await guardar(await comprar(valentina, indie, 3, 1, haceMinutos(8)));

  const valentinaSuperclasico = await comprar(valentina, superclasico, 2, 1, haceDias(4));
  valentinaSuperclasico.pagar(valentina, haceDias(4), { pago: pagoDemo("Visa", "4242") });
  await guardar(valentinaSuperclasico);

  for (const evento of eventos) {
    await eventoRepository.save(evento);
  }

  // ---------- RESEÑAS ----------
  const resenias = [
    new Resenia(
      sofia,
      acustico,
      "Un show hermoso, el sonido impecable.",
      5,
      sumarDias(acustico.fecha, 1),
    ),
    new Resenia(
      valentina,
      verano,
      "Muy buena organización, aunque largas filas en la entrada.",
      4,
      sumarDias(verano.fecha, 1),
    ),
    new Resenia(
      juan,
      carroza,
      "Muy divertida, el elenco excelente.",
      4,
      sumarDias(carroza.fecha, 1),
    ),
    new Resenia(
      valentina,
      carroza,
      "Linda obra pero la sala hacía mucho calor.",
      3,
      sumarDias(carroza.fecha, 2),
    ),
  ];
  for (const resenia of resenias) {
    await reseniaRepository.save(resenia);
  }

  // ---------- FAVORITOS ----------
  sofia.agregarFavorito(primavera);
  sofia.agregarFavorito(hamlet);
  juan.agregarFavorito(indie);
  for (const usuario of [sofia, juan]) {
    await usuarioRepository.save(usuario);
  }

  // ---------- NOTIFICACIONES (D-32) ----------
  // Las que habrían generado los services con la actividad de la semilla
  const notificaciones = [
    new Notificacion({
      usuario: lucia,
      tipo: TipoNotificacion.NUEVA_VENTA,
      titulo: `Nueva venta para ${indie.nombre}`,
      mensaje: "Sofía Pérez pagó 2 × General ($ 30.000).",
      link: `/compra/${sofiaIndie.id}`,
      fecha: haceDias(5),
    }),
    new Notificacion({
      usuario: lucia,
      tipo: TipoNotificacion.NUEVO_MENSAJE,
      titulo: "Mensaje de Sofía Pérez",
      mensaje: `${indie.nombre}: “Genial, ¡gracias!”`,
      link: `/compra/${sofiaIndie.id}/chat`,
      fecha: haceDias(3),
    }),
    new Notificacion({
      usuario: lucia,
      tipo: TipoNotificacion.NUEVO_MENSAJE,
      titulo: "Mensaje de Juan Rodríguez",
      mensaje: `${standup.nombre}: “¿Se puede entrar con comida?”`,
      link: `/compra/${juanStandup.id}/chat`,
      fecha: haceDias(2),
    }),
    new Notificacion({
      usuario: juan,
      tipo: TipoNotificacion.ENTRADA_UTILIZADA,
      titulo: `¡Que disfrutes ${acustico.nombre}!`,
      mensaje: "Validaron tu entrada. Después contanos qué te pareció calificando el evento.",
      link: `/compra/${juanAcustico.id}`,
      fecha: sumarDias(acustico.fecha, 0),
    }),
  ];
  notificaciones[0].marcarComoLeida();
  for (const notificacion of notificaciones) {
    await notificacionRepository.save(notificacion);
  }

  return {
    usuarios: await usuarioRepository.count(),
    categorias: await categoriaRepository.count(),
    eventos: await eventoRepository.count(),
    compras: await compraRepository.count(),
    resenias: await reseniaRepository.count(),
  };
}
