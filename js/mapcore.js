/* ============================================================
   أدوات الخريطة (Leaflet + OpenStreetMap)
   تحميله بعد leaflet.js و data.js و common.js
   ============================================================ */
const OMAN_BOUNDS = [[16.3, 51.8], [26.6, 60.0]];

function baseMap(elId, opts) {
  const map = L.map(elId, Object.assign({ scrollWheelZoom: false, zoomControl: true }, opts || {}));
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">مساهمو OpenStreetMap</a>'
  }).addTo(map);
  return map;
}

function pinIcon(cat) {
  return L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin pin-${cat}"></div>`,
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18]
  });
}

function popupHtml(d, opts) {
  const g = govById(d.gov);
  const hideMore = opts && opts.hideMore;
  return `
    <h4>${d.name}</h4>
    <p class="muted">محافظة ${g.name}</p>
    <p>${d.summary}</p>
    <div class="pop-actions">
      ${hideMore ? '' : `<a href="destination.html?id=${d.id}">التفاصيل</a>`}
      <a class="alt" href="${dirLink(d)}" target="_blank" rel="noopener">الاتجاهات</a>
      ${d.vr ? `<a href="vr.html?id=${d.id}">جولة VR</a>` : ''}
    </div>`;
}

function addMarker(map, d, opts) {
  return L.marker([d.lat, d.lng], { icon: pinIcon(d.cat), title: d.name })
    .addTo(map)
    .bindPopup(popupHtml(d, opts), { maxWidth: 280 });
}
