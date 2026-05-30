import { config } from 'dotenv';
import { chromium } from 'playwright';

config();

async function analyzeStockProducts() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.stock.com.py', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1500);
  }
  
  // Get all product links and their context
  const products = await page.evaluate(() => {
    const items: Array<{
      name: string;
      price: string;
      url: string;
      html: string;
    }> = [];
    
    // Find all product links
    const links = document.querySelectorAll('a[href*="/products/"]');
    
    links.forEach((link, i) => {
      if (i < 20) {
        const parent = link.closest('div, li, article') || link;
        const text = parent.textContent || '';
        
        // Extract product name from URL
        const href = link.getAttribute('href') || '';
        const urlMatch = href.match(/products\/\d+-(.+?)\.aspx/);
        const nameFromUrl = urlMatch ? urlMatch[1].replace(/-/g, ' ') : '';
        
        items.push({
          name: nameFromUrl,
          price: text.match(/Gs\s+[\d.]+/)?.[0] || 'N/A',
          url: href,
          html: parent.outerHTML.substring(0, 500),
        });
      }
    });
    
    return items;
  });
  
  console.log('Products found:', products.length);
  products.forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`);
    console.log(`   Price: ${p.price}`);
    console.log(`   URL: ${p.url.substring(0, 80)}...`);
  });
  
  await browser.close();
}

analyzeStockProducts();
