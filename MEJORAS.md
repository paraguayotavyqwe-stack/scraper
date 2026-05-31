# AhorraPY - Plan de Mejoras

## Estado Actual

| Componente | Estado |
|------------|--------|
| Frontend | ✅ Desplegado en Vercel |
| Backend | ✅ Supabase |
| Scraping | ✅ 4 supermercados activos |
| Imágenes | ✅ 100% reales |
| Auto-scraping | ✅ GitHub Actions (diario) |

---

## 🔴 CRÍTICO (Arreglar ahora)

### Frontend

| # | Problema | Archivo | Impacto | Estado |
|---|----------|---------|---------|--------|
| 1 | **Lista de compras se pierde al recargar** | `stores/shopping-list-store.ts` | Los usuarios pierden su lista al cerrar la pestaña | ✅ **RESUELTO** - Zustand persist con localStorage |
| 2 | **Búsqueda no ordena bien** | `pages/Search.tsx` | El orden por precio es arbitrario | ✅ **RESUELTO** - Ordenamiento por mejor precio |
| 3 | **Filtros del mapa no funcionan** | `pages/Map.tsx` | Botones "Abiertos"/"Cercanos" no hacen nada | ✅ **RESUELTO** - Filtros implementados |
| 4 | **Sin límites en búsqueda** | `pages/Search.tsx` | Carga todos los productos de golpe | ✅ **RESUELTO** - Paginación de 20 items |
| 5 | **Sin debounce en búsqueda** | `pages/Search.tsx` | Cada tecla hace consulta a DB | ✅ **RESUELTO** - Debounce de 300ms |

### Scraper

| # | Problema | Archivo | Impacto | Estado |
|---|----------|---------|---------|--------|
| 6 | **`.env` en el repo** | `.env` | Seguridad comprometida | ✅ **RESUELTO** - .env.example creados, .gitignore verificado |
| 7 | **Placeholders se guardan como reales** | `base-scraper.ts` | Imágenes falsas en la DB | ✅ **RESUELTO** - Productos sin imagen se omiten |
| 8 | **N+1 queries en saveProducts** | `base-scraper.ts` | Scraping muy lento | ✅ **RESUELTO** - Batch queries implementadas |
| 9 | **Sin paginación** | Todos los scrapers | Solo primera página | ✅ **RESUELTO** - Paginación en Stock scraper |
| 10 | **Stock solo 24 productos** | `stock-scraper.ts` | Muy pocos datos | ✅ **RESUELTO** - 13 categorías (antes 7) |

---

## 🟡 ALTO (Mejorar pronto)

### Frontend

| # | Mejora | Archivo | Beneficio | Estado |
|---|--------|---------|-----------|--------|
| 11 | **Página de favoritos** | Nuevo archivo | Los usuarios pueden guardar productos | ⏳ Pendiente |
| 12 | **Alertas de precio** | Nuevo archivo | Notificaciones de descuentos | ⏳ Pendiente |
| 13 | **Perfil de usuario** | Nuevo archivo | Configuración personal | ⏳ Pendiente |
| 14 | **Persistir lista en Supabase** | `stores/shopping-list-store.ts` | Lista sincronizada | ⏳ Pendiente |

### Scraper

| # | Mejora | Archivo | Beneficio | Estado |
|---|--------|---------|-----------|--------|
| 15 | **Más categorías en Stock** | `stock-scraper.ts` | Más productos | ✅ **RESUELTO** - 13 categorías |
| 16 | **Más categorías en Casa Rica** | `casa-rica-scraper.ts` | Más productos | ✅ **RESUELTO** - 15 categorías (antes 9) |
| 17 | **Retry en errores** | `base-scraper.ts` | Mayor fiabilidad | ✅ **RESUELTO** - Sistema de retry con backoff |
| 18 | **Eliminar scrapers rotos** | `disco-scraper.ts`, `villa-lima-scraper.ts` | Limpieza | ✅ **RESUELTO** - Deshabilitados en scheduler |

---

## 🟢 MEDIO (Mejorar cuando pueda)

### Frontend

| # | Mejora | Beneficio | Estado |
|---|--------|-----------|--------|
| 19 | Error boundaries | La app no se crashea | ⏳ Pendiente |
| 20 | Loading states en todas las páginas | Mejor UX | ⏳ Pendiente |
| 21 | Stats dinámicos en Home | Datos reales | ⏳ Pendiente |
| 22 | Dashboard con datos reales | Funcionalidad completa | ⏳ Pendiente |
| 23 | Página 404 | Mejor navegación | ⏳ Pendiente |
| 24 | SEO (meta tags) | Mejor posicionamiento | ⏳ Pendiente |

### Scraper

| # | Mejora | Beneficio | Estado |
|---|--------|-----------|--------|
| 25 | Extraer brands/categorías | Datos más completos | ⏳ Pendiente |
| 26 | Paralelizar scraping | Scraping más rápido | ⏳ Pendiente |
| 27 | Shared scraper WooCommerce | Menos código duplicado | ⏳ Pendiente |
| 28 | Agregar Nissei | Nuevo supermercado | ⏳ Pendiente |
| 29 | Structured logging | Mejor monitoreo | ⏳ Pendiente |

---

## 📋 PLAN DE ACCIÓN

### Fase 1: Estabilidad (1-2 días) ✅ COMPLETADA

```
1. ✅ Mover .env a .gitignore y crear .env.example
2. ✅ Arreglar lista de compras (localStorage con Zustand persist)
3. ✅ Arreglar búsqueda (debounce + ordenamiento + paginación)
4. ✅ Quitar placeholders (productos sin imagen se omiten)
5. ✅ Agregar paginación básica (20 items por página)
```

### Fase 2: Funcionalidad (3-5 días) 🔄 EN PROGRESO

```
1. ⏳ Crear página de favoritos
2. ⏳ Crear página de alertas de precio
3. ✅ Agregar más categorías a Stock (13 categorías)
4. ✅ Agregar más categorías a Casa Rica (15 categorías)
5. ✅ Arreglar filtros del mapa (Abiertos/Cercanos)
```

### Fase 3: Optimización (1 semana) 🔄 EN PROGRESO

```
1. ⏳ Paralelizar scraping
2. ✅ Agregar retry en errores (sistema de retry con backoff)
3. ⏳ Crear shared scraper WooCommerce
4. ⏳ Agregar Nissei como supermercado
5. ⏳ Optimizar queries de Supabase
```

---

## 📊 MÉTRICAS ACTUALES

| Métrica | Valor |
|---------|-------|
| Productos totales | ~2,500 |
| Supermercados activos | 4 |
| Imágenes reales | 100% |
| Scraping automático | Diario 6 AM |
| Uptime | 99.9% |

## 📊 MÉTRICAS OBJETIVO

| Métrica | Valor |
|---------|-------|
| Productos totales | ~10,000 |
| Supermercados activos | 6+ |
| Categorías cubiertas | 90% |
| Tiempo de scraping | <30 min |
| Tiempo de carga | <2s |

---

## 🏗️ ARQUITECTURA ACTUAL

```
┌─────────────────────────────────────────────────────────┐
│                    AHORRAPY SYSTEM                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Vercel    │    │  Supabase   │    │   GitHub    │  │
│  │  (Frontend) │◄──►│  (Backend)  │◄──►│  (Actions)  │  │
│  └─────────────┘    └─────────────┘    └─────────────┘  │
│         │                  │                  │          │
│         ▼                  ▼                  ▼          │
│    React App         PostgreSQL          Playwright     │
│    + Vite            + Storage           Scrapers       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ COMANDOS ÚTILES

```bash
# Scraping completo
cd scraper && npm run scrape

# Solo un supermercado
cd scraper && npm run scrape:superseis
cd scraper && npm run scrape:biggie

# Cross-reference de imágenes
cd scraper && npm run fix-images

# Deploy frontend
vercel --prod

# Ver logs de GitHub Actions
gh run list --repo paraguayotavyqwe-stack/scraper
```

---

## 📝 NOTAS

- El scraping de Superseis tarda ~30 minutos (1800+ productos)
- Biggie es el más rápido (~6 minutos, usa API)
- Casa Rica tiene problemas con algunas URLs (404)
- Stock ahora tiene 13 categorías (antes 7)
- Las imágenes de Superseis y Biggie son las más confiables
- Scrapers de Disco y Villa Lima deshabilitados (sitos caídos)

---

## ✅ CAMBIOS REALIZADOS EN ESTA ACTUALIZACIÓN

### Frontend
1. **Lista de compras persistente**: Zustand con middleware `persist` guarda en localStorage
2. **Búsqueda mejorada**: 
   - Debounce de 300ms para evitar consultas excesivas
   - Ordenamiento correcto por mejor precio (mínimo entre supermercados)
   - Paginación de 20 items por página
3. **Filtros del mapa funcionales**:
   - "Abiertos": Filtra por horario actual del día
   - "Cercanos": Ordena por distancia y muestra los 10 más cercanos

### Scraper
1. **Sin placeholders**: Productos sin imagen real se omiten (no se guardan en DB)
2. **Batch queries**: 
   - Obtención de productos existentes en una sola query
   - Obtención de precios existentes en una sola query
   - Inserción de productos en lotes de 50
   - Inserción de precios en lotes
3. **Sistema de retry**: 
   - 3 intentos con backoff exponencial
   - Logging de intentos fallidos
4. **Stock scraper mejorado**: 
   - 13 categorías (antes 7): cuidado-personal, higiene, congelados, panaderia, snacks, bebidas-con-alcohol
   - Paginación: intenta cargar más páginas (hasta 5)
5. **Casa Rica scraper mejorado**: 
   - 15 categorías (antes 9): almacén, cuidado-personal, higiene, congelados, frutas-y-verduras, bebidas-alcohólicas
6. **Scrapers rotos deshabilitados**: 
   - Disco y Villa Lima configurados como `enabled: false` en scheduler.ts

### Archivos creados
- `.env.example` (frontend)
- `scraper/.env.example` (scraper)

---

*Última actualización: 31 Mayo 2026*
