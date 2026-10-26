import { BusinessRuleError, ConflictError, NotFoundError } from "../error/appError.js";
import {
  EstadoEspera,
  InscripcionEspera,
  MINUTOS_PRIORIDAD,
} from "../models/entities/inscripcionEspera.js";
import { SIN_NOTIFICACIONES } from "./notificacionService.js";

// D-40: lista de espera por tipo de entrada. Cuando se libera cupo, se avisa al primero de la cola y se le
// retienen las entradas durante 30 minutos; si no compra, pasa al siguiente. Nunca se compra sin su acción.
export class ListaEsperaService {
  constructor(
    inscripcionRepository,
    eventoRepository,
    reloj,
    notificaciones = SIN_NOTIFICACIONES,
    { minutosPrioridad = MINUTOS_PRIORIDAD } = {},
  ) {
    this.inscripcionRepository = inscripcionRepository;
    this.eventoRepository = eventoRepository;
    this.reloj = reloj;
    this.notificaciones = notificaciones;
    this.minutosPrioridad = minutosPrioridad;
  }

  async inscribir(eventoId, usuario, { tipoEntradaId, cantidad }) {
    const ahora = this.reloj.ahora();
    const { evento, tipo } = await this.eventoYTipo(eventoId, tipoEntradaId);
    if (evento.cancelado || evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("El evento ya no vende entradas");
    }
    if (tipo.hayCupoPara(cantidad)) {
      throw new BusinessRuleError(
        `Todavía hay ${tipo.disponibles()} entradas disponibles de "${tipo.nombre}": podés comprarlas`,
      );
    }
    if (await this.inscripcionRepository.activaDe(usuario.id, evento.id, tipo.id)) {
      throw new ConflictError(`Ya estás en la lista de espera de "${tipo.nombre}"`);
    }
    const inscripcion = await this.inscripcionRepository.save(
      new InscripcionEspera({ usuario, evento, tipoEntrada: tipo, cantidad, fecha: ahora }),
    );
    return this.aDTO(inscripcion);
  }

  async retirarse(eventoId, usuario, tipoEntradaId) {
    const inscripcion = await this.inscripcionRepository.activaDe(
      usuario.id,
      eventoId,
      tipoEntradaId,
    );
    if (!inscripcion) {
      throw new NotFoundError("No estás en la lista de espera de ese tipo de entrada");
    }
    const estabaAvisada = inscripcion.estado === EstadoEspera.AVISADA;
    inscripcion.terminar(EstadoEspera.RETIRADA);
    await this.inscripcionRepository.save(inscripcion);
    if (estabaAvisada) await this.cupoLiberado(inscripcion.evento, inscripcion.tipoEntrada);
  }

  // Se llama cuando vuelve a haber cupo (cancelación, reserva vencida, más cupo al editar el evento).
  // Orden estricto de llegada: si el primero pide más entradas de las que hay, espera (no se lo saltea).
  async cupoLiberado(evento, tipo) {
    const ahora = this.reloj.ahora();
    const cola = await this.inscripcionRepository.colaDe(evento.id, tipo.id);
    for (const inscripcion of cola) {
      if (inscripcion.estado === EstadoEspera.AVISADA) continue;
      if (tipo.disponibles() < inscripcion.cantidad) break;
      inscripcion.avisar(ahora, this.minutosPrioridad);
      await this.inscripcionRepository.save(inscripcion);
      await this.notificaciones.lugarDisponible(inscripcion);
    }
    await this.eventoRepository.save(evento);
  }

  // Mantenimiento (antes de cada request): las prioridades vencidas sueltan el cupo y pasa el siguiente
  async expirarPrioridades() {
    const ahora = this.reloj.ahora();
    const vencidas = (await this.inscripcionRepository.avisadas()).filter((i) =>
      i.prioridadVencida(ahora),
    );
    for (const inscripcion of vencidas) {
      inscripcion.terminar(EstadoEspera.EXPIRADA);
      await this.inscripcionRepository.save(inscripcion);
      await this.notificaciones.prioridadVencida(inscripcion);
      await this.cupoLiberado(inscripcion.evento, inscripcion.tipoEntrada);
    }
  }

  async prioridadDe(usuario, evento, tipo) {
    const inscripcion = await this.inscripcionRepository.activaDe(usuario.id, evento.id, tipo.id);
    return inscripcion?.estado === EstadoEspera.AVISADA ? inscripcion : null;
  }

  // Al comprar: si la persona tenía prioridad para ese tipo, se suelta su retención para que la use
  async usarPrioridad(usuario, evento, tipo) {
    const inscripcion = await this.inscripcionRepository.activaDe(usuario.id, evento.id, tipo.id);
    if (inscripcion?.estado !== EstadoEspera.AVISADA) return null;
    inscripcion.terminar(EstadoEspera.CONVERTIDA);
    await this.inscripcionRepository.save(inscripcion);
    return inscripcion;
  }

  // Si se cancela el evento, la lista de espera se cierra
  async cerrarListas(evento) {
    for (const inscripcion of await this.inscripcionRepository.activasDeEvento(evento.id)) {
      inscripcion.terminar(EstadoEspera.RETIRADA);
      await this.inscripcionRepository.save(inscripcion);
    }
  }

  // Para el detalle del evento: cuántos esperan por tipo y la situación de quien mira
  async resumen(evento, usuario) {
    const activas = await this.inscripcionRepository.activasDeEvento(evento.id);
    const enEspera = Object.fromEntries(
      evento.tiposEntrada.map((tipo) => [
        tipo.id,
        activas.filter((i) => i.tipoEntrada.id === tipo.id).length,
      ]),
    );
    const mias = usuario
      ? activas.filter((i) => i.esDe(usuario)).map((i) => this.aDTO(i, activas))
      : [];
    return { enEspera, mias };
  }

  aDTO(inscripcion, activas = null) {
    const cola = (activas ?? [])
      .filter(
        (i) =>
          i.tipoEntrada.id === inscripcion.tipoEntrada.id && i.estado === EstadoEspera.ESPERANDO,
      )
      .map((i) => i.id);
    return {
      id: inscripcion.id,
      tipoEntradaId: inscripcion.tipoEntrada.id,
      tipoEntrada: inscripcion.tipoEntrada.nombre,
      cantidad: inscripcion.cantidad,
      estado: inscripcion.estado,
      fecha: inscripcion.fecha,
      prioridadHasta: inscripcion.prioridadHasta,
      posicion:
        inscripcion.estado === EstadoEspera.ESPERANDO && activas
          ? cola.indexOf(inscripcion.id) + 1
          : null,
    };
  }

  async eventoYTipo(eventoId, tipoEntradaId) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    const tipo = evento.buscarTipoEntrada(tipoEntradaId);
    if (!tipo)
      throw new NotFoundError(`El evento no tiene un tipo de entrada con id ${tipoEntradaId}`);
    return { evento, tipo };
  }
}

// Para services y tests que no usan la lista de espera
export const SIN_LISTA_ESPERA = new Proxy({}, { get: () => async () => null });
