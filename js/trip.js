/* ============================================================
   صفحة «الرحلة»
   - المسار: OSRM (router.project-osrm.org) — يحتاج اتصالًا بالإنترنت
   - المساجد ومحطات الوقود: Overpass API من بيانات OpenStreetMap
   - المناطق والمحافظات: من قائمة TOWNS المحلية (تعمل دون إنترنت)
   - عند فشل خدمة المسار يُرسم خط مستقيم تقريبي مع تنبيه واضح.
   ============================================================ */
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';
const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
const FUEL_RADIUS = 3000;     // متر من الطريق
const MOSQUE_RADIUS = 1000;   // متر من الطريق
const TOWN_RADIUS_KM = 15;    // المدن التي تُعرض كمناطق على الطريق
const GAP_KM = 100;           // تنبيه عند مسافة طويلة بلا وقود
const MOSQUE_PREVIEW = 40;

document.addEventListener('DOMContentLoaded', () => {
  const $from = document.getElementById('from');
  const $to = document.getElementById('to');
  const $status = document.getElementById('status');
  const $result = document.getElementById('result');
  const $locstate = document.getElementById('locstate');

  const points = tripPoints();
  let myLoc = null;
  let map = null, layers = {};
  let items = [], activeFilter = 'all', showAllMosques = false, runId = 0;

  /* ---------- القوائم ---------- */
  function fillSelect(sel, keep) {
    const groups = {};
    points.forEach(p => { (groups[p.group] = groups[p.group] || []).push(p); });
    let html = '';
    if (myLoc) html += `<optgroup label="موقعك"><option value="me">موقعي الحالي</option></optgroup>`;
    Object.entries(groups).forEach(([g, list]) => {
      html += `<optgroup label="${g}">${list.map(p => `<option value="${p.key}">${p.label}</option>`).join('')}</optgroup>`;
    });
    sel.innerHTML = html;
    if (keep) sel.value = keep;
  }
  const townKey = (name) => { const i = TOWNS.findIndex(t => t.n === name); return i >= 0 ? 't' + i : ''; };
  fillSelect($from); fillSelect($to);
  $from.value = townKey('مسقط');
  $to.value = townKey('نزوى');

  function resolve(key) {
    if (key === 'me' && myLoc) return { label: 'موقعي', lat: myLoc.lat, lng: myLoc.lng, gov: null };
    return points.find(p => p.key === key);
  }

  /* قيم من الرابط: ?to=d:wadi-shab أو ?to=gov:dhofar أو ?from= */
  function keyFromParam(v) {
    if (!v) return '';
    if (v.startsWith('gov:')) {
      const g = govById(v.slice(4));
      return g ? townKey(g.capital) : '';
    }
    return points.some(p => p.key === v) ? v : '';
  }

  document.getElementById('swap').addEventListener('click', () => {
    const a = $from.value; $from.value = $to.value; $to.value = a;
  });

  document.getElementById('useloc').addEventListener('click', () => {
    if (!navigator.geolocation) { $locstate.textContent = 'المتصفح لا يدعم تحديد الموقع.'; return; }
    $locstate.textContent = 'جارٍ تحديد موقعك…';
    navigator.geolocation.getCurrentPosition((pos) => {
      myLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const t = $to.value;
      fillSelect($from); fillSelect($to, t);
      $from.value = 'me';
      $locstate.textContent = 'تم تحديد موقعك.';
    }, () => {
      $locstate.textContent = 'تعذّر تحديد الموقع. اسمح للموقع بالوصول إلى موقعك (يلزم HTTPS) أو اختر مدينة.';
    }, { enableHighAccuracy: false, timeout: 15000 });
  });

  document.getElementById('trip-form').addEventListener('submit', (e) => { e.preventDefault(); run(); });

  /* ---------- أدوات جغرافية ---------- */
  const R = 6371;
  const rad = (x) => x * Math.PI / 180;
  function hav(a, b) {
    const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /* مسافة تقريبية سريعة (كم) */
  function fast(a, b) {
    const x = rad(b[1] - a[1]) * Math.cos(rad((a[0] + b[0]) / 2));
    const y = rad(b[0] - a[0]);
    return R * Math.sqrt(x * x + y * y);
  }
  function straightLine(a, b) {
    const total = hav(a, b), n = Math.max(2, Math.ceil(total / 2));
    const out = [];
    for (let i = 0; i <= n; i++) out.push([a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n]);
    return out;
  }
  function nearestOnRoute(p, route, cum) {
    let best = Infinity, bi = 0;
    for (let i = 0; i < route.length; i++) {
      const d = fast(p, route[i]);
      if (d < best) { best = d; bi = i; }
    }
    return { off: best, km: cum[bi], idx: bi };
  }

  /* ---------- جلب المسار ---------- */
  async function fetchWithTimeout(url, opts, ms) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try { return await fetch(url, Object.assign({}, opts, { signal: ctl.signal })); }
    finally { clearTimeout(t); }
  }

  async function getRoute(a, b) {
    try {
      const url = `${OSRM_URL}${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
      const r = await fetchWithTimeout(url, {}, 25000);
      if (!r.ok) throw new Error('osrm ' + r.status);
      const j = await r.json();
      if (!j.routes || !j.routes.length) throw new Error('no route');
      const rt = j.routes[0];
      return { coords: rt.geometry.coordinates.map(c => [c[1], c[0]]), km: rt.distance / 1000, min: rt.duration / 60, real: true };
    } catch (err) {
      const coords = straightLine([a.lat, a.lng], [b.lat, b.lng]);
      return { coords, km: hav([a.lat, a.lng], [b.lat, b.lng]), min: null, real: false };
    }
  }

  /* ---------- Overpass ---------- */
  function thin(coords, stepKm) {
    const out = [coords[0]]; let acc = 0;
    for (let i = 1; i < coords.length; i++) {
      acc += fast(coords[i - 1], coords[i]);
      if (acc >= stepKm) { out.push(coords[i]); acc = 0; }
    }
    const last = coords[coords.length - 1];
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  }
  function overpassQuery(pts) {
    const c = pts.map(p => p[0].toFixed(5) + ',' + p[1].toFixed(5)).join(',');
    return `[out:json][timeout:60];(` +
      `nwr["amenity"="fuel"](around:${FUEL_RADIUS},${c});` +
      `nwr["amenity"="place_of_worship"]["religion"="muslim"](around:${MOSQUE_RADIUS},${c});` +
      `nwr["building"="mosque"](around:${MOSQUE_RADIUS},${c});` +
      `);out center tags;`;
  }
  async function overpass(pts) {
    const body = 'data=' + encodeURIComponent(overpassQuery(pts));
    let lastErr;
    for (const ep of OVERPASS) {
      try {
        const r = await fetchWithTimeout(ep, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body
        }, 50000);
        if (!r.ok) throw new Error('overpass ' + r.status);
        const j = await r.json();
        return j.elements || [];
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }

  async function getPois(coords, progress) {
    const pts = thin(coords, 2.5);
    const CH = 140, chunks = [];
    for (let i = 0; i < pts.length - 1; i += CH - 1) chunks.push(pts.slice(i, i + CH));
    const seen = new Map(); let failed = 0;
    for (let i = 0; i < chunks.length; i++) {
      progress(i + 1, chunks.length);
      try {
        (await overpass(chunks[i])).forEach(el => seen.set(el.type + el.id, el));
      } catch (e) { failed++; }
    }
    return { elements: [...seen.values()], failed, total: chunks.length };
  }

  /* ---------- التشغيل ---------- */
  const fmtKm = (k) => (k < 10 ? k.toFixed(1) : Math.round(k)) + ' كم';
  const fmtDur = (m) => { const h = Math.floor(m / 60), mm = Math.round(m % 60); return (h ? h + ' س ' : '') + mm + ' د'; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function say(msg, show) {
    $status.textContent = msg || '';
    $status.classList.toggle('show', !!show);
  }

  async function run() {
    const id = ++runId;
    const A = resolve($from.value), B = resolve($to.value);
    if (!A || !B) return;
    if (Math.abs(A.lat - B.lat) < 0.002 && Math.abs(A.lng - B.lng) < 0.002) { say('نقطة الانطلاق والوصول متطابقتان. اختر وجهة مختلفة.', true); return; }
    $result.hidden = true;
    say('جارٍ رسم الطريق…', true);

    const route = await getRoute(A, B);
    if (id !== runId) return;
    const coords = route.coords;
    const cum = [0];
    for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + fast(coords[i - 1], coords[i]));
    const total = route.real ? route.km : cum[cum.length - 1];
    const scale = cum[cum.length - 1] ? total / cum[cum.length - 1] : 1;
    for (let i = 0; i < cum.length; i++) cum[i] *= scale;

    say('جارٍ البحث عن محطات الوقود والمساجد على الطريق…', true);
    let pois = { elements: [], failed: 1, total: 1 };
    pois = await getPois(coords, (i, n) => { if (id === runId) say(`جارٍ البحث عن محطات الوقود والمساجد على الطريق (${i}/${n})…`, true); });
    if (id !== runId) return;

    build(A, B, route, coords, cum, total, pois);
    say('', false);
  }

  function build(A, B, route, coords, cum, total, pois) {
    /* المناطق */
    const towns = TOWNS.map(t => {
      const n = nearestOnRoute([t.lat, t.lng], coords, cum);
      return { type: 'region', name: t.n, gov: t.g, lat: t.lat, lng: t.lng, km: n.km, off: n.off };
    }).filter(t => t.off <= TOWN_RADIUS_KM);

    /* المحافظات بالترتيب */
    const govSeq = [];
    for (let k = 0; k <= total; k += 5) {
      const idx = cum.findIndex(c => c >= k);
      const p = coords[idx < 0 ? coords.length - 1 : idx];
      let best = null, bd = 1e9;
      TOWNS.forEach(t => { const d = fast(p, [t.lat, t.lng]); if (d < bd) { bd = d; best = t; } });
      if (best && bd < 60 && govSeq[govSeq.length - 1] !== best.g) govSeq.push(best.g);
    }

    /* وجهات سياحية على الطريق */
    const destNear = DESTINATIONS.map(d => {
      const n = nearestOnRoute([d.lat, d.lng], coords, cum);
      return { type: 'dest', id: d.id, name: d.name, lat: d.lat, lng: d.lng, km: n.km, off: n.off, cat: d.cat };
    }).filter(d => d.off <= 25 && d.km > 1 && d.km < total - 1);

    /* المحطات والمساجد */
    const poi = [];
    pois.elements.forEach(el => {
      const lat = el.lat != null ? el.lat : el.center && el.center.lat;
      const lng = el.lon != null ? el.lon : el.center && el.center.lon;
      if (lat == null || lng == null) return;
      const tags = el.tags || {};
      const isFuel = tags.amenity === 'fuel';
      const n = nearestOnRoute([lat, lng], coords, cum);
      const limit = (isFuel ? FUEL_RADIUS : MOSQUE_RADIUS) / 1000;
      if (n.off > limit * 1.05) return;
      const name = tags['name:ar'] || tags.name || tags['name:en'] || tags.brand || (isFuel ? 'محطة وقود' : 'مسجد');
      poi.push({ type: isFuel ? 'fuel' : 'mosque', name, brand: tags.brand || '', lat, lng, km: n.km, off: n.off });
    });
    /* إزالة المكرر القريب جدًا */
    const uniq = [];
    poi.sort((a, b) => a.km - b.km).forEach(p => {
      if (!uniq.some(u => u.type === p.type && Math.abs(u.lat - p.lat) < 0.0004 && Math.abs(u.lng - p.lng) < 0.0004)) uniq.push(p);
    });
    const fuel = uniq.filter(p => p.type === 'fuel');
    const mosques = uniq.filter(p => p.type === 'mosque');

    /* فجوات الوقود */
    const gaps = [];
    if (pois.failed < pois.total) {
      const ks = [0, ...fuel.map(f => f.km), total];
      for (let i = 1; i < ks.length; i++) {
        if (ks[i] - ks[i - 1] >= GAP_KM) gaps.push({ type: 'gap', km: ks[i - 1] + (ks[i] - ks[i - 1]) / 2, from: ks[i - 1], to: ks[i], name: 'مسافة طويلة بلا محطات وقود' });
      }
    }

    const start = { type: 'start', name: 'نقطة الانطلاق: ' + A.label, lat: A.lat, lng: A.lng, km: 0, off: 0 };
    const end = { type: 'end', name: 'الوصول: ' + B.label, lat: B.lat, lng: B.lng, km: total, off: 0 };
    items = [start, ...towns, ...destNear, ...fuel, ...mosques, ...gaps, end].sort((a, b) => a.km - b.km || (a.type === 'start' ? -1 : 0));
    activeFilter = 'all'; showAllMosques = false;

    /* الملخص */
    document.getElementById('stats').innerHTML = [
      [fmtKm(total), 'المسافة'],
      [route.min ? fmtDur(route.min) : '—', 'زمن القيادة التقريبي'],
      [govSeq.length || '—', 'محافظات'],
      [pois.failed < pois.total ? fuel.length : '؟', 'محطات وقود'],
      [pois.failed < pois.total ? mosques.length : '؟', 'مساجد على الطريق']
    ].map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('');

    /* تنبيهات */
    const notes = [];
    if (!route.real) notes.push('تعذّر الاتصال بخدمة المسارات، فالخط المعروض مستقيم وتقريبي وليس مسار الطريق الفعلي، والمسافة بخط مستقيم. جرّب مرة أخرى بعد قليل أو افتح الاتجاهات في خرائط جوجل.');
    if (pois.failed >= pois.total) notes.push('تعذّر جلب المساجد ومحطات الوقود من خدمة OpenStreetMap حاليًا. يمكنك المحاولة لاحقًا أو البحث عنها في خرائط جوجل.');
    else if (pois.failed > 0) notes.push(`لم يكتمل جلب البيانات لجزء من الطريق (${pois.failed} من ${pois.total} مقاطع)، فقد تنقص بعض المحطات والمساجد.`);
    if (gaps.length) notes.push('تنبّه: ' + gaps.map(g => `بين الكيلومتر ${Math.round(g.from)} والكيلومتر ${Math.round(g.to)} لا توجد محطات مسجّلة (${Math.round(g.to - g.from)} كم)`).join('، ') + '. املأ الخزان قبلها.');
    const govs = new Set([A.gov, B.gov]);
    if ((govs.has('musandam')) && !(A.gov === 'musandam' && B.gov === 'musandam')) notes.push('الطريق البري إلى مسندم أو منها يمرّ عبر أراضي دولة الإمارات، فتأكّد من وثائق العبور وشروط المركبة.');
    document.getElementById('notes').innerHTML = notes.map(n => `<p class="note" style="margin-bottom:12px">${n}</p>`).join('');

    document.getElementById('govs').innerHTML = govSeq.length
      ? govSeq.map((g, i) => `${i ? '<span class="arrow">←</span>' : ''}<a class="chip" href="governorates.html#${g}">${govById(g).icon} ${govById(g).name}</a>`).join('')
      : '<span class="muted">لم نتمكن من تحديد المحافظات.</span>';

    const gl = `https://www.google.com/maps/dir/?api=1&origin=${A.lat},${A.lng}&destination=${B.lat},${B.lng}&travelmode=driving`;
    const fuelSearch = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('محطة وقود')}&center=${A.lat},${A.lng}`;
    document.getElementById('actions').innerHTML =
      `<a class="btn" href="${gl}" target="_blank" rel="noopener">ابدأ الملاحة في خرائط جوجل</a>` +
      `<a class="btn light" href="${fuelSearch}" target="_blank" rel="noopener">ابحث عن وقود في خرائط جوجل</a>`;

    renderFilters(fuel.length, mosques.length, towns.length);
    renderList();
    renderMap(A, B, coords);
    $result.hidden = false;
    if (window.tripExtras) { try { window.tripExtras({ A, B, coords, cum, total, destNear }); } catch (e) { console.warn(e); } }
    setTimeout(() => { map.invalidateSize(); map.fitBounds(L.latLngBounds(coords), { padding: [30, 30] }); }, 50);
    $result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- العرض ---------- */
  const ICON = { start: 'أ', end: 'ب', region: '•', dest: '◆', fuel: 'و', mosque: 'م', gap: '!' };
  const LABEL = { dest: 'وجهة سياحية على طريقك', region: 'منطقة', fuel: 'محطة وقود', mosque: 'مسجد', gap: 'تنبيه', start: 'بداية', end: 'نهاية' };

  function renderFilters(nf, nm, nr) {
    const defs = [['all', 'الكل'], ['dest', `وجهات (${items.filter(i => i.type === 'dest').length})`], ['region', `المناطق (${nr})`], ['fuel', `محطات الوقود (${nf})`], ['mosque', `المساجد (${nm})`]];
    const el = document.getElementById('filters');
    el.innerHTML = defs.map(([k, l]) => `<button type="button" class="chip ${k === activeFilter ? 'on' : ''}" data-f="${k}">${l}</button>`).join('');
    el.onclick = (e) => {
      const b = e.target.closest('[data-f]'); if (!b) return;
      activeFilter = b.dataset.f; showAllMosques = false;
      el.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.f === activeFilter));
      renderList(); syncLayers();
    };
  }

  function visibleItems() {
    const keep = (it) => it.type === 'start' || it.type === 'end' ||
      activeFilter === 'all' || it.type === activeFilter || (it.type === 'gap' && (activeFilter === 'fuel'));
    let list = items.filter(keep);
    const m = list.filter(i => i.type === 'mosque');
    if (!showAllMosques && m.length > MOSQUE_PREVIEW) {
      const allow = new Set(m.filter((_, i) => i % Math.ceil(m.length / MOSQUE_PREVIEW) === 0));
      list = list.filter(i => i.type !== 'mosque' || allow.has(i));
      list.hiddenMosques = m.length - allow.size;
    }
    return list;
  }

  function renderList() {
    const list = visibleItems();
    const ul = document.getElementById('stops');
    ul.innerHTML = list.map((it) => {
      const idx = items.indexOf(it);
      const cls = it.type === 'gap' ? 'gap' : '';
      let sub = '';
      if (it.type === 'region') sub = `${esc(govById(it.gov).name)} • ${it.off < 1 ? 'على الطريق' : 'يبعد ' + fmtKm(it.off)}`;
      else if (it.type === 'fuel' || it.type === 'mosque') sub = it.off < 0.1 ? 'على الطريق' : `يبعد عن الطريق ${Math.round(it.off * 1000)} م`;
      else if (it.type === 'dest') sub = `<a href="destination.html?id=${it.id}">التفاصيل</a> • ${it.off < 1 ? 'على الطريق' : 'تبعد ' + fmtKm(it.off)}`;
      else if (it.type === 'gap') sub = `نحو ${Math.round(it.to - it.from)} كم دون محطة وقود مسجّلة`;
      const title = it.type === 'region' ? `${esc(it.name)}` : esc(it.name);
      return `<li class="stop ${cls}" data-i="${idx}" tabindex="0" role="button">
        <span class="stop-ico ${it.type === 'gap' ? 'gap' : it.type}">${ICON[it.type]}</span>
        <span class="stop-body"><span class="stop-km">${it.type === 'gap' ? '' : 'كم ' + Math.round(it.km)}</span>
          <b>${title}</b><small>${LABEL[it.type]}${sub ? ' • ' + sub : ''}</small></span>
      </li>`;
    }).join('') + (list.hiddenMosques ? `<li><button type="button" class="btn light more-btn" id="more">عرض كل المساجد (${list.hiddenMosques} إضافية)</button></li>` : '');
    const more = document.getElementById('more');
    if (more) more.onclick = () => { showAllMosques = true; renderList(); syncLayers(); };
  }

  function mk(it) {
    const cls = it.type === 'region' ? 'culture' : it.type === 'dest' ? 'nature' : it.type;
    return L.marker([it.lat, it.lng], {
      icon: L.divIcon({
        className: 'pin-wrap',
        html: `<div class="pin pin-${cls}" style="${it.type === 'mosque' || it.type === 'fuel' ? 'width:28px;height:28px;font-size:14px' : ''}">${ICON[it.type]}</div>`,
        iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -16]
      }), title: it.name
    }).bindPopup(`<h4>${esc(it.name)}</h4><p class="muted">${LABEL[it.type]} • كم ${Math.round(it.km)} من البداية</p>` +
      `<div class="pop-actions"><a class="alt" href="https://www.google.com/maps/dir/?api=1&destination=${it.lat},${it.lng}" target="_blank" rel="noopener">الاتجاهات</a></div>`);
  }

  function renderMap(A, B, coords) {
    if (!map) {
      map = baseMap('tripmap', { scrollWheelZoom: true });
      document.getElementById('stops').addEventListener('click', onStop);
      document.getElementById('stops').addEventListener('keydown', (e) => { if (e.key === 'Enter') onStop(e); });
    }
    Object.values(layers).forEach(l => map.removeLayer(l));
    layers = { route: L.polyline(coords, { color: '#c1272d', weight: 5, opacity: .9 }).addTo(map) };
    layers.markers = L.layerGroup().addTo(map);
    items.forEach(it => { it.marker = it.type === 'gap' ? null : mk(it); });
    syncLayers();
  }

  function syncLayers() {
    if (!layers.markers) return;
    layers.markers.clearLayers();
    visibleItems().forEach(it => { if (it.marker) layers.markers.addLayer(it.marker); });
  }

  function onStop(e) {
    const li = e.target.closest('.stop'); if (!li) return;
    const it = items[+li.dataset.i];
    if (!it) return;
    if (it.type === 'gap') return;
    map.flyTo([it.lat, it.lng], Math.max(map.getZoom(), 12), { duration: .7 });
    if (it.marker) { if (!layers.markers.hasLayer(it.marker)) layers.markers.addLayer(it.marker); it.marker.openPopup(); }
    if (window.innerWidth <= 980) document.getElementById('tripmap').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ---------- قيم الرابط ---------- */
  const qFrom = keyFromParam(qs('from')), qTo = keyFromParam(qs('to'));
  if (qFrom) $from.value = qFrom;
  if (qTo) {
    $to.value = qTo;
    if (!qFrom && $from.value === $to.value) $from.value = townKey('مسقط') === $to.value ? townKey('نزوى') : townKey('مسقط');
    run();
  }
});
