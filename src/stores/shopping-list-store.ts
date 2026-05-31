import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ShoppingListItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  is_checked: boolean;
  best_price?: number;
  best_supermarket?: string;
}

interface ShoppingListState {
  items: ShoppingListItem[];
  addItem: (item: Omit<ShoppingListItem, 'id'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleChecked: (productId: string) => void;
  clearList: () => void;
  calculateTotals: () => void;
  totalSavings: number;
  totalCost: number;
}

export const useShoppingListStore = create<ShoppingListState>()(
  persist(
    (set, get) => ({
      items: [],
      totalSavings: 0,
      totalCost: 0,
      
      addItem: (item) => {
        const existing = get().items.find((i) => i.product_id === item.product_id);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product_id === item.product_id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          });
        } else {
          set({
            items: [...get().items, { ...item, id: crypto.randomUUID() }],
          });
        }
        get().calculateTotals();
      },
      
      removeItem: (productId) => {
        set({
          items: get().items.filter((i) => i.product_id !== productId),
        });
        get().calculateTotals();
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        });
        get().calculateTotals();
      },
      
      toggleChecked: (productId) => {
        set({
          items: get().items.map((i) =>
            i.product_id === productId ? { ...i, is_checked: !i.is_checked } : i
          ),
        });
      },
      
      clearList: () => set({ items: [], totalSavings: 0, totalCost: 0 }),
      
      calculateTotals: () => {
        const items = get().items;
        const total = items.reduce((sum, item) => sum + (item.best_price || 0) * item.quantity, 0);
        set({ totalCost: total });
      },
    }),
    {
      name: 'ahorrapy-shopping-list',
    }
  )
);
