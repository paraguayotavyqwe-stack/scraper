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

  /**
   * Download an image and upload to Supabase Storage
   */
  protected async downloadImage(imageUrl: string, productId: string): Promise<string | null> {
    try {
      if (!imageUrl) return null;

      // Generate filename
      const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
      const filename = `${this.supermarketSlug}/${productId}.${ext}`;

      // Check if already exists
      const { data: existing } = await this.supabase.storage
        .from('product-images')
        .getPublicUrl(filename);

      if (existing?.publicUrl) {
        return existing.publicUrl;
      }

      // Download
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) return null;

      const buffer = await response.arrayBuffer();

      // Upload to Supabase Storage
      const { error } = await this.supabase.storage
        .from('product-images')
        .upload(filename, buffer, {
          contentType: response.headers.get('content-type') || 'image/jpeg',
          upsert: true,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('product-images')
        .getPublicUrl(filename);

      return urlData.publicUrl;

    } catch (error) {
      return null;
    }
  }

  abstract scrapeProducts(): Promise<ScrapedProduct[]>;

  async saveProducts(products: ScrapedProduct[]): Promise<void> {
    let imageDownloaded = 0;
    let imageFailed = 0;

    for (const product of products) {
      try {
        // Get or create supermarket
        const { data: supermarket } = await this.supabase
          .from('supermarkets')
          .select('id')
          .eq('slug', this.supermarketSlug)
          .single();

        if (!supermarket) {
          console.log(`Supermarket ${this.supermarketSlug} not found, skipping...`);
          continue;
        }

        // Get or create product
        let { data: existingProduct } = await this.supabase
          .from('products')
          .select('id, image_url')
          .eq('name', product.name)
          .single();

        if (!existingProduct) {
          const slug = this.slugify(product.name);
          
          // Download image first
          let storedImageUrl = product.imageUrl;
          if (product.imageUrl) {
            const tempId = this.slugify(product.name);
            const downloadedUrl = await this.downloadImage(product.imageUrl, tempId);
            if (downloadedUrl) {
              storedImageUrl = downloadedUrl;
              imageDownloaded++;
            } else {
              imageFailed++;
            }
          }

          const { data: newProduct } = await this.supabase
            .from('products')
            .insert({
              name: product.name,
              slug,
              brand: product.brand,
              image_url: storedImageUrl,
              is_active: true,
            })
            .select('id, image_url')
            .single();

          existingProduct = newProduct;
        } else if (!existingProduct.image_url && product.imageUrl) {
          // Download image for existing product without one
          const downloadedUrl = await this.downloadImage(product.imageUrl, existingProduct.id);
          if (downloadedUrl) {
            await this.supabase
              .from('products')
              .update({ image_url: downloadedUrl })
              .eq('id', existingProduct.id);
            imageDownloaded++;
          } else {
            imageFailed++;
          }
        }

        if (!existingProduct) continue;

        // Upsert price
        const { error } = await this.supabase
          .from('product_prices')
          .upsert(
            {
              product_id: existingProduct.id,
              supermarket_id: supermarket.id,
              price: product.price,
              original_price: product.originalPrice || null,
              is_on_sale: product.isOnSale,
              is_available: true,
              last_checked_at: new Date().toISOString(),
            },
            { onConflict: 'product_id,supermarket_id' }
          );

        if (error) {
          console.error(`Error saving price for ${product.name}:`, error);
        }

        // Save to price history
        await this.supabase.from('price_history').insert({
          product_id: existingProduct.id,
          supermarket_id: supermarket.id,
          price: product.price,
        });

      } catch (error) {
        console.error(`Error processing product ${product.name}:`, error);
      }
    }

    if (imageDownloaded > 0 || imageFailed > 0) {
      console.log(`📸 Images: ${imageDownloaded} stored, ${imageFailed} failed`);
    }
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
