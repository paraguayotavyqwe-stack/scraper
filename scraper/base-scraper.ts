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
}

export abstract class BaseScraper {
  protected browser: Browser | null = null;
  protected supabase: SupabaseClient;
  protected supermarketName: string;
  protected supermarketSlug: string;
  protected maxRetries = 3;
  protected retryDelay = 2000;

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

  async saveProducts(products: ScrapedProduct[]): Promise<void> {
    let savedCount = 0;
    let imageCount = 0;
    let skippedCount = 0;

    // Get supermarket ID once
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

    // Batch: Get all existing products in one query
    const productNames = products.map((p) => p.name);
    const { data: existingProducts } = await this.supabase
      .from('products')
      .select('id, name, image_url')
      .in('name', productNames);

    const existingProductsMap = new Map(
      (existingProducts || []).map((p) => [p.name, p])
    );

    // Batch: Get all existing prices
    const { data: existingPrices } = await this.supabase
      .from('product_prices')
      .select('product_id, supermarket_id')
      .eq('supermarket_id', supermarketId);

    const existingPricesSet = new Set(
      (existingPrices || []).map((p) => p.product_id)
    );

    // Process products in batches
    const BATCH_SIZE = 50;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const productsToInsert: Array<{
        name: string;
        slug: string;
        brand: string | null;
        image_url: string;
        is_active: boolean;
      }> = [];
      const productImageUpdates: Array<{ id: string; imageUrl: string }> = [];
      const pricesToUpsert: Array<{
        product_id: string;
        supermarket_id: string;
        price: number;
        original_price: number | null;
        is_on_sale: boolean;
        is_available: boolean;
        last_checked_at: string;
      }> = [];
      const historyToInsert: Array<{
        product_id: string;
        supermarket_id: string;
        price: number;
      }> = [];

      for (const product of batch) {
        // Skip products without a real image
        if (!product.imageUrl) {
          skippedCount++;
          continue;
        }

        const existing = existingProductsMap.get(product.name);

        if (!existing) {
          // New product - will insert in batch
          const slug = this.slugify(product.name);
          productsToInsert.push({
            name: product.name,
            slug,
            brand: product.brand || null,
            image_url: product.imageUrl,
            is_active: true,
          });
        } else if (!existing.image_url && product.imageUrl) {
          // Update existing product with image
          productImageUpdates.push({ id: existing.id, imageUrl: product.imageUrl });
          imageCount++;
        }

        // Get product ID (existing or for new ones, we'll need to insert first)
        let productId = existing?.id;

        if (!existing && productsToInsert.length > 0) {
          // For new products, we'll insert and get ID
          const { data: inserted } = await this.supabase
            .from('products')
            .insert(productsToInsert[productsToInsert.length - 1])
            .select('id')
            .single();
          productId = inserted?.id;
          if (productId) imageCount++;
        }

        if (!productId) continue;

        // Prepare price upsert
        pricesToUpsert.push({
          product_id: productId,
          supermarket_id: supermarketId,
          price: product.price,
          original_price: product.originalPrice || null,
          is_on_sale: product.isOnSale,
          is_available: true,
          last_checked_at: new Date().toISOString(),
        });

        // Prepare price history
        if (!existingPricesSet.has(productId)) {
          historyToInsert.push({
            product_id: productId,
            supermarket_id: supermarketId,
            price: product.price,
          });
        }

        savedCount++;
      }

      // Batch insert new products
      if (productsToInsert.length > 0) {
        await this.supabase.from('products').insert(productsToInsert);
      }

      // Batch upsert prices
      if (pricesToUpsert.length > 0) {
        await this.supabase
          .from('product_prices')
          .upsert(pricesToUpsert, { onConflict: 'product_id,supermarket_id' });
      }

      // Batch insert price history
      if (historyToInsert.length > 0) {
        await this.supabase.from('price_history').insert(historyToInsert);
      }

      // Batch update images
      for (const update of productImageUpdates) {
        await this.supabase
          .from('products')
          .update({ image_url: update.imageUrl })
          .eq('id', update.id);
      }
    }

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
