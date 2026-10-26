import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { actualizarEvento, crearEvento, getCategorias } from "../../api/api.js";
import { Icono } from "../../components/Icono.js";
import { CampoFecha } from "../../components/CampoFecha.js";
import { GestorFotos } from "./GestorFotos.js";
import { BarraVolver, Encabezado, Pantalla } from "../../components/Pantalla.js";
import {
  Boton,
  Campo,
  Chips,
  ResumenErrores,
  Seccion,
  Tarjeta,
  Titulo,
} from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { espacio, fuentes } from "../../theme.js";
import { aTextoFecha } from "../../components/Calendario.js";
import { plural } from "../../utils/formato.js";
import { anunciar } from "../../utils/accesibilidad.js";
import { avisarError, avisarExito } from "../../utils/confirmar.js";
import { useTema } from "../../store/TemaContext.js";
import { useEstilos } from "../../hooks/useEstilos.js";

const tipoVacio = () => ({ nombre: "", descripcion: "", precio: "", cupo: "", vendidas: 0 });

// D-31: para editar, el formulario arranca con los datos del evento (los tipos conservan su id)
const valoresDesdeEvento = (evento) => {
  const fecha = new Date(evento.fecha);
  return {
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    categoriaId: evento.categoria.id,
    fecha: aTextoFecha(fecha),
    hora: `${String(fecha.getHours()).padStart(2, "0")}:${String(fecha.getMinutes()).padStart(2, "0")}`,
    lugar: evento.lugar,
    direccion: evento.direccion,
    imagenes: evento.multimedia,
    tiposEntrada: evento.tiposEntrada.map((tipo) => ({
      id: tipo.id,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      precio: String(tipo.precio),
      cupo: String(tipo.cupo),
      vendidas: tipo.vendidas,
    })),
  };
};

const valoresIniciales = () => ({
  nombre: "",
  descripcion: "",
  categoriaId: null,
  fecha: "",
  hora: "21:00",
  lugar: "",
  direccion: "",
  imagenes: [],
  tiposEntrada: [{ ...tipoVacio(), nombre: "General" }],
});

// Pauta 3: los errores dicen qué pasó y cómo corregirlo.
// Validación en el cliente para dar feedback rápido; las reglas definitivas las valida el backend.
function validar(valores) {
  const errores = {};
  if (valores.nombre.trim().length < 3) {
    errores.nombre = "Escribí un nombre de al menos 3 caracteres";
  }
  if (valores.descripcion.trim().length < 10) {
    errores.descripcion = "Contá un poco más: la descripción necesita al menos 10 caracteres";
  }
  if (!valores.categoriaId) errores.categoriaId = "Elegí una categoría de la lista";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valores.fecha)) {
    errores.fecha = "Elegí la fecha del evento en el calendario";
  }
  if (!/^\d{2}:\d{2}$/.test(valores.hora)) {
    errores.hora = "Escribí la hora como HH:MM, por ejemplo 21:00";
  }
  if (!errores.fecha && !errores.hora && !(fechaDelEvento(valores) > new Date())) {
    errores.hora = "Para hoy, elegí una hora que todavía no haya pasado";
  }
  if (valores.lugar.trim().length < 2) errores.lugar = "Indicá dónde se hace el evento";
  if (valores.direccion.trim().length < 3) errores.direccion = "Indicá la dirección del lugar";
  valores.tiposEntrada.forEach((tipo, indice) => {
    if (!tipo.nombre.trim()) {
      errores[`tipo${indice}nombre`] = "Poné un nombre, por ejemplo General o VIP";
    }
    if (tipo.precio === "" || isNaN(Number(tipo.precio)) || Number(tipo.precio) < 0) {
      errores[`tipo${indice}precio`] = "Escribí un precio en números (0 si es gratis)";
    }
    if (!Number.isInteger(Number(tipo.cupo)) || Number(tipo.cupo) < 1) {
      errores[`tipo${indice}cupo`] = "Escribí un número entero mayor a 0";
    } else if (Number(tipo.cupo) < tipo.vendidas) {
      errores[`tipo${indice}cupo`] = `Ya se vendieron ${tipo.vendidas}: el cupo no puede ser menor`;
    }
  });
  return errores;
}

// Nombre legible de cada campo, para el resumen de errores
function nombreDelCampo(campo) {
  const fijos = {
    nombre: "Nombre",
    descripcion: "Descripción",
    categoriaId: "Categoría",
    fecha: "Fecha",
    hora: "Hora",
    lugar: "Lugar",
    direccion: "Dirección",
  };
  if (fijos[campo]) return fijos[campo];
  const [, indice, propiedad] = campo.match(/^tipo(\d+)(\w+)$/);
  const nombres = { nombre: "Nombre", precio: "Precio", cupo: "Cupo" };
  return `${nombres[propiedad]} de la entrada ${Number(indice) + 1}`;
}

function fechaDelEvento(valores) {
  return new Date(`${valores.fecha}T${valores.hora}:00`);
}

// HU-01: crear un evento con distintos tipos de entrada, cada uno con su precio y cupo.
// D-31: con `evento`, el mismo formulario sirve para editarlo.
export default function CrearEvento({ evento = null }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const editando = Boolean(evento);

  const router = useRouter();
  const { datos: categorias } = useCarga(getCategorias);
  const [valores, setValores] = useState(() =>
    editando ? valoresDesdeEvento(evento) : valoresIniciales(),
  );
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const campos = useRef({});

  const errores = validar(valores);
  const camposConError = Object.keys(errores);
  const error = (campo) => (intentoEnviar ? errores[campo] : undefined);
  const cambiar = (campo) => (valor) => setValores({ ...valores, [campo]: valor });
  const registrar = (campo) => (elemento) => {
    campos.current[campo] = elemento;
  };

  const cambiarTipo = (indice, campo, valor) =>
    setValores({
      ...valores,
      tiposEntrada: valores.tiposEntrada.map((tipo, i) =>
        i === indice ? { ...tipo, [campo]: valor } : tipo,
      ),
    });

  const agregarTipo = () => {
    setValores({ ...valores, tiposEntrada: [...valores.tiposEntrada, tipoVacio()] });
    anunciar(`Se agregó la entrada ${valores.tiposEntrada.length + 1}`);
  };

  const quitarTipo = (indice) => {
    setValores({
      ...valores,
      tiposEntrada: valores.tiposEntrada.filter((_, i) => i !== indice),
    });
    anunciar(`Se quitó la entrada ${indice + 1}`);
  };

  const publicar = async () => {
    setIntentoEnviar(true);
    if (camposConError.length > 0) {
      // Pauta 9: hay que corregir algo, así que se mueve el foco al primer campo con error
      const primero = camposConError.find((campo) => campos.current[campo]);
      campos.current[primero]?.focus();
      anunciar(`Hay ${camposConError.length} campos para corregir`);
      return;
    }
    setEnviando(true);
    try {
      const datos = {
        nombre: valores.nombre.trim(),
        descripcion: valores.descripcion.trim(),
        categoriaId: valores.categoriaId,
        fecha: fechaDelEvento(valores).toISOString(),
        lugar: valores.lugar.trim(),
        direccion: valores.direccion.trim(),
        multimedia: valores.imagenes,
        tiposEntrada: valores.tiposEntrada.map((tipo) => ({
          ...(tipo.id !== undefined && { id: tipo.id }),
          nombre: tipo.nombre.trim(),
          descripcion: tipo.descripcion.trim(),
          precio: Number(tipo.precio),
          cupo: Number(tipo.cupo),
        })),
      };
      if (editando) {
        await actualizarEvento(evento.id, datos);
        avisarExito("Guardamos los cambios del evento");
        router.back();
        return;
      }
      const publicado = await crearEvento(datos);
      setValores(valoresIniciales());
      setIntentoEnviar(false);
      avisarExito("¡Evento publicado! Ya está visible en el catálogo.");
      router.push(`/evento/${publicado.id}`);
    } catch (e) {
      avisarError(
        editando ? "No se pudieron guardar los cambios" : "No se pudo publicar el evento",
        e.message,
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {editando ? (
        <BarraVolver subtitulo={evento.nombre} titulo="Editar evento" />
      ) : (
        <Encabezado saludo="Nuevo evento" titulo="Publicar evento" />
      )}
      <Pantalla style={{ paddingTop: 6 }}>
        <Text style={styles.indicacion}>
          Todos los campos son obligatorios salvo los marcados como opcionales.
        </Text>
        <Seccion titulo="Datos del evento">
          <Campo
            ref={registrar("nombre")}
            etiqueta="Nombre"
            value={valores.nombre}
            onChangeText={cambiar("nombre")}
            placeholder="Ej: Recital de Rock Nacional"
            autoComplete="off"
            autoCapitalize="sentences"
            error={error("nombre")}
          />
          <Campo
            ref={registrar("descripcion")}
            etiqueta="Descripción"
            value={valores.descripcion}
            onChangeText={cambiar("descripcion")}
            placeholder="Contá de qué se trata el evento"
            multiline
            autoComplete="off"
            error={error("descripcion")}
          />
          <Text style={styles.etiqueta} nativeID="etiqueta-categoria">
            Categoría
          </Text>
          {categorias && (
            <Chips
              opciones={categorias.map((c) => ({ valor: c.id, etiqueta: c.nombre }))}
              seleccionada={valores.categoriaId}
              onSeleccionar={cambiar("categoriaId")}
              etiqueta="Categoría del evento"
            />
          )}
          {error("categoriaId") && (
            <View style={styles.errorFila}>
              <Icono name="alert-circle" size={16} color={colores.error} />
              <Text style={styles.error}>{error("categoriaId")}</Text>
            </View>
          )}
          {/* D-24: la fecha se elige en un calendario; antes de hoy no se puede */}
          <View style={{ marginTop: espacio.m }}>
            <CampoFecha
              ref={registrar("fecha")}
              etiqueta="Fecha"
              valor={valores.fecha}
              onCambiar={cambiar("fecha")}
              minimo={new Date()}
              error={error("fecha")}
            />
          </View>
          <View style={styles.fila}>
            <View style={{ flex: 1 }}>
              <Campo
                ref={registrar("hora")}
                etiqueta="Hora"
                value={valores.hora}
                onChangeText={cambiar("hora")}
                placeholder="HH:MM"
                ayuda="24 h"
                inputMode="numeric"
                keyboardType="numbers-and-punctuation"
                autoComplete="off"
                maxLength={5}
                error={error("hora")}
              />
            </View>
            <View style={{ flex: 1 }} />
          </View>
          <Campo
            ref={registrar("lugar")}
            etiqueta="Lugar"
            value={valores.lugar}
            onChangeText={cambiar("lugar")}
            placeholder="Ej: Estadio Luna Park"
            autoComplete="off"
            error={error("lugar")}
          />
          <Campo
            ref={registrar("direccion")}
            etiqueta="Dirección"
            value={valores.direccion}
            onChangeText={cambiar("direccion")}
            placeholder="Ej: Av. Madero 420, CABA"
            autoComplete="off"
            error={error("direccion")}
          />
          <GestorFotos fotos={valores.imagenes} onCambiar={cambiar("imagenes")} />
        </Seccion>

        <Seccion titulo="Tipos de entrada">
          {valores.tiposEntrada.map((tipo, indice) => (
            <Tarjeta key={tipo.id ?? `nuevo-${indice}`}>
              <View style={styles.encabezadoTipo}>
                <Titulo nivel={3} style={styles.tipoTitulo}>
                  Entrada {indice + 1}
                </Titulo>
                {/* D-31: un tipo con entradas vendidas no se puede quitar */}
                {tipo.vendidas > 0 ? (
                  <Text style={texto.chico}>{plural(tipo.vendidas, "vendida")}</Text>
                ) : (
                  valores.tiposEntrada.length > 1 && (
                    <Pressable
                      onPress={() => quitarTipo(indice)}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar la entrada ${indice + 1}${tipo.nombre ? ` (${tipo.nombre})` : ""}`}
                      style={styles.quitar}
                    >
                      <Icono name="trash-outline" size={20} color={colores.error} />
                    </Pressable>
                  )
                )}
              </View>
              <Campo
                ref={registrar(`tipo${indice}nombre`)}
                etiqueta={`Nombre de la entrada ${indice + 1}`}
                value={tipo.nombre}
                onChangeText={(v) => cambiarTipo(indice, "nombre", v)}
                placeholder="General, Platea, VIP..."
                autoComplete="off"
                error={error(`tipo${indice}nombre`)}
              />
              <Campo
                etiqueta="Descripción (opcional)"
                value={tipo.descripcion}
                onChangeText={(v) => cambiarTipo(indice, "descripcion", v)}
                placeholder="Ej: Ubicación sentada"
                autoComplete="off"
              />
              <View style={styles.fila}>
                <View style={{ flex: 1 }}>
                  <Campo
                    ref={registrar(`tipo${indice}precio`)}
                    etiqueta="Precio ($)"
                    value={tipo.precio}
                    onChangeText={(v) => cambiarTipo(indice, "precio", v)}
                    inputMode="decimal"
                    keyboardType="decimal-pad"
                    placeholder="0"
                    error={error(`tipo${indice}precio`)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Campo
                    ref={registrar(`tipo${indice}cupo`)}
                    etiqueta="Cupo"
                    value={tipo.cupo}
                    onChangeText={(v) => cambiarTipo(indice, "cupo", v)}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    placeholder="100"
                    error={error(`tipo${indice}cupo`)}
                  />
                </View>
              </View>
            </Tarjeta>
          ))}
          <Boton
            titulo="Agregar tipo de entrada"
            variante="secundario"
            icono="add"
            onPress={agregarTipo}
            deshabilitado={valores.tiposEntrada.length >= 10}
          />
        </Seccion>

        {/* Pauta 9: resumen de errores anunciado de inmediato (role="alert") */}
        <ResumenErrores
          mensaje={
            intentoEnviar && camposConError.length > 0
              ? camposConError.length === 1
                ? `Revisá 1 campo: ${nombreDelCampo(camposConError[0])}.`
                : `Revisá ${camposConError.length} campos: ${camposConError.map(nombreDelCampo).join(", ")}.`
              : null
          }
        />

        <Boton
          titulo={editando ? "Guardar cambios" : "Publicar evento"}
          icono={editando ? "save-outline" : "megaphone-outline"}
          variante="acento"
          onPress={publicar}
          cargando={enviando}
        />
        <View style={{ height: espacio.xl }} />
      </Pantalla>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  indicacion: {
    fontFamily: fuentes.texto,
    fontSize: 14,
    color: colores.textoSecundario,
    marginBottom: espacio.l,
  },
  fila: { flexDirection: "row", gap: espacio.m },
  etiqueta: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto, marginBottom: 6 },
  errorFila: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  error: { flex: 1, fontFamily: fuentes.medio, color: colores.error, fontSize: 14 },
  encabezadoTipo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: espacio.m,
  },
  tipoTitulo: { fontFamily: fuentes.subtitulo, fontSize: 17, color: colores.texto },
  quitar: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
