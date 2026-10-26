// D-44: código de un solo uso para restablecer la contraseña. Se guarda sólo su hash.
export const MINUTOS_CODIGO = 15;
export const MAX_INTENTOS_CODIGO = 5;

export class CodigoRecuperacion {
  id;
  intentos = 0;
  usado = false;

  constructor({ usuario, hash, creado, minutos = MINUTOS_CODIGO }) {
    this.usuario = usuario;
    this.hash = hash;
    this.venceEn = new Date(new Date(creado).getTime() + minutos * 60 * 1000);
  }

  vigente(ahora) {
    return !this.usado && ahora < this.venceEn && this.intentos < MAX_INTENTOS_CODIGO;
  }

  registrarIntentoFallido() {
    this.intentos += 1;
  }

  usar() {
    this.usado = true;
  }
}
