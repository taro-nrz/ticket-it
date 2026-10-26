import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icono } from "../../components/Icono.js";
import {
  Avatar,
  Boton,
  Campo,
  CampoPassword,
  ResumenErrores,
  Titulo,
} from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useSesion } from "../../store/SesionContext.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes } from "../../theme.js";
import { anunciar, etiquetaMobile } from "../../utils/accesibilidad.js";
import { MarcoAcceso } from "./MarcoAcceso.js";

// Cuentas de la semilla del backend (todas con la misma contraseña) para la demo y la exposición
const PASSWORD_DEMO = "ticketit123";
const CUENTAS_DEMO = [
  { nombre: "Sofía", apellido: "Pérez", email: "sofia@ticketit.com", rol: "Compradora" },
  { nombre: "Juan", apellido: "Rodríguez", email: "juan@ticketit.com", rol: "Comprador" },
  { nombre: "Lucía", apellido: "Fernández", email: "lucia@ticketit.com", rol: "Organizadora" },
  { nombre: "Martín", apellido: "Gómez", email: "martin@ticketit.com", rol: "Organizador" },
];

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validar({ email, password }) {
  const errores = {};
  if (!email.trim()) errores.email = "Ingresá tu email";
  else if (!EMAIL_VALIDO.test(email.trim())) errores.email = "El email no tiene un formato válido";
  if (!password) errores.password = "Ingresá tu contraseña";
  return errores;
}

// D-29: inicio de sesión con email y contraseña
export default function Login() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const { ingresar } = useSesion();
  const router = useRouter();

  const [valores, setValores] = useState({ email: "", password: "" });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const campos = useRef({});

  const errores = validar(valores);
  const error = (campo) => (intentoEnviar ? errores[campo] : undefined);
  const cambiar = (campo) => (valor) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrorServidor(null);
  };

  const enviar = async () => {
    setIntentoEnviar(true);
    const conError = Object.keys(errores);
    if (conError.length > 0) {
      campos.current[conError[0]]?.focus();
      return;
    }
    setEnviando(true);
    try {
      const usuario = await ingresar(valores.email.trim(), valores.password);
      anunciar(`Hola, ${usuario.nombre}`);
      router.replace("/");
    } catch (e) {
      setErrorServidor(e.message);
    } finally {
      setEnviando(false);
    }
  };

  const usarCuentaDemo = (cuenta) => {
    setValores({ email: cuenta.email, password: PASSWORD_DEMO });
    setErrorServidor(null);
    anunciar(`Se cargaron los datos de ${cuenta.nombre}. Tocá Ingresar.`);
  };

  const mensajeResumen =
    errorServidor ??
    (intentoEnviar && Object.keys(errores).length > 0
      ? "Revisá los datos marcados para poder ingresar."
      : null);

  return (
    <MarcoAcceso
      tituloPagina="Ingresar"
      titulo="Tu próxima noche empieza acá."
      subtitulo="Ingresá con tu cuenta para comprar entradas o gestionar tus eventos."
    >
      <ResumenErrores mensaje={mensajeResumen} />
      <Campo
        ref={(el) => (campos.current.email = el)}
        etiqueta="Email"
        value={valores.email}
        onChangeText={cambiar("email")}
        error={error("email")}
        placeholder="tu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => campos.current.password?.focus()}
      />
      <CampoPassword
        ref={(el) => (campos.current.password = el)}
        etiqueta="Contraseña"
        value={valores.password}
        onChangeText={cambiar("password")}
        error={error("password")}
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />
      <Link
        href={
          valores.email ? `/recuperar?email=${encodeURIComponent(valores.email)}` : "/recuperar"
        }
        replace
        style={styles.olvido}
        accessibilityRole="link"
      >
        ¿Olvidaste tu contraseña?
      </Link>
      <Boton titulo="Ingresar" variante="acento" onPress={enviar} cargando={enviando} />

      <View style={styles.registro}>
        <Text style={texto.secundario}>¿No tenés cuenta?</Text>
        <Link href="/registro" replace style={styles.enlace} accessibilityRole="link">
          Creá una gratis
        </Link>
      </View>

      <View style={styles.demo}>
        <Titulo nivel={2} style={texto.etiqueta}>
          Cuentas de prueba
        </Titulo>
        <Text style={texto.chico}>
          Tocá una para completar el formulario (contraseña {PASSWORD_DEMO}).
        </Text>
        <View style={styles.cuentas}>
          {CUENTAS_DEMO.map((cuenta) => (
            <Pressable
              key={cuenta.email}
              onPress={() => usarCuentaDemo(cuenta)}
              accessibilityRole="button"
              {...etiquetaMobile(`Usar la cuenta de ${cuenta.nombre}, ${cuenta.rol.toLowerCase()}`)}
              style={({ pressed }) => [styles.cuenta, pressed && { opacity: 0.85 }]}
            >
              <Avatar usuario={cuenta} tamanio={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cuentaNombre}>{cuenta.nombre}</Text>
                <Text style={texto.chico}>{cuenta.rol}</Text>
              </View>
              <Icono name="arrow-up-outline" size={16} color={colores.textoSecundario} />
            </Pressable>
          ))}
        </View>
      </View>
    </MarcoAcceso>
  );
}

const crearEstilos = ({ colores }) => ({
  registro: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    marginTop: espacio.l,
  },
  enlace: {
    fontFamily: fuentes.negrita,
    fontSize: 15,
    color: colores.texto,
    textDecorationLine: "underline",
    paddingVertical: 12,
  },
  olvido: {
    alignSelf: "flex-end",
    fontFamily: fuentes.semi,
    fontSize: 14,
    color: colores.texto,
    textDecorationLine: "underline",
    paddingVertical: 12,
    marginTop: -espacio.s,
    marginBottom: espacio.s,
  },
  demo: {
    marginTop: espacio.xl,
    paddingTop: espacio.xl,
    borderTopWidth: 1,
    borderTopColor: colores.borde,
    gap: 6,
  },
  cuentas: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: espacio.s },
  cuenta: {
    flexGrow: 1,
    flexBasis: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  cuentaNombre: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
});
