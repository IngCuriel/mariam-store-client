import React, { createContext, useContext, useState, useEffect } from 'react';

export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  // Cargar carrito desde localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart_items');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error cargando carrito:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart_items', JSON.stringify(items));
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
    localStorage.removeItem('cart_items');
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalAmount,
      }}
    >
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

