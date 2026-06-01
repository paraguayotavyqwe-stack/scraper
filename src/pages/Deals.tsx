import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Tag, ShoppingCart, Percent, Store } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency, cn } from '../lib/utils';
import { useShoppingListStore } from '../stores/shopping-list-store';

interface DealProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: string | null;
  categories: { name: string; slug: string } | null;
  product_prices: {
    price: number;
    original_price: number | null;
    is_on_sale: boolean;
    supermarkets: { name: string; slug: string; logo_url: string | null };
  }[];
}

export function Deals() {
  const [products, setProducts] = useState<DealProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSupermarket, setSelectedSupermarket] = useState<string>('all');
  const [supermarkets, setSupermarkets] = useState<{ name: string; slug: string }[]>([]);
  const addItem = useShoppingListStore((state) => state.addItem);

  useEffect(() => {
    const fetchDeals = async () => {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('product_prices')
        .select(`
          price,
          original_price,
          is_on_sale,
          product_id,
          products!inner(
            id, name, slug, image_url, category_id,
            categories!products_category_id_fkey(name, slug)
          ),
          supermarkets(name, slug, logo_url)
        `)
        .eq('is_on_sale', true)
        .eq('products.is_active', true)
        .order('price', { ascending: true });

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      // Group by product_id, take the best price per product
      const grouped = new Map<string, {
        product: { id: string; name: string; slug: string; image_url: string | null; category_id: string | null; categories: any };
        bestPrice: number;
        allPrices: DealProduct['product_prices'];
      }>();

      for (const row of data as any[]) {
        const pid = row.product_id;
        if (!grouped.has(pid)) {
          grouped.set(pid, {
            product: row.products,
            bestPrice: row.price,
            allPrices: [{
              price: row.price,
              original_price: row.original_price,
              is_on_sale: row.is_on_sale,
              supermarkets: row.supermarkets,
            }],
          });
        } else {
          const entry = grouped.get(pid)!;
          entry.allPrices.push({
            price: row.price,
            original_price: row.original_price,
            is_on_sale: row.is_on_sale,
            supermarkets: row.supermarkets,
          });
          if (row.price < entry.bestPrice) {
            entry.bestPrice = row.price;
          }
        }
      }

      const productsList: DealProduct[] = Array.from(grouped.values()).map((g) => ({
        id: g.product.id,
        name: g.product.name,
        slug: g.product.slug,
        image_url: g.product.image_url,
        category_id: g.product.category_id,
        categories: g.product.categories,
        product_prices: g.allPrices,
      }));

      productsList.sort((a, b) => {
        const aBest = a.product_prices.reduce((min, p) => Math.min(min, p.price), Infinity);
        const bBest = b.product_prices.reduce((min, p) => Math.min(min, p.price), Infinity);
        return aBest - bBest;
      });

      // Extract unique supermarkets
      const uniqueSupermarkets = new Map<string, { name: string; slug: string }>();
      for (const row of data as any[]) {
        const s = row.supermarkets;
        if (!uniqueSupermarkets.has(s.slug)) {
          uniqueSupermarkets.set(s.slug, { name: s.name, slug: s.slug });
        }
      }

      setSupermarkets(Array.from(uniqueSupermarkets.values()));
      setProducts(productsList);
      setIsLoading(false);
    };

    fetchDeals();
  }, []);

  const filteredProducts = selectedSupermarket === 'all'
    ? products
    : products.filter((p) =>
        p.product_prices.some((pp) => pp.supermarkets.slug === selectedSupermarket)
      );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-danger/20 flex items-center justify-center">
              <Tag size={24} className="text-danger" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ofertas del Día</h1>
              <p className="text-text-muted">
                {filteredProducts.length} productos con descuento activo
              </p>
            </div>
          </div>
        </motion.div>

        {/* Supermarket Filter */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedSupermarket('all')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              selectedSupermarket === 'all'
                ? 'bg-primary text-white'
                : 'bg-surface-light text-text-muted hover:bg-surface hover:text-text'
            )}
          >
            Todos
          </button>
          {supermarkets.map((s) => (
            <button
              key={s.slug}
              onClick={() => setSelectedSupermarket(s.slug)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                selectedSupermarket === s.slug
                  ? 'bg-primary text-white'
                  : 'bg-surface-light text-text-muted hover:bg-surface hover:text-text'
              )}
            >
              {s.name}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="aspect-square skeleton" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton rounded w-3/4" />
                  <div className="h-6 skeleton rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-light flex items-center justify-center">
              <Tag size={48} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">No hay ofertas disponibles</h3>
            <p className="text-text-muted mb-6">
              Vuelve a revisar pronto para encontrar las mejores ofertas
            </p>
            <Link to="/search" className="btn-primary">
              Explorar Productos
            </Link>
          </div>
        )}

        {!isLoading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredProducts.map((product, index) => {
              const bestPriceEntry = product.product_prices.reduce((min, p) =>
                p.price < min.price ? p : min
              , product.product_prices[0]);
              const bestPrice = bestPriceEntry.price;
              const originalPrice = bestPriceEntry.original_price;
              const discount = originalPrice
                ? Math.round(((originalPrice - bestPrice) / originalPrice) * 100)
                : 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="card overflow-hidden group block"
                  >
                    {/* Discount Badge */}
                    <div className="relative">
                      <div className="aspect-square bg-surface-light flex items-center justify-center p-4">
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
                      </div>
                      {discount > 0 && (
                        <div className="absolute top-3 right-3 bg-danger text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                          <Percent size={12} />
                          -{discount}%
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {product.categories && (
                        <span className="text-xs text-primary font-medium">{product.categories.name}</span>
                      )}
                      <h3 className="font-semibold line-clamp-2 mb-2">{product.name}</h3>

                      {/* Prices */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-danger">
                          {formatCurrency(bestPrice)}
                        </span>
                        {originalPrice && (
                          <span className="text-sm text-text-muted line-through">
                            {formatCurrency(originalPrice)}
                          </span>
                        )}
                      </div>

                      {/* Supermarket */}
                      <p className="text-xs text-text-muted flex items-center gap-1">
                        <Store size={12} />
                        {bestPriceEntry.supermarkets.name}
                        {product.product_prices.length > 1 && (
                          <span className="text-primary ml-1">
                            · {product.product_prices.length} supermercados
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>

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
                        best_price: bestPrice,
                        best_supermarket: bestPriceEntry.supermarkets.name,
                      });
                    }}
                    className="w-full btn-primary mt-2 flex items-center justify-center gap-2 text-sm py-2"
                  >
                    <ShoppingCart size={16} />
                    Agregar a mi lista
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
