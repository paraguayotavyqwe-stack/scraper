import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class SuperseisScraper extends BaseScraper {
  constructor() {
    super('Superseis', 'superseis');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      console.log('\n🔍 Fetching category links...');
      await page.goto('https://www.superseis.com.py/', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Get all category links
      const allLinks = await page.evaluate(() => {
        const links: string[] = [];
        document.querySelectorAll('a[href*="/catalog/"]').forEach(link => {
          const href = link.getAttribute('href') || '';
          if (href && !links.includes(href)) links.push(href);
        });
        return links;
      });

      // Filter to depth 2 only (subcategory level)
      const baseUrl = 'https://www.superseis.com.py/catalog/';
      const depth2Links = allLinks.filter(link => {
        const path = link.replace(baseUrl, '').replace('https://www.superseis.com.py/catalog/', '');
        const parts = path.split('/').filter(p => p);
        return parts.length === 2; // Only depth 2
      });

      console.log(`Found ${depth2Links.length} subcategories to scrape`);

      let count = 0;
      for (const url of depth2Links) {
        try {
          const fullUrl = url.startsWith('http') ? url : `https://www.superseis.com.py${url}`;
          
          // Extract category name from URL path
          const path = fullUrl.replace('https://www.superseis.com.py/catalog/', '');
          const parts = path.split('/').filter(p => p);
          const categoryName = parts[0]
            ? parts[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
            : '';
          
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          await page.waitForTimeout(1500);

          // Quick scroll
          await page.evaluate(() => window.scrollBy(0, 2000));
          await page.waitForTimeout(500);

          const categoryProducts = await page.evaluate(() => {
            const items: ScrapedProduct[] = [];
            
            document.querySelectorAll('.product-thumb').forEach(card => {
              try {
                const imageEl = card.querySelector('img');
                const name = imageEl?.getAttribute('alt') || imageEl?.getAttribute('title') || '';
                const priceFormatted = card.getAttribute('data-product-price');
                const price = parseInt(priceFormatted?.replace(/[^0-9]/g, '') || '0', 10);
                const linkEl = card.querySelector('a') as HTMLAnchorElement;
                const url = linkEl?.href || '';
                
                const originalPriceEl = card.querySelector('.price-normal');
                const originalPrice = parseInt(originalPriceEl?.textContent?.replace(/[^0-9]/g, '') || '0', 10);
                
                // Get image URL - try multiple attributes
                let imageUrl = imageEl?.getAttribute('src') || undefined;
                if (!imageUrl || imageUrl === '' || imageUrl.includes('placeholder')) {
                  imageUrl = imageEl?.getAttribute('data-src') || undefined;
                }
                if (!imageUrl || imageUrl === '' || imageUrl.includes('placeholder')) {
                  imageUrl = imageEl?.getAttribute('data-lazy') || undefined;
                }
                
                if (name && price > 0) {
                  items.push({
                    name: name.trim(),
                    price,
                    originalPrice: originalPrice > price ? originalPrice : undefined,
                    isOnSale: originalPrice > price,
                    url,
                    imageUrl: imageUrl && !imageUrl.includes('placeholder') ? imageUrl : undefined,
                    supermarket: 'Superseis',
                  });
                }
              } catch (error) {}
            });
            
            return items;
          });

          if (categoryProducts.length > 0) {
            const withImages = categoryProducts.filter(p => p.imageUrl).length;
            if (categoryName) {
              for (const p of categoryProducts) p.category = categoryName;
            }
            products.push(...categoryProducts);
            count++;
            if (count % 20 === 0) {
              console.log(`   Progress: ${count} categories, ${products.length} products, ${withImages} with images`);
            }
          }

        } catch (error) {}
      }

    } finally {
      await page.close();
    }

    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
    );

    console.log(`\n📊 Total unique products from Superseis: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
