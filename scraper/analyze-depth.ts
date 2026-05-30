import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('https://www.superseis.com.py/', { timeout: 30000 });
  await p.waitForTimeout(5000);
  
  const links = await p.evaluate(() => {
    const allLinks: string[] = [];
    document.querySelectorAll('a[href*="/catalog/"]').forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href) allLinks.push(href);
    });
    return allLinks;
  });
  
  // Group by depth
  const byDepth: Record<number, string[]> = {};
  links.forEach(link => {
    const parts = link.replace('https://www.superseis.com.py/catalog/', '').split('/').filter(p => p);
    const depth = parts.length;
    if (!byDepth[depth]) byDepth[depth] = [];
    byDepth[depth].push(link);
  });
  
  Object.keys(byDepth).sort().forEach(depth => {
    console.log(`Depth ${depth}: ${byDepth[depth].length} categories`);
  });
  
  const maxDepth = Math.max(...Object.keys(byDepth).map(Number));
  console.log(`\nSample leaf categories (depth ${maxDepth}):`);
  byDepth[maxDepth]?.slice(0, 10).forEach(c => console.log(`- ${c.split('/catalog/')[1]}`));
  
  await b.close();
})();
