/* ===== صفحة الخريطة الكاملة ===== */
document.addEventListener('DOMContentLoaded', () => {
  const map = baseMap('bigmap', { scrollWheelZoom: true });
  const markers = {};
  DESTINATIONS.forEach(d => { markers[d.id] = addMarker(map, d); });

  const $q = document.getElementById('mq');
  const $gov = document.getElementById('mgov');
  const $cats = document.getElementById('mcats');
  const $list = document.getElementById('mlist');
  const $count = document.getElementById('mcount');
  const $loc = document.getElementById('locmsg');

  let cat = qs('cat') || '';
  let activeId = null;

  $gov.innerHTML = '<option value="">كل المحافظات</option>' +
    GOVERNORATES.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  if (qs('gov')) $gov.value = qs('gov');

  const norm = (s) => (s || '').toLowerCase()
    .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

  function renderChips() {
    $cats.innerHTML =
      `<button class="chip ${cat === '' ? 'on' : ''}" data-cat="">الكل</button>` +
      Object.entries(CATEGORIES).map(([k, c]) =>
        `<button class="chip ${cat === k ? 'on' : ''}" data-cat="${k}">${c.icon} ${c.label}</button>`).join('');
  }

  function filtered() {
    const q = norm($q.value.trim());
    return DESTINATIONS.filter(d =>
      (!cat || d.cat === cat) &&
      (!$gov.value || d.gov === $gov.value) &&
      (!q || norm(d.name + ' ' + d.summary).includes(q)));
  }

  function refresh(fit) {
    const list = filtered();
    const ids = new Set(list.map(d => d.id));
    DESTINATIONS.forEach(d => {
      const m = markers[d.id];
      if (ids.has(d.id)) { if (!map.hasLayer(m)) m.addTo(map); }
      else if (map.hasLayer(m)) map.removeLayer(m);
    });
    $count.textContent = `عدد الوجهات: ${list.length}`;
    $list.innerHTML = list.map(d => `
      <div class="list-item ${d.id === activeId ? 'active' : ''}" data-id="${d.id}" role="button" tabindex="0">
        <span class="pin-mini cat-${d.cat}">${CATEGORIES[d.cat].icon}</span>
        <span><b>${d.name}</b><small>${govById(d.gov).name} • ${CATEGORIES[d.cat].label}</small></span>
      </div>`).join('') || '<div class="empty">لا توجد نتائج.</div>';
    if (fit && list.length) {
      map.fitBounds(L.latLngBounds(list.map(d => [d.lat, d.lng])), { padding: [50, 50], maxZoom: 10 });
    }
  }

  function focusOn(id) {
    const d = destById(id);
    if (!d) return;
    activeId = id;
    if (!map.hasLayer(markers[id])) markers[id].addTo(map);
    map.flyTo([d.lat, d.lng], 11, { duration: 0.9 });
    markers[id].openPopup();
    document.querySelectorAll('.list-item').forEach(n => n.classList.toggle('active', n.dataset.id === id));
    if (window.innerWidth <= 860) {
      document.getElementById('mapwrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  /* أحداث */
  $cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    renderChips();
    refresh(true);
  });
  $q.addEventListener('input', () => refresh(true));
  $gov.addEventListener('change', () => refresh(true));
  $list.addEventListener('click', (e) => {
    const it = e.target.closest('.list-item');
    if (it) focusOn(it.dataset.id);
  });
  $list.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const it = e.target.closest('.list-item');
      if (it) focusOn(it.dataset.id);
    }
  });
  document.getElementById('reset').addEventListener('click', () => {
    $q.value = ''; $gov.value = ''; cat = ''; activeId = null; $loc.style.display = 'none';
    renderChips(); refresh(false);
    map.closePopup();
    map.fitBounds(OMAN_BOUNDS);
  });

  /* موقعي: يعمل على HTTPS أو localhost فقط */
  let youMarker = null;
  document.getElementById('locate').addEventListener('click', () => {
    $loc.style.display = 'block';
    $loc.textContent = 'جارٍ تحديد موقعك…';
    map.locate({ setView: false, enableHighAccuracy: true, timeout: 12000 });
  });
  map.on('locationfound', (e) => {
    if (youMarker) map.removeLayer(youMarker);
    youMarker = L.marker(e.latlng, {
      icon: L.divIcon({ className: 'pin-wrap', html: '<div class="you-dot"></div>', iconSize: [16, 16], iconAnchor: [8, 8] })
    }).addTo(map).bindPopup('أنت هنا');
    const me = { lat: e.latlng.lat, lng: e.latlng.lng };
    const nearest = DESTINATIONS.map(d => ({ d, km: distKm(me, d) })).sort((a, b) => a.km - b.km)[0];
    $loc.innerHTML = `أقرب وجهة إليك: <b>${nearest.d.name}</b> (نحو ${Math.round(nearest.km)} كم بخط مستقيم)`;
    map.fitBounds([[me.lat, me.lng], [nearest.d.lat, nearest.d.lng]], { padding: [70, 70] });
    activeId = nearest.d.id;
    markers[nearest.d.id].openPopup();
    refresh(false);
  });
  map.on('locationerror', () => {
    $loc.textContent = 'تعذّر تحديد موقعك. تأكد من السماح بالوصول للموقع، ومن فتح الموقع عبر HTTPS.';
  });

  /* التشغيل الأول */
  renderChips();
  map.fitBounds(OMAN_BOUNDS);
  refresh(!!(qs('gov') || qs('cat')));
  if (qs('id')) setTimeout(() => focusOn(qs('id')), 400);
});
