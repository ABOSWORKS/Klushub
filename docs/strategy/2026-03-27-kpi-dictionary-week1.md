# Klushub Week 1 KPI Dictionary (Codex)

Datum: 27 maart 2026  
Scope: baseline funnelmeting voor stabiliteit + conversie.

## Event Schema (v1)

Alle events landen in `window.__klushubEvents` met minimaal:

- `name`: eventnaam
- `ts`: ISO timestamp
- `session_id`: client-side sessie-id
- `page`: actieve pagina (`landing`, `klussen`, `aannemers`, etc.)

## Geïmplementeerde Events

- `page_view`
- `klussen_load_started`
- `klussen_load_succeeded`
- `klussen_load_failed`
- `klussen_load_demo_fallback`
- `klus_form_validation_failed`
- `klus_form_submit_clicked`
- `klus_publish_started`
- `klus_publish_succeeded`
- `klus_publish_failed`
- `klus_publish_blocked_inflight`
- `email_chain_started`
- `email_chain_succeeded`
- `email_chain_failed`
- `email_chain_skipped`
- `aanbieding_submit_validation_failed`
- `aanbieding_submit_started`
- `aanbieding_submit_succeeded`
- `aanbieding_submit_failed`
- `aanbieding_submit_blocked_inflight`
- `aannemer_select_started`
- `aannemer_select_succeeded`
- `aannemer_select_failed`
- `aannemer_select_cancelled`
- `review_submit_started`
- `review_submit_succeeded`
- `review_submit_failed`
- `review_submit_validation_failed`

## KPI Set (Week 1)

1. `Klus Submit Rate`
- Formule: `klus_publish_succeeded / klus_form_submit_clicked`
- Doel: detecteren of publicatieflow frictie heeft.

2. `Klus Publish Failure Rate`
- Formule: `klus_publish_failed / klus_publish_started`
- Doel: backend- of timeoutproblemen zichtbaar maken.

3. `Open Klussen Load Success Rate`
- Formule: `klussen_load_succeeded / klussen_load_started`
- Doel: stabiliteit van openstaande-klussenpagina bewaken.

4. `Aanbieding Submit Rate`
- Formule: `aanbieding_submit_succeeded / aanbieding_submit_started`
- Doel: aannemerflow betrouwbaarheid meten.

5. `Review Completion Rate`
- Formule: `review_submit_succeeded / review_submit_started`
- Doel: vertrouwen- en kwaliteitslus meten.

6. `Email Chain Success Rate`
- Formule: `email_chain_succeeded / email_chain_started`
- Doel: controle op bevestigingsmail-keten.

## Week 1 Operatieregels

- Als `Klus Publish Failure Rate > 5%`: eerst timeout + Supabase pad fixen, geen nieuwe featurewerkzaamheden.
- Als `Open Klussen Load Success Rate < 95%`: prioriteit op query-latency en fallback-gedrag.
- Als `Aanbieding Submit Rate < 90%`: direct aanbodflow/rpc validatie en foutmeldingen aanscherpen.
- Als `Email Chain Success Rate < 95%`: edge function + key/config vóór UI-polish.

## Snelle Debug Tip

In browser console:

```js
window.__klushubEvents?.slice(-25)
```

Voor debug logging:

```js
window.__KLUSHUB_DEBUG_TRACKING = true
```
