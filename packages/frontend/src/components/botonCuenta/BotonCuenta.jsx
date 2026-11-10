import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { etiquetaMobile } from "../../utils/accesibilidad.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useSesion } from "../../context/SesionContext.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes } from "../../theme.js";
import { avisarExito, confirmar } from "../../utils/confirmar.js";
import { Icono } from "../icono/Icono.jsx";
import { ModalAccesible } from "../modalAccesible/ModalAccesible.jsx";
import { Avatar } from "../avatar/Avatar.jsx";
import { Boton } from "../boton/Boton.jsx";
import { SelectorTema } from "../tema/SelectorTema.jsx";

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
