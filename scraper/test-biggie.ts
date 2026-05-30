import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('https://biggie.com.py/products/', { timeout: 30000 });
  await p.waitForTimeout(8000);
  
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => window.scrollBy(0, 1500));
    await p.waitForTimeout(1500);
  }
  
  const products = await p.evaluate(() => {
    const items: Array<{name: string; price: string; html: string}> = [];
    document.querySelectorAll('.v-card, .card').forEach(card => {
      const name = card.querySelector('.v-card__title, .card-title, h2, h3')?.textContent?.trim();
      const priceEl = card.querySelector('.card-text, .price, [class*="price"]');
      const price = priceEl?.textContent?.trim();
      if (name && name.length > 3) {
        items.push({ name, price: price || 'N/A', html: card.outerHTML.substring(0, 500) });
      }
    });
    return items;
  });
  
  console.log('Products found:', products.length);
  products.slice(0, 10).forEach(p => {
    console.log('-', p.name, ':', p.price);
  });
  
  if (products.length === 0) {
    const html = await p.evaluate(() => document.body?.innerHTML?.substring(0, 5000));
    console.log('\nPage HTML:', html);
  }
  
  await b.close();
})();
