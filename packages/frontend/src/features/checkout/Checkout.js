import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getCompra, pagarCompra } from "../../api/api.js";
import { Icono } from "../../components/Icono.js";
import { BarraVolver, Pantalla } from "../../components/Pantalla.js";
import { Boton, Campo, ErrorVista, ResumenErrores, Seccion, Tarjeta } from "../../components/ui.js";
import { useCarga } from "../../hooks/useCarga.js";
import { useEstilos } from "../../hooks/useEstilos.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio, fuentes, radio } from "../../theme.js";
import { anunciar, etiquetaMobile } from "../../utils/accesibilidad.js";
import { avisarExito } from "../../utils/confirmar.js";
import { formatearHora, formatearPrecio } from "../../utils/formato.js";
import { EsqueletoFormulario } from "../../components/Carga.js";

// Tarjetas de la pasarela simulada (backend: services/pasarelaPago.js)
const TARJETAS_DE_PRUEBA = [
  { numero: "4242 4242 4242 4242", resultado: "Aprobada" },
  { numero: "4000 0000 0000 0002", resultado: "Rechazada: sin fondos" },
];

const NOMBRES = {
  numero: "número de tarjeta",
  titular: "titular",
  vencimiento: "vencimiento",
  cvv: "código de seguridad",
};

// Agrupa los dígitos de a 4 mientras se escribe ("4242424242424242" → "4242 4242 4242 4242")
const formatearNumero = (texto) =>
  texto
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

// "1230" → "12/30"
const formatearVencimiento = (texto) => {
  const digitos = texto.replace(/\D/g, "").slice(0, 4);
  return digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
};

function validar({ numero, titular, vencimiento, cvv }) {
  const errores = {};
  if (numero.replace(/\D/g, "").length < 13) errores.numero = "Ingresá los números de la tarjeta";
  if (titular.trim().length < 3) errores.titular = "Ingresá el nombre como figura en la tarjeta";
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(vencimiento))
    errores.vencimiento = "Usá el formato MM/AA, por ejemplo 08/29";
  if (!/^\d{3,4}$/.test(cvv)) errores.cvv = "Son los 3 o 4 números del dorso";
  return errores;
}

// D-37: checkout del pago (simulado). Pide la tarjeta, la valida y muestra el rechazo si lo hay.
export default function Checkout() {
  const { texto } = useTema();
  const styles = useEstilos(crearEstilos);
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { datos: compra, cargandoInicial, error, recargar } = useCarga(() => getCompra(id), [id]);

  const [valores, setValores] = useState({ numero: "", titular: "", vencimiento: "", cvv: "" });
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [erroresServidor, setErroresServidor] = useState({});
  const [rechazo, setRechazo] = useState(null);
  const [pagando, setPagando] = useState(false);
  const campos = useRef({});

  if (cargandoInicial) {
    return (
      <View style={{ flex: 1 }}>
        <BarraVolver subtitulo="Tu compra" titulo="Pagar" />
        <EsqueletoFormulario campos={4} etiqueta="Preparando el pago" />
      </View>
    );
  }
  if (error) return <ErrorVista error={error} onReintentar={recargar} />;

  const gratis = compra.total === 0;
  const errores = { ...validar(valores), ...erroresServidor };
  const conError = Object.keys(errores);
  const error_ = (campo) => (intentoEnviar ? errores[campo] : undefined);
  const cambiar =
    (campo, formato = (v) => v) =>
    (valor) => {
      setValores((actuales) => ({ ...actuales, [campo]: formato(valor) }));
      setErroresServidor(({ [campo]: _quitado, ...resto }) => resto);
      setRechazo(null);
    };
  const registrar = (campo) => (el) => {
    campos.current[campo] = el;
  };

  const pagar = async () => {
    if (!gratis) {
      setIntentoEnviar(true);
      if (conError.length) {
        campos.current[conError[0]]?.focus();
        anunciar(`Hay ${conError.length} datos para corregir`);
        return;
      }
    }
    setPagando(true);
    try {
      await pagarCompra(compra.id, gratis ? undefined : valores);
      avisarExito(
        gratis
          ? "¡Listo! Tu entrada está confirmada."
          : "¡Pago aprobado! Tu entrada ya está lista.",
      );
      router.replace(`/compra/${compra.id}`);
    } catch (e) {
      if (e.errores?.length) {
        // "tarjeta.numero" → "numero"
        setErroresServidor(
          Object.fromEntries(
            e.errores.map((err) => [err.campo.replace("tarjeta.", ""), err.mensaje]),
          ),
        );
      } else {
        setRechazo(e.message);
      }
    } finally {
      setPagando(false);
    }
  };

  const resumen =
    rechazo ??
    (intentoEnviar && conError.length
      ? `Revisá ${conError.length === 1 ? "1 dato" : `${conError.length} datos`}: ${conError
          .map((campo) => NOMBRES[campo] ?? campo)
          .join(", ")}.`
      : null);

  return (
    <View style={{ flex: 1 }}>
      <BarraVolver subtitulo={compra.evento.nombre} titulo="Pagar" />
      <Pantalla>
        <Tarjeta style={styles.resumen}>
          <View style={styles.fila}>
            <Text style={texto.cuerpo}>
              {compra.cantidad} × {compra.tipoEntrada.nombre}
            </Text>
            <Text style={styles.total}>{formatearPrecio(compra.total)}</Text>
          </View>
          {compra.venceEn && (
            <Text style={texto.chico}>
              Tenés hasta las {formatearHora(compra.venceEn)} para pagar.
            </Text>
          )}
        </Tarjeta>

        {gratis ? (
          <Text style={[texto.secundario, { marginBottom: espacio.l }]}>
            Esta entrada es gratis: no hace falta ninguna tarjeta.
          </Text>
        ) : (
          <>
            <Seccion titulo="Tarjeta de crédito o débito">
              <Campo
                ref={registrar("numero")}
                etiqueta="Número de tarjeta"
                value={valores.numero}
                onChangeText={cambiar("numero", formatearNumero)}
                error={error_("numero")}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                keyboardType="number-pad"
                autoComplete="cc-number"
                textContentType="creditCardNumber"
              />
              <Campo
                ref={registrar("titular")}
                etiqueta="Nombre del titular"
                value={valores.titular}
                onChangeText={cambiar("titular")}
                error={error_("titular")}
                placeholder="Como figura en la tarjeta"
                autoCapitalize="characters"
                autoComplete="cc-name"
                textContentType="name"
              />
              <View style={styles.fila}>
                <View style={{ flex: 1 }}>
                  <Campo
                    ref={registrar("vencimiento")}
                    etiqueta="Vencimiento"
                    ayuda="MM/AA"
                    value={valores.vencimiento}
                    onChangeText={cambiar("vencimiento", formatearVencimiento)}
                    error={error_("vencimiento")}
                    placeholder="08/29"
                    inputMode="numeric"
                    keyboardType="number-pad"
                    autoComplete="cc-exp"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Campo
                    ref={registrar("cvv")}
                    etiqueta="Código de seguridad"
                    ayuda="3 o 4 números del dorso"
                    value={valores.cvv}
                    onChangeText={cambiar("cvv", (v) => v.replace(/\D/g, "").slice(0, 4))}
                    error={error_("cvv")}
                    placeholder="123"
                    inputMode="numeric"
                    keyboardType="number-pad"
                    secureTextEntry
                    autoComplete="cc-csc"
                  />
                </View>
              </View>
            </Seccion>

            <View style={styles.prueba}>
              <View style={styles.fila}>
                <Icono name="flask-outline" size={18} color={styles.pruebaTexto.color} />
                <Text style={[styles.pruebaTexto, { flex: 1 }]}>
                  Pago simulado: no se cobra nada. Usá una tarjeta de prueba (vencimiento futuro y
                  cualquier código).
                </Text>
              </View>
              {TARJETAS_DE_PRUEBA.map((tarjeta) => (
                <Pressable
                  key={tarjeta.numero}
                  onPress={() => {
                    setValores({
                      numero: tarjeta.numero,
                      titular: valores.titular || "TITULAR DE PRUEBA",
                      vencimiento: "12/30",
                      cvv: "123",
                    });
                    setErroresServidor({});
                    setRechazo(null);
                    anunciar(`Se cargó la tarjeta de prueba ${tarjeta.resultado.toLowerCase()}`);
                  }}
                  accessibilityRole="button"
                  {...etiquetaMobile(`Usar tarjeta de prueba ${tarjeta.resultado}`)}
                  style={styles.tarjetaPrueba}
                >
                  <Text style={styles.tarjetaPruebaNumero}>{tarjeta.numero}</Text>
                  <Text style={styles.pruebaTexto}>{tarjeta.resultado}</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        <ResumenErrores mensaje={resumen} />
        <Boton
          titulo={gratis ? "Confirmar entrada gratis" : `Pagar ${formatearPrecio(compra.total)}`}
          icono={gratis ? "checkmark-circle-outline" : "lock-closed-outline"}
          variante="acento"
          onPress={pagar}
          cargando={pagando}
        />
        <View style={styles.seguro}>
          <Icono name="shield-checkmark-outline" size={16} color={styles.pruebaTexto.color} />
          <Text style={texto.chico}>
            No guardamos el número ni el código: sólo la marca y los últimos 4 dígitos.
          </Text>
        </View>
      </Pantalla>
    </View>
  );
}

const crearEstilos = ({ colores }) => ({
  resumen: { gap: 6, marginBottom: espacio.xl },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacio.m,
    justifyContent: "space-between",
  },
  total: { fontFamily: fuentes.titulo, fontSize: 24, color: colores.texto },
  prueba: {
    backgroundColor: colores.apagado,
    borderRadius: radio.m,
    padding: 14,
    gap: 10,
    marginBottom: espacio.l,
  },
  pruebaTexto: { fontFamily: fuentes.texto, fontSize: 13, color: colores.textoSecundario },
  tarjetaPrueba: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
    backgroundColor: colores.superficie,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: radio.s,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    alignContent: "center",
  },
  tarjetaPruebaNumero: { fontFamily: fuentes.semi, fontSize: 15, color: colores.texto },
  seguro: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    marginTop: espacio.m,
  },
});
