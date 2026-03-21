const SUPABASE_URL  = 'https://mzozeayuibnodxdrtbfk.supabase.co';   // bijv. https://xyzabc.supabase.co
  const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16b3plYXl1aWJub2R4ZHJ0YmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NTI0ODIsImV4cCI6MjA4OTIyODQ4Mn0.TzM4tVmP4KWaroBGbegowFu7cv75xdCEQxpSk8FL7DM';   // begint met eyJ...

'use strict';

// ══════════════════════════════════════════════════
// 1. SUPABASE + GLOBALS
// ══════════════════════════════════════════════════
let sb = null;
let currentUser = null;
let currentKlusId = null;
let allKlussen = [];          // alle geladen klussen (voor client-side filter)
let filteredKlussen = [];     // na filters
let klussensOffset = 0;
const PAGE_SIZE = 50;         // laden we meer zodat client-side filter goed werkt

// ─── Filter state ──────────────────────────────
const filterState = {
  zoekterm:    '',
  categorieen: new Set(['Badkamer','Keuken','Dak','Aanbouw','Elektra','Schilderwerk','Vloeren','Overig']),
  budgetMin:   0,
  budgetMax:   50000,
  postcode:    '',
  lat:         null,
  lng:         null,
  radius:      15,    // km
  sorteer:     'nieuwste',
};

// ─── Postcode → coördinaten cache ─────────────
const geocodeCache = {};

// ─── Bekende stadscoördinaten als fallback voor klussen zonder lat/lng ───
function getStadCoords(s) {
  const m = {
    'amsterdam':{lat:52.3676,lng:4.9041},'rotterdam':{lat:51.9244,lng:4.4777},
    'den haag':{lat:52.0705,lng:4.3007},''s-gravenhage':{lat:52.0705,lng:4.3007},
    'utrecht':{lat:52.0907,lng:5.1214},'eindhoven':{lat:51.4416,lng:5.4697},
    'nijmegen':{lat:51.8426,lng:5.8546},'zoetermeer':{lat:52.0573,lng:4.4944},
    'leidschendam':{lat:52.0900,lng:4.3900},'rijswijk':{lat:52.0393,lng:4.3220},
    'delft':{lat:52.0116,lng:4.3571},'nootdorp':{lat:52.0200,lng:4.4000},
    'voorburg':{lat:52.0700,lng:4.3600},'leiden':{lat:52.1601,lng:4.4970},
    'breda':{lat:51.5719,lng:4.7683},'tilburg':{lat:51.5555,lng:5.0913},
    'groningen':{lat:53.2194,lng:6.5665},'maastricht':{lat:50.8514,lng:5.6909},
    'arnhem':{lat:51.9851,lng:5.8987},'almere':{lat:52.3508,lng:5.2647},
    'haarlem':{lat:52.3873,lng:4.6462},'amersfoort':{lat:52.1551,lng:5.3872},
    'apeldoorn':{lat:52.2112,lng:5.9699},'enschede':{lat:52.2215,lng:6.8937},
    'venlo':{lat:51.3703,lng:6.1724},'dordrecht':{lat:51.8133,lng:4.6901},
    'zwolle':{lat:52.5168,lng:6.0830},'alkmaar':{lat:52.6324,lng:4.7534},
    'leeuwarden':{lat:53.2012,lng:5.7999},'deventer':{lat:52.2550,lng:6.1572},
  };
  return m[(s||'').toLowerCase()] || null;
}

function getCatIcon(typeStr) {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('badkamer')) return 'bath';
  if (t.includes('keuken')) return 'utensils';
  if (t.includes('dak')) return 'home';
  if (t.includes('aanbouw') || t.includes('zolder')) return 'hammer';
  if (t.includes('elektra')) return 'zap';
  if (t.includes('schilderwerk') || t.includes('stuc')) return 'paint-roller';
  if (t.includes('vloer')) return 'layers';
  if (t.includes('tuin')) return 'tree-pine';
  if (t.includes('kozijn')) return 'layout-grid';
  return 'more-horizontal';
}

function initSupabase() {
  if (SUPABASE_URL === 'JOUW_SUPABASE_URL_HIER' || SUPABASE_ANON === 'JOUW_SUPABASE_ANON_KEY') {
    console.warn('⚠️ Supabase nog niet geconfigureerd.');
    return false;
  }
  try {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
    document.getElementById('configBanner').style.display = 'none';
    return true;
  } catch(e) { console.error('Supabase init mislukt:', e); return false; }
}

// ══════════════════════════════════════════════════
// 2. AUTH
// ══════════════════════════════════════════════════
async function initAuth() {
  if (!sb) return;
  const { data: { session } } = await sb.auth.getSession();
  if (session?.user) await loadProfile(session.user);
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) await loadProfile(session.user);
    else if (event === 'SIGNED_OUT') { currentUser = null; updateNavAuth(); }
  });
}

async function loadProfile(user) {
  const { data } = await sb.from('aannemers').select('*').eq('auth_id', user.id).single();
  currentUser = data ? { ...data, email: user.email } : { auth_id: user.id, email: user.email, voornaam: user.email.split('@')[0], achternaam: '' };
  updateNavAuth();
}

function updateNavAuth() {
  const guest = document.getElementById('nav-guest');
  const loggedin = document.getElementById('nav-loggedin');
  if (currentUser) {
    guest.style.display = 'none';
    loggedin.style.display = 'flex';
    const ini = ((currentUser.voornaam?.[0]||'') + (currentUser.achternaam?.[0]||'')).toUpperCase() || '?';
    document.getElementById('nav-av').textContent = ini;
    document.getElementById('nav-uname').textContent = `${currentUser.voornaam||''} ${currentUser.achternaam?.[0]||''}.`.trim();
    document.getElementById('dd-name').textContent = `${currentUser.voornaam||''} ${currentUser.achternaam||''}`.trim();
    document.getElementById('dd-email').textContent = currentUser.email || '';
  } else {
    guest.style.display = 'flex';
    loggedin.style.display = 'none';
    closeDropdown();
  }
}

document.getElementById('nav-loggedin').addEventListener('click', (e) => {
  e.stopPropagation();
  const dd = document.getElementById('nav-dropdown');
  dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
});
document.addEventListener('click', () => closeDropdown());
function closeDropdown() { document.getElementById('nav-dropdown').style.display = 'none'; }

// ══════════════════════════════════════════════════
// 3. KLUSSEN LADEN + ARCHIVERING
// ══════════════════════════════════════════════════

// Archiveer verlopen klussen (deadline voorbij) — roept Supabase aan
async function archiveerVerlopenKlussen() {
  if (!sb) return;
  const vandaag = new Date().toISOString().split('T')[0];
  await sb
    .from('klussen')
    .update({ status: 'verlopen' })
    .eq('status', 'open')
    .lt('deadline', vandaag);
}

async function loadKlussen(reset = true) {
  if (!sb) { renderDemoKlussen(); return; }

  // Archiveer eerst verlopen klussen
  await archiveerVerlopenKlussen();

  if (reset) { klussensOffset = 0; allKlussen = []; }

  // Haal open klussen op — altijd gesorteerd op nieuwste eerst als basis
  let query = sb
    .from('klussen')
    .select('*', { count: 'exact' })
    .eq('status', 'open')
    .order('aangemaakt', { ascending: false })
    .range(klussensOffset, klussensOffset + PAGE_SIZE - 1);

  const { data, count, error } = await query;
  if (error) { showToast('Klussen laden mislukt', true); return; }

  allKlussen = reset ? (data || []) : [...allKlussen, ...(data || [])];
  klussensOffset += PAGE_SIZE;

  document.getElementById('kh-open').textContent = count || allKlussen.length;

  // Pas client-side filters toe
  applyFilters();

  const hasMore = count > klussensOffset;
  document.getElementById('loadMoreWrap').style.display = hasMore ? 'block' : 'none';
}

async function loadMore() {
  await loadKlussen(false);
}

// ══════════════════════════════════════════════════
// 4. FILTER SYSTEEM
// ══════════════════════════════════════════════════

function applyFilters() {
  let lijst = [...allKlussen];

  // 1. Zoekterm
  if (filterState.zoekterm) {
    const q = filterState.zoekterm.toLowerCase();
    lijst = lijst.filter(k =>
      (k.omschrijving||'').toLowerCase().includes(q) ||
      (k.type||'').toLowerCase().includes(q) ||
      (k.stad||'').toLowerCase().includes(q) ||
      (k.postcode||'').toLowerCase().includes(q)
    );
  }

  // 2. Categorieën — match op type veld (bevat de categorie-naam)
  if (filterState.categorieen.size < 8) {
    lijst = lijst.filter(k => {
      const type = (k.type || '').toLowerCase();
      for (const cat of filterState.categorieen) {
        if (type.includes(cat.toLowerCase())) return true;
      }
      // Als type niet matcht, check op Overig
      if (filterState.categorieen.has('Overig')) {
        const bekende = ['badkamer','keuken','dak','aanbouw','elektra','schilderwerk','vloeren'];
        if (!bekende.some(b => type.includes(b))) return true;
      }
      return false;
    });
  }

  // 3. Budget min/max
  lijst = lijst.filter(k => {
    const b = k.budget || 0;
    // Als budget null/0 is, toon altijd (onbekend budget)
    if (!k.budget) return true;
    return b >= filterState.budgetMin && b <= filterState.budgetMax;
  });

  // 4. Regio (postcode + radius) — met stad-naam fallback voor klussen zonder coords
  if (filterState.lat !== null && filterState.lng !== null) {
    lijst = lijst.filter(k => {
      if (k.lat && k.lng) {
        return haversineKm(filterState.lat, filterState.lng, k.lat, k.lng) <= filterState.radius;
      }
      // Fallback: gebruik bekende stadscoördinaten als lat/lng ontbreekt
      const sc = getStadCoords(k.stad || '');
      if (sc) return haversineKm(filterState.lat, filterState.lng, sc.lat, sc.lng) <= filterState.radius;
      return true; // zonder locatiedata altijd tonen
    });
  }

  // 5. Sortering
  if (filterState.sorteer === 'budget_hoog') {
    lijst.sort((a,b) => (b.budget||0) - (a.budget||0));
  } else if (filterState.sorteer === 'budget_laag') {
    lijst.sort((a,b) => (a.budget||0) - (b.budget||0));
  } else if (filterState.sorteer === 'deadline') {
    lijst.sort((a,b) => new Date(a.deadline||'9999') - new Date(b.deadline||'9999'));
  } else {
    // nieuwste eerst (default, data is al zo gesorteerd maar voor zekerheid)
    lijst.sort((a,b) => new Date(b.aangemaakt) - new Date(a.aangemaakt));
  }

  filteredKlussen = lijst;
  renderKlussen(lijst);
  document.getElementById('visCt').textContent = lijst.length;
  renderActiveFilterBar();
}

function renderActiveFilterBar() {
  const bar = document.getElementById('activeFiltersBar');
  const wrap = document.getElementById('af-tags-wrap');
  const tags = [];

  // Categorie tags
  const alle = ['Badkamer','Keuken','Dak','Aanbouw','Elektra','Schilderwerk','Vloeren','Overig'];
  const uitgesloten = alle.filter(c => !filterState.categorieen.has(c));
  if (uitgesloten.length > 0 && uitgesloten.length < alle.length) {
    tags.push({ label: `Niet: ${uitgesloten.join(', ')}`, key: 'cat' });
  }

  // Budget tag
  if (filterState.budgetMin > 0 || filterState.budgetMax < 50000) {
    const minStr = filterState.budgetMin > 0 ? `€${(filterState.budgetMin/1000).toFixed(0)}K` : '€0';
    const maxStr = filterState.budgetMax < 50000 ? `€${(filterState.budgetMax/1000).toFixed(0)}K` : '€50K+';
    tags.push({ label: `Budget: ${minStr} – ${maxStr}`, key: 'budget' });
  }

  // Regio tag
  if (filterState.postcode && filterState.lat !== null) {
    tags.push({ label: `📍 ${filterState.postcode.toUpperCase()} · ${filterState.radius} km`, key: 'regio' });
  }

  // Zoekterm tag
  if (filterState.zoekterm) {
    tags.push({ label: `🔍 "${filterState.zoekterm}"`, key: 'zoek' });
  }

  if (tags.length === 0) { bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  wrap.innerHTML = tags.map(t =>
    `<span class="af-tag" onclick="removeFilter('${t.key}')">${escHtml(t.label)} ×</span>`
  ).join('');
}

function removeFilter(key) {
  if (key === 'cat') {
    filterState.categorieen = new Set(['Badkamer','Keuken','Dak','Aanbouw','Elektra','Schilderwerk','Vloeren','Overig']);
    document.querySelectorAll('.cat-cb').forEach(cb => cb.checked = true);
  } else if (key === 'budget') {
    filterState.budgetMin = 0; filterState.budgetMax = 50000;
    document.getElementById('budgetMin').value = 0;
    document.getElementById('budgetMax').value = 50000;
    document.getElementById('budgetMinInput').value = '';
    document.getElementById('budgetMaxInput').value = '';
    updateDualFill();
    updateBudgetLabels();
  } else if (key === 'regio') {
    filterState.postcode = ''; filterState.lat = null; filterState.lng = null;
    document.getElementById('regio-postcode').value = '';
    document.getElementById('regio-radius-wrap').style.display = 'none';
    document.getElementById('regio-no-pc-msg').style.display = 'block';
    document.getElementById('regio-geocode-status').textContent = '';
  } else if (key === 'zoek') {
    filterState.zoekterm = '';
    document.getElementById('srchInput').value = '';
  }
  applyFilters();
}

function resetFilters() {
  filterState.zoekterm = '';
  filterState.categorieen = new Set(['Badkamer','Keuken','Dak','Aanbouw','Elektra','Schilderwerk','Vloeren','Overig']);
  filterState.budgetMin = 0; filterState.budgetMax = 50000;
  filterState.postcode = ''; filterState.lat = null; filterState.lng = null;
  filterState.radius = 15;

  document.querySelectorAll('.cat-cb').forEach(cb => cb.checked = true);
  document.getElementById('budgetMin').value = 0;
  document.getElementById('budgetMax').value = 50000;
  document.getElementById('budgetMinInput').value = '';
  document.getElementById('budgetMaxInput').value = '';
  document.getElementById('srchInput').value = '';
  document.getElementById('regio-postcode').value = '';
  document.getElementById('radiusRange').value = 15;
  document.getElementById('radiusLabel').textContent = '15 km';
  document.getElementById('regio-radius-wrap').style.display = 'none';
  document.getElementById('regio-no-pc-msg').style.display = 'block';
  document.getElementById('regio-geocode-status').textContent = '';
  updateDualFill();
  updateBudgetLabels();
  applyFilters();
  showToast('🔄 Filters gewist');
}

// ── Categorie ──────────────────────────────────
function onCatChange() {
  filterState.categorieen = new Set();
  document.querySelectorAll('.cat-cb:checked').forEach(cb => {
    filterState.categorieen.add(cb.value);
  });
  applyFilters();
}
// Koppel de onchange aan applyFilters via de echte categoriefunctie
document.querySelectorAll && document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.cat-cb').forEach(cb => {
    cb.addEventListener('change', onCatChange);
  });
});

// ── Dual budget slider ─────────────────────────
function onDualRange() {
  let min = parseInt(document.getElementById('budgetMin').value);
  let max = parseInt(document.getElementById('budgetMax').value);
  if (min > max) { [min, max] = [max, min]; }
  filterState.budgetMin = min;
  filterState.budgetMax = max;
  updateDualFill();
  updateBudgetLabels();
  applyFilters();
}

function onBudgetInputChange(which) {
  const raw = document.getElementById(which === 'min' ? 'budgetMinInput' : 'budgetMaxInput').value.replace(/[^0-9]/g,'');
  const val = raw ? Math.min(parseInt(raw), 50000) : (which === 'min' ? 0 : 50000);
  if (which === 'min') {
    filterState.budgetMin = val;
    document.getElementById('budgetMin').value = val;
  } else {
    filterState.budgetMax = val;
    document.getElementById('budgetMax').value = val;
  }
  updateDualFill();
  updateBudgetLabels();
  applyFilters();
}

function updateDualFill() {
  const min = parseInt(document.getElementById('budgetMin').value);
  const max = parseInt(document.getElementById('budgetMax').value);
  const pct1 = (min / 50000) * 100;
  const pct2 = (max / 50000) * 100;
  const fill = document.getElementById('dualFill');
  if (fill) { fill.style.left = pct1 + '%'; fill.style.width = (pct2 - pct1) + '%'; }
}

function updateBudgetLabels() {
  const min = parseInt(document.getElementById('budgetMin').value);
  const max = parseInt(document.getElementById('budgetMax').value);
  document.getElementById('budgetMinLabel').textContent = min > 0 ? '€ ' + min.toLocaleString('nl-NL') : '€ 0';
  document.getElementById('budgetMaxLabel').textContent = max >= 50000 ? '€ 50.000+' : '€ ' + max.toLocaleString('nl-NL');
}

// ── Regio / postcode + radius ──────────────────
let geocodeTimer = null;

function setQuickCity(city) {
  const pcInput = document.getElementById('regio-postcode');
  pcInput.value = city;
  onRegioPcInput();
}

function onRegioPcInput() {
  const val = document.getElementById('regio-postcode').value.trim();
  filterState.postcode = val;
  clearTimeout(geocodeTimer);

  if (val.length < 2) {
    filterState.lat = null; filterState.lng = null;
    document.getElementById('regio-radius-wrap').style.display = 'none';
    document.getElementById('regio-no-pc-msg').style.display = 'block';
    document.getElementById('regio-geocode-status').textContent = '';
    applyFilters();
    return;
  }

  document.getElementById('regio-geocode-status').textContent = '⏳ Locatie opzoeken…';
  geocodeTimer = setTimeout(() => geocodePostcode(val), 700);
}

async function fetchCoordsForPostcode(pc) {
  const clean = pc.trim();
  const cacheKey = clean.toLowerCase();
  if (geocodeCache[cacheKey]) return geocodeCache[cacheKey];
  try {
    const isPostcode = /^[1-9][0-9]{3}\s?[a-zA-Z]{0,2}$/.test(clean);
    const apiQuery = isPostcode ? `postalcode=${encodeURIComponent(clean.replace(/\s/g,''))}` : `q=${encodeURIComponent(clean)}`;
    const url = `https://nominatim.openstreetmap.org/search?${apiQuery}&countrycodes=nl&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'nl' } });
    const data = await res.json();
    if (data && data[0]) {
      const weergaveNaam = isPostcode ? data[0].display_name.split(',')[0] : (clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase());
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), naam: weergaveNaam };
      geocodeCache[cacheKey] = coords;
      return coords;
    }
  } catch(e) { console.warn('Geocoding mislukt:', e); }
  return null;
}

async function geocodePostcode(pc) {
  const coords = await fetchCoordsForPostcode(pc);
  if (coords) {
    onGeocodeSuccess(coords, pc);
  } else {
    document.getElementById('regio-geocode-status').textContent = '⚠️ Locatie niet gevonden. Spelfoutje?';
    filterState.lat = null; filterState.lng = null;
  }
}

function onGeocodeSuccess(coords, pc) {
  filterState.lat = coords.lat;
  filterState.lng = coords.lng;
  const r = filterState.radius;
  document.getElementById('regio-geocode-status').textContent = `✅ ${coords.naam || pc.toUpperCase()}`;
  document.getElementById('regio-radius-wrap').style.display = 'block';
  document.getElementById('regio-no-pc-msg').style.display = 'none';
  updateRadiusPreview();
  applyFilters();
}

function onRadiusChange() {
  filterState.radius = parseInt(document.getElementById('radiusRange').value);
  document.getElementById('radiusLabel').textContent = filterState.radius + ' km';
  updateRadiusPreview();
  applyFilters();
}

function updateRadiusPreview() {
  const locNaam = document.getElementById('regio-postcode').value.trim() || '—';
  const r = filterState.radius;
  // Tel klussen in radius met fallback
  let cnt = 0;
  if (filterState.lat !== null) {
    allKlussen.forEach(k => {
      if (k.lat && k.lng) {
        if (haversineKm(filterState.lat, filterState.lng, k.lat, k.lng) <= r) cnt++;
      } else {
        const sc = getStadCoords(k.stad || '');
        if (sc) { if (haversineKm(filterState.lat, filterState.lng, sc.lat, sc.lng) <= r) cnt++; }
        else cnt++; // geen locatie: altijd tonen
      }
    });
  }
  const el = document.getElementById('regio-preview');
  if (el) el.innerHTML = `📍 <strong>${escHtml(locNaam)}</strong> · ${r} km straal&nbsp; <span style="color:var(--blue-light);font-weight:700">${cnt} klus${cnt!==1?'sen':''}</span>`;
}

// ── Haversine afstandsberekening ───────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ── Sortering ──────────────────────────────────
function onSortChange(val) {
  filterState.sorteer = val;
  applyFilters();
}

// ── Zoekterm ───────────────────────────────────
function onZoekInput() {
  filterState.zoekterm = (document.getElementById('srchInput').value || '').trim();
  applyFilters();
}

// ══════════════════════════════════════════════════
// 5. KLUSSEN RENDEREN
// ══════════════════════════════════════════════════
function renderKlussen(lijst) {
  const container = document.getElementById('cardsList');
  if (!lijst || lijst.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--gray-text)">
        <div style="margin-bottom:14px"><i data-lucide="inbox" style="width:48px;height:48px;color:var(--gray-text);opacity:0.6"></i></div>
        <div style="font-size:17px;font-weight:700;color:var(--text-dark);margin-bottom:6px">Geen klussen gevonden</div>
        <p style="font-size:14px">Pas je filters aan of kom later terug.</p>
        <button onclick="resetFilters()" class="btn-p" style="margin-top:18px;font-size:14px;padding:10px 22px">Filters wissen</button>
      </div>`;
    return;
  }
  container.innerHTML = lijst.map(k => buildKlusCard(k)).join('');
  if (window.lucide) lucide.createIcons();
}

function buildKlusCard(k) {
  const budget   = k.budget ? `€ ${k.budget.toLocaleString('nl-NL')}` : 'Nader te bepalen';
  const deadline = k.deadline ? new Date(k.deadline).toLocaleDateString('nl-NL', {day:'numeric',month:'short',year:'numeric'}) : '—';
  const verlooptBinnen3 = k.deadline && (new Date(k.deadline) - new Date()) < 3*24*60*60*1000;
  const isNew    = (Date.now() - new Date(k.aangemaakt)) < 24*60*60*1000;
  const initials = ((k.naam_klant || 'K')[0]).toUpperCase();

  let distanceHtml = '';
  if (filterState.lat !== null && filterState.lng !== null && k.lat && k.lng) {
    const d = haversineKm(filterState.lat, filterState.lng, k.lat, k.lng);
    distanceHtml = `<div class="c-meta-item"><i data-lucide="map-pin" style="width:14px;height:14px"></i> <strong>${escHtml(k.stad || k.postcode || '—')}</strong> <span style="color:var(--blue-light);font-weight:700;margin-left:4px;">• ${d.toFixed(1)} km verderop</span></div>`;
  }

  return `
  <div class="klus-card ${isNew?'is-new':''}" data-id="${k.id}">
    <div class="c-toprow">
      <div class="c-badges">
        <span class="badge b-cat"><i data-lucide="${getCatIcon(k.type)}"></i> ${escHtml((k.type || 'Overig').replace(/[\u1000-\uFFFF🚿🍳🔨🏠⚡🎨🪵📦🏡🪟]/g, '').trim())}</span>
        ${isNew ? '<span class="badge b-new"><i data-lucide="sparkles" style="width:12px;height:12px;margin-right:2px;stroke-width:2.5"></i>Nieuw</span>' : ''}
        ${verlooptBinnen3 ? '<span class="badge b-urg"><i data-lucide="clock" style="width:12px;height:12px;margin-right:2px;stroke-width:2.5"></i>Verloopt snel</span>' : ''}
      </div>
    </div>
    <div class="poster-row">
      <div class="p-av">${initials}</div>
      <span class="p-name">${escHtml(k.naam_klant || 'Klant')}</span>
      <span class="p-dot">·</span>
      <span class="p-time">${timeSince(k.aangemaakt)}</span>
    </div>
    <div class="c-title">${escHtml((k.omschrijving||'').substring(0,80))}</div>
    <div class="c-desc">${escHtml(k.omschrijving || '')}</div>
    <div class="c-meta">
      ${distanceHtml ? distanceHtml : `<div class="c-meta-item"><i data-lucide="map-pin" style="width:14px;height:14px"></i> <strong>${escHtml(k.stad || k.postcode || '—')}</strong></div>`}
      ${k.woningtype ? `<div class="c-meta-item"><i data-lucide="home" style="width:14px;height:14px"></i> ${escHtml(k.woningtype)}</div>` : ''}
      ${k.budget ? `<div class="c-meta-item"><i data-lucide="coins" style="width:14px;height:14px"></i> ${budget}</div>` : ''}
    </div>
    <div class="c-footer">
      <div class="c-fl">
        <div class="bud-box">
          <span class="bud-lbl">Richtbudget</span>
          <div class="bud-amt">${budget} <span>incl. BTW</span></div>
        </div>
        <div class="ddl-box">
          <span class="ddl-lbl">Deadline</span>
          <div class="ddl-val ${verlooptBinnen3 ? 'urg' : ''}">${deadline}</div>
        </div>
      </div>
      <div class="c-fr">
        <button class="btn-save" onclick="toggleSave(this)"><i data-lucide="heart" style="width:18px;height:18px;margin:0"></i></button>
        <button class="btn-aanbieden" onclick="tryAanbieden('${escAttr((k.omschrijving||'').substring(0,60))}','${escAttr(k.stad||k.postcode||'')}','${budget}','${k.id}')">Aanbieden →</button>
      </div>
    </div>
  </div>`;
}

// Typo verlooptBinnen3 is inmiddels opgelost in de rendering

function renderDemoKlussen() {
  const demo = [
    {id:'demo-1',type:'Badkamer',omschrijving:'Volledige badkamer renovatie — ca. 8 m², inclusief nieuwe inloopdouche en vloerverwarming.',stad:'Amsterdam',postcode:'1091AA',budget:8500,deadline:new Date(Date.now()+10*86400000).toISOString().split('T')[0],naam_klant:'Sandra V.',aangemaakt:new Date(Date.now()-2*3600000).toISOString(),woningtype:'Tussenwoning',lat:52.3676,lng:4.9041},
    {id:'demo-2',type:'Dak & Gevel',omschrijving:'Dakkapel plaatsen — voorzijde jaren \'30 woning, ca. 4,5 m breed. Vergunning in behandeling.',stad:'Rotterdam',postcode:'3071KK',budget:14000,deadline:new Date(Date.now()+20*86400000).toISOString().split('T')[0],naam_klant:'Mark K.',aangemaakt:new Date(Date.now()-26*3600000).toISOString(),woningtype:'Hoekwoning',lat:51.9244,lng:4.4777},
    {id:'demo-3',type:'Elektra',omschrijving:'Meterkast vervangen + 12 groepen verdelen, aardlekschakelaar. Woning uit 1978.',stad:'Utrecht',postcode:'3511BX',budget:2200,deadline:new Date(Date.now()+2*86400000).toISOString().split('T')[0],naam_klant:'Thomas H.',aangemaakt:new Date(Date.now()-3*3600000).toISOString(),woningtype:'Appartement',lat:52.0907,lng:5.1214},
    {id:'demo-4',type:'Keuken',omschrijving:'Keuken renovatie — nieuwe opstelling + kookeiland 14m². IKEA kastjes worden geleverd.',stad:'Den Haag',postcode:'2595BN',budget:12000,deadline:new Date(Date.now()+30*86400000).toISOString().split('T')[0],naam_klant:'Linda P.',aangemaakt:new Date(Date.now()-1*3600000).toISOString(),woningtype:'Vrijstaand',lat:52.0705,lng:4.3007},
    {id:'demo-5',type:'Schilderwerk',omschrijving:'Schilderwerk buiten — ca. 20 kozijnen schuren en schilderen. Tweelaags systeem.',stad:'Haarlem',postcode:'2015BN',budget:3800,deadline:new Date(Date.now()+40*86400000).toISOString().split('T')[0],naam_klant:'Johan B.',aangemaakt:new Date(Date.now()-48*3600000).toISOString(),woningtype:'Hoekwoning',lat:52.3873,lng:4.6462},
    {id:'demo-6',type:'Aanbouw',omschrijving:'Zolder ombouwen tot 2 slaapkamers + badkamer, 65m². Incl. dakramen en isolatie.',stad:'Amsterdam',postcode:'1055AB',budget:22000,deadline:new Date(Date.now()+60*86400000).toISOString().split('T')[0],naam_klant:'Anne W.',aangemaakt:new Date(Date.now()-5*3600000).toISOString(),woningtype:'Herenhuis',lat:52.3785,lng:4.8633},
  ];
  allKlussen = demo;
  filterState.sorteer = 'nieuwste';
  applyFilters();
  document.getElementById('kh-open').textContent = demo.length;
  updateCatCounts(demo);
}

function updateCatCounts(lijst) {
  const cats = {Badkamer:0,Keuken:0,Dak:0,Aanbouw:0,Elektra:0,Schilderwerk:0,Vloeren:0,Overig:0};
  lijst.forEach(k => {
    const t = (k.type||'').toLowerCase();
    if (t.includes('badkamer')) cats.Badkamer++;
    else if (t.includes('keuken')) cats.Keuken++;
    else if (t.includes('dak')) cats.Dak++;
    else if (t.includes('aanbouw') || t.includes('zolder')) cats.Aanbouw++;
    else if (t.includes('elektra')) cats.Elektra++;
    else if (t.includes('schilderwerk')) cats.Schilderwerk++;
    else if (t.includes('vloer')) cats.Vloeren++;
    else cats.Overig++;
  });
  Object.entries(cats).forEach(([c,n]) => {
    const el = document.getElementById(`cnt-${c.toLowerCase()}`);
    if (el) el.textContent = n;
  });
}

// ══════════════════════════════════════════════════
// 6. STATISTIEKEN
// ══════════════════════════════════════════════════
async function loadStats() {
  if (!sb) {
    document.getElementById('stat-aannemers').textContent = '4.800+';
    document.getElementById('stat-klussen').textContent = '23K';
    document.getElementById('kh-new').textContent = '—';
    return;
  }
  const today = new Date().toISOString().split('T')[0];
  const [{ count: totaal }, { count: aannemers }, { count: vandaag }] = await Promise.all([
    sb.from('klussen').select('*',{count:'exact',head:true}),
    sb.from('aannemers').select('*',{count:'exact',head:true}),
    sb.from('klussen').select('*',{count:'exact',head:true}).gte('aangemaakt',today),
  ]);
  document.getElementById('stat-aannemers').textContent = aannemers ? aannemers.toLocaleString('nl-NL') : '4.800+';
  document.getElementById('stat-klussen').textContent = totaal ? totaal.toLocaleString('nl-NL') : '23K';
  document.getElementById('kh-new').textContent = vandaag || '0';
}

// ══════════════════════════════════════════════════
// 7. KLUS PLAATSEN
// ══════════════════════════════════════════════════
async function submitHeroForm() {
  const omschrijving = document.getElementById('hf-omschrijving').value.trim();
  const postcode     = document.getElementById('hf-postcode').value.trim();
  const email        = document.getElementById('hf-email').value.trim();
  const budgetRaw    = document.getElementById('hf-budget').value.replace(/[^0-9]/g,'');
  if (!omschrijving || !postcode || !email) { showToast('⚠️ Vul omschrijving, postcode en e-mail in', true); return; }
  if (!email.includes('@')) { showToast('⚠️ Vul een geldig e-mailadres in', true); return; }
  const selectedType = [...document.querySelectorAll('.hf-chip.on')].map(c => c.textContent.trim()).join(', ');
  
  const btn = document.getElementById('hf-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Locatie zoeken…';
  const coords = await fetchCoordsForPostcode(postcode);
  
  await insertKlus({ type: selectedType||'Overig', omschrijving, postcode, lat: coords?.lat||null, lng: coords?.lng||null, budget: budgetRaw?parseInt(budgetRaw):null, email_klant: email, naam_klant: email.split('@')[0], status: 'open' }, 'hf-btn');
}

async function submitFullForm() {
  const omschrijving = document.getElementById('full-omschrijving').value.trim();
  const postcode     = document.getElementById('full-postcode').value.trim();
  const email        = document.getElementById('full-email').value.trim();
  const fname        = document.getElementById('full-fname').value.trim();
  const lname        = document.getElementById('full-lname').value.trim();
  const budgetRaw    = document.getElementById('full-budget').value.replace(/[^0-9]/g,'');
  const deadline     = document.getElementById('full-deadline').value;
  if (!omschrijving||!postcode||!email||!fname||!lname||!deadline) { showToast('⚠️ Vul alle verplichte velden (*) in', true); return; }
  const selectedType = [...document.querySelectorAll('#full-chips .chip.on')].map(c => c.textContent.trim()).join(', ');
  
  const btn = document.getElementById('full-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Locatie zoeken…';
  const coords = await fetchCoordsForPostcode(postcode);
  
  await insertKlus({ type: selectedType||'Overig', omschrijving, postcode, stad: document.getElementById('full-stad').value.trim(), lat: coords?.lat||null, lng: coords?.lng||null, budget: budgetRaw?parseInt(budgetRaw):null, deadline: deadline||null, email_klant: email, naam_klant: `${fname} ${lname}`, telefoon: document.getElementById('full-telefoon').value.trim(), woningtype: document.getElementById('full-woningtype').value, uitvoering: document.getElementById('full-uitvoering').value.trim(), status: 'open' }, 'full-btn');
}

async function insertKlus(payload, btnId) {
  const btn = document.getElementById(btnId);
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Publiceren…';
  if (!sb) {
    await new Promise(r => setTimeout(r, 900));
    btn.disabled = false; btn.innerHTML = '<span>Klus publiceren</span><span>→</span>';
    showKlusBevestiging('demo-123', 'demo-token', payload.omschrijving);
    return;
  }
  // FIX: genereer beheer_token client-side zodat we niet op DB-response hoeven te wachten
  const beheerToken = crypto.randomUUID();
  payload.beheer_token = beheerToken;
  const { data, error } = await sb.from('klussen').insert(payload).select('id').single();
  btn.disabled = false; btn.innerHTML = '<span>Klus publiceren</span><span>→</span>';
  if (error) { showToast('❌ Opslaan mislukt: ' + error.message, true); }
  else if (data && data.id) {
    // Sla op in localStorage voor apparaat-herkenning
    let klussen = [];
    try { klussen = JSON.parse(localStorage.getItem('klushub_geplaatste_klussen')) || []; } catch(e){}
    klussen.unshift({ id: data.id, token: beheerToken, omschrijving: payload.omschrijving, datum: Date.now() });
    localStorage.setItem('klushub_geplaatste_klussen', JSON.stringify(klussen));
    showKlusBevestiging(data.id, beheerToken, payload.omschrijving);
  } else {
    showToast('✅ Klus gepubliceerd!');
    setTimeout(() => { showPage('klussen'); switchP('klussen'); loadKlussen(); }, 1400);
  }
}

// ══════════════════════════════════════════════════
// 8. MIJN KLUSSEN (klantdashboard + archief)
// ══════════════════════════════════════════════════
async function openMijnKlussen() {
  document.getElementById('mijnKlussenOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  await loadMijnKlussen();
}
function closeMijnKlussen() {
  document.getElementById('mijnKlussenOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function loadMijnKlussen() {
  const body = document.getElementById('mkp-body');
  body.innerHTML = '<div class="mkp-empty"><div class="e-ico"><div class="spinner spinner-dark" style="width:24px;height:24px;border-width:2px;margin-bottom:8px"></div></div><div style="font-size:15px;font-weight:600">Laden…</div></div>';

  if (!sb || !currentUser || !currentUser.id) {
    body.innerHTML = '<div class="mkp-empty"><div class="e-ico"><i data-lucide="lock" style="width:40px;height:40px;opacity:0.5"></i></div><div style="font-size:15px;font-weight:600">Log in om jouw aanbiedingen te zien</div></div>';
    return;
  }

  // Aanbiedingen ophalen (samen met gekoppelde klus data)
  const { data, error } = await sb
    .from('aanbiedingen')
    .select('*, klussen(*)')
    .eq('aannemer_id', currentUser.id)
    .order('aangemaakt', { ascending: false });

  if (error) { body.innerHTML = '<div class="mkp-empty"><div class="e-ico"><i data-lucide="alert-circle" style="width:40px;height:40px;color:#DC2626;margin:0 auto 12px"></i></div><div>Laden mislukt</div></div>'; return; }
  
  if (!data || data.length === 0) {
    body.innerHTML = `
      <div class="mkp-empty">
        <div class="e-ico"><i data-lucide="inbox" style="width:40px;height:40px;opacity:0.5"></i></div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px">Nog geen aanbiedingen verstuurd</div>
        <p style="font-size:13px;margin-bottom:16px">Verstuur je eerste aanbieding op een klus en krijg vaker werk.</p>
        <button class="btn-p" style="font-size:14px;padding:10px 22px" onclick="closeMijnKlussen();showPage('klussen');">Zoek klussen →</button>
      </div>`;
    document.getElementById('mkp-subtitle').textContent = '0 aanbiedingen';
    if (window.lucide) lucide.createIcons();
    return;
  }

  document.getElementById('mkp-subtitle').textContent = `${data.length} aanbieding${data.length!==1?'en':''} verstuurd`;

  const now = new Date();
  body.innerHTML = data.map(aanb => {
    const k = aanb.klussen;
    const isVerlopen = k.status === 'open' && k.deadline && new Date(k.deadline) < now;
    const klusStatus = isVerlopen ? 'verlopen' : k.status;
    const statusLabels = { open:'Klus Open', gesloten:'Klus Gesloten', verlopen:'Klus Verlopen', geannuleerd:'Klus Geannuleerd' };
    
    // Status van de aanbieding zelf
    const ast = aanb.status;
    const aLabels = { in_behandeling: '⏳ In Behandeling', geaccepteerd: '✅ Geaccepteerd', afgewezen: '❌ Afgewezen' };
    const aColors = { in_behandeling: '#eab308', geaccepteerd: '#22c55e', afgewezen: '#ef4444' }; // yellow-500, green-500, red-500
    const aBgColors = { in_behandeling: '#fef08a20', geaccepteerd: '#bbf7d020', afgewezen: '#fecaca20' };

    const budget = k.budget ? `€ ${k.budget.toLocaleString('nl-NL')}` : '—';
    const prijs = aanb.prijs ? `€ ${aanb.prijs.toLocaleString('nl-NL')}` : '—';
    const datum = new Date(aanb.aangemaakt).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'});

    return `
    <div class="mkp-klus" style="border-left: 3px solid ${aColors[ast]}">
      <div class="mkp-klus-top">
        <div class="mkp-klus-title">${escHtml((k.omschrijving||'').substring(0,70))}</div>
        <span class="mkp-status" style="background:${aBgColors[ast]}; color:${aColors[ast]}; border: 1px solid ${aColors[ast]}40">${aLabels[ast]||ast}</span>
      </div>
      <div class="mkp-meta" style="margin-top:8px; line-height:1.5">
        <div style="margin-bottom:4px"><i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;vertical-align:-1px"></i> ${escHtml(k.stad||k.postcode||'—')} · Budget: ${budget} · <strong>Jouw aanbod: ${prijs}</strong></div>
        <span style="font-size:12px;color:var(--gray-text)">Status klus: <strong>${statusLabels[klusStatus]||klusStatus}</strong> · Aanbieding verstuurd op ${datum}</span>
      </div>
    </div>`;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

// ══════════════════════════════════════════════════
// 8b. KLANT BEHEER (via beheer_token / localStorage)
// ══════════════════════════════════════════════════

function openGeplaatsteKlussen() {
  document.getElementById('geplaatsteKlussenOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  let klussen = [];
  try { klussen = JSON.parse(localStorage.getItem('klushub_geplaatste_klussen')) || []; } catch(e){}
  
  const body = document.getElementById('gk-body');
  if (klussen.length === 0) {
    body.innerHTML = `
      <div class="mkp-empty">
        <div class="e-ico"><i data-lucide="inbox" style="width:40px;height:40px;opacity:0.5"></i></div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px">Geen klussen gevonden</div>
        <p style="font-size:13px;margin-bottom:16px">Er zijn op dit apparaat geen klussen opgeslagen. Controleer de e-mail met je beheer-link als je er via een ander apparaat eentje hebt geplaatst.</p>
        <button class="btn-p" style="font-size:14px;padding:10px 22px" onclick="closeGeplaatsteKlussen();goLanding('#hero-top');">Klus plaatsen →</button>
      </div>`;
  } else {
    body.innerHTML = klussen.map(k => {
      const datum = new Date(k.datum).toLocaleDateString('nl-NL',{day:'numeric',month:'short',year:'numeric'});
      return `
      <div class="mkp-klus">
        <div class="mkp-klus-top">
          <div class="mkp-klus-title">${escHtml((k.omschrijving||'').substring(0,70))}...</div>
        </div>
        <div class="mkp-meta" style="margin-top:8px">Geplaatst op ${datum}</div>
        <div class="mkp-btns">
          <button class="mkp-btn" style="background:var(--blue-light);color:white;border-color:var(--blue-light)" onclick="closeGeplaatsteKlussen(); openKlantBeheer('${k.id}', '${k.token}')">Beheren & Aanbiedingen zien →</button>
        </div>
      </div>`;
    }).join('');
  }
  if (window.lucide) lucide.createIcons();
}

function closeGeplaatsteKlussen() {
  document.getElementById('geplaatsteKlussenOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeKlantBeheer() {
  document.getElementById('klantBeheerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function openKlantBeheer(klusId, token) {
  document.getElementById('klantBeheerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  const body = document.getElementById('kb-body');
  body.innerHTML = '<div class="mkp-empty"><div class="e-ico"><div class="spinner spinner-dark" style="width:24px;height:24px;border-width:2px;margin-bottom:8px"></div></div><div style="font-size:15px;font-weight:600">Klus & Aanbiedingen laden…</div></div>';

  if (!sb) {
    body.innerHTML = '<div class="mkp-empty">Demo modus: geen backend gekoppeld.</div>';
    return;
  }

  // Roep de beveiligde Postgres RPC functie aan
  const { data, error } = await sb.rpc('get_klus_beheer', { p_klus_id: klusId, p_token: token });
  
  if (error || !data) {
    body.innerHTML = `
      <div class="mkp-empty">
        <div class="e-ico"><i data-lucide="alert-triangle" style="width:40px;height:40px;color:#DC2626;margin:0 auto 12px"></i></div>
        <div style="font-size:15px;font-weight:600">Toegang geweigerd</div>
        <p style="font-size:13px;margin-top:6px">Oeps, heb je de juiste beheer-link? Deze klus is niet gevonden of je hebt geen toegang.</p>
      </div>`;
    return;
  }

  const k = data;
  const isVerlopen = k.status === 'open' && k.deadline && new Date(k.deadline) < new Date();
  const klusStatus = isVerlopen ? 'verlopen' : k.status;
  const statusLabels = { open:'🚀 Klus is Open', gesloten:'🔒 Gesloten', verlopen:'Klus Verlopen', geannuleerd:'Geannuleerd' };
  
  const aanbiedingen = k.aanbiedingen_data || [];
  const magicLink = window.location.origin + window.location.pathname + `?beheer=${k.id}&token=${k.beheer_token}`;

  let html = `
    <div style="background:var(--gray-soft); padding:16px; border-radius:12px; margin-bottom:20px; border:1px solid var(--gray-border)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <h3 style="font-size:16px;font-weight:800;color:var(--text-dark);margin:0">${escHtml(k.omschrijving)}</h3>
        <span class="mkp-status ${klusStatus}">${statusLabels[klusStatus]||klusStatus}</span>
      </div>
      <div style="font-size:13px;color:var(--gray-text);line-height:1.5">
        <ul style="list-style:none;padding:0;margin:0 0 12px 0;display:flex;gap:16px;flex-wrap:wrap">
          <li><i data-lucide="map-pin" style="width:12px;height:12px;display:inline-block;vertical-align:-1px"></i> ${escHtml(k.stad||k.postcode||'—')}</li>
          <li><i data-lucide="coins" style="width:12px;height:12px;display:inline-block;vertical-align:-1px"></i> Budget: ${k.budget ? `€ ${k.budget.toLocaleString('nl-NL')}` : 'Nader te bepalen'}</li>
        </ul>
        <div style="background:white;padding:10px;border-radius:8px;border:1px solid var(--gray-border);display:flex;align-items:center;gap:12px">
          <div style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">
            <strong>Beheer-link:</strong> <a href="${magicLink}" style="color:var(--blue-main)">${magicLink}</a>
          </div>
          <button class="mkp-btn" style="flex-shrink:0" onclick="navigator.clipboard.writeText('${magicLink}'); showToast('Beheer-link gekopieerd!');">Kopieer link</button>
        </div>
      </div>
      <div style="margin-top:16px; display:flex; gap:10px;">
        ${klusStatus === 'open' ? `<button class="mkp-btn mkp-btn-close" onclick="beheerSluitKlus('${k.id}', '${k.beheer_token}')"><i data-lucide="x" style="width:14px;height:14px;vertical-align:-2px"></i> Klus Sluiten</button>` : `<button class="mkp-btn mkp-btn-reopen" onclick="beheerOpenKlus('${k.id}', '${k.beheer_token}')"><i data-lucide="rotate-ccw" style="width:14px;height:14px;vertical-align:-2px"></i> Heropenen</button>`}
      </div>
    </div>
  `;

  if (aanbiedingen.length === 0) {
    html += `
      <div class="mkp-empty" style="padding:30px 20px; border:1px dashed var(--gray-border);">
        <div class="e-ico"><i data-lucide="hourglass" style="width:32px;height:32px;opacity:0.4"></i></div>
        <div style="font-size:15px;font-weight:600;margin-bottom:6px">Wachten op aanbiedingen...</div>
        <p style="font-size:13px;">Zodra aannemers reageren, verschijnen ze direct hier in het dashboard.</p>
      </div>`;
  } else {
    html += `<h4 style="font-size:14px;font-weight:700;margin-bottom:12px;color:var(--text-dark)">Ontvangen aanbiedingen (${aanbiedingen.length})</h4>`;
    
    html += aanbiedingen.map(a => {
      const isGeaccepteerd = a.status === 'geaccepteerd';
      const isAfgewezen = a.status === 'afgewezen';
      const prijs = a.prijs ? `€ ${a.prijs.toLocaleString('nl-NL')}` : '—';
      
      let callToAction = '';
      if (a.status === 'in_behandeling') {
        const aanNaam = escAttr((a.bedrijfsnaam || ((a.voornaam||'') + ' ' + (a.achternaam||'')).trim()));
        const aanId = a.aannemer_id || '';
        callToAction = `
          <button class="mkp-btn" style="background:#22c55e;border-color:#22c55e;color:white;font-size:14px;padding:9px 16px" onclick="beheerKiesAannemer('${k.id}', '${k.beheer_token}', '${a.id}', '${aanNaam}', '${aanId}')"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px"></i> Kies deze aannemer</button>
          <button class="mkp-btn mkp-btn-close" onclick="beheerAccepteerBod('${k.id}', '${k.beheer_token}', '${a.id}', 'afgewezen')">Afwijzen</button>
        `;
      } else if (isGeaccepteerd) {
        callToAction = `<span style="color:#22c55e;font-weight:700;font-size:13px"><i data-lucide="check-circle" style="width:14px;height:14px;vertical-align:-2px"></i> Bod Geaccepteerd</span>`;
      } else if (isAfgewezen) {
        callToAction = `<span style="color:#ef4444;font-weight:700;font-size:13px"><i data-lucide="x-circle" style="width:14px;height:14px;vertical-align:-2px"></i> Bod Afgewezen</span>`;
      }

      return `
      <div class="mkp-klus" style="border-left: 3px solid ${isGeaccepteerd?'#22c55e':isAfgewezen?'#ef4444':'var(--blue-main)'}; padding:14px; margin-bottom:12px">
        <div class="mkp-klus-top" style="align-items:flex-start">
          <div style="flex:1">
            <div style="font-size:16px;font-weight:800;color:var(--text-dark);margin-bottom:2px">${escHtml(a.bedrijfsnaam || a.voornaam + ' ' + a.achternaam)}</div>
            <div style="font-size:12px;color:var(--gray-text)"><i data-lucide="map-pin" style="width:10px;height:10px;display:inline-block"></i> ${escHtml(a.aannemer_stad || '—')} · ${escHtml(a.specialisme || 'Specialist')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:800;color:var(--blue-dark);font-family:'Barlow Condensed',sans-serif">${prijs}</div>
            <div style="font-size:11px;color:var(--gray-text)">Doorlooptijd: <strong>${escHtml(a.doorlooptijd || 'In overleg')}</strong></div>
          </div>
        </div>
        ${a.bericht ? `<div style="margin-top:10px;padding:10px;background:#f8fafc;border-radius:6px;font-size:13px;color:var(--text-dark);line-height:1.4"><em>"${escHtml(a.bericht)}"</em></div>` : ''}
        <div style="margin-top:14px; display:flex; gap:10px; align-items:center;">
          ${callToAction}
        </div>
      </div>`;
    }).join('');
  }

  body.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

async function beheerSluitKlus(klusId, token) {
  if (!confirm('Weet je zeker dat je deze klus wilt sluiten voor nieuwe aanbiedingen?')) return;
  const { data, error } = await sb.rpc('beheer_update_klus_status', { p_klus_id: klusId, p_token: token, p_status: 'gesloten' });
  if (error) showToast('Fout bij sluiten klus', true);
  else { showToast('✅ Klus succesvol gesloten!'); openKlantBeheer(klusId, token); }
}

async function beheerOpenKlus(klusId, token) {
  const { data, error } = await sb.rpc('beheer_update_klus_status', { p_klus_id: klusId, p_token: token, p_status: 'open' });
  if (error) showToast('Fout bij verversen klus', true);
  else { showToast('✅ Klus staat weer open!'); openKlantBeheer(klusId, token); }
}

async function beheerAccepteerBod(klusId, token, aanbiedingId, status) {
  if (status === 'geaccepteerd' && !confirm('Weet je zeker dat je dit bod definitief wilt accepteren? Andere aannemers worden hierna mogelijk afgewezen.')) return;
  const { data, error } = await sb.rpc('beheer_update_aanbieding', { p_klus_id: klusId, p_token: token, p_aanbieding_id: aanbiedingId, p_status: status });
  if (error) showToast('Fout bij updaten bod', true);
  else { showToast('✅ Status bod bijgewerkt!'); openKlantBeheer(klusId, token); }
}

// ── Edit klus ──────────────────────────────────
let editingKlus = null;

async function openEditKlus(id) {
  if (!sb) { showToast('Demo modus: werkt met echte Supabase'); return; }
  const { data, error } = await sb.from('klussen').select('*').eq('id', id).single();
  if (error||!data) { showToast('Klus laden mislukt', true); return; }
  editingKlus = data;

  document.getElementById('edit-klus-id').value = id;
  document.getElementById('edit-omschrijving').value = data.omschrijving || '';
  document.getElementById('edit-budget').value = data.budget ? `€ ${data.budget.toLocaleString('nl-NL')}` : '';
  document.getElementById('edit-deadline').value = data.deadline || '';
  document.getElementById('edit-postcode').value = data.postcode || '';
  document.getElementById('edit-stad').value = data.stad || '';

  document.getElementById('editOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditKlus() {
  document.getElementById('editOverlay').classList.remove('open');
  document.body.style.overflow = '';
  editingKlus = null;
}

async function saveEditKlus() {
  const id         = document.getElementById('edit-klus-id').value;
  const omschr     = document.getElementById('edit-omschrijving').value.trim();
  const budgetRaw  = document.getElementById('edit-budget').value.replace(/[^0-9]/g,'');
  const deadline   = document.getElementById('edit-deadline').value;
  const postcode   = document.getElementById('edit-postcode').value.trim();
  const stad       = document.getElementById('edit-stad').value.trim();

  if (!omschr) { showToast('⚠️ Omschrijving mag niet leeg zijn', true); return; }

  // Bepaal of we de status ook op 'open' zetten (als deadline in de toekomst is)
  const nu = new Date();
  const deadlineDate = deadline ? new Date(deadline) : null;
  const nieuweStatus = (!deadline || deadlineDate > nu) ? 'open' : editingKlus?.status || 'open';

  const btn = document.getElementById('edit-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-dark"></span>';

  let lat = editingKlus.lat;
  let lng = editingKlus.lng;
  if (postcode !== editingKlus.postcode) {
    const coords = await fetchCoordsForPostcode(postcode);
    if (coords) { lat = coords.lat; lng = coords.lng; }
  }

  const { error } = await sb.from('klussen').update({
    omschrijving: omschr,
    budget:       budgetRaw ? parseInt(budgetRaw) : null,
    deadline:     deadline || null,
    postcode,
    stad,
    lat,
    lng,
    status:       nieuweStatus,
    bijgewerkt:   new Date().toISOString(),
  }).eq('id', id);

  btn.disabled = false; btn.innerHTML = 'Wijzigingen opslaan →';

  if (error) { showToast('❌ Opslaan mislukt: ' + error.message, true); }
  else {
    showToast('✅ Klus bijgewerkt' + (nieuweStatus==='open' ? ' en weer actief!' : '!'));
    closeEditKlus();
    await loadMijnKlussen();
    await loadKlussen();
  }
}

// ── Edit Profile ──────────────────────────────────
function openEditProfile() {
  if (!currentUser) return;
  document.getElementById('ep-fname').value = currentUser.voornaam || '';
  document.getElementById('ep-lname').value = currentUser.achternaam || '';
  document.getElementById('ep-company').value = currentUser.bedrijfsnaam || '';
  document.getElementById('ep-postcode').value = currentUser.postcode || '';
  document.getElementById('ep-stad').value = currentUser.stad || '';
  document.getElementById('ep-telefoon').value = currentUser.telefoon || '';
  document.getElementById('ep-spec').value = currentUser.specialisme || '';
  document.getElementById('ep-bio').value = currentUser.bio || '';

  document.getElementById('profileOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditProfile() {
  document.getElementById('profileOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

async function saveEditProfile() {
  if (!sb) { showToast('Demo modus: werkt met echte Supabase'); return; }
  
  const fname = document.getElementById('ep-fname').value.trim();
  const lname = document.getElementById('ep-lname').value.trim();
  if (!fname || !lname) { showToast('⚠️ Voornaam en achternaam zijn verplicht', true); return; }

  const btn = document.getElementById('ep-save-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner spinner-dark"></span>';

  const payload = {
    voornaam: fname,
    achternaam: lname,
    bedrijfsnaam: document.getElementById('ep-company').value.trim(),
    postcode: document.getElementById('ep-postcode').value.trim(),
    stad: document.getElementById('ep-stad').value.trim(),
    telefoon: document.getElementById('ep-telefoon').value.trim(),
    specialisme: document.getElementById('ep-spec').value,
    bio: document.getElementById('ep-bio').value.trim(),
    bijgewerkt: new Date().toISOString()
  };

  let error;
  let newId = currentUser.id;

  if (currentUser.id) {
    // Update bestaand profiel
    const res = await sb.from('aannemers').update(payload).eq('id', currentUser.id);
    error = res.error;
  } else {
    // Maak nieuw profiel aan (bijv. als aannemer record bij registratie mislukt was door RLS)
    payload.auth_id = currentUser.auth_id;
    payload.abonnement = 'starter';
    const res = await sb.from('aannemers').insert(payload).select('id').single();
    error = res.error;
    if (res.data) newId = res.data.id;
  }

  btn.disabled = false; btn.innerHTML = 'Profiel opslaan →';

  if (error) { 
    showToast('❌ Opslaan mislukt: ' + error.message, true); 
  } else {
    showToast('✅ Profiel succesvol bijgewerkt!');
    closeEditProfile();
    currentUser = { ...currentUser, ...payload, id: newId };
    updateNavAuth();
  }
}

// ══════════════════════════════════════════════════
// 9. AANBIEDEN
// ══════════════════════════════════════════════════
function tryAanbieden(title, meta, budget, klusId) {
  if (!currentUser) { openLock(); return; }
  currentKlusId = klusId;
  openModal(title, meta, budget);
}
function openModal(title, meta, budget) {
  document.getElementById('mTitle').textContent = title;
  document.getElementById('mMeta').textContent  = meta;
  document.getElementById('mBudget').textContent = budget;
  ['m-prijs','m-doorloop','m-bericht'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); document.body.style.overflow = ''; currentKlusId = null; }
async function submitAanbieding() {
  const prijs   = document.getElementById('m-prijs').value.replace(/[^0-9]/g,'');
  const doorloop = document.getElementById('m-doorloop').value.trim();
  const bericht  = document.getElementById('m-bericht').value.trim();
  if (!prijs) { showToast('⚠️ Vul een prijs in', true); return; }
  const btn = document.getElementById('m-send-btn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';
  if (!sb || !currentKlusId || currentKlusId.startsWith('demo')) {
    await new Promise(r => setTimeout(r, 700));
    btn.disabled = false; btn.innerHTML = 'Aanbieding versturen ✓';
    closeModal(); showToast('✅ Aanbieding verstuurd! (demo modus)'); return;
  }
  const { error } = await sb.from('aanbiedingen').insert({ klus_id: currentKlusId, aannemer_id: currentUser.id, prijs: parseInt(prijs), doorlooptijd: doorloop, bericht });
  btn.disabled = false; btn.innerHTML = 'Aanbieding versturen ✓';
  if (error) showToast('❌ Versturen mislukt: ' + error.message, true);
  else { closeModal(); showToast('✅ Aanbieding verstuurd!'); }
}

// ══════════════════════════════════════════════════
// 10. AUTH MODALS
// ══════════════════════════════════════════════════
function openAuth(tab) { document.getElementById('authOverlay').classList.add('open'); document.body.style.overflow = 'hidden'; switchAuthTab(tab||'login'); }
function closeAuth()   { document.getElementById('authOverlay').classList.remove('open'); document.body.style.overflow = ''; }
function switchAuthTab(tab) {
  ['login','register'].forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle('active', t===tab);
    document.getElementById(`auth-${t}-body`).style.display = t===tab ? 'block' : 'none';
  });
  document.getElementById('authTitle').textContent    = tab==='login' ? 'Inloggen als aannemer' : 'Registreren als aannemer';
  document.getElementById('authSubtitle').textContent = tab==='login' ? 'Toegang tot alle openstaande klussen' : 'Eerste 30 dagen gratis';
  setAuthErr('login',''); setAuthErr('register','');
}
function setAuthErr(form, msg) { const el=document.getElementById(form+'-err'); el.textContent=msg; el.classList.toggle('show',!!msg); }

async function doLogin() {
  if (!sb) { showToast('⚠️ Supabase niet geconfigureerd', true); return; }
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email||!pass) { setAuthErr('login','Vul e-mailadres en wachtwoord in.'); return; }
  const btn = document.getElementById('login-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Inloggen…';
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  btn.disabled=false; btn.innerHTML='Inloggen →';
  if (error) setAuthErr('login', error.message==='Invalid login credentials' ? 'E-mailadres of wachtwoord onjuist.' : error.message);
  else { closeAuth(); showToast('👋 Welkom terug!'); if (currentKlusId) openModal(document.getElementById('mTitle').textContent, document.getElementById('mMeta').textContent, document.getElementById('mBudget').textContent); }
}

async function doRegister() {
  if (!sb) { showToast('⚠️ Supabase niet geconfigureerd', true); return; }
  const fname=document.getElementById('reg-fname').value.trim(), lname=document.getElementById('reg-lname').value.trim();
  const company=document.getElementById('reg-company').value.trim(), email=document.getElementById('reg-email').value.trim();
  const pass=document.getElementById('reg-pass').value, spec=document.getElementById('reg-spec').value;
  if (!fname||!lname||!company||!email||!pass||!spec) { setAuthErr('register','Vul alle velden in.'); return; }
  if (pass.length<8) { setAuthErr('register','Wachtwoord minimaal 8 tekens.'); return; }
  const btn=document.getElementById('register-btn');
  btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Account aanmaken…';
  const { data: authData, error: authErr } = await sb.auth.signUp({ email, password: pass });
  if (authErr) { btn.disabled=false; btn.innerHTML='Account aanmaken →'; setAuthErr('register',authErr.message); return; }
  await sb.from('aannemers').insert({ auth_id: authData.user.id, voornaam: fname, achternaam: lname, bedrijfsnaam: company, specialisme: spec, abonnement: 'starter' });
  btn.disabled=false; btn.innerHTML='Account aanmaken →';
  closeAuth(); showToast(`✅ Welkom bij Klushub, ${fname}! Check je e-mail.`);
  setTimeout(() => { showPage('klussen'); switchP('klussen'); }, 1200);
}

async function doLogout() { if (sb) await sb.auth.signOut(); else { currentUser=null; updateNavAuth(); } showToast('👋 Je bent uitgelogd.'); }

function openLock()  { document.getElementById('lockOverlay').classList.add('open');    document.body.style.overflow='hidden'; }
function closeLock() { document.getElementById('lockOverlay').classList.remove('open'); document.body.style.overflow=''; }

// ══════════════════════════════════════════════════
// 11. NAVIGATIE
// ══════════════════════════════════════════════════
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  window.scrollTo(0,0);
  if (id==='landing') initReveal();
  if (id==='klussen') loadKlussen();
  if (window.lucide) lucide.createIcons();
}
function goLanding(hash) { showPage('landing'); setTimeout(() => { const el=document.querySelector(hash); if(el)el.scrollIntoView({behavior:'smooth'}); }, 80); }
function switchP(view) {
  document.getElementById('ptab-p').classList.toggle('active',view==='plaatsen');
  document.getElementById('ptab-k').classList.toggle('active',view==='klussen');
  document.getElementById('v-plaatsen').classList.toggle('active',view==='plaatsen');
  document.getElementById('v-klussen').classList.toggle('active',view==='klussen');
  const t = { plaatsen:['Plaats jouw <em>klus</em>','Gratis en vrijblijvend. Ontvang aanbiedingen.','Klus plaatsen'], klussen:['Openstaande <em>klussen</em>','Bekijk alle projecten en bied jezelf aan.','Openstaande klussen'] }[view];
  document.getElementById('kh-title').innerHTML=t[0]; document.getElementById('kh-sub').textContent=t[1]; document.getElementById('kh-bc').textContent=t[2];
  window.scrollTo({top:0,behavior:'smooth'});
  if (view==='klussen') loadKlussen();
}
function switchHowTab(tab,btn) {
  document.querySelectorAll('.how-tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  document.getElementById('how-klant').style.display    = tab==='klant'    ? 'grid' : 'none';
  document.getElementById('how-aannemer').style.display = tab==='aannemer' ? 'grid' : 'none';
}

// ══════════════════════════════════════════════════
// 12. UI HELPERS
// ══════════════════════════════════════════════════
function setView(mode, btn) {
  document.querySelectorAll('.vbtn').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
  const l=document.getElementById('cardsList');
  l.style.display=mode==='grid'?'grid':'flex';
  if(mode==='grid'){l.style.gridTemplateColumns='repeat(2,1fr)';l.style.flexDirection='';}
  else{l.style.gridTemplateColumns='';l.style.flexDirection='column';}
}
function toggleSave(btn) {
  btn.classList.toggle('saved');
  showToast(btn.classList.contains('saved')?'Klus opgeslagen':'Klus verwijderd');
}
function showToast(msg, isErr=false) {
  const t=document.getElementById('toast'); t.textContent=msg;
  t.classList.toggle('err',isErr); t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'),3400);
}
function initReveal() {
  const obs=new IntersectionObserver(entries=>{entries.forEach((e,i)=>{if(e.isIntersecting)setTimeout(()=>e.target.classList.add('visible'),i*80);});},{threshold:0.1});
  document.querySelectorAll('#page-landing .reveal').forEach(el=>{el.classList.remove('visible');obs.observe(el);});
}
const sw=document.querySelector('.score-widget');
if(sw){const so=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.querySelectorAll('.score-fill').forEach(b=>{const w=b.style.width;b.style.width='0';setTimeout(()=>b.style.width=w,200);});});},{threshold:.3});so.observe(sw);}

// ══════════════════════════════════════════════════
// 13. HELPERS
// ══════════════════════════════════════════════════
function escHtml(s=''){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escAttr(s=''){return String(s).replace(/'/g,"\\'").replace(/"/g,'&quot;');}
function timeSince(iso){
  const s=Math.floor((Date.now()-new Date(iso))/1000);
  if(s<60)return'zojuist';if(s<3600)return Math.floor(s/60)+' min geleden';
  if(s<86400)return Math.floor(s/3600)+' uur geleden';return Math.floor(s/86400)+' dagen geleden';
}

// ══════════════════════════════════════════════════
// 14. KEYBOARD + INIT
// ══════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key==='Escape') {
    closeModal(); closeAuth(); closeLock(); closeMijnKlussen(); closeEditKlus();
    closeDropdown(); closeGeplaatsteKlussen(); closeKlantBeheer(); closeEditProfile();
    closeBevestiging(); closeReviewModal();
  }
});

// Initialiseer dual fill op start
updateDualFill();
updateBudgetLabels();

// Koppel categorie checkboxes — ze worden al via inline onchange gekoppeld,
// maar we overschrijven ze hier voor consistentie met onCatChange
setTimeout(() => {
  document.querySelectorAll('.cat-cb').forEach(cb => {
    cb.onchange = onCatChange;
  });
}, 0);


// ══════════════════════════════════════════════════
// 15. KLUS BEVESTIGING (na succesvol plaatsen)
// ══════════════════════════════════════════════════
let _bevKlusId = null;
let _bevToken  = null;

function showKlusBevestiging(klusId, token, omschrijving) {
  _bevKlusId = klusId;
  _bevToken  = token;
  document.getElementById('bevestigingOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Update de beheer-knop in bevestiging
  const beheerBtn = document.getElementById('bev-beheer-btn');
  if (beheerBtn) beheerBtn.style.display = klusId === 'demo-123' ? 'none' : 'block';
  if (window.lucide) lucide.createIcons();
  // Herlaad klussen op achtergrond
  loadKlussen();
}

function closeBevestiging() {
  document.getElementById('bevestigingOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function openKlantBeheerFromBev() {
  if (_bevKlusId && _bevToken && _bevKlusId !== 'demo-123') {
    openKlantBeheer(_bevKlusId, _bevToken);
  }
}

// ══════════════════════════════════════════════════
// 16. FAQ NAVIGATIE
// ══════════════════════════════════════════════════
function openFaqSection(id, btn) {
  document.querySelectorAll('.faq-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.faq-tab').forEach(b => b.classList.remove('active'));
  const sec = document.getElementById('faq-' + id);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
}

function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Sluit alle andere items
  document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!isOpen) item.classList.add('open');
}

// ══════════════════════════════════════════════════
// 17. REVIEW SYSTEEM
// ══════════════════════════════════════════════════
// Supabase SQL voor reviews tabel (éénmalig uitvoeren in SQL editor):
// CREATE TABLE IF NOT EXISTS reviews (
//   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//   klus_id uuid REFERENCES klussen(id),
//   aannemer_id uuid REFERENCES aannemers(id),
//   reviewer_type text, -- 'klant' of 'aannemer'
//   score_kwaliteit int, score_communicatie int, score_prijs_kwaliteit int,
//   score_tijdigheid int, score_netheid int,
//   tekst text, aangemaakt timestamptz DEFAULT now()
// );

const REVIEW_CRITERIA = [
  { key: 'kwaliteit',      label: 'Kwaliteit van het werk' },
  { key: 'communicatie',   label: 'Communicatie' },
  { key: 'prijs_kwaliteit',label: 'Prijs / kwaliteit' },
  { key: 'tijdigheid',     label: 'Tijdigheid' },
  { key: 'netheid',        label: 'Netheid & opruimen' },
];

let _reviewContext = null; // { klusId, aannemerId, aannemerNaam, reviewerType }
let _reviewScores  = {};

function openReviewModal(context) {
  _reviewContext = context;
  _reviewScores  = {};
  document.getElementById('reviewSubtitle').textContent =
    `Hoe was je ervaring met ${escHtml(context.aannemerNaam || 'deze aannemer')}?`;

  // Bouw sterren-rijen
  const criteriaEl = document.getElementById('reviewCriteria');
  criteriaEl.innerHTML = REVIEW_CRITERIA.map(c => `
    <div class="review-row">
      <span class="review-row-label">${c.label}</span>
      <div class="star-row" id="stars-${c.key}">
        ${[1,2,3,4,5].map(n =>
          `<button class="star-btn" data-key="${c.key}" data-val="${n}" onclick="setStarRating('${c.key}',${n})">★</button>`
        ).join('')}
      </div>
    </div>`
  ).join('');

  document.getElementById('reviewTekst').value = '';
  document.getElementById('reviewTotalScore').textContent = '—';
  document.getElementById('review-form-body').style.display = 'block';
  document.getElementById('review-success-body').style.display = 'none';
  document.getElementById('reviewOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (window.lucide) lucide.createIcons();
}

function setStarRating(key, val) {
  _reviewScores[key] = val;
  // Update sterren visueel
  const row = document.getElementById('stars-' + key);
  if (!row) return;
  row.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('lit', parseInt(btn.dataset.val) <= val);
  });
  // Update gemiddelde
  const scores = Object.values(_reviewScores);
  if (scores.length > 0) {
    const avg = (scores.reduce((a,b)=>a+b,0) / scores.length).toFixed(1);
    document.getElementById('reviewTotalScore').textContent = avg;
  }
}

function closeReviewModal() {
  document.getElementById('reviewOverlay').classList.remove('open');
  document.body.style.overflow = '';
  _reviewContext = null;
  _reviewScores  = {};
}

async function submitReview() {
  if (!_reviewContext) return;
  const allFilled = REVIEW_CRITERIA.every(c => _reviewScores[c.key]);
  if (!allFilled) { showToast('⚠️ Vul alle 5 criteria in', true); return; }

  const btn = document.getElementById('reviewSubmitBtn');
  btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>';

  const payload = {
    klus_id:             _reviewContext.klusId,
    aannemer_id:         _reviewContext.aannemerId,
    reviewer_type:       _reviewContext.reviewerType || 'klant',
    score_kwaliteit:     _reviewScores.kwaliteit,
    score_communicatie:  _reviewScores.communicatie,
    score_prijs_kwaliteit: _reviewScores.prijs_kwaliteit,
    score_tijdigheid:    _reviewScores.tijdigheid,
    score_netheid:       _reviewScores.netheid,
    tekst:               document.getElementById('reviewTekst').value.trim() || null,
  };

  if (!sb || _reviewContext.klusId === 'demo-123') {
    await new Promise(r => setTimeout(r, 700));
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="star" style="width:16px;height:16px;fill:currentColor;stroke:none"></i> Review versturen';
    showReviewSuccess();
    return;
  }

  const { error } = await sb.from('reviews').insert(payload);
  btn.disabled = false;
  btn.innerHTML = '<i data-lucide="star" style="width:16px;height:16px;fill:currentColor;stroke:none"></i> Review versturen';
  if (error) { showToast('❌ Review versturen mislukt: ' + error.message, true); }
  else showReviewSuccess();
}

function showReviewSuccess() {
  document.getElementById('review-form-body').style.display = 'none';
  document.getElementById('review-success-body').style.display = 'block';
}

// ══════════════════════════════════════════════════
// 18. AANNEMER KIEZEN (definitieve keuze)
// ══════════════════════════════════════════════════
async function beheerKiesAannemer(klusId, token, aanbiedingId, aannemerNaam, aannemerId) {
  if (!confirm(`Wil je ${aannemerNaam} definitief kiezen voor deze klus?\n\nDe aannemer ontvangt jouw contactgegevens en krijgt bericht dat hij gekozen is. Andere aanbiedingen worden afgewezen.`)) return;

  if (!sb) {
    // Demo modus
    showToast('✅ ' + aannemerNaam + ' is gekozen! (demo)');
    setTimeout(() => {
      openReviewModal({ klusId, aannemerId, aannemerNaam, reviewerType: 'klant' });
    }, 800);
    return;
  }

  // Markeer klus als 'gekozen' en aanbieding als 'geaccepteerd'
  const { error: e1 } = await sb.rpc('beheer_update_aanbieding', {
    p_klus_id:       klusId,
    p_token:         token,
    p_aanbieding_id: aanbiedingId,
    p_status:        'geaccepteerd'
  });
  if (e1) { showToast('❌ Fout bij kiezen: ' + e1.message, true); return; }

  await sb.rpc('beheer_update_klus_status', {
    p_klus_id: klusId, p_token: token, p_status: 'gekozen'
  });

  showToast('🎉 ' + aannemerNaam + ' is gekozen! De aannemer ontvangt jouw contactgegevens.');

  // Herlaad beheer panel
  openKlantBeheer(klusId, token);

  // Trigger review na korte pauze
  setTimeout(() => {
    openReviewModal({ klusId, aannemerId, aannemerNaam, reviewerType: 'klant' });
  }, 2000);
}

(async () => {
  const ok = initSupabase();
  await initAuth();
  await loadStats();
  initReveal();
  updateNavAuth();
  if (!ok) renderDemoKlussen();
  if (window.lucide) lucide.createIcons();

  // Controleer of er een "Magische Beheer Link" in de URL staat!
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('beheer') && urlParams.has('token')) {
    const kId = urlParams.get('beheer');
    const tkn = urlParams.get('token');
    // Verwijder params uit de URL bar voor netheid (optioneel, maar we laten 't voor referentie staan of vegen 't schoon)
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Sla meteen ook op in localStorage
    let klussen = [];
    try { klussen = JSON.parse(localStorage.getItem('klushub_geplaatste_klussen')) || []; } catch(e){}
    // Check of tie al bestaat
    if (!klussen.find(k => k.id === kId)) {
      klussen.unshift({ id: kId, token: tkn, omschrijving: 'Klus via e-mail link', datum: Date.now() });
      localStorage.setItem('klushub_geplaatste_klussen', JSON.stringify(klussen));
    }
    
    // En open direct the Dashboard
    openKlantBeheer(kId, tkn);
  }
})();