import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class StockScraper extends BaseScraper {
  constructor() {
    super('Stock', 'stock');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      const urls = [
        { url: 'https://www.stock.com.py', category: '' },
        { url: 'https://www.stock.com.py/categoria-producto/lacteos/', category: 'Lácteos' },
        { url: 'https://www.stock.com.py/categoria-producto/carnes/', category: 'Carnes' },
        { url: 'https://www.stock.com.py/categoria-producto/bebidas/', category: 'Bebidas sin Alcohol' },
        { url: 'https://www.stock.com.py/categoria-producto/almacen/', category: 'Almacén' },
        { url: 'https://www.stock.com.py/categoria-producto/limpieza/', category: 'Limpieza' },
        { url: 'https://www.stock.com.py/categoria-producto/frescos/', category: 'Frescos' },
        { url: 'https://www.stock.com.py/categoria-producto/cuidado-personal/', category: 'Cuidado Personal' },
        { url: 'https://www.stock.com.py/categoria-producto/higiene/', category: 'Higiene' },
        { url: 'https://www.stock.com.py/categoria-producto/congelados/', category: 'Congelados' },
        { url: 'https://www.stock.com.py/categoria-producto/panaderia/', category: 'Panadería' },
        { url: 'https://www.stock.com.py/categoria-producto/snacks/', category: 'Snacks' },
        { url: 'https://www.stock.com.py/categoria-producto/bebidas-con-alcohol/', category: 'Bebidas con Alcohol' },
      ];

      for (const { url, category } of urls) {
        try {
          console.log(`\n📦 Scraping ${url.split('.py')[1] || 'homepage'}...`);
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(5000);

          // Scroll to load products
          for (let i = 0; i < 5; i++) {
            await page.evaluate(() => window.scrollBy(0, 1500));
            await page.waitForTimeout(1500);
          }

          // Check for pagination - try to load more pages
          let hasNextPage = true;
          let pageNum = 1;
          const maxPages = 5;

          while (hasNextPage && pageNum < maxPages) {
            const pageProducts = await page.evaluate(() => {
              const items: ScrapedProduct[] = [];
              const seen = new Set<string>();
              
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
                
                let imageUrl: string | undefined;
                
                const imgInLink = link.querySelector('img');
                if (imgInLink) {
                  imageUrl = imgInLink.getAttribute('src') || undefined;
                }
                
                if (!imageUrl) {
                  const imgInContainer = container?.querySelector('img');
                  imageUrl = imgInContainer?.getAttribute('src') || undefined;
                }
                
                if (!imageUrl) {
                  const imgWithDataSrc = link.querySelector('img[data-src]');
                  imageUrl = imgWithDataSrc?.getAttribute('data-src') || undefined;
                }
                
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

            if (pageProducts.length > 0) {
              if (category) {
                for (const p of pageProducts) p.category = category;
              }
              products.push(...pageProducts);
              console.log(`   Page ${pageNum}: Found ${pageProducts.length} products`);
            }

            // Try to find and click "next page" button
            const nextButton = await page.$('a.next, a[rel="next"], .pagination .next a, a:has-text("Siguiente")');
            if (nextButton) {
              await nextButton.click();
              await page.waitForTimeout(3000);
              pageNum++;
            } else {
              hasNextPage = false;
            }
          }

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
