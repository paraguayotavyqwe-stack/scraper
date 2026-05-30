import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  // Intercept API calls
  const apiCalls: string[] = [];
  p.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api') || url.includes('products') || url.includes('graphql')) {
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('json')) {
          const body = await response.text();
          apiCalls.push(`${url.substring(0, 100)}: ${body.substring(0, 200)}`);
        }
      } catch {}
    }
  });
  
  await p.goto('https://biggie.com.py/products/lacteos/', { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(10000);
  
  console.log('API calls intercepted:', apiCalls.length);
  apiCalls.forEach(call => console.log(call));
  
  // Check if there's a __NUXT__ state
  const nuxtState = await p.evaluate(() => {
    const state = (window as any).__NUXT__;
    if (state && state.data) {
      return JSON.stringify(state.data).substring(0, 2000);
    }
    return null;
  });
  
  if (nuxtState) {
    console.log('\n__NUXT__ state found:', nuxtState);
  }
  
  await b.close();
})();
