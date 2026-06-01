import { config } from 'dotenv';
import { SuperseisScraper } from './scrapers/superseis-scraper';
import { StockScraper } from './scrapers/stock-scraper';
import { CasaRicaScraper } from './scrapers/casa-rica-scraper';
import { BiggieScraper } from './scrapers/biggie-scraper';

config();

const scraperName = process.argv[2];

const scrapers: Record<string, { name: string; scraper: any }> = {
  'biggie': { name: 'Biggie', scraper: new BiggieScraper() },
  'stock': { name: 'Stock', scraper: new StockScraper() },
  'casa-rica': { name: 'Casa Rica', scraper: new CasaRicaScraper() },
  'superseis': { name: 'Superseis', scraper: new SuperseisScraper() },
};

async function run() {
  const entry = scrapers[scraperName];
  if (!entry) {
    console.error(`Unknown scraper: ${scraperName}. Available: ${Object.keys(scrapers).join(', ')}`);
    process.exit(1);
  }

  console.log(`Starting scraper: ${entry.name}`);
  const start = Date.now();

  try {
    await entry.scraper.init();
    const products = await entry.scraper.scrapeProducts();
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      await entry.scraper.saveProducts(products);
    }
    console.log(`${entry.name} completed in ${((Date.now() - start) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.error(`${entry.name} failed:`, e);
    process.exit(1);
  } finally {
    await entry.scraper.close();
  }
}

run();
