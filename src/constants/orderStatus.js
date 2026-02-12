/**
 * Estados del pedido - alineados con el backend (flujo recoger en tienda).
 */

export const ORDER_STATUS = {
  CREATED: 'CREATED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  PARTIALLY_AVAILABLE: 'PARTIALLY_AVAILABLE',
  AVAILABLE: 'AVAILABLE',
  IN_PREPARATION: 'IN_PREPARATION',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const STATUS_LABELS = {
  [ORDER_STATUS.CREATED]: 'Creado',
  [ORDER_STATUS.UNDER_REVIEW]: 'En revisión',
  [ORDER_STATUS.PARTIALLY_AVAILABLE]: 'Parcialmente disponible',
  [ORDER_STATUS.AVAILABLE]: 'Disponible',
  [ORDER_STATUS.IN_PREPARATION]: 'En preparación',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Listo para recoger',
  [ORDER_STATUS.COMPLETED]: 'Entregado',
  [ORDER_STATUS.CANCELLED]: 'Cancelado',
};

export const STATUS_COLORS = {
  [ORDER_STATUS.CREATED]: '#95a5a6',
  [ORDER_STATUS.UNDER_REVIEW]: '#f39c12',
  [ORDER_STATUS.PARTIALLY_AVAILABLE]: '#e67e22',
  [ORDER_STATUS.AVAILABLE]: '#3498db',
  [ORDER_STATUS.IN_PREPARATION]: '#9b59b6',
  [ORDER_STATUS.READY_FOR_PICKUP]: '#2ecc71',
  [ORDER_STATUS.COMPLETED]: '#27ae60',
  [ORDER_STATUS.CANCELLED]: '#e74c3c',
};

/** Estados en los que el cliente puede aceptar o cancelar el pedido */
export const CAN_ACCEPT_OR_CANCEL = [
  ORDER_STATUS.PARTIALLY_AVAILABLE,
  ORDER_STATUS.AVAILABLE,
];

/** Mensaje corto para lista (ej. UNDER_REVIEW) */
export const STATUS_LIST_MESSAGE = {
  [ORDER_STATUS.UNDER_REVIEW]: 'Estamos revisando la disponibilidad de tus productos.',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Tu pedido ya está listo para recoger en sucursal.',
};

/** Pasos del flujo para timeline (cliente y admin) */
export const ORDER_TIMELINE_STEPS = [
  { key: ORDER_STATUS.UNDER_REVIEW, label: 'En revisión' },
  { key: 'AVAILABLE_OR_PARTIAL', label: 'Disponibilidad' },
  { key: ORDER_STATUS.IN_PREPARATION, label: 'En preparación' },
  { key: ORDER_STATUS.READY_FOR_PICKUP, label: 'Listo para recoger' },
  { key: ORDER_STATUS.COMPLETED, label: 'Entregado' },
];

/** Índice del paso actual según estado */
export function getTimelineStepIndex(status) {
  const map = {
    [ORDER_STATUS.CREATED]: 0,
    [ORDER_STATUS.UNDER_REVIEW]: 0,
    [ORDER_STATUS.PARTIALLY_AVAILABLE]: 1,
    [ORDER_STATUS.AVAILABLE]: 1,
    [ORDER_STATUS.IN_PREPARATION]: 2,
    [ORDER_STATUS.READY_FOR_PICKUP]: 3,
    [ORDER_STATUS.COMPLETED]: 4,
    [ORDER_STATUS.CANCELLED]: -1,
  };
  return map[status] ?? 0;
}

/** Mensaje de "qué sigue" para el cliente según estado */
export const STATUS_NEXT_STEP_MESSAGE = {
  [ORDER_STATUS.UNDER_REVIEW]: 'Estamos revisando la disponibilidad de los productos. Te notificaremos cuando esté listo.',
  [ORDER_STATUS.PARTIALLY_AVAILABLE]: 'Algunos productos no están disponibles. Revisa el total y acepta o cancela el pedido.',
  [ORDER_STATUS.AVAILABLE]: 'Todos los productos están disponibles. Acepta el pedido para que lo preparemos.',
  [ORDER_STATUS.IN_PREPARATION]: 'Tu pedido está en preparación. Te avisaremos cuando esté listo para recoger.',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Tu pedido está listo. Pásate por la sucursal a recogerlo.',
  [ORDER_STATUS.COMPLETED]: 'Gracias por tu compra.',
  [ORDER_STATUS.CANCELLED]: 'Este pedido fue cancelado.',
};

export const STATUS_OPTIONS_FILTER = [
  { value: '', label: 'Todos' },
  { value: ORDER_STATUS.UNDER_REVIEW, label: 'En revisión' },
  { value: ORDER_STATUS.PARTIALLY_AVAILABLE, label: 'Parcialmente disponible' },
   { value: ORDER_STATUS.IN_PREPARATION, label: 'En preparación' },
  { value: ORDER_STATUS.READY_FOR_PICKUP, label: 'Listo para recoger' } 
 ];
 