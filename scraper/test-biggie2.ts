import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  // Try category page
  await p.goto('https://biggie.com.py/products/lacteos/', { timeout: 30000 });
  await p.waitForTimeout(8000);
  
  for (let i = 0; i < 5; i++) {
    await p.evaluate(() => window.scrollBy(0, 1500));
    await p.waitForTimeout(1500);
  }
  
  const products = await p.evaluate(() => {
    const items: Array<{name: string; price: string}> = [];
    document.querySelectorAll('.v-card, .card, article').forEach(card => {
      const name = card.querySelector('h2, h3, h4, .v-card__title')?.textContent?.trim();
      const texts = card.textContent || '';
      const priceMatch = texts.match(/Gs\.?\s*[\d.,]+/);
      if (name && name.length > 5 && priceMatch) {
        items.push({ name, price: priceMatch[0] });
      }
    });
    return items;
  });
  
  console.log('Products found:', products.length);
  products.slice(0, 15).forEach(p => console.log('-', p.name, ':', p.price));
  
  await b.close();
})();
