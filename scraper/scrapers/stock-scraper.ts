import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class StockScraper extends BaseScraper {
  constructor() {
    super('Stock', 'stock');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      // Scrape from multiple pages
      const urls = [
        'https://www.stock.com.py',
        'https://www.stock.com.py/categoria-producto/lacteos/',
        'https://www.stock.com.py/categoria-producto/carnes/',
        'https://www.stock.com.py/categoria-producto/bebidas/',
        'https://www.stock.com.py/categoria-producto/almacen/',
        'https://www.stock.com.py/categoria-producto/limpieza/',
        'https://www.stock.com.py/categoria-producto/frescos/',
      ];

      for (const url of urls) {
        try {
          console.log(`\n📦 Scraping ${url.split('.py')[1] || 'homepage'}...`);
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          const pageProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            const seen = new Set<string>();
            
            // Find all product links
            const links = document.querySelectorAll('a[href*="/products/"]');
            
            links.forEach((link) => {
              const href = link.getAttribute('href') || '';
              const urlMatch = href.match(/products\/\d+-(.+?)\.aspx/);
              if (!urlMatch) return;
              
              const nameFromUrl = urlMatch[1]
                .replace(/-/g, ' ')
                .replace(/\b\w/g, (c) => c.toUpperCase());
              
              if (seen.has(nameFromUrl)) return;
              
              const container = link.closest('div, li, article') || link.parentElement;
              const containerText = container?.textContent || '';
              
              const priceMatch = containerText.match(/Gs\s+([\d.]+)/);
              if (!priceMatch) return;
              
              const price = parseInt(priceMatch[1].replace(/\./g, ''), 10);
              if (price <= 0 || price > 10000000) return;
              
              const allPrices = containerText.match(/Gs\s+([\d.]+)/g);
              let originalPrice: number | undefined;
              
              if (allPrices && allPrices.length >= 2) {
                const p1 = parseInt(allPrices[0].match(/([\d.]+)/)?.[1]?.replace(/\./g, '') || '0', 10);
                const p2 = parseInt(allPrices[1].match(/([\d.]+)/)?.[1]?.replace(/\./g, '') || '0', 10);
                originalPrice = p1 > p2 ? p1 : (p2 > p1 ? p2 : undefined);
              }
              
              // Get image - try multiple sources
              let imageUrl: string | undefined;
              
              // Try image inside the link
              const imgInLink = link.querySelector('img');
              if (imgInLink) {
                imageUrl = imgInLink.getAttribute('src') || undefined;
              }
              
              // Try image in container
              if (!imageUrl) {
                const imgInContainer = container?.querySelector('img');
                imageUrl = imgInContainer?.getAttribute('src') || undefined;
              }
              
              // Try data attributes
              if (!imageUrl) {
                const imgWithDataSrc = link.querySelector('img[data-src]');
                imageUrl = imgWithDataSrc?.getAttribute('data-src') || undefined;
              }
              
              // Clean up URL
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `https://www.stock.com.py${imageUrl}`;
              }
              
              seen.add(nameFromUrl);
              
              items.push({
                name: nameFromUrl,
                price,
                originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
                isOnSale: !!(originalPrice && originalPrice > price),
                url: href.startsWith('http') ? href : `https://www.stock.com.py${href}`,
                imageUrl,
                supermarket: 'Stock',
              });
            });
            
            return items;
          });

          console.log(`   Found ${pageProducts.length} products`);
          products.push(...pageProducts);

        } catch (error) {
          console.error(`   Error scraping: ${error}`);
        }
      }

    } finally {
      await page.close();
    }

    // Remove duplicates
    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
    );

    console.log(`\n📊 Total unique products from Stock: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
