import { mensajeDTO } from "../dtos/compraDTO.js";

// HU-07 / HU-08: chat de la compra entre comprador y organizador, en cualquier estado
export class MensajeService {
  constructor(compraService, compraRepository, reloj) {
    this.compraService = compraService;
    this.compraRepository = compraRepository;
    this.reloj = reloj;
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
  }

  async enviar(compraId, usuario, texto) {
    const compra = await this.compraService.obtenerParaParticipante(compraId, usuario);
    const mensaje = compra.agregarMensaje(usuario, texto, this.reloj.ahora());
    await this.compraRepository.save(compra);
    return mensajeDTO(mensaje);
  }
}
