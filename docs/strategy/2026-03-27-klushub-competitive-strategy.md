# Klushub Competitive Strategy (27-03-2026)

## Doel
Klushub positioneren als een platform dat aantoonbaar beter presteert dan Werkspot en Klussendirect op betrouwbaarheid, matchkwaliteit en gebruiksgemak.

## Korte Conclusie
- Niet winnen op volume (Werkspot) of alleen lage kosten (Klussendirect).
- Wel winnen op: minder ruis, betere shortlist, hogere voorspelbaarheid van uitkomst.
- Kernpropositie: **de 3 best passende lokale vakmensen, met transparante vergelijking en verifieerbare trust-signalen**.

## Concurrentiematrix
| Platform | Sterk in | Zwak in | Kans voor Klushub |
|---|---|---|---|
| Werkspot | schaal, merk, veel aanbod | meer ruis, lead-cost frictie voor vakman | hogere matchkwaliteit en eerlijkere economics |
| Klussendirect | simpele boodschap, geen leadkosten | minder sterke trust-/selectielaag | combineer “eerlijk” met objectieve kwaliteitsselectie |
| Klushub | no-account klantflow, reviewstructuur, abonnementsmodel | nog beperkte server-side matching/trust engine | focus op trust-engine + shortlist-ervaring |

## USP-richtingen (keuze)
1. **Beste match, niet meeste reacties**  
Binnen 24-48 uur een relevante shortlist i.p.v. een ongestructureerde stroom reacties.

2. **Eerlijke marktplaats zonder lead-straf**  
Geen kosten per contact als kernmodel, met duidelijke ROI voor vakmensen.

3. **Transparante keuze-interface**  
Offertes vergelijkbaar op prijsmodel, planning, betrouwbaarheidsscore en verificatie.

## Productstrategie in fasen
### 0-3 maanden
- Stabiliteit kernflows (plaatsen, aanbieden, beheren, reviews).
- Trust layer v1 server-side (reviews, score-samenvatting, verified signalen).
- Offerte-vergelijking in gestandaardiseerd formaat.
- Tracking op funnel: post -> eerste aanbod -> selectie -> review.

### 3-6 maanden
- Server-side match engine (`ranked_contractors`).
- Conversatie/thread per klus.
- Performance dashboard voor aannemers (response, win-rate, ROI).
- SEO-landingsmachine op categorie x regio.

### 6-12 maanden
- Trust v2 met outcome-signalen (completion, klachtenratio, recency).
- Moderation/fraud tooling op schaal.
- PWA/mobile-first beheerervaring.
- Integraties (agenda/CRM/API) voor zakelijke aannemers.

## Technische prioriteiten
1. Reputatie en reviews als server-side source of truth.
2. Matching/logica uit client naar RPC/API.
3. Anti-fraude signalen + moderation queue.
4. Feature flags, meetbaarheid en regressietests op kritieke journeys.

## Strategy Agent: Aanbevolen Skills
### Direct inzetten
- `market-intel`: concurrentie-wijzigingen en prijs/positionering monitoren.
- `pricing-strategy`: pakketontwerp, trial, upgradepad en ROI-optimalisatie.
- `experiment-design`: gestructureerde A/B-tests op funnel- en trust-copy.
- `growth-analytics`: liquiditeit per regio/categorie en cohortgedrag sturen.
- `marketplace-liquidity-and-trust` (custom): balans vraag/aanbod + trust-signalen.

### Bestaande Codex-skills die nu al waarde geven
- `frontend-skill`: positionering vertalen naar sterkere landings- en vergelijk-UI.
- `playwright-interactive`: snelle regressiechecks voor kernflows.
- `security-best-practices`: hardenen van auth, tokens en review-integriteit.
- `skill-creator`: custom strategy-skills gestructureerd definiëren.

## Besliskader (North Star + guardrails)
- North star: `Successful Verified Matches / month`.
- Guardrails: no-response rate, cancel/no-show, fraud flags, support latency, vakman-retentie.

## Volgende concrete stap
- Uitwerken van `ranked_contractors` RPC + acceptance criteria.
- Daarna pricing experiment op onboarding voor aannemers (trial -> paid).
