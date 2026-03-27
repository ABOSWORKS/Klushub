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
      await new Promise(resolve => setTimeout(resolve, 250));
    } else if (q === 'rotterdam') {
      body = [{
        lat: '51.9244',
        lon: '4.4777',
        display_name: 'Rotterdam, Zuid-Holland, Nederland',
        address: { city: 'Rotterdam' },
      }];
      await new Promise(resolve => setTimeout(resolve, 10));
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

  const faqResult = await page.evaluate(() => {
    try {
      showPage('faq');
      const faqPage = document.getElementById('page-faq');
      const visible = !!faqPage && getComputedStyle(faqPage).display !== 'none';
      const hasContent = !!faqPage && faqPage.textContent.trim().length > 100;
      return { ok: true, visible, hasContent };
    } catch (e) {
      return { ok: false, err: String(e) };
    }
  });
  assert(faqResult.ok, `FAQ flow crashed: ${faqResult.err || 'unknown'}`);
  assert(faqResult.visible, 'FAQ pagina is niet zichtbaar');
  assert(faqResult.hasContent, 'FAQ pagina lijkt leeg/wit');

  const bevestigingResult = await page.evaluate(async () => {
    try {
      showKlusBevestiging('smoke-klus-id', 'smoke-token', 'Test klus');
      const overlay = document.getElementById('bevestigingOverlay');
      const openState = {
        hasOverlay: !!overlay,
        hasOpenClass: !!overlay && overlay.classList.contains('open'),
        ariaHidden: overlay ? overlay.getAttribute('aria-hidden') : null,
        display: overlay ? overlay.style.display : null,
      };
      closeBevestiging();
      await new Promise(resolve => setTimeout(resolve, 280));
      const closedState = {
        hasOpenClass: !!overlay && overlay.classList.contains('open'),
        ariaHidden: overlay ? overlay.getAttribute('aria-hidden') : null,
        display: overlay ? overlay.style.display : null,
      };
      return { ok: true, openState, closedState };
    } catch (e) {
      return { ok: false, err: String(e) };
    }
  });
  assert(bevestigingResult.ok, `Bevestiging flow crashed: ${bevestigingResult.err || 'unknown'}`);
  assert(bevestigingResult.openState.hasOverlay, 'Bevestiging overlay element ontbreekt');
  assert(bevestigingResult.openState.hasOpenClass, 'Bevestiging overlay opent niet');
  assert(bevestigingResult.openState.ariaHidden === 'false', 'Bevestiging overlay aria-hidden opent niet correct');
  assert(bevestigingResult.openState.display === 'flex', `Bevestiging overlay display open mismatch: ${bevestigingResult.openState.display}`);
  assert(!bevestigingResult.closedState.hasOpenClass, 'Bevestiging overlay sluit niet');
  assert(bevestigingResult.closedState.ariaHidden === 'true', 'Bevestiging overlay aria-hidden sluit niet correct');
  assert(bevestigingResult.closedState.display === 'none', `Bevestiging overlay display close mismatch: ${bevestigingResult.closedState.display}`);

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

  await page.fill('#an-regio-input', 'Amsterdam');
  await page.waitForTimeout(60);
  await page.fill('#an-regio-input', 'Rotterdam');
  await page.waitForTimeout(1200);
  const raceStatus = (await page.locator('#an-regio-status').innerText()).toLowerCase();
  assert(raceStatus.includes('rotterdam'), `Aannemer regio race-condition: laatste input niet actief (${raceStatus})`);

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
  await page.fill('#full-postcode', '12');
  await page.locator('#full-postcode').blur();
  await page.waitForTimeout(700);
  const fullStadAfterInvalid = await page.locator('#full-stad').inputValue();
  assert(fullStadAfterInvalid.trim() === '', `Stad blijft stale na ongeldige postcode: ${fullStadAfterInvalid}`);

  assert(pageErrors.length === 0, `Onverwachte page errors: ${pageErrors.join(' | ')}`);

  await browser.close();
  console.log('SMOKE_OK');
}

run().catch(err => {
  console.error('SMOKE_FAIL:', err.message || String(err));
  process.exit(1);
});
