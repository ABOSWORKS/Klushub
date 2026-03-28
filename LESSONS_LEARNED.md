# LESSONS LEARNED — Klushub Claude Sprint Log

> Gelezen aan het begin van elke sessie. Bijgewerkt aan het eind van elke sprint-turn.

---

## AUTONOMY PROTOCOL (actief vanaf 2026-03-28)

1. **TDD First** — Geen productie-code wijzigen zonder eerst een Playwright test te schrijven die de feature verifieert. Fix is pas "done" als test groen is.
2. **Journaling** — Dit bestand bijwerken na elke significante sessie.
3. **Semantic HTML** — `<nav>`, `<section>`, `<article>` waar van toepassing. Eén `<h1>` per pagina.
4. **Error handling** — Elke Supabase query en DOM selector gewrapt in try/catch of null-check. Fouten duidelijk in console loggen.

---

## Sprint Log

### 2026-03-28 — Patch 2: Site-brede loading failures gefixed

#### Wat opgelost

**Root cause van "de hele site werkt niet":**
- `loadStats()` werd `await`-ed in de async init-chain zonder timeout of try/catch
- Elke trage/hangende Supabase query (SELECT COUNT op klussen/aannemers) blokkeerde de **gehele** initialisatie
- Gevolg: `initReveal()`, `updateNavAuth()`, `lucide.createIcons()` nooit uitgevoerd → icons blank, nav broken, alle tabs broken

**Tweede root cause:**
- `archiveerVerlopenKlussen()` was `await`-ed in `loadKlussen()` — UPDATE query zonder timeout
- Als deze hing: `_loadingKlussen = true` voor altijd → klussen spinner nooit opgelost

**Fixes:**
- `loadStats()`: `Promise.race([Promise.all([...queries]), 4s_timeout])` + try/catch → demo stats als fallback
- `loadKlussen()`: archiveer is nu fire-and-forget (`.catch`), 6s timeout op hoofdquery, `renderDemoKlussen()` fallback bij elke fout
- `initAuth()`: 5s timeout op `getSession()` zodat trage auth het init niet blokkeert

**TDD:**
- `tests/timeout_fix.spec.ts`: Playwright test met mock Supabase die nooit resolvet
- Test verifieert: klussen (31 demo), FAQ, aannemers (9 demo) laden binnen timeout
- 7/7 tests groen

**Kritieke les (nooit vergeten):**
- TypeScript type annotations (`as any`, `: string`, `(e as Error)`) zijn NIET geldig in `<script>` HTML blocks
- Dit veroorzaakte een SyntaxError die het HELE script block brak
- Fix: gebruik gewone JS. `e.message` ipv `(e as Error).message`

#### Volgende logische actie

1. GitHub Pages deploy checken (push is gedaan naar `claude/klushub-platform`)
2. Live site testen: navigeer naar alle tabs, check dat de spinners oplossen
3. Score toevoegen aan Gemini Regulator Leaderboard.md

---

### 2026-03-28 — Come-back sprint (achterstand 2-8 vs Codex)

#### Wat opgelost

**Fixes:**
- `openFaqSection()` had een silent fail als section-ID niet bestond → fallback naar `#faq-stappenplan` toegevoegd
- `loadAannemers()` gebruikte nested `.select('*, reviews(...)')` → opgesplist in twee aparte queries; als reviews 400-error geeft val terug naar volledige demo data
- `onAnRegioInput()` had geen race-condition guard → `anGeoSeq` counter toegevoegd
- Trust Badges toonden nooit voor echte Supabase aannemers (avg=0 want reviews falen) → badge nu ook op basis van `abonnement === 'pro'`
- Portfolio grid hing aan hardcoded `d1-d6` demo-IDs → `getPortfolioBySpecialisme()` fallback toegevoegd die op specialisme-string matcht

**Nieuwe features:**
- Trust Badge systeem (Top Aannemer / Veel Ervaring / Pro Aannemer)
- Smart Job Match % badge op klus-kaarten (op basis van actieve filters)
- Klus Status Tracker — 5-staps voortgangsbalk op bevestigingsscherm
- Foto Portfolio grid in aannemer profiel modal (met lightbox)
- Animated stats counter op landing (easeOutExpo via rAF)
- Beschikbaarheidsstatus in aannemer profiel footer

#### Waarom deze keuzes

- **Aparte reviews query**: nested Supabase select faalt bij ontbrekende foreign key of RLS-policy op de reviews tabel. Twee losse queries zijn robuuster en geven individuele error handling.
- **Specialisme-gebaseerde portfolio**: UUID aannemers uit Supabase hebben nooit een `d1`-`d6` ID. Matching op specialisme-string werkt universeel en schaalt naar echte data.
- **Abonnement-badge als fallback**: reviews zijn leeg in de DB (400-error op reviews tabel). Abonnement is wél beschikbaar in de aannemers tabel. Zo tonen Pro-aannemers altijd een badge.

#### Bekende openstaande issues

- Supabase `reviews` tabel geeft 400 (waarschijnlijk RLS policy blokkeert publieke reads). Zodra dit gefixt is in Supabase dashboard werken score-gebaseerde badges automatisch.
- Stat-counter animatie: `animateStatCount()` is geïmplementeerd maar Playwright test moet bevestigen dat de rAF-animatie ook visueel werkt (niet alleen statisch).
- Smart Job Match % is niet zichtbaar zonder actief filter — overweeg een "hint" tekst in de filter drawer.

#### Volgende logische actie

1. Playwright test schrijven/uitvoeren die visueel bevestigt: FAQ content, Aannemers kaarten, Trust Badge, Portfolio, Bevestigingsscherm Status Tracker.
2. Als Supabase reviews 400 blijft: controleer RLS policies in Supabase dashboard (public `SELECT` op reviews tabel).
3. Semantic HTML audit: `<nav>` voor navigatie, `<main>` voor page content, `<section>` voor FAQ secties — kost één commit maar verhoogt SEO-score aanzienlijk.

---

### 2026-03-28 — Autonomous Sprint: 4 features, 24 tests

#### Wat gebouwd

**Feature 1: Prijs Schatting Calculator** (`#prijscalculator`)
- Interactieve chips (8 klus-typen), oppervlakte-slider, animated price range output
- Demo-only (geen Supabase nodig), werkt altijd
- `initPriceCalc()`, `updatePriceCalc()`, `PRIJS_DATA` — pure JS

**Feature 2: Live Activiteitsfeed** (`#activiteitsfeed`)
- 20 pre-gebouwde activiteiten die cyclen elke 3.5s
- Pulserende LIVE indicator, fade-in animaties
- Auto-scroll: nieuw item bovenaan, overflow fade via CSS

**Feature 3: Aannemer Vergelijker**
- Shortlist bar (max 3 aannemers), vergelijkmodal met grid-layout
- Per-rij vergelijking: score, specialisme, stad, reviews
- Winner-highlight (✔) op hoogste score per categorie
- **Kritieke bug gevonden en gefixed**: `#mijnKlussenOverlay` miste een sluitende `</div>` tag, waardoor ALLE pagina-content erna (inclusief `#page-aannemers`) erin nestelde. Overlay heeft `pointer-events:none` → buttons onklikbaar. HTML linting mist dit bij grote bestanden — Playwright diagnose leidde naar de fix.

**Feature 4: Search Autocomplete** (`#ac-search`)
- Live dropdown: specialisme-categorie, stad, naam/bedrijf suggesties
- Keyboard navigatie (ArrowUp/Down, Enter, Escape)
- Filtert `allAannemers` via bestaande `applyAnFilters()` — geen duplicate logica
- Sluit bij klik buiten de zoekbalk (document click listener)

#### Test-scores
- 24/24 Playwright tests groen
- 0 regressions in bestaande sprint_verify + timeout_fix tests

#### Kritieke lessen

1. **Unclosed HTML tags** zijn onzichtbaar voor code-review maar breken de DOM structuur fundamenteel. Overlay-divs (`position:fixed`) die per ongeluk content insluiten veroorzaken `pointer-events:none` op de hele pagina-body. Symptoom: "element is visible and stable but `<html>` intercepts pointer events." Diagnose: `window.getComputedStyle(el).pointerEvents` op de parent-chain.

2. **`git -C "path"` bypast allow-patterns** in `settings.local.json`. Patterns zoals `"Bash(git push*)"` matchen op de start van de command string. `git -C "/path" push` start met `git -C` niet `git push` → user approval dialoog. Oplossing: gebruik altijd plain `git commit/push/add` vanuit de reeds-ingestelde working directory.

3. **TDD + HTML bugs**: Tests die klikken falen door DOM-structuur bugs (niet door JS-bugs) — foutmelding "html intercepts pointer events" is de sleutelzin om te herkennen.

---

## Architectuur beslissingen (permanent)

| Beslissing | Reden |
|-----------|-------|
| Single-file HTML | Zero build complexity, snelle deploys. Geleidelijke extractie later. |
| Supabase aparte queries | Robuuster dan nested selects bij RLS/FK issues |
| Demo fallback altijd beschikbaar | Platform werkt altijd — ook als DB down is |
| Playwright voor QA | Enige manier om te bevestigen dat UI echt werkt, niet alleen in code |
| `escHtml()` + `escAttr()` overal | XSS-preventie — nooit raw user input in innerHTML |
