import { config } from 'dotenv';
import { chromium } from 'playwright';

config();

async function testScraping() {
  console.log('🧪 Testing scraping...\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  try {
    console.log('📍 Testing Superseis - Lácteos...');
    await page.goto('https://www.superseis.com.py/catalog/lacteos', { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Scroll to load products
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 1500));
      await page.waitForTimeout(1500);
    }

    // Take a screenshot
    await page.screenshot({ path: 'scraper/test-screenshot.png', fullPage: false });
    console.log('📸 Screenshot saved');

    // Get detailed HTML structure
    const analysis = await page.evaluate(() => {
      const result = {
        allClasses: [] as string[],
        productElements: [] as string[],
        priceElements: [] as string[],
        sampleHTML: '',
      };

      // Find all elements with product-related classes
      const allElements = document.querySelectorAll('*');
      const classMap = new Map<string, number>();
      
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => {
            if (cls.trim()) {
              classMap.set(cls, (classMap.get(cls) || 0) + 1);
            }
          });
        }
      });

      // Get most common classes
      result.allClasses = Array.from(classMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 50)
        .map(([cls, count]) => `${cls} (${count})`);

      // Try to find product containers
      const productSelectors = [
        '.product-thumb',
        '.product',
        '[class*="product"]',
        '.item',
        '.card',
        'li',
      ];

      for (const selector of productSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          result.productElements.push(`${selector}: ${elements.length} elements`);
          
          // Get first element's HTML as sample
          if (elements.length > 0 && !result.sampleHTML) {
            result.sampleHTML = elements[0].outerHTML.substring(0, 1000);
          }
        }
      }

      // Find price elements
      const priceElements = document.querySelectorAll('[class*="price"], [class*="Price"]');
      result.priceElements = Array.from(priceElements).slice(0, 10).map(el => ({
        class: el.className,
        text: el.textContent?.trim().substring(0, 50),
      }));

      return result;
    });

    console.log('\n📊 Page Analysis:');
    console.log('\nTop classes:', analysis.allClasses.slice(0, 15));
    console.log('\nProduct elements:', analysis.productElements);
    console.log('\nPrice elements:', analysis.priceElements);
    console.log('\nSample HTML:', analysis.sampleHTML);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testScraping();
