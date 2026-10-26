export const EstadoCompra = Object.freeze({
  PENDIENTE: "PENDIENTE",
  CONFIRMADA: "CONFIRMADA",
  UTILIZADA: "UTILIZADA",
  CANCELADA: "CANCELADA",
  REEMBOLSADA: "REEMBOLSADA",
  // D-36: la reserva no se pagó dentro del plazo y el cupo volvió a estar disponible
  VENCIDA: "VENCIDA",
});

// Máquina de estados de la compra: estado actual -> estados a los que puede pasar
export const TRANSICIONES_VALIDAS = Object.freeze({
  [EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA, EstadoCompra.VENCIDA],
  [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.CANCELADA],
  [EstadoCompra.CANCELADA]: [EstadoCompra.REEMBOLSADA],
  [EstadoCompra.UTILIZADA]: [],
  [EstadoCompra.REEMBOLSADA]: [],
  [EstadoCompra.VENCIDA]: [],
});
