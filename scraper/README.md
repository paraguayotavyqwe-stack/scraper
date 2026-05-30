# AhorraPY Scraper

Sistema de scraping automatizado para precios de supermercados en Paraguay.

## Supermercados Soportados

| Supermercado | URL | Estado |
|-------------|-----|--------|
| Superseis | superseis.com.py | ✅ Funcionando |
| Stock | stock.com.py | ✅ Funcionando |
| Casa Rica | casarica.com.py | ✅ Funcionando |
| Biggie | biggie.com.py | ✅ Funcionando |
| Disco | disco.com.py | ✅ Funcionando |
| Villa Lima | villalima.com.py | ✅ Funcionando |

## Instalación

```bash
cd scraper
npm install
```

## Ejecución Manual

```bash
# Ejecutar todos los scrapers
npm run scrape

# Ejecutar un scraper específico
npm run scrape:superseis
npm run scrape:stock
npm run scrape:casa-rica
```

## Scraping Automático

### Opción 1: Cron (Linux/Mac)

```bash
chmod +x cron-setup.sh
./cron-setup.sh
```

Esto te permitirá configurar:
- Scraping diario a las 6 AM
- Scraping cada 12 horas
- Scraping cada 6 horas
- Scraping personalizado

### Opción 2: Systemd Timer (Linux)

```bash
# Copiar archivos de servicio
sudo cp ahorrapy-scraped.service /etc/systemd/system/
sudo cp ahorrapy-scrape.timer /etc/systemd/system/

# Habilitar y iniciar
sudo systemctl enable ahorrapy-scrape.timer
sudo systemctl start ahorrapy-scrape.timer

# Ver estado
sudo systemctl status ahorrapy-scrape.timer
```

### Opción 3: PM2 (Node.js)

```bash
# Instalar PM2
npm install -g pm2

# Ejecutar con PM2
pm2 start "npx tsx scheduler.ts" --name ahorrapy-scraper

# Configurar restart automático
pm2 save
pm2 startup
```

## Estructura

```
scraper/
├── base-scraper.ts           # Clase base
├── scheduler.ts              # Programador de tareas
├── run-all.ts                # Ejecutar todos
├── scrapers/
│   ├── superseis-scraper.ts
│   ├── stock-scraper.ts
│   ├── casa-rica-scraper.ts
│   ├── biggie-scraper.ts
│   ├── disco-scraper.ts
│   ├── villa-lima-scraper.ts
│   └── TEMPLATE-scraper.ts   # Plantilla para nuevos
├── .env                      # Variables de entorno
└── logs/                     # Logs de ejecución
```

## Agregar Nuevo Supermercado

1. Copia `scrapers/TEMPLATE-scraper.ts`
2. Renombra: `[nombre]-scraper.ts`
3. Modifica:
   - Nombre y slug del supermercado
   - URLs de categorías
   - Selectores CSS según la estructura del sitio
4. Agrega en `scheduler.ts`:
   ```typescript
   import { NuevoScraper } from './scrapers/nuevo-scraper';
   
   // En el array de scrapers:
   { name: 'Nuevo', slug: 'nuevo', scraper: new NuevoScraper(), enabled: true },
   ```
5. Agrega el supermercado en Supabase (si no existe)

## Logs

Los logs se guardan en `logs/YYYY-MM-DD.json`:

```json
{
  "timestamp": "2024-01-15T06:00:00.000Z",
  "results": [
    { "name": "Superseis", "success": true, "count": 105, "duration": 144.9 },
    { "name": "Stock", "success": true, "count": 24, "duration": 46.5 }
  ],
  "totalProducts": 129
}
```

## Troubleshooting

### El scraper no encuentra productos

1. Abre la URL en un navegador
2. Inspecciona la estructura HTML (F12)
3. Ajusta los selectores CSS en el scraper

### Error de conexión a Supabase

Verifica que `.env` tenga las credenciales correctas:
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

### Scraping muy lento

- Reduce el número de categorías
- Aumenta los timeouts
- Usa `headless: true` (ya está configurado así)

## URLs de Supermercados en Paraguay

### Con tienda online (scraping posible)

| Supermercado | URL Principal | Categorías |
|-------------|---------------|------------|
| Superseis | superseis.com.py/catalog/ | Lácteos, Carnes, Frutas, Bebidas, Almacén, Limpieza |
| Stock | stock.com.py | Productos destacados |
| Casa Rica | casarica.com.py/catalogo/ | Lácteos, Carnes, Bebidas, Limpieza |
| Biggie | biggie.com.py | WooCommerce |
| Disco | disco.com.py | WooCommerce |
| Villa Lima | villalima.com.py | WooCommerce |

### Sin tienda online (requiere otro método)

- Fortis Mayorista
- Mercado 4
- Supermercado El País
- La Barca
- etc.

Para estos, se puede usar:
- Crowdsourcing (usuarios reportan precios)
- OCR de tickets
- Datos manuales
