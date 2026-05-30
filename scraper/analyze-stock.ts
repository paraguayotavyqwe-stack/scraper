import { config } from 'dotenv';
import { chromium } from 'playwright';

config();

async function analyzeStockStructure() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.stock.com.py', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(5000);
  
  // Scroll
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 1500));
    await page.waitForTimeout(1500);
  }
  
  // Get detailed HTML structure of product areas
  const analysis = await page.evaluate(() => {
    const result: {
      productContainers: string[];
      sampleHTML: string[];
      dataAttributes: string[];
    } = {
      productContainers: [],
      sampleHTML: [],
      dataAttributes: [],
    };
    
    // Find elements with data attributes that might contain product info
    const allEls = document.querySelectorAll('[data-product-id], [data-name], [data-price], [data-id]');
    allEls.forEach(el => {
      result.dataAttributes.push(`${el.tagName}: ${el.outerHTML.substring(0, 200)}`);
    });
    
    // Find product-like containers
    const containers = document.querySelectorAll('.product-box, .product-card, .item-box, .slide-item, [class*="slide"]');
    containers.forEach((el, i) => {
      if (i < 5) {
        result.sampleHTML.push(`\n--- Container ${i + 1} (${el.className}) ---\n${el.outerHTML.substring(0, 1000)}`);
      }
    });
    
    // Find all elements with product-related attributes
    const withData = document.querySelectorAll('[data-ga4-list], [data-product], [data-sku]');
    withData.forEach((el, i) => {
      if (i < 5) {
        result.productContainers.push(`${el.tagName}.${el.className}: ${el.outerHTML.substring(0, 500)}`);
      }
    });
    
    return result;
  });
  
  console.log('Data attributes:', analysis.dataAttributes.slice(0, 10));
  console.log('\nProduct containers:', analysis.productContainers.slice(0, 3));
  console.log('\nSample HTML:', analysis.sampleHTML.slice(0, 3));
  
  await browser.close();
}

analyzeStockStructure();
