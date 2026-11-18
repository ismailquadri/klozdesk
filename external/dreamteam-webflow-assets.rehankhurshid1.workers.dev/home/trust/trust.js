/* Home, "AI-forward GTM teams trust Dreamteam." (section_home-trust)
   The logos are a static row of Webflow tiles (data-logo="<key>"). The quotes: CMS collection "Customer quotes"; each
   item carries data-logo (Logo key) and data-order (Order). Hovering or focusing a tile lifts that logo
   and, if the customer has a quote, the banner cross-fades to it. Otherwise the banner steps through the quotes every
   6s while the section is in view. Nothing moves with reduced motion. */
(function () {
  var sec = document.querySelector('.section_home-trust');
  if (!sec) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- quotes ---- */
  var list = sec.querySelector('.home-trust_quote-list');
  var items = list ? [].slice.call(list.querySelectorAll('.home-trust_quote-item')) : [];
  var rowKeys = [].slice.call(sec.querySelectorAll('.home-trust_logos .home-trust_tile[data-logo]')).map(function (t) { return (t.getAttribute('data-logo') || '').trim().toLowerCase(); });
  var tileAt = function (el) { var n = rowKeys.indexOf((el.getAttribute('data-logo') || '').trim().toLowerCase()); return n < 0 ? 1e9 : n; };
  var ord = function (el) { var n = parseFloat(el.getAttribute('data-order')); return isNaN(n) ? 1e9 : n; };
  items = items.map(function (el, i) { return { el: el, i: i }; })
    .sort(function (a, b) { return (ord(a.el) - ord(b.el)) || (a.i - b.i); })
    /* 15 Nov (Bharath: "make the autoplay run in sequence"): play the quotes in the order their logos sit in the row,
       left to right; quotes whose logo isn't in the row keep their CMS order after them */
    .sort(function (a, b) { return tileAt(a.el) - tileAt(b.el); })
    .map(function (o) { list.appendChild(o.el); return o.el; });
  var keys = items.map(function (el) { return (el.getAttribute('data-logo') || '').trim().toLowerCase(); });
  var idx = 0, timer = null;
  items.forEach(function (el, i) { el.classList.toggle('is-active', i === 0); if (i) el.setAttribute('aria-hidden', 'true'); });
  if (list) { list.classList.add('is-ready'); list.setAttribute('aria-live', 'polite'); }

  /* 16 Nov (Sree): while the quotes play on their own, the logo whose quote is showing is lit (white tile, full colour,
     and a thin bar filling over the 6s), so it reads as a set you can hover through */
  function current() {
    var k = keys[idx];
    tiles.forEach(function (t) {
      var on = (t.getAttribute('data-logo') || '').trim().toLowerCase() === k;
      t.classList.toggle('is-current', on);
      if (on) { t.classList.remove('is-timing'); void t.offsetWidth; if (timer) t.classList.add('is-timing'); }
      else t.classList.remove('is-timing');
    });
  }
  function show(k) {
    var next = keys.indexOf(k);
    if (next < 0 || next === idx) return;
    var cur = items[idx];
    cur.classList.remove('is-active'); cur.classList.add('is-leaving'); cur.setAttribute('aria-hidden', 'true');
    setTimeout(function () { cur.classList.remove('is-leaving'); }, 600);
    idx = next; items[idx].classList.add('is-active'); items[idx].removeAttribute('aria-hidden');
    current();
  }
  function stop() { clearTimeout(timer); timer = null; if (tiles) tiles.forEach(function (t) { t.classList.remove('is-timing'); }); }
  function play() {
    stop();
    if (reduced || items.length < 2) { current(); return; }
    timer = setTimeout(function tick() { timer = setTimeout(tick, 6000); show(keys[(idx + 1) % keys.length]); }, 6000);
    current();
  }

  var tiles = [].slice.call(sec.querySelectorAll('.home-trust_logos .home-trust_tile[data-logo]'));
  function mark(k) { tiles.forEach(function (t) { t.classList.toggle('is-hot', !!k && t.getAttribute('data-logo') === k); }); }
  tiles.forEach(function (t) {
    var k = (t.getAttribute('data-logo') || '').trim().toLowerCase(), has = keys.indexOf(k) > -1;
    if (has) {
      t.classList.add('has-quote');
      t.tabIndex = 0; t.setAttribute('role', 'button');
      var img = t.querySelector('img'); t.setAttribute('aria-label', 'Show the quote from ' + (img && img.alt || k));
    }
    var on = function () { mark(t.getAttribute('data-logo')); if (has) { stop(); show(k); } };
    var off = function () { mark(null); play(); };
    /* 16 Nov: hover is for a mouse or pen. A finger that starts a scroll on a tile got pointerenter but, on iOS, never the
       pointerleave (the touch ends in pointercancel), which left the quotes stopped until the section left the screen.
       A tap on a tile shows its quote and the rotation carries on from there. */
    var touch = false;
    t.addEventListener('pointerdown', function (e) { touch = e.pointerType === 'touch'; });
    t.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') on(); });
    t.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') off(); });
    t.addEventListener('click', function () { if (touch && has) { show(k); play(); } });
    t.addEventListener('focus', on); t.addEventListener('blur', off);
  });

  current();
  if ('IntersectionObserver' in window)
    new IntersectionObserver(function (es) { es[0].isIntersecting ? play() : stop(); }, { threshold: .3 }).observe(sec);
})();
