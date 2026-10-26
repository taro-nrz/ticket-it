import { forwardRef, useId, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { espacio, estadosCompra, fuentes, radio } from "../theme.js";
import { estadoPresionado } from "../utils/accesibilidad.js";
import { textoSinLeer } from "../utils/formato.js";
import { Icono } from "./Icono.js";
import { useTema } from "../store/TemaContext.js";
import { useEstilos } from "../hooks/useEstilos.js";

// Componentes básicos reutilizables. Cada uno aplica las pautas de accesibilidad de la clase
// (ver docs/DOCUMENTACION.md, D-21): rol semántico, nombre accesible, estados y tamaño táctil ≥ 44 px.

const variantesBoton = (colores) => ({
  primario: { fondo: colores.primario, texto: colores.sobrePrimario, borde: colores.primario },
  acento: { fondo: colores.acento, texto: colores.sobreAcento, borde: colores.acento },
  secundario: { fondo: "transparent", texto: colores.texto, borde: colores.texto },
  peligro: { fondo: "transparent", texto: colores.error, borde: colores.error },
  // acción destructiva confirmada (ej. en un modal): fondo lleno, contraste ≥ 5.8:1 en ambos temas
  peligroLleno: { fondo: colores.error, texto: colores.fondo, borde: colores.error },
  exito: { fondo: colores.exitoBoton, texto: "#FFFFFF", borde: colores.exitoBoton },
});

// Pauta 5: un <button> real (rol, foco y teclado). Pauta 6: alto mínimo 50 px.
export function Boton({
  titulo,
  onPress,
  variante = "primario",
  deshabilitado,
  cargando,
  icono,
  style,
  accessibilityHint,
}) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const v = variantesBoton(colores)[variante];
  const inactivo = deshabilitado || cargando;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactivo, busy: !!cargando }}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: v.fondo, borderColor: v.borde },
        (pressed || inactivo) && { opacity: inactivo ? 0.45 : 0.85 },
        style,
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={v.texto} accessibilityLabel="Procesando" />
      ) : (
        <View style={styles.fila}>
          {icono && <Icono name={icono} size={19} color={v.texto} />}
          <Text style={[styles.botonTexto, { color: v.texto }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

// Tarjeta; si es tocable se comporta como un botón con nombre accesible propio
export function Tarjeta({ children, onPress, style, accessibilityLabel, accessibilityHint }) {
  const styles = useEstilos(crearEstilos);

  if (!onPress) return <View style={[styles.tarjeta, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.tarjeta, style, pressed && { opacity: 0.88 }]}
    >
      {children}
    </Pressable>
  );
}

// Pauta 5: títulos como encabezados (en web, <h1>/<h2>), para navegar por títulos con el lector
export function Titulo({ nivel = 2, style, children, ...props }) {
  return (
    <Text role="heading" aria-level={nivel} accessibilityRole="header" style={style} {...props}>
      {children}
    </Text>
  );
}

// Pauta 9: la carga se anuncia
export function Cargando({ color, mensaje = "Cargando" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View
      style={styles.centro}
      accessible
      accessibilityLabel={mensaje}
      accessibilityRole="progressbar"
      aria-busy
    >
      <ActivityIndicator size="large" color={color ?? colores.primario} />
    </View>
  );
}

// Pauta 9: un error se anuncia de inmediato (role="alert") y ofrece cómo seguir
export function ErrorVista({ error, onReintentar }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.centro}>
      <Icono name="cloud-offline-outline" size={44} color={colores.error} />
      <Text
        role="alert"
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={styles.textoCentrado}
      >
        {error?.message ?? "Ocurrió un error. Intentá de nuevo más tarde."}
      </Text>
      {onReintentar && <Boton titulo="Reintentar" variante="secundario" onPress={onReintentar} />}
    </View>
  );
}

export function Vacio({ icono = "file-tray-outline", mensaje }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.centro}>
      <View style={styles.vacioIcono}>
        <Icono name={icono} size={30} color={colores.acentoTexto} />
      </View>
      <Text style={styles.textoCentrado}>{mensaje}</Text>
    </View>
  );
}

// Chips de filtro: botones con estado "presionado" (aria-pressed), alto ≥ 44 px.
// El estado no depende sólo del color: el chip activo cambia fondo, texto y peso de la fuente.
export function Chips({ opciones, seleccionada, onSeleccionar, etiqueta }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chips}
      accessibilityLabel={etiqueta}
      role={etiqueta ? "group" : undefined}
      aria-label={etiqueta}
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === seleccionada;
        return (
          <Pressable
            key={String(opcion.valor)}
            onPress={() => onSeleccionar(opcion.valor)}
            accessibilityRole="button"
            accessibilityLabel={opcion.etiquetaAccesible ?? opcion.etiqueta}
            {...estadoPresionado(activa)}
            style={[
              styles.chip,
              opcion.fondo && { backgroundColor: opcion.fondo, borderColor: opcion.color },
              activa && styles.chipActiva,
            ]}
          >
            {activa && <Icono name="checkmark" size={15} color={colores.sobrePrimario} />}
            <Text
              style={[
                styles.chipTexto,
                opcion.color && { color: opcion.color, fontFamily: fuentes.semi },
                activa && styles.chipTextoActiva,
              ]}
            >
              {opcion.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// El estado de una compra siempre va con texto, no sólo con color (WCAG 1.4.1)
export function EstadoBadge({ estado, corta = false }) {
  const { estados } = useTema();
  const styles = useEstilos(crearEstilos);

  const info = estados[estado];
  const etiqueta = corta && estado === "PENDIENTE" ? "Pendiente" : info.etiqueta;
  return (
    <View
      style={[styles.badge, { backgroundColor: info.fondo }]}
      accessible
      accessibilityLabel={`Estado: ${info.etiqueta}`}
    >
      <Text style={[styles.badgeTexto, { color: info.color }]}>{etiqueta}</Text>
    </View>
  );
}

// D-26: insignia de mensajes sin leer. Dice el número y "nuevo(s)": no depende sólo del color
export function InsigniaSinLeer({ cantidad }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!cantidad) return null;
  return (
    <View style={styles.insignia} accessible accessibilityLabel={textoSinLeer(cantidad)}>
      <Icono name="chatbubble-ellipses" size={12} color={colores.sobreAcento} />
      <Text style={styles.insigniaTexto}>
        {cantidad} {cantidad === 1 ? "nuevo" : "nuevos"}
      </Text>
    </View>
  );
}

// Estrellas: si son de lectura, son una imagen con el puntaje como texto alternativo;
// si son para puntuar, cada estrella es un botón con nombre ("4 estrellas") y estado.
export function Estrellas({ valor, tamanio = 16, onCambiar }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!onCambiar) {
    return (
      <View
        style={styles.fila}
        accessible
        role="img"
        accessibilityRole="image"
        accessibilityLabel={
          valor ? `Puntaje ${String(valor).replace(".", ",")} de 5` : "Sin puntaje"
        }
      >
        {[1, 2, 3, 4, 5].map((numero) => (
          <Icono
            key={numero}
            name={iconoEstrella(valor, numero)}
            size={tamanio}
            color={colores.estrella}
          />
        ))}
      </View>
    );
  }
  return (
    <View style={styles.fila} role="group" aria-label="Puntuación">
      {[1, 2, 3, 4, 5].map((numero) => (
        <Pressable
          key={numero}
          onPress={() => onCambiar(numero)}
          accessibilityRole="button"
          accessibilityLabel={numero === 1 ? "1 estrella" : `${numero} estrellas`}
          {...estadoPresionado(valor === numero)}
          style={styles.estrellaBoton}
        >
          <Icono name={iconoEstrella(valor, numero)} size={tamanio} color={colores.estrella} />
        </Pressable>
      ))}
    </View>
  );
}

function iconoEstrella(valor, numero) {
  if (valor >= numero) return "star";
  if (valor >= numero - 0.5) return "star-half";
  return "star-outline";
}

// Selector de cantidad: botones de 44 px con nombre, y el valor se anuncia al cambiar (pauta 9)
export function Contador({ valor, minimo = 1, maximo, onCambiar, etiqueta = "Cantidad" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const puedeRestar = valor > minimo;
  const puedeSumar = valor < maximo;
  return (
    <View style={styles.contador}>
      <Pressable
        onPress={() => onCambiar(valor - 1)}
        disabled={!puedeRestar}
        accessibilityRole="button"
        accessibilityLabel={`Quitar una (${etiqueta.toLowerCase()} actual: ${valor})`}
        accessibilityState={{ disabled: !puedeRestar }}
        style={[styles.contadorBoton, !puedeRestar && { opacity: 0.35 }]}
      >
        <Icono name="remove" size={20} color={colores.texto} />
      </Pressable>
      <Text
        style={styles.contadorValor}
        aria-live="polite"
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${etiqueta}: ${valor}`}
      >
        {valor}
      </Text>
      <Pressable
        onPress={() => onCambiar(valor + 1)}
        disabled={!puedeSumar}
        accessibilityRole="button"
        accessibilityLabel={`Agregar una (${etiqueta.toLowerCase()} actual: ${valor})`}
        accessibilityState={{ disabled: !puedeSumar }}
        style={[styles.contadorBoton, styles.contadorBotonLleno, !puedeSumar && { opacity: 0.35 }]}
      >
        <Icono name="add" size={20} color={colores.sobrePrimario} />
      </Pressable>
    </View>
  );
}

// Pautas 1, 3 y 7: etiqueta visible asociada al campo, error con ícono + texto asociado al campo
// (aria-invalid / aria-describedby) y tipo de teclado/autocompletado que recibe por props.
export const Campo = forwardRef(function Campo({ etiqueta, error, ayuda, ...props }, ref) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const id = useId();
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const descripciones = [error && idError, ayuda && idAyuda].filter(Boolean).join(" ") || undefined;
  return (
    <View style={{ marginBottom: espacio.m }}>
      {etiqueta && (
        <Text nativeID={`${id}-etiqueta`} style={styles.etiquetaCampo}>
          {etiqueta}
        </Text>
      )}
      <TextInput
        ref={ref}
        placeholderTextColor={colores.textoSecundario}
        accessibilityLabel={etiqueta}
        accessibilityHint={error ? `Error: ${error}` : ayuda}
        aria-invalid={error ? true : undefined}
        aria-describedby={descripciones}
        style={[
          styles.input,
          props.multiline && styles.inputMultilinea,
          error && styles.inputError,
        ]}
        {...props}
      />
      {ayuda && !error && (
        <Text nativeID={idAyuda} style={styles.ayuda}>
          {ayuda}
        </Text>
      )}
      {error && (
        <View style={styles.error}>
          <Icono name="alert-circle" size={16} color={colores.error} />
          <Text nativeID={idError} style={styles.textoError}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
});

// Pauta 9: resumen de errores de un formulario, anunciado de inmediato (role="alert")
export function ResumenErrores({ mensaje }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  if (!mensaje) return null;
  return (
    <View
      style={styles.resumenErrores}
      role="alert"
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Icono name="alert-circle" size={20} color={colores.error} />
      <Text style={styles.resumenErroresTexto}>{mensaje}</Text>
    </View>
  );
}

// D-29: campo de contraseña con botón para mostrarla (ayuda a no equivocarse al escribir, WCAG 3.3.7/3.3.8).
// `visible` / `onCambiarVisible` permiten que un solo botón controle varios campos (ej. "repetir contraseña").
export const CampoPassword = forwardRef(function CampoPassword(
  { visible: visibleControlado, onCambiarVisible, conBoton = true, ...props },
  ref,
) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);
  const [visibleInterno, setVisibleInterno] = useState(false);
  const visible = visibleControlado ?? visibleInterno;
  const setVisible = onCambiarVisible ?? setVisibleInterno;

  return (
    <View>
      <Campo ref={ref} secureTextEntry={!visible} autoCapitalize="none" {...props} />
      {conBoton && (
        <Pressable
          onPress={() => setVisible(!visible)}
          accessibilityRole="button"
          accessibilityLabel="Mostrar contraseña"
          {...estadoPresionado(visible)}
          style={styles.mostrarPassword}
        >
          <Icono
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={18}
            color={colores.texto}
          />
          <Text style={styles.mostrarPasswordTexto}>Mostrar contraseña</Text>
        </Pressable>
      )}
    </View>
  );
});

export function Seccion({ titulo, children, accion }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);

  return (
    <View style={styles.seccion}>
      <View style={[styles.fila, { justifyContent: "space-between", marginBottom: espacio.m }]}>
        <Titulo nivel={2} style={texto.seccion}>
          {titulo}
        </Titulo>
        {accion}
      </View>
      {children}
    </View>
  );
}

// Círculo con iniciales: decorativo (el nombre de la persona siempre está escrito al lado)
export function Avatar({ usuario, oscuro = false, claro = false, tamanio = 40 }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const iniciales = `${usuario.nombre[0]}${usuario.apellido?.[0] ?? ""}`.toUpperCase();
  const esOrganizador = oscuro || usuario.rol === "ORGANIZADOR";
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.avatar,
        { width: tamanio, height: tamanio, borderRadius: tamanio / 2 },
        esOrganizador && { backgroundColor: colores.panel },
        claro && { backgroundColor: colores.sobrePanel },
      ]}
    >
      <Text
        style={[
          styles.avatarTexto,
          esOrganizador && { color: colores.sobrePanel },
          claro && { color: colores.panel },
        ]}
      >
        {iniciales}
      </Text>
    </View>
  );
}

// Barra de progreso con rol y valores para el lector de pantalla
export function Progreso({ valor, total, color, etiqueta = "Entradas vendidas" }) {
  const { colores } = useTema();
  const styles = useEstilos(crearEstilos);

  const porcentaje = total ? Math.max(0, Math.min(100, (valor / total) * 100)) : 0;
  return (
    <View
      style={styles.barra}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={etiqueta}
      accessibilityValue={{ min: 0, max: total, now: valor, text: `${valor} de ${total}` }}
    >
      <View
        style={[
          styles.barraLlena,
          { width: `${porcentaje}%`, backgroundColor: color ?? colores.primario },
        ]}
      />
    </View>
  );
}

export const crearEstilos = ({ colores, texto, estados }) => ({
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: espacio.xxl,
    gap: espacio.m,
  },
  textoCentrado: { ...texto.secundario, textAlign: "center", maxWidth: 280 },
  vacioIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  boton: {
    minHeight: 50,
    paddingHorizontal: espacio.xl,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  botonTexto: { fontFamily: fuentes.negrita, fontSize: 16 },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radio.l,
    padding: espacio.l,
    marginBottom: espacio.m,
    borderWidth: 1,
    borderColor: colores.borde,
  },
  chips: { gap: espacio.s, paddingVertical: 2 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.superficie,
  },
  chipActiva: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { fontFamily: fuentes.medio, fontSize: 14, color: colores.texto },
  chipTextoActiva: { color: colores.sobrePrimario, fontFamily: fuentes.negrita },
  badge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeTexto: { fontFamily: fuentes.negrita, fontSize: 12 },
  resumenErrores: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colores.errorFondo,
    borderWidth: 1,
    borderColor: colores.error,
    borderRadius: radio.m,
    padding: 14,
    marginBottom: espacio.l,
  },
  resumenErroresTexto: { flex: 1, fontFamily: fuentes.semi, fontSize: 14, color: colores.error },
  mostrarPassword: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    minHeight: 44,
    marginTop: -6,
    marginBottom: espacio.s,
  },
  mostrarPasswordTexto: { fontFamily: fuentes.semi, fontSize: 14, color: colores.texto },
  insignia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    backgroundColor: colores.acento,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  insigniaTexto: { fontFamily: fuentes.negrita, fontSize: 12, color: colores.sobreAcento },
  estrellaBoton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  contador: { flexDirection: "row", alignItems: "center", gap: 12 },
  contadorBoton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colores.bordeControl,
    alignItems: "center",
    justifyContent: "center",
  },
  contadorBotonLleno: { backgroundColor: colores.primario, borderColor: colores.primario },
  contadorValor: {
    fontFamily: fuentes.negrita,
    fontSize: 18,
    minWidth: 22,
    textAlign: "center",
    color: colores.texto,
  },
  etiquetaCampo: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 6 },
  input: {
    minHeight: 48,
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fuentes.texto,
    color: colores.texto,
  },
  inputMultilinea: { minHeight: 96, textAlignVertical: "top" },
  inputError: { borderColor: colores.error, borderWidth: 2 },
  ayuda: { ...texto.chico, marginTop: 4 },
  error: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  textoError: { flex: 1, fontFamily: fuentes.medio, color: colores.error, fontSize: 14 },
  seccion: { marginBottom: espacio.xxl },
  avatar: {
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontFamily: fuentes.negrita, fontSize: 14, color: colores.acentoTexto },
  barra: { height: 8, borderRadius: 4, backgroundColor: colores.apagado, overflow: "hidden" },
  barraLlena: { height: 8, borderRadius: 4 },
});
