import { config } from 'dotenv';
import { SuperseisScraper } from './scrapers/superseis-scraper';

config();

async function testSuperseis() {
  console.log('🧪 Testing Superseis scraper...\n');
  
  const scraper = new SuperseisScraper();
  
  try {
    await scraper.init();
    const products = await scraper.scrapeProducts();
    
    console.log(`\n✅ Total products scraped: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\n📦 Sample products:');
      products.slice(0, 10).forEach((p, i) => {
        const saleTag = p.isOnSale ? ' 🏷️ SALE' : '';
        const originalPrice = p.originalPrice ? ` (was: ₲${p.originalPrice.toLocaleString()})` : '';
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Price: ₲${p.price.toLocaleString()}${originalPrice}${saleTag}`);
        console.log('');
      });
      
      // Save to JSON for inspection
      const fs = require('fs');
      fs.writeFileSync('scraper/test-products.json', JSON.stringify(products, null, 2));
      console.log('💾 Products saved to test-products.json');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.close();
  }
}

testSuperseis();
