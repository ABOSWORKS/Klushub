const { chromium } = require('playwright');
const path = require('path');

function fileUrlForIndex() {
  const htmlPath = path.resolve(__dirname, '..', '..', 'index.html');
  return 'file:///' + htmlPath.replace(/\\/g, '/');
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(String(e)));

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

  const profileResult = await page.evaluate(() => {
    try {
      currentUser = {
        id: 'mock-aannemer-id',
        auth_id: 'mock-auth-id',
        voornaam: 'Test',
        achternaam: 'Aannemer',
        email: 'test@example.com',
      };
      updateNavAuth();
      openEditProfile();
      const overlay = document.getElementById('profileOverlay');
      return {
        ok: true,
        hasOverlay: !!overlay,
        open: !!overlay && overlay.classList.contains('open'),
      };
    } catch (e) {
      return { ok: false, err: String(e) };
    }
  });
  assert(profileResult.ok, `Profiel flow crashed: ${profileResult.err || 'unknown'}`);
  assert(profileResult.hasOverlay, 'Profiel overlay element ontbreekt');
  assert(profileResult.open, 'Profiel bewerken modal opent niet');
  await page.evaluate(() => closeEditProfile());

  await page.evaluate(() => showPage('aannemers'));
  await page.fill('#an-regio-input', 'Amsterdam');
  await page.waitForTimeout(900);
  const anStatus = (await page.locator('#an-regio-status').innerText()).toLowerCase();
  assert(!anStatus.includes('niet gevonden'), 'Aannemer regio lookup faalt voor Amsterdam');

  await page.fill('#an-regio-input', 'x');
  await page.waitForTimeout(900);
  const radiusVisible = await page.locator('#an-radius-wrap').isVisible();
  assert(!radiusVisible, 'Aannemer regio radius blijft zichtbaar na ongeldige regio input');

  await page.evaluate(() => {
    showPage('klussen');
    switchP('klussen');
    renderDemoKlussen();
    document.getElementById('regio-postcode').value = '5705Cl';
    onRegioPcInput();
  });
  await page.waitForTimeout(1600);
  const hasFarCities = await page.evaluate(() =>
    (window.filteredKlussen || []).some(k => ['Amsterdam', 'Utrecht'].includes(k.stad))
  );
  assert(!hasFarCities, 'Klus regiofilter laat verre steden door bij 5705CL');

  await page.evaluate(() => {
    showPage('klussen');
    switchP('plaatsen');
  });
  await page.fill('#full-postcode', '5705CL');
  await page.waitForTimeout(1200);
  await page.locator('#full-postcode').blur();
  await page.waitForTimeout(700);

  const normalizedPostcode = await page.locator('#full-postcode').inputValue();
  const fullStad = await page.locator('#full-stad').inputValue();
  assert(normalizedPostcode === '5705 CL', `Postcode normalisatie mislukt: ${normalizedPostcode}`);
  assert(fullStad.trim() === 'Helmond', `Postcode->stad autofill mislukt: ${fullStad}`);

  assert(pageErrors.length === 0, `Onverwachte page errors: ${pageErrors.join(' | ')}`);

  await browser.close();
  console.log('SMOKE_OK');
}

run().catch(err => {
  console.error('SMOKE_FAIL:', err.message || String(err));
  process.exit(1);
});
