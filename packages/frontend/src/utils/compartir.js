import * as Linking from "expo-linking";
import { Platform, Share } from "react-native";
import { API_URL } from "../api/cliente.js";
import { formatearFecha } from "./formato.js";

// D-43: link a un evento. En web, la dirección de la app; en el celular, el link de la app (ticketit://…)
// o la web pública si se configuró EXPO_PUBLIC_WEB_URL.
export function urlDelEvento(id) {
  if (Platform.OS === "web") return `${window.location.origin}/evento/${id}`;
  if (process.env.EXPO_PUBLIC_WEB_URL) return `${process.env.EXPO_PUBLIC_WEB_URL}/evento/${id}`;
  return Linking.createURL(`/evento/${id}`);
}

// Devuelve "compartido", "copiado" o "cancelado" (la persona cerró la hoja de compartir)
export async function compartirEvento(evento) {
  const url = urlDelEvento(evento.id);
  const texto = `${evento.nombre} · ${formatearFecha(evento.fecha)} en ${evento.lugar}`;
  if (Platform.OS === "web") {
    if (navigator.share) {
      try {
        await navigator.share({ title: evento.nombre, text: texto, url });
        return "compartido";
      } catch (error) {
        if (error.name === "AbortError") return "cancelado";
      }
    }
    // Sin hoja de compartir (la mayoría de los navegadores de escritorio): se copia el enlace
    await navigator.clipboard.writeText(`${texto}\n${url}`);
    return "copiado";
  }
  const resultado = await Share.share({ title: evento.nombre, message: `${texto}\n${url}`, url });
  return resultado.action === Share.dismissedAction ? "cancelado" : "compartido";
}

// Descarga el .ics: el sistema ofrece agregarlo al calendario (Google, Apple, Outlook...)
export async function agregarAlCalendario(evento) {
  const url = `${API_URL}/evento/${evento.id}/calendario.ics`;
  if (Platform.OS === "web") {
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "";
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    return;
  }
  await Linking.openURL(url);
}
