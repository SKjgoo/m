/* ===== الصفحة الرئيسية ===== */
document.addEventListener('DOMContentLoaded', () => {
  /* الإحصاءات */
  document.getElementById('stat-gov').textContent  = GOVERNORATES.length;
  document.getElementById('stat-dest').textContent = DESTINATIONS.length;
  document.getElementById('stat-vr').textContent   = DESTINATIONS.filter(d => d.vr).length;
  document.getElementById('stat-cat').textContent  = Object.keys(CATEGORIES).length;

  /* بطاقات الفئات */
  document.getElementById('cat-tiles').innerHTML = Object.entries(CATEGORIES).map(([key, c]) => {
    const n = DESTINATIONS.filter(d => d.cat === key).length;
    return `<a class="cat-tile cat-${key} has-bg" style="--img:url('${new URL('images/cat/' + key + '.jpg', location.href).href}')" href="destinations.html?cat=${key}">
      <span class="ico">${c.icon}</span>
      <span>${c.label}<small>${n} وجهة</small></span>
    </a>`;
  }).join('');

  /* وجهات مميزة */
  const featuredIds = ['grand-mosque', 'nizwa', 'wadi-shab', 'jabal-shams', 'wahiba-sands', 'musandam-fjords', 'wadi-darbat', 'national-museum', 'sur-dhow'];
  document.getElementById('featured').innerHTML =
    featuredIds.map(destById).filter(Boolean).map(destCard).join('');

  /* شريط صور المعالم */
  const stripIds = ['nizwa', 'bahla', 'jabrin', 'mutrah', 'sur-dhow', 'jabal-akhdar', 'al-baleed', 'khasab-castle', 'wadi-bani-khalid', 'mughsail', 'royal-opera', 'nakhal-fort'];
  const strip = document.getElementById('landmark-strip');
  if (strip) strip.innerHTML = stripIds.map(destById).filter(Boolean).map(d =>
    `<a class="lm" href="destination.html?id=${d.id}"><div class="lm-img cat-${d.cat}" data-img="images/${d.id}.jpg"></div><span>${d.name}</span></a>`).join('');

  /* معاينة المحافظات */
  document.getElementById('gov-preview').innerHTML = GOVERNORATES.map(g => `
    <a class="gov-card" href="governorates.html#${g.id}">
      <header>
        <span class="gov-ico">${g.icon}</span>
        <div><h3>${g.name}</h3><span class="tag">${g.tagline}</span></div>
      </header>
      <p class="meta">${destsOfGov(g.id).length} وجهة • المركز: ${g.capital}</p>
    </a>`).join('');

  /* عُمان عبر الزمان */
  document.getElementById('era-chips').innerHTML = ERAS.map(e =>
    `<a class="chip" href="history.html#${e.id}">${e.icon} ${e.title}</a>`).join('');

  /* الخريطة المصغّرة */
  const map = baseMap('homemap');
  DESTINATIONS.forEach(d => addMarker(map, d));
  map.fitBounds(OMAN_BOUNDS);
  loadPhotos();
});
