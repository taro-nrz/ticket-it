import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";
import { crearCupon, desactivarCupon, getCupones } from "../../service/cuponesService.js";
import { getEvento } from "../../service/eventosService.js";
import { CampoFecha } from "../../components/campoFecha/CampoFecha.jsx";
import { BarraVolver } from "../../components/encabezado/BarraVolver.jsx";
import { Pantalla } from "../../components/pantalla/Pantalla.jsx";
import { Boton } from "../../components/boton/Boton.jsx";
import { Campo } from "../../components/formulario/Campo.jsx";
import { Chips } from "../../components/chips/Chips.jsx";
import { ErrorVista } from "../../components/estados/ErrorVista.jsx";
import { ResumenErrores } from "../../components/formulario/ResumenErrores.jsx";
import { Seccion } from "../../components/seccion/Seccion.jsx";
import { Tarjeta } from "../../components/tarjeta/Tarjeta.jsx";
import { Vacio } from "../../components/estados/Vacio.jsx";
import { useCarga } from "../../hooks/useCarga.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useFormulario } from "../../hooks/useFormulario.js";
import { useTema } from "../../context/TemaContext.jsx";
import { espacio, fuentes, radio } from "../../theme.js";
import { avisarError, avisarExito, confirmar } from "../../utils/confirmar.js";
import { formatearFecha } from "../../utils/formato.js";
import { BarraCargando } from "../../components/carga/BarraCargando.jsx";
import { EsqueletoFilas } from "../../components/carga/Esqueletos.jsx";

const TIPOS = [
  { valor: "PORCENTAJE", etiqueta: "Porcentaje" },
  { valor: "MONTO_FIJO", etiqueta: "Monto fijo" },
  { valor: "DOS_POR_UNO", etiqueta: "2×1" },
];

const vacio = { tipo: "PORCENTAJE", codigo: "", valor: "", usosMaximos: "", vence: "" };

function validar(valores) {
  const errores = {};
  if (!/^[A-Za-z0-9]{3,20}$/.test(valores.codigo))
    errores.codigo = "Usá entre 3 y 20 letras o números, sin espacios";
  if (valores.tipo === "PORCENTAJE") {
    const n = Number(valores.valor);
    if (!Number.isInteger(n) || n < 1 || n > 100) errores.valor = "Un número entero de 1 a 100";
  }
  if (valores.tipo === "MONTO_FIJO" && !(Number(valores.valor) > 0))
    errores.valor = "Un monto mayor a 0";
  if (
    valores.usosMaximos &&
    !(Number.isInteger(Number(valores.usosMaximos)) && Number(valores.usosMaximos) > 0)
  )
    errores.usosMaximos = "Dejalo vacío para que no tenga límite, o un número mayor a 0";
  return errores;
}

// D-38: el organizador crea y desactiva los cupones de descuento de su evento
export default function Cupones() {
  const { texto } = useTema();
  const { id } = useLocalSearchParams();
  const { datos: evento } = useCarga(() => getEvento(id), [id]);
  const {
    datos: cupones,
    cargandoInicial,
    recargando,
    error,
    recargar,
  } = useCarga(() => getCupones(id), [id]);

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver subtitulo="Tu evento" titulo="Cupones" />
        <View style={{ padding: espacio.xl }}>
          <EsqueletoFilas etiqueta="Cargando los cupones" cantidad={3} conAvatar={false} />
        </View>
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const desactivar = async (cupon) => {
    const confirmado = await confirmar({
      titulo: `¿Desactivar ${cupon.codigo}?`,
      mensaje: "Nadie más va a poder usarlo. Las compras que ya lo usaron no cambian.",
      textoConfirmar: "Sí, desactivar",
      textoCancelar: "No, dejarlo activo",
      peligro: true,
    });
    if (!confirmado) return;
    try {
      await desactivarCupon(id, cupon.id);
      avisarExito(`Desactivaste el cupón ${cupon.codigo}`);
      recargar();
    } catch (e) {
      avisarError("No se pudo desactivar el cupón", e.message);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo={evento?.nombre ?? "Evento"} titulo="Cupones" />
      <BarraCargando activa={recargando} />
      <Pantalla>
        <Text style={[texto.secundario, { marginBottom: espacio.l }]}>
          Los compradores escriben el código al comprar y ven el descuento antes de pagar.
        </Text>
        <Seccion titulo="Cupones del evento">
          {cupones.length === 0 ? (
            <Vacio
              icono="pricetags-outline"
              mensaje="Todavía no creaste cupones para este evento"
            />
          ) : (
            cupones.map((cupon) => (
              <ItemCupon key={cupon.id} cupon={cupon} onDesactivar={() => desactivar(cupon)} />
            ))
          )}
        </Seccion>
        {evento?.puedeEditarse && <NuevoCupon eventoId={id} onCreado={recargar} />}
      </Pantalla>
    </View>
  );
}

function ItemCupon({ cupon, onDesactivar }) {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const usos =
    cupon.usosMaximos === null
      ? `${cupon.usos} usos · sin límite`
      : `${cupon.usos} de ${cupon.usosMaximos} usos`;
  return (
    <Tarjeta style={[styles.item, !cupon.disponible && { opacity: 0.7 }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.filaTitulo}>
          <Text style={styles.codigo}>{cupon.codigo}</Text>
          <Text
            style={[styles.estado, cupon.disponible ? styles.estadoActivo : styles.estadoInactivo]}
          >
            {cupon.disponible ? "Activo" : cupon.activo ? "Agotado o vencido" : "Desactivado"}
          </Text>
        </View>
        <Text style={texto.cuerpo}>{cupon.descripcion}</Text>
        <Text style={texto.chico}>
          {usos}
          {cupon.vence ? ` · vence ${formatearFecha(cupon.vence)}` : ""}
        </Text>
      </View>
      {cupon.activo && (
        <Boton
          titulo="Desactivar"
          variante="peligro"
          onPress={onDesactivar}
          accessibilityHint={`Desactiva el cupón ${cupon.codigo}`}
          style={{ paddingHorizontal: 14 }}
        />
      )}
    </Tarjeta>
  );
}

function NuevoCupon({ eventoId, onCreado }) {
  const {
    valores,
    setValores,
    cambiar,
    error,
    registrar,
    enviar,
    enviando,
    errorGeneral,
    reiniciar,
  } = useFormulario({
    inicial: vacio,
    validar,
    palabra: "dato",
    alEnviar: async (valores) => {
      const cupon = await crearCupon(eventoId, {
        tipo: valores.tipo,
        codigo: valores.codigo,
        ...(valores.tipo === "PORCENTAJE" && { porcentaje: Number(valores.valor) }),
        ...(valores.tipo === "MONTO_FIJO" && { monto: Number(valores.valor) }),
        usosMaximos: valores.usosMaximos ? Number(valores.usosMaximos) : null,
        vence: valores.vence ? new Date(`${valores.vence}T23:59:59`).toISOString() : null,
      });
      reiniciar();
      avisarExito(`Creaste el cupón ${cupon.codigo}`);
      onCreado();
    },
  });

  return (
    <Seccion titulo="Nuevo cupón">
      <Tarjeta>
        <Chips
          opciones={TIPOS}
          seleccionada={valores.tipo}
          onSeleccionar={(tipo) => setValores((actuales) => ({ ...actuales, tipo, valor: "" }))}
          etiqueta="Tipo de descuento"
        />
        <View style={{ height: espacio.m }} />
        <Campo
          ref={registrar("codigo")}
          etiqueta="Código"
          value={valores.codigo}
          onChangeText={cambiar("codigo", (valor) => valor.toUpperCase())}
          error={error("codigo")}
          placeholder="Ej: PROMO20"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
        />
        {valores.tipo !== "DOS_POR_UNO" && (
          <Campo
            ref={registrar("valor")}
            etiqueta={
              valores.tipo === "PORCENTAJE"
                ? "Porcentaje de descuento (%)"
                : "Monto a descontar ($)"
            }
            value={valores.valor}
            onChangeText={cambiar("valor")}
            error={error("valor")}
            inputMode="numeric"
            keyboardType="number-pad"
          />
        )}
        <Campo
          ref={registrar("usosMaximos")}
          etiqueta="Cantidad de usos (opcional)"
          ayuda="Vacío: sin límite"
          value={valores.usosMaximos}
          onChangeText={cambiar("usosMaximos")}
          error={error("usosMaximos")}
          inputMode="numeric"
          keyboardType="number-pad"
        />
        <CampoFecha
          etiqueta="Vence (opcional)"
          valor={valores.vence}
          onCambiar={cambiar("vence")}
          minimo={new Date()}
        />
        {valores.vence ? (
          <Boton
            titulo="Quitar el vencimiento"
            variante="secundario"
            onPress={() => cambiar("vence")("")}
            style={{ marginBottom: espacio.m }}
          />
        ) : null}
        <ResumenErrores mensaje={errorGeneral} />
        <Boton titulo="Crear cupón" icono="add" onPress={enviar} cargando={enviando} />
      </Tarjeta>
    </Seccion>
  );
}

const crearEstilos = ({ colores }) => ({
  item: { flexDirection: "row", alignItems: "center", gap: espacio.m, marginBottom: 10 },
  filaTitulo: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  codigo: { fontFamily: fuentes.titulo, fontSize: 18, letterSpacing: 1, color: colores.texto },
  estado: {
    fontFamily: fuentes.negrita,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radio.m,
    overflow: "hidden",
  },
  estadoActivo: { backgroundColor: colores.acentoSuave, color: colores.acentoTexto },
  estadoInactivo: { backgroundColor: colores.apagado, color: colores.textoSecundario },
});
