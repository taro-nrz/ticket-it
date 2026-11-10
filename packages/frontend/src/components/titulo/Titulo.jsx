import { Text } from "react-native";

// Pauta 5: títulos como encabezados (en web, <h1>/<h2>), para navegar por títulos con el lector
export function Titulo({ nivel = 2, style, children, ...props }) {
  return (
    <Text role="heading" aria-level={nivel} accessibilityRole="header" style={style} {...props}>
      {children}
    </Text>
  );
}
