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
        { url: 'https://www.casarica.com.py/catalogo/bebidas-sin-alcohol-c46', name: 'Bebidas sin Alcohol' },
        { url: 'https://www.casarica.com.py/catalogo/bebidas-con-alcohol-c20', name: 'Bebidas con Alcohol' },
        { url: 'https://www.casarica.com.py/catalogo/articulos-de-limpieza-c125', name: 'Limpieza' },
        { url: 'https://www.casarica.com.py/catalogo/snacks-y-golosinas-c130', name: 'Snacks' },
        { url: 'https://www.casarica.com.py/catalogo/panaderia-c150', name: 'Panadería' },
        { url: 'https://www.casarica.com.py/catalogo/queseria-c80', name: 'Quesería' },
        { url: 'https://www.casarica.com.py/catalogo/fiambreria-c90', name: 'Fiambres' },
      ];

      for (const category of categories) {
        try {
          console.log(`\n📦 Scraping ${category.name}...`);
          await page.goto(category.url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          const pageTitle = await page.title();
          
          if (pageTitle.includes('404')) {
            console.log('⚠️ Page not found, skipping...');
            continue;
          }

          // Scroll to load products
          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          // Extract products with images
          const categoryProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            
            // Look for product elements
            const productElements = document.querySelectorAll('.product, li.product, article, .card');
            
            productElements.forEach(el => {
              try {
                // Get name
                const nameEl = el.querySelector('h2, h3, h4, .product-title, .name, .woocommerce-loop-product__title');
                const name = nameEl?.textContent?.trim() || '';
                
                if (!name || name.length < 3) return;
                
                // Get price
                const priceEl = el.querySelector('.price ins .woocommerce-Price-amount, .price .woocommerce-Price-amount, .price');
                const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const price = parseInt(priceText, 10);
                
                if (price <= 0 || price > 10000000) return;
                
                // Get original price
                const origEl = el.querySelector('.price del .woocommerce-Price-amount, del');
                const origText = origEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const originalPrice = parseInt(origText, 10);
                
                // Get image - try multiple sources
                let imageUrl: string | undefined;
                
                const imgEl = el.querySelector('img');
                if (imgEl) {
                  imageUrl = imgEl.getAttribute('src') || undefined;
                  if (!imageUrl || imageUrl.includes('placeholder')) {
                    imageUrl = imgEl.getAttribute('data-src') || undefined;
                  }
                  if (!imageUrl || imageUrl.includes('placeholder')) {
                    imageUrl = imgEl.getAttribute('data-lazy-src') || undefined;
                  }
                }
                
                // Get link
                const linkEl = el.querySelector('a[href*="product"]') as HTMLAnchorElement;
                const url = linkEl?.href || '';
                
                // Avoid UI elements
                if (!name.match(/^(Buscar|Categoría|Menú|Inicio|Contacto|Ver|Menu|Todos|Productos)/i)) {
                  items.push({
                    name,
                    price,
                    originalPrice: originalPrice > price ? originalPrice : undefined,
                    isOnSale: originalPrice > price,
                    url,
                    imageUrl,
                    supermarket: 'Casa Rica',
                  });
                }
              } catch (error) {}
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
