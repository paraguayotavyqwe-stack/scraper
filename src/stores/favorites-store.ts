import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FavoriteItem {
  product_id: string;
  product_name: string;
  product_slug: string;
  product_image?: string;
  added_at: string;
}

interface FavoritesState {
  favorites: FavoriteItem[];
  addFavorite: (item: Omit<FavoriteItem, 'added_at'>) => void;
  removeFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (item) => {
        if (get().isFavorite(item.product_id)) return;
        set({
          favorites: [...get().favorites, { ...item, added_at: new Date().toISOString() }],
        });
      },

      removeFavorite: (productId) => {
        set({
          favorites: get().favorites.filter((f) => f.product_id !== productId),
        });
      },

      isFavorite: (productId) => {
        return get().favorites.some((f) => f.product_id === productId);
      },
    }),
    {
      name: 'ahorrapy-favorites',
    }
  )
);
