import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, getAllCategories, getAllBranches } from '../services/productsService';
import { getBestProductImage, getProductEmoji } from '../services/imageService';
import './Products.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/** Etiquetas de tipo de envío (solo tipoEnvio, no saleType) */
const TIPO_ENVIO_LABELS = {
  SOBRE_PEDIDO: 'Sobre pedido',
  SOLO_TIENDA: 'Solo en tienda física',
  ENVIO_INMEDIATO: 'Envío inmediato',
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, searchQuery ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData, branchesData] = await Promise.all([
        getAllProducts({
          includePresentations: true,
          includeInventory: true,
          showInStoreOnly: true,
        }),
        getAllCategories({ showInStore: true }),
        getAllBranches(),
      ]);

      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
      setCategories(categoriesData || []);
      setBranches(branchesData || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await getAllProducts({
        includePresentations: true,
        includeInventory: true,
        showInStoreOnly: true,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        branch: selectedBranch || undefined,
      });
      setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.code?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedCategory && product.categoryId !== selectedCategory) return false;
      if (selectedBranch && product.branch !== selectedBranch) return false;
      return true;
    });
  }, [products, searchQuery, selectedCategory, selectedBranch]);

  const [productImages, setProductImages] = useState({});

  useEffect(() => {
    const loadMissingImages = async () => {
      const imagesMap = {};
      const productsWithoutImages = products.filter((p) => !p.images || p.images.length === 0);
      for (const product of productsWithoutImages) {
        try {
          const imageUrl = await getBestProductImage(product, true);
          imagesMap[product.id] = imageUrl;
        } catch (error) {
          console.error(`Error cargando imagen para ${product.name}:`, error);
        }
      }
      setProductImages(imagesMap);
    };
    if (products.length > 0) loadMissingImages();
  }, [products]);

  const getProductImage = (product) => {
    if (product.images && product.images.length > 0) return product.images[0].url;
    if (productImages[product.id]) return productImages[product.id];
    return null;
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedBranch(null);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategory || selectedBranch || searchQuery;

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-loading">
          <div className="products-loading-spinner" />
          <p>Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Barra superior tipo ML/Amazon */}
      <div className="products-top-bar">
        <div className="products-top-inner">
          <div className="products-search-row">
            <div className="products-search-wrap">
              <span className="products-search-icon" aria-hidden>🔍</span>
              <input
                type="text"
                className="products-search-input"
                placeholder="Buscar productos, marcas y más..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Buscar productos"
              />
            </div>
          </div>
          <div className="products-filters-row">
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="products-filter-select"
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={selectedBranch || ''}
              onChange={(e) => setSelectedBranch(e.target.value || null)}
              className="products-filter-select"
              aria-label="Filtrar por sucursal"
            >
              <option value="">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <button type="button" className="products-clear-filters" onClick={clearFilters}>
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="products-title-section">
        <p className="products-results-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {categories.length > 0 && (
        <div className="products-categories-wrap">
          <div className="products-categories-scroll">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() =>
                  setSelectedCategory(selectedCategory === category.id ? null : category.id)
                }
              >
                {category.image && (
                  <img
                    src={category.image}
                    alt=""
                    className="category-image"
                  />
                )}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="products-grid-wrap">
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="empty-products">
              <div className="empty-icon">📦</div>
              <h3>No se encontraron productos</h3>
              <p>Prueba con otros términos o quita filtros</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const imageUrl = getProductImage(product);
              const emoji = getProductEmoji(product);
              const defaultPrice = product.presentations?.find((p) => p.isDefault)
                ? product.presentations.find((p) => p.isDefault).unitPrice
                : product.price;
              const hasMultiplePresentations = product.presentations && product.presentations.length > 1;

              return (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="product-card"
                >
                  <div className="product-card-image-wrap">
                    {hasMultiplePresentations && (
                      <span className="product-card-badge">Varias opciones</span>
                    )}
                    {imageUrl ? (
                      <img src={imageUrl} alt={product.name} />
                    ) : (
                      <span className="product-card-emoji">{emoji}</span>
                    )}
                  </div>
                  <div className="product-card-body">
                    {product.tipoEnvio && TIPO_ENVIO_LABELS[product.tipoEnvio] && (
                      <span
                        className={`product-card-tipo-envio sale-type-${product.tipoEnvio.toLowerCase()}`}
                        aria-label={`Tipo de envío: ${TIPO_ENVIO_LABELS[product.tipoEnvio]}`}
                      >
                        {TIPO_ENVIO_LABELS[product.tipoEnvio]}
                      </span>
                    )}
                    <h3 className="product-card-name">{product.name}</h3>
                    {product.description && (
                      <p className="product-card-desc">{product.description}</p>
                    )}
                    <span className="product-card-price">{formatPrice(defaultPrice)}</span>
                    {hasMultiplePresentations && (
                      <span className="product-card-presentations">
                        +{product.presentations.length - 1} presentaciones más
                      </span>
                    )}
                    <span className="product-card-cta">Ver producto →</span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
