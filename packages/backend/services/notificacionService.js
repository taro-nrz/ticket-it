import { notificacionDTO } from "../dtos/notificacionDTO.js";
import { ForbiddenError, NotFoundError } from "../error/appError.js";
import { Notificacion, TipoNotificacion } from "../models/entities/notificacion.js";
import { paginar } from "../utils/paginacion.js";
import { formatearMonto } from "../utils/texto.js";

const LARGO_VISTA_PREVIA = 80;

const nombre = (usuario) => `${usuario.nombre} ${usuario.apellido}`;
const recortar = (texto) =>
  texto.length > LARGO_VISTA_PREVIA ? `${texto.slice(0, LARGO_VISTA_PREVIA - 1)}…` : texto;

// D-32: crea y consulta las notificaciones. Los demás services le avisan qué pasó y este arma el texto.
export class NotificacionService {
  constructor(notificacionRepository, reloj) {
    this.notificacionRepository = notificacionRepository;
    this.reloj = reloj;
  }

  // ---------- Consultas del usuario ----------
  async listar(usuario, { estado, page, limit }) {
    const notificaciones = await this.notificacionRepository.findByUsuario(usuario.id, estado);
    const pagina = paginar(notificaciones, page, limit);
    return {
      noLeidas: await this.notificacionRepository.contarNoLeidas(usuario.id),
      ...pagina,
      data: pagina.data.map(notificacionDTO),
    };
  }

  async resumen(usuario) {
    return { noLeidas: await this.notificacionRepository.contarNoLeidas(usuario.id) };
  }

  async marcarLeida(id, usuario) {
    const notificacion = await this.notificacionRepository.findById(id);
    if (!notificacion) {
      throw new NotFoundError(`No existe la notificación con id ${id}`);
    }
    if (!notificacion.esDe(usuario)) {
      throw new ForbiddenError("La notificación es de otro usuario");
    }
    notificacion.marcarComoLeida();
    await this.notificacionRepository.save(notificacion);
    return notificacionDTO(notificacion);
  }

  async marcarTodasLeidas(usuario) {
    const noLeidas = await this.notificacionRepository.findByUsuario(usuario.id);
    for (const notificacion of noLeidas.filter((n) => !n.estaLeida())) {
      notificacion.marcarComoLeida();
      await this.notificacionRepository.save(notificacion);
    }
  }

  // Al abrir un chat, sus avisos de mensajes nuevos dejan de estar pendientes
  async marcarLeidasPorLink(usuario, link) {
    const propias = await this.notificacionRepository.findByUsuario(usuario.id);
    for (const notificacion of propias.filter((n) => n.link === link && !n.estaLeida())) {
      notificacion.marcarComoLeida();
      await this.notificacionRepository.save(notificacion);
    }
  }

  // ---------- Avisos desde los demás services ----------
  async compraPagada(compra) {
    await this.notificar({
      usuario: compra.evento.organizador,
      tipo: TipoNotificacion.NUEVA_VENTA,
      titulo: `Nueva venta para ${compra.evento.nombre}`,
      mensaje: `${nombre(compra.comprador)} pagó ${compra.cantidad} × ${compra.tipoEntrada.nombre} (${formatearMonto(compra.total)}).`,
      link: `/compra/${compra.id}`,
    });
  }

  async compraCanceladaPorComprador(compra) {
    await this.notificar({
      usuario: compra.evento.organizador,
      tipo: TipoNotificacion.COMPRA_CANCELADA,
      titulo: `Cancelaron una compra de ${compra.evento.nombre}`,
      mensaje: `${nombre(compra.comprador)} canceló ${compra.cantidad} × ${compra.tipoEntrada.nombre}. El cupo volvió a estar disponible.`,
      link: `/compra/${compra.id}`,
    });
  }

  async reservaVencida(compra) {
    await this.notificar({
      usuario: compra.comprador,
      tipo: TipoNotificacion.RESERVA_VENCIDA,
      titulo: `Venció tu reserva para ${compra.evento.nombre}`,
      mensaje: `No se pagó a tiempo: liberamos las ${compra.cantidad} entradas. Si todavía querés ir, volvé a comprarlas.`,
      link: `/evento/${compra.evento.id}`,
    });
  }

  async entradaUtilizada(compra) {
    await this.notificar({
      usuario: compra.comprador,
      tipo: TipoNotificacion.ENTRADA_UTILIZADA,
      titulo: `¡Que disfrutes ${compra.evento.nombre}!`,
      mensaje: "Validaron tu entrada. Después contanos qué te pareció calificando el evento.",
      link: `/compra/${compra.id}`,
    });
  }

  async eventoCancelado(evento, compras) {
    for (const compra of compras) {
      await this.notificar({
        usuario: compra.comprador,
        tipo: TipoNotificacion.EVENTO_CANCELADO,
        titulo: `Se canceló ${evento.nombre}`,
        mensaje: `Motivo: ${evento.motivoCancelacion}. ${
          compra.estado === "REEMBOLSADA"
            ? `Te devolvimos ${formatearMonto(compra.total)}.`
            : "Tu compra quedó cancelada sin cargo."
        }`,
        link: `/compra/${compra.id}`,
      });
    }
  }

  async mensajeNuevo(compra, autor, texto) {
    const destinatario = compra.esDelComprador(autor)
      ? compra.evento.organizador
      : compra.comprador;
    await this.notificar({
      usuario: destinatario,
      tipo: TipoNotificacion.NUEVO_MENSAJE,
      titulo: `Mensaje de ${nombre(autor)}`,
      mensaje: `${compra.evento.nombre}: “${recortar(texto)}”`,
      link: `/compra/${compra.id}/chat`,
    });
  }

  async reseniaRecibida(resenia) {
    await this.notificar({
      usuario: resenia.evento.organizador,
      tipo: TipoNotificacion.NUEVA_RESENIA,
      titulo: `Nueva reseña: ${"★".repeat(resenia.puntuacion)}`,
      mensaje: `${nombre(resenia.comprador)} calificó ${resenia.evento.nombre}: “${recortar(resenia.detalle)}”`,
      link: `/evento/${resenia.evento.id}/resenias`,
    });
  }

  async notificar(datos) {
    const fecha = this.reloj.ahora();
    const pendientes = await this.notificacionRepository.findByUsuario(datos.usuario.id);
    const agrupable = pendientes.find((notificacion) => notificacion.agrupaCon(datos));
    if (agrupable) {
      agrupable.agrupar({ ...datos, fecha });
      return this.notificacionRepository.save(agrupable);
    }
    return this.notificacionRepository.save(new Notificacion({ ...datos, fecha }));
  }
}

// Para los tests unitarios de los services que no prueban notificaciones
export const SIN_NOTIFICACIONES = new Proxy({}, { get: () => async () => {} });
