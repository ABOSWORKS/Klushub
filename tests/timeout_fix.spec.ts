import { test, expect } from '@playwright/test';

/**
 * TIMEOUT FIX TEST — 2026-03-28
 * Verifieert dat de site NIET vastloopt als Supabase traag of onbereikbaar is.
 *
 * Root cause van site-brede failures:
 * 1. loadStats() — 3 queries zonder timeout, awaited in init-chain → blokkeert alles
 * 2. archiveerVerlopenKlussen() — awaited in loadKlussen() → _loadingKlussen stuck op true
 * 3. loadKlussen() op DB fout → toast maar spinner blijft staan
 *
 * Deze test simuleert een hangende Supabase client en verifieert dat
 * de app alsnog binnen 20 seconden bruikbaar is (demo data getoond).
 */

const FILE_URL = 'file:///D:/Backup%20bestanden/Aron/Coding/Klushub/Claude_Workspace/index.html';

test('Critical: site laadt demo data als Supabase hangt (timeout test)', async ({ page }) => {
  test.setTimeout(50000);

  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  // Inject VOOR page scripts: mock Supabase die nooit resolvet
  await page.addInitScript(() => {
    // Lucide stub — icons worden gesimuleerd
    window.lucide = { createIcons: () => {} };

    // Supabase stub — alle DB queries hangen (nooit resolven)
    window.supabase = {
      createClient: function(url, _key) {
        // Maak een query-object dat op alle methodes `this` teruggeeft (fluent chain)
        // maar bij await (`.then`) nooit resolvet
        var hang = function() { return new Promise(function() {}); }; // Eeuwig wachten

        function makeQuery() {
          var q = {
            then: hang,
            catch: function() { return this; },
            finally: function() { return this; },
          };
          var chainMethods = [
            'select','insert','update','delete','upsert',
            'eq','neq','lt','lte','gte','gt',
            'order','range','single','limit','in','not','or','filter',
            'contains','containedBy','overlaps','match','head',
          ];
          chainMethods.forEach(function(m) { q[m] = function() { return makeQuery(); }; });
          return q;
        }

        return {
          from: function(_table) { return makeQuery(); },
          auth: {
            // getSession resolvet direct (leeg) — anders hangt initAuth ook
            getSession: function() { return Promise.resolve({ data: { session: null }, error: null }); },
            onAuthStateChange: function(_cb) {
              return { data: { subscription: { unsubscribe: function() {} } } };
            },
          },
        };
      },
    };
  });

  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');

  // Wacht op: 8s waitForLibraries + 4s loadStats timeout = 12s + 2s buffer
  console.log('⏳ Wachten op init + loadStats timeout...');
  await page.waitForTimeout(14000);

  // ── KLUSSEN TAB ────────────────────────────────
  console.log('🔍 Klussen tab testen...');
  await page.evaluate(() => {
    (window as any).showPage('klussen');
    (window as any).switchP('klussen');
  });

  // loadKlussen heeft 6s timeout na de fix → wacht 8s
  await page.waitForTimeout(8000);

  const klussenHTML = await page.locator('#cardsList').innerHTML();
  expect(klussenHTML).not.toContain('Klussen worden geladen');

  const klusCards = page.locator('.klus-card');
  const klusCount = await klusCards.count();
  expect(klusCount).toBeGreaterThan(0);
  console.log(`✅ Klussen: ${klusCount} demo kaarten na Supabase timeout`);

  // ── FAQ TAB ─────────────────────────────────────
  console.log('🔍 FAQ tab testen...');
  await page.evaluate(() => (window as any).showPage('faq'));
  await page.waitForTimeout(500);

  const faqPage = page.locator('#page-faq');
  await expect(faqPage).toHaveClass(/active/);
  const faqSection = page.locator('.faq-section.active');
  await expect(faqSection).toBeVisible();
  console.log('✅ FAQ: zichtbaar en actief');

  // ── AANNEMERS TAB ───────────────────────────────
  console.log('🔍 Aannemers tab testen...');
  await page.evaluate(() => (window as any).showPage('aannemers'));
  await page.waitForTimeout(10000); // loadAannemers heeft 8s timeout

  const anCards = page.locator('.con-card');
  const anCount = await anCards.count();
  expect(anCount).toBeGreaterThan(0);
  console.log(`✅ Aannemers: ${anCount} demo kaarten na Supabase timeout`);

  // ── GEEN FATALE JS ERRORS ───────────────────────
  const fatalErrors = errors.filter(e =>
    !e.includes('net::ERR') && // netwerk errors zijn verwacht (CDN niet beschikbaar)
    !e.includes('Failed to fetch') &&
    !e.includes('Load failed')
  );
  expect(fatalErrors.length).toBe(0);
  if (fatalErrors.length > 0) console.error('JS Errors:', fatalErrors);

  console.log('✅ Timeout test geslaagd — site werkt ook zonder Supabase');
});
