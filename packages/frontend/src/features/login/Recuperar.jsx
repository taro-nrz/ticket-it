import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { pedirRecuperacion, restablecerPassword } from "../../service/authService.js";
import { Boton } from "../../components/boton/Boton.jsx";
import { Campo } from "../../components/formulario/Campo.jsx";
import { CampoPassword } from "../../components/formulario/CampoPassword.jsx";
import { ResumenErrores } from "../../components/formulario/ResumenErrores.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { avisarExito } from "../../utils/confirmar.js";
import { MarcoAcceso } from "./MarcoAcceso.jsx";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const NOMBRES = {
  codigo: "código",
  passwordNueva: "contraseña nueva",
  confirmacion: "repetir contraseña",
};

// Mismas reglas que el backend para la contraseña nueva
function validarCambio({ codigo, passwordNueva, confirmacion }) {
  const errores = {};
  if (!/^\d{6}$/.test(codigo.trim())) errores.codigo = "El código tiene 6 números";
  if (passwordNueva.length < 8) errores.passwordNueva = "Al menos 8 caracteres";
  else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(passwordNueva) || !/\d/.test(passwordNueva))
    errores.passwordNueva = "Tiene que tener al menos una letra y un número";
  if (confirmacion !== passwordNueva) errores.confirmacion = "Las contraseñas no coinciden";
  return errores;
}

// D-44: recuperar la contraseña en dos pasos: pedir el código por email y elegir una contraseña nueva
export default function Recuperar() {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [paso, setPaso] = useState("email");
  const [visible, setVisible] = useState(false);

  // Dos formularios, uno por paso (cada uno con su useFormulario)
  const pedido = useFormulario({
    inicial: { email: typeof params.email === "string" ? params.email : "" },
    validar: ({ email }) =>
      EMAIL_VALIDO.test(email.trim()) ? {} : { email: "Ingresá el email de tu cuenta" },
    alEnviar: async ({ email }) => {
      await pedirRecuperacion(email.trim());
      setPaso("codigo");
      anunciar("Te enviamos un código de 6 números. Escribilo para seguir.");
    },
  });
  const email = pedido.valores.email.trim();

  const cambio = useFormulario({
    inicial: { codigo: "", passwordNueva: "", confirmacion: "" },
    validar: validarCambio,
    palabra: "dato",
    nombres: NOMBRES,
    alEnviar: async ({ codigo, passwordNueva }) => {
      await restablecerPassword(email, codigo.trim(), passwordNueva);
      avisarExito("Listo: ya podés ingresar con tu contraseña nueva");
      router.replace("/login");
    },
  });

  const resumen = paso === "email" ? pedido.errorGeneral : (cambio.resumen ?? pedido.errorGeneral);

  return (
    <MarcoAcceso
      tituloPagina="Recuperar contraseña"
      titulo="Recuperá tu cuenta."
      subtitulo={
        paso === "email"
          ? "Te mandamos un código por email para que elijas una contraseña nueva."
          : `Escribí el código que enviamos a ${email.trim()}.`
      }
    >
      <Text style={styles.pasos} accessibilityRole="text">
        Paso {paso === "email" ? 1 : 2} de 2
      </Text>
      <ResumenErrores mensaje={resumen} />

      {paso === "email" ? (
        <>
          <Campo
            ref={pedido.registrar("email")}
            etiqueta="Email"
            value={pedido.valores.email}
            onChangeText={pedido.cambiar("email")}
            error={pedido.error("email")}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={pedido.enviar}
          />
          <Boton
            titulo="Enviarme el código"
            variante="acento"
            onPress={pedido.enviar}
            cargando={pedido.enviando}
          />
        </>
      ) : (
        <>
          <View style={styles.demo} role="note">
            <Text style={texto.chico}>
              Modo demo: el envío de emails es simulado. El código aparece en la consola del backend
              (y en GET /dev/emails).
            </Text>
          </View>
          <Campo
            ref={cambio.registrar("codigo")}
            etiqueta="Código de 6 números"
            value={cambio.valores.codigo}
            onChangeText={cambio.cambiar("codigo", (valor) => valor.replace(/\D/g, "").slice(0, 6))}
            error={cambio.error("codigo")}
            inputMode="numeric"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
          />
          <CampoPassword
            ref={cambio.registrar("passwordNueva")}
            etiqueta="Contraseña nueva"
            value={cambio.valores.passwordNueva}
            onChangeText={cambio.cambiar("passwordNueva")}
            error={cambio.error("passwordNueva")}
            ayuda="Al menos 8 caracteres, con letras y números."
            visible={visible}
            conBoton={false}
            autoComplete="new-password"
          />
          <CampoPassword
            ref={cambio.registrar("confirmacion")}
            etiqueta="Repetir contraseña nueva"
            value={cambio.valores.confirmacion}
            onChangeText={cambio.cambiar("confirmacion")}
            error={cambio.error("confirmacion")}
            visible={visible}
            onCambiarVisible={setVisible}
            autoComplete="new-password"
          />
          <Boton
            titulo="Cambiar la contraseña"
            variante="acento"
            onPress={cambio.enviar}
            cargando={cambio.enviando}
          />
          <Boton
            titulo="No me llegó: enviar otro código"
            variante="secundario"
            onPress={pedido.enviar}
            cargando={pedido.enviando}
            style={{ marginTop: espacio.s }}
          />
        </>
      )}

      <View style={styles.volver}>
        <Link href="/login" replace style={styles.enlace} accessibilityRole="link">
          Volver a ingresar
        </Link>
      </View>
    </MarcoAcceso>
  );
}

const crearEstilos = ({ colores }) => ({
  pasos: {
    fontFamily: fuentes.negrita,
    fontSize: 13,
    color: colores.textoSecundario,
    marginBottom: espacio.m,
  },
  demo: {
    backgroundColor: colores.apagado,
    borderRadius: radio.m,
    padding: 12,
    marginBottom: espacio.l,
  },
  volver: { alignItems: "center", marginTop: espacio.l },
  enlace: {
    fontFamily: fuentes.negrita,
    fontSize: 15,
    color: colores.texto,
    textDecorationLine: "underline",
    paddingVertical: 12,
  },
});
