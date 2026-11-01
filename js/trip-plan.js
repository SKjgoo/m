/* ============================================================
   إضافات صفحة الرحلة: الطقس عند الوجهة، الإقامة والمطاعم، النقل، وخطط الرحلات.
   تُستدعى tripExtras(ctx) من trip.js بعد رسم المسار.
   ctx = { A, B, coords, cum, total, destNear }
   ============================================================ */
(function () {
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const gm = (lat, lng) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const kmBetween = (a, b) => {
    const R = 6371, r = (x) => x * Math.PI / 180;
    const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  function nearestGov(p) {
    if (p.gov) return p.gov;
    let best = null, bd = 1e9;
    TOWNS.forEach(t => { const d = kmBetween(p, t); if (d < bd) { bd = d; best = t.g; } });
    return best;
  }

  async function ovp(query) {
    let err;
    for (const ep of OVERPASS) {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 40000);
      try {
        const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(query), signal: ctl.signal });
        if (!r.ok) throw new Error('ovp ' + r.status);
        return (await r.json()).elements || [];
      } catch (e) { err = e; } finally { clearTimeout(t); }
    }
    throw err;
  }

  /* ---------- الطقس ---------- */
  function weatherBlock(ctx) {
    const el = document.getElementById('trip-wx');
    renderWeatherRisk(el, { lat: ctx.B.lat, lng: ctx.B.lng, name: ctx.B.label });
    document.getElementById('trip-wx-link').href = 'safety.html' + (ctx.B.key ? '?loc=' + encodeURIComponent(ctx.B.key) : '');
  }

  /* ---------- الإقامة والمطاعم ---------- */
  async function stayBlock(ctx) {
    const B = ctx.B, gov = nearestGov(B);
    const cur = HOTELS[gov] || [];
    const wrap = document.getElementById('trip-stay');
    const curHtml = cur.length ? `<ul class="near-list">${cur.map(h => `<li><span><b>${esc(h.n)}</b> <small class="muted">${TIERS[h.tier]}</small></span>
      <span><a class="m" target="_blank" rel="noopener" href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.n)}">احجز</a> • <a class="m" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.n + ' عمان')}">الخريطة</a></span></li>`).join('')}</ul>`
      : '<p class="muted">لا أمثلة مسجّلة لهذه المحافظة؛ انظر القائمة الحية أدناه.</p>';
    wrap.innerHTML = `
      <h4>أمثلة معروفة في محافظة ${govById(gov) ? govById(gov).name : ''}</h4>${curHtml}
      <p class="muted" style="font-size:.85rem">أسماء للاسترشاد فقط؛ لا نعرض التوفر أو الأسعار، فتحقّق قبل الحجز.</p>
      <h4 style="margin-top:18px">قرب وجهتك الآن (من OpenStreetMap)</h4><div id="live-stay"><p class="muted">جارٍ البحث…</p></div>`;
    const q = `[out:json][timeout:50];(` +
      `nwr["tourism"~"^(hotel|guest_house|hostel|motel|apartment|camp_site|resort)$"](around:6000,${B.lat},${B.lng});` +
      `nwr["amenity"~"^(restaurant|cafe|fast_food)$"](around:3500,${B.lat},${B.lng}););out center tags 120;`;
    const live = document.getElementById('live-stay');
    try {
      const els = await ovp(q);
      const rows = els.map(e => {
        const lat = e.lat != null ? e.lat : e.center && e.center.lat, lng = e.lon != null ? e.lon : e.center && e.center.lon;
        if (lat == null) return null;
        const t = e.tags || {}, name = t['name:ar'] || t.name || t['name:en']; if (!name) return null;
        const stay = !!t.tourism;
        return { name, stay, kind: stay ? t.tourism : t.amenity, lat, lng, d: kmBetween(B, { lat, lng }), phone: t.phone || t['contact:phone'] || '', cuisine: t.cuisine || '' };
      }).filter(Boolean).sort((a, b) => a.d - b.d);
      const K = { hotel: 'فندق', guest_house: 'بيت ضيافة', hostel: 'نُزل', motel: 'موتيل', apartment: 'شقق', camp_site: 'مخيم', resort: 'منتجع', restaurant: 'مطعم', cafe: 'مقهى', fast_food: 'وجبات سريعة' };
      const draw = (arr) => arr.length ? `<ul class="near-list">${arr.slice(0, 12).map(r => `<li><span><b>${esc(r.name)}</b> <small class="muted">${K[r.kind] || r.kind}${r.cuisine ? ' • ' + esc(r.cuisine) : ''} • ${r.d < 1 ? Math.round(r.d * 1000) + ' م' : r.d.toFixed(1) + ' كم'}</small></span>
        <span>${r.phone ? `<a class="m" href="tel:${esc(r.phone)}" dir="ltr"></a> • ` : ''}<a class="m" target="_blank" rel="noopener" href="${gm(r.lat, r.lng)}">الخريطة</a></span></li>`).join('')}</ul>` : '<p class="muted">لا نتائج مسجّلة في OpenStreetMap لهذه المنطقة.</p>';
      live.innerHTML = `<h5 style="margin:6px 0">الإقامة</h5>${draw(rows.filter(r => r.stay))}<h5 style="margin:14px 0 6px">المطاعم والمقاهي</h5>${draw(rows.filter(r => !r.stay))}
        <p class="muted" style="font-size:.85rem">بيانات متطوعين وقد تكون ناقصة. الأرقام تظهر فقط إن سُجِّلت في الخريطة.</p>`;
    } catch (e) {
      live.innerHTML = `<div class="note">تعذّر جلب الفنادق والمطاعم القريبة الآن. ابحث في خرائط جوجل:
        <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('فنادق')}&center=${B.lat},${B.lng}"><b>فنادق</b></a> •
        <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('مطاعم')}&center=${B.lat},${B.lng}"><b>مطاعم</b></a></div>`;
    }
  }

  /* ---------- النقل ---------- */
  function transportBlock(ctx) {
    const km = ctx.total, did = ctx.B.key && ctx.B.key.startsWith('d:') ? ctx.B.key.slice(2) : null;
    const tips = [];
    if (km < 40) tips.push('مسافة قصيرة: سيارة أجرة أو تطبيق نقل أو حافلة محلية تكفي.');
    else if (km < 350) tips.push('مسافة متوسطة: السيارة المستأجرة أو الخاصة الأنسب، وتوجد حافلات بين المدن الرئيسية.');
    else tips.push(`مسافة طويلة (${Math.round(km)} كم): فكّر في الطيران الداخلي إن وُجد خط، أو خصّص يومين للقيادة مع التزوّد بالوقود والراحة.`);
    if (did && NEEDS_4X4.includes(did)) tips.push('هذه الوجهة تحتاج عادةً سيارة دفع رباعي أو نقلًا مع مرشد، تحقّق من متطلبات الطريق.');
    if (ctx.B.gov === 'musandam' || ctx.A.gov === 'musandam') tips.push('الطريق البري لمسندم يمرّ عبر الإمارات؛ جهّز وثائق العبور والتأمين.');
    const cMap = Object.fromEntries(CONTACTS.map(c => [c.id, c]));
    document.getElementById('trip-transport').innerHTML = `
      <ul class="check-list tips-list" style="margin-bottom:14px">${tips.map(t => `<li>${t}</li>`).join('')}</ul>
      <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(250px,1fr))">${TRANSPORT.map(t => {
        const c = t.contact ? cMap[t.contact] : null;
        return `<article class="contact-card"><b>${t.icon} ${t.name}</b><small>${t.use}</small>
          <div class="lnks">${c && c.phone ? `<a href="tel:${esc(c.phone)}" dir="ltr">${esc(c.phone)}</a>` : ''}${c && c.web ? `<a class="ghost" href="${esc(c.web)}" target="_blank" rel="noopener">الموقع</a>` : ''}</div></article>`;
      }).join('')}</div>`;
  }

  /* ---------- خطط الرحلات ---------- */
  function planForm() {
    const f = document.getElementById('plan-form');
    if (f.dataset.ready) return; f.dataset.ready = '1';
    f.innerHTML = `
      <label>عدد الأيام<select name="days">${[1, 2, 3, 4, 5, 6, 7].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label>الميزانية<select name="budget"><option value="1">اقتصادية</option><option value="2" selected>متوسطة</option><option value="3">فاخرة</option></select></label>
      <label>المسافرون<select name="group"><option value="family">عائلة</option><option value="friends">أصدقاء</option><option value="solo">فرد/زوجان</option></select></label>
      <label>شهر السفر<select name="month">${['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'].map((m, i) => `<option value="${i + 1}" ${i === new Date().getMonth() ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
      <fieldset class="full" style="border:0;padding:0;margin:0"><legend style="font-weight:600;font-size:.9rem;margin-bottom:4px">اهتماماتك (اختياري)</legend>
        <div class="chips">${Object.entries(CATEGORIES).map(([k, c]) => `<label class="chip"><input type="checkbox" name="cat" value="${k}"> ${c.icon} ${c.label}</label>`).join('')}</div></fieldset>
      <div class="full btn-row"><button class="btn" type="submit">اقترح خطة رحلة</button></div>`;
    f.addEventListener('submit', (e) => { e.preventDefault(); if (window.TripCtx) makePlan(window.TripCtx, new FormData(f)); });
  }

  function makePlan(ctx, fd) {
    const days = +fd.get('days'), budget = +fd.get('budget'), month = +fd.get('month'), group = fd.get('group');
    const cats = fd.getAll('cat');
    const B = ctx.B, A = ctx.A, bid = B.key && B.key.startsWith('d:') ? B.key.slice(2) : null;
    const summer = month >= 6 && month <= 9, cool = month >= 11 || month <= 3;
    const onRoute = new Map(ctx.destNear.map(d => [d.id, d]));
    let cand = DESTINATIONS.filter(d => d.id !== bid).map(d => {
      const near = onRoute.get(d.id), dB = kmBetween(B, d);
      if (!near && dB > 90) return null;
      let s = 0;
      if (near) s += 3 - Math.min(2, near.off / 15);
      if (dB <= 90) s += 2;
      if (cats.length) { if (cats.includes(d.cat)) s += 3; else s -= 2; }
      if (summer) { if (d.gov === 'dhofar') s += 4; if (d.cat === 'desert') s -= 3; if (d.cat === 'sea' && d.gov === 'musandam') s -= 1; if (d.cat === 'mountain') s += 1; }
      if (cool && (d.cat === 'desert' || d.cat === 'mountain')) s += 1;
      if (!summer && d.gov === 'dhofar') s -= 1;
      if (group === 'family' && (d.cat === 'mountain' || NEEDS_4X4.includes(d.id))) s -= 1;
      return { d, s, km: near ? near.km : ctx.total };
    }).filter(Boolean).sort((a, b) => b.s - a.s);
    const perDay = group === 'family' ? 2 : 3;
    const picks = cand.slice(0, Math.max(1, (days - 1) * perDay + (bid ? 0 : 1))).sort((a, b) => a.km - b.km);

    /* توزيع على الأيام */
    const buckets = Array.from({ length: days }, () => []);
    picks.forEach((p, i) => buckets[Math.min(days - 1, Math.floor(i * days / Math.max(1, picks.length)))].push(p));
    if (bid) buckets[days - 1].push({ d: destById(bid), s: 99, km: ctx.total });

    const tier = (g) => {
      const l = (HOTELS[g] || []).slice();
      if (!l.length) return null;
      l.sort((x, y) => Math.abs(x.tier - budget) - Math.abs(y.tier - budget));
      return l[0];
    };
    let html = '';
    let pos = { lat: A.lat, lng: A.lng, label: A.label };
    buckets.forEach((arr, i) => {
      let dayKm = 0;
      const stops = arr.map(p => { const k = kmBetween(pos, p.d) * 1.3; dayKm += k; pos = p.d; return { p, k }; });
      const last = i === days - 1;
      const g = (arr.length ? arr[arr.length - 1].d.gov : nearestGov(pos));
      const h = last && days > 1 && !B.key ? null : tier(g);
      html += `<article class="plan-day"><h4>اليوم ${i + 1}${last ? ' — الوصول' : ''}</h4>
        ${stops.length ? `<ul class="near-list">${stops.map(({ p, k }) => `<li><span><a class="m" href="destination.html?id=${p.d.id}">${CATEGORIES[p.d.cat].icon} ${p.d.name}</a> <small class="muted">${govById(p.d.gov).name} • نحو ${Math.round(k)} كم</small></span>
          <a class="m" href="safety.html?loc=d:${p.d.id}"></a></li>`).join('')}</ul>` : '<p class="muted">يوم حر للراحة والأسواق والمطاعم القريبة.</p>'}
        <p class="muted" style="margin:8px 0 0;font-size:.9rem">قيادة تقديرية: ${Math.round(dayKm)} كم${dayKm > 350 ? ' يوم طويل، فكّر في تقليل المحطات' : ''}${!last && h ? ` • مبيت مقترح: <b>${h.n}</b> (${TIERS[h.tier]})` : ''}</p></article>`;
    });
    const notes = [];
    if (summer) notes.push('الصيف: الحرارة عالية في معظم السلطنة؛ ظفار في موسم الخريف بديل جميل، وتجنّب الكثبان نهارًا.');
    if (cool) notes.push('الشتاء: الليالي باردة في الجبال والصحراء، فاحمل ملابس دافئة.');
    if (group === 'family') notes.push('للعائلات: خُففت المحطات الجبلية والوعرة، وتأكّد من الراحة والسلامة عند الأودية.');
    notes.push('الخطة تقديرية من المسافات المستقيمة ×1.3 ولا تعتمد على ساعات فتح المواقع.');
    document.getElementById('plan-out').innerHTML = `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">${html}</div>
      <ul class="check-list tips-list" style="margin-top:16px">${notes.map(n => `<li>${n}</li>`).join('')}</ul>`;
  }

  window.tripExtras = function (ctx) {
    window.TripCtx = ctx;
    document.getElementById('extras').hidden = false;
    weatherBlock(ctx); transportBlock(ctx); stayBlock(ctx); planForm();
    document.getElementById('plan-out').innerHTML = '<p class="muted">اضبط الخيارات ثم اضغط «اقترح خطة رحلة».</p>';
  };
})();
