import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, MapPin, Clock, Car, Check, Store } from 'lucide-react';
import { useShoppingListStore } from '../stores/shopping-list-store';
import { formatCurrency } from '../lib/utils';

export function ShoppingList() {
  const {
    items,
    removeItem,
    updateQuantity,
    toggleChecked,
    clearList,
    totalCost,
  } = useShoppingListStore();

  const checkedItems = items.filter((i) => i.is_checked);
  const uncheckedItems = items.filter((i) => !i.is_checked);

  // Group by supermarket
  const groupedBySupermarket = uncheckedItems.reduce((acc, item) => {
    const supermarket = item.best_supermarket || 'Sin supermercado';
    if (!acc[supermarket]) {
      acc[supermarket] = [];
    }
    acc[supermarket].push(item);
    return acc;
  }, {} as Record<string, typeof uncheckedItems>);

  const supermarketTotals = Object.entries(groupedBySupermarket).map(([name, items]) => ({
    name,
    items,
    total: items.reduce((sum, item) => sum + (item.best_price || 0) * item.quantity, 0),
  }));

  const estimatedSavings = items.reduce((sum, item) => {
    const avgPrice = (item.best_price || 0) * 1.15;
    return sum + (avgPrice - (item.best_price || 0)) * item.quantity;
  }, 0);

  if (items.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mi Lista de Compras</h1>
          
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-light flex items-center justify-center">
              <ShoppingCart size={48} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">Tu lista está vacía</h3>
            <p className="text-text-muted mb-6">
              Agrega productos desde la búsqueda para crear tu lista inteligente
            </p>
            <Link to="/search" className="btn-primary inline-flex items-center gap-2">
              <Plus size={20} />
              Explorar Productos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mi Lista de Compras</h1>
            <p className="text-text-muted mt-1">{items.length} productos en tu lista</p>
          </div>
          <button
            onClick={clearList}
            className="btn-secondary text-danger hover:bg-danger/10 hover:border-danger/30"
          >
            Limpiar todo
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unchecked Items */}
            {uncheckedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-primary" />
                  Por comprar ({uncheckedItems.length})
                </h2>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {uncheckedItems.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="card p-4 flex items-center gap-4"
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleChecked(item.product_id)}
                          className="w-6 h-6 rounded-lg border-2 border-border hover:border-primary flex items-center justify-center transition-colors"
                        >
                          {item.is_checked && <Check size={14} className="text-primary" />}
                        </button>

                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-12 h-12 object-contain"
                            />
                          ) : (
                            <ShoppingCart size={20} className="text-text-muted" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{item.product_name}</h3>
                          {item.best_supermarket && (
                            <p className="text-sm text-text-muted flex items-center gap-1">
                              <Store size={12} />
                              {item.best_supermarket}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center hover:bg-surface transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-surface-light flex items-center justify-center hover:bg-surface transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="font-bold text-primary">
                            {formatCurrency((item.best_price || 0) * item.quantity)}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(item.product_id)}
                          className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Checked Items */}
            {checkedItems.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-text-muted">
                  <Check size={20} />
                  Comprados ({checkedItems.length})
                </h2>
                
                <div className="space-y-3">
                  {checkedItems.map((item) => (
                    <div
                      key={item.id}
                      className="card p-4 flex items-center gap-4 opacity-60"
                    >
                      <button
                        onClick={() => toggleChecked(item.product_id)}
                        className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center"
                      >
                        <Check size={14} className="text-white" />
                      </button>
                      
                      <div className="w-16 h-16 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0">
                        <ShoppingCart size={20} className="text-text-muted" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium line-through">{item.product_name}</h3>
                      </div>

                      <span className="text-text-muted line-through">
                        {formatCurrency((item.best_price || 0) * item.quantity)}
                      </span>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-6">
            {/* Total Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 sticky top-24"
            >
              <h3 className="font-semibold mb-4">Resumen</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-text-muted">Subtotal</span>
                  <span className="font-medium">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-primary">
                  <span>Ahorro estimado</span>
                  <span className="font-bold">{formatCurrency(estimatedSavings)}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total estimado</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(totalCost)}</span>
                  </div>
                </div>
              </div>

              {/* Supermarket Breakdown */}
              {supermarketTotals.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-text-muted mb-3">Por supermercado:</h4>
                  <div className="space-y-2">
                    {supermarketTotals.map((supermarket) => (
                      <div
                        key={supermarket.name}
                        className="flex items-center justify-between p-3 rounded-xl bg-surface-light"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <Store size={14} className="text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{supermarket.name}</p>
                            <p className="text-xs text-text-muted">{supermarket.items.length} productos</p>
                          </div>
                        </div>
                        <span className="font-medium">{formatCurrency(supermarket.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimated Info */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-light">
                  <Clock size={18} className="text-secondary" />
                  <div>
                    <p className="text-sm font-medium">Tiempo estimado</p>
                    <p className="text-xs text-text-muted">~{Math.max(15, items.length * 2)} minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-light">
                  <Car size={18} className="text-accent" />
                  <div>
                    <p className="text-sm font-medium">Combustible estimado</p>
                    <p className="text-xs text-text-muted">Gs. {supermarketTotals.length * 5000}</p>
                  </div>
                </div>
              </div>

              <button className="btn-primary w-full flex items-center justify-center gap-2">
                <MapPin size={18} />
                Ver ruta en el mapa
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
