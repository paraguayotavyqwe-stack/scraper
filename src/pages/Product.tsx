import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Heart, MapPin, TrendingUp, Star, Store } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { useShoppingListStore } from '../stores/shopping-list-store';
import { useFavoritesStore } from '../stores/favorites-store';

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  brand: string | null;
  unit: string;
  barcode: string | null;
  categories: { name: string } | null;
}

interface PriceEntry {
  id: string;
  price: number;
  original_price: number | null;
  is_on_sale: boolean;
  is_available: boolean;
  last_checked_at: string;
  supermarkets: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    address: string | null;
  };
}

interface PriceHistoryEntry {
  price: number;
  recorded_at: string;
}

export function Product() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [prices, setPrices] = useState<PriceEntry[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const addItem = useShoppingListStore((state) => state.addItem);
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (product) setIsFav(isFavorite(product.id));
  }, [product, isFavorite]);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      
      const { data: productData } = await supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey(name, slug)
        `)
        .eq('slug', slug || '')
        .single();

      if (productData) {
        setProduct(productData as unknown as ProductDetail);

        // Fetch prices using RPC (includes mapped products)
        const { data: rpcPrices, error: rpcError } = await supabase
          .rpc('get_all_prices_for_product' as any, { product_id_param: productData.id });

        if (!rpcError && rpcPrices && rpcPrices.length > 0) {
          // Map RPC result to PriceEntry format
          const mappedPrices: PriceEntry[] = rpcPrices.map((p: any, idx: number) => ({
            id: `price-${idx}`,
            price: Number(p.price),
            original_price: p.original_price ? Number(p.original_price) : null,
            is_on_sale: p.is_on_sale,
            is_available: true,
            last_checked_at: new Date().toISOString(),
            supermarkets: {
              id: p.supermarket_slug,
              name: p.supermarket_name,
              slug: p.supermarket_slug,
              logo_url: null,
              address: null,
            },
          }));
          setPrices(mappedPrices);
        } else {
          // Fallback: direct query
          const { data: pricesData } = await supabase
            .from('product_prices')
            .select(`
              *,
              supermarkets(id, name, slug, logo_url, address)
            `)
            .eq('product_id', productData.id)
            .order('price', { ascending: true });

          if (pricesData) {
            setPrices(pricesData as unknown as PriceEntry[]);
          }
        }

        // Fetch price history
        const { data: historyData } = await supabase
          .from('price_history')
          .select('price, recorded_at')
          .eq('product_id', productData.id)
          .order('recorded_at', { ascending: true })
          .limit(30);

        if (historyData) {
          setPriceHistory(historyData as PriceHistoryEntry[]);
        }
      }
      
      setIsLoading(false);
    };

    fetchProduct();
  }, [slug]);

  const bestPrice = prices.length > 0 ? prices[0] : null;

  const chartData = priceHistory.map((entry) => ({
    date: formatDate(entry.recorded_at),
    precio: entry.price,
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square skeleton rounded-3xl" />
            <div className="space-y-4">
              <div className="h-8 skeleton rounded w-3/4" />
              <div className="h-4 skeleton rounded w-1/2" />
              <div className="h-12 skeleton rounded w-1/3 mt-6" />
              <div className="h-32 skeleton rounded mt-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <Link to="/search" className="btn-primary">
            Volver a buscar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link
          to="/search"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Volver a resultados
        </Link>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card overflow-hidden"
          >
            <div className="aspect-square bg-surface-light flex items-center justify-center p-8">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-surface flex items-center justify-center">
                  <ShoppingCart size={48} className="text-text-muted" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              {product.categories && (
                <span className="text-sm text-primary font-medium">{product.categories.name}</span>
              )}
              <h1 className="text-3xl font-bold mt-1">{product.name}</h1>
              {product.brand && (
                <p className="text-text-muted mt-2">Marca: {product.brand}</p>
              )}
            </div>

            {/* Best Price Card */}
            {bestPrice && (
              <div className="card p-6 gradient-primary">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Mejor precio</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-white">
                        {formatCurrency(bestPrice.price)}
                      </span>
                      {bestPrice.original_price && (
                        <span className="text-lg text-white/60 line-through">
                          {formatCurrency(bestPrice.original_price)}
                        </span>
                      )}
                    </div>
                    <p className="text-white/80 mt-2">
                      en {bestPrice.supermarkets.name}
                    </p>
                  </div>
                  {bestPrice.original_price && (
                    <div className="bg-white/20 rounded-xl px-4 py-2">
                      <span className="text-white font-bold text-xl">
                        -{Math.round(((bestPrice.original_price - bestPrice.price) / bestPrice.original_price) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() =>
                  bestPrice &&
                  addItem({
                    product_id: product.id,
                    product_name: product.name,
                    product_image: product.image_url || undefined,
                    quantity: 1,
                    is_checked: false,
                    best_price: bestPrice.price,
                    best_supermarket: bestPrice.supermarkets.name,
                  })
                }
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Agregar a mi lista
              </button>
              <button
                onClick={() => {
                  if (!product) return;
                  if (isFav) {
                    removeFavorite(product.id);
                    setIsFav(false);
                  } else {
                    addFavorite({
                      product_id: product.id,
                      product_name: product.name,
                      product_slug: product.slug,
                      product_image: product.image_url || undefined,
                    });
                    setIsFav(true);
                  }
                }}
                className={cn(
                  'p-4 rounded-xl transition-all',
                  isFav
                    ? 'bg-danger/20 text-danger border border-danger/30'
                    : 'btn-secondary'
                )}
              >
                <Heart size={20} className={isFav ? 'fill-current' : ''} />
              </button>
            </div>

            {/* Product Details */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Detalles del producto</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-muted">Unidad:</span>
                  <span className="ml-2 font-medium">{product.unit}</span>
                </div>
                {product.barcode && (
                  <div>
                    <span className="text-text-muted">Código:</span>
                    <span className="ml-2 font-medium">{product.barcode}</span>
                  </div>
                )}
              </div>
              {product.description && (
                <p className="text-text-muted mt-4">{product.description}</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Price History Chart */}
        {chartData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8"
          >
            <h3 className="text-xl font-bold mb-6">Historial de Precios</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `Gs. ${v.toLocaleString()}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e1e2e',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Precio']}
                  />
                  <Line
                    type="monotone"
                    dataKey="precio"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* All Prices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <h3 className="text-xl font-bold mb-6">Precios en Supermercados</h3>
          
          <div className="space-y-4">
            {prices.map((priceEntry, index) => {
              const isBest = index === 0;
              const isWorst = index === prices.length - 1 && prices.length > 1;
              const priceDiff = bestPrice ? ((priceEntry.price - bestPrice.price) / bestPrice.price) * 100 : 0;
              
              return (
                <div
                  key={priceEntry.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl transition-all",
                    isBest && "bg-primary/10 border border-primary/30",
                    isWorst && "bg-surface-light",
                    !isBest && !isWorst && "bg-surface"
                  )}
                >
                  {/* Supermarket Logo */}
                  <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0">
                    {priceEntry.supermarkets.logo_url ? (
                      <img
                        src={priceEntry.supermarkets.logo_url}
                        alt={priceEntry.supermarkets.name}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Store size={20} className="text-text-muted" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{priceEntry.supermarkets.name}</span>
                      {isBest && <Star size={14} className="text-primary fill-primary" />}
                      {isWorst && <TrendingUp size={14} className="text-danger" />}
                    </div>
                    {priceEntry.supermarkets.address && (
                      <p className="text-sm text-text-muted truncate flex items-center gap-1">
                        <MapPin size={12} />
                        {priceEntry.supermarkets.address}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        isBest ? "text-primary" : "text-text"
                      )}>
                        {formatCurrency(priceEntry.price)}
                      </span>
                      {priceEntry.original_price && (
                        <span className="text-sm text-text-muted line-through">
                          {formatCurrency(priceEntry.original_price)}
                        </span>
                      )}
                    </div>
                    {!isBest && priceDiff > 0 && (
                      <span className="text-xs text-danger">+{priceDiff.toFixed(1)}%</span>
                    )}
                    {priceEntry.is_on_sale && (
                      <span className="badge badge-warning text-xs mt-1">Oferta</span>
                    )}
                  </div>

                  {/* Add Button */}
                  <button
                    onClick={() =>
                      addItem({
                        product_id: product.id,
                        product_name: product.name,
                        product_image: product.image_url || undefined,
                        quantity: 1,
                        is_checked: false,
                        best_price: priceEntry.price,
                        best_supermarket: priceEntry.supermarkets.name,
                      })
                    }
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isBest
                        ? "bg-primary text-white hover:bg-primary-dark"
                        : "bg-surface-light text-text-muted hover:bg-surface hover:text-text"
                    )}
                  >
                    <ShoppingCart size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
