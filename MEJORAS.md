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

| # | Problema | Archivo | Impacto |
|---|----------|---------|---------|
| 1 | **Lista de compras se pierde al recargar** | `stores/shopping-list-store.ts` | Los usuarios pierden su lista al cerrar la pestaña |
| 2 | **Búsqueda no ordena bien** | `pages/Search.tsx` | El orden por precio es arbitrario |
| 3 | **Filtros del mapa no funcionan** | `pages/Map.tsx` | Botones "Abiertos"/"Cercanos" no hacen nada |
| 4 | **Sin límites en búsqueda** | `pages/Search.tsx` | Carga todos los productos de golpe |
| 5 | **Sin debounce en búsqueda** | `pages/Search.tsx` | Cada tecla hace consulta a DB |

### Scraper

| # | Problema | Archivo | Impacto |
|---|----------|---------|---------|
| 6 | **`.env` en el repo** | `.env` | Seguridad comprometida |
| 7 | **Placeholders se guardan como reales** | `base-scraper.ts` | Imágenes falsas en la DB |
| 8 | **N+1 queries en saveProducts** | `base-scraper.ts` | Scraping muy lento |
| 9 | **Sin paginación** | Todos los scrapers | Solo primera página |
| 10 | **Stock solo 24 productos** | `stock-scraper.ts` | Muy pocos datos |

---

## 🟡 ALTO (Mejorar pronto)

### Frontend

| # | Mejora | Archivo | Beneficio |
|---|--------|---------|-----------|
| 11 | **Página de favoritos** | Nuevo archivo | Los usuarios pueden guardar productos |
| 12 | **Alertas de precio** | Nuevo archivo | Notificaciones de descuentos |
| 13 | **Perfil de usuario** | Nuevo archivo | Configuración personal |
| 14 | **Persistir lista en Supabase** | `stores/shopping-list-store.ts` | Lista sincronizada |

### Scraper

| # | Mejora | Archivo | Beneficio |
|---|--------|---------|-----------|
| 15 | **Más categorías en Stock** | `stock-scraper.ts` | Más productos |
| 16 | **Más categorías en Casa Rica** | `casa-rica-scraper.ts` | Más productos |
| 17 | **Retry en errores** | `base-scraper.ts` | Mayor fiabilidad |
| 18 | **Eliminar scrapers rotos** | `disco-scraper.ts`, `villa-lima-scraper.ts` | Limpieza |

---

## 🟢 MEDIO (Mejorar cuando pueda)

### Frontend

| # | Mejora | Beneficio |
|---|--------|-----------|
| 19 | Error boundaries | La app no se crashea |
| 20 | Loading states en todas las páginas | Mejor UX |
| 21 | Stats dinámicos en Home | Datos reales |
| 22 | Dashboard con datos reales | Funcionalidad completa |
| 23 | Página 404 | Mejor navegación |
| 24 | SEO (meta tags) | Mejor posicionamiento |

### Scraper

| # | Mejora | Beneficio |
|---|--------|-----------|
| 25 | Extraer brands/categorías | Datos más completos |
| 26 | Paralelizar scraping | Scraping más rápido |
| 27 | Shared scraper WooCommerce | Menos código duplicado |
| 28 | Agregar Nissei | Nuevo supermercado |
| 29 | Structured logging | Mejor monitoreo |

---

## 📋 PLAN DE ACCIÓN

### Fase 1: Estabilidad (1-2 días)

```
1. Mover .env a .gitignore y rotar keys
2. Arreglar lista de compras (guardar en Supabase)
3. Arreglar búsqueda (debounce + ordenamiento)
4. Quitar placeholders, usar cross-reference
5. Agregar paginación básica
```

### Fase 2: Funcionalidad (3-5 días)

```
1. Crear página de favoritos
2. Crear página de alertas de precio
3. Agregar más categorías a Stock
4. Agregar más categorías a Casa Rica
5. Arreglar filtros del mapa
```

### Fase 3: Optimización (1 semana)

```
1. Paralelizar scraping
2. Agregar retry en errores
3. Crear shared scraper WooCommerce
4. Agregar Nissei como supermercado
5. Optimizar queries de Supabase
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
- Stock tiene pocos productos visibles en la homepage
- Las imágenes de Superseis y Biggie son las más confiables

---

*Última actualización: 31 Mayo 2026*
