import { BaseScraper, ScrapedProduct } from '../base-scraper';

/**
 * TEMPLATE: Scraper para nuevo supermercado
 * 
 * Instrucciones:
 * 1. Copia este archivo y renómbralo: [nombre]-scraper.ts
 * 2. Cambia la clase y el nombre/slug
 * 3. Ajusta las URLs de categorías
 * 4. Ajusta los selectores CSS según la estructura del sitio
 * 5. Agrega el scraper en scheduler.ts
 * 
 * Selectores comunes para tiendas WooCommerce:
 * - li.product
 * - .product-item
 * - .woocommerce-loop-product__title (nombre)
 * - .price .woocommerce-Price-amount (precio)
 * - ins .woocommerce-Price-amount (precio con descuento)
 * - del .woocommerce-Price-amount (precio original)
 * 
 * Para sitios personalizados, inspecciona la página y busca:
 * - Elementos con clase "product", "price", "item"
 * - Patrones de texto como "Gs XX.XXX" o "$XX.XXX"
 * - Atributos data-* que contengan información del producto
 */

export class TEMPLATE_SCRAPER extends BaseScraper {
  constructor() {
    // CAMBIA: nombre y slug del supermercado
    super('NOMBRE_SUPERMERCADO', 'nombre-supermercado');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      // CAMBIA: URLs de categorías del supermercado
      const categories = [
        { url: 'https://www.ejemplo.com.py/categoria/lacteos', name: 'Lácteos' },
        { url: 'https://www.ejemplo.com.py/categoria/carnes', name: 'Carnes' },
        { url: 'https://www.ejemplo.com.py/categoria/frutas', name: 'Frutas' },
        { url: 'https://www.ejemplo.com.py/categoria/bebidas', name: 'Bebidas' },
        { url: 'https://www.ejemplo.com.py/categoria/almacen', name: 'Almacén' },
        { url: 'https://www.ejemplo.com.py/categoria/limpieza', name: 'Limpieza' },
      ];

      for (const category of categories) {
        try {
          console.log(`\n📦 Scraping ${category.name}...`);
          await page.goto(category.url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          // Scroll para cargar productos
          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          // CAMBIA: Selectores CSS según la estructura del sitio
          const categoryProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            
            // Opción 1: WooCommerce (li.product)
            const productCards = document.querySelectorAll('li.product, .product-item, article');
            
            productCards.forEach((card) => {
              try {
                // Nombre del producto
                const nameEl = card.querySelector('.woocommerce-loop-product__title, h2, h3');
                const name = nameEl?.textContent?.trim() || '';
                
                // Precio actual
                const priceEl = card.querySelector('ins .woocommerce-Price-amount, .price .woocommerce-Price-amount');
                const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const price = parseInt(priceText, 10);
                
                // Precio original (si hay descuento)
                const delEl = card.querySelector('del .woocommerce-Price-amount');
                const origText = delEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const originalPrice = parseInt(origText, 10);
                
                // Imagen
                const imgEl = card.querySelector('img');
                const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || undefined;
                
                // Link
                const linkEl = card.querySelector('a') as HTMLAnchorElement;
                const url = linkEl?.href || '';
                
                if (name && price > 0) {
                  items.push({
                    name,
                    price,
                    originalPrice: originalPrice > price ? originalPrice : undefined,
                    isOnSale: originalPrice > price,
                    url,
                    imageUrl,
                    supermarket: 'NOMBRE_SUPERMERCADO',
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

    // Eliminar duplicados
    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
    );

    console.log(`\n📊 Total unique products from NOMBRE_SUPERMERCADO: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
