import { Text, View } from "react-native";
import { fuentes } from "../../theme.js";
import { useTema } from "../../context/TemaContext.jsx";
import { useEstilos } from "../../hooks/useEstilos.js";

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

const crearEstilos = ({ colores }) => ({
  avatar: {
    backgroundColor: colores.acentoSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { fontFamily: fuentes.negrita, fontSize: 14, color: colores.acentoTexto },
});
