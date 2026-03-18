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
  IN_TRANSIT: 'IN_TRANSIT',   // En camino (envío a domicilio)
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
  [ORDER_STATUS.IN_TRANSIT]: 'En camino',
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
  [ORDER_STATUS.IN_TRANSIT]: '#1abc9c',
  [ORDER_STATUS.COMPLETED]: '#27ae60',
  [ORDER_STATUS.CANCELLED]: '#e74c3c',
};

/** Estados en los que el cliente puede aceptar o cancelar el pedido */
export const CAN_ACCEPT_OR_CANCEL = [
  ORDER_STATUS.PARTIALLY_AVAILABLE,
  ORDER_STATUS.AVAILABLE,
];

/** Pasos del flujo para timeline (cliente y admin); IN_TRANSIT y READY_FOR_PICKUP comparten paso. */
export const ORDER_TIMELINE_STEPS = [
  { key: ORDER_STATUS.UNDER_REVIEW, label: 'En revisión' },
  { key: 'AVAILABLE_OR_PARTIAL', label: 'Disponibilidad' },
  { key: ORDER_STATUS.IN_PREPARATION, label: 'En preparación' },
  { key: ORDER_STATUS.READY_FOR_PICKUP, label: 'Listo para recoger / En camino' },
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
    [ORDER_STATUS.IN_TRANSIT]: 3,
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
  [ORDER_STATUS.IN_PREPARATION]: 'Tu pedido está en preparación. Te avisaremos cuando esté listo para recoger o en camino.',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Tu pedido está listo. Pásate por la sucursal a recogerlo.',
  [ORDER_STATUS.IN_TRANSIT]: 'Tu pedido está en camino a tu domicilio.',
  [ORDER_STATUS.COMPLETED]: 'Gracias por tu compra.',
  [ORDER_STATUS.CANCELLED]: 'Este pedido fue cancelado. Te invitamos a explorar más productos cuando quieras.',
};

/** Mensaje cuando no hay ningún producto disponible (Parcialmente disponible con total 0) */
export const NO_AVAILABILITY_MESSAGE = {
  title: 'En este momento no tenemos disponibilidad',
  body: 'Los productos de tu pedido no están disponibles por el momento. Puedes cancelar este pedido y te invitamos a explorar otros productos; estamos seguros de que encontrarás algo que te guste.',
  ctaExplore: 'Explorar productos',
  ctaCancel: 'Cancelar pedido',
};

/** Filtro especial (solo cliente): pedidos que requieren confirmación (AVAILABLE + PARTIALLY_AVAILABLE) */
export const FILTER_NEEDS_CONFIRMATION = 'NEEDS_CONFIRMATION';

/** Mensaje corto para lista de pedidos */
export const STATUS_LIST_MESSAGE = {
  [ORDER_STATUS.UNDER_REVIEW]: 'Estamos revisando la disponibilidad de tus productos.',
  [ORDER_STATUS.PARTIALLY_AVAILABLE]: 'Algunos productos no están disponibles. Confirma o cancela tu pedido.',
  [ORDER_STATUS.AVAILABLE]: 'Productos disponibles. Confirma tu pedido para continuar.',
  [ORDER_STATUS.READY_FOR_PICKUP]: 'Tu pedido ya está listo para recoger en sucursal.',
  [ORDER_STATUS.IN_TRANSIT]: 'Tu pedido está en camino.',
};

/** Solo dos opciones: Todos y Confirma tus pedidos (requieren atención inmediata) */
export const STATUS_OPTIONS_FILTER = [
  { value: '', label: 'Todos' },
  { value: FILTER_NEEDS_CONFIRMATION, label: 'Confirma tus pedidos' },
];
 