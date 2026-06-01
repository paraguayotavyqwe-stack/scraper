import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, TrendingDown, ShoppingCart, ArrowRight, Zap, Shield, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { formatCurrency } from '../lib/utils';

const features = [
  {
    icon: TrendingDown,
    title: 'Compara Precios',
    description: 'Encuentra los mejores precios en todos los supermercados de Asunción',
  },
  {
    icon: Tag,
    title: 'Ofertas del Día',
    description: 'Descubrí las ofertas activas y ahorrá aún más en tus compras',
  },
  {
    icon: ShoppingCart,
    title: 'Listas Inteligentes',
    description: 'Crea tu lista de compras y te decimos dónde comprar más barato',
  },
];

const stats = [
  { label: 'Productos', value: '10,000+' },
  { label: 'Supermercados', value: '25+' },
  { label: 'Usuarios', value: '5,000+' },
  { label: 'Ahorro Promedio', value: '15%' },
];

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_prices: { price: number; original_price: number | null }[];
}

interface DealProduct {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  product_prices: {
    price: number;
    original_price: number | null;
    supermarkets: { name: string };
  }[];
}

interface Supermarket {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [dealProducts, setDealProducts] = useState<DealProduct[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicStats, setDynamicStats] = useState(stats);

  useEffect(() => {
    const fetchData = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('*, product_prices(price, original_price)')
        .eq('is_active', true)
        .limit(8);

      const { data: markets } = await supabase
        .from('supermarkets')
        .select('id, name, slug, logo_url')
        .eq('is_active', true)
        .limit(6);

      // Fetch deals
      const { data: deals } = await supabase
        .from('product_prices')
        .select(`
          price, original_price,
          products!inner(id, name, slug, image_url, is_active),
          supermarkets(name)
        `)
        .eq('is_on_sale', true)
        .eq('products.is_active', true)
        .order('price', { ascending: true })
        .limit(20);

      // Fetch dynamic counts
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: marketCount } = await supabase
        .from('supermarkets')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (products) setFeaturedProducts(products as Product[]);
      if (markets) setSupermarkets(markets as Supermarket[]);

      // Group deals by product
      if (deals) {
        const grouped = new Map<string, DealProduct>();
        for (const row of deals as any[]) {
          const pid = row.products.id;
          if (!grouped.has(pid)) {
            grouped.set(pid, {
              id: row.products.id,
              name: row.products.name,
              slug: row.products.slug,
              image_url: row.products.image_url,
              product_prices: [],
            });
          }
          grouped.get(pid)!.product_prices.push({
            price: row.price,
            original_price: row.original_price,
            supermarkets: row.supermarkets,
          });
        }
        setDealProducts(Array.from(grouped.values()).slice(0, 4));
      }

      // Update stats
      setDynamicStats([
        { label: 'Productos', value: productCount ? `${productCount.toLocaleString()}+` : '10,000+' },
        { label: 'Supermercados', value: marketCount ? `${marketCount}+` : '6+' },
        { label: 'Usuarios', value: '5,000+' },
        { label: 'Ahorro Promedio', value: '15%' },
      ]);
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
            >
              <Zap size={16} className="text-primary" />
              <span className="text-sm font-medium text-primary">Ahorrá hasta un 30% en tus compras</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">Ahorrá dinero</span>
              <br />
              <span className="text-text">en tus compras</span>
            </h1>

            <p className="text-lg md:text-xl text-text-muted mb-8 max-w-2xl mx-auto">
              Compara precios de supermercados en Asunción y encontrá dónde comprar más barato.
              Tu billetera te lo va a agradecer.
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={20} />
                <input
                  type="text"
                  placeholder="¿Qué estás buscando? (ej: leche, arroz, aceite...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl input text-lg"
                />
                <Link
                  to={`/search?q=${searchQuery}`}
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn-primary px-6"
                >
                  Buscar
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3">
              {['Leche', 'Arroz', 'Aceite', 'Azúcar', 'Café'].map((term) => (
                <Link
                  key={term}
                  to={`/search?q=${term}`}
                  className="px-4 py-2 rounded-full glass text-sm font-medium hover:bg-surface-light transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto"
          >
            {dynamicStats.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center">
                <div className="text-2xl md:text-3xl font-bold text-gradient mb-1">{stat.value}</div>
                <div className="text-sm text-text-muted">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-surface-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-text-muted text-lg max-w-2xl mx-auto">
              Tres pasos simples para empezar a ahorrar
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="card p-8 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <feature.icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-text-muted">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Productos Populares</h2>
                <p className="text-text-muted">Los más buscados esta semana</p>
              </div>
              <Link
                to="/search"
                className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-medium"
              >
                Ver todos <ArrowRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.slice(0, 8).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/product/${product.slug}`}
                    className="card block overflow-hidden group"
                  >
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
                    <div className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                      {product.product_prices?.[0] && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(product.product_prices[0].price)}
                          </span>
                          {product.product_prices[0].original_price && (
                            <span className="text-sm text-text-muted line-through">
                              {formatCurrency(product.product_prices[0].original_price)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Daily Deals */}
      {dealProducts.length > 0 && (
        <section className="py-20 bg-surface-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                  <Tag size={28} className="text-danger" />
                  Ofertas del Día
                </h2>
                <p className="text-text-muted">Productos con descuento ahora</p>
              </div>
              <Link
                to="/deals"
                className="flex items-center gap-2 text-primary hover:text-primary-dark transition-colors font-medium"
              >
                Ver todas <ArrowRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {dealProducts.map((product, index) => {
                const bestPrice = product.product_prices[0]?.price || 0;
                const originalPrice = product.product_prices[0]?.original_price;
                const discount = originalPrice
                  ? Math.round(((originalPrice - bestPrice) / originalPrice) * 100)
                  : 0;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/product/${product.slug}`}
                      className="card block overflow-hidden group"
                    >
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
                              <Tag size={32} className="text-text-muted" />
                            </div>
                          )}
                        </div>
                        {discount > 0 && (
                          <div className="absolute top-3 right-3 bg-danger text-white px-3 py-1 rounded-full text-sm font-bold">
                            -{discount}%
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-danger">
                            {formatCurrency(bestPrice)}
                          </span>
                          {originalPrice && (
                            <span className="text-sm text-text-muted line-through">
                              {formatCurrency(originalPrice)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">
                          {product.product_prices[0]?.supermarkets?.name}
                          {product.product_prices.length > 1 && (
                            <span className="text-primary ml-1">· {product.product_prices.length} tiendas</span>
                          )}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Supermarkets */}
      {supermarkets.length > 0 && (
        <section className="py-20 bg-surface-dark/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Supermercados</h2>
              <p className="text-text-muted text-lg">Trabajamos con los mejores supermercados de Asunción</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {supermarkets.map((market, index) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="card p-6 flex flex-col items-center justify-center text-center hover:border-primary/50"
                >
                  {market.logo_url ? (
                    <img
                      src={market.logo_url}
                      alt={market.name}
                      className="w-16 h-16 object-contain mb-3"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mb-3">
                      <span className="text-white font-bold text-xl">{market.name[0]}</span>
                    </div>
                  )}
                  <span className="font-medium text-sm">{market.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl gradient-primary p-8 md:p-12 text-center"
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full" />
              <div className="absolute bottom-10 right-10 w-48 h-48 border-2 border-white rounded-full" />
            </div>
            
            <div className="relative z-10">
              <Shield size={48} className="text-white mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                ¿Listo para ahorrar?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Unite a miles de paraguayos que ya están ahorrando en sus compras del supermercado.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth" className="bg-white text-primary px-8 py-4 rounded-xl font-bold hover:bg-white/90 transition-colors">
                  Crear Cuenta Gratis
                </Link>
                <Link to="/search" className="border-2 border-white text-white px-8 py-4 rounded-xl font-bold hover:bg-white/10 transition-colors">
                  Explorar Productos
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-gradient">AhorraPY</span>
            </div>
            <p className="text-text-muted text-sm">
              © 2026 AhorraPY. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm text-text-muted">
              <a href="#" className="hover:text-text transition-colors">Términos</a>
              <a href="#" className="hover:text-text transition-colors">Privacidad</a>
              <a href="#" className="hover:text-text transition-colors">Contacto</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
