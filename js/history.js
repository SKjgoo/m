/* ===== صفحة «عُمان عبر الزمان» ===== */
document.addEventListener('DOMContentLoaded', () => {
  const eraHtml = (e) => {
    const sites = (e.sites || []).map(destById).filter(Boolean);
    return `
    <section class="era" id="${e.id}" style="--era:${e.color}" data-era="${e.id}">
      <div class="era-head">
        <span class="era-ico" aria-hidden="true">${e.icon}</span>
        <div><div class="era-period">${e.period}</div><h2>${e.title}</h2></div>
      </div>
      <p class="era-intro">${e.intro}</p>
      <ol class="events">
        ${e.events.map(ev => `
        <li>
          <span class="ev-year">${ev.year}</span>
          <h3>${ev.title}</h3>
          <p>${ev.text}</p>
        </li>`).join('')}
      </ol>
      ${e.rulers.length ? `
      <h3 class="rulers-title">الحكّام وإنجازاتهم</h3>
      <div class="rulers">
        ${e.rulers.map(r => `
        <article class="ruler">
          <h4>${r.name}</h4>
          <div class="reign">${r.reign}</div>
          <div class="ttl">${r.title}</div>
          <ul>${r.deeds.map(d => `<li>${d}</li>`).join('')}</ul>
        </article>`).join('')}
      </div>` : ''}
      ${sites.length ? `
      <div class="era-sites">
        <span>أماكن ترتبط بهذا العصر:</span>
        ${sites.map(d => `<a class="chip" href="destination.html?id=${d.id}">${CATEGORIES[d.cat].icon} ${d.name}</a>`).join('')}
      </div>` : ''}
    </section>`;
  };

  document.getElementById('eras').innerHTML = ERAS.map(eraHtml).join('');
  const idx = document.getElementById('tl-index');
  idx.innerHTML = ERAS.map(e =>
    `<a href="#${e.id}" data-id="${e.id}" style="--era:${e.color}">${e.icon} ${e.title}</a>`).join('');

  document.getElementById('line').innerHTML = BUSAID_LINE.map(([n, y]) =>
    `<tr><td>${n}</td><td>${y}</td></tr>`).join('');

  /* تمييز العصر الظاهر في الفهرس */
  const links = [...idx.querySelectorAll('a')];
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.toggle('on', a.dataset.id === en.target.dataset.era));
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px' });
    document.querySelectorAll('.era').forEach(n => obs.observe(n));
  }
});
