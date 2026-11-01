/* ============================================================
   دوال مشتركة بين كل الصفحات: الترويسة والتذييل والبطاقات
   يجب تحميله بعد data.js
   ============================================================ */
const NAV = [
  { href: 'index.html',        label: 'الرئيسية',        key: 'home',    icon: '' },
  { href: 'history.html',      label: 'عُمان عبر الزمان', key: 'history', icon: '' },
  { href: 'governorates.html', label: 'المحافظات',       key: 'gov',     icon: '' },
  { href: 'destinations.html', label: 'الوجهات',         key: 'dest',    icon: '' },
  { href: 'map.html',          label: 'الخريطة',         key: 'map',     icon: '' },
  { href: 'trip.html',         label: 'الرحلة',          key: 'trip',    icon: '' },
  { href: 'crafts.html',       label: 'الحرف والأسواق',  key: 'crafts',  icon: '' },
  { href: 'adventure.html',    label: 'المغامرة',        key: 'adv',     icon: '' },
  { href: 'eco.html',          label: 'البيئة والتخييم', key: 'eco',     icon: '' },
  { href: 'safety.html',       label: 'الأمان والطقس',   key: 'safety',  icon: '' },
  { href: 'vr.html',           label: 'جولات VR 360°',   key: 'vr',      icon: '' },
  { href: 'plan.html',         label: 'خطّط رحلتك',      key: 'plan',    icon: '' }
];

/* ---------- الوضع الداكن / الفاتح ---------- */
function getTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('theme', t); } catch (e) { /* التخزين غير متاح */ }
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', t === 'dark' ? '#0a1210' : '#f1f4f1');
  document.querySelectorAll('.theme-switch button').forEach(b =>
    b.setAttribute('aria-pressed', String(b.dataset.theme === t)));
}

/* ---------- أدوات صغيرة ---------- */
const qs = (name) => new URLSearchParams(location.search).get(name);
const govById  = (id) => GOVERNORATES.find(g => g.id === id);
const destById = (id) => DESTINATIONS.find(d => d.id === id);
const destsOfGov = (id) => DESTINATIONS.filter(d => d.gov === id);
const vrImage = (d) => `images/360/${d.id}.jpg`;
const mapsLink = (d) => `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`;
const dirLink  = (d) => `https://www.google.com/maps/dir/?api=1&destination=${d.lat},${d.lng}`;

function distKm(a, b) {
  const R = 6371, rad = (x) => x * Math.PI / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const BRAND_SVG = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2l6 12 13-2-5 12 11 8-12 6 1 14-12-7-12 7 1-14L2 32l11-8-5-12 13 2z" fill="none" stroke="#e3b95a" stroke-width="2.2" stroke-linejoin="round"/><circle cx="24" cy="25" r="5" fill="#e3b95a"/></svg>`;

/* زخارف عُمانية متحركة في الواجهة + ظهور تدريجي للعناصر */
function omaniDecor() {
  const hero = document.querySelector('.hero');
  if (hero && !hero.querySelector('.hero-deco')) {
    const d = document.createElement('div');
    d.className = 'hero-deco'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = `
      <svg class="bigstar" viewBox="0 0 200 200"><g fill="none" stroke="#d9b25a" stroke-width="1.4"><path d="M100 6l17 38 41-9-9 41 36 22-36 22 9 41-41-9-17 38-17-38-41 9 9-41-36-22 36-22-9-41 41 9z"/><circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="58" stroke-dasharray="3 6"/></g></svg>
      <svg class="mab" viewBox="0 0 120 150"><g class="smoke"><path d="M60 46c-14-10 10-18-2-30"/><path d="M52 46c-12-8 8-16-2-26"/><path d="M68 46c-12-8 8-16-2-26"/></g>
        <path d="M30 70a30 26 0 0 1 60 0z" fill="#d9b25a"/><path d="M26 70h68l-6 18H32z" fill="#b8892b"/><circle cx="60" cy="48" r="4" fill="#d9b25a"/>
        <path d="M54 88h12l4 34H50z" fill="#c9a24b"/><path d="M34 128h52l6 16H28z" fill="#d9b25a"/><path d="M38 76h44" stroke="#7a5a18" stroke-width="2"/></svg>`;
    hero.insertBefore(d, hero.firstChild);
  }
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 });
  const SEL = '.card,.gov-card,.item-card,.stat,.lm,.panel,.cat-tile,.section-head,.contact-card,.how,.era,.vr-item';
  const scan = () => {
    let i = 0;
    document.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.rv) return;
      el.dataset.rv = '1';
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) return;
      el.classList.add('rv'); el.style.setProperty('--d', (i++ % 6) * 70 + 'ms'); io.observe(el);
    });
  };
  scan();
  let t; new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 80); }).observe(document.body, { childList: true, subtree: true });
}

/* ---------- بطاقة وجهة ---------- */
function destCard(d) {
  const c = CATEGORIES[d.cat], g = govById(d.gov);
  return `
  <a class="card" href="destination.html?id=${d.id}">
    <div class="cover cat-${d.cat}" data-img="images/${d.id}.jpg">
      <span class="cover-icon">${c.icon}</span>
      <span class="badge">${c.label}</span>
      ${d.vr ? '<span class="vr-chip">VR 360°</span>' : ''}
    </div>
    <div class="card-body">
      <h3>${d.name}</h3>
      <p class="loc">محافظة ${g.name}</p>
      <p>${d.summary}</p>
    </div>
  </a>`;
}

/* تحميل الصور الاختيارية: إن وُجد الملف يظهر وإلا يبقى التدرج اللوني */
function loadPhotos(root) {
  (root || document).querySelectorAll('[data-img]').forEach((n) => {
    if (n.dataset.done) return;
    n.dataset.done = '1';
    const im = new Image();
    im.onload = () => {
      n.style.setProperty('--img', `url('${new URL(n.dataset.img, location.href).href}')`);
      n.classList.add('has-img');
    };
    im.src = n.dataset.img;
  });
}

/* ---------- الشريط الجانبي (يمين الصفحة) والتذييل ---------- */
function buildChrome() {
  const page = document.body.dataset.page;
  document.body.classList.add('has-rail');
  const header = document.getElementById('site-header');
  if (header) {
    const brand = `
      <a class="brand" href="index.html" aria-label="اكتشف عُمان">
        <span class="brand-mark">${BRAND_SVG}</span>
        <span>اكتشف <b>عُمان</b></span>
      </a>`;
    header.innerHTML = `
    <div class="topbar">
      <button class="menu-btn" type="button" aria-label="القائمة" aria-expanded="false" aria-controls="rail">☰</button>
      ${brand}
    </div>
    <div class="rail-backdrop"></div>
    <aside class="rail" id="rail" aria-label="القائمة الرئيسية">
      ${brand}
      <nav class="rail-nav">
        ${NAV.map(n => `<a href="${n.href}" class="rail-link ${n.key === page ? 'active' : ''}" ${n.key === page ? 'aria-current="page"' : ''}><span class="ri">${n.icon}</span><span>${n.label}</span></a>`).join('')}
      </nav>
      <div class="rail-spacer"></div>
      <div class="rail-sep"></div>
      <div class="theme-switch" role="group" aria-label="مظهر الموقع">
        <button type="button" data-theme="light">فاتح</button>
        <button type="button" data-theme="dark">داكن</button>
      </div>
    </aside>`;
    const btn = header.querySelector('.menu-btn');
    const rail = header.querySelector('.rail');
    const back = header.querySelector('.rail-backdrop');
    const toggle = (open) => {
      rail.classList.toggle('open', open);
      back.classList.toggle('show', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? '✕' : '☰';
    };
    btn.addEventListener('click', () => toggle(!rail.classList.contains('open')));
    back.addEventListener('click', () => toggle(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    rail.querySelectorAll('.theme-switch button').forEach(b =>
      b.addEventListener('click', () => setTheme(b.dataset.theme)));
    setTheme(getTheme());
  }
  const footer = document.getElementById('site-footer');
  if (footer) {
    footer.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="foot-grid">
          <div>
            <h4>اكتشف عُمان</h4>
            <p>دليلك لعُمان عبر الزمان ولمحافظات السلطنة الإحدى عشرة: وجهات وخرائط ومخطّط رحلات وجولات افتراضية بتقنية 360°.</p>
          </div>
          <div>
            <h4>روابط سريعة</h4>
            <ul>${NAV.map(n => `<li><a href="${n.href}">${n.label}</a></li>`).join('')}</ul>
          </div>
          <div>
            <h4>للطوارئ</h4>
            <p>الرقم الموحّد للطوارئ في السلطنة: <b dir="ltr">9999</b></p>
          </div>
        </div>
        <div class="foot-bottom">© ${new Date().getFullYear()} اكتشف عُمان — خرائط © مساهمو OpenStreetMap</div>
      </div>
    </footer>`;
  }
}


/* ---------- الشريط المتحرك (الصفحة الرئيسية فقط) ---------- */
function buildTicker() {
  if (document.body.dataset.page !== 'home' || typeof SITE_CONFIG === 'undefined') return;
  const cfg = SITE_CONFIG.ticker;
  if (!cfg.enabled) return;
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const bar = document.createElement('div');
  bar.className = 'ticker';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'شريط الإعلانات');
  document.body.insertBefore(bar, document.body.firstChild);
  const text = cfg.messages.map(m => `<span class="tk-item">${esc(m)}</span>`).join('<span class="tk-sep" aria-hidden="true">◆</span>');
  const b = cfg.button && cfg.button.label ? `<a class="btn small tk-btn tk-btn2" href="${esc(cfg.button.href || '#')}">${esc(cfg.button.label)}</a>` : '';
  bar.innerHTML = `
    <button class="btn small tk-btn tk-up" type="button" id="tk-upload">ارفع صورك</button>
    <div class="tk-view"><div class="tk-move">${text}</div></div>
    ${b}`;
  bar.querySelector('.tk-move').style.animationDuration = Math.max(22, Math.round(cfg.messages.join('').length * 0.28 + 14)) + 's';
  buildUploader(esc);
}

/* ---------- رفع الصور وإرسالها ---------- */
function buildUploader(esc) {
  const U = (SITE_CONFIG.upload || {});
  const dlg = document.createElement('dialog');
  dlg.className = 'up-dlg';
  dlg.innerHTML = `
    <form method="dialog" class="up-form" id="up-form">
      <h3>شارك صورك واحصل على فرصة للهدايا</h3>
      ${U.rules ? `<p class="muted">${esc(U.rules)}</p>` : ''}
      <label class="up-pick">اختر الصور (حتى ${U.max || 10})
        <input type="file" id="up-files" accept="image/*" multiple>
      </label>
      <div class="up-prev" id="up-prev"></div>
      <label>اسمك<input id="up-name" autocomplete="name"></label>
      <label>رقم للتواصل أو بريد (اختياري)<input id="up-contact" dir="ltr"></label>
      <label>أين التُقطت الصور؟<input id="up-place"></label>
      <p class="up-msg" id="up-msg" aria-live="polite"></p>
      <div class="btn-row">
        <button class="btn" type="button" id="up-send">إرسال</button>
        <button class="btn light" type="button" id="up-close">إغلاق</button>
      </div>
    </form>`;
  document.body.appendChild(dlg);
  const $ = (id) => dlg.querySelector('#' + id);
  let files = [];
  const max = U.max || 10;
  const msg = (t, ok) => { $('up-msg').textContent = t; $('up-msg').className = 'up-msg' + (ok ? ' ok' : ''); };
  document.getElementById('tk-upload').addEventListener('click', () => { dlg.showModal ? dlg.showModal() : dlg.setAttribute('open', ''); });
  $('up-close').addEventListener('click', () => dlg.close());
  let detected = null;
  $('up-files').addEventListener('change', async (e) => {
    files = [...e.target.files].filter(f => f.type.startsWith('image/')).slice(0, max);
    $('up-prev').innerHTML = '';
    files.forEach(f => { const im = new Image(); im.src = URL.createObjectURL(f); im.alt = ''; $('up-prev').appendChild(im); });
    detected = null;
    msg(files.length ? `تم اختيار ${files.length} صورة` : '', true);
    /* تحليل الصور: قراءة GPS وتحديد أقرب وجهة تلقائيًا */
    if (window.readPhotoGps) {
      for (const f of files) {
        const g = await window.readPhotoGps(f);
        const hit = g && window.nearestDestination(g, 25);
        if (hit) { detected = { id: hit.dest.id, name: hit.dest.name, g }; break; }
      }
      if (detected) { if (!$('up-place').value) $('up-place').value = detected.name; msg(`تعرّفنا على المكان من الصورة: ${detected.name}`, true); }
      else if (files.length) msg(`تم اختيار ${files.length} صورة. اكتب اسم المكان إن لم يُحدَّد تلقائيًا.`, true);
    }
  });
  const textOf = () => {
    const name = $('up-name').value.trim(), contact = $('up-contact').value.trim(), place = $('up-place').value.trim();
    return `صور من اكتشف عُمان\nالاسم: ${name}\nالتواصل: ${contact}\nالمكان: ${place}` +
      (detected ? `\nالوجهة المكتشفة من GPS: ${detected.name} (${detected.id})\nالإحداثيات: ${detected.g.lat.toFixed(5)}, ${detected.g.lng.toFixed(5)}` : '') +
      `\nعدد الصور: ${files.length}`;
  };
  if (navigator.canShare) {
    const sb = document.createElement('button');
    sb.type = 'button'; sb.className = 'btn light'; sb.id = 'up-share'; sb.textContent = 'مشاركة الصور مباشرة';
    $('up-close').before(sb);
    sb.addEventListener('click', async () => {
      if (!files.length) { msg('اختر صورة واحدة على الأقل.'); return; }
      try {
        if (!navigator.canShare({ files })) { msg('جهازك لا يدعم مشاركة الصور من المتصفح، استخدم زر إرسال.'); return; }
        await navigator.share({ files, title: 'صور من اكتشف عُمان', text: textOf() });
        msg('اختر واتساب ثم الرقم ' + (U.whatsappDisplay || ''), true);
      } catch (e) { if (!e || e.name !== 'AbortError') msg('تعذّرت المشاركة.'); }
    });
  }
  $('up-send').addEventListener('click', async () => {
    if (!files.length) { msg('اختر صورة واحدة على الأقل.'); return; }
    try {
      if (U.endpoint) {
        const fd = new FormData();
        fd.append('message', textOf());
        files.forEach((f, i) => fd.append('photo' + (i + 1), f, f.name));
        msg('جارٍ الإرسال…', true);
        const r = await fetch(U.endpoint, { method: 'POST', body: fd, headers: { Accept: 'application/json' } });
        if (!r.ok) throw new Error('http ' + r.status);
        msg('وصلتنا صورك، شكرًا لك!', true); return;
      }
      /* يتحوّل مباشرة إلى محادثة واتساب مع الرقم */
      const text = textOf() + '\n\n(سأرفق الصور هنا)';
      window.open(`https://wa.me/${U.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      msg('فُتحت محادثة واتساب. اضغط وأرفق صورك ثم أرسل.', true);
    } catch (e) {
      msg('تعذّر الإرسال التلقائي. أرسل صورك إلى واتساب ' + (U.whatsappDisplay || '') + ' يدويًا.');
    }
  });
}

/* زر خدمة العملاء العائم: يفتح الرابط في تبويب جديد */
const SUPPORT_URL = 'https://skjgoo.github.io/-/';
function buildSupport() {
  if (document.querySelector('.support-fab')) return;
  const a = document.createElement('a');
  a.className = 'support-fab';
  a.href = SUPPORT_URL; a.target = '_blank'; a.rel = 'noopener';
  a.setAttribute('aria-label', 'خدمة العملاء');
  a.innerHTML = '<img src="images/customer-service.png" alt="خدمة العملاء" width="512" height="512" loading="lazy">';
  document.body.appendChild(a);
}

document.addEventListener('DOMContentLoaded', () => {
  buildChrome();
  buildSupport();
  buildTicker();
  omaniDecor();
  { let pt; new MutationObserver(() => { clearTimeout(pt); pt = setTimeout(() => loadPhotos(), 60); }).observe(document.body, { childList: true, subtree: true }); }
  loadPhotos();
});
