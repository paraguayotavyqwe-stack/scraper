import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class VillaLimaScraper extends BaseScraper {
  constructor() {
    super('Villa Lima', 'villa-lima');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      const categories = [
        { url: 'https://www.villalima.com.py/categoria-producto/lacteos/', name: 'Lácteos' },
        { url: 'https://www.villalima.com.py/categoria-producto/carnes/', name: 'Carnes' },
        { url: 'https://www.villalima.com.py/categoria-producto/frutas-y-verduras/', name: 'Frutas y Verduras' },
        { url: 'https://www.villalima.com.py/categoria-producto/bebidas/', name: 'Bebidas' },
        { url: 'https://www.villalima.com.py/categoria-producto/almacen/', name: 'Almacén' },
        { url: 'https://www.villalima.com.py/categoria-producto/limpieza/', name: 'Limpieza' },
      ];

      for (const category of categories) {
        try {
          console.log(`\n📦 Scraping ${category.name}...`);
          await page.goto(category.url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          const categoryProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            
            const productCards = document.querySelectorAll('li.product, .product-item, article');
            
            productCards.forEach((card) => {
              try {
                const nameEl = card.querySelector('.woocommerce-loop-product__title, h2, h3');
                const name = nameEl?.textContent?.trim() || '';
                
                const priceEl = card.querySelector('ins .woocommerce-Price-amount, .price .woocommerce-Price-amount');
                const priceText = priceEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const price = parseInt(priceText, 10);
                
                const delEl = card.querySelector('del .woocommerce-Price-amount');
                const origText = delEl?.textContent?.replace(/[^0-9]/g, '') || '0';
                const originalPrice = parseInt(origText, 10);
                
                const imgEl = card.querySelector('img');
                const imageUrl = imgEl?.getAttribute('src') || imgEl?.getAttribute('data-src') || undefined;
                
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
                    supermarket: 'Villa Lima',
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

    console.log(`\n📊 Total unique products from Villa Lima: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
