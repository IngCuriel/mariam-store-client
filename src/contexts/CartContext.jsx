import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

	
// 1. DEFINIR LA VARIABLE QUE FALTABA AQUÍ ARRIBA
const CART_STORAGE_KEY = 'minisuper_cart_v1';
/**
 * Resuelve el precio unitario aplicando el tramo de precio escalonado (mayoreo)
 * si el producto lo tiene. Misma lógica que ProductDetail: ESCALÓN SIMPLE,
 * toda la cantidad se cobra al precio del tramo donde cae.
 * Si no hay tramos o la cantidad no cae en ninguno, devuelve el precio base.
 */
function resolveUnitPrice(product, presentation, quantity) {
  // Con presentación: precio de la presentación (no aplica tiered).
  if (presentation) {
    return (presentation.quantity ?? 1) * (presentation.unitPrice ?? 0);
  }
  // Sin presentación y con tramos: buscar el tramo que aplica.
  const hasTiers =
    product?.pricingMode === 'tiered' &&
    Array.isArray(product?.priceTiers) &&
    product.priceTiers.length > 0;
  if (hasTiers) {
    const tier = product.priceTiers.find(
      (t) => quantity >= t.minQty && (t.maxQty == null || quantity <= t.maxQty)
    );
    if (tier) return tier.unitPrice;
  }
  // Precio base del producto.
  return product?.price ?? 0;
}

/**
 * Calcula la cantidad máxima permitida para un ítem según el stock disponible.
 * El stock es en unidades BASE (piezas). Con presentación se convierte:
 *   max = floor(currentStock / piezasPorPresentación)
 * Sin inventario rastreado: retorna null (sin límite).
 */
function resolveMaxQuantity(product, presentation) {
  const tracksInventory =
    product?.inventory != null &&
    (product.inventory.trackInventory ?? product.trackInventory ?? false);
  if (!tracksInventory) return null;
  const currentStock = product.inventory?.currentStock ?? 0;
  const piezasPorUnidad = presentation?.quantity ?? 1;
  return Math.floor(currentStock / piezasPorUnidad);
}

function loadCartFromStorage() {
  try {
    const storage = typeof globalThis !== 'undefined' && globalThis.localStorage;
    const saved = storage ? storage.getItem(CART_STORAGE_KEY) : null;
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error('Error cargando carrito desde localStorage:', error);
    return [];
  }
}

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCartFromStorage);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn('Carrito: espacio de almacenamiento insuficiente. Se mantendrá en memoria.');
      } else {
        console.error('Error guardando carrito en localStorage:', error);
      }
    }
  }, [items]);

  const addToCart = (product, presentation, quantity = 1, overrideUnitPrice = null) => {
    setItems((prevItems) => {
      // Precio unitario:
      //  - Con presentación: precio total de la presentación (piezas × precio/pza).
      //  - Sin presentación: `overrideUnitPrice` cuando se provee (precio de
      //    mayoreo según la cantidad elegida en el detalle); si no, product.price.
      const unitPrice = presentation
        ? presentation.quantity * presentation.unitPrice
        : (overrideUnitPrice != null ? overrideUnitPrice : product.price);

      const itemId = `${product.id}-${presentation?.id || 'default'}`;

      const existingItem = prevItems.find((item) => item.id === itemId);

      if (existingItem) {
        // Si ya existe, actualizar cantidad
        return prevItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: (item.quantity + quantity) * item.unitPrice,
              }
            : item
        );
      } else {
        // Si no existe, agregar nuevo item
        return [
          ...prevItems,
          {
            id: itemId,
            product,
            presentation,
            quantity,
            unitPrice,
            subtotal: quantity * unitPrice,
          },
        ];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const removeItemsFromCart = (itemIds) => {
    const idSet = new Set(Array.isArray(itemIds) ? itemIds : [itemIds]);
    setItems((prevItems) => prevItems.filter((item) => !idSet.has(item.id)));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.id !== itemId) return item;
        // Respetar el stock máximo: si el producto rastrea inventario, no
        // permitir superar el máximo calculado en unidades de presentación.
        const max = resolveMaxQuantity(item.product, item.presentation);
        const clampedQty = max != null ? Math.min(quantity, Math.max(1, max)) : quantity;
        const newUnitPrice = resolveUnitPrice(item.product, item.presentation, clampedQty);
        return {
          ...item,
          quantity: clampedQty,
          unitPrice: newUnitPrice,
          subtotal: clampedQty * newUnitPrice,
        };
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (error) {
      console.error('Error limpiando carrito en localStorage:', error);
    }
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  const value = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      removeItemsFromCart,
      updateQuantity,
      clearCart,
      getTotalItems,
      getTotalAmount,
    }),
    [items]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

