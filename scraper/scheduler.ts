import { SuperseisScraper } from './scrapers/superseis-scraper';
import { StockScraper } from './scrapers/stock-scraper';
import { CasaRicaScraper } from './scrapers/casa-rica-scraper';
import { BiggieScraper } from './scrapers/biggie-scraper';
import { DiscoScraper } from './scrapers/disco-scraper';
import { VillaLimaScraper } from './scrapers/villa-lima-scraper';
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

interface ScraperConfig {
  name: string;
  slug: string;
  scraper: any;
  enabled: boolean;
}

const scrapers: ScraperConfig[] = [
  { name: 'Superseis', slug: 'superseis', scraper: new SuperseisScraper(), enabled: true },
  { name: 'Stock', slug: 'stock', scraper: new StockScraper(), enabled: true },
  { name: 'Casa Rica', slug: 'casa-rica', scraper: new CasaRicaScraper(), enabled: true },
  { name: 'Biggie', slug: 'biggie', scraper: new BiggieScraper(), enabled: true },
  { name: 'Disco', slug: 'disco', scraper: new DiscoScraper(), enabled: true },
  { name: 'Villa Lima', slug: 'villa-lima', scraper: new VillaLimaScraper(), enabled: true },
];

async function ensureSupermarketExists(name: string, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from('supermarkets')
    .select('id')
    .eq('slug', slug)
    .single();

  if (data) return data.id;

  // Create supermarket
  const { data: newSupermarket } = await supabase
    .from('supermarkets')
    .insert({
      name,
      slug,
      is_active: true,
      opening_hours: {},
    })
    .select('id')
    .single();

  console.log(`Created supermarket: ${name}`);
  return newSupermarket?.id || null;
}

async function runScheduler() {
  console.log('🤖 AhorraPY Auto Scheduler');
  console.log('==========================\n');
  console.log(`Started at: ${new Date().toISOString()}`);

  // Check if there's a lock file (prevent concurrent runs)
  const lockFile = path.join(__dirname, '.scheduler.lock');
  if (fs.existsSync(lockFile)) {
    const lockTime = fs.readFileSync(lockFile, 'utf-8');
    const lockDate = new Date(lockTime);
    const hoursSinceLock = (Date.now() - lockDate.getTime()) / (1000 * 60 * 60);
    
    // If lock is older than 2 hours, remove it
    if (hoursSinceLock < 2) {
      console.log('⚠️ Another scheduler is running. Exiting...');
      return;
    }
    console.log('🔓 Removing old lock file...');
  }

  // Create lock
  fs.writeFileSync(lockFile, new Date().toISOString());

  try {
    const results: Array<{ name: string; success: boolean; count: number; duration: number }> = [];

    for (const config of scrapers) {
      if (!config.enabled) {
        console.log(`\n⏭️ Skipping ${config.name} (disabled)`);
        continue;
      }

      console.log(`\n${'='.repeat(50)}`);
      console.log(`Starting scraper: ${config.name}`);
      console.log(`${'='.repeat(50)}`);

      const startTime = Date.now();

      try {
        // Ensure supermarket exists in DB
        await ensureSupermarketExists(config.name, config.slug);

        // Run scraper
        await config.scraper.init();
        const products = await config.scraper.scrapeProducts();

        console.log(`Found ${products.length} products from ${config.name}`);

        if (products.length > 0) {
          await config.scraper.saveProducts(products);
          console.log(`✅ Saved products from ${config.name}`);
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        results.push({ name: config.name, success: true, count: products.length, duration: parseFloat(duration) });

      } catch (error) {
        console.error(`❌ Error in ${config.name}:`, error);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        results.push({ name: config.name, success: false, count: 0, duration: parseFloat(duration) });
      } finally {
        await config.scraper.close();
      }

      // Delay between scrapers (be respectful)
      console.log('\n⏳ Waiting 10 seconds...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    // Summary
    console.log('\n\n📊 SCHEDULER SUMMARY');
    console.log('====================\n');

    let totalProducts = 0;
    for (const result of results) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.count} products (${result.duration}s)`);
      totalProducts += result.count;
    }

    console.log(`\n📈 Total products scraped: ${totalProducts}`);
    console.log(`Finished at: ${new Date().toISOString()}`);

    // Save run log
    const logFile = path.join(__dirname, 'logs', `${new Date().toISOString().split('T')[0]}.json`);
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(logFile, JSON.stringify({
      timestamp: new Date().toISOString(),
      results,
      totalProducts,
    }) + '\n');

  } finally {
    // Remove lock
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
  }
}

// Run if called directly
if (require.main === module) {
  runScheduler().catch(console.error);
}

export { runScheduler };
