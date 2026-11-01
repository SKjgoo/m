/* ===== صفحة المحافظات: الولايات + ما تتميّز به + ما تشتهر به ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('gov-nav').innerHTML = GOVERNORATES.map(g =>
    `<a class="chip" href="#${g.id}">${g.icon} ${g.name}</a>`).join('');

  document.getElementById('gov-grid').innerHTML = GOVERNORATES.map(g => {
    const list = destsOfGov(g.id);
    const det = GOV_DETAILS[g.id] || { wilayats: [], shine: [], famous: [] };
    const chips = list.length
      ? list.map(d => `<a class="chip" href="destination.html?id=${d.id}">${CATEGORIES[d.cat].icon} ${d.name}</a>`).join('')
      : '<span class="muted">سيتم إضافة وجهات قريبًا</span>';
    return `
    <article class="gov-card" id="${g.id}">
      <header>
        <span class="gov-ico">${g.icon}</span>
        <div><h3>محافظة ${g.name}</h3><span class="tag">${g.tagline}</span></div>
      </header>
      <p>${g.desc}</p>
      <p class="meta">المركز: ${g.capital} • ${det.wilayats.length} ولايات • ${list.length} وجهة على الموقع</p>
      <p class="wilayats"><b>الولايات:</b> ${det.wilayats.join('، ')}</p>
      <div class="gov-cols">
        <div>
          <h4>بماذا تتميّز؟</h4>
          <ul class="shine">${det.shine.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div>
          <h4>بماذا تشتهر؟</h4>
          <ul>${det.famous.map(([i, t]) => `<li><span class="fi">${i}</span><span>${t}</span></li>`).join('')}</ul>
        </div>
      </div>
      <div class="chips" style="margin-top:8px">${chips}</div>
      <div class="gov-actions">
        <a class="btn small dark" href="map.html?gov=${g.id}">على الخريطة</a>
        <a class="btn small" href="destinations.html?gov=${g.id}">كل وجهاتها</a>
        <a class="btn small light" href="trip.html?to=gov:${g.id}">خطّط رحلة إليها</a>
      </div>
    </article>`;
  }).join('');
});
