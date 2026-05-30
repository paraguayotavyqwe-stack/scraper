import { config } from 'dotenv';
import { SuperseisScraper } from './scrapers/superseis-scraper';
import { StockScraper } from './scrapers/stock-scraper';
import { CasaRicaScraper } from './scrapers/casa-rica-scraper';
import { BiggieScraper } from './scrapers/biggie-scraper';

config();

async function runAllScrapers() {
  console.log('🛒 AhorraPY Price Scraper');
  console.log('========================\n');
  console.log(`Started at: ${new Date().toISOString()}`);

  const scrapers = [
    { name: 'Superseis', scraper: new SuperseisScraper() },
    { name: 'Stock', scraper: new StockScraper() },
    { name: 'Casa Rica', scraper: new CasaRicaScraper() },
    { name: 'Biggie', scraper: new BiggieScraper() },
  ];

  const results: Array<{ name: string; success: boolean; count: number }> = [];

  for (const { name, scraper } of scrapers) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Starting scraper: ${name}`);
    console.log(`${'='.repeat(50)}\n`);

    const startTime = Date.now();

    try {
      await scraper.init();
      const products = await scraper.scrapeProducts();
      
      console.log(`\nFound ${products.length} products from ${name}`);
      
      if (products.length > 0) {
        await scraper.saveProducts(products);
        console.log(`Successfully saved products from ${name}`);
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n${name} completed in ${duration}s`);
      
      results.push({ name, success: true, count: products.length });
    } catch (error) {
      console.error(`Error in ${name}:`, error);
      results.push({ name, success: false, count: 0 });
    } finally {
      await scraper.close();
    }

    // Delay between scrapers
    console.log('\nWaiting 10 seconds before next scraper...');
    await new Promise(resolve => setTimeout(resolve, 10000));
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

runAllScrapers().catch(console.error);
