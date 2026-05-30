import { config } from 'dotenv';
import { chromium } from 'playwright';

config();

async function analyzeDeep() {
  const browser = await chromium.launch({ headless: true });
  
  // Test Stock
  console.log('\n=== STOCK ===');
  const page1 = await browser.newPage();
  await page1.goto('https://www.stock.com.py', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page1.waitForTimeout(5000);
  
  // Check if there's a category link
  const stockContent = await page1.evaluate(() => {
    return {
      title: document.title,
      bodyText: document.body?.innerText?.substring(0, 2000),
      scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).slice(0, 10),
    };
  });
  console.log('Title:', stockContent.title);
  console.log('Body preview:', stockContent.bodyText?.substring(0, 500));
  console.log('Scripts:', stockContent.scripts);
  await page1.close();

  // Test Superseis API
  console.log('\n=== SUPERSEIS API CHECK ===');
  const page2 = await browser.newPage();
  
  // Intercept API calls
  const apiCalls: string[] = [];
  page2.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('catalog') || url.includes('product')) {
      apiCalls.push(url);
    }
  });
  
  await page2.goto('https://www.superseis.com.py/catalog/lacteos', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(3000);
  
  console.log('API calls intercepted:', apiCalls.slice(0, 10));
  await page2.close();

  // Test Casa Rica
  console.log('\n=== CASA RICA ===');
  const page3 = await browser.newPage();
  await page3.goto('https://www.casarica.com.py/categoria-producto/lacteos/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page3.waitForTimeout(5000);
  
  const crContent = await page3.evaluate(() => {
    const allText = document.body?.innerText || '';
    // Find price patterns
    const priceMatches = allText.match(/₲\s*[\d.,]+/g) || [];
    // Find product-like text
    const lines = allText.split('\n').filter(l => l.length > 10 && l.length < 100);
    
    return {
      title: document.title,
      pricePatterns: priceMatches.slice(0, 20),
      sampleLines: lines.slice(0, 30),
      html: document.body?.innerHTML?.substring(0, 3000),
    };
  });
  
  console.log('Title:', crContent.title);
  console.log('Prices found:', crContent.pricePatterns);
  console.log('Sample text lines:', crContent.sampleLines.slice(0, 10));
  console.log('\nHTML snippet:', crContent.html?.substring(0, 1500));
  await page3.close();
  
  await browser.close();
}

analyzeDeep();
