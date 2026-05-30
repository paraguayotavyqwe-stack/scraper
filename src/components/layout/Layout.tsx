import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingCart, Map, BarChart3, Menu, X, LogIn, User } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/auth-store';
import { useShoppingListStore } from '../../stores/shopping-list-store';
import { cn } from '../../lib/utils';

const navItems = [
  { path: '/', label: 'Inicio', icon: Home },
  { path: '/search', label: 'Buscar', icon: Search },
  { path: '/shopping-list', label: 'Mi Lista', icon: ShoppingCart },
  { path: '/map', label: 'Mapa', icon: Map },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
];

export function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const items = useShoppingListStore((state) => state.items);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold text-gradient hidden sm:block">AhorraPY</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : 'text-text-muted hover:text-text hover:bg-surface-light'
                    )}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                    {item.path === '/shopping-list' && items.length > 0 && (
                      <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Auth Button */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-light hover:bg-surface transition-colors"
                >
                  <div className="w-8 h-8 rounded-full gradient-secondary flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="font-medium">{user.email?.split('@')[0]}</span>
                </Link>
              ) : (
                <Link to="/auth" className="btn-primary flex items-center gap-2">
                  <LogIn size={18} />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-surface-light transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-surface border-l border-border"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <span className="text-xl font-bold text-gradient">Menú</span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-surface-light transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-primary/20 text-primary'
                            : 'text-text-muted hover:text-text hover:bg-surface-light'
                        )}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                        {item.path === '/shopping-list' && items.length > 0 && (
                          <span className="ml-auto bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {items.length}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-8 pt-6 border-t border-border">
                  {user ? (
                    <Link
                      to="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-light transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full gradient-secondary flex items-center justify-center">
                        <User size={18} className="text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{user.email?.split('@')[0]}</p>
                        <p className="text-sm text-text-muted">Ver perfil</p>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="btn-primary flex items-center justify-center gap-2 w-full"
                    >
                      <LogIn size={18} />
                      <span>Iniciar Sesión</span>
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden glass border-t border-border">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted'
                )}
              >
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.path === '/shopping-list' && items.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
