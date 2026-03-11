import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProductById } from '../services/productsService';
import { useCart } from '../contexts/CartContext';
import { getBestProductImage, getProductEmoji } from '../services/imageService';
import './ProductDetail.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

const TIPO_ENVIO_LABELS = {
  SOBRE_PEDIDO: 'Sobre pedido',
  SOLO_TIENDA: 'Solo en tienda física',
  ENVIO_INMEDIATO: 'Envío inmediato',
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [fallbackImage, setFallbackImage] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      setImageError(false);
      const data = await getProductById(id, true, true);
      setProduct(data);

      if (!data.images || data.images.length === 0) {
        try {
          const imageUrl = await getBestProductImage(data, true);
          setFallbackImage(imageUrl);
        } catch (error) {
          console.error('Error cargando imagen de fallback:', error);
        }
      }

      if (data.presentations && data.presentations.length > 0) {
        const defaultPresentation =
          data.presentations.find((p) => p.isDefault) || data.presentations[0];
        setSelectedPresentation(defaultPresentation);
      }
    } catch (error) {
      console.error('Error cargando producto:', error);
      alert('No se pudo cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.presentations?.length > 0 && !selectedPresentation) {
      alert('Elige una presentación antes de agregar al carrito.');
      return;
    }
    addToCart(product, selectedPresentation, quantity);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getDisplayPrice = () => {
    if (selectedPresentation) return selectedPresentation.unitPrice;
    return product?.price || 0;
  };

  const getTotalPrice = () => getDisplayPrice() * quantity;

  const hasStock = product?.inventory ? product.inventory.currentStock > 0 : true;
  const hasPresentations = product?.presentations && product.presentations.length > 0;
  const isSoloTienda = product?.tipoEnvio === 'SOLO_TIENDA';

  let mainImageUrl = null;
  if (product?.images?.length > 0) {
    mainImageUrl = product.images[currentImageIndex].url;
  } else if (fallbackImage && !imageError) {
    mainImageUrl = fallbackImage;
  }

  if (loading) {
    return (
      <div className="pdp-page">
        <div className="pdp-loading">
          <div className="pdp-loading-spinner" />
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-page">
        <div className="pdp-error">
          <div className="pdp-error-icon">⚠️</div>
          <h3>Producto no encontrado</h3>
          <button type="button" className="pdp-back-btn" onClick={() => navigate('/products')}>
            Volver a productos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdp-page">
      <div className="pdp-container">
        <nav className="pdp-breadcrumb">
          <Link to="/">Inicio</Link>
          <span>›</span>
          <Link to="/products">Productos</Link>
          <span>›</span>
          {product.category && (
            <>
              <span className="pdp-breadcrumb-current">{product.category.name}</span>
              <span>›</span>
            </>
          )}
          <span className="pdp-breadcrumb-current">{product.name}</span>
        </nav>

        <div className="pdp-content">
          <div className="pdp-gallery">
            <div className="pdp-main-image-wrap">
              {mainImageUrl ? (
                <img
                  src={mainImageUrl}
                  alt={product.name}
                  onError={() => setImageError(true)}
                />
              ) : (
                <span className="pdp-emoji-fallback">{getProductEmoji(product)}</span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="pdp-thumbnails">
                {product.images.map((img, index) => (
                  <button
                    key={img.id}
                    type="button"
                    className={`pdp-thumb ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            <div className="pdp-meta">
              {product.tipoEnvio && TIPO_ENVIO_LABELS[product.tipoEnvio] && (
                <span
                  className={`pdp-tipo-envio-badge pdp-tipo-envio-${product.tipoEnvio.toLowerCase()}`}
                  aria-label={`Tipo de envío: ${TIPO_ENVIO_LABELS[product.tipoEnvio]}`}
                >
                  {TIPO_ENVIO_LABELS[product.tipoEnvio]}
                </span>
              )}
              {product.tipoEnvio === 'SOBRE_PEDIDO' && (
                <span className="pdp-sobre-pedido-visual" aria-hidden>
                  {product.branchInfo?.logo ? (
                    <img
                      src={product.branchInfo.logo}
                      alt=""
                      className="pdp-sobre-pedido-logo"
                    />
                  ) : (
                    <span className="pdp-sobre-pedido-icon">📦</span>
                  )}
                </span>
              )}
              {product.category && (
                <span className="pdp-category-badge">{product.category.name}</span>
              )}
              {product.code && (
                <span className="pdp-code-badge">Código: {product.code}</span>
              )}
            </div>

            <h1 className="pdp-title">{product.name}</h1>

            <div className="pdp-price-block">
              <span className="pdp-price-main">{formatPrice(getDisplayPrice())}</span>
              <span className="pdp-price-unit">por unidad</span>
            </div>

            <div className={`pdp-stock ${hasStock ? 'in-stock' : 'out-of-stock'}`}>
              {hasStock ? '✓ Disponible' : '✕ Sin stock'}
            </div>

            {hasPresentations && !isSoloTienda && (
              <div className="pdp-presentations">
                <h4>Elige una presentación</h4>
                <div className="pdp-presentations-list">
                  {product.presentations.map((presentation) => (
                    <button
                      key={presentation.id}
                      type="button"
                      className={`pdp-presentation-btn ${
                        selectedPresentation?.id === presentation.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedPresentation(presentation)}
                    >
                      <div className="pdp-presentation-info">
                        <span className="pdp-presentation-name">{presentation.name}</span>
                        <span className="pdp-presentation-qty">
                          {presentation.quantity}{' '}
                          {presentation.quantity === 1 ? 'pieza' : 'piezas'}
                        </span>
                      </div>
                      <span className="pdp-presentation-price">
                        {formatPrice(presentation.unitPrice)}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedPresentation && (
                  <div className="pdp-selected-price-bar">
                    <span>Precio seleccionado</span>
                    <span className="value">
                      {formatPrice(selectedPresentation.unitPrice)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {isSoloTienda ? (
              <div className="pdp-solo-tienda-block" role="region" aria-label="Disponible solo en tienda física">
                <div className="pdp-solo-tienda-icon">🏪</div>
                <h3 className="pdp-solo-tienda-title">
                  Este producto está disponible solo en tienda
                </h3>
                {(product.branchInfo?.name || product.branch) && (
                  <p className="pdp-solo-tienda-name">
                    {product.branchInfo?.name || product.branch}
                  </p>
                )}
                {product.branchInfo?.description && (
                  <p className="pdp-solo-tienda-address">{product.branchInfo.description}</p>
                )}
                <p className="pdp-solo-tienda-cta">
                  ¡Visítanos pronto! Te atenderemos con gusto.
                </p>
              </div>
            ) : (
              <div className="pdp-actions">
                <div className="pdp-quantity-row">
                  <span className="pdp-quantity-label">Cantidad</span>
                  <div className="pdp-quantity-controls">
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      −
                    </button>
                    <span className="pdp-qty-value">{quantity}</span>
                    <button
                      type="button"
                      className="pdp-qty-btn"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="pdp-total-row">
                  <span className="pdp-total-label">Total</span>
                  <span className="pdp-total-value">{formatPrice(getTotalPrice())}</span>
                </div>
                <button
                  type="button"
                  className={`pdp-add-to-cart ${showSuccess ? 'success' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!hasStock}
                >
                  {showSuccess ? '✓ Agregado al carrito' : 'Agregar al carrito'}
                </button>
                {showSuccess && (
                  <Link to="/cart" className="pdp-view-cart-link">
                    Ver carrito →
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {product.description && (
          <section className="pdp-description">
            <h3>Descripción</h3>
            <p>{product.description}</p>
          </section>
        )}

        {Array.isArray(product.features) && product.features.length > 0 && (
          <section className="pdp-features" aria-label="Características del producto">
            <h3>Características</h3>
            <ul className="pdp-features-list">
              {product.features.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
