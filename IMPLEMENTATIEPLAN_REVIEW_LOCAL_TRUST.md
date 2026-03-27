# Implementatieplan: Review + Local Trust

## 1) Wijzigingen in `index.html` (componenten, state, events)

### A. Aannemers-overzicht versterken
- Breid `anFilterState` uit met lokale trust-sorting (nu toegevoegd: `sorteer = local`).
- Voeg helperfuncties toe:
  - `isAannemerVerified(a)`
  - `computeTrustScore(avg, reviewCount)` (Bayesian gewogen score)
  - `getTrustLabel(trustScore, reviewCount)` (nieuw profiel / sterk beoordeeld / top betrouwbaar)
- Breid `loadAannemers()` enrichment uit:
  - voeg velden toe aan elk aannemerobject: `trust_score`, `trust_label`, `is_verified`.
- Breid `applyAnFilters()` sorteerlogica uit:
  - `score`: sorteer op `trust_score` i.p.v. alleen raw gemiddeld.
  - `local`: combineer `trust_score` met afstand (`haversine`) voor “beste match in regio”.
- `buildAnnemerCard(a)`:
  - toon trust-badge met label + score.
  - toon afstand wanneer regiofilter actief is.
- UI:
  - sorteer-optie toegevoegd: `Beste match in regio` (`value="local"`).
  - bij succesvolle regio-lookup auto-switch van `score` naar `local`.

### B. Reviewflow betrouwbaarder maken (fase 1, kleine scope)
- In `submitReview()`:
  - extra client-validatie: verplichting minimaal 5 criteria + minimum tekstlengte optioneel instelbaar.
  - idempotency-token meesturen (`review_nonce`) om dubbele submits te dempen.
- In aannemerprofiel:
  - “Top reviews” eerst tonen op recency + score (zonder extra API, client-side sort op `reviews` array).

## 2) Benodigde Supabase tabellen/views/RPC’s

### Fase 1 (minimaal, direct haalbaar)
- **View `aannemer_review_stats`**  
  Berekent per aannemer:
  - `review_count`
  - `avg_kwaliteit`, `avg_communicatie`, `avg_prijs_kwaliteit`, `avg_tijdigheid`, `avg_netheid`
  - `avg_total`
  - `trust_score` (Bayesian)
  - `recent_review_at`

- **Indexen**
  - `reviews(aannemer_id, aangemaakt desc)`
  - `aannemers(stad)`
  - optioneel geo: `aannemers(lat, lng)`

### Fase 2 (na stabilisatie)
- **Tabel `review_flags`**
  - voor signaleren van verdachte reviews.
- **RPC `get_ranked_aannemers_local`**
  - server-side ranking met input: `lat`, `lng`, `radius_km`, `min_score`, `min_reviews`, `specialisme`.
  - output inclusief `distance_km`, `trust_score`, `ranking_score`.

## 3) Migraties/queries (performant)

### SQL voorstel (fase 1)
- Zie bestand:
  - `supabase/migrations/20260327_review_local_trust_phase1.sql`
- Kern:
  - view met aggregaties op `reviews`.
  - trust-formule met prior mean/weight.
  - indexen op `reviews` en `aannemers`.

### Querystrategie
- Vervang in `loadAannemers()` de dubbele call (`aannemers` + `reviews`) in fase 2 door:
  - `from('aannemer_review_stats').select('*')`
  - eventueel join/merge met `aannemers`.
- Bij veel data:
  - server-side pagination (`range`) + filters in query.
  - client-side alleen voor UI polish.

## 4) Testplan (smoke + handmatig)

### Smoke (uitbreiden)
1. Sortering `local`:
   - bij regio-input wordt `an-sort=local`.
   - lijst blijft renderen zonder fouten.
2. Trust-badge:
   - elke kaart toont trust-label.
3. Regio + min-score + min-reviews gecombineerd:
   - resultaatset wijzigt deterministisch.
4. Geen regressie:
   - FAQ nav werkt.
   - Aannemers nav toont geen witte pagina.

### Handmatig
1. Regio “Eindhoven” + radius 25 km:
   - lokale aannemers omhoog in lijst.
2. Profiel met weinig reviews:
   - label “Nieuw profiel”.
3. Profiel met veel hoge reviews:
   - label “Top betrouwbaar”.
4. Review submit:
   - geen dubbele submit bij dubbelklik.

## 5) Kleinste first increment (1-2 commits)

### Commit 1 (nu direct)
- `index.html`:
  - trust helpers
  - lokale trust sortering
  - trust-badge op kaarten
  - sorteeroptie `Beste match in regio`

### Commit 2
- SQL migratie toevoegen:
  - `aannemer_review_stats` view
  - indexen
- (optioneel) `loadAannemers` voorbereiden voor view-consumptie achter feature-flag.

## Voorstel codepatches

### Functies
- `computeTrustScore(avg, reviewCount)`
- `getTrustLabel(trustScore, reviewCount)`
- `isAannemerVerified(a)`
- (fase 2) `fetchAannemersFromStatsView()`

### Payloadstructuur (RPC fase 2)
```json
{
  "lat": 51.48,
  "lng": 5.66,
  "radius_km": 25,
  "specialismen": ["Badkamer", "Elektra"],
  "min_score": 4.0,
  "min_reviews": 5,
  "sort_mode": "local_trust"
}
```

### Verwachte output (RPC fase 2)
```json
{
  "id": "uuid",
  "bedrijfsnaam": "De Groot Elektro",
  "stad": "Eindhoven",
  "avg_total": 4.6,
  "review_count": 19,
  "trust_score": 4.48,
  "distance_km": 7.2,
  "ranking_score": 4.31
}
```
