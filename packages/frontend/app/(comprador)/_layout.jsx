import { Redirect, Tabs } from "expo-router";
import { iconoTab, opcionesTabs } from "../../src/components/tabs/tabs.jsx";
import { useSesion } from "../../src/context/SesionContext.jsx";
import { useTema } from "../../src/context/TemaContext.jsx";

// Navegación del comprador
export default function TabsComprador() {
  const { esComprador } = useSesion();
  const { colores } = useTema();
  if (!esComprador) return <Redirect href="/" />;

  return (
    <Tabs screenOptions={opcionesTabs(colores)}>
      <Tabs.Screen
        name="explorar"
        options={{ title: "Explorar", tabBarIcon: iconoTab("search", colores) }}
      />
      <Tabs.Screen
        name="mis-compras"
        options={{ title: "Mis entradas", tabBarIcon: iconoTab("ticket", colores) }}
      />
      <Tabs.Screen
        name="favoritos"
        options={{ title: "Favoritos", tabBarIcon: iconoTab("heart", colores) }}
      />
    </Tabs>
  );
}
