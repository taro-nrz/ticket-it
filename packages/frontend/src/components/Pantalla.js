import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import Head from "expo-router/head";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEstilos } from "../hooks/useEstilos.js";
import { useSesion } from "../store/SesionContext.js";
import { PREFERENCIAS, useTema } from "../store/TemaContext.js";
import { espacio, fuentes } from "../theme.js";
import { anunciar, etiquetaMobile } from "../utils/accesibilidad.js";
import { avisarExito, confirmar } from "../utils/confirmar.js";
import { Icono } from "./Icono.js";
import { ModalAccesible } from "./ModalAccesible.js";
import { Avatar, Boton, Titulo } from "./ui.js";

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

// Encabezado grande de las pantallas principales (tabs): saludo, título <h1>, tema y cuenta
export function Encabezado({ saludo, titulo, oscuro = false, derecha, children }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilosEncabezado);
  const { top } = useSafeAreaInsets();
  return (
    <View
      role="banner"
      style={[
        styles.contenedor,
        { paddingTop: top + 18 },
        oscuro && { backgroundColor: colores.panel },
      ]}
    >
      <TituloPagina titulo={titulo} />
      <View style={[estilosPantalla.ancho, { gap: espacio.l }]}>
        <View style={styles.fila}>
          <View style={{ flex: 1 }}>
            {saludo && (
              <Text style={[texto.secundario, oscuro && { color: colores.sobrePanelSuave }]}>
                {saludo}
              </Text>
            )}
            <Titulo nivel={1} style={[texto.tituloGrande, oscuro && { color: colores.sobrePanel }]}>
              {titulo}
            </Titulo>
          </View>
          {derecha}
          <BotonCuenta claro={oscuro} />
        </View>
        {children}
      </View>
    </View>
  );
}

const crearEstilosEncabezado = ({ colores }) => ({
  contenedor: { backgroundColor: colores.fondo, paddingHorizontal: espacio.xl, paddingBottom: 14 },
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
});

// Cabecera de las pantallas de detalle (con botón para volver y título <h1>)
export function BarraVolver({ titulo, subtitulo, oscuro = false, derecha }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilosBarra);
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const colorTexto = oscuro ? colores.sobrePanel : colores.texto;
  return (
    <View
      role="banner"
      style={[
        styles.contenedor,
        { paddingTop: top + 8 },
        oscuro ? { backgroundColor: colores.panel } : styles.clara,
      ]}
    >
      <TituloPagina titulo={titulo} />
      <View style={[estilosPantalla.ancho, styles.fila]}>
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.volver}
        >
          <Icono name="chevron-back" size={24} color={colorTexto} />
        </Pressable>
        <View style={{ flex: 1 }}>
          {subtitulo && (
            <Text style={[texto.chico, oscuro && { color: colores.sobrePanelSuave }]}>
              {subtitulo}
            </Text>
          )}
          <Titulo nivel={1} numberOfLines={1} style={[styles.titulo, { color: colorTexto }]}>
            {titulo}
          </Titulo>
        </View>
        {derecha}
      </View>
    </View>
  );
}

const crearEstilosBarra = ({ colores }) => ({
  contenedor: { paddingHorizontal: espacio.m, paddingBottom: 12 },
  clara: {
    backgroundColor: colores.superficie,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  fila: { flexDirection: "row", alignItems: "center", gap: 6 },
  volver: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  titulo: { fontFamily: fuentes.subtitulo, fontSize: 18 },
});

// Protege las pantallas que necesitan un usuario identificado
export function ConSesion({ children }) {
  const { usuario } = useSesion();
  if (!usuario) return <Redirect href="/login" />;
  return children;
}

const NOMBRE_ROL = { COMPRADOR: "Cuenta de comprador", ORGANIZADOR: "Cuenta de organizador" };

// D-23: "Cuenta" es un botón con texto visible que abre un menú con el tema y "Cerrar sesión" explícito
export function BotonCuenta({ claro = false }) {
  const { usuario, cerrarSesion } = useSesion();
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilosCuenta);
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);

  if (!usuario) return null;
  const nombre = `${usuario.nombre} ${usuario.apellido}`;

  const salir = async () => {
    setAbierto(false);
    const confirmado = await confirmar({
      titulo: "¿Cerrar sesión?",
      mensaje: `Vas a salir de la cuenta de ${nombre}. Para volver, ingresá con tu email y contraseña.`,
      textoConfirmar: "Sí, cerrar sesión",
      textoCancelar: "Seguir en mi cuenta",
      peligro: true,
    });
    if (confirmado) {
      await cerrarSesion();
      router.replace("/login");
      avisarExito("Cerraste sesión");
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setAbierto(true)}
        accessibilityRole="button"
        aria-haspopup="dialog"
        accessibilityHint="Abre tu perfil, el tema y la opción para cerrar sesión"
        {...etiquetaMobile(`Cuenta de ${nombre}`)}
        style={[styles.boton, claro && styles.botonClaro]}
      >
        <Avatar usuario={usuario} tamanio={30} claro={claro} />
        <Text style={[styles.botonTexto, claro && { color: colores.sobrePanel }]}>Cuenta</Text>
        <Icono name="chevron-down" size={16} color={claro ? colores.sobrePanel : colores.texto} />
      </Pressable>

      <ModalAccesible
        visible={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Tu cuenta"
        posicion="abajo"
      >
        <View style={styles.usuario}>
          <Avatar usuario={usuario} tamanio={52} />
          <View style={{ flex: 1 }}>
            <Text style={[texto.cuerpoFuerte, { fontSize: 17 }]}>{nombre}</Text>
            <Text style={texto.secundario}>{NOMBRE_ROL[usuario.rol]}</Text>
            {usuario.email && <Text style={texto.chico}>{usuario.email}</Text>}
          </View>
        </View>
        <Boton
          titulo="Mi perfil"
          icono="person-outline"
          variante="secundario"
          accessibilityHint="Editar tus datos y cambiar la contraseña"
          onPress={() => {
            setAbierto(false);
            router.push("/perfil");
          }}
        />
        <SelectorTema />
        <View style={styles.separador} />
        <Boton
          titulo="Cerrar sesión"
          icono="log-out-outline"
          variante="peligro"
          accessibilityHint="Pide confirmación antes de salir"
          onPress={salir}
        />
        <Boton titulo="Volver" variante="secundario" onPress={() => setAbierto(false)} />
      </ModalAccesible>
    </>
  );
}

const crearEstilosCuenta = ({ colores }) => ({
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    paddingLeft: 7,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.superficie,
  },
  botonClaro: { backgroundColor: "transparent", borderColor: colores.sobrePanelSuave },
  botonTexto: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  usuario: { flexDirection: "row", alignItems: "center", gap: espacio.m },
  separador: { height: 1, backgroundColor: colores.borde },
});

const OPCIONES_TEMA = [
  { valor: "sistema", texto: "Sistema", icono: "contrast-outline" },
  { valor: "claro", texto: "Claro", icono: "sunny-outline" },
  { valor: "oscuro", texto: "Oscuro", icono: "moon-outline" },
];

// Selector de tema con texto visible y semántica de radio (una sola opción elegida)
export function SelectorTema() {
  const { colores, texto, preferencia, setPreferencia } = useTema();
  const styles = useEstilos(crearEstilosSelector);
  return (
    <View style={{ gap: espacio.s }}>
      <Text style={texto.etiqueta} nativeID="etiqueta-tema">
        Tema
      </Text>
      <View
        style={styles.opciones}
        role="radiogroup"
        aria-labelledby="etiqueta-tema"
        accessibilityRole="radiogroup"
        accessibilityLabel="Tema"
      >
        {OPCIONES_TEMA.map((opcion) => {
          const activa = preferencia === opcion.valor;
          return (
            <Pressable
              key={opcion.valor}
              onPress={() => {
                setPreferencia(opcion.valor);
                anunciar(`Tema ${opcion.texto}`);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: activa }}
              aria-checked={activa}
              style={[styles.opcion, activa && styles.opcionActiva]}
            >
              <Icono
                name={opcion.icono}
                size={18}
                color={activa ? colores.sobrePrimario : colores.texto}
              />
              <Text style={[styles.opcionTexto, activa && styles.opcionTextoActiva]}>
                {opcion.texto}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={texto.chico}>"Sistema" usa la configuración de tu dispositivo.</Text>
    </View>
  );
}

const crearEstilosSelector = ({ colores }) => ({
  opciones: { flexDirection: "row", gap: espacio.s },
  opcion: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colores.bordeControl,
  },
  opcionActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  opcionTexto: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  opcionTextoActiva: { color: colores.sobrePrimario, fontFamily: fuentes.negrita },
});

const INFO_PREFERENCIA = {
  sistema: { icono: "contrast-outline", etiqueta: "como el sistema" },
  claro: { icono: "sunny-outline", etiqueta: "claro" },
  oscuro: { icono: "moon-outline", etiqueta: "oscuro" },
};

// D-22: cambia el tema recorriendo Sistema → Claro → Oscuro. El nombre dice el tema actual y el siguiente.
export function BotonTema({ sobrePanel = false }) {
  const { colores, preferencia, setPreferencia } = useTema();
  const siguiente = PREFERENCIAS[(PREFERENCIAS.indexOf(preferencia) + 1) % PREFERENCIAS.length];
  const actual = INFO_PREFERENCIA[preferencia];

  const cambiar = () => {
    setPreferencia(siguiente);
    anunciar(`Tema ${INFO_PREFERENCIA[siguiente].etiqueta}`);
  };

  return (
    <Pressable
      onPress={cambiar}
      accessibilityRole="button"
      accessibilityLabel={`Tema: ${actual.etiqueta}. Cambiar a ${INFO_PREFERENCIA[siguiente].etiqueta}`}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: sobrePanel ? colores.sobrePanelSuave : colores.bordeControl,
      }}
    >
      <Icono
        name={actual.icono}
        size={20}
        color={sobrePanel ? colores.sobrePanel : colores.texto}
      />
    </Pressable>
  );
}
