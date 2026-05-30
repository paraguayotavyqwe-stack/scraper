import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Download an image from a URL and upload to Supabase Storage
 */
export async function downloadAndStoreImage(
  imageUrl: string,
  productId: string,
  supermarket: string
): Promise<string | null> {
  try {
    if (!imageUrl) return null;

    // Generate a unique filename
    const ext = imageUrl.split('.').pop()?.split('?')[0] || 'jpg';
    const filename = `${supermarket}/${productId}.${ext}`;

    // Check if image already exists
    const { data: existing } = await supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    if (existing) {
      return existing.publicUrl;
    }

    // Download the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Failed to download image: ${imageUrl}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filename, uint8Array, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    return urlData.publicUrl;

  } catch (error) {
    console.error('Image download error:', error);
    return null;
  }
}

/**
 * Batch download images for products
 */
export async function batchDownloadImages(
  products: Array<{ id: string; imageUrl?: string; supermarket: string }>
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  
  console.log(`\n📸 Downloading ${products.length} images...`);
  
  let downloaded = 0;
  let failed = 0;

  for (const product of products) {
    if (!product.imageUrl) {
      failed++;
      continue;
    }

    const storedUrl = await downloadAndStoreImage(
      product.imageUrl,
      product.id,
      product.supermarket
    );

    if (storedUrl) {
      urlMap.set(product.id, storedUrl);
      downloaded++;
    } else {
      failed++;
    }

    // Progress every 50 images
    if ((downloaded + failed) % 50 === 0) {
      console.log(`   Progress: ${downloaded} downloaded, ${failed} failed`);
    }

    // Small delay to be respectful
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`✅ Images: ${downloaded} downloaded, ${failed} failed`);
  return urlMap;
}

/**
 * Update product image URLs in database
 */
export async function updateProductImages(
  imageUrls: Map<string, string>
): Promise<void> {
  console.log(`\n📝 Updating ${imageUrls.size} product images in database...`);

  let updated = 0;

  for (const [productId, imageUrl] of imageUrls) {
    const { error } = await supabase
      .from('products')
      .update({ image_url: imageUrl })
      .eq('id', productId);

    if (!error) {
      updated++;
    }
  }

  console.log(`✅ Updated ${updated} products`);
}
