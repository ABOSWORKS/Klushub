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
