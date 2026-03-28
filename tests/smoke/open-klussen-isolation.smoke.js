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

  await page.addInitScript(() => {
    const jobs = [
      {
        id: 'job-1',
        type: 'Badkamer',
        omschrijving: 'Test klus voor load-pad',
        stad: 'Helmond',
        postcode: '5705CL',
        budget: 6500,
        deadline: '2026-12-31',
        status: 'open',
        aangemaakt: new Date().toISOString(),
        naam_klant: 'Test',
      },
    ];

    let publishInsertCount = 0;

    const resolveRows = (table, filters) => {
      if (table === 'klussen') {
        let rows = [...jobs];
        if (filters.status) rows = rows.filter((r) => r.status === filters.status);
        if (filters.beheer_token) rows = rows.filter((r) => r.beheer_token === filters.beheer_token);
        return rows;
      }
      return [];
    };

    const createBuilder = (table) => {
      const state = {
        table,
        op: 'select',
        columns: '*',
        filters: {},
        selectOptions: null,
        range: null,
        limit: null,
        single: false,
        payload: null,
        insertMode: false,
      };

      const execute = async () => {
        if ((state.op === 'insert' || state.insertMode) && table === 'klussen') {
          publishInsertCount += 1;
          if (publishInsertCount === 1) return new Promise(() => {});
          return { data: { id: `job-new-${publishInsertCount}` }, error: null };
        }
        if (state.op === 'update') return { data: [], error: null };
        if (state.op === 'select') {
          const rows = resolveRows(table, state.filters);
          if (state.selectOptions?.head && state.selectOptions?.count === 'exact') {
            return { count: rows.length, error: null };
          }
          let data = rows;
          if (state.range) data = data.slice(state.range.from, state.range.to + 1);
          if (typeof state.limit === 'number') data = data.slice(0, state.limit);
          if (state.single) {
            return {
              data: data.length ? data[0] : null,
              error: data.length ? null : { message: 'No rows' },
            };
          }
          return { data, error: null };
        }
        return { data: [], error: null };
      };

      const builder = {
        select(columns, options) {
          if (!state.insertMode) state.op = 'select';
          state.columns = columns;
          state.selectOptions = options || null;
          return builder;
        },
        insert(payload) {
          state.op = 'insert';
           state.insertMode = true;
          state.payload = payload;
          return builder;
        },
        update(payload) {
          state.op = 'update';
          state.payload = payload;
          return builder;
        },
        eq(key, value) {
          state.filters[key] = value;
          return builder;
        },
        lt() {
          return builder;
        },
        order() {
          return builder;
        },
        range(from, to) {
          state.range = { from, to };
          return builder;
        },
        limit(value) {
          state.limit = value;
          return builder;
        },
        in() {
          return builder;
        },
        single() {
          state.single = true;
          return builder;
        },
        then(onFulfilled, onRejected) {
          return execute().then(onFulfilled, onRejected);
        },
        catch(onRejected) {
          return execute().catch(onRejected);
        },
      };

      return builder;
    };

    const client = {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      },
      from(table) {
        return createBuilder(table);
      },
      rpc: async () => ({ data: null, error: null }),
    };

    window.__KLUSHUB_PUBLISH_TIMEOUT_MS = 300;
    window.__KLUSHUB_KLUSSEN_LOAD_TIMEOUT_MS = 1000;
    Object.defineProperty(window, 'supabase', {
      value: { createClient: () => client },
      configurable: false,
      writable: false,
    });
  });

  try {
    await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
    await page.fill('#hf-omschrijving', 'Test klus timeout flow');
    await page.fill('#hf-postcode', '1234 AB');
    await page.fill('#hf-email', 'tester@example.com');
    await page.fill('#hf-budget', '6500');
    await page.evaluate(() => window.doHeroSubmit());

    await page.waitForFunction(() => {
      const toast = document.getElementById('toast');
      return !!toast && toast.textContent.includes('Publiceren duurt te lang');
    }, null, { timeout: 5000 });

    await page.waitForFunction(() => {
      const btn = document.getElementById('hf-btn');
      return !!btn && btn.textContent.includes('Klus publiceren');
    }, null, { timeout: 5000 });

    await page.click(`a[onclick*="showPage('faq')"]`);
    await page.waitForFunction(() => document.getElementById('page-faq')?.classList.contains('active') === true);
    await page.click(`a[onclick*="showPage('klussen')"]`);

    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('#cardsList .klus-card');
      return cards.length > 0;
    }, null, { timeout: 6000 });

    const loadingStillVisible = await page.evaluate(() => {
      const list = document.getElementById('cardsList');
      return !!list && (list.textContent || '').includes('Klussen worden geladen...');
    });
    assert.strictEqual(loadingStillVisible, false, 'Loading state bleef hangen op open klussen');
    console.log('OPEN_KLUSSEN_ISOLATION_OK');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('OPEN_KLUSSEN_ISOLATION_FAIL', err);
  process.exit(1);
});
