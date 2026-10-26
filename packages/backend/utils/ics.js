// D-43: evento en formato iCalendar (RFC 5545) para agregarlo al calendario del teléfono o de la computadora

const DURACION_HORAS = 3; // el modelo no tiene hora de fin: se asume una duración típica

// 20261115T000000Z
const fechaIcs = (fecha) =>
  new Date(fecha)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

// En los textos hay que escapar \ ; , y los saltos de línea
const escapar = (texto) =>
  String(texto ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

// Las líneas de más de 75 bytes se parten y la continuación empieza con un espacio
function plegar(linea) {
  const bytes = Buffer.from(linea, "utf8");
  if (bytes.length <= 75) return linea;
  const partes = [];
  let actual = "";
  for (const caracter of linea) {
    const limite = partes.length === 0 ? 75 : 74;
    if (Buffer.byteLength(actual + caracter, "utf8") > limite) {
      partes.push(actual);
      actual = "";
    }
    actual += caracter;
  }
  partes.push(actual);
  return partes.join("\r\n ");
}

export function eventoAIcs(evento, { ahora, urlEvento }) {
  const inicio = new Date(evento.fecha);
  const fin = new Date(inicio.getTime() + DURACION_HORAS * 60 * 60 * 1000);
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AI Ticket It//Eventos//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:evento-${evento.id}@ai-ticket-it`,
    `DTSTAMP:${fechaIcs(ahora)}`,
    `DTSTART:${fechaIcs(inicio)}`,
    `DTEND:${fechaIcs(fin)}`,
    `SUMMARY:${escapar(evento.nombre)}`,
    `DESCRIPTION:${escapar(`${evento.descripcion}\n\nMás información: ${urlEvento}`)}`,
    `LOCATION:${escapar(`${evento.lugar}, ${evento.direccion}`)}`,
    `URL:${urlEvento}`,
    `STATUS:${evento.cancelado ? "CANCELLED" : "CONFIRMED"}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(`En 2 horas: ${evento.nombre}`)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.map(plegar).join("\r\n") + "\r\n";
}

// "Noche Indie en Obras" → "noche-indie-en-obras"
export function nombreDeArchivo(texto) {
  return (
    String(texto)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "evento"
  );
}
