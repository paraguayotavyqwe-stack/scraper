import { config } from 'dotenv';
import { CasaRicaScraper } from './scrapers/casa-rica-scraper';

config();

async function testCasaRica() {
  console.log('🧪 Testing Casa Rica scraper...\n');
  
  const scraper = new CasaRicaScraper();
  
  try {
    await scraper.init();
    const products = await scraper.scrapeProducts();
    
    console.log(`\n✅ Total products scraped: ${products.length}`);
    
    if (products.length > 0) {
      console.log('\n📦 Sample products:');
      products.slice(0, 20).forEach((p, i) => {
        const saleTag = p.isOnSale ? ' 🏷️ SALE' : '';
        const originalPrice = p.originalPrice ? ` (was: ₲${p.originalPrice.toLocaleString()})` : '';
        console.log(`${i + 1}. ${p.name}`);
        console.log(`   Price: ₲${p.price.toLocaleString()}${originalPrice}${saleTag}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await scraper.close();
  }
}

testCasaRica();
