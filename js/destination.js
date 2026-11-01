/* ===== صفحة تفاصيل الوجهة (destination.html?id=...) ===== */
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('content');
  const d = destById(qs('id'));

  if (!d) {
    root.innerHTML = `
      <section class="section"><div class="container">
        <div class="empty">
          <h2>لم نجد هذه الوجهة</h2>
          <p>قد يكون الرابط غير صحيح.</p>
          <a class="btn" href="destinations.html">تصفّح كل الوجهات</a>
        </div>
      </div></section>`;
    return;
  }

  const g = govById(d.gov), c = CATEGORIES[d.cat];
  document.title = `${d.name} | اكتشف عُمان`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', d.summary);

  const nearby = DESTINATIONS
    .filter(x => x.id !== d.id)
    .map(x => ({ d: x, km: distKm(d, x) }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 3);

  root.innerHTML = `
  <section class="dest-hero cat-${d.cat}" data-img="images/${d.id}.jpg">
    <div class="container">
      <div class="crumbs">
        <a href="index.html">الرئيسية</a> ‹ <a href="governorates.html#${g.id}">محافظة ${g.name}</a> ‹ ${d.name}
      </div>
      <h1>${d.name}</h1>
      <p>${d.summary}</p>
      <div class="btn-row" style="margin-top:18px">
        ${d.vr ? `<a class="btn" href="vr.html?id=${d.id}">جولة افتراضية 360°</a>` : ''}
        <a class="btn ghost" href="${dirLink(d)}" target="_blank" rel="noopener">الاتجاهات</a>
        <a class="btn ghost" href="trip.html?to=${'d:' + d.id}">خطّط الطريق إليها</a>
        <button class="btn ghost" id="share" type="button">↗ مشاركة</button>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container dest-layout">
      <div>
        <div class="panel">
          <h2>نبذة عن الوجهة</h2>
          ${d.desc.map(p => `<p>${p}</p>`).join('')}
          <h3 style="margin-top:1em">أبرز ما يميّزها</h3>
          <ul class="check-list">${d.highlights.map(h => `<li>${h}</li>`).join('')}</ul>
        </div>

        <div class="panel" id="gallery-panel">
          <h2>صور من الزوار</h2>
          ${(typeof GALLERY !== 'undefined' && GALLERY[d.id] && GALLERY[d.id].length)
            ? `<div class="gal">${GALLERY[d.id].map((g, i) => `<button type="button" class="gal-i" data-i="${i}" aria-label="تكبير الصورة ${i + 1}"><img src="${g.src}" alt="${g.cap || d.name}" loading="lazy"></button>`).join('')}</div>`
            : `<p class="muted">لا توجد صور لهذه الوجهة بعد.</p>`}
          <p><a class="btn small" target="_blank" rel="noopener" href="https://wa.me/96894969193?text=${encodeURIComponent('صور من ' + d.name + ' (' + d.id + ')')}">شارك صورك لهذه الوجهة عبر واتساب</a></p>
        </div>

        <div class="panel">
          <h2>الموقع على الخريطة</h2>
          <div class="map-box" id="destmap" style="margin-top:12px"></div>
          <div class="btn-row" style="margin-top:14px">
            <a class="btn dark small" href="${mapsLink(d)}" target="_blank" rel="noopener">فتح في خرائط جوجل</a>
            <a class="btn small" href="map.html?id=${d.id}">عرض على الخريطة الكاملة</a>
          </div>
        </div>

        ${d.vr ? `
        <div class="panel" style="padding:0;border:0;background:none;box-shadow:none">
          <a class="vr-cta" href="vr.html?id=${d.id}">
            <span class="ico"></span>
            <span>
              <h3>جولة افتراضية 360° لـ«${d.name}»</h3>
              <p>افتحها من هاتفك وحرّكه لتنظر حولك، أو ضعه في نظارة Cardboard.</p>
            </span>
          </a>
        </div>` : ''}

        <div class="panel">
          <h2>نصائح قبل الزيارة</h2>
          <ul class="check-list tips-list">${d.tips.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      </div>

      <aside class="sticky-side">
        <div class="panel">
          <h3>معلومات سريعة</h3>
          <ul class="facts">
            <li><span class="k">المحافظة</span><span class="v">${g.name}</span></li>
            <li><span class="k">النوع</span><span class="v">${c.icon} ${c.label}</span></li>
            <li><span class="k">أفضل وقت</span><span class="v">${d.bestTime}</span></li>
            <li><span class="k">مدة الزيارة</span><span class="v">${d.duration}</span></li>
            <li><span class="k">الإحداثيات</span><span class="v" dir="ltr" style="text-align:right">${d.lat.toFixed(4)}, ${d.lng.toFixed(4)}</span></li>
          </ul>
        </div>
        <div class="panel">
          <h3>مخاطر الطقس (7 أيام)</h3>
          <div id="dest-wx"></div>
          <p style="margin:10px 0 0"><a class="btn small light" href="safety.html?loc=d:${d.id}">قوائم السلامة والنشاط ←</a></p>
        </div>
        <div class="panel">
          <h3>أقرب الوجهات</h3>
          <ul class="facts">
            ${nearby.map(n => `
              <li>
                <span class="k">${Math.round(n.km)} كم</span>
                <a class="v" href="destination.html?id=${n.d.id}">${CATEGORIES[n.d.cat].icon} ${n.d.name}</a>
              </li>`).join('')}
          </ul>
          <p class="muted" style="font-size:.85rem;margin:10px 0 0">المسافة بخط مستقيم وليست مسافة الطريق.</p>
        </div>
      </aside>
    </div>
  </section>

  <section class="section alt">
    <div class="container">
      <div class="section-head"><h2>وجهات قريبة قد تعجبك</h2></div>
      <div class="grid">${nearby.map(n => destCard(n.d)).join('')}</div>
    </div>
  </section>`;

  /* الخريطة */
  const map = baseMap('destmap', { scrollWheelZoom: false });
  nearby.forEach(n => addMarker(map, n.d));
  const main = addMarker(map, d, { hideMore: true });
  map.setView([d.lat, d.lng], 11);
  main.openPopup();

  if (window.renderWeatherRisk) renderWeatherRisk(document.getElementById('dest-wx'), { lat: d.lat, lng: d.lng, name: d.name });

  /* المشاركة */
  /* تكبير صور المعرض */
  const gp = document.getElementById('gallery-panel');
  if (gp && typeof GALLERY !== 'undefined' && GALLERY[d.id]) {
    const list = GALLERY[d.id]; let cur = 0;
    const lb = document.createElement('div'); lb.className = 'lb'; lb.hidden = true;
    lb.innerHTML = '<button class="lb-x" aria-label="إغلاق">✕</button><button class="lb-p" aria-label="السابق">›</button><img alt=""><button class="lb-n" aria-label="التالي">‹</button>';
    document.body.appendChild(lb);
    const show = (i) => { cur = (i + list.length) % list.length; lb.querySelector('img').src = list[cur].src; lb.hidden = false; };
    gp.addEventListener('click', (e) => { const b = e.target.closest('.gal-i'); if (b) show(+b.dataset.i); });
    lb.addEventListener('click', (e) => {
      if (e.target.closest('.lb-p')) show(cur - 1); else if (e.target.closest('.lb-n')) show(cur + 1);
      else if (e.target === lb || e.target.closest('.lb-x')) lb.hidden = true;
    });
    document.addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'Escape') lb.hidden = true; if (e.key === 'ArrowRight') show(cur - 1); if (e.key === 'ArrowLeft') show(cur + 1); });
  }

  document.getElementById('share').addEventListener('click', async () => {
    const data = { title: d.name, text: d.summary, url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(location.href);
        alert('تم نسخ رابط الصفحة');
      }
    } catch (e) { /* أُلغيت المشاركة */ }
  });

  loadPhotos(root);
});
