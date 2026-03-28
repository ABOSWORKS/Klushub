const path = require('path');
const { chromium } = require('playwright');

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

  try {
    await page.goto(fileUrlForIndex(), { waitUntil: 'domcontentloaded' });

    const result = await page.evaluate(async () => {
      const mockKlus = {
        id: 'klus-1',
        beheer_token: 'tok-1',
        omschrijving: 'Badkamer renovatie test',
        status: 'open',
        stad: 'Helmond',
        postcode: '5705CL',
        budget: 7500,
        aanbiedingen_data: [
          {
            id: 'a-1',
            status: 'in_behandeling',
            prijs: 6900,
            doorlooptijd: '12 werkdagen',
            bericht: 'Strakke planning en heldere communicatie.',
            bedrijfsnaam: 'Helmond Bouwgroep',
            voornaam: 'Jan',
            achternaam: 'Jansen',
            aannemer_stad: 'Helmond',
            specialisme: 'Badkamer',
          },
          {
            id: 'a-2',
            status: 'in_behandeling',
            prijs: 6200,
            doorlooptijd: '20 werkdagen',
            bericht: 'Scherpe prijs, planning in overleg.',
            bedrijfsnaam: 'Budget Klusteam',
            voornaam: 'Piet',
            achternaam: 'Pieters',
            aannemer_stad: 'Eindhoven',
            specialisme: 'Badkamer',
          },
          {
            id: 'a-3',
            status: 'in_behandeling',
            prijs: 7800,
            doorlooptijd: '8 werkdagen',
            bericht: 'Snel leverbaar en vaste projectleider.',
            bedrijfsnaam: 'Premium Renovatie',
            voornaam: 'Klaas',
            achternaam: 'de Vries',
            aannemer_stad: 'Utrecht',
            specialisme: 'Badkamer',
          },
        ],
      };

      sb = {
        rpc: async (fnName, payload) => {
          if (fnName === 'get_klus_beheer') {
            return { data: mockKlus, error: null };
          }
          return { data: null, error: null };
        },
      };

      const ok = await openKlantBeheer('klus-1', 'tok-1');
      const body = document.getElementById('kb-body');
      const text = (body?.textContent || '').replace(/\s+/g, ' ').trim();
      const badgeCount = body ? body.querySelectorAll('[data-best-balance="true"]').length : 0;

      return {
        ok,
        hasVergelijkerHeader: text.includes('Aanbieding Vergelijker'),
        hasBesteBalansLabel: text.includes('Beste balans'),
        hasPrijsRange: text.includes('Prijsrange'),
        badgeCount,
      };
    });

    assert(result.ok === true, 'openKlantBeheer kon niet openen');
    assert(result.hasVergelijkerHeader, 'Vergelijker header ontbreekt');
    assert(result.hasBesteBalansLabel, 'Beste balans label ontbreekt');
    assert(result.hasPrijsRange, 'Prijsrange ontbreekt');
    assert(result.badgeCount >= 1, 'Geen aanbieding gemarkeerd als beste balans');

    console.log('BEHEER_VERGELIJKER_OK');
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('BEHEER_VERGELIJKER_FAIL:', err.message || String(err));
  process.exit(1);
});

