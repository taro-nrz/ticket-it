import { Link, useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Icono } from "../../components/icono/Icono.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { Boton } from "../../components/boton/Boton.jsx";
import { Campo } from "../../components/formulario/Campo.jsx";
import { CampoPassword } from "../../components/formulario/CampoPassword.jsx";
import { ResumenErrores } from "../../components/formulario/ResumenErrores.jsx";
import { Titulo } from "../../components/titulo/Titulo.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useSesion } from "../../context/SesionContext.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes, relieve, relieveBase } from "../../theme.js";
import { anunciar, etiquetaMobile } from "../../utils/accesibilidad.js";
import { MarcoAcceso } from "./MarcoAcceso.jsx";

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

  const {
    valores,
    setValores,
    cambiar,
    error,
    camposConError,
    intentoEnviar,
    registrar,
    enfocar,
    enviar,
    enviando,
    errorGeneral,
    setErrorGeneral,
  } = useFormulario({
    inicial: { email: "", password: "" },
    validar,
    alEnviar: async ({ email, password }) => {
      const usuario = await ingresar(email.trim(), password);
      anunciar(`Hola, ${usuario.nombre}`);
      router.replace("/");
    },
  });

  const usarCuentaDemo = (cuenta) => {
    setValores({ email: cuenta.email, password: PASSWORD_DEMO });
    setErrorGeneral(null);
    anunciar(`Se cargaron los datos de ${cuenta.nombre}. Tocá Ingresar.`);
  };

  const mensajeResumen =
    errorGeneral ??
    (intentoEnviar && camposConError.length > 0
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
        ref={registrar("email")}
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
        onSubmitEditing={() => enfocar("password")}
      />
      <CampoPassword
        ref={registrar("password")}
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
              style={({ pressed }) => [styles.cuenta, relieve(colores, pressed)]}
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
    borderWidth: relieveBase.grosor,
    borderColor: colores.contorno,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  cuentaNombre: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
});
