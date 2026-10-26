import { organizadorDTO } from "../dtos/eventoDTO.js";
import { reseniaDTO } from "../dtos/reseniaDTO.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../error/appError.js";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { Resenia } from "../models/entities/resenia.js";
import { paginar } from "../utils/paginacion.js";

export class ReseniaService {
  constructor(reseniaRepository, eventoRepository, compraRepository, usuarioRepository, reloj) {
    this.reseniaRepository = reseniaRepository;
    this.eventoRepository = eventoRepository;
    this.compraRepository = compraRepository;
    this.usuarioRepository = usuarioRepository;
    this.reloj = reloj;
  }

  // HU-11: sólo quien utilizó su entrada puede reseñar el evento, una vez
  async crear(eventoId, comprador, { puntuacion, detalle }) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    }
    const comprasUtilizadas = await this.compraRepository.findByCompradorYEstadoEnEvento(
      comprador.id,
      eventoId,
      EstadoCompra.UTILIZADA,
    );
    if (comprasUtilizadas.length === 0) {
      throw new BusinessRuleError(
        "Sólo podés reseñar un evento si tenés una compra con la entrada utilizada",
      );
    }
    const existente = await this.reseniaRepository.findByCompradorYEvento(comprador.id, eventoId);
    if (existente) {
      throw new ConflictError("Ya reseñaste este evento");
    }

    const resenia = new Resenia(comprador, evento, detalle, puntuacion, this.reloj.ahora());
    const guardada = await this.reseniaRepository.save(resenia);
    return reseniaDTO(guardada);
  }

  async deEvento(eventoId, page, limit) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    }
    const resenias = await this.reseniaRepository.findByEvento(eventoId);
    const reputacion = await this.reseniaRepository.reputacionDeEvento(eventoId);
    const pagina = paginar(resenias, page, limit);
    // D-28: datos del evento y su promedio para la pantalla "Reseñas del evento"
    return {
      evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
      ...reputacion,
      ...pagina,
      data: pagina.data.map(reseniaDTO),
    };
  }

  // HU-12: reseñas de los eventos anteriores de un organizador + su reputación
  async deOrganizador(organizadorId, page, limit) {
    const organizador = await this.usuarioRepository.findById(organizadorId);
    if (!organizador || !organizador.esOrganizador()) {
      throw new NotFoundError(`No existe el organizador con id ${organizadorId}`);
    }
    const reputacion = await this.reseniaRepository.reputacionDeOrganizador(organizadorId);
    const resenias = await this.reseniaRepository.findByOrganizador(organizadorId);
    const pagina = paginar(resenias, page, limit);
    return {
      organizador: organizadorDTO(organizador, reputacion),
      ...pagina,
      data: pagina.data.map(reseniaDTO),
    };
  }
}
