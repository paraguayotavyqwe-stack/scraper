import { config } from 'dotenv';
import { SuperseisScraper } from './scrapers/superseis-scraper';

config();

async function testSuperseis() {
  console.log('🧪 Testing improved Superseis scraper...\n');
  
  const scraper = new SuperseisScraper();
  
  try {
    await scraper.init();
    const products = await scraper.scrapeProducts();
    
    console.log(`\n✅ Total products scraped: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\n📦 Sample products:');
      products.slice(0, 20).forEach((p, i) => {
        const saleTag = p.isOnSale ? ' 🏷️' : '';
        console.log(`${i + 1}. ${p.name.substring(0, 60)} - ₲${p.price.toLocaleString()}${saleTag}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.close();
  }
}

testSuperseis();
