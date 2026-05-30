import { chromium } from 'playwright';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  
  // Go to a Superseis category
  await p.goto('https://www.superseis.com.py/catalog/lacteos/leches/entera', { timeout: 30000 });
  await p.waitForTimeout(5000);
  
  // Scroll to load products
  for (let i = 0; i < 3; i++) {
    await p.evaluate(() => window.scrollBy(0, 1000));
    await p.waitForTimeout(1000);
  }
  
  // Analyze product image structure
  const analysis = await p.evaluate(() => {
    const products: Array<{
      name: string;
      price: string;
      imgSrc: string | null;
      imgDataSrc: string | null;
      imgDataLazy: string | null;
      allImgAttrs: string[];
    }> = [];
    
    document.querySelectorAll('.product-thumb').forEach(card => {
      const img = card.querySelector('img');
      const name = img?.getAttribute('alt') || '';
      const price = card.getAttribute('data-product-price') || '';
      
      const allAttrs: string[] = [];
      if (img) {
        for (let i = 0; i < img.attributes.length; i++) {
          const attr = img.attributes[i];
          allAttrs.push(`${attr.name}=${attr.value.substring(0, 100)}`);
        }
      }
      
      products.push({
        name: name.substring(0, 50),
        price,
        imgSrc: img?.getAttribute('src'),
        imgDataSrc: img?.getAttribute('data-src'),
        imgDataLazy: img?.getAttribute('data-lazy'),
        allImgAttrs: allAttrs,
      });
    });
    
    return products;
  });
  
  console.log(`Found ${analysis.length} products\n`);
  analysis.slice(0, 5).forEach((p, i) => {
    console.log(`${i + 1}. ${p.name}`);
    console.log(`   Price: ${p.price}`);
    console.log(`   src: ${p.imgSrc}`);
    console.log(`   data-src: ${p.imgDataSrc}`);
    console.log(`   data-lazy: ${p.imgDataLazy}`);
    console.log(`   All attrs: ${p.allImgAttrs.join(', ')}`);
    console.log('');
  });
  
  await b.close();
})();
