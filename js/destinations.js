/* ===== صفحة الوجهات: بحث وفلترة ===== */
document.addEventListener('DOMContentLoaded', () => {
  const $q = document.getElementById('q');
  const $gov = document.getElementById('gov');
  const $vr = document.getElementById('vronly');
  const $cats = document.getElementById('cats');
  const $count = document.getElementById('count');
  const $res = document.getElementById('results');

  let activeCat = qs('cat') || '';

  $gov.innerHTML = '<option value="">كل المحافظات</option>' +
    GOVERNORATES.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
  if (qs('gov')) $gov.value = qs('gov');
  if (qs('q')) $q.value = qs('q');

  function renderChips() {
    $cats.innerHTML =
      `<button class="chip ${activeCat === '' ? 'on' : ''}" data-cat="">الكل</button>` +
      Object.entries(CATEGORIES).map(([k, c]) =>
        `<button class="chip ${activeCat === k ? 'on' : ''}" data-cat="${k}">${c.icon} ${c.label}</button>`).join('');
  }

  const normalize = (s) => (s || '').toString().toLowerCase()
    .replace(/[ً-ْـ]/g, '')   // إزالة التشكيل والتطويل
    .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

  function render() {
    const q = normalize($q.value.trim());
    const list = DESTINATIONS.filter(d => {
      if (activeCat && d.cat !== activeCat) return false;
      if ($gov.value && d.gov !== $gov.value) return false;
      if ($vr.checked && !d.vr) return false;
      if (q) {
        const hay = normalize([d.name, d.summary, d.desc.join(' '), govById(d.gov).name, CATEGORIES[d.cat].label].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    $count.textContent = `عدد النتائج: ${list.length}`;
    $res.innerHTML = list.length
      ? list.map(destCard).join('')
      : '<div class="empty" style="grid-column:1/-1">لا توجد نتائج مطابقة. جرّب تغيير البحث أو الفلاتر.</div>';
    loadPhotos($res);
  }

  $cats.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    activeCat = b.dataset.cat;
    renderChips();
    render();
  });
  [$q, $gov, $vr].forEach(el => el.addEventListener('input', render));

  renderChips();
  render();
});
