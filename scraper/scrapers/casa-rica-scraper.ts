import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class CasaRicaScraper extends BaseScraper {
  constructor() {
    super('Casa Rica', 'casa-rica');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      // Casa Rica uses /catalogo/ URLs with category IDs
      const categories = [
        { url: 'https://www.casarica.com.py/catalogo/lacteos-c30', name: 'Lácteos' },
        { url: 'https://www.casarica.com.py/catalogo/carnes-y-platos-de-fondo-c332', name: 'Carnes' },
        { url: 'https://www.casarica.com.py/catalogo/frutas-c178', name: 'Frutas' },
        { url: 'https://www.casarica.com.py/catalogo/verduras-c179', name: 'Verduras' },
        { url: 'https://www.casarica.com.py/catalogo/bebidas-sin-alcohol-c46', name: 'Bebidas sin Alcohol' },
        { url: 'https://www.casarica.com.py/catalogo/bebidas-con-alcohol-c20', name: 'Bebidas con Alcohol' },
        { url: 'https://www.casarica.com.py/catalogo/articulos-de-limpieza-c125', name: 'Limpieza' },
        { url: 'https://www.casarica.com.py/catalogo/arroz-c101', name: 'Arroz' },
        { url: 'https://www.casarica.com.py/catalogo/aceite-de-soja-c102', name: 'Aceite' },
      ];

      for (const category of categories) {
        try {
          console.log(`\n📦 Scraping ${category.name}...`);
          await page.goto(category.url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          const pageTitle = await page.title();
          console.log(`Page title: ${pageTitle}`);
          
          if (pageTitle.includes('404')) {
            console.log('⚠️ Page not found, skipping...');
            continue;
          }

          // Scroll to load products
          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          // Extract products - try multiple approaches
          const categoryProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            
            // Approach 1: Look for product cards with price patterns
            const allElements = document.querySelectorAll('div, li, article, section');
            
            allElements.forEach(el => {
              const text = el.textContent || '';
              
              // Find elements containing ₲ price pattern
              const priceMatch = text.match(/₲\.?\s*([\d.,]+)/);
              if (!priceMatch) return;
              
              // Check if this element has a product name
              const nameEl = el.querySelector('h2, h3, h4, .name, .title, strong, b');
              const name = nameEl?.textContent?.trim() || '';
              
              if (!name || name.length < 3) return;
              
              const price = parseInt(priceMatch[1].replace(/[.,]/g, ''), 10);
              if (price <= 0 || price > 10000000) return;
              
              // Check for original price (OFERTA format)
              const origMatch = text.match(/₦\.?\s*([\d.,]+)/g);
              let originalPrice: number | undefined;
              
              if (origMatch && origMatch.length >= 2) {
                const origPrice = parseInt(origMatch[1].match(/([\d.,]+)/)?.[1]?.replace(/[.,]/g, '') || '0', 10);
                if (origPrice > price) {
                  originalPrice = origPrice;
                }
              }
              
              // Get image
              const imgEl = el.querySelector('img');
              const imageUrl = imgEl?.getAttribute('src') || undefined;
              
              // Get link
              const linkEl = el.querySelector('a') as HTMLAnchorElement;
              const url = linkEl?.href || '';
              
              // Avoid duplicates and UI elements
              if (!name.match(/^(Buscar|Categoría|Menú|Inicio|Contacto|Ver|Menu|Todos)/i)) {
                items.push({
                  name,
                  price,
                  originalPrice,
                  isOnSale: !!originalPrice,
                  url,
                  imageUrl,
                  supermarket: 'Casa Rica',
                });
              }
            });
            
            return items;
          });

          console.log(`✅ Found ${categoryProducts.length} products in ${category.name}`);
          products.push(...categoryProducts);

        } catch (error) {
          console.error(`❌ Error scraping ${category.name}:`, error);
        }
      }
    } finally {
      await page.close();
    }

    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
    );

    console.log(`\n📊 Total unique products from Casa Rica: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
