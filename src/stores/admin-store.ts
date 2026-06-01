import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminState {
  isAdmin: boolean;
  adminEmail: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const ADMIN_EMAIL = 'admin@ahorrapy.com.py';
const ADMIN_PASSWORD = 'AhorraPY2026!';

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      adminEmail: null,

      login: async (email: string, password: string) => {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          set({ isAdmin: true, adminEmail: email });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ isAdmin: false, adminEmail: null });
      },
    }),
    {
      name: 'ahorrapy-admin',
    }
  )
);
