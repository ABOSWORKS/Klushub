# Lessons Learned

## 2026-03-28
- Session gestart met AUTONOMY_PROTOCOL als leidraad (TDD + journaling + robuuste error handling).
- Nieuwe regressietest toegevoegd voor open-klussen-isolatie na publish-timeout en tab-wissel:
  - `tests/smoke/open-klussen-isolation.smoke.js`
  - `tests/open-klussen-isolation.spec.ts`
- Eerste focus: reproduceerbaarheid van stuck load-state en daarna definitieve isolatiepatch in `index.html`.
- Bugfix uitgevoerd: open-klussen laadpad is ontkoppeld (foreground/background), met request-sequence guard en kortere, begrensde querystrategie.
- Waarom: gedeelde single-flight en lange sequentiële fallback maakten de klussenpagina gevoelig voor publish-flow en tabwissels.
- Extra fix uitgevoerd: email-chain heeft nu request-id diagnose + no-auth fallbackpad (voor verify-jwt/no-jwt mismatch), en `window.__KH_LAST_EMAIL_CHAIN` voor live troubleshooting van 401/502.
- Extra fix uitgevoerd: `submitAanbieding` herstelt nu timeout door read-back check op recent aanbod; `loadMijnKlussen` degradeert naar lijst zonder klusdetails i.p.v. vastlopen.
- Validatie:
  - `npm run test:smoke` => `SMOKE_OK`
  - `node tests/smoke/open-klussen-isolation.smoke.js` => `OPEN_KLUSSEN_ISOLATION_OK`
- Next AI action:
  1. Commit + push van deze patchset naar `codex/klushub-platform`.
  2. Live verificatie met Supabase Invocations op één publish + één aanbieding (request-id correleren met `__KH_LAST_EMAIL_CHAIN`).
  3. Indien nog 401: function setting `Verify JWT with legacy secret` uitzetten of legacy JWT anon key in frontend bevestigen.

## 2026-03-28 (autonomy skill)
- Probleem opgelost: protocol-werkwijze was mondeling afgesproken maar niet als herbruikbare skill vastgelegd.
- Keuze: een lokale custom skill `autonomy-protocol-ops` gemaakt en gevalideerd, zodat elke sprint consistent dezelfde TDD/journaling/semantic/error-handling regels volgt.
- Volgende logische AI-actie: skill meenemen in volgende implementatie-rondes en periodiek bijwerken bij nieuwe werkafspraken.

## 2026-03-28 (autonomous pipeline batch)
- Probleem opgelost: open-klussen timeout/stuck risico's na publish/tabwissel en gebrek aan keuze-ondersteuning in klantbeheer.
- Keuze:
  - Open-klussen flow verder geïsoleerd met source-specifieke load-sequences, nav-dedupe en background-no-render policy.
  - `loadStats` hardening toegevoegd zodat stats-fouten geen globale UI-regressie veroorzaken.
  - Nieuwe feature gebouwd: **Aanbieding Vergelijker** in klantbeheer met prijsrange/mediaan/snelste planning + `Beste balans` label per aanbod.
  - Strategiedocument vastgelegd in `ARCHITECTURE.md` met 2 killer-features en gekozen implementatie.
- Testevidence:
  - `npm run test:smoke` => `SMOKE_OK`
  - `node tests/smoke/open-klussen-isolation.smoke.js` => `OPEN_KLUSSEN_ISOLATION_OK`
  - `node tests/smoke/beheer-vergelijker.smoke.js` => `BEHEER_VERGELIJKER_OK`
- Volgende logische AI-actie:
  1. Live verificatie in productie: request-id correlatie voor resend 401/502 in Supabase Invocations.
  2. Trust Snapshot Graph (feature 2) op aannemer-profiel en/of reviews-tab implementeren.

## 2026-03-28 (stability follow-up release)
- Probleem opgelost: `Mijn aanbiedingen` kon vastlopen op oude in-flight loads; e-mailketen gaf te weinig diagnostiek op 401/502; open-klussen navigatie had nog dubbele load-triggers.
- Keuze:
  - `loadMijnKlussen({ force: true })` als standaard bij openen overlay, met request-sequence gating en kolom-fallback (`aangemaakt` -> `created_at`).
  - `triggerKlusEmailChain` uitgebreid met attempt-ledger, auth fallback (401/403) en retry op retryable 5xx-statuscodes.
  - Navigatiepad aangescherpt zodat `switchP('klussen')` alleen foreground-load start als de klussenpagina actief is.
  - Nieuwe smoke tests:
    - `tests/smoke/email-chain-diagnostics.smoke.js`
    - `tests/smoke/mijn-aanbiedingen-reload.smoke.js`
- Testevidence:
  - `node tests/smoke/email-chain-diagnostics.smoke.js` => `EMAIL_CHAIN_DIAGNOSTICS_OK`
  - `node tests/smoke/mijn-aanbiedingen-reload.smoke.js` => `MIJN_AANBIEDINGEN_RELOAD_OK`
  - `npm run test:smoke` => `SMOKE_OK`
  - `node tests/smoke/open-klussen-isolation.smoke.js` => `OPEN_KLUSSEN_ISOLATION_OK`
  - `node tests/smoke/beheer-vergelijker.smoke.js` => `BEHEER_VERGELIJKER_OK`
- Volgende logische AI-actie:
  1. Live check in Supabase Invocations met `x-kh-request-id` correlatie voor laatste e-mailpogingen.
  2. Zelfde release-ronde: Trust Snapshot Graph op reviews-tab activeren.
