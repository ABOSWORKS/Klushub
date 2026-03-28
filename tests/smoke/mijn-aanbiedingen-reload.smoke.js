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

  const result = await page.evaluate(async () => {
    const originalSb = sb;
    const originalCurrentUser = currentUser;
    let aanbiedingenCallCount = 0;
    try {
      currentUser = { id: 'aannemer-1' };
      sb = {
        from(table) {
          const state = { table, filters: {}, orderCol: null };
          const exec = async () => {
            if (state.table === 'aanbiedingen') {
              aanbiedingenCallCount += 1;
              if (aanbiedingenCallCount === 1) {
                return new Promise(() => {});
              }
              return {
                data: [
                  {
                    id: 'aanb-1',
                    klus_id: 'klus-1',
                    status: 'in_behandeling',
                    prijs: 4500,
                    doorlooptijd: '10 werkdagen',
                    bericht: 'test',
                    aangemaakt: new Date().toISOString(),
                  },
                ],
                error: null,
              };
            }
            if (state.table === 'klussen') {
              return {
                data: [
                  {
                    id: 'klus-1',
                    status: 'open',
                    deadline: '2026-12-31',
                    budget: 5000,
                    omschrijving: 'Test klus',
                    stad: 'Helmond',
                    postcode: '5705 CL',
                  },
                ],
                error: null,
              };
            }
            return { data: [], error: null };
          };
          const builder = {
            select() { return builder; },
            eq(key, value) { state.filters[key] = value; return builder; },
            order(col) { state.orderCol = col; return builder; },
            in() { return builder; },
            then(onFulfilled, onRejected) { return exec().then(onFulfilled, onRejected); },
            catch(onRejected) { return exec().catch(onRejected); },
          };
          return builder;
        },
      };

      void loadMijnKlussen();
      await new Promise(resolve => setTimeout(resolve, 120));
      await loadMijnKlussen({ force: true });

      const subtitle = document.getElementById('mkp-subtitle')?.textContent || '';
      const bodyText = document.getElementById('mkp-body')?.textContent || '';
      return { aanbiedingenCallCount, subtitle, bodyText };
    } finally {
      sb = originalSb;
      currentUser = originalCurrentUser;
    }
  });

  assert(result.aanbiedingenCallCount >= 2, `Expected forced second load, got ${result.aanbiedingenCallCount} calls`);
  assert(/1 aanbieding/i.test(result.subtitle), `Expected subtitle with 1 aanbieding, got "${result.subtitle}"`);
  assert(!/Laden/i.test(result.bodyText), 'Expected no stuck loading text in mijn aanbiedingen body');

  await browser.close();
  console.log('MIJN_AANBIEDINGEN_RELOAD_OK');
}

run().catch((err) => {
  console.error('MIJN_AANBIEDINGEN_RELOAD_FAIL', err);
  process.exit(1);
});
