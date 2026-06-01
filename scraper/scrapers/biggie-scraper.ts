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
        { slug: 'lacteos', name: 'Lácteos' },
        { slug: 'carniceria', name: 'Carnes' },
        { slug: 'bebidas-sin-alcohol', name: 'Bebidas sin Alcohol' },
        { slug: 'bebidas-con-alcohol', name: 'Bebidas con Alcohol' },
        { slug: 'almacen', name: 'Almacén' },
        { slug: 'limpieza', name: 'Limpieza' },
        { slug: 'cuidado-personal', name: 'Cuidado Personal' },
        { slug: 'panaderia', name: 'Panadería' },
        { slug: 'congelados', name: 'Congelados' },
        { slug: 'snacks', name: 'Snacks' },
      ];

      for (const { slug: categorySlug, name: categoryName } of categories) {
        try {
          console.log(`\n📦 Fetching ${categorySlug}...`);
          
          let skip = 0;
          const take = 50;
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
                    originalPrice: item.priceSaleOffer && item.priceSaleOffer < item.price ? item.priceSaleOffer : undefined,
                    isOnSale: !!(item.priceSaleOffer && item.priceSaleOffer < item.price),
                    url: `https://biggie.com.py/products/${categorySlug}/${item.code}`,
                    imageUrl: item.images?.[0]?.src?.replace('300/', '') || undefined,
                    supermarket: 'Biggie',
                    category: categoryName,
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
