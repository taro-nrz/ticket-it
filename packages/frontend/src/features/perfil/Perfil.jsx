import { useState } from "react";
import { Text, View } from "react-native";
import { actualizarPerfil } from "../../service/usuariosService.js";
import { cambiarPassword } from "../../service/authService.js";
import { BarraVolver } from "../../components/encabezado/BarraVolver.jsx";
import { Pantalla } from "../../components/pantalla/Pantalla.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { Boton } from "../../components/boton/Boton.jsx";
import { Campo } from "../../components/formulario/Campo.jsx";
import { CampoPassword } from "../../components/formulario/CampoPassword.jsx";
import { ResumenErrores } from "../../components/formulario/ResumenErrores.jsx";
import { Seccion } from "../../components/seccion/Seccion.jsx";
import { Tarjeta } from "../../components/tarjeta/Tarjeta.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useSesion } from "../../context/SesionContext.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes } from "../../theme.js";
import { avisarExito } from "../../utils/confirmar.js";
import { nombreCompleto } from "../../utils/formato.js";

// Las mismas reglas que valida el backend, para avisar antes de enviar
function validarDatos({ nombre, apellido }) {
  const errores = {};
  if (nombre.trim().length < 2) errores.nombre = "Al menos 2 letras";
  if (apellido.trim().length < 2) errores.apellido = "Al menos 2 letras";
  return errores;
}

function validarPassword({ passwordActual, passwordNueva, confirmacion }) {
  const errores = {};
  if (!passwordActual) errores.passwordActual = "Ingresá tu contraseña actual";
  if (passwordNueva.length < 8) errores.passwordNueva = "Al menos 8 caracteres";
  else if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(passwordNueva) || !/\d/.test(passwordNueva))
    errores.passwordNueva = "Tiene que tener al menos una letra y un número";
  if (confirmacion !== passwordNueva) errores.confirmacion = "Las contraseñas no coinciden";
  return errores;
}

const NOMBRES_PASSWORD = {
  passwordActual: "contraseña actual",
  passwordNueva: "contraseña nueva",
  confirmacion: "repetir contraseña",
};

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
  const { valores, cambiar, error, registrar, enviar, enviando, errorGeneral, reiniciar } =
    useFormulario({
      inicial: { nombre: usuario.nombre, apellido: usuario.apellido },
      validar: validarDatos,
      alEnviar: async ({ nombre, apellido }) => {
        const actualizado = await actualizarPerfil({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
        });
        actualizarUsuario(actualizado);
        reiniciar({ nombre: actualizado.nombre, apellido: actualizado.apellido });
        avisarExito("Guardamos tus datos");
      },
    });
  const sinCambios = valores.nombre === usuario.nombre && valores.apellido === usuario.apellido;

  return (
    <Seccion titulo="Tus datos">
      <Tarjeta>
        <Campo
          ref={registrar("nombre")}
          etiqueta="Nombre"
          value={valores.nombre}
          onChangeText={cambiar("nombre")}
          error={error("nombre")}
          autoComplete="given-name"
        />
        <Campo
          ref={registrar("apellido")}
          etiqueta="Apellido"
          value={valores.apellido}
          onChangeText={cambiar("apellido")}
          error={error("apellido")}
          autoComplete="family-name"
        />
        <Text style={[texto.chico, { marginBottom: espacio.m }]}>
          El email identifica tu cuenta y no se puede cambiar.
        </Text>
        <ResumenErrores mensaje={errorGeneral} />
        <Boton
          titulo="Guardar cambios"
          onPress={enviar}
          cargando={enviando}
          deshabilitado={sinCambios}
        />
      </Tarjeta>
    </Seccion>
  );
}

function FormularioPassword() {
  const [visible, setVisible] = useState(false);
  const { valores, cambiar, error, registrar, enviar, enviando, resumen, reiniciar } =
    useFormulario({
      inicial: { passwordActual: "", passwordNueva: "", confirmacion: "" },
      validar: validarPassword,
      nombres: NOMBRES_PASSWORD,
      alEnviar: async ({ passwordActual, passwordNueva }) => {
        await cambiarPassword(passwordActual, passwordNueva);
        reiniciar();
        avisarExito("Cambiaste tu contraseña");
      },
    });

  return (
    <Seccion titulo="Contraseña">
      <Tarjeta>
        <CampoPassword
          ref={registrar("passwordActual")}
          etiqueta="Contraseña actual"
          value={valores.passwordActual}
          onChangeText={cambiar("passwordActual")}
          error={error("passwordActual")}
          visible={visible}
          conBoton={false}
          autoComplete="current-password"
        />
        <CampoPassword
          ref={registrar("passwordNueva")}
          etiqueta="Contraseña nueva"
          value={valores.passwordNueva}
          onChangeText={cambiar("passwordNueva")}
          error={error("passwordNueva")}
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
          error={error("confirmacion")}
          visible={visible}
          onCambiarVisible={setVisible}
          autoComplete="new-password"
        />
        <ResumenErrores mensaje={resumen} />
        <Boton
          titulo="Cambiar contraseña"
          variante="secundario"
          icono="key-outline"
          onPress={enviar}
          cargando={enviando}
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
