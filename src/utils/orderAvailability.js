/**
 * Deriva el tipo de entrega/disponibilidad de un pedido a partir de sus notas.
 * Las notas se guardan al crear el pedido desde el carrito.
 * @param {string} [notes] - Campo notes del pedido
 * @returns {{ type: string, label: string, subtitle: string, icon: string } | null}
 */
export function getOrderAvailabilityFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return null;
  const n = notes.trim();
  if (n.includes('Disponible ahora') || n.includes('Disponible en sucursal')) {
    return {
      type: 'local_delivery',
      label: 'Entrega a domicilio o en tienda',
      subtitle: 'Disponible ahora · Recoge o recibe en casa',
      icon: '🚚',
    };
  }
  if (n.includes('Solo en línea') || n.includes('recoger en sucursal') || n.includes('Tienda Online')) {
    return {
      type: 'online_pickup',
      label: 'Venta solo en tienda online',
      subtitle: 'Compra en línea · Recoges en sucursal (6 a 12 días)',
      icon: '🛒',
    };
  }
  if (n.includes('Solo en sucursal') || n.includes('in_store')) {
    return {
      type: 'in_store_only',
      label: 'Solo en sucursal',
      subtitle: 'Servicio presencial · Recoge en tienda',
      icon: '📍',
    };
  }
  return null;
}
