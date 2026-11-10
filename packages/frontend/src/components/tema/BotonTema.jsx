import { Pressable } from "react-native";
import { PREFERENCIAS, useTema } from "../../context/TemaContext.jsx";
import { anunciar } from "../../utils/accesibilidad.js";
import { Icono } from "../icono/Icono.jsx";

const INFO_PREFERENCIA = {
  sistema: { icono: "contrast-outline", etiqueta: "como el sistema" },
  claro: { icono: "sunny-outline", etiqueta: "claro" },
  oscuro: { icono: "moon-outline", etiqueta: "oscuro" },
};

// D-22: cambia el tema recorriendo Sistema → Claro → Oscuro. El nombre dice el tema actual y el siguiente.
export function BotonTema({ sobrePanel = false }) {
  const { colores, preferencia, setPreferencia } = useTema();
  const siguiente = PREFERENCIAS[(PREFERENCIAS.indexOf(preferencia) + 1) % PREFERENCIAS.length];
  const actual = INFO_PREFERENCIA[preferencia];

  const cambiar = () => {
    setPreferencia(siguiente);
    anunciar(`Tema ${INFO_PREFERENCIA[siguiente].etiqueta}`);
  };

  return (
    <Pressable
      onPress={cambiar}
      accessibilityRole="button"
      accessibilityLabel={`Tema: ${actual.etiqueta}. Cambiar a ${INFO_PREFERENCIA[siguiente].etiqueta}`}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: sobrePanel ? colores.sobrePanelSuave : colores.bordeControl,
      }}
    >
      <Icono
        name={actual.icono}
        size={20}
        color={sobrePanel ? colores.sobrePanel : colores.texto}
      />
    </Pressable>
  );
}
