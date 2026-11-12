/* ============================================================
   المساعد السياحي: محرك المحادثة (يعمل بالكامل في المتصفح)
   يفهم السؤال بالعربية (بما فيه اللهجة الخليجية البسيطة) ويجيب من:
   الوجهات، المحافظات، المغامرات، الحرف والأسواق، التاريخ، الإقامة والنقل، وقاعدة الأسئلة العامة (chat-kb.js).
   ليس نموذجًا توليديًا: لا يؤلّف معلومات، بل يعرض ما هو موجود في بيانات الموقع.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- أدوات النص ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
      .replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  function strip(t) {
    if (t.length > 4 && /^(وال|بال|كال|فال)/.test(t)) return t.slice(3);
    if (t.length > 3 && /^(ال|لل)/.test(t)) return t.slice(2);
    if (t.length > 3 && /^[وبلفك]/.test(t) && !/^(وادي|وهيبه|وسط)/.test(t)) return t.slice(1);
    return t;
  }
  const STOP = new Set(('في من على الي الى عن هل ما ماذا كيف اين وين متي كم لي لو انا انت ايش وش هذا هذه ذا هذي ذلك هو هي مع او ان يا بس ابغا ابي ابا اريد اعرف عندي عندك فيه فيها يوجد توجد ممكن لازم يعني شي شيء كل بعد قبل بين حول مثل ثم او اذا اذن لكن ليش لماذا تقدر تقدر اقدر ممكن ياريت اعطني اعطيني قولي قل اخبرني ابحث لقيت').split(' ').map(norm));
  const toks = (s) => norm(s).split(' ').filter(Boolean).map(strip);
  const content = (s) => toks(s).filter((t) => t.length > 1 && !STOP.has(t));

  /* ---------- البيانات ---------- */
  const govName = (id) => (govById(id) || {}).name || '';
  const catLabel = (c) => (CATEGORIES[c] || {}).label || '';
  const hasData = (n) => typeof window[n] !== 'undefined' || (function () { try { return typeof eval(n) !== 'undefined'; } catch (e) { return false; } })();

  const ALIAS = {
    'grand-mosque': ['جامع السلطان قابوس', 'الجامع الكبير', 'جامع قابوس', 'مسجد السلطان قابوس', 'الجامع الاكبر'],
    'royal-opera': ['دار الاوبرا', 'الاوبرا', 'اوبرا مسقط'],
    'bimmah': ['هاويه نجم', 'بمه', 'حفره بمه', 'بمة'],
    'mutrah': ['مطرح', 'سوق مطرح', 'سوق الظلام', 'كورنيش مطرح'],
    'old-muscat': ['قصر العلم', 'الجلالي', 'الميراني', 'مسقط القديمه'],
    'nizwa': ['نزوي', 'قلعه نزوي', 'سوق نزوي'],
    'jabal-shams': ['جبل شمس', 'وادي غل', 'درب الشرفه', 'جبل شمس'],
    'jabal-akhdar': ['الجبل الاخضر', 'جبل الاخضر'],
    'wahiba-sands': ['رمال الشرقيه', 'وهيبه', 'الوهيبه', 'رمال وهيبه'],
    'ras-al-jinz': ['راس الجنز', 'السلاحف', 'راس الحد', 'سلاحف'],
    'wadi-shab': ['وادي شاب', 'وادي شب'],
    'wadi-bani-khalid': ['بني خالد'],
    'sur-dhow': ['صناعه السفن', 'السفن الشراعيه', 'مدينه صور'],
    'masirah': ['مصيره', 'جزيره مصيره'],
    'duqm-rock-garden': ['الدقم', 'حديقه الصخور'],
    'sohar-fort': ['صحار', 'قلعه صحار'],
    'rustaq-fort': ['الرستاق', 'قلعه الرستاق'],
    'nakhal-fort': ['نخل', 'قلعه نخل'],
    'al-baleed': ['البليد', 'حديقه البليد'],
    'mughsail': ['المغسيل', 'مغسيل', 'نوافير المغسيل'],
    'wadi-darbat': ['دربات', 'وادي دربات'],
    'khor-rori': ['خور روري', 'سمهرم'],
    'khasab-castle': ['قلعه خصب'],
    'musandam-fjords': ['الخيران', 'فيوردات', 'فيوردات مسندم'],
    'buraimi-fort': ['حصن الخندق', 'الخندق'],
    'bahla': ['بهلاء', 'قلعه بهلاء', 'بهلا'],
    'jabrin': ['جبرين', 'قلعه جبرين'],
    'al-hamra': ['الحمراء', 'الحمراء القديمه'],
    'bat-al-khutm': ['بات', 'الخطم', 'العين الاثريه', 'بات والخطم'],
    'national-museum': ['المتحف الوطني'],
    'bait-al-zubair': ['بيت الزبير'],
    'natural-history-museum': ['متحف التاريخ الطبيعي'],
    'omani-french-museum': ['المتحف العماني الفرنسي'],
    'bait-al-baranda': ['بيت البراندا'],
    'armed-forces-museum': ['متحف القوات المسلحه', 'بيت الفلج'],
    'land-of-frankincense': ['متحف ارض اللبان', 'ارض اللبان'],
    'oman-across-ages': ['عمان عبر العصور', 'متحف منح']
  };
  const GOV_ALIAS = {
    muscat: ['مسقط'], dhofar: ['ظفار', 'صلاله', 'صلالة'], musandam: ['مسندم', 'خصب'],
    buraimi: ['البريمي'], dakhiliyah: ['الداخليه', 'داخليه'], 'north-batinah': ['شمال الباطنه'],
    'south-batinah': ['جنوب الباطنه'], 'north-sharqiyah': ['شمال الشرقيه'], 'south-sharqiyah': ['جنوب الشرقيه'],
    dhahirah: ['الظاهره', 'عبري'], wusta: ['الوسطي', 'الدقم', 'ادم']
  };

  /* فهرس أسماء الوجهات مع وزن للكلمات النادرة */
  const nameTok = {};
  DESTINATIONS.forEach((d) => {
    const set = new Set(content(d.name));
    (ALIAS[d.id] || []).forEach((a) => content(a).forEach((t) => set.add(t)));
    ['عمان', 'عماني', 'سلطنه', 'مسقط'].forEach((g) => { set.delete(g); });
    set.delete('عمان');
    nameTok[d.id] = [...set];
  });
  const df = {};
  Object.values(nameTok).forEach((arr) => arr.forEach((t) => { df[t] = (df[t] || 0) + 1; }));
  const idf = (t) => Math.log(1 + DESTINATIONS.length / (df[t] || 1));

  function findDest(qTokens, raw) {
    const q = new Set(qTokens);
    if (q.has('صور') && !/(في|الي|الى|إلى|من|مدينه|مدينة|ولايه|ولاية|عن|زياره|زيارة|اروح|رحله)\s+صور/.test(norm(raw))) q.delete('صور');
    const ql = norm(raw);
    let best = null, second = 0;
    DESTINATIONS.forEach((d) => {
      let s = 0;
      nameTok[d.id].forEach((t) => { if (q.has(t)) s += idf(t); });
      (ALIAS[d.id] || []).forEach((a) => { if (ql.includes(norm(a)) && norm(a).length > 3) s += 2.5; });
      if (s > 0 && (!best || s > best.s)) { second = best ? best.s : 0; best = { d, s }; }
      else if (s > second) second = s;
    });
    if (!best) return null;
    const okTok = best.s >= 1.6;
    return okTok && best.s > second * 1.05 ? best.d : (okTok && best.s >= 3 ? best.d : null);
  }
  function findGov(qTokens, raw) {
    const ql = ' ' + norm(raw) + ' ';
    const hits = [];
    GOVERNORATES.forEach((g) => {
      const names = [norm(g.name), norm(g.capital)].concat((GOV_ALIAS[g.id] || []).map(norm));
      if (names.some((n) => n && (ql.includes(' ' + n + ' ') || ql.includes(' ال' + n + ' ') || qTokens.includes(strip(n))))) hits.push(g);
    });
    if (/باطنه/.test(ql) && !hits.some((g) => /batinah/.test(g.id))) hits.push(govById('north-batinah'), govById('south-batinah'));
    if (/شرقيه/.test(ql) && !hits.some((g) => /sharqiyah/.test(g.id))) hits.push(govById('north-sharqiyah'), govById('south-sharqiyah'));
    const uniq = [...new Set(hits.filter(Boolean))];
    // شمال/جنوب: خصّص إن وُجدت
    if (/شمال/.test(ql)) { const f = uniq.filter((g) => /north/.test(g.id)); if (f.length) return f; }
    if (/جنوب/.test(ql)) { const f = uniq.filter((g) => /south/.test(g.id)); if (f.length) return f; }
    return uniq.length ? uniq : null;
  }

  /* ---------- نية السؤال ---------- */
  const RX = {
    best: /(افضل|احسن|انسب|مناسب)\s*(وقت|موسم|شهر|فصل)|متي\s*(اروح|ازور|اسافر|احسن|افضل|انسب|يكون)|موسم|وقت\s*(مناسب|الزياره)|متي\s*اروح/,
    duration: /كم\s*(ياخذ|تاخذ|مده|وقت|نحتاج|احتاج|يستغرق|ساعه|يوم|ساعات)|مده\s*(الزياره|البقاء)|يستغرق|كم\s*اقعد|كم\s*بقي/,
    tips: /نصايح|نصائح|نصيحه|توصيات|تنبيهات|احذر|احتاج\s*اخذ|ايش\s*احضر|ماذا\s*احضر|ماذا\s*اخذ|ايش\s*اخذ|اخذ\s*معي|اجهز/,
    where: /(وين|اين|فين)\b|موقع|خريطه|اوصل|اروح|اتجاهات|طريق|مسافه|كيف\s*اصل|كيف\s*اروح|احداثيات/,
    see: /ايش\s*فيه|ماذا\s*يوجد|ابرز|معالم|اهم\s*(ما|الاماكن)|ماذا\s*اشوف|ايش\s*اشوف|ماذا\s*افعل|ايش\s*اسوي|ماذا\s*اسوي|انشطه|اسوي\s*فيه|مميزات|شو\s*فيه|وش\s*فيه/,
    hotel: /فندق|فنادق|اقامه|سكن|انام|منتجع|بيت\s*ضيافه|نزل/,
    vr: /360|vr|افتراضي|جوله\s*افتراضيه|واقع\s*افتراضي|بانوراما|شوفه\s*360|صوره\s*360/,
    photos: /صور\s*ال|معرض|الصور|صوره/,
    safe: /امن|آمن|امان|خطر|خطير|سلامه|ينفع\s*اسبح|اسبح/,
    car: /دفع\s*رباعي|رباعي|سياره\s*عاديه|سياره\s*صغيره|4x4|اوصل\s*بسياره/,
    weather: /طقس|جو\b|الجو|حراره|درجه\s*الحراره|امطار|مطر\s*اليوم|توقعات|رياح|رطوبه|هل\s*ممطر|برد\s*الان/,
    weatherNow: /الان|اليوم|الحين|حاليا|غدا|بكره|هالايام|الاسبوع|توقعات|نشره/,
    list: /اماكن|وجهات|اقترح|رشح|ايش\s*احسن|ماذا\s*اشوف|اجمل|اشهر|ابرز|الا\s*سياحيه|قائمه|يعني\s*ايش|اهم/,
    thanks: /شكرا|مشكور|يعطيك\s*العافيه|تسلم|جزاك|يسلمو/,
    bye: /مع\s*السلامه|باي|وداعا|الى\s*اللقاء/
  };
  const CAT_RX = [
    ['heritage', /قلعه|قلاع|حصن|حصون|تراث|اثار|اثريه|اثري/],
    ['museum', /متحف|متاحف/],
    ['nature', /طبيعه|طبيعي|اوديه|وادي|اودية|عيون|شلال|برك|كهوف|حفره/],
    ['mountain', /جبل|جبال|جبليه|مرتفعات|مشي\s*جبلي/],
    ['desert', /صحراء|صحراوي|كثبان|رمال|سفاري/],
    ['sea', /شاطي|شواطي|بحر|بحريه|جزيره|جزر|ساحل|سباحه|غطس|غوص/],
    ['culture', /ثقافه|ثقافي|معالم|سوق|اسواق|جامع|مسجد|اوبرا/]
  ];

  /* ---------- درجة تطابق قاعدة المعرفة ---------- */
  const KB = CHAT_KB.map((e) => ({
    e,
    kws: e.kw.map((k) => { const tk = toks(k); return { str: ' ' + tk.join(' ') + ' ', n: tk.length, tk }; }).filter((k) => k.n),
    title: content(e.t)
  }));
  function kbScore(entry, qTokens) {
    const qs = ' ' + qTokens.join(' ') + ' ';
    let s = 0;
    entry.kws.forEach((k) => {
      if (k.n > 1) { if (qs.includes(k.str)) s += 3 * k.n; return; }
      const t = k.tk[0];
      if (qTokens.includes(t)) s += t.length > 3 ? 3 : 2;
      else if (t.length >= 5 && qTokens.some((q) => q.length >= 4 && (q.startsWith(t) || t.startsWith(q)))) s += 1.5;
    });
    entry.title.forEach((t) => { if (qTokens.includes(t)) s += 1; });
    return s;
  }

  /* ---------- مصفوفة بحث نصي عامة ---------- */
  const DOCS = [];
  function addDoc(kind, title, text, href, sub, img) {
    const set = new Set(content(title + ' ' + text));
    const tset = new Set(content(title));
    DOCS.push({ kind, title, text, href, sub, img, set, tset });
  }
  DESTINATIONS.forEach((d) => addDoc('dest', d.name, [d.summary, (d.desc || []).join(' '), (d.highlights || []).join(' '), (d.tips || []).join(' '), d.bestTime, govName(d.gov), catLabel(d.cat)].join(' '),
    'destination.html?id=' + d.id, govName(d.gov) + ' · ' + catLabel(d.cat), 'images/' + d.id + '.jpg'));
  if (typeof ADVENTURES !== 'undefined') ADVENTURES.forEach((a) => addDoc('adv', a.name, [a.type, a.desc, (a.need || []).join(' '), a.season].join(' '), 'adventure.html', a.type + ' · ' + (ADV_LEVELS[a.level] || '')));
  if (typeof CRAFTS !== 'undefined') CRAFTS.forEach((c) => addDoc('craft', c.name, [c.desc, c.material, (c.where || []).join(' '), c.buy].join(' '), 'crafts.html', 'حرفة · ' + c.cat));
  if (typeof SOUQS !== 'undefined') SOUQS.forEach((s) => addDoc('souq', s.name, [s.sells, s.tip, s.days].join(' '), 'crafts.html', 'سوق · ' + govName(s.gov)));
  if (typeof ERAS !== 'undefined') ERAS.forEach((e) => (e.events || []).forEach((ev) => addDoc('hist', ev.title, ev.text + ' ' + e.title, 'history.html', 'تاريخ · ' + e.title)));
  if (typeof GOV_DETAILS !== 'undefined') Object.keys(GOV_DETAILS).forEach((id) => { const g = GOV_DETAILS[id], gv = govById(id); if (!gv) return;
    addDoc('gov', gv.name, [gv.desc, (g.wilayats || []).join(' '), (g.shine || []).join(' '), (g.famous || []).map((f) => f[1]).join(' ')].join(' '), 'governorates.html', 'محافظة'); });
  const N = DOCS.length;
  const dfs = {};
  DOCS.forEach((d) => d.set.forEach((t) => { dfs[t] = (dfs[t] || 0) + 1; }));
  function search(qTokens, limit) {
    const q = qTokens.filter((t) => t.length > 1 && !STOP.has(t));
    if (!q.length) return [];
    const res = DOCS.map((d) => {
      let s = 0, hits = 0;
      q.forEach((t) => {
        let m = d.set.has(t);
        if (!m && t.length >= 4) for (const x of d.set) { if (x.length >= 4 && (x.startsWith(t) || t.startsWith(x))) { m = true; break; } }
        if (m) { hits++; s += Math.log(1 + N / (dfs[t] || 1)) * (d.tset.has(t) ? 2 : 1); }
      });
      return { d, s, hits };
    }).filter((r) => r.hits > 0 && (r.hits >= 2 || r.s >= 3.2) && (q.length === 1 || r.hits >= Math.min(2, q.length)));
    res.sort((a, b) => b.s - a.s);
    return res.slice(0, limit).map((r) => r.d);
  }

  /* ---------- بناء الردود ---------- */
  const A = { // مكوّنات الرد
    text: (t) => '<p>' + rich(t) + '</p>',
    list: (items) => '<ul>' + items.map((i) => '<li>' + rich(i) + '</li>').join('') + '</ul>',
    links: (ls) => '<div class="chat-links">' + ls.map((l) => '<a href="' + esc(l.href) + '"' + (/^https?:/.test(l.href) ? ' target="_blank" rel="noopener"' : '') + '>' + esc(l.t) + '</a>').join('') + '</div>',
    chips: (qs) => '<div class="chat-chips">' + qs.map((q) => '<button type="button" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('') + '</div>',
    card: (c) => '<a class="chat-card" href="' + esc(c.href) + '">' + (c.img ? '<img src="' + esc(c.img) + '" alt="" loading="lazy" onerror="this.remove()">' : '') +
      '<span class="cc-body"><strong>' + esc(c.title) + '</strong>' + (c.sub ? '<em>' + esc(c.sub) + '</em>' : '') + (c.text ? '<span>' + esc(c.text) + '</span>' : '') + '</span></a>',
    cards: (cs) => '<div class="chat-cards">' + cs.map(A_card).join('') + '</div>'
  };
  function A_card(c) { return A.card(c); }
  const destCard = (d) => ({ title: d.name, sub: govName(d.gov) + ' · ' + catLabel(d.cat), text: d.summary, href: 'destination.html?id=' + d.id, img: 'images/' + d.id + '.jpg' });
  const destLinks = (d) => [{ t: 'تفاصيل الوجهة', href: 'destination.html?id=' + d.id }, { t: 'على الخريطة', href: 'map.html?id=' + d.id }, { t: 'الاتجاهات', href: dirLink(d) }]
    .concat(d.vr ? [{ t: 'جولة 360°', href: 'vr.html?id=' + d.id }] : []);
  const followUps = (d) => ['أفضل وقت لزيارة ' + d.name.split(':')[0].split('–')[0].trim() + '؟', 'كم تستغرق الزيارة؟', 'نصائح للزيارة', 'فنادق قريبة', 'كيف أصل؟'];

  function answerDest(d, intents) {
    let h = '';
    const nm = d.name;
    if (intents.best) {
      h += A.text('**أفضل وقت لزيارة ' + nm + '**: ' + (d.bestTime || 'من أكتوبر إلى أبريل عمومًا') + '.');
      if (NEEDS_CAUTION(d)) h += A.text('تنبيه: ' + NEEDS_CAUTION(d));
    } else if (intents.duration) {
      h += A.text('**مدة الزيارة المقترحة لـ' + nm + '**: ' + (d.duration || 'تختلف حسب جدولك، من ساعة إلى نصف يوم عادةً') + '.');
    } else if (intents.tips) {
      h += A.text('**نصائح لزيارة ' + nm + '**') + (d.tips && d.tips.length ? A.list(d.tips) : A.text('خذ ماءً وقبعة وحذاءً مريحًا، وتأكد من مواعيد الزيارة قبل الذهاب.'));
    } else if (intents.where) {
      h += A.text('**' + nm + '** في محافظة **' + govName(d.gov) + '**. الإحداثيات: ' + d.lat.toFixed(4) + '، ' + d.lng.toFixed(4) + '.' +
        (NEEDS_4X4.includes(d.id) ? '\nالوصول إليه يحتاج غالبًا سيارة دفع رباعي.' : ''));
    } else if (intents.hotel) {
      const hs = (typeof HOTELS !== 'undefined' && HOTELS[d.gov]) || [];
      h += A.text('**إقامة قريبة من ' + nm + '** (محافظة ' + govName(d.gov) + '):');
      h += hs.length ? A.list(hs.map((x) => x.n + ' (' + TIERS[x.tier] + ')')) : A.text('لا أملك أمثلة مسجّلة لهذه المحافظة. اطلب من صفحة الرحلة عرض الفنادق القريبة من الموقع مباشرة.');
      h += A.text('تحقّق من التوفر والأسعار قبل الحجز.');
      h += A.links([{ t: 'فنادق قريبة (صفحة الرحلة)', href: 'trip.html?to=' + d.id }]);
    } else if (intents.vr) {
      h += d.vr ? A.text('نعم، لـ **' + nm + '** جولة 360° تفاعلية.') + A.links([{ t: 'افتح جولة 360°', href: 'vr.html?id=' + d.id }])
        : A.text('لا توجد جولة 360° لهذه الوجهة بعد، لكن تجد وصفها وصورها في صفحتها.');
    } else if (intents.car) {
      h += A.text(NEEDS_4X4.includes(d.id) ? 'نعم، **' + nm + '** يحتاج غالبًا دفعًا رباعيًا بسبب الطرق الجبلية أو الرملية الوعرة.' : 'لا يُشترط عادةً دفع رباعي للوصول إلى **' + nm + '**، فالطرق الرئيسية تكفي، لكن تأكد من حالة الطريق والطقس.');
    } else if (intents.safe) {
      const adv = (typeof ADVENTURES !== 'undefined' ? ADVENTURES : []).filter((a) => a.dest === d.id);
      h += A.text('**السلامة في ' + nm + '**');
      if (adv.length) { adv.forEach((a) => { h += A.text('• ' + a.name + ' (' + (ADV_LEVELS[a.level] || '') + '): ' + (a.risks || []).map((r) => (RISK_NAMES[r] || r)).join('، ')); }); }
      h += A.list(['تابع الأرصاد الرسمية قبل الذهاب', 'أبلغ شخصًا بمسارك ووقت عودتك', 'لا تدخل الوادي عند توقع الأمطار']);
      h += A.links([{ t: 'الطقس والأمان (مباشر)', href: 'safety.html' }]);
    } else if (intents.see) {
      h += A.text('**أبرز ما في ' + nm + '**') + (d.highlights ? A.list(d.highlights) : '');
    } else {
      h += A.text('**' + nm + '**\n' + d.summary);
      if (d.desc && d.desc[0]) h += A.text(d.desc[0]);
      if (d.highlights) h += A.list(d.highlights.slice(0, 4));
      const meta = [];
      if (d.bestTime) meta.push('أفضل وقت: ' + d.bestTime);
      if (d.duration) meta.push('المدة: ' + d.duration);
      if (meta.length) h += A.text(meta.join('\n'));
    }
    h += A.links(destLinks(d));
    h += A.chips(followUps(d).slice(0, 4));
    return h;
  }
  const RISK_NAMES = { flood: 'سيول', heat: 'حرارة', wind: 'رياح', uv: 'أشعة', sea: 'موج', cold: 'برودة' };
  function NEEDS_CAUTION(d) {
    if (d.cat === 'nature' && /وادي|دربات/.test(d.name)) return 'الوديان خطرة عند توقع الأمطار؛ تابع الأرصاد ولا تدخل الوادي عند سقوط مطر على المرتفعات.';
    if (d.id === 'wahiba-sands') return 'الصيف حارّ جدًا على الكثبان؛ الأفضل من أكتوبر إلى مارس.';
    return '';
  }

  function answerGov(gs) {
    let h = '';
    gs.forEach((g, i) => {
      const gd = (typeof GOV_DETAILS !== 'undefined' && GOV_DETAILS[g.id]) || null;
      h += A.text('**' + g.name + '** (العاصمة: ' + g.capital + ')\n' + g.desc);
      if (gd && gd.shine) h += A.list(gd.shine.slice(0, 3));
      if (gd && gd.wilayats && i === 0 && gs.length === 1) h += A.text('الولايات: ' + gd.wilayats.join('، ') + '.');
      const ds = destsOfGov(g.id);
      if (ds.length) h += A.cards(ds.slice(0, 4).map(destCard));
      h += A.links([{ t: 'كل وجهات ' + g.name, href: 'destinations.html?gov=' + g.id }]);
    });
    return h;
  }

  /* ---------- الطقس المباشر ---------- */
  const WXC = (c) => c === 0 ? 'صافٍ' : c <= 3 ? 'غائم جزئيًا' : c <= 48 ? 'ضباب' : c <= 57 ? 'رذاذ' : c <= 67 ? 'مطر' : c <= 77 ? 'ثلج' : c <= 82 ? 'زخات مطر' : 'عواصف رعدية';
  async function weatherFor(label, lat, lng) {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lng +
      '&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=auto&forecast_days=3';
    const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 8000);
    try {
      const r = await fetch(url, { signal: ctl.signal }); clearTimeout(to);
      if (!r.ok) throw new Error('http');
      const j = await r.json(); const c = j.current, d = j.daily;
      const days = ['اليوم', 'غدًا', 'بعد غد'];
      let h = A.text('**الطقس في ' + label + ' الآن**: ' + Math.round(c.temperature_2m) + '°م (المحسوسة ' + Math.round(c.apparent_temperature) + '°) · ' + WXC(c.weather_code) + ' · الرياح ' + Math.round(c.wind_speed_10m) + ' كم/س');
      h += A.list(d.time.map((_, i) => days[i] + ': ' + Math.round(d.temperature_2m_min[i]) + ' – ' + Math.round(d.temperature_2m_max[i]) + '°م · ' + WXC(d.weather_code[i]) + (d.precipitation_sum[i] > 0.1 ? ' · مطر ' + d.precipitation_sum[i].toFixed(1) + ' مم' : '')));
      h += A.text('المصدر: Open-Meteo. للتحذيرات الرسمية راجع الأرصاد العُمانية.');
      h += A.links([{ t: 'تقييم المخاطر للمغامرات', href: 'safety.html' }, { t: 'الأرصاد العُمانية', href: 'https://met.gov.om' }]);
      return h;
    } catch (e) {
      clearTimeout(to);
      return A.text('تعذّر جلب الطقس المباشر الآن (يحتاج اتصالًا بالإنترنت). يمكنك متابعته من صفحة الأمان والطقس أو من الأرصاد العُمانية.') +
        A.links([{ t: 'الأمان والطقس', href: 'safety.html' }, { t: 'الأرصاد العُمانية', href: 'https://met.gov.om' }]);
    }
  }
  function placeCoords(dest, govs, raw) {
    if (dest) return { label: dest.name.split(':')[0], lat: dest.lat, lng: dest.lng };
    const ql = norm(raw);
    if (typeof TOWNS !== 'undefined') { const t = TOWNS.find((x) => ql.includes(norm(x.n)) && norm(x.n).length > 2); if (t) return { label: t.n, lat: t.lat, lng: t.lng }; }
    if (govs && govs[0]) { const t = (typeof TOWNS !== 'undefined') && TOWNS.find((x) => x.n === govs[0].capital); if (t) return { label: govs[0].capital, lat: t.lat, lng: t.lng }; const ds = destsOfGov(govs[0].id)[0]; if (ds) return { label: govs[0].name, lat: ds.lat, lng: ds.lng }; }
    return null;
  }

  /* ---------- المحرك ---------- */
  const ctx = { dest: null, gov: null };
  async function respond(raw) {
    const q = norm(raw);
    const qt = toks(raw);
    const ct = qt.filter((t) => t.length > 1 && !STOP.has(t));
    const I = {};
    Object.keys(RX).forEach((k) => { I[k] = RX[k].test(q); });

    if (!q) return A.text('اكتب سؤالك عن السياحة في عُمان.');
    if (/(ريال\s*مدريد|برشلونه|كره\s*القدم|دوري\s*ابطال|بيتكوين|اسهم|برمجه|كود\s*بايثون|انتخابات|ترامب|عاصمه\s*(فرنسا|امريكا|بريطانيا|المانيا|اليابان|مصر|تركيا|السعوديه|الامارات)|اسعار\s*الذهب|وصفه\s*(كيك|حلويات))/.test(q))
      return A.text('أنا متخصص بالسياحة في **سلطنة عُمان** فقط، فلا أستطيع الإجابة عن هذا الموضوع. جرّب سؤالًا عن الوجهات أو الرحلات أو الأكل أو المواسم.') + A.chips(CHAT_SUGGEST.slice(0, 4));
    if (I.thanks && ct.length <= 3) return A.text('العفو! أنا هنا لأي سؤال آخر عن عُمان. 🌿') + A.chips(['برنامج 5 أيام', 'ما أفضل الأكلات؟', 'أماكن للمغامرة']);
    if (I.bye && ct.length <= 3) return A.text('مع السلامة، رحلة سعيدة في عُمان! 🌴');

    if (/(كم|عدد|قائمه|جميع|كل|اسماء)\s*(ال)?محافظات/.test(q) && !findGov(ct, raw)) {
      return A.text('تتكوّن سلطنة عُمان من **11 محافظة**: ' + GOVERNORATES.map((g) => g.name).join('، ') + '.') + A.links([{ t: 'تفاصيل المحافظات', href: 'governorates.html' }]);
    }
    // وجهة أو محافظة
    const dest = findDest(ct, raw);
    const govs = findGov(ct, raw);
    const anyIntent = I.best || I.duration || I.tips || I.where || I.see || I.hotel || I.vr || I.car || I.safe;

    // الطقس
    if (I.weather && !/افضل|احسن|انسب|موسم|مناسب/.test(q)) {
      const p = placeCoords(dest, govs, raw) || (I.weatherNow || ct.length <= 3 ? placeCoords(ctx.dest, null, '') || { label: 'مسقط', lat: 23.5880, lng: 58.3829 } : null);
      if (p && (I.weatherNow || dest || govs || ct.length <= 4)) { if (dest) ctx.dest = dest; return weatherFor(p.label, p.lat, p.lng); }
    }

    // متابعة سياق: سؤال قصير بلا وجهة لكن فيه نية
    let target = dest;
    if (!target && !govs && ctx.dest && anyIntent && ct.length <= 5 && !kbStrong(ct)) target = ctx.dest;
    if (target) { ctx.dest = target; return answerDest(target, I); }

    // قاعدة المعرفة
    const scored = KB.map((k) => ({ k, s: kbScore(k, qt) })).sort((a, b) => b.s - a.s);
    const topKb = scored[0];

    // قوائم حسب الفئة (+محافظة)
    let cat = null;
    CAT_RX.forEach(([c, rx]) => { if (!cat && rx.test(q)) cat = c; });
    const wantList = I.list || /اماكن|وين\s*اروح|اقترح|رشح/.test(q);
    if (govs && !cat && !(topKb && topKb.s >= 3 && topKb.k.e.id !== 'about')) { ctx.gov = govs[0]; return answerGov(govs); }
    if (cat && (wantList || !topKb || topKb.s < 5 || govs)) {
      let ds = DESTINATIONS.filter((d) => d.cat === cat);
      if (govs) ds = ds.filter((d) => govs.some((g) => g.id === d.gov));
      if (ds.length) {
        return A.text('**' + (CATEGORIES[cat].label) + (govs ? ' في ' + govs.map((g) => g.name).join(' و') : '') + '** — ' + ds.length + ' وجهة:') +
          A.cards(ds.slice(0, 6).map(destCard)) +
          A.links([{ t: 'عرض الكل', href: 'destinations.html?cat=' + cat + (govs ? '&gov=' + govs[0].id : '') }, { t: 'على الخريطة', href: 'map.html?cat=' + cat }]);
      }
    }
    if (topKb && topKb.s >= 3) {
      const e = topKb.k.e;
      let h = A.text('**' + e.t + '**\n' + e.a);
      if (e.dest) h += A.cards(e.dest.map(destById).filter(Boolean).slice(0, 4).map(destCard));
      if (e.links) h += A.links(e.links);
      const next = scored.slice(1, 3).filter((x) => x.s >= 3).map((x) => x.k.e.t);
      if (next.length) h += A.text('قد يهمّك أيضًا:') + A.chips(next);
      return h;
    }

    // بحث نصي عام
    const found = search(ct, 3);
    if (found.length) {
      let h = A.text('وجدت هذا في بيانات الموقع:');
      const dsts = found.filter((f) => f.kind === 'dest');
      found.forEach((f) => {
        if (f.kind === 'dest') h += A.card({ title: f.title, sub: f.sub, text: f.text.split(' ').slice(0, 24).join(' ') + '…', href: f.href, img: f.img });
        else h += '<div class="chat-note"><strong>' + esc(f.title) + '</strong><em>' + esc(f.sub) + '</em>' + esc(f.text.split(' ').slice(0, 45).join(' ')) + '… <a href="' + esc(f.href) + '">المزيد</a></div>';
      });
      if (dsts[0]) { const id = dsts[0].href.split('=')[1]; if (destById(id)) ctx.dest = destById(id); }
      return h;
    }
    if (topKb && topKb.s >= 1.5) {
      return A.text('لم أفهم سؤالك بدقة. هل تقصد:') + A.chips(scored.filter((x) => x.s >= 1.5).slice(0, 3).map((x) => x.k.e.t));
    }

    return A.text('لم أجد جوابًا لهذا السؤال في بيانات الموقع. أنا متخصص بالسياحة في **سلطنة عُمان** فقط، فجرّب أن تسأل عن وجهة أو محافظة أو موسم أو لباس أو تأشيرة أو برنامج رحلة.') +
      A.chips(CHAT_SUGGEST.slice(0, 5)) + A.links([{ t: 'الوجهات', href: 'destinations.html' }, { t: 'خطّط رحلتك', href: 'plan.html' }, { t: 'خدمة العملاء', href: SUPPORT_URL }]);
  }
  function kbStrong(ct) {
    const qs = ct; const m = KB.map((k) => kbScore(k, qs)).sort((a, b) => b - a)[0];
    return m >= 6;
  }

  /* ---------- الواجهة ---------- */
  const $log = document.getElementById('chat-log');
  const $form = document.getElementById('chat-form');
  const $in = document.getElementById('chat-input');
  const $send = document.getElementById('chat-send');
  const $clear = document.getElementById('chat-clear');
  const STORE = 'omanChatV1';
  let history = [];
  let busy = false;

  function save() { try { sessionStorage.setItem(STORE, JSON.stringify(history.slice(-40))); } catch (e) { /* غير متاح */ } }
  function scroll() { $log.scrollTop = $log.scrollHeight; requestAnimationFrame(() => { $log.scrollTop = $log.scrollHeight; }); }
  function bubble(role, html, store) {
    const el = document.createElement('div');
    el.className = 'msg ' + (role === 'u' ? 'user' : 'bot');
    el.innerHTML = role === 'u' ? '<div class="bub">' + html + '</div>' : '<span class="avatar" aria-hidden="true">✦</span><div class="bub">' + html + '</div>';
    $log.appendChild(el); scroll();
    if (store !== false) { history.push({ r: role, h: html }); save(); }
    return el;
  }
  function welcome() {
    bubble('b', A.text('أهلًا بك في **المساعد السياحي لعُمان**! اسألني عن أي شيء يخص السفر والسياحة في سلطنة عُمان: الوجهات، أفضل وقت للزيارة، برامج الرحلات، الأكل، اللباس، التأشيرة، المغامرات، الطقس وغيرها.') +
      A.chips(CHAT_SUGGEST), false);
  }
  async function ask(text) {
    text = (text || '').trim().slice(0, 400);
    if (!text || busy) return;
    busy = true; $send.disabled = true;
    bubble('u', esc(text));
    $in.value = ''; autosize();
    const typing = bubble('b', '<span class="typing"><i></i><i></i><i></i></span>', false);
    let html;
    try { html = await Promise.all([respond(text), new Promise((r) => setTimeout(r, 380))]).then((x) => x[0]); }
    catch (e) { html = A.text('حدث خطأ غير متوقع. جرّب إعادة صياغة السؤال.'); }
    typing.remove();
    bubble('b', html);
    busy = false; $send.disabled = false; $in.focus();
  }
  function autosize() { $in.style.height = 'auto'; $in.style.height = Math.min($in.scrollHeight, 130) + 'px'; }

  $form.addEventListener('submit', (e) => { e.preventDefault(); ask($in.value); });
  $in.addEventListener('input', autosize);
  $in.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask($in.value); } });
  $log.addEventListener('click', (e) => { const b = e.target.closest('button[data-q]'); if (b) ask(b.dataset.q); });
  $clear.addEventListener('click', () => { history = []; save(); ctx.dest = null; ctx.gov = null; $log.innerHTML = ''; welcome(); });

  // استرجاع المحادثة
  let restored = [];
  try { restored = JSON.parse(sessionStorage.getItem(STORE) || '[]'); } catch (e) { restored = []; }
  if (restored.length) { restored.forEach((m) => bubble(m.r, m.h, false)); history = restored; } else welcome();
  const pre = new URLSearchParams(location.search).get('q');
  if (pre) ask(pre);
  window.__chatRespond = respond; // للاختبار
})();
