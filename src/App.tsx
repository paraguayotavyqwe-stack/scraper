import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from './integrations/supabase/client';
import { useAuthStore } from './stores/auth-store';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Product } from './pages/Product';
import { ShoppingList } from './pages/ShoppingList';
import { Map } from './pages/Map';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { Deals } from './pages/Deals';
import { Favorites } from './pages/Favorites';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="product/:slug" element={<Product />} />
            <Route path="shopping-list" element={<ShoppingList />} />
            <Route path="map" element={<Map />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="deals" element={<Deals />} />
            <Route path="favorites" element={<Favorites />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
