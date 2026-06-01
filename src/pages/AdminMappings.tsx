import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Link2, Search, ShoppingCart, Trash2, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { cn } from '../lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  supermarket_name: string | null;
  supermarket_slug: string | null;
  price: number | null;
}

interface ProductMapping {
  id: string;
  canonical_product_id: string;
  mapped_product_id: string;
  canonical_name: string;
  mapped_name: string;
  canonical_supermarket: string;
  mapped_supermarket: string;
}

export function AdminMappings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mappedProducts, setMappedProducts] = useState<Product[]>([]);
  const [existingMappings, setExistingMappings] = useState<ProductMapping[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search products
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      setIsSearching(true);
      const { data } = await (supabase as any)
        .from('products_with_prices')
        .select('id, name, slug, image_url, supermarket_name, supermarket_slug, price')
        .ilike('name', `%${searchQuery}%`)
        .limit(30);

      if (data) {
        // Deduplicate by id
        const seen = new Set<string>();
        const unique = data.filter((p: any) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setSearchResults(unique as unknown as Product[]);
      }
      setIsSearching(false);
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load existing mappings
  useEffect(() => {
    const loadMappings = async () => {
      const { data } = await (supabase as any)
        .from('product_mappings')
        .select(`
          id,
          canonical_product_id,
          mapped_product_id
        `);

      if (data) {
        // Fetch product names separately
        const productIds = [...new Set(data.flatMap((m: any) => [m.canonical_product_id, m.mapped_product_id]))] as string[];
        const { data: products } = await supabase
          .from('products')
          .select('id, name')
          .in('id', productIds);
        
        const productMap = new Map((products || []).map((p: any) => [p.id, p.name]));

        setExistingMappings(data.map((m: any) => ({
          id: m.id,
          canonical_product_id: m.canonical_product_id,
          mapped_product_id: m.mapped_product_id,
          canonical_name: productMap.get(m.canonical_product_id) || 'Unknown',
          mapped_name: productMap.get(m.mapped_product_id) || 'Unknown',
          canonical_supermarket: '',
          mapped_supermarket: '',
        })));
      }
    };

    loadMappings();
  }, []);

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setSearchResults([]);
  };

  const addMappedProduct = (product: Product) => {
    if (selectedProduct && product.id !== selectedProduct.id) {
      setMappedProducts([...mappedProducts, product]);
    }
  };

  const removeMappedProduct = (productId: string) => {
    setMappedProducts(mappedProducts.filter((p) => p.id !== productId));
  };

  const saveMapping = async () => {
    if (!selectedProduct || mappedProducts.length === 0) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const mappings = mappedProducts.map((mp) => ({
        canonical_product_id: selectedProduct.id,
        mapped_product_id: mp.id,
      }));

      const { error } = await (supabase as any)
        .from('product_mappings')
        .upsert(mappings, { onConflict: 'canonical_product_id,mapped_product_id' });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `${mappings.length} mapeo(s) guardado(s)` });
        setSelectedProduct(null);
        setMappedProducts([]);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
              <Link2 size={24} className="text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mapeo de Productos</h1>
              <p className="text-text-muted">
                Conecta productos equivalentes entre supermercados para comparar precios
              </p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'p-4 rounded-xl mb-6 flex items-center gap-3',
              message.type === 'success' ? 'bg-primary/10 text-primary' : 'bg-danger/10 text-danger'
            )}
          >
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Search & Select */}
          <div className="space-y-6">
            {/* Search */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">1. Seleccioná el producto base</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl input"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4 max-h-80 overflow-y-auto space-y-2">
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className={cn(
                        'w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all',
                        selectedProduct?.id === product.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'bg-surface-light hover:bg-surface'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <ShoppingCart size={16} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-text-muted">
                          {product.supermarket_name} {product.price ? `· $${product.price}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Product */}
            {selectedProduct && (
              <div className="card p-6">
                <h3 className="font-semibold mb-3">Producto base seleccionado</h3>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/30">
                  <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt="" className="w-10 h-10 object-contain" />
                    ) : (
                      <ShoppingCart size={20} className="text-text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedProduct.name}</p>
                    <p className="text-sm text-text-muted">
                      {selectedProduct.supermarket_name} · {selectedProduct.price ? `$${selectedProduct.price}` : 'Sin precio'}
                    </p>
                  </div>
                  <Link
                    to={`/product/${selectedProduct.slug}`}
                    className="text-sm text-primary hover:underline"
                  >
                    Ver
                  </Link>
                </div>
              </div>
            )}

            {/* Add Products to Map */}
            {selectedProduct && (
              <div className="card p-6">
                <h3 className="font-semibold mb-4">2. Agregá productos equivalentes</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar producto equivalente en otro supermercado..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl input"
                  />
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
                    {searchResults
                      .filter((p) => p.id !== selectedProduct.id && !mappedProducts.find((m) => m.id === p.id))
                      .map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addMappedProduct(product)}
                          className="w-full text-left p-3 rounded-xl bg-surface-light hover:bg-surface flex items-center gap-3 transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-8 h-8 object-contain" />
                            ) : (
                              <ShoppingCart size={16} className="text-text-muted" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-text-muted">
                              {product.supermarket_name} · {product.price ? `$${product.price}` : 'Sin precio'}
                            </p>
                          </div>
                          <span className="text-xs text-primary font-medium">+ Agregar</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Mappings Summary */}
          <div className="space-y-6">
            {/* Mapped Products */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Productos a mapear</h3>
              {mappedProducts.length === 0 ? (
                <p className="text-text-muted text-sm py-4 text-center">
                  {selectedProduct
                    ? 'Buscá y agregá productos equivalentes de otros supermercados'
                    : 'Primero seleccioná un producto base de la izquierda'}
                </p>
              ) : (
                <div className="space-y-2">
                  {mappedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-light"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" className="w-8 h-8 object-contain" />
                        ) : (
                          <ShoppingCart size={16} className="text-text-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-text-muted">{product.supermarket_name}</p>
                      </div>
                      <button
                        onClick={() => removeMappedProduct(product.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Save Button */}
              {selectedProduct && mappedProducts.length > 0 && (
                <button
                  onClick={saveMapping}
                  disabled={isSaving}
                  className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Link2 size={18} />
                  )}
                  Guardar {mappedProducts.length} mapeo(s)
                </button>
              )}
            </div>

            {/* Existing Mappings */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Mapeos existentes ({existingMappings.length})</h3>
              {existingMappings.length === 0 ? (
                <p className="text-text-muted text-sm text-center py-4">
                  Aún no hay mapeos creados
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {existingMappings.map((mapping) => (
                    <div
                      key={mapping.id}
                      className="p-3 rounded-xl bg-surface-light text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">{mapping.canonical_name}</span>
                        <span className="text-text-muted">→</span>
                        <span className="font-medium truncate">{mapping.mapped_name}</span>
                      </div>
                      <p className="text-xs text-text-muted">
                        {mapping.canonical_supermarket} ↔ {mapping.mapped_supermarket}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
