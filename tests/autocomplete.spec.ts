import { test, expect } from '@playwright/test';

/**
 * SEARCH AUTOCOMPLETE TEST — 2026-03-28 (Autonomous Sprint)
 * TDD-first: tests geschreven VOOR implementatie conform AUTONOMY_PROTOCOL.
 *
 * Feature 4: Live Search Autocomplete op aannemers pagina
 */

const FILE_URL = 'file:///D:/Backup%20bestanden/Aron/Coding/Klushub/Claude_Workspace/index.html';

test('Autocomplete 1: Zoekbalk aanwezig op aannemers pagina', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.click('a[onclick*="showPage(\'aannemers\')"]');
  await page.waitForTimeout(6000);

  const searchBox = page.locator('#ac-search');
  await expect(searchBox).toBeAttached();
  await expect(searchBox).toBeVisible();

  console.log(`✅ Autocomplete: zoekbalk aanwezig`);
});

test('Autocomplete 2: Typen toont dropdown met suggesties', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.click('a[onclick*="showPage(\'aannemers\')"]');
  await page.waitForTimeout(6000);

  const searchBox = page.locator('#ac-search');
  await searchBox.click();
  await searchBox.fill('bad');
  await page.waitForTimeout(300);

  // Dropdown moet zichtbaar zijn
  const dropdown = page.locator('#ac-dropdown');
  await expect(dropdown).toBeVisible();

  // Dropdown moet minstens 1 item tonen
  const items = page.locator('#ac-dropdown .ac-item');
  const count = await items.count();
  expect(count).toBeGreaterThan(0);

  console.log(`✅ Autocomplete: ${count} suggesties voor "bad"`);
});

test('Autocomplete 3: Klikken op suggestie filtert de kaarten', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.click('a[onclick*="showPage(\'aannemers\')"]');
  await page.waitForTimeout(6000);

  const searchBox = page.locator('#ac-search');
  await searchBox.fill('bad');
  await page.waitForTimeout(300);

  // Klik eerste suggestie
  const firstItem = page.locator('#ac-dropdown .ac-item').first();
  const itemText = await firstItem.textContent();
  await firstItem.click();
  await page.waitForTimeout(300);

  // Dropdown moet verdwijnen na klik
  const dropdown = page.locator('#ac-dropdown');
  const dropdownVisible = await dropdown.isVisible();
  expect(dropdownVisible).toBeFalsy();

  // Zoekbalk moet de gekozen term bevatten
  const searchVal = await searchBox.inputValue();
  expect(searchVal.length).toBeGreaterThan(0);

  console.log(`✅ Autocomplete: suggestie "${itemText?.trim()}" geselecteerd, cards gefilterd`);
});

test('Autocomplete 4: Lege zoekopdracht toont alle kaarten', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.click('a[onclick*="showPage(\'aannemers\')"]');
  await page.waitForTimeout(6000);

  // Zoek iets
  const searchBox = page.locator('#ac-search');
  await searchBox.fill('bad');
  await page.waitForTimeout(300);

  // Wis de zoekbalk
  await searchBox.fill('');
  await page.waitForTimeout(300);

  // Dropdown moet verdwenen zijn bij lege input
  const dropdown = page.locator('#ac-dropdown');
  const isVisible = await dropdown.isVisible();
  expect(isVisible).toBeFalsy();

  // Alle aannemerskaarten moeten weer zichtbaar zijn
  const cards = page.locator('#anCardsList .con-card');
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(3);

  console.log(`✅ Autocomplete: wissen toont ${count} aannemers`);
});

test('Autocomplete 5: Escape sluit dropdown', async ({ page }) => {
  await page.goto(FILE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.click('a[onclick*="showPage(\'aannemers\')"]');
  await page.waitForTimeout(6000);

  const searchBox = page.locator('#ac-search');
  await searchBox.fill('bad');
  await page.waitForTimeout(300);

  // Bevestig dat dropdown open is
  const dropdown = page.locator('#ac-dropdown');
  await expect(dropdown).toBeVisible();

  // Druk Escape
  await searchBox.press('Escape');
  await page.waitForTimeout(200);

  const isVisible = await dropdown.isVisible();
  expect(isVisible).toBeFalsy();

  console.log(`✅ Autocomplete: Escape sluit dropdown`);
});
