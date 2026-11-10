import { Pressable, View } from "react-native";
import { espacio } from "../../theme.js";
import { Icono } from "../icono/Icono.jsx";
import { useTema } from "../../context/TemaContext.jsx";
import { estadoPresionado } from "../../utils/accesibilidad.js";
import { useEstilos } from "../../hooks/useEstilos.js";

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

const crearEstilos = () => ({
  fila: { flexDirection: "row", alignItems: "center", gap: espacio.s },
  estrellaBoton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
});
