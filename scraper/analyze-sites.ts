import { config } from 'dotenv';
import { chromium } from 'playwright';

config();

async function analyzeSites() {
  const browser = await chromium.launch({ headless: true });
  
  const sites = [
    { name: 'Stock', url: 'https://www.stock.com.py/categoria-producto/lacteos' },
    { name: 'Casa Rica', url: 'https://www.casarica.com.py/categoria-producto/lacteos/' },
  ];

  for (const site of sites) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Analyzing: ${site.name}`);
    console.log(`${'='.repeat(50)}`);
    
    const page = await browser.newPage();
    
    try {
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Scroll
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(1000);
      }
      
      await page.screenshot({ path: `scraper/${site.name.toLowerCase()}-screenshot.png`, fullPage: false });
      
      const analysis = await page.evaluate(() => {
        // Find all product-related elements
        const allElements = document.querySelectorAll('*');
        const classMap = new Map<string, number>();
        
        allElements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => {
              if (cls.trim() && (cls.includes('product') || cls.includes('price') || cls.includes('item') || cls.includes('card'))) {
                classMap.set(cls, (classMap.get(cls) || 0) + 1);
              }
            });
          }
        });
        
        const topClasses = Array.from(classMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 30)
          .map(([cls, count]) => `${cls}: ${count}`);
        
        // Try various selectors
        const selectorTests = [
          '.product',
          '.product-item',
          '.product-card',
          'li.product',
          '.woocommerce-loop-product__title',
          '.price',
          '[data-product]',
          'article',
          '.grid-item',
          '.col-product',
          '.item',
        ];
        
        const selectorResults = selectorTests.map(sel => {
          const els = document.querySelectorAll(sel);
          return `${sel}: ${els.length} elements`;
        });
        
        // Get sample product HTML
        const sampleProducts = [];
        const productEls = document.querySelectorAll('li.product, .product-item, [data-product], article');
        for (let i = 0; i < Math.min(3, productEls.length); i++) {
          sampleProducts.push(productEls[i].outerHTML.substring(0, 500));
        }
        
        return { topClasses, selectorResults, sampleProducts };
      });
      
      console.log('\nTop product classes:', analysis.topClasses);
      console.log('\nSelector tests:', analysis.selectorResults);
      console.log('\nSample product HTML:');
      analysis.sampleProducts.forEach((html, i) => {
        console.log(`\n--- Product ${i + 1} ---`);
        console.log(html);
      });
      
    } catch (error) {
      console.error(`Error analyzing ${site.name}:`, error);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
}

analyzeSites();
