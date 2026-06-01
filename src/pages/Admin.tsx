import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Package, DollarSign, Store, Tag, Link2, BarChart3,
  LogOut, Search, Trash2, Check, X, Eye, TrendingUp, AlertCircle
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAdminStore } from '../stores/admin-store';
import { formatCurrency, cn } from '../lib/utils';

type Tab = 'overview' | 'products' | 'prices' | 'supermarkets' | 'categories' | 'mappings';

interface Stats {
  totalProducts: number;
  totalPrices: number;
  totalSupermarkets: number;
  totalCategories: number;
  totalMappings: number;
  productsOnSale: number;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  category_id: string | null;
  is_active: boolean;
  categories: { name: string } | null;
  price_count: number;
}

interface PriceRow {
  id: string;
  product_id: string;
  supermarket_id: string;
  price: number;
  original_price: number | null;
  is_on_sale: boolean;
  is_available: boolean;
  last_checked_at: string;
  products: { name: string } | null;
  supermarkets: { name: string; slug: string } | null;
}

interface SupermarketRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  product_count: number;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  product_count: number;
}

interface MappingRow {
  id: string;
  canonical_product_id: string;
  mapped_product_id: string;
  canonical_name: string;
  mapped_name: string;
  canonical_image: string | null;
  mapped_image: string | null;
}

export function Admin() {
  const { isAdmin, adminEmail, login, logout } = useAdminStore();
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [supermarkets, setSupermarkets] = useState<SupermarketRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await login(loginEmail, loginPassword);
    if (!success) setLoginError('Credenciales incorrectas');
  };

  // Fetch data based on active tab
  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin, activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Always fetch stats
      const [prodCount, priceCount, marketCount, catCount, mappingCount, saleCount] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('product_prices').select('*', { count: 'exact', head: true }),
        supabase.from('supermarkets').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        (supabase as any).from('product_mappings').select('*', { count: 'exact', head: true }),
        supabase.from('product_prices').select('*', { count: 'exact', head: true }).eq('is_on_sale', true),
      ]);

      setStats({
        totalProducts: prodCount.count || 0,
        totalPrices: priceCount.count || 0,
        totalSupermarkets: marketCount.count || 0,
        totalCategories: catCount.count || 0,
        totalMappings: mappingCount.count || 0,
        productsOnSale: saleCount.count || 0,
      });

      // Fetch tab data
      if (activeTab === 'products') {
        const { data } = await supabase
          .from('products')
          .select('id, name, slug, image_url, category_id, is_active, categories!products_category_id_fkey(name)')
          .order('name')
          .limit(200);
        if (data) setProducts(data as any);
      }

      if (activeTab === 'prices') {
        const { data } = await supabase
          .from('product_prices')
          .select('*, products(name), supermarkets(name, slug)')
          .order('last_checked_at', { ascending: false })
          .limit(200);
        if (data) setPrices(data as any);
      }

      if (activeTab === 'supermarkets') {
        const { data } = await supabase.from('supermarkets').select('*').order('name');
        if (data) {
          // Get product counts per supermarket
          const withCounts = await Promise.all(
            data.map(async (s: any) => {
              const { count } = await supabase
                .from('product_prices')
                .select('*', { count: 'exact', head: true })
                .eq('supermarket_id', s.id);
              return { ...s, product_count: count || 0 };
            })
          );
          setSupermarkets(withCounts);
        }
      }

      if (activeTab === 'categories') {
        const { data } = await supabase.from('categories').select('*').order('name');
        if (data) {
          const withCounts = await Promise.all(
            data.map(async (c: any) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', c.id);
              return { ...c, product_count: count || 0 };
            })
          );
          setCategories(withCounts);
        }
      }

      if (activeTab === 'mappings') {
        const { data } = await (supabase as any)
          .from('product_mappings')
          .select('id, canonical_product_id, mapped_product_id');
        if (data) {
          const productIds = [...new Set(data.flatMap((m: any) => [m.canonical_product_id, m.mapped_product_id]))] as string[];
          const { data: prods } = await supabase.from('products').select('id, name, image_url').in('id', productIds);
          const prodMap = new Map((prods || []).map((p: any) => [p.id, p]));
          setMappings(data.map((m: any) => ({
            id: m.id,
            canonical_product_id: m.canonical_product_id,
            mapped_product_id: m.mapped_product_id,
            canonical_name: prodMap.get(m.canonical_product_id)?.name || 'Unknown',
            mapped_name: prodMap.get(m.mapped_product_id)?.name || 'Unknown',
            canonical_image: prodMap.get(m.canonical_product_id)?.image_url || null,
            mapped_image: prodMap.get(m.mapped_product_id)?.image_url || null,
          })));
        }
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }

    setIsLoading(false);
  };

  const deleteMapping = async (id: string) => {
    await (supabase as any).from('product_mappings').delete().eq('id', id);
    setMappings(mappings.filter((m) => m.id !== id));
    setMessage({ type: 'success', text: 'Mapeo eliminado' });
  };

  const toggleProductActive = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id);
    setProducts(products.map((p) => p.id === id ? { ...p, is_active: !current } : p));
  };

  const toggleSupermarketActive = async (id: string, current: boolean) => {
    await supabase.from('supermarkets').update({ is_active: !current }).eq('id', id);
    setSupermarkets(supermarkets.map((s) => s.id === id ? { ...s, is_active: !current } : s));
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Eliminar este producto?')) return;
    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter((p) => p.id !== id));
    setMessage({ type: 'success', text: 'Producto eliminado' });
  };

  // Login screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-8 w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            <p className="text-text-muted mt-1">AhorraPY Control Center</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-text-muted mb-1 block">Email</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl input"
                placeholder="admin@ahorrapy.com.py"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text-muted mb-1 block">Password</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl input"
                placeholder="••••••••"
                required
              />
            </div>

            {loginError && (
              <div className="flex items-center gap-2 text-danger text-sm">
                <AlertCircle size={16} />
                {loginError}
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              Iniciar Sesión
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'prices', label: 'Precios', icon: DollarSign },
    { id: 'supermarkets', label: 'Supermercados', icon: Store },
    { id: 'categories', label: 'Categorías', icon: Tag },
    { id: 'mappings', label: 'Mapeos', icon: Link2 },
  ];

  const filteredProducts = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const filteredPrices = searchQuery
    ? prices.filter((p) =>
        p.products?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.supermarkets?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : prices;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="glass border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-bold">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-text-muted">{adminEmail}</span>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-surface-light transition-colors text-text-muted hover:text-danger">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                'p-4 rounded-xl mb-6 flex items-center gap-3',
                message.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
              )}
            >
              {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
              {message.text}
              <button onClick={() => setMessage(null)} className="ml-auto"><X size={16} /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:bg-surface-light'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Overview */}
        {!isLoading && activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Productos', value: stats.totalProducts, icon: Package, color: 'text-primary' },
                { label: 'Precios', value: stats.totalPrices, icon: DollarSign, color: 'text-secondary' },
                { label: 'Supermercados', value: stats.totalSupermarkets, icon: Store, color: 'text-accent' },
                { label: 'Categorías', value: stats.totalCategories, icon: Tag, color: 'text-warning' },
                { label: 'Mapeos', value: stats.totalMappings, icon: Link2, color: 'text-danger' },
                { label: 'En Oferta', value: stats.productsOnSale, icon: TrendingUp, color: 'text-success' },
              ].map((stat) => (
                <div key={stat.label} className="card p-4">
                  <stat.icon size={20} className={stat.color} />
                  <p className="text-2xl font-bold mt-2">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Supermarket Breakdown */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Precios por Supermercado</h3>
              <div className="space-y-3">
                {supermarkets.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{s.name}</span>
                    <div className="flex-1 h-6 bg-surface-light rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: `${stats.totalPrices > 0 ? (s.product_count / stats.totalPrices) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-text-muted w-16 text-right">{s.product_count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {!isLoading && activeTab === 'products' && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl input text-sm"
                />
              </div>
              <span className="text-sm text-text-muted">{filteredProducts.length} productos</span>
            </div>
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div key={product.id} className="card p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-8 h-8 object-contain" />
                    ) : (
                      <Package size={16} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-text-muted">
                      {product.categories?.name || 'Sin categoría'}
                    </p>
                  </div>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    product.is_active ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
                  )}>
                    {product.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <button
                    onClick={() => toggleProductActive(product.id, product.is_active)}
                    className="p-1.5 rounded-lg hover:bg-surface-light transition-colors text-text-muted"
                    title={product.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {product.is_active ? <Eye size={14} /> : <Eye size={14} className="opacity-40" />}
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-text-muted hover:text-danger"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prices */}
        {!isLoading && activeTab === 'prices' && (
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por producto o supermercado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl input text-sm"
                />
              </div>
              <span className="text-sm text-text-muted">{filteredPrices.length} precios</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-muted border-b border-border">
                    <th className="pb-3 font-medium">Producto</th>
                    <th className="pb-3 font-medium">Supermercado</th>
                    <th className="pb-3 font-medium text-right">Precio</th>
                    <th className="pb-3 font-medium text-right">Original</th>
                    <th className="pb-3 font-medium text-center">Oferta</th>
                    <th className="pb-3 font-medium text-center">Disponible</th>
                    <th className="pb-3 font-medium text-right">Última revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.map((price) => (
                    <tr key={price.id} className="border-b border-border/50 hover:bg-surface-light/50">
                      <td className="py-2.5 max-w-[200px] truncate">{price.products?.name || '—'}</td>
                      <td className="py-2.5">{price.supermarkets?.name || '—'}</td>
                      <td className="py-2.5 text-right font-medium text-primary">{formatCurrency(price.price)}</td>
                      <td className="py-2.5 text-right text-text-muted">
                        {price.original_price ? formatCurrency(price.original_price) : '—'}
                      </td>
                      <td className="py-2.5 text-center">
                        {price.is_on_sale && <span className="badge badge-warning text-xs">Oferta</span>}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={cn('w-2 h-2 rounded-full inline-block', price.is_available ? 'bg-success' : 'bg-danger')} />
                      </td>
                      <td className="py-2.5 text-right text-text-muted text-xs">
                        {new Date(price.last_checked_at).toLocaleDateString('es-PY')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Supermarkets */}
        {!isLoading && activeTab === 'supermarkets' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {supermarkets.map((market) => (
              <div key={market.id} className="card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center">
                    {market.logo_url ? (
                      <img src={market.logo_url} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <Store size={24} className="text-text-muted" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{market.name}</h3>
                    <p className="text-xs text-text-muted">/{market.slug}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">{market.product_count.toLocaleString()} productos</span>
                  <button
                    onClick={() => toggleSupermarketActive(market.id, market.is_active)}
                    className={cn(
                      'text-xs px-3 py-1 rounded-full transition-colors',
                      market.is_active
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-danger/10 text-danger hover:bg-danger/20'
                    )}
                  >
                    {market.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Categories */}
        {!isLoading && activeTab === 'categories' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Tag size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-xs text-text-muted">/{cat.slug}</p>
                  </div>
                </div>
                <p className="text-sm text-text-muted mt-3">{cat.product_count.toLocaleString()} productos</p>
              </div>
            ))}
          </div>
        )}

        {/* Mappings */}
        {!isLoading && activeTab === 'mappings' && (
          <div>
            <p className="text-sm text-text-muted mb-4">
              {mappings.length} mapeos activos. Usá la página <a href="/admin/mappings" className="text-primary hover:underline">/admin/mappings</a> para crear nuevos.
            </p>
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div key={mapping.id} className="card p-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center flex-shrink-0">
                      {mapping.canonical_image ? (
                        <img src={mapping.canonical_image} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Package size={12} className="text-text-muted" />
                      )}
                    </div>
                    <span className="text-sm truncate">{mapping.canonical_name}</span>
                  </div>
                  <Link2 size={14} className="text-text-muted flex-shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded bg-surface-light flex items-center justify-center flex-shrink-0">
                      {mapping.mapped_image ? (
                        <img src={mapping.mapped_image} alt="" className="w-6 h-6 object-contain" />
                      ) : (
                        <Package size={12} className="text-text-muted" />
                      )}
                    </div>
                    <span className="text-sm truncate">{mapping.mapped_name}</span>
                  </div>
                  <button
                    onClick={() => deleteMapping(mapping.id)}
                    className="p-1.5 rounded-lg hover:bg-danger/10 transition-colors text-text-muted hover:text-danger flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
