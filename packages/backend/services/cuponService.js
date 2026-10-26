import { cuponDTO } from "../dtos/cuponDTO.js";
import { BusinessRuleError, ConflictError, NotFoundError } from "../error/appError.js";
import { crearCupon } from "../models/entities/cupon.js";

// D-38: el organizador administra los cupones de sus eventos; el comprador los aplica al comprar
export class CuponService {
  constructor(cuponRepository, eventoService, reloj) {
    this.cuponRepository = cuponRepository;
    this.eventoService = eventoService;
    this.reloj = reloj;
  }

  async listar(eventoId, organizador) {
    const evento = await this.eventoService.obtenerPropio(eventoId, organizador);
    const cupones = await this.cuponRepository.findByEvento(evento.id);
    return cupones.map((cupon) => cuponDTO(cupon, this.reloj.ahora()));
  }

  async crear(eventoId, datos, organizador) {
    const ahora = this.reloj.ahora();
    const evento = await this.eventoService.obtenerPropio(eventoId, organizador);
    if (!evento.puedeEditarse(ahora)) {
      throw new BusinessRuleError("Sólo se crean cupones para eventos vigentes");
    }
    if (await this.cuponRepository.findByCodigoYEvento(datos.codigo, evento.id)) {
      throw new ConflictError(`Ya existe el cupón ${datos.codigo.toUpperCase()} en este evento`);
    }
    if (datos.vence && datos.vence <= ahora) {
      throw new BusinessRuleError("La fecha de vencimiento del cupón tiene que ser futura");
    }
    const cupon = await this.cuponRepository.save(crearCupon({ ...datos, evento }));
    return cuponDTO(cupon, ahora);
  }

  async desactivar(eventoId, cuponId, organizador) {
    const evento = await this.eventoService.obtenerPropio(eventoId, organizador);
    const cupon = await this.cuponRepository.findById(cuponId);
    if (!cupon || cupon.evento.id !== evento.id) {
      throw new NotFoundError(`El evento no tiene un cupón con id ${cuponId}`);
    }
    cupon.desactivar();
    await this.cuponRepository.save(cupon);
    return cuponDTO(cupon, this.reloj.ahora());
  }

  // Para comprar: el cupón del evento con ese código (404 si no existe)
  async buscar(eventoId, codigo) {
    const cupon = await this.cuponRepository.findByCodigoYEvento(codigo, eventoId);
    if (!cupon) {
      throw new NotFoundError("Ese cupón no existe para este evento");
    }
    return cupon;
  }

  // Vista previa del descuento antes de comprar
  async validar(eventoId, { codigo, tipoEntradaId, cantidad }) {
    const evento = await this.eventoService.obtenerEntidad(eventoId);
    const tipo = evento.buscarTipoEntrada(tipoEntradaId);
    if (!tipo) {
      throw new NotFoundError(`El evento no tiene un tipo de entrada con id ${tipoEntradaId}`);
    }
    const cupon = await this.buscar(evento.id, codigo);
    const precio = cupon.aplicar(tipo.precio, cantidad, this.reloj.ahora());
    return { cupon: { codigo: cupon.codigo, descripcion: cupon.descripcion() }, ...precio };
  }
}
