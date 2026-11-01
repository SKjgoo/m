/* ===== صفحة الأمان والطقس ===== */
document.addEventListener('DOMContentLoaded', () => {
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* */ } }
  };
  const ACT_RISKS = {
    all: null, hiking: ['heat', 'wind', 'cold', 'uv'], wadi: ['flood', 'heat', 'uv'], dunes: ['heat', 'wind', 'cold'],
    camping: ['wind', 'cold', 'heat', 'flood'], sea: ['sea', 'wind', 'uv', 'heat'], climbing: ['wind', 'heat', 'cold'],
    caving: ['flood', 'heat'], wildlife: ['heat']
  };

  /* الطقس */
  const pts = tripPoints();
  const $loc = document.getElementById('w-loc'), $act = document.getElementById('w-act');
  const groups = {};
  pts.forEach(p => { (groups[p.group] = groups[p.group] || []).push(p); });
  $loc.innerHTML = Object.entries(groups).map(([g, l]) => `<optgroup label="${g}">${l.map(p => `<option value="${p.key}">${p.label}</option>`).join('')}</optgroup>`).join('');
  $act.innerHTML = '<option value="all">كل المخاطر</option>' + Object.entries(CHECKLISTS).map(([k, c]) => `<option value="${k}">${c.icon} ${c.name}</option>`).join('');
  const qpLoc = new URLSearchParams(location.search).get('loc');
  if (qpLoc && pts.some(p => p.key === qpLoc)) $loc.value = qpLoc;
  const go = () => {
    const p = pts.find(x => x.key === $loc.value);
    renderWeatherRisk(document.getElementById('w-out'), { lat: p.lat, lng: p.lng, name: p.label, risks: ACT_RISKS[$act.value] });
  };
  document.getElementById('w-go').addEventListener('click', go);
  if (qpLoc) go();

  /* المعايير */
  const li = (x) => `<li><b>${x.t}</b><br><span class="muted">${x.d}</span></li>`;
  document.getElementById('std-nat').innerHTML = STANDARDS.national.map(li).join('');
  document.getElementById('std-int').innerHTML = STANDARDS.international.map(li).join('');

  /* قوائم التحقق */
  const done = store.get('cl-done', {});
  let cur = (location.hash || '').slice(1);
  if (!CHECKLISTS[cur]) cur = 'hiking';
  const tabs = document.getElementById('cl-tabs'), list = document.getElementById('cl-list'), bar = document.getElementById('cl-bar');
  function drawCl() {
    tabs.innerHTML = Object.entries(CHECKLISTS).map(([k, c]) => `<button class="chip ${cur === k ? 'on' : ''}" data-k="${k}">${c.icon} ${c.name}</button>`).join('');
    const arr = done[cur] || [];
    list.innerHTML = CHECKLISTS[cur].items.map((t, i) => `<li><label><input type="checkbox" data-i="${i}" ${arr.includes(i) ? 'checked' : ''}> <span>${t}</span></label></li>`).join('');
    bar.style.width = (arr.length / CHECKLISTS[cur].items.length * 100) + '%';
  }
  tabs.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { cur = b.dataset.k; drawCl(); } });
  list.addEventListener('change', (e) => {
    const i = +e.target.dataset.i, arr = new Set(done[cur] || []);
    e.target.checked ? arr.add(i) : arr.delete(i); done[cur] = [...arr]; store.set('cl-done', done); drawCl();
  });
  document.getElementById('cl-reset').addEventListener('click', () => { done[cur] = []; store.set('cl-done', done); drawCl(); });
  drawCl();

  /* المنظّم */
  const od = store.get('op-done', []);
  const op = document.getElementById('op-list');
  const drawOp = () => { op.innerHTML = OPERATOR_CHECK.map((t, i) => `<li><label><input type="checkbox" data-i="${i}" ${od.includes(i) ? 'checked' : ''}> <span>${t}</span></label></li>`).join(''); };
  op.addEventListener('change', (e) => { const i = +e.target.dataset.i, s = new Set(od.splice(0)); e.target.checked ? s.add(i) : s.delete(i); s.forEach(x => od.push(x)); store.set('op-done', od); });
  drawOp();
});
