import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { getProductEmoji } from '../services/imageService';
import { createOrder } from '../services/ordersService';
import './Cart.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export default function Cart() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, clearCart, getTotalAmount } = useCart();
  const { isAuthenticated } = useAuth();
  const [creatingOrder, setCreatingOrder] = useState(false);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      if (window.confirm('Necesitas iniciar sesión para generar tu pedido. ¿Ir a iniciar sesión?')) {
        navigate('/login', { state: { from: '/cart' } });
      }
      return;
    }

    if (items.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `Total: ${formatPrice(getTotalAmount())}\n\nLa tienda revisará la disponibilidad y te contactará para confirmar.\n¿Continuar?`
      )
    ) {
      return;
    }

    try {
      setCreatingOrder(true);
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

      await createOrder({
        items: orderItems,
        notes: `Pedido web - ${items.length} ${items.length === 1 ? 'producto' : 'productos'}`,
      });

      clearCart();
      alert('Pedido enviado correctamente. La tienda te contactará pronto.');
      navigate('/products');
    } catch (error) {
      alert(error.response?.data?.error || 'No se pudo generar el pedido. Intenta de nuevo.');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-container">
          <nav className="cart-breadcrumb">
            <Link to="/">Inicio</Link>
            <span>›</span>
            <Link to="/products">Productos</Link>
            <span>›</span>
            <span className="cart-breadcrumb-current">Carrito</span>
          </nav>
          <h1 className="cart-page-title">Carrito de compras</h1>
          <p className="cart-page-subtitle">Tu carrito está vacío</p>
          <div className="cart-empty">
            <div className="cart-empty-icon">🛒</div>
            <h2>Tu carrito está vacío</h2>
            <p>Agrega productos desde la tienda para comenzar tu compra</p>
            <div className="cart-empty-actions">
              <Link to="/products" className="cart-btn-primary">
                Ver productos
              </Link>
              <Link to="/" className="cart-btn-secondary">
                Ir al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <nav className="cart-breadcrumb">
          <Link to="/">Inicio</Link>
          <span>›</span>
          <Link to="/products">Productos</Link>
          <span>›</span>
          <span className="cart-breadcrumb-current">Carrito</span>
        </nav>
        <h1 className="cart-page-title">Carrito de compras</h1>
        <p className="cart-page-subtitle">
          {items.length} {items.length === 1 ? 'producto' : 'productos'} en tu carrito
        </p>

        <div className="cart-layout">
          <div className="cart-items-section">
            <h2 className="cart-section-title">Productos</h2>
            <p className="cart-items-count">
              Total: {items.reduce((sum, i) => sum + i.quantity, 0)}{' '}
              {items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? 'unidad' : 'unidades'}
            </p>
            <div className="cart-items-list">
              {items.map((item) => {
                const imageUrl =
                  item.product.images?.length > 0 ? item.product.images[0].url : null;
                const emoji = getProductEmoji(item.product);

                return (
                  <article key={item.id} className="cart-item-card">
                    <div className="cart-item-image-wrap">
                      {imageUrl ? (
                        <img src={imageUrl} alt={item.product.name} />
                      ) : (
                        <span className="cart-item-emoji">{emoji}</span>
                      )}
                    </div>
                    <div className="cart-item-details">
                      <h3 className="cart-item-name">{item.product.name}</h3>
                      {item.presentation && (
                        <p className="cart-item-presentation">
                          {item.presentation.name} ·{' '}
                          {item.presentation.quantity}{' '}
                          {item.presentation.quantity === 1 ? 'pieza' : 'piezas'}
                        </p>
                      )}
                      <p className="cart-item-unit-price">
                        {formatPrice(item.unitPrice)} c/u
                      </p>
                    </div>
                    <div className="cart-item-quantity">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        aria-label="Disminuir cantidad"
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-subtotal">
                      {formatPrice(item.subtotal)}
                    </div>
                    <button
                      type="button"
                      className="cart-item-remove"
                      onClick={() => removeFromCart(item.id)}
                      title="Eliminar producto"
                      aria-label="Eliminar producto"
                    >
                      ✕
                    </button>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className="cart-summary-card">
            <h2 className="cart-summary-title">Resumen</h2>
            <div className="cart-summary-rows">
              <div className="cart-summary-row">
                <span>
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)}{' '}
                  {items.reduce((s, i) => s + i.quantity, 0) === 1 ? 'producto' : 'productos'})
                </span>
                <span>{formatPrice(getTotalAmount())}</span>
              </div>
              <div className="cart-summary-row total">
                <span>Total</span>
                <span className="amount">{formatPrice(getTotalAmount())}</span>
              </div>
            </div>
            <button
              type="button"
              className="cart-checkout-btn"
              onClick={handleCheckout}
              disabled={creatingOrder}
            >
              {creatingOrder ? 'Generando pedido...' : 'Finalizar compra'}
            </button>
            {!isAuthenticated && (
              <p className="cart-login-reminder">
                <Link to="/login">Inicia sesión</Link> para poder generar tu pedido
              </p>
            )}
            <Link to="/products" className="cart-continue-link">
              Seguir comprando
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
