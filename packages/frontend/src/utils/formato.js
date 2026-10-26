export function formatearPrecio(valor) {
  if (valor === 0) return "Gratis";
  return `$ ${Number(valor).toLocaleString("es-AR")}`;
}

export function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = fecha.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const hora = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dia} · ${hora} hs`;
}

export function formatearHora(fechaISO) {
  return new Date(fechaISO).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatearDiasRestantes(dias) {
  if (dias === 0) return "¡Es hoy!";
  if (dias === 1) return "Falta 1 día";
  return `Faltan ${dias} días`;
}

export function nombreCompleto(usuario) {
  return `${usuario.nombre} ${usuario.apellido}`;
}

export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}

// D-26: "1 mensaje sin leer" / "3 mensajes sin leer"
export function textoSinLeer(cantidad) {
  return `${plural(cantidad, "mensaje")} sin leer`;
}

// Montos de dinero (a diferencia de un precio, 0 no es "Gratis")
export function formatearMonto(valor) {
  return `$ ${Number(valor).toLocaleString("es-AR")}`;
}

// Monto abreviado para métricas: $ 209k, $ 1,2M
export function formatearMontoCompacto(valor) {
  if (valor >= 1_000_000)
    return `$ ${(valor / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
  if (valor >= 1_000) return `$ ${Math.round(valor / 1_000)}k`;
  return formatearMonto(valor);
}

// Fecha y hora completas para el nombre accesible ("domingo 15 de noviembre, 21:00 hs")
export function fechaParaLector(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = fecha.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const hora = fecha.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${dia}, ${hora} hs`;
}

// D-32: "hace 5 minutos", "ayer", "hace 3 días"
const relativo = new Intl.RelativeTimeFormat("es-AR", { numeric: "auto" });
export function formatearHace(fecha, ahora = new Date()) {
  const segundos = Math.round((new Date(fecha) - ahora) / 1000);
  const unidades = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];
  for (const [unidad, duracion] of unidades) {
    if (Math.abs(segundos) >= duracion)
      return relativo.format(Math.round(segundos / duracion), unidad);
  }
  return "recién";
}
