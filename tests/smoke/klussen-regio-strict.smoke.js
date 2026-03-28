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

  const result = await page.evaluate(() => {
    allKlussen = [
      { id: 'a1', type: 'Badkamer', omschrijving: 'Amsterdam klus', stad: 'Amsterdam', budget: 1000, status: 'open', aangemaakt: new Date().toISOString() },
      { id: 'z1', type: 'Badkamer', omschrijving: 'Zoetermeer klus', stad: 'Zoetermeer', budget: 1000, status: 'open', aangemaakt: new Date().toISOString() },
      { id: 'u1', type: 'Badkamer', omschrijving: 'Onbekende stad', stad: 'Onbekendstad', budget: 1000, status: 'open', aangemaakt: new Date().toISOString() },
    ];
    filterState.lat = 52.3676;
    filterState.lng = 4.9041;
    filterState.radius = 7;
    applyFilters();
    return (filteredKlussen || []).map(k => k.id);
  });

  assert(result.includes('a1'), 'Amsterdam klus moet zichtbaar zijn binnen 7km');
  assert(!result.includes('z1'), 'Zoetermeer klus mag niet zichtbaar zijn bij Amsterdam 7km');
  assert(!result.includes('u1'), 'Klus zonder bruikbare locatie mag niet door regiofilter lekken');

  await browser.close();
  console.log('KLUSSEN_REGIO_STRICT_OK');
}

run().catch((err) => {
  console.error('KLUSSEN_REGIO_STRICT_FAIL', err);
  process.exit(1);
});
