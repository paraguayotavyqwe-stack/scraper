import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { chromium, Browser, Page } from 'playwright';

export interface ScrapedProduct {
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  isOnSale: boolean;
  url: string;
  imageUrl?: string;
  supermarket: string;
  category?: string;
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected supabase: SupabaseClient;
  protected supermarketName: string;
  protected supermarketSlug: string;
  protected maxRetries = 3;
  protected retryDelay = 2000;
  private categoryCache = new Map<string, string>();

  constructor(name: string, slug: string) {
    this.supermarketName = name;
    this.supermarketSlug = slug;
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  protected async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first.');
    }
    
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });
    
    return context.newPage();
  }

  protected async retry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === this.maxRetries) {
          console.error(`❌ ${operation} failed after ${this.maxRetries} attempts:`, error);
          throw error;
        }
        console.warn(`⚠️ ${operation} attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
      }
    }
    throw new Error(`${operation} failed after ${this.maxRetries} attempts`);
  }

  abstract scrapeProducts(): Promise<ScrapedProduct[]>;

  protected async getCategoryId(categoryName: string): Promise<string | null> {
    if (this.categoryCache.has(categoryName)) {
      return this.categoryCache.get(categoryName)!;
    }

    const slug = this.slugify(categoryName);
    const { data } = await this.supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();

    if (data) {
      this.categoryCache.set(categoryName, data.id);
      return data.id;
    }

    const { data: newCat } = await this.supabase
      .from('categories')
      .insert({ name: categoryName, slug })
      .select('id')
      .single();

    if (newCat) {
      this.categoryCache.set(categoryName, newCat.id);
      return newCat.id;
    }

    return null;
  }

  async saveProducts(products: ScrapedProduct[]): Promise<void> {
    let savedCount = 0;
    let imageCount = 0;
    let skippedCount = 0;

    const { data: supermarket } = await this.supabase
      .from('supermarkets')
      .select('id')
      .eq('slug', this.supermarketSlug)
      .single();

    if (!supermarket) {
      console.log(`Supermarket ${this.supermarketSlug} not found, skipping...`);
      return;
    }

    const supermarketId = supermarket.id;

    const productNames = products.map((p) => p.name);
    const allExistingProducts: Array<{ id: string; name: string; image_url: string | null; category_id: string | null }> = [];
    
    const IN_CHUNK = 50;
    for (let i = 0; i < productNames.length; i += IN_CHUNK) {
      const chunk = productNames.slice(i, i + IN_CHUNK);
      const { data, error } = await this.supabase
        .from('products')
        .select('id, name, image_url, category_id')
        .in('name', chunk);
      if (!error && data) allExistingProducts.push(...data);
    }
    
    const existingProductsMap = new Map(
      allExistingProducts.map((p) => [p.name, p])
    );
    
    console.log(`📋 Matched ${existingProductsMap.size} existing products out of ${productNames.length} scraped`);

    const { data: existingPrices } = await this.supabase
      .from('product_prices')
      .select('product_id')
      .eq('supermarket_id', supermarketId);

    const existingPricesSet = new Set(
      (existingPrices || []).map((p) => p.product_id)
    );

    // Phase 1: Resolve category IDs for unique category names
    const uniqueCategories = [...new Set(products.filter((p) => p.category).map((p) => p.category!))];
    for (const catName of uniqueCategories) {
      await this.getCategoryId(catName);
    }

    // Phase 2: Separate existing vs new products
    const productsWithIds: Array<{ product: ScrapedProduct; productId: string; isNew: boolean }> = [];
    const newProducts: ScrapedProduct[] = [];

    for (const product of products) {
      if (!product.imageUrl) { skippedCount++; continue; }

      const existing = existingProductsMap.get(product.name);
      if (existing) {
        productsWithIds.push({ product, productId: existing.id, isNew: false });

        // Update image if missing
        if (!existing.image_url && product.imageUrl) {
          await this.supabase.from('products').update({ image_url: product.imageUrl }).eq('id', existing.id);
          imageCount++;
        }
        // Update category if missing
        if (product.category && !existing.category_id) {
          const catId = this.categoryCache.get(product.category);
          if (catId) {
            await this.supabase.from('products').update({ category_id: catId }).eq('id', existing.id);
          }
        }
      } else {
        newProducts.push(product);
      }
    }

    // Phase 3: Batch insert new products
    if (newProducts.length > 0) {
      const BATCH = 50;
      for (let i = 0; i < newProducts.length; i += BATCH) {
        const chunk = newProducts.slice(i, i + BATCH);
        const toInsert = chunk.map((p) => ({
          name: p.name,
          slug: this.slugify(p.name),
          brand: p.brand || null,
          image_url: p.imageUrl!,
          category_id: p.category ? (this.categoryCache.get(p.category) || null) : null,
          is_active: true,
        }));

        const { data: inserted } = await this.supabase
          .from('products')
          .insert(toInsert)
          .select('id, name');

        if (inserted) {
          for (const ins of inserted) {
            const prod = chunk.find((p) => p.name === ins.name);
            if (prod) {
              productsWithIds.push({ product: prod, productId: ins.id, isNew: true });
              imageCount++;
            }
          }
        }
      }
    }

    // Phase 4: Batch upsert prices
    const pricesToUpsert = productsWithIds.map(({ product, productId }) => ({
      product_id: productId,
      supermarket_id: supermarketId,
      price: product.price,
      original_price: product.originalPrice || null,
      is_on_sale: product.isOnSale,
      is_available: true,
      last_checked_at: new Date().toISOString(),
    }));

    const BATCH = 50;
    for (let i = 0; i < pricesToUpsert.length; i += BATCH) {
      const chunk = pricesToUpsert.slice(i, i + BATCH);
      await this.supabase
        .from('product_prices')
        .upsert(chunk, { onConflict: 'product_id,supermarket_id' });
    }

    // Phase 5: Insert price history for new prices
    const historyToInsert = productsWithIds
      .filter(({ productId }) => !existingPricesSet.has(productId))
      .map(({ product, productId }) => ({
        product_id: productId,
        supermarket_id: supermarketId,
        price: product.price,
      }));

    for (let i = 0; i < historyToInsert.length; i += BATCH) {
      await this.supabase.from('price_history').insert(historyToInsert.slice(i, i + BATCH));
    }

    savedCount = pricesToUpsert.length;
    console.log(`📊 Saved ${savedCount} prices, ${imageCount} new images, ${skippedCount} skipped (no image)`);
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
