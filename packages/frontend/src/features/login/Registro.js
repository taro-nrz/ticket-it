import { Link, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Icono } from "../../components/Icono.js";
import { Boton, Campo, CampoPassword, ResumenErrores } from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useSesion } from "../../store/SesionContext.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { avisarExito } from "../../utils/confirmar.js";
import { MarcoAcceso } from "./MarcoAcceso.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES = [
  {
    valor: "COMPRADOR",
    titulo: "Quiero comprar entradas",
    detalle: "Explorá eventos, guardá favoritos y comprá tus entradas.",
    icono: "ticket-outline",
  },
  {
    valor: "ORGANIZADOR",
    titulo: "Quiero publicar eventos",
    detalle: "Publicá eventos, vendé entradas y controlá el acceso.",
    icono: "megaphone-outline",
  },
];

const NOMBRES = {
  nombre: "nombre",
  apellido: "apellido",
  email: "email",
  password: "contraseña",
  confirmacion: "repetir contraseña",
  rol: "tipo de cuenta",
};

// Mismas reglas que el backend (controllers/authController.js), para avisar antes de enviar
export function validarRegistro(valores) {
  const errores = {};
  if (valores.nombre.trim().length < 2) errores.nombre = "Ingresá tu nombre (al menos 2 letras)";
  if (valores.apellido.trim().length < 2)
    errores.apellido = "Ingresá tu apellido (al menos 2 letras)";
  if (!EMAIL_VALIDO.test(valores.email.trim())) errores.email = "Ingresá un email válido";
  if (valores.password.length < 8) errores.password = "Tiene que tener al menos 8 caracteres";
  else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(valores.password) || !/\d/.test(valores.password))
    errores.password = "Tiene que tener al menos una letra y un número";
  if (valores.confirmacion !== valores.password)
    errores.confirmacion = "Las contraseñas no coinciden";
  if (!valores.rol) errores.rol = "Elegí qué tipo de cuenta querés crear";
  return errores;
}

// D-29: registro de una cuenta nueva (comprador u organizador)
export default function Registro() {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const { crearCuenta } = useSesion();
  const router = useRouter();

  const [valores, setValores] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmacion: "",
    rol: null,
  });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const campos = useRef({});

  const errores = { ...validarRegistro(valores), ...erroresServidor };
  const camposConError = Object.keys(errores);
  const error = (campo) => (intentoEnviar ? errores[campo] : undefined);
  const cambiar = (campo) => (valor) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErroresServidor(({ [campo]: _quitado, ...resto }) => resto);
    setErrorGeneral(null);
  };
  const registrar = (campo) => (elemento) => {
    campos.current[campo] = elemento;
  };

  const enviar = async () => {
    setIntentoEnviar(true);
    if (camposConError.length > 0) {
      campos.current[camposConError.find((campo) => campos.current[campo])]?.focus();
      anunciar(`Hay ${camposConError.length} campos para corregir`);
      return;
    }
    setEnviando(true);
    try {
      const { confirmacion: _confirmacion, ...datos } = valores;
      const usuario = await crearCuenta({
        ...datos,
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        email: datos.email.trim(),
      });
      avisarExito(`¡Bienvenido/a, ${usuario.nombre}! Tu cuenta está lista`);
      router.replace("/");
    } catch (e) {
      // Los errores por campo del backend se muestran junto a cada campo
      if (e.errores?.length) {
        setErroresServidor(Object.fromEntries(e.errores.map((err) => [err.campo, err.mensaje])));
      } else if (e.status === 409) {
        setErroresServidor({ email: e.message });
        campos.current.email?.focus();
      } else {
        setErrorGeneral(e.message);
      }
    } finally {
      setEnviando(false);
    }
  };

  const resumen =
    errorGeneral ??
    (intentoEnviar && camposConError.length > 0
      ? `Revisá ${camposConError.length === 1 ? "1 campo" : `${camposConError.length} campos`}: ${camposConError
          .map((campo) => NOMBRES[campo] ?? campo)
          .join(", ")}.`
      : null);

  return (
    <MarcoAcceso
      tituloPagina="Crear cuenta"
      titulo="Creá tu cuenta."
      subtitulo="Es gratis y te lleva un minuto."
    >
      <Text style={styles.etiqueta} nativeID="rol-etiqueta">
        ¿Para qué vas a usar AI Ticket It?
      </Text>
      <View
        role="radiogroup"
        aria-labelledby="rol-etiqueta"
        accessibilityLabel="Tipo de cuenta"
        style={styles.roles}
        ref={registrar("rol")}
      >
        {ROLES.map((rol) => {
          const elegido = valores.rol === rol.valor;
          return (
            <Pressable
              key={rol.valor}
              onPress={() => cambiar("rol")(rol.valor)}
              role="radio"
              aria-checked={elegido}
              accessibilityRole="radio"
              accessibilityState={{ checked: elegido }}
              accessibilityLabel={`${rol.titulo}. ${rol.detalle}`}
              style={[styles.rol, elegido && styles.rolElegido, error("rol") && styles.rolError]}
            >
              <Icono
                name={rol.icono}
                size={24}
                color={elegido ? colores.sobrePrimario : colores.texto}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rolTitulo, elegido && { color: colores.sobrePrimario }]}>
                  {rol.titulo}
                </Text>
                <Text style={[texto.chico, elegido && { color: colores.sobrePrimarioSuave }]}>
                  {rol.detalle}
                </Text>
              </View>
              <Icono
                name={elegido ? "radio-button-on" : "radio-button-off"}
                size={22}
                color={elegido ? colores.sobrePrimario : colores.textoSecundario}
              />
            </Pressable>
          );
        })}
      </View>
      {error("rol") && <Text style={styles.errorRol}>{error("rol")}</Text>}

      <View style={styles.fila}>
        <View style={{ flex: 1 }}>
          <Campo
            ref={registrar("nombre")}
            etiqueta="Nombre"
            value={valores.nombre}
            onChangeText={cambiar("nombre")}
            error={error("nombre")}
            autoComplete="given-name"
            textContentType="givenName"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Campo
            ref={registrar("apellido")}
            etiqueta="Apellido"
            value={valores.apellido}
            onChangeText={cambiar("apellido")}
            error={error("apellido")}
            autoComplete="family-name"
            textContentType="familyName"
          />
        </View>
      </View>
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
      />
      <CampoPassword
        ref={registrar("password")}
        etiqueta="Contraseña"
        value={valores.password}
        onChangeText={cambiar("password")}
        error={error("password")}
        ayuda="Al menos 8 caracteres, con letras y números."
        visible={passwordVisible}
        onCambiarVisible={setPasswordVisible}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <CampoPassword
        ref={registrar("confirmacion")}
        etiqueta="Repetir contraseña"
        visible={passwordVisible}
        conBoton={false}
        value={valores.confirmacion}
        onChangeText={cambiar("confirmacion")}
        error={error("confirmacion")}
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={enviar}
      />

      <ResumenErrores mensaje={resumen} />
      <Boton titulo="Crear cuenta" variante="acento" onPress={enviar} cargando={enviando} />

      <View style={styles.ingresar}>
        <Text style={texto.secundario}>¿Ya tenés cuenta?</Text>
        <Link href="/login" replace style={styles.enlace} accessibilityRole="link">
          Ingresá
        </Link>
      </View>
    </MarcoAcceso>
  );
}

const crearEstilos = ({ colores }) => ({
  etiqueta: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 8 },
  roles: { gap: 10, marginBottom: espacio.s },
  rol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colores.superficie,
    borderWidth: 1.5,
    borderColor: colores.bordeControl,
    borderRadius: radio.m,
    padding: 14,
    minHeight: 44,
  },
  rolElegido: { backgroundColor: colores.primario, borderColor: colores.primario },
  rolError: { borderColor: colores.error, borderWidth: 2 },
  rolTitulo: { fontFamily: fuentes.negrita, fontSize: 15, color: colores.texto },
  errorRol: { fontFamily: fuentes.medio, color: colores.error, fontSize: 14, marginBottom: 8 },
  fila: { flexDirection: "row", gap: espacio.m, marginTop: espacio.m },
  ingresar: {
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
});
