import { cambioEstadoDTO, compraDTO } from "../dtos/compraDTO.js";
import { eventoReferenciaDTO, tipoEntradaDTO } from "../dtos/eventoDTO.js";
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../error/appError.js";
import { Compra } from "../models/entities/compra.js";
import { EstadoCompra } from "../models/entities/estadoCompra.js";
import { ordenarProximosPrimero } from "../utils/orden.js";
import { paginar } from "../utils/paginacion.js";
import { SIN_NOTIFICACIONES } from "./notificacionService.js";
import { generarCodigoEntrada, normalizarCodigoEntrada } from "../utils/codigo.js";

export class CompraService {
  constructor(
    compraRepository,
    eventoRepository,
    reseniaRepository,
    reloj,
    config,
    notificaciones = SIN_NOTIFICACIONES,
  ) {
    this.compraRepository = compraRepository;
    this.eventoRepository = eventoRepository;
    this.reseniaRepository = reseniaRepository;
    this.reloj = reloj;
    this.maxEntradasPorCompra = config.maxEntradasPorCompra;
    this.notificaciones = notificaciones;
  }

  // HU-04: comprar un tipo de entrada sin superar el cupo
  async comprar(comprador, { eventoId, tipoEntradaId, cantidad }) {
    const ahora = this.reloj.ahora();
    if (cantidad > this.maxEntradasPorCompra) {
      throw new ValidationError("Datos de validación inválidos", [
        {
          campo: "cantidad",
          mensaje: `Se pueden comprar como máximo ${this.maxEntradasPorCompra} entradas por compra`,
        },
      ]);
    }
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    }
    if (evento.cancelado) {
      throw new BusinessRuleError("El evento fue cancelado: ya no se venden entradas");
    }
    if (evento.yaSeRealizo(ahora)) {
      throw new BusinessRuleError("No se pueden comprar entradas de un evento que ya se realizó");
    }
    const tipoEntrada = evento.buscarTipoEntrada(tipoEntradaId);
    if (!tipoEntrada) {
      throw new NotFoundError(
        `El evento ${eventoId} no tiene un tipo de entrada con id ${tipoEntradaId}`,
      );
    }

    tipoEntrada.reservar(cantidad);
    const compra = new Compra(comprador, evento, tipoEntrada, cantidad, ahora);
    await this.eventoRepository.save(evento);
    const guardada = await this.compraRepository.save(compra);
    return this.aDTO(guardada, comprador, { conDetalle: true });
  }

  // HU-05: compras del comprador con estado, días restantes y acciones
  async misCompras(comprador, { estado, page, limit }) {
    const ahora = this.reloj.ahora();
    const compras = await this.compraRepository.findByComprador(comprador.id, estado);
    const ordenadas = ordenarProximosPrimero(compras, (compra) => compra.evento.fecha, ahora);
    const pagina = paginar(ordenadas, page, limit);
    pagina.data = await Promise.all(pagina.data.map((compra) => this.aDTO(compra, comprador)));
    return pagina;
  }

  async detalle(id, usuario) {
    const compra = await this.obtenerParaParticipante(id, usuario);
    return this.aDTO(compra, usuario, { conDetalle: true });
  }

  // HU-06: compras de un evento, disponibilidad por tipo y resumen por estado
  async comprasDeEvento(eventoId, organizador, { estado, page, limit }) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    }
    if (!evento.esOrganizadoPor(organizador)) {
      throw new ForbiddenError("Sólo el organizador del evento puede ver sus compras");
    }

    const todas = await this.compraRepository.findByEvento(eventoId);
    const resumenPorEstado = Object.fromEntries(
      Object.values(EstadoCompra).map((valor) => [
        valor,
        todas.filter((compra) => compra.estado === valor).length,
      ]),
    );
    const filtradas = estado ? todas.filter((compra) => compra.estado === estado) : todas;
    const masRecientesPrimero = [...filtradas].sort((a, b) => b.fechaCompra - a.fechaCompra);
    const pagina = paginar(masRecientesPrimero, page, limit);

    return {
      evento: eventoReferenciaDTO(evento),
      disponibilidad: evento.tiposEntrada.map(tipoEntradaDTO),
      resumenPorEstado,
      ...pagina,
      data: await Promise.all(pagina.data.map((compra) => this.aDTO(compra, organizador))),
    };
  }

  // R-07: pago simulado (PENDIENTE -> CONFIRMADA)
  async pagar(id, usuario) {
    const compra = await this.obtenerParaParticipante(id, usuario);
    if (!compra.esDelComprador(usuario)) {
      throw new ForbiddenError("Sólo el comprador puede pagar la compra");
    }
    compra.pagar(usuario, this.reloj.ahora(), await this.codigoUnico());
    await this.compraRepository.save(compra);
    await this.notificaciones.compraPagada(compra);
    return this.aDTO(compra, usuario, { conDetalle: true });
  }

  // R-08: el organizador marca la entrada como utilizada (CONFIRMADA -> UTILIZADA)
  async utilizar(id, usuario) {
    const compra = await this.obtenerParaParticipante(id, usuario);
    if (!compra.evento.esOrganizadoPor(usuario)) {
      throw new ForbiddenError(
        "Sólo el organizador del evento puede marcar la entrada como utilizada",
      );
    }
    compra.utilizar(usuario, this.reloj.ahora());
    await this.compraRepository.save(compra);
    await this.notificaciones.entradaUtilizada(compra);
    return this.aDTO(compra, usuario, { conDetalle: true });
  }

  // HU-09 / HU-10: cancelación con reembolso automático si estaba pagada
  async cancelar(id, usuario) {
    const compra = await this.obtenerParaParticipante(id, usuario);
    if (!compra.esDelComprador(usuario)) {
      throw new ForbiddenError("Sólo el comprador puede cancelar la compra");
    }
    compra.cancelar(usuario, this.reloj.ahora());
    await this.eventoRepository.save(compra.evento);
    await this.compraRepository.save(compra);
    await this.notificaciones.compraCanceladaPorComprador(compra);
    return this.aDTO(compra, usuario, { conDetalle: true });
  }

  // D-33: control de acceso en la puerta: el organizador valida la entrada con su código (QR)
  async validarEntrada(eventoId, codigoIngresado, organizador) {
    const evento = await this.eventoRepository.findById(eventoId);
    if (!evento) {
      throw new NotFoundError(`No existe el evento con id ${eventoId}`);
    }
    if (!evento.esOrganizadoPor(organizador)) {
      throw new ForbiddenError("Sólo el organizador del evento puede validar sus entradas");
    }
    const codigo = normalizarCodigoEntrada(codigoIngresado);
    const compra = codigo && (await this.compraRepository.findByCodigo(codigo));
    if (!compra) {
      throw new NotFoundError("No existe ninguna entrada con ese código");
    }
    if (compra.evento.id !== evento.id) {
      throw new BusinessRuleError(`La entrada es de otro evento: ${compra.evento.nombre}`);
    }
    if (compra.estado === EstadoCompra.UTILIZADA) {
      throw new BusinessRuleError(
        `Esta entrada ya se usó (${compra.cantidad} × ${compra.tipoEntrada.nombre} de ${compra.comprador.nombre} ${compra.comprador.apellido})`,
      );
    }
    if (!compra.tieneEntradaVigente()) {
      throw new BusinessRuleError(`La entrada no es válida: la compra está ${compra.estado}`);
    }
    compra.utilizar(organizador, this.reloj.ahora());
    await this.compraRepository.save(compra);
    await this.notificaciones.entradaUtilizada(compra);
    return this.aDTO(compra, organizador, { conDetalle: true });
  }

  async codigoUnico() {
    let codigo;
    do {
      codigo = generarCodigoEntrada();
    } while (await this.compraRepository.findByCodigo(codigo));
    return codigo;
  }

  async historial(id, usuario) {
    const compra = await this.obtenerParaParticipante(id, usuario);
    return compra.historial.map(cambioEstadoDTO);
  }

  // Sólo el comprador de la compra o el organizador del evento pueden acceder a ella
  async obtenerParaParticipante(id, usuario) {
    const compra = await this.compraRepository.findById(id);
    if (!compra) {
      throw new NotFoundError(`No existe la compra con id ${id}`);
    }
    if (!compra.esParticipante(usuario)) {
      throw new ForbiddenError("No participás de esta compra");
    }
    return compra;
  }

  async aDTO(compra, usuario, { conDetalle = false } = {}) {
    const yaResenio = Boolean(
      await this.reseniaRepository.findByCompradorYEvento(compra.comprador.id, compra.evento.id),
    );
    return compraDTO(compra, { usuario, ahora: this.reloj.ahora(), yaResenio, conDetalle });
  }
}
