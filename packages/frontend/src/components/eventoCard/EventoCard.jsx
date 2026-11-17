import { etiquetaMobile } from "../../utils/accesibilidad.js";
import { Icono } from "../icono/Icono.jsx";
import { StyleSheet, Text, View } from "react-native";
import {
  colorDeCategoria,
  espacio,
  fuentes,
  radio,
  relieveBase,
  stickerCategoria,
  tintaCategoria,
} from "../../theme.js";
import { fechaParaLector, formatearPrecio } from "../../utils/formato.js";
import { Galeria } from "../galeria/Galeria.jsx";
import { ImagenConCarga } from "../carga/ImagenConCarga.jsx";
import { Tarjeta } from "../tarjeta/Tarjeta.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

// Bloque de imagen del evento: foto sobre el color de su categoría + talón con la fecha
// Con `galeria`, si el evento tiene varias fotos se muestran en un carrusel (D-27)
export function ImagenEvento({
  evento,
  alto = 150,
  margenInferior = 14,
  galeria = false,
  children,
}) {
  const styles = useEstilos(crearEstilos);

  const { fondo, marca, circulo } = colorDeCategoria(evento.categoria.nombre);
  const fecha = new Date(evento.fecha);
  const imagen = evento.imagen ?? evento.multimedia?.[0];
  const conGaleria = galeria && evento.multimedia?.length > 1;
  return (
    <View
      style={[
        styles.imagenContenedor,
        { height: alto, backgroundColor: fondo, paddingBottom: margenInferior },
      ]}
    >
      {/* D-48: adorno pastel detrás de la foto (se ve si el evento no tiene foto) */}
      <View style={[styles.circulo, { backgroundColor: circulo }]} aria-hidden />
      <Text style={[styles.marcaAgua, { color: marca }]} numberOfLines={1} aria-hidden>
        {evento.categoria.nombre.toUpperCase()}
      </Text>
      {conGaleria ? (
        <Galeria imagenes={evento.multimedia} margenInferior={margenInferior} />
      ) : (
        imagen && <ImagenConCarga uri={imagen} style={StyleSheet.absoluteFill} />
      )}
      <View
        style={styles.fecha}
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <Text style={styles.fechaDia}>{String(fecha.getDate()).padStart(2, "0")}</Text>
        <Text style={styles.fechaMes}>{MESES[fecha.getMonth()]}</Text>
      </View>
      {children}
    </View>
  );
}

// Tarjeta de un evento en los listados (catálogo, favoritos, mis eventos)
export function EventoCard({ evento, onPress, pie }) {
  const { colores, texto } = useTema();
  const styles = useEstilos(crearEstilos);

  const { organizador } = evento;
  const hora = new Date(evento.fecha).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  // Un lector de pantalla lee la tarjeta como un único botón con toda la información (en orden lógico)
  const resumen = [
    evento.nombre,
    evento.categoria.nombre,
    fechaParaLector(evento.fecha),
    evento.lugar,
    evento.agotado ? "Agotado" : `desde ${formatearPrecio(evento.precioDesde)}`,
    organizador.puntajePromedio
      ? `organiza ${organizador.nombre}, puntaje ${String(organizador.puntajePromedio).replace(".", ",")} de 5`
      : `organiza ${organizador.nombre}, sin reseñas`,
    evento.esFavorito && "en tus favoritos",
  ]
    .filter(Boolean)
    .join(". ");
  return (
    <Tarjeta
      onPress={onPress}
      style={styles.tarjeta}
      {...etiquetaMobile(pie ? undefined : resumen)}
      accessibilityHint="Abre el detalle del evento"
    >
      <ImagenEvento evento={evento}>
        {evento.esFavorito && (
          <View style={styles.favorito}>
            <Icono name="heart" size={18} color={colores.acento} />
          </View>
        )}
        {evento.agotado && (
          <View style={styles.agotado}>
            <Text style={styles.agotadoTexto} aria-hidden>
              AGOTADO
            </Text>
          </View>
        )}
      </ImagenEvento>
      <View style={styles.cuerpo}>
        <Text style={texto.categoria}>{evento.categoria.nombre.toUpperCase()}</Text>
        <Text style={texto.titulo}>{evento.nombre}</Text>
        <Text style={texto.secundario}>
          {evento.lugar} · {hora} hs
        </Text>
        <View style={styles.pie}>
          <Text style={texto.cuerpo}>
            <Text style={{ color: colores.textoSecundario }}>Desde </Text>
            <Text style={styles.precio}>{formatearPrecio(evento.precioDesde)}</Text>
          </Text>
          <View style={styles.reputacion}>
            <Icono name="star" size={13} color={colores.estrella} />
            <Text style={styles.reputacionTexto}>
              {organizador.puntajePromedio ?? "Nuevo"} · {organizador.nombre}
            </Text>
          </View>
        </View>
        {pie}
      </View>
    </Tarjeta>
  );
}

const crearEstilos = ({ colores }) => ({
  tarjeta: { padding: 0, overflow: "hidden", borderRadius: radio.l + 2 },
  imagenContenedor: { overflow: "hidden", justifyContent: "flex-end", padding: 14 },
  circulo: { position: "absolute", right: 24, top: 18, width: 70, height: 70, borderRadius: 35 },
  marcaAgua: {
    position: "absolute",
    right: -10,
    top: -16,
    fontFamily: fuentes.titulo,
    fontSize: 100,
  },
  // D-48: la fecha es un sticker redondo, blanco con contorno y levemente girado (igual en ambos temas)
  fecha: {
    alignSelf: "flex-start",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: stickerCategoria,
    borderWidth: relieveBase.grosor,
    borderColor: tintaCategoria,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-8deg" }],
  },
  fechaDia: { fontFamily: fuentes.titulo, fontSize: 20, lineHeight: 22, color: tintaCategoria },
  fechaMes: { fontFamily: fuentes.negrita, fontSize: 10, letterSpacing: 1, color: tintaCategoria },
  favorito: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colores.fondo,
    borderWidth: 2,
    borderColor: colores.contorno,
    alignItems: "center",
    justifyContent: "center",
  },
  agotado: {
    position: "absolute",
    right: 12,
    bottom: 14,
    backgroundColor: colores.primario,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colores.contorno,
  },
  agotadoTexto: {
    fontFamily: fuentes.negrita,
    fontSize: 12,
    color: colores.sobrePrimario,
    letterSpacing: 1,
  },
  cuerpo: { padding: espacio.l, paddingTop: 14, gap: 5 },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  precio: { fontFamily: fuentes.negrita, fontSize: 17, color: colores.texto },
  reputacion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colores.fondo,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  reputacionTexto: { fontFamily: fuentes.semi, fontSize: 13, color: colores.texto },
});
