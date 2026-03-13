import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';

const CART_STORAGE_KEY = 'mariam_store_cart';

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

  const addToCart = (product, presentation, quantity = 1) => {
    setItems((prevItems) => {
      // Si tiene presentación, usar el precio total de la presentación
      // Si no tiene presentación, usar el precio del producto
      const unitPrice = presentation
        ? presentation.quantity * presentation.unitPrice
        : product.price;

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
      prevItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      )
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

