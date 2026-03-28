# ARCHITECTURE.md — Klushub Feature Blueprint
*Lead Engineer: Claude (Autonomous Session 2026-03-28)*

---

## Platform Analysis: Wat maakt een modern aannemer-platform superieur?

### Benchmark analyse
De beste platforms in dit segment (Werkspot, Homeadvisor, Checkatrade) winnen op:

1. **Instant price clarity** — gebruikers willen vóór ze een formulier invullen weten "wat kost dit ongeveer?"
2. **Social proof momentum** — gevoel van "dit platform leeft", recente activiteit zichtbaar
3. **Smart matching** — aannemer vinden die past bij specifieke klus ipv generieke lijst
4. **Zero-friction onboarding** — klus plaatsen in < 60 seconden

### Klushub gap analyse
- ✅ Review systeem (gebouwd)
- ✅ Trust badges (gebouwd)
- ✅ Smart job match % (gebouwd)
- ❌ Geen prijs-indicatie vóór klus plaatsen → gebruikers verlaten pagina
- ❌ Geen "platform leeft" gevoel → statische content, geen activiteit zichtbaar
- ❌ Geen directe contractor vergelijking tool

---

## Killer Feature 1: Prijs Schatting Calculator 🧮

### User value
Gebruikers willen DIRECT weten wat hun klus kost voordat ze tijd investeren in een formulier.
Een prijs-calculator vermindert bounce rate en verhoogt conversie.

### UI/UX
- Interactieve chips voor klus-type (Badkamer, Keuken, Dak, Elektra, etc.)
- Slider voor oppervlakte (m²) of scope
- Instant animated price range output: `€ 2.400 — € 4.800`
- "Ontvang exacte offertes" CTA button
- Sectie id: `#prijscalculator`
- Geplaatst: landing page, na `#hoe`-sectie

### Data model (demo, geen Supabase nodig)
```javascript
const PRIJS_DATA = {
  'Badkamer':     { per_m2: [450, 900],  basis: [800, 1200]  },
  'Keuken':       { per_m2: [300, 700],  basis: [600, 1000]  },
  'Dak & Gevel':  { per_m2: [200, 500],  basis: [1500, 3000] },
  'Aanbouw':      { per_m2: [900, 1800], basis: [2000, 4000] },
  'Elektra':      { per_m2: [80, 200],   basis: [500, 800]   },
  'Schilderwerk': { per_m2: [20, 60],    basis: [300, 500]   },
  'Vloeren':      { per_m2: [35, 120],   basis: [200, 400]   },
  'Overig':       { per_m2: [100, 300],  basis: [400, 800]   },
};
```

### Playwright test target
- `#prijscalculator` is visible on landing page
- Clicking a type chip updates the price estimate
- Slider interaction changes the displayed price range
- CTA button navigates to klus plaatsen form

---

## Killer Feature 2: Live Activiteitsfeed 🔴 LIVE

### User value
Social proof en "momentum" — het gevoel dat het platform actief is en andere mensen ook al bezig zijn.
Verhoogt vertrouwen en conversie dramatisch ("Als andere mensen het gebruiken, werkt het").

### UI/UX
- Compact feed-balk onderaan landing page (boven footer), of als zijpaneel ticker
- Live-stijl items met pulserende rode "LIVE" indicator
- Items tonen: nieuwe klus geplaatst, aannemer ontving review, klus voltooid
- Auto-scroll/fade animatie, nieuwe items verschijnen elke ~4 seconden
- Demo data: 20 pre-gebouwde activiteiten die cyclen

### Demo activiteiten (representatief)
```javascript
const FEED_ITEMS = [
  { type: 'klus',    icon: '🔨', tekst: 'Nieuwe klus in Amsterdam', sub: 'Badkamer renovatie — € 4.500', tijd: '2 min geleden' },
  { type: 'review',  icon: '⭐', tekst: 'Jan van Dijk ontving 5★', sub: 'Van: Sandra V. uit Amsterdam', tijd: '5 min geleden' },
  { type: 'match',   icon: '✅', tekst: 'Klus gekoppeld in Rotterdam', sub: 'Dakkapel — 3 aanbiedingen ontvangen', tijd: '8 min geleden' },
  // ... 17 meer
];
```

### Playwright test target
- `#activiteitsfeed` is visible
- Feed contains at least 3 items
- Feed items have icon + text + time elements
- After 5 seconds: new item has appeared (auto-scroll working)

---

## Bouw volgorde
1. Prijs Calculator (Feature 1) — meeste user value, fully static, snel te bouwen
2. Live Activiteitsfeed (Feature 2) — social proof, animaties, WOW factor voor Gemini

## Technische aanpak
- Beide features: puur HTML/CSS/JS, geen externe libraries, geen Supabase nodig
- Geïntegreerd in bestaande `index.html` (single-file architectuur)
- Playwright tests: geschreven vóór implementatie (TDD, conform AUTONOMY_PROTOCOL)
- Fallback: beide werken altijd, ook als sb=null

## Score verwachting
- Feature 1 (Calculator): +1 punt (werkende feature) + mogelijk +1 bonus (WOW UX)
- Feature 2 (Live Feed): +1 punt (werkende feature) + mogelijk +1 bonus (WOW factor)
- Totaal: +2 tot +4 punten boven huidige score
