import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { pedirRecuperacion, restablecerPassword } from "../../api/api.js";
import { Boton, Campo, CampoPassword, ResumenErrores } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { avisarExito } from "../../utils/confirmar.js";
import { MarcoAcceso } from "./MarcoAcceso.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// D-44: recuperar la contraseña en dos pasos: pedir el código por email y elegir una contraseña nueva
export default function Recuperar() {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const router = useRouter();
  const params = useLocalSearchParams();
  const [paso, setPaso] = useState("email");
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [visible, setVisible] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const campos = useRef({});

  const enfocarPrimero = (nuevos) => campos.current[Object.keys(nuevos)[0]]?.focus();

  const pedir = async () => {
    if (!EMAIL_VALIDO.test(email.trim())) {
      const nuevos = { email: "Ingresá el email de tu cuenta" };
      setErrores(nuevos);
      enfocarPrimero(nuevos);
      return;
    }
    setEnviando(true);
    try {
      await pedirRecuperacion(email.trim());
      setErrores({});
      setPaso("codigo");
      anunciar("Te enviamos un código de 6 números. Escribilo para seguir.");
    } catch (e) {
      setErrores({ general: e.message });
    } finally {
      setEnviando(false);
    }
  };

  const restablecer = async () => {
    const nuevos = {};
    if (!/^\d{6}$/.test(codigo.trim())) nuevos.codigo = "El código tiene 6 números";
    if (password.length < 8) nuevos.password = "Al menos 8 caracteres";
    else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password) || !/\d/.test(password))
      nuevos.password = "Tiene que tener al menos una letra y un número";
    if (confirmacion !== password) nuevos.confirmacion = "Las contraseñas no coinciden";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      enfocarPrimero(nuevos);
      return;
    }
    setEnviando(true);
    try {
      await restablecerPassword(email.trim(), codigo.trim(), password);
      avisarExito("Listo: ya podés ingresar con tu contraseña nueva");
      router.replace("/login");
    } catch (e) {
      const porCampo = e.errores?.length
        ? Object.fromEntries(
            e.errores.map((err) => [
              err.campo === "passwordNueva" ? "password" : err.campo,
              err.mensaje,
            ]),
          )
        : { general: e.message };
      setErrores(porCampo);
      enfocarPrimero(porCampo);
    } finally {
      setEnviando(false);
    }
  };

  const cantidad = Object.keys(errores).filter((c) => c !== "general").length;
  const resumen = errores.general ?? (cantidad > 1 ? `Revisá ${cantidad} datos.` : null);

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
            ref={(el) => (campos.current.email = el)}
            etiqueta="Email"
            value={email}
            onChangeText={(valor) => {
              setEmail(valor);
              setErrores({});
            }}
            error={errores.email}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={pedir}
          />
          <Boton
            titulo="Enviarme el código"
            variante="acento"
            onPress={pedir}
            cargando={enviando}
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
            ref={(el) => (campos.current.codigo = el)}
            etiqueta="Código de 6 números"
            value={codigo}
            onChangeText={(valor) => setCodigo(valor.replace(/\D/g, "").slice(0, 6))}
            error={errores.codigo}
            inputMode="numeric"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
          />
          <CampoPassword
            ref={(el) => (campos.current.password = el)}
            etiqueta="Contraseña nueva"
            value={password}
            onChangeText={setPassword}
            error={errores.password}
            ayuda="Al menos 8 caracteres, con letras y números."
            visible={visible}
            conBoton={false}
            autoComplete="new-password"
          />
          <CampoPassword
            ref={(el) => (campos.current.confirmacion = el)}
            etiqueta="Repetir contraseña nueva"
            value={confirmacion}
            onChangeText={setConfirmacion}
            error={errores.confirmacion}
            visible={visible}
            onCambiarVisible={setVisible}
            autoComplete="new-password"
          />
          <Boton
            titulo="Cambiar la contraseña"
            variante="acento"
            onPress={restablecer}
            cargando={enviando}
          />
          <Boton
            titulo="No me llegó: enviar otro código"
            variante="secundario"
            onPress={pedir}
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
