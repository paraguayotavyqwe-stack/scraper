import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class StockScraper extends BaseScraper {
  constructor() {
    super('Stock', 'stock');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      console.log('\n📦 Scraping Stock...');
      await page.goto('https://www.stock.com.py', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(5000);

      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(1500);
      }

      const homepageProducts = await page.evaluate(() => {
        const items: ScrapedProduct[] = [];
        const seen = new Set<string>();
        
        // Find all product links with URLs like /products/XXXXX-name.aspx
        const links = document.querySelectorAll('a[href*="/products/"]');
        
        links.forEach((link) => {
          const href = link.getAttribute('href') || '';
          
          // Extract product name from URL
          const urlMatch = href.match(/products\/\d+-(.+?)\.aspx/);
          if (!urlMatch) return;
          
          const nameFromUrl = urlMatch[1]
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          
          // Skip duplicates
          if (seen.has(nameFromUrl)) return;
          
          // Find price in parent/sibling elements
          const container = link.closest('div, li, article') || link.parentElement;
          const containerText = container?.textContent || '';
          
          // Look for price pattern "Gs   XX.XXX"
          const priceMatch = containerText.match(/Gs\s+([\d.]+)/);
          if (!priceMatch) return;
          
          const price = parseInt(priceMatch[1].replace(/\./g, ''), 10);
          if (price <= 0 || price > 10000000) return;
          
          // Check for original price
          const allPrices = containerText.match(/Gs\s+([\d.]+)/g);
          let originalPrice: number | undefined;
          
          if (allPrices && allPrices.length >= 2) {
            const p1 = parseInt(allPrices[0].match(/([\d.]+)/)?.[1]?.replace(/\./g, '') || '0', 10);
            const p2 = parseInt(allPrices[1].match(/([\d.]+)/)?.[1]?.replace(/\./g, '') || '0', 10);
            originalPrice = p1 > p2 ? p1 : (p2 > p1 ? p2 : undefined);
          }
          
          // Get image
          const imgEl = link.querySelector('img') || container?.querySelector('img');
          const imageUrl = imgEl?.getAttribute('src') || undefined;
          
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

      console.log(`✅ Found ${homepageProducts.length} products`);
      products.push(...homepageProducts);

    } finally {
      await page.close();
    }

    console.log(`\n📊 Total products from Stock: ${products.length}`);
    return products;
  }
}
