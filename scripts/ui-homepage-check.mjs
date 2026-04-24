import { chromium } from 'playwright';

const baseUrl = process.env.UI_BASE_URL || 'http://127.0.0.1:5173';
const desktopRoutes = ['/', '/projects', '/projects/kitchens', '/blog', '/video', '/services', '/about'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function checkDesktop(page) {
  for (const route of desktopRoutes) {
    const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    assert(response && response.ok(), `Route failed at ${route}`);
  }

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const header = page.locator('[data-site-header]').first();
  const projectsTrigger = page.locator('[data-nav-projects]').first();
  const blogLink = page.locator('a[href="/blog"]').first();

  await header.waitFor();
  await projectsTrigger.waitFor();
  await blogLink.waitFor();

  const requiredHomeMarkers = [
    '[data-home-hero]',
    '[data-home-intro]',
    '[data-home-services]',
    '[data-home-process]',
    '[data-home-projects]',
    '[data-home-testimonials]',
    '[data-home-blog]',
    '[data-home-cta]',
  ];

  for (const selector of requiredHomeMarkers) {
    await page.locator(selector).first().waitFor();
  }

  const heroTitle = page.locator('[data-home-hero] h1').first();
  const heroProjectsCta = page.locator('[data-home-hero] a[href="/projects"]').first();
  const introMedia = page.locator('[data-home-intro] img').first();
  const projectsCta = page.locator('[data-home-projects] a[href="/projects"]').first();
  const blogCta = page.locator('[data-home-blog] a[href="/blog"]').first();
  const contactCta = page.locator('[data-home-cta] a[href="/contact"]').first();

  await heroTitle.waitFor();
  await heroProjectsCta.waitFor();
  await introMedia.waitFor();
  await projectsCta.waitFor();
  await blogCta.waitFor();
  await contactCta.waitFor();
}

async function checkMobile(page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  await page.locator('[data-site-header]').first().waitFor();
  await page.locator('[data-home-blog] a[href="/blog"]').first().waitFor();

  const heroBox = await page.locator('[data-home-hero]').first().boundingBox();
  assert(heroBox && heroBox.width <= 390, 'Mobile hero overflows viewport');

  const pageScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  assert(pageScrollWidth <= 406, `Page horizontally overflows on mobile (${pageScrollWidth}px)`);
}

const browser = await chromium.launch();

try {
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await checkDesktop(desktopPage);
  await desktopPage.close();

  const mobilePage = await browser.newPage();
  await checkMobile(mobilePage);
  await mobilePage.close();
} finally {
  await browser.close();
}
