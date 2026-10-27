import { mensajeDTO } from "../dtos/compraDTO.js";
import { SIN_NOTIFICACIONES } from "./notificacionService.js";
import { SIN_TIEMPO_REAL } from "./tiempoRealService.js";

// HU-07 / HU-08: chat de la compra entre comprador y organizador, en cualquier estado
export class MensajeService {
  constructor(
    compraService,
    compraRepository,
    reloj,
    notificaciones = SIN_NOTIFICACIONES,
    tiempoReal = SIN_TIEMPO_REAL,
  ) {
    this.compraService = compraService;
    this.compraRepository = compraRepository;
    this.reloj = reloj;
    this.notificaciones = notificaciones;
    this.tiempoReal = tiempoReal;
  }

  async listar(compraId, usuario, desde) {
    const compra = await this.compraService.obtenerParaParticipante(compraId, usuario);
    return compra.mensajesDesde(desde).map(mensajeDTO);
  }

  // D-26: el front lo llama al abrir el chat (el GET se usa para el sondeo y no modifica nada)
  async marcarLeidos(compraId, usuario) {
    const compra = await this.compraService.obtenerParaParticipante(compraId, usuario);
    compra.marcarMensajesLeidos(usuario, this.reloj.ahora());
    await this.compraRepository.save(compra);
    await this.notificaciones.marcarLeidasPorLink(usuario, `/compra/${compra.id}/chat`);
  }

  async enviar(compraId, usuario, texto) {
    const compra = await this.compraService.obtenerParaParticipante(compraId, usuario);
    const mensaje = compra.agregarMensaje(usuario, texto, this.reloj.ahora());
    await this.compraRepository.save(compra);
    const dto = mensajeDTO(mensaje);
    // D-45: llega al instante a quien tenga el chat abierto (también al otro dispositivo del que escribe)
    this.tiempoReal.mensajeNuevo(compra.id, dto);
    await this.notificaciones.mensajeNuevo(compra, usuario, texto);
    return dto;
  }
}
