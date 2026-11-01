/* قراءة إحداثيات GPS من صور JPEG (EXIF) داخل المتصفح، لتحديد أقرب وجهة سياحية للصورة */
(function () {
  function rat(dv, o, le) { return dv.getUint32(o, le) / (dv.getUint32(o + 4, le) || 1); }
  function parse(buf) {
    const dv = new DataView(buf);
    if (dv.getUint16(0) !== 0xFFD8) return null;
    let off = 2;
    while (off < dv.byteLength - 4) {
      const mk = dv.getUint16(off); const len = dv.getUint16(off + 2);
      if (mk === 0xFFE1 && dv.getUint32(off + 4) === 0x45786966) {
        const t = off + 10; const le = dv.getUint16(t) === 0x4949;
        const ifd0 = t + dv.getUint32(t + 4, le);
        const n = dv.getUint16(ifd0, le); let gps = 0;
        for (let i = 0; i < n; i++) { const e = ifd0 + 2 + i * 12; if (dv.getUint16(e, le) === 0x8825) gps = t + dv.getUint32(e + 8, le); }
        if (!gps) return null;
        const m = dv.getUint16(gps, le); const v = {};
        for (let i = 0; i < m; i++) {
          const e = gps + 2 + i * 12; const tag = dv.getUint16(e, le); const cnt = dv.getUint32(e + 4, le);
          if (tag === 1 || tag === 3) v[tag] = String.fromCharCode(dv.getUint8(e + 8));
          if (tag === 2 || tag === 4) { const p = t + dv.getUint32(e + 8, le); v[tag] = rat(dv, p, le) + rat(dv, p + 8, le) / 60 + rat(dv, p + 16, le) / 3600; }
        }
        if (v[2] == null || v[4] == null) return null;
        return { lat: v[1] === 'S' ? -v[2] : v[2], lng: v[3] === 'W' ? -v[4] : v[4] };
      }
      if ((mk & 0xFF00) !== 0xFF00) break;
      off += 2 + len;
    }
    return null;
  }
  /* يعيد {lat,lng} أو null */
  window.readPhotoGps = (file) => new Promise((res) => {
    const r = new FileReader();
    r.onload = () => { try { res(parse(r.result)); } catch (e) { res(null); } };
    r.onerror = () => res(null);
    r.readAsArrayBuffer(file.slice(0, 256 * 1024));
  });
  /* أقرب وجهة ضمن نصف قطر (كم) */
  window.nearestDestination = (p, maxKm) => {
    if (!p || typeof DESTINATIONS === 'undefined') return null;
    let best = null, bd = 1e9;
    DESTINATIONS.forEach(d => { const k = distKm(p, d); if (k < bd) { bd = k; best = d; } });
    return best && bd <= (maxKm || 25) ? { dest: best, km: bd } : null;
  };
})();
