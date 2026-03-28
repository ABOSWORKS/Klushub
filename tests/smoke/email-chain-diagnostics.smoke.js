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
  await page.waitForTimeout(120);

  const result = await page.evaluate(async () => {
    const originalFetch = window.fetch;
    const originalSb = window.sb;
    let callCount = 0;
    try {
      window.sb = {
        auth: {
          getSession: async () => ({ data: { session: null } }),
        },
      };
      window.fetch = async () => {
        callCount += 1;
        if (callCount === 1) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, statusText: 'Unauthorized' });
        }
        return new Response(JSON.stringify({ error: 'Bad gateway from provider' }), { status: 502, statusText: 'Bad Gateway' });
      };
      await triggerKlusEmailChain({
        klusId: 'smoke-klus',
        beheerToken: 'smoke-token',
        email: 'smoke@example.com',
        omschrijving: 'smoke',
      });
      return {
        callCount,
        chain: window.__KH_LAST_EMAIL_CHAIN || null,
      };
    } finally {
      window.fetch = originalFetch;
      window.sb = originalSb;
    }
  });

  assert.strictEqual(result.callCount, 3, `Expected 3 attempts (401 + fallback + retry), got ${result.callCount}`);
  assert(result.chain && result.chain.ok === false, 'Expected failed chain diagnostics object');
  assert(Array.isArray(result.chain.attempts), 'Expected attempts array in diagnostics');
  assert(result.chain.attempts.length >= 2, 'Expected at least 2 attempts in diagnostics');
  assert(result.chain.status === 502, `Expected final status 502, got ${result.chain.status}`);

  await browser.close();
  console.log('EMAIL_CHAIN_DIAGNOSTICS_OK');
}

run().catch((err) => {
  console.error('EMAIL_CHAIN_DIAGNOSTICS_FAIL', err);
  process.exit(1);
});
