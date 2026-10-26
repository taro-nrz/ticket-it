import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ValidationError } from "../error/appError.js";

export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;

// D-42: se reconoce el tipo por los primeros bytes del archivo ("firma"), no por la extensión ni por el
// Content-Type que manda el cliente: un .png que en realidad es un script no pasa.
const FIRMAS = [
  {
    tipo: "image/jpeg",
    extension: "jpg",
    es: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    tipo: "image/png",
    extension: "png",
    es: (b) =>
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    tipo: "image/webp",
    extension: "webp",
    es: (b) =>
      b.subarray(0, 4).toString("latin1") === "RIFF" &&
      b.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

export function tipoDeImagen(buffer) {
  return FIRMAS.find((firma) => buffer.length >= 12 && firma.es(buffer)) ?? null;
}

// Guarda las imágenes en una carpeta que sirve el backend en /uploads
export class ArchivoService {
  constructor(directorio) {
    this.directorio = directorio;
  }

  async guardarImagen(archivo, urlBase) {
    if (!archivo) {
      throw new ValidationError("Datos de validación inválidos", [
        { campo: "imagen", mensaje: "Elegí una imagen para subir" },
      ]);
    }
    const tipo = tipoDeImagen(archivo.buffer);
    if (!tipo) {
      throw new ValidationError("Datos de validación inválidos", [
        { campo: "imagen", mensaje: "La imagen tiene que ser JPG, PNG o WebP" },
      ]);
    }
    await mkdir(this.directorio, { recursive: true });
    const nombre = `${randomUUID()}.${tipo.extension}`;
    await writeFile(path.join(this.directorio, nombre), archivo.buffer);
    return { url: `${urlBase}/uploads/${nombre}`, tipo: tipo.tipo, bytes: archivo.size };
  }
}
