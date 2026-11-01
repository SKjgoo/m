/* ===== صفحة المغامرة ===== */
document.addEventListener('DOMContentLoaded', () => {
  const $lvl = document.getElementById('a-level'), $type = document.getElementById('a-type');
  const types = [...new Set(ADVENTURES.map(a => a.type))];
  $type.innerHTML = '<option value="">الكل</option>' + types.map(t => `<option>${t}</option>`).join('');
  const out = document.getElementById('adv');
  const stdName = { hiking: 'مشي جبلي', wadi: 'أودية', dunes: 'كثبان', camping: 'تخييم', sea: 'بحر وغطس', climbing: 'تسلّق', caving: 'كهوف', wildlife: 'حياة فطرية', operator: 'منظّم مرخّص' };

  function draw() {
    const list = ADVENTURES.filter(a => (!$lvl.value || a.level === +$lvl.value) && (!$type.value || a.type === $type.value));
    document.getElementById('a-count').textContent = `عدد الأنشطة: ${list.length}`;
    out.innerHTML = list.map(a => `
      <article class="item-card" id="${a.id}">
        <h3><span class="ic">${a.icon}</span>${a.name}</h3>
        <div class="tag-row">
          <span class="tag lvl${a.level}">المستوى: ${ADV_LEVELS[a.level]}</span><span class="tag">${a.type}</span>
          <span class="tag">${a.season}</span><span class="tag">${a.time}</span>
          <span class="tag">محافظة ${govById(a.gov).name}</span>
        </div>
        <p>${a.desc}</p>
        <p><b>تحتاج:</b></p>
        <ul>${a.need.map(n => `<li>${n}</li>`).join('')}</ul>
        <div class="tag-row">${a.risks.map(r => `<span class="tag">${RISK_RULES[r].icon} ${RISK_RULES[r].name}</span>`).join('')}</div>
        <div class="row-actions">
          <button class="btn small dark" type="button" data-wx="${a.id}">مخاطر الطقس</button>
          <a class="btn small" href="trip.html?to=${a.dest ? 'd:' + a.dest : 'gov:' + a.gov}">الطريق</a>
          <a class="btn small light" href="safety.html#${a.std[0]}">قائمة السلامة</a>
          ${a.dest ? `<a class="btn small light" href="destination.html?id=${a.dest}">الوجهة</a>` : ''}
        </div>
        <div class="wx-slot" id="wx-${a.id}"></div>
      </article>`).join('') || '<div class="empty">لا توجد أنشطة بهذه المعايير.</div>';
  }
  $lvl.addEventListener('change', draw); $type.addEventListener('change', draw);
  out.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wx]'); if (!b) return;
    const a = ADVENTURES.find(x => x.id === b.dataset.wx);
    const slot = document.getElementById('wx-' + a.id);
    if (slot.dataset.open) { slot.innerHTML = ''; delete slot.dataset.open; return; }
    slot.dataset.open = '1';
    renderWeatherRisk(slot, { lat: a.lat, lng: a.lng, name: a.name, risks: a.risks });
  });
  draw();

  /* منظّمو المغامرات */
  const list = CONTACTS.filter(c => c.type === 'adventure');
  document.getElementById('adv-contacts').innerHTML = list.length ? list.map(c => `
    <article class="contact-card"><b>${c.name}</b><small>${c.desc || ''}</small>
    <div class="lnks">${c.phone ? `<a href="tel:${c.phone}" dir="ltr">${c.phone}</a>` : ''}</div></article>`).join('')
    : `<div class="empty" style="grid-column:1/-1">لم تُضَف بعد حسابات أو أرقام لمنظّمي المغامرات. أضف المنظّم الذي تثق به من
      <a href="crafts.html#directory"><b>نموذج الإضافة</b></a>، أو ابحث في
      <a href="https://www.google.com/search?q=${encodeURIComponent('مغامرات في عمان منظمو رحلات')}" target="_blank" rel="noopener">البحث في المتصفح عن منظّمي المغامرات</a>.
      تحقّق دائمًا من الترخيص قبل الحجز.</div>`;
});
