import { Platform } from "react-native";
import { cliente, datos } from "./api.js";

// ---------- IMÁGENES (D-42) ----------
// Sube una foto elegida con expo-image-picker; `onProgreso` recibe de 0 a 1 mientras se envía
export async function subirImagen(foto, onProgreso) {
  const formulario = new FormData();
  const nombre = foto.fileName ?? "foto.jpg";
  if (Platform.OS === "web") {
    const archivo = foto.file ?? (await (await fetch(foto.uri)).blob());
    formulario.append("imagen", archivo, nombre);
  } else {
    formulario.append("imagen", {
      uri: foto.uri,
      name: nombre,
      type: foto.mimeType ?? "image/jpeg",
    });
  }
  return datos(
    cliente.post("/archivos/imagenes", formulario, {
      // En web el navegador arma el multipart con su boundary; en el celular hay que indicarlo
      headers: Platform.OS === "web" ? {} : { "Content-Type": "multipart/form-data" },
      timeout: 60_000,
      onUploadProgress: (evento) => evento.total && onProgreso?.(evento.loaded / evento.total),
    }),
  );
}
