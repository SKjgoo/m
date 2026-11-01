/* ============================================================
   مدن وولايات السلطنة (إحداثيات تقريبية لمراكز المدن)
   تُستخدم في صفحة «الرحلة» لاختيار نقطة الانطلاق والوصول،
   ولمعرفة المناطق التي يمرّ بها الطريق.
   g = معرّف المحافظة في data.js
   ============================================================ */
const TOWNS = [
  /* مسقط */
  { n: 'مسقط', g: 'muscat', lat: 23.6139, lng: 58.5933 },
  { n: 'مطرح', g: 'muscat', lat: 23.6170, lng: 58.5655 },
  { n: 'بوشر', g: 'muscat', lat: 23.5870, lng: 58.4000 },
  { n: 'السيب', g: 'muscat', lat: 23.6700, lng: 58.1890 },
  { n: 'العامرات', g: 'muscat', lat: 23.5300, lng: 58.4950 },
  { n: 'قريات', g: 'muscat', lat: 23.2650, lng: 58.9150 },
  /* ظفار */
  { n: 'صلالة', g: 'dhofar', lat: 17.0151, lng: 54.0924 },
  { n: 'طاقة', g: 'dhofar', lat: 17.0390, lng: 54.4000 },
  { n: 'مرباط', g: 'dhofar', lat: 16.9900, lng: 54.6950 },
  { n: 'سدح', g: 'dhofar', lat: 16.7400, lng: 55.0700 },
  { n: 'رخيوت', g: 'dhofar', lat: 16.7500, lng: 53.4300 },
  { n: 'ثمريت', g: 'dhofar', lat: 17.6660, lng: 54.0270 },
  { n: 'حاسك', g: 'dhofar', lat: 17.3700, lng: 55.3500 },
  /* مسندم */
  { n: 'خصب', g: 'musandam', lat: 26.1800, lng: 56.2480 },
  { n: 'بخا', g: 'musandam', lat: 26.1500, lng: 56.1500 },
  { n: 'دبا', g: 'musandam', lat: 25.6200, lng: 56.2700 },
  { n: 'مدحاء', g: 'musandam', lat: 25.2900, lng: 56.3300 },
  /* البريمي */
  { n: 'البريمي', g: 'buraimi', lat: 24.2500, lng: 55.7900 },
  /* الداخلية */
  { n: 'نزوى', g: 'dakhiliyah', lat: 22.9333, lng: 57.5300 },
  { n: 'بهلاء', g: 'dakhiliyah', lat: 22.9630, lng: 57.3010 },
  { n: 'الحمراء', g: 'dakhiliyah', lat: 23.1190, lng: 57.2930 },
  { n: 'منح', g: 'dakhiliyah', lat: 22.8000, lng: 57.6000 },
  { n: 'أدم', g: 'dakhiliyah', lat: 22.3770, lng: 57.5300 },
  { n: 'إزكي', g: 'dakhiliyah', lat: 22.9300, lng: 57.7700 },
  { n: 'سمائل', g: 'dakhiliyah', lat: 23.3000, lng: 57.9900 },
  { n: 'بدبد', g: 'dakhiliyah', lat: 23.4200, lng: 58.1300 },
  { n: 'سيق (الجبل الأخضر)', g: 'dakhiliyah', lat: 23.0700, lng: 57.6450 },
  /* شمال الباطنة */
  { n: 'صحار', g: 'north-batinah', lat: 24.3470, lng: 56.7090 },
  { n: 'شناص', g: 'north-batinah', lat: 24.7400, lng: 56.4700 },
  { n: 'لوى', g: 'north-batinah', lat: 24.5300, lng: 56.5700 },
  { n: 'صحم', g: 'north-batinah', lat: 24.1700, lng: 56.8900 },
  { n: 'الخابورة', g: 'north-batinah', lat: 23.9700, lng: 57.1000 },
  { n: 'السويق', g: 'north-batinah', lat: 23.8500, lng: 57.4400 },
  /* جنوب الباطنة */
  { n: 'الرستاق', g: 'south-batinah', lat: 23.3908, lng: 57.4247 },
  { n: 'نخل', g: 'south-batinah', lat: 23.3930, lng: 57.8290 },
  { n: 'العوابي', g: 'south-batinah', lat: 23.3000, lng: 57.5200 },
  { n: 'وادي المعاول', g: 'south-batinah', lat: 23.4300, lng: 57.7200 },
  { n: 'بركاء', g: 'south-batinah', lat: 23.6800, lng: 57.8900 },
  { n: 'المصنعة', g: 'south-batinah', lat: 23.7900, lng: 57.6400 },
  /* شمال الشرقية */
  { n: 'إبراء', g: 'north-sharqiyah', lat: 22.6900, lng: 58.5300 },
  { n: 'المضيبي', g: 'north-sharqiyah', lat: 22.5500, lng: 58.1200 },
  { n: 'بدية', g: 'north-sharqiyah', lat: 22.4500, lng: 58.8200 },
  { n: 'القابل', g: 'north-sharqiyah', lat: 22.5800, lng: 58.7000 },
  { n: 'سناو', g: 'north-sharqiyah', lat: 22.5100, lng: 58.0300 },
  { n: 'وادي بني خالد', g: 'north-sharqiyah', lat: 22.6500, lng: 59.0700 },
  /* جنوب الشرقية */
  { n: 'صور', g: 'south-sharqiyah', lat: 22.5670, lng: 59.5290 },
  { n: 'جعلان بني بو علي', g: 'south-sharqiyah', lat: 22.0400, lng: 59.3200 },
  { n: 'الكامل والوافي', g: 'south-sharqiyah', lat: 22.2200, lng: 59.1800 },
  { n: 'رأس الحد', g: 'south-sharqiyah', lat: 22.5300, lng: 59.7900 },
  { n: 'مصيرة', g: 'south-sharqiyah', lat: 20.4200, lng: 58.8300 },
  /* الظاهرة */
  { n: 'عبري', g: 'dhahirah', lat: 23.2250, lng: 56.5160 },
  { n: 'ينقل', g: 'dhahirah', lat: 23.5800, lng: 56.5400 },
  { n: 'ضنك', g: 'dhahirah', lat: 23.5500, lng: 56.2500 },
  /* الوسطى */
  { n: 'هيما', g: 'wusta', lat: 19.9700, lng: 56.2800 },
  { n: 'الدقم', g: 'wusta', lat: 19.6700, lng: 57.7050 }
];

/* نقاط البداية والنهاية المتاحة: المدن + الوجهات السياحية */
function tripPoints() {
  const towns = TOWNS.map((t, i) => ({
    key: 't' + i, label: t.n, group: 'مدن وولايات', gov: t.g, lat: t.lat, lng: t.lng
  }));
  const dests = DESTINATIONS.map((d) => ({
    key: 'd:' + d.id, label: d.name, group: 'وجهات سياحية', gov: d.gov, lat: d.lat, lng: d.lng
  }));
  return towns.concat(dests);
}
