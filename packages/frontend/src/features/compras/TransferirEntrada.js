import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { transferirCompra } from "../../api/api.js";
import { ModalAccesible } from "../../components/ModalAccesible.js";
import { Boton, Campo } from "../../components/ui.js";
import { useTema } from "../../store/TemaContext.js";
import { espacio } from "../../theme.js";
import { avisarExito } from "../../utils/confirmar.js";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// D-41: pasarle la entrada a otra persona. Se explica qué cambia antes de confirmar (no se puede deshacer).
export function TransferirEntrada({ compra, visible, onCerrar }) {
  const { texto } = useTema();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const transferir = async () => {
    if (!EMAIL_VALIDO.test(email.trim())) {
      setError("Ingresá el email de la cuenta que va a recibir la entrada");
      return;
    }
    setEnviando(true);
    try {
      const { transferidaA } = await transferirCompra(compra.id, email.trim());
      onCerrar();
      avisarExito(`Le pasaste la entrada a ${transferidaA.nombre} ${transferidaA.apellido}`);
      router.replace("/mis-compras");
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ModalAccesible visible={visible} onCerrar={onCerrar} titulo="Transferir la entrada">
      <Text style={texto.cuerpo}>
        La otra persona va a recibir{" "}
        {compra.cantidad === 1 ? "la entrada" : `las ${compra.cantidad} entradas`} con un código QR
        nuevo: el tuyo deja de servir y la compra sale de tu cuenta. No se puede deshacer.
      </Text>
      <Campo
        etiqueta="Email de quien la recibe"
        value={email}
        onChangeText={(valor) => {
          setEmail(valor);
          setError(null);
        }}
        error={error}
        ayuda="Tiene que tener una cuenta de comprador en AI Ticket It."
        placeholder="amiga@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: espacio.s }}>
        <Boton
          titulo="No, conservarla"
          variante="secundario"
          onPress={onCerrar}
          style={{ flexGrow: 1, flexBasis: 140 }}
        />
        <Boton
          titulo="Transferir"
          icono="paper-plane-outline"
          onPress={transferir}
          cargando={enviando}
          style={{ flexGrow: 1, flexBasis: 140 }}
        />
      </View>
    </ModalAccesible>
  );
}
