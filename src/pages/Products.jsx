import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, getAllCategories, getAllBranches } from '../services/productsService';
import { getBestProductImage, getProductEmoji } from '../services/imageService';
import { useAnalytics } from '../hooks/useAnalytics';
import './Products.css';

const formatPrice = (price) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/** Etiquetas de disponibilidad del producto en tienda en línea */
const PRODUCT_AVAILABILITY_LABELS = {
  online_pickup: 'Solo Tienda Online',
  local_delivery: 'Disponible ahora',
  in_store_only: 'Solo sucursal',
};

const PAGE_SIZE = 20;
/** ID de sucursal para el menú "Novedades" */
const NOVEDADES_BRANCH_ID = 10;

export default function Products() {
  const { logSearch } = useAnalytics();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCategoriesView, setShowCategoriesView] = useState(false);
  const [showNewProductsView, setShowNewProductsView] = useState(false);
  const [showNovedadesView, setShowNovedadesView] = useState(false);
  const prevNewProductsViewRef = useRef(false);
  const prevNovedadesViewRef = useRef(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [listLoading, setListLoading] = useState(false);

  /** Agrupa categorías por nombre de sucursal (para la pantalla de categorías) */
  const categoriesByBranch = useMemo(() => {
    const map = {};
    for (const cat of categories) {
      const key = cat.branch || 'General';
      if (!map[key]) map[key] = [];
      map[key].push(cat);
    }
    return map;
  }, [categories]);

  /** Orden de sucursales: primero las conocidas (branches), luego el resto */
  const branchOrder = useMemo(() => {
    const set = new Set(branches);
    const others = Object.keys(categoriesByBranch).filter((b) => !set.has(b));
    return [...branches, ...others];
  }, [branches, categoriesByBranch]);

  useEffect(() => {
    loadData();
  }, []);

  /** Al cambiar filtros, volver a página 1 */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedBranch]);

  /** Cargar productos (listado normal) con paginación */
  useEffect(() => {
    if (showNewProductsView || showNovedadesView) return;
    const timeoutId = setTimeout(() => {
      loadProducts();
    }, searchQuery ? 500 : 0);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory, selectedBranch, currentPage, showNewProductsView, showNovedadesView]);

  useEffect(() => {
    if (!showNewProductsView) return;
    const controller = new AbortController();
    const fetchNewProducts = async () => {
      try {
        setListLoading(true);
        const data = await getAllProducts(
          {
            showInStoreOnly: true,
            includePresentations: true,
            includeInventory: true,
            sortBy: 'createdAt',
            limit: PAGE_SIZE,
            offset: (currentPage - 1) * PAGE_SIZE,
          },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const list = Array.isArray(data) ? data : data.products || [];
        const total = typeof data?.total === 'number' ? data.total : list.length;
        setProducts(list);
        setTotalProducts(total);
      } catch (err) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        console.error('Error cargando productos nuevos:', err);
      } finally {
        if (!controller.signal.aborted) setListLoading(false);
      }
    };
    fetchNewProducts();
    return () => controller.abort();
  }, [showNewProductsView, currentPage]);

  /** Cargar productos de Novedades (sucursal id 10) con paginación */
  useEffect(() => {
    if (!showNovedadesView) return;
    const controller = new AbortController();
    const fetchNovedades = async () => {
      try {
        setListLoading(true);
        const data = await getAllProducts(
          {
            showInStoreOnly: true,
            includePresentations: true,
            includeInventory: true,
            branchId: NOVEDADES_BRANCH_ID,
            limit: PAGE_SIZE,
            offset: (currentPage - 1) * PAGE_SIZE,
          },
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        const list = Array.isArray(data) ? data : data.products || [];
        const total = typeof data?.total === 'number' ? data.total : list.length;
        setProducts(list);
        setTotalProducts(total);
      } catch (err) {
        if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') return;
        console.error('Error cargando novedades:', err);
      } finally {
        if (!controller.signal.aborted) setListLoading(false);
      }
    };
    fetchNovedades();
    return () => controller.abort();
  }, [showNovedadesView, currentPage]);

  /** Al salir de "Productos nuevos" restaurar listado normal (solo si no estamos entrando a Novedades) */
  useEffect(() => {
    if (prevNewProductsViewRef.current && !showNewProductsView) {
      if (!showNovedadesView) {
        setCurrentPage(1);
        loadProducts();
      }
    }
    prevNewProductsViewRef.current = showNewProductsView;
  }, [showNewProductsView, showNovedadesView]);

  /** Al salir de "Novedades" restaurar listado normal (solo si no estamos entrando a Productos Nuevo) */
  useEffect(() => {
    if (prevNovedadesViewRef.current && !showNovedadesView) {
      if (!showNewProductsView) {
        setCurrentPage(1);
        loadProducts();
      }
    }
    prevNovedadesViewRef.current = showNovedadesView;
  }, [showNovedadesView, showNewProductsView]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesData, branchesData] = await Promise.all([
        getAllCategories({ showInStore: true }),
        getAllBranches(),
      ]);
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
      setListLoading(true);
      const data = await getAllProducts({
        includePresentations: true,
        includeInventory: true,
        showInStoreOnly: true,
        search: searchQuery || undefined,
        categoryId: selectedCategory || undefined,
        branch: selectedBranch || undefined,
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      });
      const list = Array.isArray(data) ? data : data.products || [];
      const total = typeof data?.total === 'number' ? data.total : list.length;
      setProducts(list);
      setTotalProducts(total);
      if (searchQuery?.trim()) {
        logSearch({
          searchTerm: searchQuery.trim(),
          resultsCount: total,
          categoryId: selectedCategory || null,
          branch: selectedBranch || null,
        });
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setListLoading(false);
    }
  };

  /** Productos a mostrar (la API ya devuelve la página filtrada) */
  const displayProducts = products;
  const totalPages = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const hasPagination = totalProducts > PAGE_SIZE;

  /** Números de página visibles (estilo ML: 1 ... 4 5 6 ... 12) */
  const paginationNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis-start');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis-end');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

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

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
    setShowCategoriesView(false);
    setShowNewProductsView(false);
    setShowNovedadesView(false);
  };

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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCategory(null);
                  setSelectedBranch(null);
                  setShowNewProductsView(false);
                  setShowNovedadesView(false);
                  setShowCategoriesView(false);
                }}
                aria-label="Buscar productos"
              />
            </div>
          </div>
          <nav className="products-quick-nav" aria-label="Opciones rápidas">
            <button
              type="button"
              className={`products-quick-nav-item ${showCategoriesView ? 'active' : ''}`}
              aria-current={showCategoriesView}
              onClick={() => setShowCategoriesView(true)}
            >
              Categorías
            </button>
           {/*<button type="button" className="products-quick-nav-item" aria-current="false">
              Ofertas
            </button>*/}
            <button
              type="button"
              className={`products-quick-nav-item ${showNewProductsView ? 'active' : ''}`}
              aria-current={showNewProductsView}
              onClick={() => {
                setShowCategoriesView(false);
                setSelectedCategory(null);
                setSelectedBranch(null);
                setCurrentPage(1);
                setShowNovedadesView(false);
                setShowNewProductsView(true);
              }}
            >
              Productos Nuevo
            </button>
            <button
              type="button"
              className={`products-quick-nav-item ${showNovedadesView ? 'active' : ''}`}
              aria-current={showNovedadesView}
              onClick={() => {
                setShowCategoriesView(false);
                setSelectedCategory(null);
                setSelectedBranch(null);
                setCurrentPage(1);
                setShowNewProductsView(false);
                setShowNovedadesView(true);
              }}
            >
              Novedades
            </button>
          </nav>
        </div>
      </div>

      {showCategoriesView ? (
        <div className="products-categories-view">
          <div className="products-categories-view-inner">
            <button
              type="button"
              className="products-categories-view-back"
              onClick={() => setShowCategoriesView(false)}
              aria-label="Volver a productos"
            >
              ← Volver a productos
            </button>
             {branchOrder.length === 0 ? (
              <p className="products-categories-view-empty">No hay categorías disponibles.</p>
            ) : (
              branchOrder.map((branchName) => {
                const branchCategories = categoriesByBranch[branchName] || [];
                if (branchCategories.length === 0) return null;
                return (
                  <section
                    key={branchName}
                    className="products-branch-section"
                    aria-labelledby={`branch-${branchName.replaceAll(/\s+/g, '-')}`}
                  >
                    <h3 id={`branch-${branchName.replaceAll(/\s+/g, '-')}`} className="products-branch-section-title">
                      {branchName}
                    </h3>
                    <div className="products-category-cards-grid">
                      {branchCategories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className="products-category-card"
                          onClick={() => handleSelectCategory(category.id)}
                        >
                          <div className="products-category-card-image-wrap">
                            {category.image ? (
                              <img src={category.image} alt="" />
                            ) : (
                              <span className="products-category-card-icon">📁</span>
                            )}
                          </div>
                          <span className="products-category-card-name">{category.name}</span>
                          <span className="products-category-card-cta">Ver productos →</span>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <> 
      {categories.length > 0 && (
        <div className="products-categories-wrap">
          <div className="products-categories-scroll">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`category-chip ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => {
                  setShowNewProductsView(false);
                  setShowNovedadesView(false);
                  setSelectedCategory(selectedCategory === category.id ? null : category.id);
                }}
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
        {listLoading && (
          <div className="products-grid-loading" aria-hidden>
            <div className="products-loading-spinner" />
          </div>
        )}
        <div className={`products-grid ${listLoading ? 'products-grid--dimmed' : ''}`}>
          {displayProducts.length === 0 && !listLoading ? (
            <div className="empty-products">
              <div className="empty-icon">📦</div>
              <h3>No se encontraron productos</h3>
              <p>Prueba con otros términos o quita filtros</p>
            </div>
          ) : (
            displayProducts.map((product) => {
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
                    {product.productAvailability && PRODUCT_AVAILABILITY_LABELS[product.productAvailability] && (
                      <span
                        className={`product-card-availability availability-${product.productAvailability}`}
                        aria-label={`Disponibilidad: ${PRODUCT_AVAILABILITY_LABELS[product.productAvailability]}`}
                      >
                        {PRODUCT_AVAILABILITY_LABELS[product.productAvailability]}
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

      <p className="products-results-summary">
        {totalProducts === 0
          ? '0 resultados'
          : `Mostrando ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, totalProducts)} de ${totalProducts} resultados`}
      </p>
      {hasPagination && !listLoading && (
        <nav className="products-pagination" aria-label="Paginación de productos">
          <button
            type="button"
            className="products-pagination-btn products-pagination-prev"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            Anterior
          </button>
          <ul className="products-pagination-list">
            {paginationNumbers.map((item, idx) =>
              item === 'ellipsis-start' || item === 'ellipsis-end' ? (
                <li key={`ellipsis-${idx}`} className="products-pagination-ellipsis">
                  …
                </li>
              ) : (
                <li key={item}>
                  <button
                    type="button"
                    className={`products-pagination-num ${currentPage === item ? 'active' : ''}`}
                    onClick={() => setCurrentPage(item)}
                    aria-label={`Página ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                </li>
              )
            )}
          </ul>
          <button
            type="button"
            className="products-pagination-btn products-pagination-next"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            aria-label="Página siguiente"
          >
            Siguiente
          </button>
        </nav>
      )}
        </>
      )}
    </div>
  );
}
