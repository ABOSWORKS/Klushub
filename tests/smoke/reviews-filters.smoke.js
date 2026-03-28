const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');

const FILE_URL =
  'file:///' +
  path
    .resolve('D:/Backup bestanden/Aron/Coding/Klushub/Update 20 maart/Output/index.html')
    .replace(/\\/g, '/');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });

  await page.click('nav a:has-text("Reviews")');
  await page.waitForTimeout(200);

  const initialCount = await page.locator('#reviewsPageList article').count();
  assert(initialCount > 0, 'Reviews lijst moet initieel content tonen');

  await page.fill('#rv-filter-search', 'Helmond');
  await page.waitForTimeout(150);
  const filteredCount = await page.locator('#reviewsPageList article').count();
  assert(filteredCount > 0, 'Zoekfilter op Helmond moet resultaten opleveren');

  await page.selectOption('#rv-filter-verified', 'verified');
  await page.waitForTimeout(180);
  const verifiedCount = await page.locator('#reviewsPageList article').count();
  assert(
    verifiedCount <= filteredCount,
    `Verified filter moet niet méér resultaten tonen (${verifiedCount} > ${filteredCount})`
  );

  await browser.close();
  console.log('REVIEWS_FILTERS_OK');
}

run().catch((err) => {
  console.error('REVIEWS_FILTERS_FAIL', err);
  process.exit(1);
});
