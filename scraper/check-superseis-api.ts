import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  // Intercept API calls
  const apiCalls: string[] = [];
  p.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('json') || url.includes('graphql')) {
      const ct = response.headers()['content-type'] || '';
      if (ct.includes('json')) {
        try {
          const body = await response.text();
          apiCalls.push(`${url.substring(0, 150)}: ${body.substring(0, 500)}`);
        } catch {}
      }
    }
  });
  
  await p.goto('https://www.superseis.com.py/catalog/lacteos/leches/entera', { timeout: 30000 });
  await p.waitForTimeout(8000);
  
  console.log('API calls:', apiCalls.length);
  apiCalls.forEach(c => console.log(c));
  
  // Check for __NUXT__ or similar state
  const state = await p.evaluate(() => {
    const nuxt = (window as any).__NUXT__;
    if (nuxt) return JSON.stringify(nuxt).substring(0, 2000);
    return null;
  });
  
  if (state) console.log('\nState:', state);
  
  await b.close();
})();
