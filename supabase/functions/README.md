# Supabase Edge Functions Setup

Deze map bevat de Edge Function code voor de Klushub e-mailketen.

## Function

- `resend-email`: verstuurt na plaatsing een beheerlink per e-mail via Resend.

## Vereiste secrets (in Supabase project)

Voer in je terminal uit (met je echte waarden):

```bash
supabase secrets set RESEND_API_KEY=YOUR_RESEND_API_KEY
supabase secrets set EMAIL_FROM="Klushub <noreply@jouwdomein.nl>"
supabase secrets set APP_BASE_URL="https://jouwdomein.nl"
```

## Deploy

```bash
supabase functions deploy resend-email
```

## Test invoke

```bash
supabase functions invoke resend-email --body '{"klus_id":"test-id","beheer_token":"test-token","email_klant":"test@example.com","omschrijving":"Test klus"}'
```

## Frontend koppeling

De frontend roept deze function non-blocking aan na succesvolle `insertKlus` in `index.html` via:

- `sb.functions.invoke('resend-email', { body: ... })`

Bij failure blijft de klusplaatsing zelf succesvol; de e-mailcall mag geen UX blokkeren.

