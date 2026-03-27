# Klushub 90-Dagen Execution Plan (Wekelijks)

## Doel
In 90 dagen aantoonbaar beter worden dan Werkspot/Klussendirect op:
- matchkwaliteit
- betrouwbaarheid
- voorspelbare ROI voor aannemers

## North Star
`Verified hires per maand` in focusregio’s.

## Focusscope (eerste 90 dagen)
- Regio’s: Amsterdam, Rotterdam, Utrecht
- Categorieën: Badkamer/Sanitair, Schilder/Stuc, Elektra, Algemeen renovatie

## KPI-gates (eind dag 90)
- `first_response_24h` >= 70%
- `3plus_offers_72h` >= 55%
- `post_to_hire` >= 20%
- `verified_review_rate` >= 45%
- `trial_to_paid` >= 25%
- `m1_paid_retention` >= 82%
- `no_response_rate` <= 18%
- `dispute_or_noshow_rate` <= 4%

## Agentrollen
- Lead Architect: prioritering, kwaliteitsgates, integratiebesluiten
- Implementation Engineer: implementatie backend/frontend/features
- Bug Explorer: root-cause analyses, regressierisico
- QA/Test Agent: smoke/regressie + acceptatiecriteria
- UI/UX Designer: conversie, keuze-interface, frictieverlaging
- Strategy Agent: marktdata, pricing, experimenten, KPI-review

---

## Week 1
### Sprintdoel
Meten en stabiliteit als basis voor schaal.

### KPI-target week
- Event tracking dekking >= 80% op kernfunnel
- Kritieke P0 bugs open = 0

### Tickets
- ARCH-001: Definieer KPI-dictionary + event schema (`job_posted`, `offer_sent`, `contractor_selected`, `review_submitted`).
- ENG-001: Implementeer event hooks in plaats-, aanbod-, beheer- en reviewflow.
- BUG-001: Verifieer regressievrije status van publish/aanbod/mijn-aanbiedingen.
- QA-001: Maak regressiechecklist en smoke-acceptatie voor kernflows.

---

## Week 2
### Sprintdoel
Trust-signalen overal zichtbaar maken.

### KPI-target week
- `contractor_profile_with_trust_signals` = 100% in focusscope
- `review_summary_load_success` >= 98%

### Tickets
- ARCH-002: Trust signal specs vastleggen (score, verified, recency, local relevance).
- ENG-002: Reviews/trust UI volledig data-driven via RPC in aannemerprofiel + listing.
- QA-002: Tests voor trust fallback en RPC-failure scenario’s.
- UX-001: Verbeterde trust copy en visual hierarchy op profielkaarten.

---

## Week 3
### Sprintdoel
Vergelijkinterface voor offertes neerzetten (klantbesluit versnellen).

### KPI-target week
- `compare_view_open_rate` >= 60% van klussen met >=2 aanbiedingen
- `time_to_selection` -10% t.o.v. baseline

### Tickets
- ARCH-003: Vergelijkmodel met vaste velden (prijsmodel, doorlooptijd, beschikbaarheid, trust).
- ENG-003: Bouw compare module in klant-beheerflow.
- UX-002: Besliskaart met “beste fit” label.
- QA-003: Acceptatietest: 3 aanbiedingen vergelijken en 1 kiezen zonder regressie.

---

## Week 4
### Sprintdoel
Focusregio-aanvoer verhogen (liquiditeit).

### KPI-target week
- 60 actieve aannemers in focuscellen
- `first_response_24h` >= 50%

### Tickets
- STR-001: Supply playbook per regio/categorie + recruitment lijst.
- STR-002: ROI messaging versie A/B voor aannemer onboarding.
- ENG-004: Onboarding telemetry + segmentatie op regio/categorie.
- ARCH-004: Go/No-go criteria per focuscel.

---

## Week 5
### Sprintdoel
Shortlist-ervaring v1 (3 beste matches bovenaan).

### KPI-target week
- `shortlist_interaction_rate` >= 40%
- `no_response_rate` <= 26%

### Tickets
- ARCH-005: Ranking rules v1 (trust + relevantie + responsiviteit).
- ENG-005: Introduceer `ranked_contractors` RPC v1 (feature flagged).
- QA-004: Pariteitstest ranking vs oude sortering + regressie.
- BUG-002: Analyse edge-cases ranking (lege cellen, weinig supply).

---

## Week 6
### Sprintdoel
Prijsstrategie experimenten live.

### KPI-target week
- `trial_start_rate` +15% t.o.v. baseline
- `trial_activation_rate` >= 50%

### Tickets
- STR-003: Pricing experiment #1 (trial-frictie), #2 (pakketwaarde).
- ENG-006: Experiment flags + variant tracking.
- QA-005: Experiment datakwaliteit en attribution-check.
- ARCH-006: Guardrails tegen pay-to-win ranking.

---

## Week 7
### Sprintdoel
Klantkwaliteit verhogen na match (betrouwbaarheid).

### KPI-target week
- `verified_review_rate` >= 35%
- `dispute_or_noshow_rate` <= 6%

### Tickets
- ENG-007: Review prompting flow optimaliseren na status “afgerond”.
- ENG-008: Basis anti-fraude signal logging (review bursts/duplicatie).
- ARCH-007: Moderation policy v1 + escalation matrix.
- QA-006: Review-integriteit tests (een review per klus-regel).

---

## Week 8
### Sprintdoel
Aannemer-ROI dashboard v1.

### KPI-target week
- `paid_contractor_weekly_active` >= 70%
- `dashboard_usage` >= 50% van paid aannemers

### Tickets
- ENG-009: Dashboard: views, offers sent, shortlist rate, win rate.
- UX-003: ROI-communicatie en actionable tips.
- STR-004: Retentiecohorten en churn-signal analyse.
- QA-007: Dataconsistentie dashboard vs eventbron.

---

## Week 9
### Sprintdoel
Opschalen wat werkt in focuscellen.

### KPI-target week
- 120 klussen/maand run-rate in focuscellen
- `3plus_offers_72h` >= 45%

### Tickets
- ARCH-008: Cell-by-cell scaling decision board.
- STR-005: Kanaalmix herallocatie (alleen cellen boven threshold).
- ENG-010: Region/categorie performance panel in admin.
- BUG-003: Bottleneck triage per cel (vraag/supply mismatch).

---

## Week 10
### Sprintdoel
Support + moderation operationaliseren.

### KPI-target week
- `support_first_response_time` <= 4u
- `moderation_backlog` <= 48u

### Tickets
- ENG-011: Moderation queue UI + review flags + actions.
- ARCH-009: SLA’s voor trust incidents vastleggen.
- QA-008: Abuse testcases en permission checks.
- STR-006: Klantvertrouwen messaging rond kwaliteit/veiligheid.

---

## Week 11
### Sprintdoel
Conversie-optimalisatie op shortlist -> selectie.

### KPI-target week
- `compare_to_select` +20% t.o.v. week 3 baseline
- `post_to_hire` >= 18%

### Tickets
- UX-004: Verbeter compare CTA’s en keuze-argumentatie.
- ENG-012: Inline recommendation hints (“beste match”, “snelste reactie”).
- QA-009: A/B test validatie + regressieflow.
- STR-007: Experiment readout + rolloutadvies.

---

## Week 12
### Sprintdoel
90-dagen evaluatie en scale-plan Q2.

### KPI-target week
- Alle eind-gates meten; minimaal 5/8 gates gehaald.

### Tickets
- ARCH-010: Q2 architecture roadmap (modular monolith steps).
- STR-008: Competitieve scorecard update (Werkspot/Klussendirect delta).
- ENG-013: Technische schuldplan + performance plan Q2.
- QA-010: Definitieve reliability scorecard + test coverage gaps.

---

## Werkritme per week (zonder extra afstemming nodig)
- Maandag: Architect prioriteert sprinttickets + KPI gate.
- Dinsdag/Woensdag: Engineer implementeert, Bug Agent parallel op risico’s.
- Donderdag: QA + UX polish + fixes.
- Vrijdag: Strategy readout + go/no-go op KPI gate + push.

## Go/No-Go regels
- Geen opschaling als `no_response_rate` boven guardrail blijft.
- Geen nieuwe pricing rollout als `trial_activation` daalt zonder compenserende ROI.
- Geen ranking-wijziging live zonder QA-regressie groen op kernflows.
