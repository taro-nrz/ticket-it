// El "ahora" se inyecta en los services para que las reglas con fechas
// (días que faltan, evento ya realizado) sean testeables de forma determinista.
export class RelojSistema {
  ahora() {
    return new Date();
  }
}

export class RelojFijo {
  constructor(fecha) {
    this.fecha = new Date(fecha);
  }

  ahora() {
    return new Date(this.fecha);
  }
}

const MS_POR_DIA = 1000 * 60 * 60 * 24;

export function inicioDelDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

// Diferencia en días calendario (0 si es el mismo día, negativo si ya pasó)
export function diasCalendarioEntre(desde, hasta) {
  return Math.round((inicioDelDia(hasta) - inicioDelDia(desde)) / MS_POR_DIA);
}

export function sumarDias(fecha, dias) {
  return new Date(fecha.getTime() + dias * MS_POR_DIA);
}

export function sumarHoras(fecha, horas) {
  return new Date(fecha.getTime() + horas * 60 * 60 * 1000);
}
