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
  await page.waitForTimeout(250);

  const state = await page.evaluate(() => {
    const pageEl = document.getElementById('page-reviews');
    const snapshot = document.getElementById('reviewsTrustSnapshot');
    const trust = document.getElementById('rv-trust-score');
    const verified = document.getElementById('rv-verified-share');
    const cta = snapshot ? snapshot.querySelector('button') : null;
    return {
      pageVisible: !!pageEl && getComputedStyle(pageEl).display !== 'none',
      snapshotHasContent: !!snapshot && (snapshot.textContent || '').includes('Trust Snapshot'),
      trustValue: trust ? trust.textContent.trim() : '',
      verifiedValue: verified ? verified.textContent.trim() : '',
      ctaText: cta ? cta.textContent.trim() : '',
    };
  });

  assert(state.pageVisible, 'Reviews pagina niet zichtbaar');
  assert(state.snapshotHasContent, 'Trust Snapshot ontbreekt op reviews pagina');
  assert(/\/100$/.test(state.trustValue), `Trust score formaat onjuist: ${state.trustValue}`);
  assert(/%$/.test(state.verifiedValue), `Verified share formaat onjuist: ${state.verifiedValue}`);
  assert(state.ctaText.includes('Bekijk Trust'), `Trust CTA ontbreekt: ${state.ctaText}`);

  await browser.close();
  console.log('REVIEWS_TRUST_SNAPSHOT_OK');
}

run().catch((err) => {
  console.error('REVIEWS_TRUST_SNAPSHOT_FAIL', err);
  process.exit(1);
});
