/* ============================================================
   التنبؤ بمخاطر الطقس لأي موقع (7 أيام)
   المصدر: Open-Meteo (مجاني، بلا مفتاح، للاستخدام غير التجاري)
     - التوقعات:  https://api.open-meteo.com/v1/forecast
     - البحر:    https://marine-api.open-meteo.com/v1/marine
   القواعد أدناه إرشادية وتُعدَّل من الثوابت. لا تغني عن نشرات الأرصاد
   الرسمية وتعليمات الدفاع المدني.
   ============================================================ */
const WX_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const WX_MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const OFFICIAL_MET = 'https://met.gov.om';

/* عتبات المخاطر: [تنبيه, خطر] */
const RISK_RULES = {
  flood: { name: 'سيول الأودية', icon: '', th: [8, 20], unit: 'مم مطر',
    why: 'المطر على المرتفعات قد يصل إلى الوادي بعد ساعات حتى لو كان الجو عندك صافيًا.' },
  heat:  { name: 'الحرارة', icon: '', th: [38, 44], unit: '°م (المحسوسة)',
    why: 'خطر الإجهاد الحراري وضربة الشمس، خاصة مع المشي والكثبان.' },
  wind:  { name: 'الرياح والغبار', icon: '', th: [40, 60], unit: 'كم/س (هبّات)',
    why: 'تؤثر على الخيام والقوارب والكثبان والرؤية، وقد تثير غبارًا.' },
  uv:    { name: 'الأشعة فوق البنفسجية', icon: '', th: [8, 11], unit: 'مؤشر UV',
    why: 'حروق الجلد خلال دقائق؛ استخدم واقيًا وملابس ساترة.' },
  sea:   { name: 'ارتفاع الموج', icon: '', th: [1.5, 2.5], unit: 'م',
    why: 'تُلغى رحلات القوارب والغطس عادةً عند ارتفاع الموج.' },
  cold:  { name: 'برودة الليل', icon: '', th: [8, 3], unit: '°م (الصغرى)', invert: true,
    why: 'الجبال والصحراء باردة ليلًا؛ جهّز ملابس دافئة وأغطية.' }
};
const LV_LABEL = ['آمن نسبيًا', 'تنبيه', 'خطر'];
const LV_ICON = ['آمن', 'تنبيه', 'خطر'];

function wxLevel(key, value) {
  if (value == null || Number.isNaN(value)) return null;
  const r = RISK_RULES[key];
  if (r.invert) return value <= r.th[1] ? 2 : value <= r.th[0] ? 1 : 0;
  return value >= r.th[1] ? 2 : value >= r.th[0] ? 1 : 0;
}

function wxAssess(d) {
  const v = { flood: d.precip, heat: d.feel, wind: d.gust, uv: d.uv, sea: d.wave, cold: d.tmin };
  /* احتمال المطر المرتفع يرفع مستوى السيول درجة */
  const lv = {};
  Object.keys(v).forEach(k => { lv[k] = wxLevel(k, v[k]); });
  if (lv.flood === 0 && d.pprob >= 70 && d.precip >= 2) lv.flood = 1;
  return { values: v, levels: lv };
}

const WX_CODE = (c) => {
  if (c == null) return '—';
  if (c === 0) return 'صافٍ';
  if (c <= 3) return 'غائم جزئيًا';
  if (c === 45 || c === 48) return 'ضباب';
  if (c >= 51 && c <= 57) return 'رذاذ';
  if (c >= 61 && c <= 67) return 'مطر';
  if (c >= 71 && c <= 77) return 'ثلج';
  if (c >= 80 && c <= 82) return 'زخّات';
  if (c >= 95) return 'عواصف رعدية';
  return 'غائم';
};

async function wxFetch(url, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 15000);
  try {
    const r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('wx ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function fetchRisk(lat, lng, days) {
  const n = days || 7;
  const f = `${WX_FORECAST}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_gusts_10m_max,uv_index_max` +
    `&timezone=auto&forecast_days=${n}`;
  const m = `${WX_MARINE}?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}&daily=wave_height_max&timezone=auto&forecast_days=${n}`;
  const [fc, mar] = await Promise.all([wxFetch(f), wxFetch(m).catch(() => null)]);
  const D = fc.daily; const out = [];
  for (let i = 0; i < D.time.length; i++) {
    out.push({
      date: D.time[i], code: D.weather_code[i], tmax: D.temperature_2m_max[i], tmin: D.temperature_2m_min[i],
      feel: D.apparent_temperature_max[i], precip: D.precipitation_sum[i], pprob: D.precipitation_probability_max[i],
      gust: D.wind_gusts_10m_max[i], uv: D.uv_index_max[i],
      wave: mar && mar.daily && mar.daily.wave_height_max ? mar.daily.wave_height_max[i] : null
    });
  }
  return out;
}

const fmtDay = (iso) => {
  try { return new Date(iso + 'T12:00:00').toLocaleDateString('ar-OM', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch (e) { return iso; }
};
const nf = (x, d) => (x == null ? '—' : Number(x).toFixed(d == null ? 0 : d));

/* حكم عام ونصائح بحسب النشاط */
function wxVerdict(day, activityRisks) {
  const a = wxAssess(day);
  const keys = (activityRisks && activityRisks.length ? activityRisks : Object.keys(RISK_RULES));
  let worst = 0; const hits = [];
  keys.forEach(k => {
    const l = a.levels[k];
    if (l != null && l > worst) worst = l;
    if (l > 0) hits.push({ k, l });
  });
  return { worst, hits, a };
}

/* واجهة جاهزة: تعرض اليوم وجدول 7 أيام. opts: {lat,lng,name,risks} */
async function renderWeatherRisk(el, opts) {
  el.innerHTML = '<p class="muted">جارٍ تحميل توقعات الطقس…</p>';
  let days;
  try { days = await fetchRisk(opts.lat, opts.lng, 7); }
  catch (e) {
    el.innerHTML = `<div class="note">تعذّر جلب التوقعات الآن (الخدمة الخارجية غير متاحة أو لا يوجد اتصال).
      راجع <a href="${OFFICIAL_MET}" target="_blank" rel="noopener"><b>الأرصاد الجوية العُمانية</b></a> أو
      <a href="https://open-meteo.com/en/docs#latitude=${opts.lat.toFixed(2)}&longitude=${opts.lng.toFixed(2)}" target="_blank" rel="noopener">Open-Meteo</a>.</div>`;
    return null;
  }
  const first = wxVerdict(days[0], opts.risks);
  const keys = opts.risks && opts.risks.length ? opts.risks : Object.keys(RISK_RULES);
  const head = `
    <div class="wx-today lv${first.worst}">
      <div class="wx-big"><span>${LV_ICON[first.worst]}</span>
        <div><b>${opts.name ? esc2(opts.name) + ': ' : ''}${first.worst === 2 ? 'لا يُنصح بالنشاط اليوم' : first.worst === 1 ? 'تابع الظروف واحذر' : 'ظروف مناسبة عمومًا'}</b>
        <small>${WX_CODE(days[0].code)} • العظمى ${nf(days[0].tmax)}° / الصغرى ${nf(days[0].tmin)}°</small></div></div>
      <ul class="wx-hits">${first.hits.length ? first.hits.map(h =>
        `<li class="lv${h.l}">${RISK_RULES[h.k].icon} <b>${RISK_RULES[h.k].name}: ${LV_LABEL[h.l]}</b> — ${RISK_RULES[h.k].why}</li>`).join('') :
        '<li class="lv0">لا مؤشرات خطر ظاهرة في التوقعات، ومع ذلك افحص الطقس قبل الانطلاق.</li>'}</ul>
    </div>`;
  const rows = days.map(d => {
    const a = wxAssess(d);
    const cells = keys.map(k => {
      const l = a.levels[k];
      return `<td class="lv${l == null ? 'x' : l}" title="${RISK_RULES[k].name}">${l == null ? '—' : LV_ICON[l]}<small>${nf(a.values[k], k === 'sea' ? 1 : 0)}</small></td>`;
    }).join('');
    return `<tr><th scope="row">${fmtDay(d.date)}<small>${WX_CODE(d.code)}</small></th>${cells}</tr>`;
  }).join('');
  el.innerHTML = head + `
    <div class="wx-scroll"><table class="wx-table">
      <thead><tr><th>اليوم</th>${keys.map(k => `<th>${RISK_RULES[k].icon}<small>${RISK_RULES[k].name}</small></th>`).join('')}</tr></thead>
      <tbody>${rows}</tbody></table></div>
    <p class="muted" style="font-size:.86rem;margin-top:8px">البيانات من Open-Meteo، والتقييم إرشادي بعتبات مثل: سيول ≥ 8 مم تنبيه و≥ 20 مم خطر. اعتمد دائمًا نشرات
      <a href="${OFFICIAL_MET}" target="_blank" rel="noopener">الأرصاد الرسمية</a> وتعليمات الدفاع المدني (9999).</p>`;
  return days;
}
function esc2(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
