import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  TrendingDown,
  ShoppingCart,
  Target,
  Award,
  Flame,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/auth-store';
import { formatCurrency, cn } from '../lib/utils';

interface SavingsStats {
  totalSaved: number;
  monthlySaved: number;
  averageDiscount: number;
  totalPurchases: number;
}

interface RecentActivity {
  id: string;
  product_name: string;
  supermarket_name: string;
  price: number;
  saved_amount: number;
  date: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const defaultBadges: Badge[] = [
  { id: '1', name: 'Primer Ahorro', icon: '🎯', description: 'Completá tu primera compra', unlocked: true },
  { id: '2', name: 'Ahorrador Pro', icon: '💰', description: 'Ahorrá más de Gs. 100,000', unlocked: true },
  { id: '3', name: 'Explorador', icon: '🔍', description: 'Visitá 5 supermercados diferentes', unlocked: false, progress: 3, maxProgress: 5 },
  { id: '4', name: 'Lista Perfecta', icon: '📝', description: 'Creá una lista con 10+ productos', unlocked: false, progress: 7, maxProgress: 10 },
  { id: '5', name: 'Racha de Fuego', icon: '🔥', description: 'Usá la app 7 días seguidos', unlocked: false, progress: 4, maxProgress: 7 },
  { id: '6', name: 'Maestro del Precio', icon: '👑', description: 'Encontrá el mejor precio 20 veces', unlocked: false, progress: 12, maxProgress: 20 },
];

const timeframes = [
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

export function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<SavingsStats>({
    totalSaved: 0,
    monthlySaved: 0,
    averageDiscount: 12,
    totalPurchases: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [badges] = useState<Badge[]>(defaultBadges);
  const [timeframe, setTimeframe] = useState('month');
  const [_isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      
      // In a real app, these would be actual queries
      // For now, we'll use mock data
      setTimeout(() => {
        setStats({
          totalSaved: 847500,
          monthlySaved: 125000,
          averageDiscount: 15,
          totalPurchases: 23,
        });

        setRecentActivity([
          {
            id: '1',
            product_name: 'Leche La Serenísima 1L',
            supermarket_name: 'Stock',
            price: 8500,
            saved_amount: 1200,
            date: new Date().toISOString(),
          },
          {
            id: '2',
            product_name: 'Arroz Pir Yvy 1kg',
            supermarket_name: 'Superseis',
            price: 6800,
            saved_amount: 900,
            date: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '3',
            product_name: 'Aceite Cocinero 900ml',
            supermarket_name: 'Biggie',
            price: 15200,
            saved_amount: 2300,
            date: new Date(Date.now() - 172800000).toISOString(),
          },
          {
            id: '4',
            product_name: 'Azúcar Marca Paraná 1kg',
            supermarket_name: 'Disco',
            price: 7500,
            saved_amount: 800,
            date: new Date(Date.now() - 259200000).toISOString(),
          },
        ]);

        setIsLoading(false);
      }, 1000);
    };

    fetchDashboardData();
  }, [timeframe]);

  const weeklyData = [
    { day: 'Lun', ahorro: 12000 },
    { day: 'Mar', ahorro: 8500 },
    { day: 'Mié', ahorro: 15000 },
    { day: 'Jue', ahorro: 5000 },
    { day: 'Vie', ahorro: 22000 },
    { day: 'Sáb', ahorro: 35000 },
    { day: 'Dom', ahorro: 27500 },
  ];

  const maxSaving = Math.max(...weeklyData.map((d) => d.ahorro));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold mb-2">
              Hola, {user?.email?.split('@')[0] || 'Ahorrador'} 👋
            </h1>
            <p className="text-text-muted">Aquí está tu resumen de ahorros</p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: 'Total Ahorrado',
              value: formatCurrency(stats.totalSaved),
              icon: DollarSign,
              color: 'text-primary',
              bgColor: 'bg-primary/10',
              trend: '+12%',
              trendUp: true,
            },
            {
              label: 'Este Mes',
              value: formatCurrency(stats.monthlySaved),
              icon: Calendar,
              color: 'text-secondary',
              bgColor: 'bg-secondary/10',
              trend: '+8%',
              trendUp: true,
            },
            {
              label: 'Descuento Promedio',
              value: `${stats.averageDiscount}%`,
              icon: Target,
              color: 'text-accent',
              bgColor: 'bg-accent/10',
              trend: '+2%',
              trendUp: true,
            },
            {
              label: 'Compras Realizadas',
              value: stats.totalPurchases.toString(),
              icon: ShoppingCart,
              color: 'text-info',
              bgColor: 'bg-info/10',
              trend: '+3',
              trendUp: true,
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bgColor)}>
                  <stat.icon size={24} className={stat.color} />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  stat.trendUp ? "text-primary" : "text-danger"
                )}>
                  {stat.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.trend}
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-text-muted mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Ahorro Semanal</h2>
            <div className="flex gap-2">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-sm font-medium transition-all",
                    timeframe === tf.value
                      ? "bg-primary text-white"
                      : "bg-surface-light text-text-muted hover:text-text"
                  )}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-48 flex items-end gap-2">
            {weeklyData.map((data, index) => (
              <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.ahorro / maxSaving) * 100}%` }}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                  className="w-full gradient-primary rounded-t-lg min-h-[4px]"
                />
                <span className="text-xs text-text-muted">{data.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Award size={24} className="text-accent" />
              <h2 className="text-xl font-bold">Insignias</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={cn(
                    "p-4 rounded-xl transition-all",
                    badge.unlocked
                      ? "bg-accent/10 border border-accent/30"
                      : "bg-surface-light opacity-60"
                  )}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h3 className="font-semibold text-sm">{badge.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{badge.description}</p>
                  
                  {!badge.unlocked && badge.progress !== undefined && (
                    <div className="mt-3">
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(badge.progress / (badge.maxProgress || 1)) * 100}%` }}
                          className="h-full gradient-primary rounded-full"
                        />
                      </div>
                      <p className="text-xs text-text-muted mt-1">
                        {badge.progress}/{badge.maxProgress}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Actividad Reciente</h2>
              <Link to="/search" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
                Ver todo <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-light transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingCart size={18} className="text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{activity.product_name}</p>
                    <p className="text-xs text-text-muted">{activity.supermarket_name}</p>
                  </div>

                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(activity.price)}</p>
                    <p className="text-xs text-primary flex items-center gap-1 justify-end">
                      <TrendingDown size={12} />
                      Ahorraste {formatCurrency(activity.saved_amount)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Streak Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 card p-6 gradient-primary"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Flame size={32} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">¡Racha de 4 días!</h3>
                <p className="text-white/80">Seguí ahorrando para desbloquear recompensas</p>
              </div>
            </div>

            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div
                  key={day}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                    day <= 4
                      ? "bg-white text-primary"
                      : "bg-white/20 text-white/60"
                  )}
                >
                  {day}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
