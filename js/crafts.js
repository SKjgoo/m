/* ===== صفحة الحرف والأسواق ودليل التواصل ===== */
document.addEventListener('DOMContentLoaded', () => {
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } }
  };

  /* الحرف */
  document.getElementById('crafts').innerHTML = CRAFTS.map(c => `
    <article class="item-card">
      <h3><span class="ic">${c.icon}</span>${c.name}</h3>
      <div class="tag-row"><span class="tag">${c.cat}</span><span class="tag">${c.material}</span></div>
      <p>${c.desc}</p>
      <p><b>أين تجدها:</b> ${c.where.join('، ')}</p>
      <p><b>نصيحة الشراء:</b> ${c.buy}</p>
      <div class="row-actions">
        ${c.dest ? `<a class="btn small dark" href="destination.html?id=${c.dest}">أين أجدها</a>` : ''}
        <a class="btn small light" href="https://www.google.com/search?q=${encodeURIComponent('شراء ' + c.name.split(' ')[0] + ' عمان')}" target="_blank" rel="noopener">بحث في المتصفح</a>
      </div>
    </article>`).join('');

  /* الأسواق */
  let gov = '';
  const sf = document.getElementById('souq-filter');
  const govs = [...new Set(SOUQS.map(s => s.gov))];
  function drawSouqs() {
    sf.innerHTML = `<button class="chip ${gov === '' ? 'on' : ''}" data-g="">الكل</button>` +
      govs.map(g => `<button class="chip ${gov === g ? 'on' : ''}" data-g="${g}">${govById(g).icon} ${govById(g).name}</button>`).join('');
    document.getElementById('souqs').innerHTML = SOUQS.filter(s => !gov || s.gov === gov).map(s => `
      <article class="item-card">
        <h3><span class="ic"></span>${s.name}</h3>
        <div class="tag-row"><span class="tag">محافظة ${govById(s.gov).name}</span><span class="tag">${s.days}</span></div>
        <p><b>ماذا يُباع:</b> ${s.sells}</p>
        <p>${s.tip}</p>
        <div class="row-actions">
          <a class="btn small dark" href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" rel="noopener">الاتجاهات</a>
          <a class="btn small" href="trip.html?to=${s.dest ? 'd:' + s.dest : 'gov:' + s.gov}">خطّط الطريق</a>
          ${s.dest ? `<a class="btn small light" href="destination.html?id=${s.dest}">التفاصيل</a>` : ''}
        </div>
      </article>`).join('');
  }
  sf.addEventListener('click', (e) => { const b = e.target.closest('[data-g]'); if (b) { gov = b.dataset.g; drawSouqs(); } });
  drawSouqs();

  /* حاسبة السعر */
  const ids = ['pc-mat', 'pc-hrs', 'pc-wage', 'pc-oh', 'pc-profit'];
  function calc() {
    const [m, h, w, oh, pr] = ids.map(i => parseFloat(document.getElementById(i).value) || 0);
    const labor = h * w, base = m + labor, over = base * oh / 100, floor = base + over, price = floor * (1 + pr / 100);
    document.getElementById('pc-out').innerHTML =
      `التكلفة (مواد + أجر): <b>${base.toFixed(2)}</b> ر.ع<br>السعر الأدنى بعد المصاريف: <b>${floor.toFixed(2)}</b> ر.ع<br>` +
      `السعر المقترح مع الربح: <b>${price.toFixed(2)}</b> ر.ع`;
  }
  ids.forEach(i => document.getElementById(i).addEventListener('input', calc)); calc();

  /* قائمة التسويق */
  const MK = ['صوّر منتجاتك بضوء طبيعي وخلفية بسيطة (5 صور لكل قطعة)', 'اكتب قصة كل قطعة: المادة، الصانع، المدة، المكان',
    'افتح حسابًا للمحل على واتساب أعمال واذكر الرقم بوضوح', 'ضع بطاقة تعريف أو رمز QR مع كل قطعة', 'جهّز تغليفًا آمنًا وقابلًا للتدوير',
    'سجّل في بطاقة الحرفي أو برامج الدعم لدى الجهة المختصة', 'اعرض منتجاتك في معرض أو سوق أو فندق قريب', 'اعرض ورشة قصيرة للزوار بحجز مسبق',
    'تتبّع الطلبات والأسعار في دفتر أو جدول', 'اطلب تقييمات من المشترين وانشرها بإذنهم'];
  const mkDone = new Set(store.get('mk-done', []));
  function drawMk() {
    document.getElementById('mk-list').innerHTML = MK.map((t, i) =>
      `<li><label><input type="checkbox" data-i="${i}" ${mkDone.has(i) ? 'checked' : ''}> <span>${t}</span></label></li>`).join('');
    document.getElementById('mk-bar').style.width = (mkDone.size / MK.length * 100) + '%';
  }
  document.getElementById('mk-list').addEventListener('change', (e) => {
    const i = +e.target.dataset.i; e.target.checked ? mkDone.add(i) : mkDone.delete(i);
    store.set('mk-done', [...mkDone]); drawMk();
  });
  drawMk();

  /* دليل التواصل */
  const TYPES = { all: 'الكل', craft: 'حرفيون ومحلات', adventure: 'منظّمو مغامرات', stay: 'إقامة', transport: 'نقل', official: 'جهات رسمية' };
  let ct = 'all';
  const cf = document.getElementById('c-filter');
  function drawContacts() {
    cf.innerHTML = Object.entries(TYPES).map(([k, l]) => `<button class="chip ${ct === k ? 'on' : ''}" data-t="${k}">${l}</button>`).join('');
    const list = CONTACTS.filter(c => ct === 'all' || c.type === ct);
    const hash = { craft: 'الحرف_العمانية', adventure: 'مغامرات_عمان', stay: 'فنادق_عمان', transport: 'سياحة_عمان', official: 'سياحة_عمان' }[ct];
    document.getElementById('contacts').innerHTML = (list.map(c => `
      <article class="contact-card">
        <b>${esc(c.name)}</b>
        <small>${esc(c.desc || '')}</small>
        <div class="lnks">
          ${c.phone ? `<a href="tel:${esc(c.phone)}" dir="ltr">${esc(c.phone)}</a>` : ''}
          ${c.wa ? `<a href="https://wa.me/${esc(c.wa)}" target="_blank" rel="noopener">واتساب</a>` : ''}
          ${c.x ? `<a href="https://x.com/${esc(c.x)}" target="_blank" rel="noopener">𝕏 @${esc(c.x)}</a>` : ''}
          ${c.web ? `<a class="ghost" href="${esc(c.web)}" target="_blank" rel="noopener">الموقع</a>` : ''}
        </div>
      </article>`).join('')) +
      ((ct === 'craft' || ct === 'adventure' || ct === 'stay') && !list.length ? `<div class="empty" style="grid-column:1/-1">لا توجد إدخالات موثّقة بعد في هذا القسم. أضف أول إدخال بالنموذج أدناه، أو ابحث مباشرة:
        <p><a class="btn small" target="_blank" rel="noopener" href="https://www.google.com/search?q=${encodeURIComponent(hash.replace(/_/g, ' '))}">بحث في المتصفح</a></p></div>` : '');
  }
  cf.addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { ct = b.dataset.t; drawContacts(); } });
  drawContacts();

  /* مولّد سطر البيانات */
  const form = document.getElementById('maker'), out = document.getElementById('maker-out'), cp = document.getElementById('maker-copy');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(form), o = {};
    o.id = 'c' + Date.now().toString(36); o.type = f.get('type'); o.name = f.get('name').trim();
    ['desc', 'phone', 'wa', 'x', 'web'].forEach(k => { const v = String(f.get(k) || '').trim(); if (v) o[k] = v; });
    const q = (v) => JSON.stringify(v);
    out.textContent = '  { ' + Object.entries(o).map(([k, v]) => `${k}: ${typeof v === 'boolean' ? v : q(v)}`).join(', ') + ' },';
    out.hidden = false; cp.hidden = false;
  });
  cp.addEventListener('click', async () => { try { await navigator.clipboard.writeText(out.textContent); cp.textContent = 'تم النسخ'; } catch (e) { cp.textContent = 'انسخ يدويًا'; } });
});
