import { config } from 'dotenv';
import { SuperseisScraper } from './scrapers/superseis-scraper';
import { StockScraper } from './scrapers/stock-scraper';
import { CasaRicaScraper } from './scrapers/casa-rica-scraper';

// Load environment variables
config();

async function runScraper(scraperName: string, scraper: any) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Starting scraper: ${scraperName}`);
  console.log(`${'='.repeat(50)}\n`);

  const startTime = Date.now();

  try {
    await scraper.init();
    const products = await scraper.scrapeProducts();
    
    console.log(`\nFound ${products.length} products from ${scraperName}`);
    
    if (products.length > 0) {
      await scraper.saveProducts(products);
      console.log(`Successfully saved products from ${scraperName}`);
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n${scraperName} completed in ${duration}s`);
    
    return { success: true, count: products.length };
  } catch (error) {
    console.error(`Error in ${scraperName}:`, error);
    return { success: false, count: 0 };
  } finally {
    await scraper.close();
  }
}

async function main() {
  console.log('🛒 AhorraPY Price Scraper');
  console.log('========================\n');
  console.log(`Started at: ${new Date().toISOString()}`);

  const scrapers = [
    { name: 'Superseis', scraper: new SuperseisScraper() },
    { name: 'Stock', scraper: new StockScraper() },
    { name: 'Casa Rica', scraper: new CasaRicaScraper() },
  ];

  const results = [];

  for (const { name, scraper } of scrapers) {
    const result = await runScraper(name, scraper);
    results.push({ name, ...result });
    
    // Add delay between scrapers to be respectful
    console.log('\nWaiting 5 seconds before next scraper...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Summary
  console.log('\n\n📊 SCRAPING SUMMARY');
  console.log('===================\n');
  
  let totalProducts = 0;
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.count} products`);
    totalProducts += result.count;
  }
  
  console.log(`\n📈 Total products scraped: ${totalProducts}`);
  console.log(`Finished at: ${new Date().toISOString()}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { main as runAllScrapers };
