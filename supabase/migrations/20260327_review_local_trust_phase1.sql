-- Phase 1: Review stats + local trust foundation
-- Safe to run multiple times where possible.

create schema if not exists public;

-- Helpful indexes for review aggregation and local filtering.
create index if not exists idx_reviews_aannemer_aangemaakt
  on public.reviews (aannemer_id, aangemaakt desc);

create index if not exists idx_aannemers_stad
  on public.aannemers (stad);

-- Optional geo index substitute if PostGIS is not enabled.
create index if not exists idx_aannemers_lat_lng
  on public.aannemers (lat, lng);

-- Aggregated review view with Bayesian trust score.
create or replace view public.aannemer_review_stats as
with review_agg as (
  select
    r.aannemer_id,
    count(*)::int as review_count,
    avg(r.score_kwaliteit)::numeric(4,2) as avg_kwaliteit,
    avg(r.score_communicatie)::numeric(4,2) as avg_communicatie,
    avg(r.score_prijs_kwaliteit)::numeric(4,2) as avg_prijs_kwaliteit,
    avg(r.score_tijdigheid)::numeric(4,2) as avg_tijdigheid,
    avg(r.score_netheid)::numeric(4,2) as avg_netheid,
    avg(
      (
        coalesce(r.score_kwaliteit,0) +
        coalesce(r.score_communicatie,0) +
        coalesce(r.score_prijs_kwaliteit,0) +
        coalesce(r.score_tijdigheid,0) +
        coalesce(r.score_netheid,0)
      ) / 5.0
    )::numeric(4,2) as avg_total,
    max(r.aangemaakt) as recent_review_at
  from public.reviews r
  where r.aannemer_id is not null
  group by r.aannemer_id
)
select
  a.id as aannemer_id,
  a.bedrijfsnaam,
  a.specialisme,
  a.stad,
  a.lat,
  a.lng,
  a.abonnement,
  coalesce(ra.review_count, 0) as review_count,
  coalesce(ra.avg_kwaliteit, 0)::numeric(4,2) as avg_kwaliteit,
  coalesce(ra.avg_communicatie, 0)::numeric(4,2) as avg_communicatie,
  coalesce(ra.avg_prijs_kwaliteit, 0)::numeric(4,2) as avg_prijs_kwaliteit,
  coalesce(ra.avg_tijdigheid, 0)::numeric(4,2) as avg_tijdigheid,
  coalesce(ra.avg_netheid, 0)::numeric(4,2) as avg_netheid,
  coalesce(ra.avg_total, 0)::numeric(4,2) as avg_total,
  -- Bayesian trust score: prior mean 4.0, prior weight 8
  case
    when coalesce(ra.review_count, 0) = 0 then 0::numeric(4,2)
    else (
      (
        coalesce(ra.avg_total, 0) * coalesce(ra.review_count, 0)
      ) + (4.0 * 8)
    ) / (coalesce(ra.review_count, 0) + 8)
  end::numeric(4,2) as trust_score,
  ra.recent_review_at
from public.aannemers a
left join review_agg ra on ra.aannemer_id = a.id;
