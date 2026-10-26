// D-40: lista de espera de un tipo de entrada agotado
export const EstadoEspera = Object.freeze({
  ESPERANDO: "ESPERANDO",
  // Se liberó cupo: tiene prioridad (cupo retenido) por un tiempo para comprar
  AVISADA: "AVISADA",
  CONVERTIDA: "CONVERTIDA",
  EXPIRADA: "EXPIRADA",
  RETIRADA: "RETIRADA",
});

export const MINUTOS_PRIORIDAD = 30;

export class InscripcionEspera {
  id;
  estado = EstadoEspera.ESPERANDO;
  prioridadHasta = null;

  constructor({ usuario, evento, tipoEntrada, cantidad, fecha }) {
    this.usuario = usuario;
    this.evento = evento;
    this.tipoEntrada = tipoEntrada;
    this.cantidad = cantidad;
    this.fecha = new Date(fecha);
  }

  estaActiva() {
    return [EstadoEspera.ESPERANDO, EstadoEspera.AVISADA].includes(this.estado);
  }

  esDe(usuario) {
    return this.usuario.id === usuario.id;
  }

  // Retiene el cupo para esta persona y le da prioridad hasta `ahora + minutos`
  avisar(ahora, minutos = MINUTOS_PRIORIDAD) {
    this.tipoEntrada.retener(this.cantidad);
    this.estado = EstadoEspera.AVISADA;
    this.prioridadHasta = new Date(ahora.getTime() + minutos * 60 * 1000);
  }

  prioridadVencida(ahora) {
    return this.estado === EstadoEspera.AVISADA && ahora >= this.prioridadHasta;
  }

  // Al terminar la prioridad (compró, venció o se retiró) se suelta el cupo retenido
  terminar(estado) {
    if (this.estado === EstadoEspera.AVISADA) {
      this.tipoEntrada.soltar(this.cantidad);
    }
    this.estado = estado;
  }
}
