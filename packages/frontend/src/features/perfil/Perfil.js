import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { actualizarPerfil, cambiarPassword } from "../../api/api.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import {
  Avatar,
  Boton,
  Campo,
  CampoPassword,
  ResumenErrores,
  Seccion,
  Tarjeta,
} from "../../components/ui.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useSesion } from "../../store/SesionContext.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes } from "../../theme.js";
import { avisarExito } from "../../utils/confirmar.js";
import { nombreCompleto } from "../../utils/formato.js";

const NOMBRE_ROL = { COMPRADOR: "Comprador", ORGANIZADOR: "Organizador" };

// D-30: el usuario edita sus datos y cambia su contraseña
export default function Perfil() {
  const { usuario } = useSesion();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo="Tu cuenta" titulo="Mi perfil" />
      <Pantalla>
        <View style={styles.cabecera}>
          <Avatar usuario={usuario} tamanio={64} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nombre}>{nombreCompleto(usuario)}</Text>
            <Text style={styles.detalle}>
              {NOMBRE_ROL[usuario.rol]} · {usuario.email}
            </Text>
          </View>
        </View>
        <FormularioDatos />
        <FormularioPassword />
      </Pantalla>
    </View>
  );
}

function FormularioDatos() {
  const { usuario, actualizarUsuario } = useSesion();
  const { texto } = useTema();
  const [valores, setValores] = useState({ nombre: usuario.nombre, apellido: usuario.apellido });
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const campos = useRef({});

  const sinCambios = valores.nombre === usuario.nombre && valores.apellido === usuario.apellido;
  const cambiar = (campo) => (valor) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores(({ [campo]: _quitado, ...resto }) => resto);
  };

  const guardar = async () => {
    const nuevos = {};
    if (valores.nombre.trim().length < 2) nuevos.nombre = "Al menos 2 letras";
    if (valores.apellido.trim().length < 2) nuevos.apellido = "Al menos 2 letras";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      campos.current[Object.keys(nuevos)[0]]?.focus();
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await actualizarPerfil({
        nombre: valores.nombre.trim(),
        apellido: valores.apellido.trim(),
      });
      actualizarUsuario(actualizado);
      setValores({ nombre: actualizado.nombre, apellido: actualizado.apellido });
      avisarExito("Guardamos tus datos");
    } catch (e) {
      setErrores(
        e.errores?.length
          ? Object.fromEntries(e.errores.map((err) => [err.campo, err.mensaje]))
          : { general: e.message },
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Seccion titulo="Tus datos">
      <Tarjeta>
        <Campo
          ref={(el) => (campos.current.nombre = el)}
          etiqueta="Nombre"
          value={valores.nombre}
          onChangeText={cambiar("nombre")}
          error={errores.nombre}
          autoComplete="given-name"
        />
        <Campo
          ref={(el) => (campos.current.apellido = el)}
          etiqueta="Apellido"
          value={valores.apellido}
          onChangeText={cambiar("apellido")}
          error={errores.apellido}
          autoComplete="family-name"
        />
        <Text style={[texto.chico, { marginBottom: espacio.m }]}>
          El email identifica tu cuenta y no se puede cambiar.
        </Text>
        <ResumenErrores mensaje={errores.general} />
        <Boton
          titulo="Guardar cambios"
          onPress={guardar}
          cargando={guardando}
          deshabilitado={sinCambios}
        />
      </Tarjeta>
    </Seccion>
  );
}

function FormularioPassword() {
  const vacio = { passwordActual: "", passwordNueva: "", confirmacion: "" };
  const [valores, setValores] = useState(vacio);
  const [errores, setErrores] = useState({});
  const [visible, setVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const campos = useRef({});

  const cambiar = (campo) => (valor) => {
    setValores((actuales) => ({ ...actuales, [campo]: valor }));
    setErrores(({ [campo]: _quitado, ...resto }) => resto);
  };
  const registrar = (campo) => (el) => {
    campos.current[campo] = el;
  };

  const guardar = async () => {
    const nuevos = {};
    if (!valores.passwordActual) nuevos.passwordActual = "Ingresá tu contraseña actual";
    if (valores.passwordNueva.length < 8) nuevos.passwordNueva = "Al menos 8 caracteres";
    else if (
      !/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(valores.passwordNueva) ||
      !/\d/.test(valores.passwordNueva)
    )
      nuevos.passwordNueva = "Tiene que tener al menos una letra y un número";
    if (valores.confirmacion !== valores.passwordNueva)
      nuevos.confirmacion = "Las contraseñas no coinciden";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) {
      campos.current[Object.keys(nuevos)[0]]?.focus();
      return;
    }
    setGuardando(true);
    try {
      await cambiarPassword(valores.passwordActual, valores.passwordNueva);
      setValores(vacio);
      avisarExito("Cambiaste tu contraseña");
    } catch (e) {
      const porCampo = e.errores?.length
        ? Object.fromEntries(e.errores.map((err) => [err.campo, err.mensaje]))
        : { general: e.message };
      setErrores(porCampo);
      campos.current[Object.keys(porCampo)[0]]?.focus();
    } finally {
      setGuardando(false);
    }
  };

  const cantidad = Object.keys(errores).filter((campo) => campo !== "general").length;

  return (
    <Seccion titulo="Contraseña">
      <Tarjeta>
        <CampoPassword
          ref={registrar("passwordActual")}
          etiqueta="Contraseña actual"
          value={valores.passwordActual}
          onChangeText={cambiar("passwordActual")}
          error={errores.passwordActual}
          visible={visible}
          conBoton={false}
          autoComplete="current-password"
        />
        <CampoPassword
          ref={registrar("passwordNueva")}
          etiqueta="Contraseña nueva"
          value={valores.passwordNueva}
          onChangeText={cambiar("passwordNueva")}
          error={errores.passwordNueva}
          ayuda="Al menos 8 caracteres, con letras y números."
          visible={visible}
          conBoton={false}
          autoComplete="new-password"
        />
        <CampoPassword
          ref={registrar("confirmacion")}
          etiqueta="Repetir contraseña nueva"
          value={valores.confirmacion}
          onChangeText={cambiar("confirmacion")}
          error={errores.confirmacion}
          visible={visible}
          onCambiarVisible={setVisible}
          autoComplete="new-password"
        />
        <ResumenErrores
          mensaje={
            errores.general ??
            (cantidad ? `Revisá ${cantidad === 1 ? "1 campo" : `${cantidad} campos`}.` : null)
          }
        />
        <Boton
          titulo="Cambiar contraseña"
          variante="secundario"
          icono="key-outline"
          onPress={guardar}
          cargando={guardando}
        />
      </Tarjeta>
    </Seccion>
  );
}

const crearEstilos = ({ colores }) => ({
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacio.l,
    marginBottom: espacio.xl,
  },
  nombre: { fontFamily: fuentes.titulo, fontSize: 24, color: colores.texto },
  detalle: { fontFamily: fuentes.texto, fontSize: 14, color: colores.textoSecundario },
});
