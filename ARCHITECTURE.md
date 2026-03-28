# Klushub Architecture Strategy (2026-03-28)

## Concurrentie-analyse (Werkspot / Klussendirect)
- Sterk bij concurrenten: groot volume, merkbekendheid, veel bestaande profielen.
- Zwak bij concurrenten: keuze-stress voor klanten, beperkte transparantie over lokale betrouwbaarheid, trage “van aanvraag naar keuze” ervaring.
- Klushub kans: niet alleen meer leads, maar sneller en zekerder beslissen met duidelijke betrouwbaarheidssignalen en beslisondersteuning in de kernflow.

## Twee killer-features
1. Trust Snapshot Graph
- Doel: per aannemer direct tonen hoe betrouwbaar die lokaal is (score, volume, recency, verificatie).
- Waarde: meer vertrouwen en hogere acceptatie zonder extra klikwerk.
- KPI-effect: hogere conversie van “aanbieding ontvangen” -> “aannemer gekozen”.

2. Aanbieding Vergelijker (Decision Assistant)
- Doel: in klant-beheerflow automatisch tonen wat “beste balans” is op prijs + doorlooptijd + profielkwaliteit.
- Waarde: verlaagt keuze-frictie, maakt platform slimmer dan simpele offertelijsten.
- KPI-effect: lagere time-to-select, hogere keuze-conversie, minder afhakers.

## Gekozen feature voor deze sprint
- **Aanbieding Vergelijker (Decision Assistant)**.
- Reden: hoogste directe business-impact op de bestaande kernflow en snel leverbaar in huidige single-file architectuur.

## Implementatie-aanpak
1. Bereken vergelijkingsmetrics per aanbod (prijsindex, snelheid, trust-hint).
2. Toon compacte vergelijkingskaart boven de aanbiedingen in `openKlantBeheer`.
3. Label één aanbod als `Beste balans`.
4. Laat duidelijke ranges zien (laagste/hoogste prijs, snelste doorlooptijd, mediaan).
5. Houd fallback veilig: als data onvolledig is, blijft bestaande lijst zonder regressie zichtbaar.

## Risico’s en mitigaties
- Incomplete data (geen doorlooptijd of profiel): fallback naar prijs-only score, geen crash.
- UX-overload: compacte samenvatting, details optioneel.
- Regressie in beheerflow: smoke-test op aanwezigheid van vergelijkingsblok + bestaande actieknoppen.

