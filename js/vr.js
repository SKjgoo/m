/* ===== جولات الواقع الافتراضي 360° (A-Frame) =====
   - كل وجهة لها صورة بانورامية: images/360/<id>.jpg  (نسبة 2:1، يُفضّل 4096×2048)
   - الرابط المباشر لجولة: vr.html?id=wadi-shab
*/
document.addEventListener('DOMContentLoaded', () => {
  const tours = DESTINATIONS.filter(d => d.vr);
  const scene = document.getElementById('scene');
  const sky = document.getElementById('sky');
  const stage = document.getElementById('stage');
  const overlay = document.getElementById('overlay');
  const ovText = document.getElementById('ov-text');
  const spinner = document.getElementById('spinner');
  const $list = document.getElementById('vrlist');
  const $info = document.getElementById('info');
  const bAuto = document.getElementById('b-auto');
  const bFull = document.getElementById('b-full');
  let current = null, auto = false, hideTimer = null;


  /* قائمة الجولات: بحث + تصنيف + صور مصغّرة */
  let fCat = 'all', fQ = '';
  const bar = document.createElement('div');
  bar.className = 'vr-filter';
  bar.innerHTML = `<input type="search" id="vr-q" placeholder="ابحث عن جولة…" aria-label="بحث">
    <div class="chips" id="vr-chips"></div>`;
  $list.parentNode.insertBefore(bar, $list);
  const cats = ['all', ...Object.keys(CATEGORIES).filter(k => tours.some(d => d.cat === k))];
  function drawList() {
    document.getElementById('vr-chips').innerHTML = cats.map(k =>
      `<button type="button" class="chip ${fCat === k ? 'on' : ''}" data-c="${k}">${k === 'all' ? `الكل (${tours.length})` : CATEGORIES[k].icon + ' ' + CATEGORIES[k].label}</button>`).join('');
    const list = tours.filter(d => (fCat === 'all' || d.cat === fCat) && (!fQ || (d.name + govById(d.gov).name).includes(fQ)));
    $list.innerHTML = list.map(d => `
      <button class="vr-item ${current && current.id === d.id ? 'active' : ''}" type="button" data-id="${d.id}">
        <span class="thumb cat-${d.cat}" data-img="images/${d.id}.jpg"><i>${CATEGORIES[d.cat].icon}</i></span>
        <span><b>${d.name}</b><small>${govById(d.gov).name}</small></span>
      </button>`).join('') || '<p class="muted">لا توجد نتائج.</p>';
    loadPhotos($list);
  }
  bar.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) { fCat = b.dataset.c; drawList(); } });
  bar.querySelector('#vr-q').addEventListener('input', (e) => { fQ = e.target.value.trim(); drawList(); });
  $list.addEventListener('click', (e) => {
    const b = e.target.closest('.vr-item');
    if (b) { select(b.dataset.id); if (window.innerWidth < 980) stage.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  function showOverlay(html, loading) {
    clearTimeout(hideTimer);
    ovText.innerHTML = html;
    spinner.style.display = loading ? 'block' : 'none';
    overlay.classList.remove('hide');
  }
  function hideOverlay() { overlay.classList.add('hide'); }

  /* اختيار وجهة */
  function select(id) {
    const d = destById(id) && destById(id).vr ? destById(id) : tours[0];
    current = d;
    const g = govById(d.gov), c = CATEGORIES[d.cat];

    document.querySelectorAll('.vr-item').forEach(b => b.classList.toggle('active', b.dataset.id === d.id));
    const act = document.querySelector('.vr-item.active'); if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
    document.getElementById('vr-name').textContent = d.name;
    document.getElementById('vr-gov').textContent = `محافظة ${g.name}`;
    document.title = `جولة 360°: ${d.name} | اكتشف عُمان`;
    history.replaceState(null, '', `?id=${d.id}`);

    $info.innerHTML = `
      <h2>${c.icon} ${d.name}</h2>
      <p>${d.desc[0]}</p>
      <p class="muted" style="font-size:.85rem">مشهد 360° توضيحي مرسوم بالحاسوب لأجواء المكان.</p>
      <div class="btn-row">
        <a class="btn small dark" href="destination.html?id=${d.id}">تفاصيل الوجهة</a>
        <a class="btn small" href="map.html?id=${d.id}">على الخريطة</a>
        <a class="btn small ghost" style="color:var(--night)" href="${dirLink(d)}" target="_blank" rel="noopener">الاتجاهات</a>
      </div>`;

    const url = vrImage(d);
    showOverlay('جارٍ تحميل المشهد…', true);
    const img = new Image();
    img.onload = () => {
      sky.setAttribute('src', url);
      /* احتياط: إن لم يصل حدث تحميل الخامة نُخفي الشاشة بعد قليل */
      hideTimer = setTimeout(hideOverlay, 2500);
    };
    img.onerror = () => {
      showOverlay(`لا توجد صورة 360° لهذه الوجهة بعد.<br><small>ضع الصورة في: <code dir="ltr">${url}</code></small>`, false);
    };
    img.src = url;
    const i = tours.findIndex(t => t.id === d.id);
    [1, -1].forEach(k => { const n = new Image(); n.src = vrImage(tours[(i + k + tours.length) % tours.length]); });
  }

  sky.addEventListener('materialtextureloaded', () => { clearTimeout(hideTimer); hideOverlay(); });

  /* السابق / التالي */
  const step = (n) => {
    const i = tours.findIndex(t => t.id === current.id);
    select(tours[(i + n + tours.length) % tours.length].id);
  };
  document.getElementById('b-prev').addEventListener('click', () => step(-1));
  document.getElementById('b-next').addEventListener('click', () => step(1));

  /* دوران تلقائي */
  function setAuto(on) {
    auto = on;
    bAuto.classList.toggle('on', on);
    if (on) {
      sky.setAttribute('animation', {
        property: 'rotation', from: '0 -90 0', to: '0 270 0', dur: 240000, easing: 'linear', loop: true
      });
    } else {
      sky.removeAttribute('animation');
    }
  }
  bAuto.addEventListener('click', () => setAuto(!auto));

  /* ملء الشاشة (يعمل أيضًا على iPhone عبر وضع CSS) */
  function setFull(on) {
    stage.classList.toggle('is-full', on);
    document.body.style.overflow = on ? 'hidden' : '';
    bFull.textContent = on ? '✕ إغلاق' : 'ملء الشاشة';
    if (on && stage.requestFullscreen) stage.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
    setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
  }
  bFull.addEventListener('click', () => setFull(!stage.classList.contains('is-full')));
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && stage.classList.contains('is-full')) setFull(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && stage.classList.contains('is-full')) setFull(false);
  });

  /* وضع نظارة VR */
  document.getElementById('b-vr').addEventListener('click', async () => {
    try {
      if (!scene.hasLoaded) await new Promise(r => scene.addEventListener('loaded', r, { once: true }));
      await scene.enterVR();
    } catch (err) {
      alert('وضع VR غير متاح على هذا الجهاز أو المتصفح. جرّب Chrome على أندرويد، أو استمتع بالنظر حولك بتحريك الهاتف.');
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(-1); if (e.key === 'ArrowLeft') step(1); });
  select(qs('id') || tours[0].id);
  drawList();
});
