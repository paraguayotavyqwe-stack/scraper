import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, Filter, TrendingDown, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency, cn } from '../lib/utils';
import { useShoppingListStore } from '../stores/shopping-list-store';

interface ProductWithPrices {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  brand: string | null;
  category_id: string | null;
  categories: { name: string } | null;
  product_prices: {
    price: number;
    original_price: number | null;
    is_on_sale: boolean;
    supermarkets: { name: string; slug: string };
  }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 20;

const sortOptions = [
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'name', label: 'Nombre' },
  { value: 'discount', label: 'Mayor descuento' },
];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('price_asc');
  const [maxPrice, setMaxPrice] = useState<number>(100000);
  const [currentPage, setCurrentPage] = useState(1);
  const addItem = useShoppingListStore((state) => state.addItem);

  const searchQuery = searchParams.get('q') || '';
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name');
      
      if (data) setCategories(data as Category[]);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setCurrentPage(1);
      setIsLoading(true);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey(name, slug),
          product_prices(
            price,
            original_price,
            is_on_sale,
            supermarkets(name, slug)
          )
        `)
        .eq('is_active', true);

      if (debouncedSearch) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (!error && data) {
        let filtered = data as unknown as ProductWithPrices[];
        
        filtered = filtered.filter((p) =>
          p.product_prices.some((pp) => pp.price <= maxPrice)
        );

        const getBestPriceForProduct = (p: ProductWithPrices): number => {
          if (!p.product_prices?.length) return Infinity;
          return Math.min(...p.product_prices.map((pp) => pp.price));
        };

        switch (sortBy) {
          case 'price_asc':
            filtered.sort((a, b) => getBestPriceForProduct(a) - getBestPriceForProduct(b));
            break;
          case 'price_desc':
            filtered.sort((a, b) => getBestPriceForProduct(b) - getBestPriceForProduct(a));
            break;
          case 'name':
            filtered.sort((a, b) => a.name.localeCompare(b.name));
            break;
          case 'discount':
            filtered.sort((a, b) => {
              const discountA = a.product_prices[0]?.original_price
                ? ((a.product_prices[0].original_price - a.product_prices[0].price) / a.product_prices[0].original_price) * 100
                : 0;
              const discountB = b.product_prices[0]?.original_price
                ? ((b.product_prices[0].original_price - b.product_prices[0].price) / b.product_prices[0].original_price) * 100
                : 0;
              return discountB - discountA;
            });
            break;
        }

        setProducts(filtered);
      }
      
      setIsLoading(false);
    };

    fetchProducts();
  }, [debouncedSearch, selectedCategory, sortBy, maxPrice]);

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getBestPrice = (product: ProductWithPrices) => {
    if (!product.product_prices?.length) return null;
    return product.product_prices.reduce((min, p) => 
      p.price < min.price ? p : min
    , product.product_prices[0]);
  };

  const getPriceChange = (product: ProductWithPrices) => {
    const price = product.product_prices[0];
    if (!price?.original_price) return null;
    const change = ((price.price - price.original_price) / price.original_price) * 100;
    return change;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {searchQuery ? `Resultados para "${searchQuery}"` : 'Explorar Productos'}
          </h1>
          <p className="text-text-muted">
            {products.length} productos encontrados
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchParams({ q: e.target.value })}
              className="w-full pl-12 pr-4 py-4 rounded-2xl input text-lg"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
              showFilters ? "bg-primary text-white" : "bg-surface-light text-text hover:bg-surface"
            )}
          >
            <Filter size={18} />
            Filtros
          </button>

          {/* Category Pills */}
          <div className="flex-1 overflow-x-auto flex gap-2 pb-2 md:pb-0">
            <button
              onClick={() => setSelectedCategory('')}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                !selectedCategory ? "bg-primary text-white" : "bg-surface-light text-text-muted hover:text-text"
              )}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  selectedCategory === cat.id ? "bg-primary text-white" : "bg-surface-light text-text-muted hover:text-text"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-light text-text border-none focus:ring-2 focus:ring-primary"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="card p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Precio máximo</label>
                    <input
                      type="range"
                      min={0}
                      max={200000}
                      step={5000}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-sm text-text-muted mt-1">
                      <span>Gs. 0</span>
                      <span className="font-medium text-primary">{formatCurrency(maxPrice)}</span>
                      <span>Gs. 200,000</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-6 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-light flex items-center justify-center">
              <SearchIcon size={32} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">No encontramos resultados</h3>
            <p className="text-text-muted mb-6">Intenta con otros términos o ajusta los filtros</p>
            <button
              onClick={() => {
                setSearchParams({});
                setSelectedCategory('');
              }}
              className="btn-primary"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedProducts.map((product, index) => {
                const bestPrice = getBestPrice(product);
                const priceChange = getPriceChange(product);
                
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className="card overflow-hidden group h-full flex flex-col">
                      <Link to={`/product/${product.slug}`} className="block">
                        <div className="aspect-square bg-surface-light flex items-center justify-center p-4 relative">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center">
                              <ShoppingCart size={32} className="text-text-muted" />
                            </div>
                          )}
                          
                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {priceChange !== null && priceChange < 0 && (
                              <span className="badge badge-success flex items-center gap-1">
                                <TrendingDown size={12} />
                                {Math.abs(priceChange).toFixed(0)}%
                              </span>
                            )}
                            {bestPrice?.is_on_sale && (
                              <span className="badge badge-warning">Oferta</span>
                            )}
                          </div>
                        </div>
                      </Link>
                      
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex-1">
                          {product.categories && (
                            <span className="text-xs text-text-muted">{product.categories.name}</span>
                          )}
                          <Link to={`/product/${product.slug}`}>
                            <h3 className="font-semibold line-clamp-2 mb-2 hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </Link>
                          {product.brand && (
                            <p className="text-sm text-text-muted mb-2">{product.brand}</p>
                          )}
                        </div>
                        
                        {/* Price Section */}
                        {bestPrice && (
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-xl font-bold text-primary">
                                {formatCurrency(bestPrice.price)}
                              </span>
                              {bestPrice.original_price && (
                                <span className="text-sm text-text-muted line-through">
                                  {formatCurrency(bestPrice.original_price)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-muted mb-3">
                              en {bestPrice.supermarkets.name}
                            </p>
                            
                            {/* Add to List Button */}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addItem({
                                  product_id: product.id,
                                  product_name: product.name,
                                  product_image: product.image_url || undefined,
                                  quantity: 1,
                                  is_checked: false,
                                  best_price: bestPrice.price,
                                  best_supermarket: bestPrice.supermarkets.name,
                                });
                              }}
                              className="w-full py-2 px-3 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <ShoppingCart size={14} />
                              Agregar a mi lista
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl transition-all",
                    currentPage === 1
                      ? "bg-surface-light text-text-muted cursor-not-allowed"
                      : "bg-surface-light text-text hover:bg-primary hover:text-white"
                  )}
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                
                <span className="text-text-muted">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={cn(
                    "flex items-center gap-1 px-4 py-2 rounded-xl transition-all",
                    currentPage === totalPages
                      ? "bg-surface-light text-text-muted cursor-not-allowed"
                      : "bg-surface-light text-text hover:bg-primary hover:text-white"
                  )}
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
