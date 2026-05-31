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

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

async function findSimilarProduct(productName: string): Promise<string | null> {
  // Extract key words from product name (brand, product type)
  const words = productName
    .toLowerCase()
    .replace(/[0-9]+(g|kg|ml|l|gr|un|unid|gramos|litros)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(w => w.length > 3);

  // Try to find similar products with images
  for (const word of words) {
    const { data: similar } = await supabase
      .from('products')
      .select('id, name, image_url')
      .ilike('name', `%${word}%`)
      .not('image_url', 'is', null)
      .limit(5);

    if (similar && similar.length > 0) {
      // Return the first match that has an image
      const match = similar.find(p => p.image_url && !p.image_url.includes('placehold'));
      if (match) return match.image_url;
    }
  }

  return null;
}

async function main() {
  console.log('🖼️ Product Image Cross-Reference');
  console.log('================================\n');

  // Get products without real images
  const { data: productsWithoutImages } = await supabase
    .from('products')
    .select('id, name, image_url')
    .or('image_url.is.null,image_url.like.*placehold*')
    .limit(500);

  if (!productsWithoutImages || productsWithoutImages.length === 0) {
    console.log('✅ All products have real images!');
    return;
  }

  console.log(`Found ${productsWithoutImages.length} products without real images\n`);

  let updated = 0;
  let notFound = 0;

  for (const product of productsWithoutImages) {
    const similarImage = await findSimilarProduct(product.name);
    
    if (similarImage) {
      // Update product with found image
      const { error } = await supabase
        .from('products')
        .update({ image_url: similarImage })
        .eq('id', product.id);

      if (!error) {
        updated++;
        console.log(`✅ ${product.name.substring(0, 40)}...`);
        console.log(`   Found image from similar product`);
      }
    } else {
      notFound++;
      console.log(`❌ ${product.name.substring(0, 40)}...`);
      console.log(`   No similar product found`);
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n📊 Results:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Not found: ${notFound}`);
}

main().catch(console.error);
