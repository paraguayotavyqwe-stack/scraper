import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Plus } from 'lucide-react';
import { useFavoritesStore } from '../stores/favorites-store';
import { useShoppingListStore } from '../stores/shopping-list-store';

export function Favorites() {
  const { favorites, removeFavorite } = useFavoritesStore();
  const addItem = useShoppingListStore((state) => state.addItem);

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Mis Favoritos</h1>

          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-surface-light flex items-center justify-center">
              <Heart size={48} className="text-text-muted" />
            </div>
            <h3 className="text-xl font-bold mb-2">No tenés favoritos</h3>
            <p className="text-text-muted mb-6">
              Guardá tus productos favoritos desde la página del producto
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Mis Favoritos</h1>
          <p className="text-text-muted mt-1">{favorites.length} productos guardados</p>
        </div>

        {/* Favorites Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((fav, index) => (
            <motion.div
              key={fav.product_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 flex items-center gap-4"
            >
              {/* Product Image */}
              <Link
                to={`/product/${fav.product_slug}`}
                className="w-16 h-16 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
              >
                {fav.product_image ? (
                  <img
                    src={fav.product_image}
                    alt={fav.product_name}
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  <ShoppingCart size={20} className="text-text-muted" />
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/product/${fav.product_slug}`}
                  className="font-medium truncate block hover:text-primary transition-colors"
                >
                  {fav.product_name}
                </Link>
                <p className="text-xs text-text-muted">
                  Guardado {new Date(fav.added_at).toLocaleDateString('es-PY')}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    addItem({
                      product_id: fav.product_id,
                      product_name: fav.product_name,
                      product_image: fav.product_image,
                      quantity: 1,
                      is_checked: false,
                    })
                  }
                  className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title="Agregar a mi lista"
                >
                  <ShoppingCart size={16} />
                </button>
                <button
                  onClick={() => removeFavorite(fav.product_id)}
                  className="p-2 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Eliminar de favoritos"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
