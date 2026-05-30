import { BaseScraper, ScrapedProduct } from '../base-scraper';

export class BiggieScraper extends BaseScraper {
  private apiUrl = 'https://api.app.biggie.com.py/api';

  constructor() {
    super('Biggie', 'biggie');
  }

  async scrapeProducts(): Promise<ScrapedProduct[]> {
    const page = await this.createPage();
    const products: ScrapedProduct[] = [];

    try {
      // Known Biggie categories
      const categories = [
        'lacteos',
        'carniceria',
        'bebidas-sin-alcohol',
        'bebidas-con-alcohol',
        'almacen',
        'limpieza',
        'cuidado-personal',
        'panaderia',
        'congelados',
        'snacks',
      ];

      for (const categorySlug of categories) {
        try {
          console.log(`\n📦 Fetching ${categorySlug}...`);
          
          let skip = 0;
          const take = 100;
          let hasMore = true;
          let categoryCount = 0;

          while (hasMore) {
            const apiUrl = `${this.apiUrl}/articles?take=${take}&skip=${skip}&classificationName=${categorySlug}`;
            
            const response = await page.evaluate(async (url) => {
              const res = await fetch(url);
              return res.json();
            }, apiUrl);

            if (response?.items && response.items.length > 0) {
              for (const item of response.items) {
                if (item.name && item.price > 0) {
                  products.push({
                    name: item.name,
                    price: item.price,
                    originalPrice: item.promoPrice && item.promoPrice < item.price ? item.promoPrice : undefined,
                    isOnSale: !!(item.promoPrice && item.promoPrice < item.price),
                    url: `https://biggie.com.py/products/${categorySlug}/${item.code}`,
                    imageUrl: item.photoUrl || undefined,
                    supermarket: 'Biggie',
                  });
                  categoryCount++;
                }
              }

              skip += take;
              hasMore = response.items.length === take;
            } else {
              hasMore = false;
            }
          }

          console.log(`✅ Found ${categoryCount} products in ${categorySlug}`);

        } catch (error) {
          console.error(`❌ Error fetching ${categorySlug}:`, error);
        }
      }
    } finally {
      await page.close();
    }

    const uniqueProducts = products.filter((product, index, self) =>
      index === self.findIndex((p) => p.name === product.name)
    );

    console.log(`\n📊 Total unique products from Biggie: ${uniqueProducts.length}`);
    return uniqueProducts;
  }
}
