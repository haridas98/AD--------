import { chromium } from 'playwright';

const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const routes = ['/', '/kitchens', '/blog', '/contact', '/process', '/video-series', '/projects-before-and-after'];
const viewports = [
  { width: 390, height: 844, name: 'mobile' },
  { width: 1440, height: 900, name: 'desktop' },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch();
const page = await browser.newPage();

for (const viewport of viewports) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });

  for (const route of routes) {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });

    const shell = page.locator('[data-page-shell]').first();
    await shell.waitFor();

    const header = page.locator('header').first();
    await header.waitFor();
    assert((await header.locator('a').count()) > 0, `Header links missing on ${route}`);

    const footer = page.locator('footer').first();
    await footer.waitFor();

    const h1 = page.locator('h1').first();
    await h1.waitFor();

    if (route === '/') {
      const lead = page.locator('[data-home-lead]').first();
      await lead.waitFor();
      assert((await page.locator('[data-portfolio-card]').count()) >= 1, 'Homepage supporting cards missing');
    }

    if (route === '/kitchens') {
      assert((await page.locator('[data-portfolio-card]').count()) >= 1, 'Category cards missing');
    }

    if (route === '/blog') {
      assert((await page.locator('.blog-card').count()) >= 1, 'Blog cards missing');
    }

    if (route === '/contact') {
      await page.locator('.contact-form').first().waitFor();
    }

    if (route === '/process') {
      await page.locator('.services-sections').first().waitFor();
    }

    if (route === '/video-series') {
      await page.locator('.video-section').first().waitFor();
    }

    if (route === '/projects-before-and-after') {
      const list = page.locator('.before-after-item');
      const emptyState = page.locator('text=No before/after transformations available yet.');
      assert((await list.count()) > 0 || (await emptyState.count()) > 0, 'Before/after content missing');
    }

    const firstCard = page.locator('[data-portfolio-card]').first();
    if (await firstCard.count()) {
      const box = await firstCard.boundingBox();
      if (box && viewport.width <= 390) {
        assert(box.x >= 8, `Card too close to left edge on ${route}`);
        assert(box.x + box.width <= viewport.width - 8, `Card too close to right edge on ${route}`);
      }
    }
  }
}

await browser.close();
console.log('UI portfolio check passed.');
