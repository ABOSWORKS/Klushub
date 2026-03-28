import { test, expect } from '@playwright/test';
import * as path from 'path';

const FILE_URL =
  'file:///' +
  path
    .resolve('D:/Backup bestanden/Aron/Coding/Klushub/Update 20 maart/Output/index.html')
    .replace(/\\/g, '/');

test.describe('Open klussen isolation regressie', () => {
  test.beforeEach(async ({ page }) => {
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

      const resolveRows = (table: string, filters: Record<string, unknown>) => {
        if (table === 'klussen') {
          let rows = [...jobs];
          if (filters.status) rows = rows.filter((r) => r.status === filters.status);
          if (filters.beheer_token) rows = rows.filter((r) => r.beheer_token === filters.beheer_token);
          return rows;
        }
        return [];
      };

      const createBuilder = (table: string) => {
        const state: any = {
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
            if (publishInsertCount === 1) {
              return new Promise(() => {});
            }
            return {
              data: { id: `job-new-${publishInsertCount}` },
              error: null,
            };
          }

          if (state.op === 'update') {
            return { data: [], error: null };
          }

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

        const builder: any = {
          select(columns: string, options?: Record<string, unknown>) {
            if (!state.insertMode) state.op = 'select';
            state.columns = columns;
            state.selectOptions = options || null;
            return builder;
          },
          insert(payload: unknown) {
            state.op = 'insert';
            state.insertMode = true;
            state.payload = payload;
            return builder;
          },
          update(payload: unknown) {
            state.op = 'update';
            state.payload = payload;
            return builder;
          },
          eq(key: string, value: unknown) {
            state.filters[key] = value;
            return builder;
          },
          lt() {
            return builder;
          },
          order() {
            return builder;
          },
          range(from: number, to: number) {
            state.range = { from, to };
            return builder;
          },
          limit(value: number) {
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
          then(onFulfilled: any, onRejected: any) {
            return execute().then(onFulfilled, onRejected);
          },
          catch(onRejected: any) {
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
        from(table: string) {
          return createBuilder(table);
        },
        rpc: async () => ({ data: null, error: null }),
      };

      (window as any).__KLUSHUB_PUBLISH_TIMEOUT_MS = 300;
      (window as any).__KLUSHUB_KLUSSEN_LOAD_TIMEOUT_MS = 1000;
      Object.defineProperty(window, 'supabase', {
        value: { createClient: () => client },
        configurable: false,
        writable: false,
      });
    });
  });

  test('open klussen blijft laden na publish-timeout en tab-wissel', async ({ page }) => {
    await page.goto(FILE_URL);
    await page.waitForLoadState('domcontentloaded');

    await page.fill('#hf-omschrijving', 'Test klus timeout flow');
    await page.fill('#hf-postcode', '1234 AB');
    await page.fill('#hf-email', 'tester@example.com');
    await page.fill('#hf-budget', '6500');
    await page.evaluate(() => (window as any).doHeroSubmit());

    await expect(page.locator('#toast')).toContainText('Publiceren duurt te lang', {
      timeout: 4000,
    });
    await expect(page.locator('#hf-btn')).toContainText('Klus publiceren', {
      timeout: 4000,
    });

    await page.click(`a[onclick*="showPage('faq')"]`);
    await expect(page.locator('#page-faq')).toHaveClass(/active/);

    await page.click(`a[onclick*="showPage('klussen')"]`);
    await expect(page.locator('#page-klussen')).toHaveClass(/active/);

    await expect(page.locator('#cardsList .klus-card').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#cardsList')).not.toContainText('Klussen worden geladen...');
  });
});
