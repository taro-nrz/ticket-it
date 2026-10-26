// D-37: pasarela de pago SIMULADA. Tiene la misma forma que tendría una real (cobrar → aprobado o rechazado):
// cambiar a Mercado Pago o Stripe sería otra clase con el mismo método, sin tocar CompraService.
// Nunca se guarda el número completo ni el CVV: sólo la marca y los últimos 4 dígitos.

// Tarjetas de prueba (como las de los entornos sandbox de las pasarelas reales)
export const TARJETAS_DE_PRUEBA = Object.freeze({
  APROBADA: "4242424242424242",
  FONDOS_INSUFICIENTES: "4000000000000002",
  ERROR_DE_PROCESAMIENTO: "4000000000000119",
});

const RECHAZOS = {
  [TARJETAS_DE_PRUEBA.FONDOS_INSUFICIENTES]: "la tarjeta no tiene fondos suficientes",
  [TARJETAS_DE_PRUEBA.ERROR_DE_PROCESAMIENTO]: "hubo un error al procesar el pago, probá de nuevo",
};

export function marcaDeTarjeta(numero) {
  if (/^4/.test(numero)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(numero)) return "Mastercard";
  if (/^3[47]/.test(numero)) return "American Express";
  return "Tarjeta";
}

// Algoritmo de Luhn: detecta errores de tipeo en el número de tarjeta
export function numeroDeTarjetaValido(numero) {
  if (!/^\d{13,19}$/.test(numero)) return false;
  let suma = 0;
  [...numero].reverse().forEach((caracter, indice) => {
    let digito = Number(caracter);
    if (indice % 2 === 1) {
      digito *= 2;
      if (digito > 9) digito -= 9;
    }
    suma += digito;
  });
  return suma % 10 === 0;
}

export class PasarelaPagoSimulada {
  async cobrar({ tarjeta, monto }) {
    const marca = marcaDeTarjeta(tarjeta.numero);
    const ultimos4 = tarjeta.numero.slice(-4);
    const motivo = RECHAZOS[tarjeta.numero];
    if (motivo) {
      return { aprobado: false, motivo, marca, ultimos4 };
    }
    return {
      aprobado: true,
      marca,
      ultimos4,
      monto,
      autorizacion: `SIM-${Date.now().toString(36)}`,
    };
  }
}
