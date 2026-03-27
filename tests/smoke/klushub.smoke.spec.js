const { test, expect } = require('@playwright/test');
const path = require('path');

function fileUrlForIndex() {
  const htmlPath = path.resolve(__dirname, '..', '..', 'index.html');
  return 'file:///' + htmlPath.replace(/\\/g, '/');
}

test.beforeEach(async ({ page }) => {
  await page.route('**/nominatim.openstreetmap.org/search**', async route => {
    const url = new URL(route.request().url());
    const postalcode = (url.searchParams.get('postalcode') || '').toUpperCase();
    const q = (url.searchParams.get('q') || '').toLowerCase();

    let body = [];
    if (postalcode === '5705CL') {
      body = [{
        lat: '51.4817',
        lon: '5.6611',
        display_name: 'Helmond, Noord-Brabant, Nederland',
        address: { city: 'Helmond' },
      }];
    } else if (q === 'amsterdam') {
      body = [{
        lat: '52.3676',
        lon: '4.9041',
        display_name: 'Amsterdam, Noord-Holland, Nederland',
        address: { city: 'Amsterdam' },
      }];
    } else {
      body = [{
        lat: '52.0907',
        lon: '5.1214',
        display_name: 'Utrecht, Utrecht, Nederland',
        address: { city: 'Utrecht' },
      }];
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });

  await page.goto(fileUrlForIndex());
  await page.waitForLoadState('domcontentloaded');
});

test('aannemer kan profiel bewerken modal openen', async ({ page }) => {
  await page.evaluate(() => {
    window.currentUser = {
      id: 'mock-aannemer-id',
      auth_id: 'mock-auth-id',
      voornaam: 'Test',
      achternaam: 'Aannemer',
      email: 'test@example.com',
    };
    updateNavAuth();
  });

  await page.click('#nav-loggedin');
  await page.click('button:has-text("Profiel bewerken")');
  await expect(page.locator('#profileOverlay')).toHaveClass(/open/);
});

test('aannemers pagina toont geen laadfout in demo flow en regio filter blijft bruikbaar', async ({ page }) => {
  await page.evaluate(() => showPage('aannemers'));
  await expect(page.locator('#page-aannemers')).toHaveClass(/active/);

  await page.fill('#an-regio-input', 'Amsterdam');
  await page.waitForTimeout(900);
  const statusText = await page.locator('#an-regio-status').innerText();
  expect(statusText.toLowerCase()).toContain('amsterdam');

  await page.fill('#an-regio-input', 'x');
  await page.waitForTimeout(900);
  const radiusWrap = page.locator('#an-radius-wrap');
  await expect(radiusWrap).toBeHidden();
});

test('openstaande klussen regio filter sluit verre steden uit voor 5705CL', async ({ page }) => {
  await page.evaluate(() => {
    showPage('klussen');
    switchP('klussen');
    renderDemoKlussen();
  });

  await page.fill('#regio-postcode', '5705Cl');
  await page.waitForTimeout(1000);
  await page.evaluate(() => onRegioPcInput());
  await page.waitForTimeout(1000);

  const result = await page.evaluate(() => {
    const lijst = window.filteredKlussen || [];
    return {
      count: lijst.length,
      hasFarCities: lijst.some(k => ['Amsterdam', 'Utrecht'].includes(k.stad)),
    };
  });

  expect(result.count).toBeGreaterThan(0);
  expect(result.hasFarCities).toBeFalsy();
});

test('full postcode vult full stad automatisch in', async ({ page }) => {
  await page.evaluate(() => {
    showPage('klussen');
    switchP('plaatsen');
  });

  await page.fill('#full-postcode', '5705CL');
  await page.waitForTimeout(1200);
  await page.locator('#full-postcode').blur();
  await page.waitForTimeout(700);

  await expect(page.locator('#full-postcode')).toHaveValue('5705 CL');
  await expect(page.locator('#full-stad')).toHaveValue('Helmond');
});

test('openstaande klussen valt terug naar content bij timeout', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const originalSb = sb;
    try {
      window.__KLUSHUB_KLUSSEN_LOAD_TIMEOUT_MS = 200;
      resetFilters();
      allKlussen = [];
      filteredKlussen = [];
      klussensOffset = 0;
      sb = {
        from: () => ({
          update: () => ({
            eq: () => ({
              lt: () => Promise.resolve({}),
            }),
          }),
          select: () => ({
            eq: () => ({
              order: () => ({
                range: () => new Promise(() => {}),
              }),
            }),
          }),
        }),
      };
      await loadKlussen(true);
      const cardsList = document.getElementById('cardsList');
      const loadMoreWrap = document.getElementById('loadMoreWrap');
      return {
        ok: true,
        loading: cardsList ? /Klussen worden geladen/i.test(cardsList.textContent) : true,
        hasContent: cardsList ? cardsList.textContent.trim().length > 20 : false,
        loadMoreVisible: !!loadMoreWrap && getComputedStyle(loadMoreWrap).display !== 'none',
      };
    } catch (e) {
      return { ok: false, err: String(e) };
    } finally {
      sb = originalSb;
      window.__KLUSHUB_KLUSSEN_LOAD_TIMEOUT_MS = 0;
    }
  });

  expect(result.ok).toBeTruthy();
  expect(result.loading).toBeFalsy();
  expect(result.hasContent).toBeTruthy();
  expect(result.loadMoreVisible).toBeFalsy();
});
