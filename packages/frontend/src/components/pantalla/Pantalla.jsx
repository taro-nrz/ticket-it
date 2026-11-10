import Head from "expo-router/head";
import { ScrollView, StyleSheet } from "react-native";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio } from "../../theme.js";

// Contenedor con scroll y ancho máximo (en web no se estira a toda la pantalla)
export function Pantalla({ children, scroll = true, style }) {
  const { colores } = useTema();
  if (!scroll) return children;
  return (
    <ScrollView
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={[estilosPantalla.contenido, style]}
    >
      {children}
    </ScrollView>
  );
}

export const estilosPantalla = StyleSheet.create({
  contenido: {
    padding: espacio.xl,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  ancho: { width: "100%", maxWidth: 720, alignSelf: "center" },
});

// WCAG 2.4.2: cada pantalla tiene su propio título de página (en web, la pestaña del navegador)
export function TituloPagina({ titulo }) {
  return (
    <Head>
      <title>{`${titulo} · AI Ticket It`}</title>
    </Head>
  );
}
