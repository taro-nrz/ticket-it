// D-44: envío de emails SIMULADO. Tiene la forma de un servicio real (enviar → destinatario, asunto, texto):
// cambiar a SMTP o a un proveedor (SendGrid, SES) sería otra clase con el mismo método.
// En desarrollo los mails se muestran en la consola y quedan en una bandeja que se ve en GET /dev/emails.
const MAX_BANDEJA = 50;

export class EmailSimulado {
  #bandeja = [];

  constructor({ mostrarEnConsola = true } = {}) {
    this.mostrarEnConsola = mostrarEnConsola;
  }

  async enviar({ para, asunto, texto }) {
    const email = { para, asunto, texto, fecha: new Date().toISOString() };
    this.#bandeja.unshift(email);
    this.#bandeja.length = Math.min(this.#bandeja.length, MAX_BANDEJA);
    if (this.mostrarEnConsola) {
      console.log(
        `\n📧 [email simulado] Para: ${para}\n   Asunto: ${asunto}\n   ${texto.replace(/\n/g, "\n   ")}\n`,
      );
    }
  }

  bandeja() {
    return [...this.#bandeja];
  }

  vaciar() {
    this.#bandeja = [];
  }
}
