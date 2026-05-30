import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  await p.goto('https://biggie.com.py/products/lacteos/', { timeout: 30000 });
  await p.waitForTimeout(10000);
  
  // Check what's on the page
  const analysis = await p.evaluate(() => {
    const allText = document.body?.innerText || '';
    const priceMatches = allText.match(/Gs\.?\s*[\d.,]+/g) || [];
    
    return {
      title: document.title,
      textLength: allText.length,
      prices: priceMatches.slice(0, 20),
      textPreview: allText.substring(0, 2000)
    };
  });
  
  console.log('Title:', analysis.title);
  console.log('Text length:', analysis.textLength);
  console.log('Prices found:', analysis.prices);
  console.log('\nText preview:\n', analysis.textPreview);
  
  await b.close();
})();
