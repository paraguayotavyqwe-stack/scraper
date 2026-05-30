import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value.length) {
      process.env[key.trim()] = value.join('=').trim();
    }
  });
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function downloadImage(imageUrl: string, filename: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();

    const { error } = await supabase.storage
      .from('product-images')
      .upload(filename, buffer, {
        contentType: response.headers.get('content-type') || 'image/jpeg',
        upsert: true,
      });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filename);

    return urlData.publicUrl;

  } catch (error) {
    return null;
  }
}

async function main() {
  console.log('📸 Product Image Downloader');
  console.log('===========================\n');

  // Get products without images but with source URLs
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, image_url')
    .is('image_url', null)
    .limit(100);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Found ${products?.length || 0} products without images\n`);

  if (!products || products.length === 0) {
    console.log('All products have images!');
    return;
  }

  // Note: We need the original image URLs from the scrapers
  // This script is for products that were saved without images
  // You would need to re-run the scraper to get the original URLs

  console.log('To download images, re-run the scraper which will automatically');
  console.log('download and store images for new products.\n');
  
  console.log('Products without images:');
  products.slice(0, 10).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
  });
}

main().catch(console.error);
