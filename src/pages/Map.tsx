import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import { motion } from 'framer-motion';
import { Navigation, Clock, Phone, ExternalLink, Search } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { cn, calculateDistance } from '../lib/utils';

// Default center: Asunción, Paraguay
const DEFAULT_CENTER: [number, number] = [-25.2637, -57.5759];

interface Supermarket {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  opening_hours: Record<string, string>;
  latitude: number;
  longitude: number;
  distance_km?: number;
}

const supermarketIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  }, [center, map]);
  return null;
}

export function Map() {
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [selectedSupermarket, setSelectedSupermarket] = useState<Supermarket | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          console.log('Using default location: Asunción');
        }
      );
    }

    const fetchSupermarkets = async () => {
      const { data, error } = await supabase
        .from('supermarkets')
        .select('*')
        .eq('is_active', true);

      if (!error && data) {
        const parsed = data.map((s) => ({
          ...s,
          latitude: s.latitude || DEFAULT_CENTER[0],
          longitude: s.longitude || DEFAULT_CENTER[1],
          opening_hours: (s.opening_hours as Record<string, string>) || {},
        }));
        setSupermarkets(parsed);
      }
      setIsLoading(false);
    };

    fetchSupermarkets();
  }, []);

  const isStoreOpen = (supermarket: Supermarket): boolean => {
    const now = new Date();
    const dayName = now.toLocaleDateString('es-PY', { weekday: 'long' }).toLowerCase();
    const hours = supermarket.opening_hours?.[dayName];
    if (!hours || hours === 'Cerrado') return false;
    
    const timeMatch = hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (!timeMatch) return true;
    
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseInt(timeMatch[1]) * 60 + parseInt(timeMatch[2]);
    const closeMinutes = parseInt(timeMatch[3]) * 60 + parseInt(timeMatch[4]);
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  const filteredSupermarkets = useMemo(() => {
    let filtered = supermarkets.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    if (selectedFilter === 'open') {
      filtered = filtered.filter((s) => isStoreOpen(s));
    } else if (selectedFilter === 'nearby') {
      filtered = filtered
        .map((s) => ({
          ...s,
          distance_km: calculateDistance(
            userLocation[0], userLocation[1],
            s.latitude, s.longitude
          ),
        }))
        .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0))
        .slice(0, 10);
    }

    return filtered;
  }, [supermarkets, searchQuery, selectedFilter, userLocation]);

  const getDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="p-4 bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Mapa de Supermercados</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input
                type="text"
                placeholder="Buscar supermercado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl input"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              {['all', 'open', 'nearby'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    selectedFilter === filter
                      ? "bg-primary text-white"
                      : "bg-surface-light text-text-muted hover:text-text"
                  )}
                >
                  {filter === 'all' ? 'Todos' : filter === 'open' ? 'Abiertos' : 'Cercanos'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Map and Sidebar */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-full md:w-96 bg-surface overflow-y-auto hidden md:block">
          <div className="p-4 space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="card p-4 space-y-3">
                  <div className="h-5 skeleton rounded w-2/3" />
                  <div className="h-4 skeleton rounded w-1/2" />
                  <div className="h-4 skeleton rounded w-3/4" />
                </div>
              ))
            ) : (
              filteredSupermarkets.map((supermarket) => (
                <motion.div
                  key={supermarket.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "card p-4 cursor-pointer transition-all",
                    selectedSupermarket?.id === supermarket.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                  onClick={() => {
                    setSelectedSupermarket(supermarket);
                    setUserLocation([supermarket.latitude, supermarket.longitude]);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-surface-light flex items-center justify-center flex-shrink-0">
                      {supermarket.logo_url ? (
                        <img
                          src={supermarket.logo_url}
                          alt={supermarket.name}
                          className="w-8 h-8 object-contain"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">{supermarket.name[0]}</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold">{supermarket.name}</h3>
                      {supermarket.address && (
                        <p className="text-sm text-text-muted truncate">{supermarket.address}</p>
                      )}
                      {supermarket.distance_km && (
                        <p className="text-sm text-primary mt-1">
                          {supermarket.distance_km} km de distancia
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(supermarket.latitude, supermarket.longitude);
                      }}
                      className="flex-1 py-2 px-3 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
                    >
                      <Navigation size={14} />
                      Cómo llegar
                    </button>
                    {supermarket.phone && (
                      <a
                        href={`tel:${supermarket.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 rounded-lg bg-surface-light text-text-muted hover:text-text transition-colors"
                      >
                        <Phone size={14} />
                      </a>
                    )}
                    {supermarket.website && (
                      <a
                        href={supermarket.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-2 px-3 rounded-lg bg-surface-light text-text-muted hover:text-text transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* Opening Hours */}
                  {supermarket.opening_hours && Object.keys(supermarket.opening_hours).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-text-muted">
                        <Clock size={14} />
                        <span>
                          {supermarket.opening_hours[
                            new Date().toLocaleDateString('es-PY', { weekday: 'long' }).toLowerCase()
                          ] || 'Horario no disponible'}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={userLocation}
            zoom={13}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapUpdater center={userLocation} />
            
            {/* User Location Marker */}
            <Marker position={userLocation} icon={supermarketIcon}>
              <Popup>
                <div className="text-center p-2">
                  <p className="font-semibold">Tu ubicación</p>
                </div>
              </Popup>
            </Marker>

            {/* Supermarket Markers */}
            {filteredSupermarkets.map((supermarket) => (
              <Marker
                key={supermarket.id}
                position={[supermarket.latitude, supermarket.longitude]}
                icon={supermarketIcon}
                eventHandlers={{
                  click: () => setSelectedSupermarket(supermarket),
                }}
              >
                <Popup>
                  <div className="p-2 min-w-[200px]">
                    <h3 className="font-semibold mb-1">{supermarket.name}</h3>
                    {supermarket.address && (
                      <p className="text-sm text-gray-600 mb-2">{supermarket.address}</p>
                    )}
                    <button
                      onClick={() => getDirections(supermarket.latitude, supermarket.longitude)}
                      className="w-full py-2 px-3 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Cómo llegar
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Mobile List Toggle */}
          <div className="absolute bottom-4 left-4 right-4 md:hidden">
            <div className="bg-surface rounded-2xl shadow-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="font-semibold mb-3">Supermercados cercanos</h3>
              <div className="space-y-3">
                {filteredSupermarkets.slice(0, 5).map((supermarket) => (
                  <div
                    key={supermarket.id}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-light cursor-pointer"
                    onClick={() => {
                      setSelectedSupermarket(supermarket);
                      setUserLocation([supermarket.latitude, supermarket.longitude]);
                    }}
                  >
                    <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center">
                      <span className="font-bold text-primary">{supermarket.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{supermarket.name}</p>
                      <p className="text-xs text-text-muted truncate">{supermarket.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
