/* ===== صفحة البيئة والتخييم ===== */
document.addEventListener('DOMContentLoaded', () => {
  /* حاسبة الطاقة الشمسية */
  const DEV = [['إضاءة LED', 5, 5], ['شحن جوال', 10, 3], ['حاسوب محمول', 50, 3], ['ثلاجة صغيرة', 45, 10], ['مكبّر/راديو', 8, 4], ['مروحة', 25, 6]];
  const wrap = document.getElementById('solar-form');
  wrap.innerHTML = DEV.map(([n, w, h], i) =>
    `<label>${n} (عدد)<input type="number" min="0" data-i="${i}" value="${i < 2 ? (i === 0 ? 3 : 4) : 0}"></label>`).join('');
  function solar() {
    const nights = +document.getElementById('s-nights').value || 1, sun = +document.getElementById('s-sun').value || 5;
    let wh = 0;
    wrap.querySelectorAll('input').forEach(inp => { const [, w, h] = DEV[+inp.dataset.i]; wh += (+inp.value || 0) * w * h; });
    const panel = Math.ceil(wh / (sun * 0.7) / 10) * 10;
    const batt = Math.ceil(wh * 1.3 / 0.8 / 10) * 10;
    const gen = wh * nights * 0.35 / 1000;
    document.getElementById('solar-out').innerHTML =
      `الاستهلاك اليومي: <b>${Math.round(wh)}</b> واط·ساعة<br>لوح شمسي مقترح: <b>${panel}</b> واط<br>سعة البطارية المقترحة: <b>${batt}</b> واط·ساعة<br>` +
      `وقود مولّد قد توفّره في ${nights} ليالٍ: نحو <b>${gen.toFixed(1)}</b> لتر (تقدير)`;
  }
  wrap.addEventListener('input', solar);
  ['s-nights', 's-sun'].forEach(i => document.getElementById(i).addEventListener('input', solar));
  solar();

  /* حاسبة النفايات */
  function waste() {
    const p = +document.getElementById('w-p').value || 1, d = +document.getElementById('w-d').value || 1, b = +document.getElementById('w-b').value || 0;
    const bottles = p * d * b, general = p * d * 0.5, plastic = bottles * 0.02;
    document.getElementById('waste-out').innerHTML =
      `زجاجات بلاستيك متوقعة: <b>${bottles}</b> (نحو ${plastic.toFixed(1)} كغ)<br>نفايات عامة تقديرية: <b>${general.toFixed(1)}</b> كغ<br>` +
      `إن استخدمتم <b>زجاجات قابلة لإعادة الملء</b> وجالون ماء كبيرًا تتجنّبون تقريبًا <b>${bottles}</b> زجاجة. احملوا كل شيء معكم.`;
  }
  ['w-p', 'w-d', 'w-b'].forEach(i => document.getElementById(i).addEventListener('input', waste));
  waste();

  /* مبادئ لا تترك أثرًا */
  const LNT = [
    ['', 'خطّط وتجهّز', 'اعرف القواعد والطقس والمسار، واحمل ما يكفي لتقليل الحاجة للتخلّص.'],
    ['', 'استخدم الأسطح المتينة', 'امشِ وخيّم على المسارات والمواقع المعدّة، وتجنّب النباتات والكثبان الهشّة.'],
    ['', 'تخلّص من النفايات بشكل صحيح', 'احمل ما أحضرته وافرزه، ودفن الفضلات البشرية بعيدًا عن الماء.'],
    ['', 'اترك ما تجده', 'لا تأخذ صخورًا أو أصدافًا أو قطعًا أثرية أو نباتات، ولا تنقش على الصخور.'],
    ['', 'قلّل أثر النار', 'استخدم موقدًا بدل الحطب، والنار في أماكنها فقط وأطفئها تمامًا.'],
    ['', 'احترم الحياة الفطرية', 'راقب من بعيد ولا تطعم ولا تزعج، وحافظ على الهدوء ليلًا قرب السلاحف.'],
    ['', 'راعِ الآخرين والمجتمع المحلي', 'احترم الخصوصية والتقاليد وهدوء الأهالي والزوار، واستأذن قبل التصوير.']
  ];
  document.getElementById('lnt').innerHTML = LNT.map(([i, t, d], n) =>
    `<article class="item-card"><h3><span class="ic">${i}</span>${t}</h3><p>${d}</p></article>`).join('');
});
