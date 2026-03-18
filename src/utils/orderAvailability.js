/**
 * Obtiene la leyenda e ícono de entrega a partir del deliveryType del pedido (API).
 * shortLabel: texto breve para pill en lista (Mis Pedidos).
 * @param {{ code?: string, name?: string } | null} [deliveryType] - deliveryType del pedido
 * @returns {{ type: string, label: string, shortLabel: string, subtitle: string, icon: string } | null}
 */
export function getOrderDeliveryDisplay(deliveryType) {
  if (!deliveryType?.code) return null;
  const code = String(deliveryType.code).toLowerCase();
  if (code === 'delivery') {
    return {
      type: 'delivery',
      label: 'Entrega a domicilio',
      shortLabel: 'Domicilio',
      subtitle: '',
      icon: '🚚',
    };
  }
  if (code === 'pickup') {
    return {
      type: 'pickup',
      label: 'Recoger en sucursal',
      shortLabel: 'Recoger',
      subtitle: '',
      icon: '📍',
    };
  }
  if (deliveryType.name) {
    return {
      type: code || 'other',
      label: deliveryType.name,
      shortLabel: deliveryType.name.length > 12 ? deliveryType.name.slice(0, 12) + '…' : deliveryType.name,
      subtitle: '',
      icon: '📦',
    };
  }
  return null;
}

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
      shortLabel: 'Domicilio',
      subtitle: '',
      icon: '🚚',
    };
  }
  if (n.includes('Solo en línea') || n.includes('recoger en sucursal') || n.includes('Tienda Online')) {
    return {
      type: 'online_pickup',
      label: 'Venta solo en tienda Online',
      shortLabel: 'Recoger',
      subtitle: 'Recoges en sucursal en 6 a 12 días',
      icon: '🛒',
    };
  }
  if (n.includes('Solo en sucursal') || n.includes('in_store')) {
    return {
      type: 'in_store_only',
      label: 'Solo en sucursal',
      shortLabel: 'Recoger',
      subtitle: 'Servicio presencial · Recoge en tienda',
      icon: '📍',
    };
  }
  return null;
}

/**
 * Mensaje de disponibilidad para pedidos listos (READY_FOR_PICKUP / IN_TRANSIT) según readyAt vs ahora.
 * - Si readyAt <= ahora: "Disponible desde este momento"
 * - Si mismo día pero hora futura: "Disponible a partir de las [hora]"
 * - Si es otro día: "Disponible a partir del [día]"
 * @param {string|Date} [readyAt] - Fecha/hora en que está listo para entrega/recoger
 * @returns {{ message: string, shortMessage: string } | { message: null, shortMessage: null }}
 */
export function getReadyAtAvailabilityMessage(readyAt) {
  if (!readyAt) return { message: null, shortMessage: null };
  const ready = new Date(readyAt);
  if (Number.isNaN(ready.getTime())) return { message: null, shortMessage: null };
  const now = new Date();
  if (ready <= now) {
    return {
      message: 'Disponible desde este momento.',
      shortMessage: 'Disponible desde este momento',
    };
  }
  const sameDay =
    ready.getFullYear() === now.getFullYear() &&
    ready.getMonth() === now.getMonth() &&
    ready.getDate() === now.getDate();
  if (sameDay) {
    const timeStr = ready.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    return {
      message: `Disponible a partir de las ${timeStr}.`,
      shortMessage: `Disponible a partir de las ${timeStr}`,
    };
  }
  const dateStr = ready.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const dayStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  return {
    message: `Disponible a partir del ${dayStr}.`,
    shortMessage: `Disponible a partir del ${dayStr}`,
  };
}
