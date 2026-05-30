import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  // Check main categories page
  await p.goto('https://www.superseis.com.py/', { timeout: 30000 });
  await p.waitForTimeout(5000);
  
  // Get all category links
  const categories = await p.evaluate(() => {
    const cats: Array<{name: string; url: string}> = [];
    document.querySelectorAll('a[href*="/catalog/"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      const name = link.textContent?.trim() || '';
      if (href && name && !cats.some(c => c.url === href)) {
        cats.push({ name, url: href.startsWith('http') ? href : `https://www.superseis.com.py${href}` });
      }
    });
    return cats;
  });
  
  console.log('Categories found:', categories.length);
  categories.forEach(c => console.log(`- ${c.name}: ${c.url}`));
  
  // Check one category for pagination
  if (categories.length > 0) {
    await p.goto(categories[0].url, { timeout: 30000 });
    await p.waitForTimeout(5000);
    
    const paginationInfo = await p.evaluate(() => {
      const text = document.body?.innerText || '';
      const totalMatch = text.match(/(\d+)\s*productos?/i) || text.match(/Mostrando.*?de\s*(\d+)/i);
      const pageLinks = document.querySelectorAll('.pagination a, [class*="page"] a');
      return {
        total: totalMatch?.[1] || 'unknown',
        pageLinks: pageLinks.length,
        textSnippet: text.substring(0, 500)
      };
    });
    
    console.log('\nPagination info:', paginationInfo);
  }
  
  // Check if there's an API
  const apiCalls: string[] = [];
  p.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('product') || url.includes('catalog')) {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('json')) {
        try {
          const body = await response.text();
          apiCalls.push(`${url.substring(0, 150)}: ${body.substring(0, 300)}`);
        } catch {}
      }
    }
  });
  
  await p.goto('https://www.superseis.com.py/catalog/lacteos', { timeout: 30000 });
  await p.waitForTimeout(8000);
  
  console.log('\nAPI calls:', apiCalls.length);
  apiCalls.forEach(c => console.log(c));
  
  await b.close();
})();
