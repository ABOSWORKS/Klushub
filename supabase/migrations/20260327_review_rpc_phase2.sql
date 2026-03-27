-- Phase 2: Review RPC endpoints for richer trust + feed UI.
-- Designed to stay compatible with the current reviews schema.

create schema if not exists public;

create or replace function public.get_contractor_reviews_v2(
  p_contractor_id uuid,
  p_city text default null,
  p_radius_km int default 25,
  p_sort text default 'relevant',
  p_limit int default 20,
  p_offset int default 0
)
returns table (
  review_id uuid,
  contractor_id uuid,
  rating numeric,
  body text,
  reviewer_type text,
  is_verified_job boolean,
  published_at timestamptz,
  city text,
  postcode text,
  subratings jsonb,
  local_distance_km numeric,
  relevance_score numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select
      r.id as review_id,
      r.aannemer_id as contractor_id,
      (
        coalesce(r.score_kwaliteit, 0) +
        coalesce(r.score_communicatie, 0) +
        coalesce(r.score_prijs_kwaliteit, 0) +
        coalesce(r.score_tijdigheid, 0) +
        coalesce(r.score_netheid, 0)
      ) / 5.0 as rating,
      r.tekst as body,
      coalesce(r.reviewer_type, 'klant') as reviewer_type,
      coalesce((to_jsonb(r) ->> 'is_verified_job')::boolean, false) as is_verified_job,
      coalesce((to_jsonb(r) ->> 'published_at')::timestamptz, r.aangemaakt) as published_at,
      coalesce(to_jsonb(r) ->> 'city', null) as city,
      coalesce(to_jsonb(r) ->> 'postcode', null) as postcode,
      jsonb_build_object(
        'kwaliteit', coalesce(r.score_kwaliteit, 0),
        'communicatie', coalesce(r.score_communicatie, 0),
        'prijs_kwaliteit', coalesce(r.score_prijs_kwaliteit, 0),
        'tijdigheid', coalesce(r.score_tijdigheid, 0),
        'netheid', coalesce(r.score_netheid, 0)
      ) as subratings
    from public.reviews r
    where r.aannemer_id = p_contractor_id
  ),
  scoped as (
    select
      b.*,
      case
        when p_city is null or b.city is null then null::numeric
        when lower(trim(b.city)) = lower(trim(p_city)) then 0::numeric
        else null::numeric
      end as local_distance_km
    from base b
    where p_city is null
      or b.city is null
      or lower(trim(b.city)) = lower(trim(p_city))
  ),
  scored as (
    select
      s.*,
      (
        (coalesce(s.rating, 0) * 0.70) +
        (case when s.is_verified_job then 0.20 else 0 end) +
        (case when s.published_at >= (now() - interval '90 days') then 0.10 else 0 end)
      )::numeric as relevance_score
    from scoped s
  )
  select
    sc.review_id,
    sc.contractor_id,
    round(sc.rating::numeric, 2) as rating,
    sc.body,
    sc.reviewer_type,
    sc.is_verified_job,
    sc.published_at,
    sc.city,
    sc.postcode,
    sc.subratings,
    sc.local_distance_km,
    sc.relevance_score
  from scored sc
  order by
    case when lower(coalesce(p_sort, 'relevant')) = 'recent' then extract(epoch from sc.published_at) end desc,
    case when lower(coalesce(p_sort, 'relevant')) = 'hoogste' then sc.rating end desc,
    case when lower(coalesce(p_sort, 'relevant')) = 'relevant' then sc.relevance_score end desc,
    sc.published_at desc
  limit greatest(1, least(coalesce(p_limit, 20), 200))
  offset greatest(0, coalesce(p_offset, 0));
$$;

create or replace function public.get_review_summary_v2(
  p_contractor_id uuid,
  p_city text default null,
  p_radius_km int default 25
)
returns table (
  avg_rating numeric,
  total_reviews int,
  verified_share numeric,
  recent_90d_count int,
  local_count int,
  trust_score numeric,
  histogram_json jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  with revs as (
    select
      (
        coalesce(r.score_kwaliteit, 0) +
        coalesce(r.score_communicatie, 0) +
        coalesce(r.score_prijs_kwaliteit, 0) +
        coalesce(r.score_tijdigheid, 0) +
        coalesce(r.score_netheid, 0)
      ) / 5.0 as rating,
      coalesce((to_jsonb(r) ->> 'is_verified_job')::boolean, false) as is_verified_job,
      coalesce((to_jsonb(r) ->> 'published_at')::timestamptz, r.aangemaakt) as published_at,
      coalesce(to_jsonb(r) ->> 'city', null) as city
    from public.reviews r
    where r.aannemer_id = p_contractor_id
  ),
  agg as (
    select
      coalesce(avg(rating), 0)::numeric as avg_rating,
      count(*)::int as total_reviews,
      coalesce(avg(case when is_verified_job then 1 else 0 end), 0)::numeric as verified_share,
      count(*) filter (where published_at >= (now() - interval '90 days'))::int as recent_90d_count,
      count(*) filter (
        where p_city is not null
          and city is not null
          and lower(trim(city)) = lower(trim(p_city))
      )::int as local_count
    from revs
  ),
  hist as (
    select
      jsonb_build_object(
        '1', count(*) filter (where rating >= 1 and rating < 1.5),
        '2', count(*) filter (where rating >= 1.5 and rating < 2.5),
        '3', count(*) filter (where rating >= 2.5 and rating < 3.5),
        '4', count(*) filter (where rating >= 3.5 and rating < 4.5),
        '5', count(*) filter (where rating >= 4.5 and rating <= 5)
      ) as histogram_json
    from revs
  )
  select
    round(agg.avg_rating::numeric, 2) as avg_rating,
    agg.total_reviews,
    round(agg.verified_share::numeric, 4) as verified_share,
    agg.recent_90d_count,
    agg.local_count,
    round(
      (
        (case when agg.total_reviews > 0 then ((agg.avg_rating * agg.total_reviews) + (4.0 * 8)) / (agg.total_reviews + 8) else 0 end) * 0.7
      ) +
      (agg.verified_share * 0.2 * 5.0) +
      (least(1.0, greatest(0.0, agg.recent_90d_count / 10.0)) * 0.1 * 5.0)
    , 2) as trust_score,
    hist.histogram_json
  from agg
  cross join hist;
$$;

grant execute on function public.get_contractor_reviews_v2(uuid, text, int, text, int, int) to anon, authenticated;
grant execute on function public.get_review_summary_v2(uuid, text, int) to anon, authenticated;
