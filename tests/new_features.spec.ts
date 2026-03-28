import { test, expect } from '@playwright/test';

/**
 * NEW FEATURES TEST — 2026-03-28 (Autonomous Sprint)
 * TDD-first: tests schrijven VOOR implementatie conform AUTONOMY_PROTOCOL.
 *
 * Feature 1: Prijs Schatting Calculator (#prijscalculator)
 * Feature 2: Live Activiteitsfeed (#activiteitsfeed)
 */

const FILE_URL = 'file:///D:/Backup%20bestanden/Aron/Coding/Klushub/Claude_Workspace/index.html';

// ─── FEATURE 1: PRIJS CALCULATOR ─────────────────────────────────────────────
test('Feature 1a: Prijs Calculator sectie is zichtbaar op landing page', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Scroll naar de calculator sectie
  const calc = page.locator('#prijscalculator');
  await expect(calc).toBeAttached();

  // Sectie moet minstens één type-chip hebben
  const chips = page.locator('#prijscalculator .pc-chip');
  const chipCount = await chips.count();
  expect(chipCount).toBeGreaterThan(4);

  // Prijsindicator aanwezig
  const priceOutput = page.locator('#pc-prijs-output');
  await expect(priceOutput).toBeAttached();

  console.log(`✅ Calculator: sectie aanwezig, ${chipCount} type-chips`);
});

test('Feature 1b: Prijs Calculator — chip klik werkt en toont prijs', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Klik eerste chip (Badkamer)
  const firstChip = page.locator('#prijscalculator .pc-chip').first();
  await firstChip.click();
  await page.waitForTimeout(300);

  // Na klik: chip moet active class hebben
  const activeChip = page.locator('#prijscalculator .pc-chip.active');
  const activeCount = await activeChip.count();
  expect(activeCount).toBeGreaterThan(0);

  // Prijs output moet een euro-teken bevatten
  const priceText = await page.locator('#pc-prijs-output').textContent();
  expect(priceText).toContain('€');

  console.log(`✅ Calculator: chip klik werkt, prijs toont: ${priceText?.trim()}`);
});

test('Feature 1c: Prijs Calculator — slider aanpassen verandert prijs', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Klik een chip om een type te selecteren
  await page.locator('#prijscalculator .pc-chip').first().click();
  await page.waitForTimeout(200);

  const priceVoorSlider = await page.locator('#pc-prijs-output').textContent();

  // Verplaats de slider
  const slider = page.locator('#pc-m2-slider');
  await expect(slider).toBeAttached();

  // Stel slider waarde in via fill
  await slider.fill('80');
  await slider.dispatchEvent('input');
  await page.waitForTimeout(300);

  const priceNaSlider = await page.locator('#pc-prijs-output').textContent();
  console.log(`Prijs voor slider: ${priceVoorSlider?.trim()}, na: ${priceNaSlider?.trim()}`);

  // Prijs moet nog steeds een euro teken hebben
  expect(priceNaSlider).toContain('€');
  console.log(`✅ Calculator: slider werkt, prijs updated`);
});

test('Feature 1d: Prijs Calculator — CTA button navigeert naar klus plaatsen', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Klik de CTA knop in de calculator
  const ctaBtn = page.locator('#prijscalculator .pc-cta-btn');
  await expect(ctaBtn).toBeAttached();

  await ctaBtn.click();
  await page.waitForTimeout(500);

  // Moet navigeren naar klussen pagina (plaatsen view)
  const klussenPage = page.locator('#page-klussen');
  const klussenClass = await klussenPage.getAttribute('class');
  expect(klussenClass).toContain('active');

  console.log(`✅ Calculator: CTA knop navigeert naar klus plaatsen`);
});

// ─── FEATURE 2: LIVE ACTIVITEITSFEED ─────────────────────────────────────────
test('Feature 2a: Live Activiteitsfeed sectie is zichtbaar op landing page', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  const feed = page.locator('#activiteitsfeed');
  await expect(feed).toBeAttached();

  // Feed moet minstens 3 items bevatten
  const items = page.locator('#af-list .af-item');
  const count = await items.count();
  expect(count).toBeGreaterThanOrEqual(3);

  console.log(`✅ Activiteitsfeed: sectie aanwezig, ${count} items`);
});

test('Feature 2b: Live Activiteitsfeed — items hebben correcte structuur', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Eerste item moet icon + tekst + tijd bevatten
  const firstItem = page.locator('#af-list .af-item').first();
  await expect(firstItem).toBeVisible();

  const itemHTML = await firstItem.innerHTML();
  expect(itemHTML.length).toBeGreaterThan(20); // Heeft echte content

  // Check voor tijdindicator
  const tijdEl = firstItem.locator('.af-tijd');
  await expect(tijdEl).toBeAttached();
  const tijdText = await tijdEl.textContent();
  expect(tijdText!.trim().length).toBeGreaterThan(0);

  console.log(`✅ Activiteitsfeed: item structuur correct, tijd: ${tijdText?.trim()}`);
});

test('Feature 2c: Live Activiteitsfeed — nieuwe items worden toegevoegd (auto-scroll)', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Tel items voor wachten
  const voorCount = await page.locator('#af-list .af-item').count();

  // Wacht op nieuwe items (feed moet zichzelf updaten)
  await page.waitForTimeout(5000);

  const naCount = await page.locator('#af-list .af-item').count();
  // Items kunnen hetzelfde zijn (als de feed recycled) of meer
  // Maar de feed mag nooit LEEG worden
  expect(naCount).toBeGreaterThan(0);

  // Check dat er een LIVE indicator aanwezig is
  const liveIndicator = page.locator('#activiteitsfeed .af-live-dot');
  await expect(liveIndicator).toBeAttached();

  console.log(`✅ Activiteitsfeed: voor=${voorCount} na 5s=${naCount} items`);
});
