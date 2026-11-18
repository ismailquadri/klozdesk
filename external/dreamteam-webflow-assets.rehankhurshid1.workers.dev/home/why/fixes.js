/* Home rebuild (14 Nov): Sree's homepage fixes that need a script. Each block is self-contained. */

/* #2 The header turns dark over a dark fold. Where each dark stretch sits on the page is measured once (and again when
   the layout changes), so a scroll only does arithmetic plus a colour or opacity read for the one stretch under the
   nav: "Your deals..." while its dimmer is up, the black section, the teammates while their stage is dark (the
   lights fade it to white further down), and the footer below its sunrise. (Perf pass, 14 Nov: this used to hit-test
   the page under the nav on every frame.) */
(function () {
  var header = document.querySelector('.header_component');
  var nav = header && header.querySelector('.nav_component');
  if (!header || !nav) return;
  var tasks = document.getElementById('tasks'), black = document.getElementById('product-overview');
  var prob = document.querySelector('.section_home-problem'), memS = document.querySelector('.section_home-memory'), memC = document.querySelector('.home-memory_component');
  var rolesSec = document.querySelector('.section_home-roles'), roles = document.querySelector('.home-roles_component');
  var ways = document.querySelector('.section_home-ways'), footer = document.querySelector('.footer_component');
  var iris = null, bands = [], headH = 0, barH = 0, raf = 0;
  function lum(c) { var m = String(c).match(/[\d.]+/g); if (!m || (m.length > 3 && +m[3] < 0.5)) return 1; return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; }
  function isDim(el) { var cs = getComputedStyle(el); return cs.visibility !== 'hidden' && +cs.opacity > 0.5 && lum(cs.backgroundColor) < 0.35; }
  function measure() {
    var y = window.scrollY, bar = header.querySelector('.announcement_component');
    headH = header.offsetHeight; barH = bar && getComputedStyle(bar).display !== 'none' ? bar.offsetHeight : 0;
    bands = [];
    function add(el, test) { if (!el) return; var r = el.getBoundingClientRect(); bands.push({ top: r.top + y, bottom: r.bottom + y, test: test }); }
    // where the scroll scenes run, they wrap their sections in a taller block that holds the pinned run (a bare div
    // holding the section and a spacer); measure that block then, and the section itself otherwise (phones)
    function host(el) { var p = el && el.parentElement; return p && p.tagName === 'DIV' && !p.className && p.children.length <= 2 ? p : el; }
    add(host(tasks), function () { iris = iris || document.querySelector('.homepage-tasks_iris'); return !!iris && +getComputedStyle(iris).opacity > 0.5; });
    add(host(black), function () { return isDim(black); });
    // old-home's problem → memory scene (15 Nov revert): dark while its iris is up, and over the black memory section
    add(prob, function () { var ir = document.querySelector('.home-problem_iris'); return !!ir && (ir.dataset.dark ? ir.dataset.dark === '1' : +getComputedStyle(ir).opacity > 0.5); });
    add(memS, function () { return isDim(memC || memS) || isDim(memS); });
    // the teammates are dark until the lights come up; since 16 Nov their dark is a wash over a light base (ways.js),
    // so their own background colour no longer says so: they are dark while not .is-lit
    add(rolesSec, function () { return roles ? !roles.classList.contains('is-lit') : isDim(rolesSec); });
    // "Why Dreamteam?" is always dark (15 Nov)
    add(document.querySelector('.section_home-why'), function () { return true; });
    // the trust section under the teammates wears their dark film until the lights come up (ways.js sets .is-dim)
    // the section under the teammates wears their dark film until the lights come up (ways.js sets .is-dim)
    var trust = document.querySelector('.home-trust_component'), waysC = document.querySelector('.home-ways_component');
    add(trust, function () { return trust.classList.contains('is-dim'); });
    add(ways, function () { return isDim(ways) || (!!waysC && waysC.classList.contains('is-dim')); });
    add(footer, function (at, b) { return at - b.top > 300; });
  }
  function check() {
    raf = 0;
    var y = window.scrollY, line = y + Math.max(headH - barH, headH - y) + 2, dark = false;
    for (var i = 0; i < bands.length && !dark; i++) { var b = bands[i]; if (line >= b.top && line < b.bottom) dark = b.test(line, b); }
    if (header.classList.contains('is-dark') !== dark) header.classList.toggle('is-dark', dark);
  }
  function soon() { if (!raf) raf = requestAnimationFrame(check); }
  function refit() { measure(); soon(); }
  addEventListener('scroll', soon, { passive: true });
  addEventListener('resize', refit);
  addEventListener('load', refit);
  addEventListener('dt-theme', function () { soon(); setTimeout(soon, 550); });
  // the trust section's film is a class change, not a transition on an element we watch
  if ('MutationObserver' in window) ['.home-trust_component', '.home-ways_component', '.home-roles_component'].forEach(function (s) {
    var el = document.querySelector(s); if (el) new MutationObserver(soon).observe(el, { attributes: true, attributeFilter: ['class'] });
  });
  // the teammates' stage and the "Your deals..." dimmer fade on their own after the scroll stops: look again when they land
  document.addEventListener('transitionend', function (e) {
    var t = e.target;
    if (t === roles || t === ways || t === black || (t.classList && (t.classList.contains('homepage-tasks_iris') || t.classList.contains('home-problem_iris')))) soon();
  }, true);
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(document.body);
  refit();
})();

/* #3 (the hero's work-email check) moved to /site/forms.js on 16 Nov, which runs every form on the site the way dreamteam.ai does. */

/* #6 "Your deals...": the Gmail badge's "99+" gets a smaller size, and the Zoom card's timer runs with its playhead
   (the playhead crosses the clip every 14s; the timer counts those seconds up to 42:36). */
(function () {
  var tasks = document.getElementById('tasks');
  if (!tasks) return;
  var badge = tasks.querySelector('.homepage-tasks_badge'), count = badge && badge.querySelector('span');
  if (count && window.MutationObserver) {
    var mark = function () { badge.classList.toggle('is-long', count.textContent.trim().length > 2); };
    new MutationObserver(mark).observe(count, { childList: true, characterData: true, subtree: true });
    mark();
  }
  var zoom = tasks.querySelector('.homepage-tasks_zoom'), timer = zoom && zoom.querySelector('.homepage-tasks_timer span');
  if (!zoom || !timer || !Element.prototype.getAnimations) return;
  var END = 42 * 60 + 36, CLIP = 14;
  function fmt(s) { return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  setInterval(function () {
    var anim = null;
    zoom.querySelectorAll('i').forEach(function (el) { el.getAnimations().forEach(function (a) { if (!anim && String(a.effect && a.effect.getKeyframes && JSON.stringify(a.effect.getKeyframes())).indexOf('translateX(100%)') > -1) anim = a; }); });
    if (!anim || anim.currentTime == null) return;
    var p = (anim.currentTime % 14000) / 14000;
    timer.textContent = fmt(END - CLIP + Math.floor(p * CLIP));
  }, 250);
})();

/* Old-home footer code (15 Nov revert): "The shift" intro above the mark settles in and steps aside with the memory copy. */
/* The intro above the mark ("The shift") settles in and steps aside with the memory copy below it: the transition
   script drives the copy's opacity, blur and offset, and the intro takes the same values. */
(function () {
  var memory = document.querySelector('.home-memory_component');
  var intro = memory && memory.querySelector('.home-memory_intro');
  var copy = memory && memory.querySelector('.home-memory_content');
  if (!intro || !copy || !window.MutationObserver) return;
  function sync() {
    var s = copy.style, t = intro.style;
    t.opacity = s.opacity;
    t.filter = s.filter;
    t.translate = s.translate;
  }
  new MutationObserver(sync).observe(copy, { attributes: true, attributeFilter: ['style'] });
  sync();
})();

/* #4 The teammates stage fits the screen's height (Sree, 16 Nov: "scale it down so that it works on smaller height").
   The stage is pinned full-screen, and its tabs, line and panel (about 680px at full width) started 40px from the top,
   so the nav covered the tabs and short windows cut the panel off. The block is scaled down (never up) to fit between
   the nav and the bottom of the screen, with 24px clear on both, and centred in that space. Only while the stage is
   pinned (position: sticky); measured on load, resize and when the fonts land. */
(function () {
  var comp = document.querySelector('.home-roles_component');
  var box = comp && comp.querySelector('.home-roles_container');
  var header = document.querySelector('.header_component');
  if (!box) return;
  var GAP = 24;
  function fit() {
    box.style.transform = '';
    if (getComputedStyle(comp).position !== 'sticky') return;
    var H = box.offsetHeight, top0 = box.offsetTop, vh = window.innerHeight;
    var nav = header ? Math.max(0, Math.min(header.getBoundingClientRect().bottom, header.offsetHeight)) : 0;
    var avail = vh - nav - GAP * 2;
    if (!H || avail <= 0) return;
    var k = Math.min(1, avail / H);
    var y = nav + GAP + (avail - H * k) / 2 - top0;
    box.style.transformOrigin = '50% 0';
    box.style.transform = 'translateY(' + y.toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
  }
  var raf = 0;
  function soon() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; fit(); }); }
  addEventListener('resize', soon);
  addEventListener('load', soon);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(soon);
  fit();
})();

/* 16 Nov: the hero copy lines up with the navbar logo (home-v5.css reads --dt-logo-left) */
(function () {
  var hero = document.getElementById('hero'), logo = document.querySelector('.nav_logo-link');
  if (!hero || !logo) return;
  function put() { hero.style.setProperty('--dt-logo-left', Math.round(logo.getBoundingClientRect().left - hero.getBoundingClientRect().left) + 'px'); }
  put(); addEventListener('resize', put); addEventListener('load', put);
})();

/* 16 Nov (Rehan): hero cards hold their design when the browser or phone enlarges text. A phone's font size setting
   or a browser's text scaling grows the type but not the cards it sits in, so the illustrations overflow. The cards
   are pictures of the product, not reading text, so their type is drawn back at its designed size there (headings,
   intro, form and the rest of the page still enlarge as the visitor asked).
   How much text is enlarged is measured, not guessed: a hidden 12px Inter sample is compared with its normal width,
   and a 10em box at 12px with its 120px. Only the cards' text (and the quote pill) is scaled back, by 1 / that.
   The samples sit inside the cards, so what the CSS already undoes (Chrome on iPhone's text zoom, home-v5.css) is not
   undone twice: this only catches enlargement that still gets through. */
(function () {
  'use strict';
  var hero = document.getElementById('hero');
  if (!hero || !hero.querySelector('.hz-mag')) return;
  function measure() {
    var a = document.createElement('span'), b = document.createElement('span');
    a.textContent = 'Hxg';
    a.style.cssText = b.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;line-height:normal;font-size:12px;';
    a.style.fontFamily = 'Inter';
    b.style.display = 'block'; b.style.width = '10em'; b.style.height = '1px';
    var host = hero.querySelector('.hz-mag') || hero;
    host.appendChild(a); host.appendChild(b);
    var inter = document.fonts && [].some.call(document.fonts, function (f) { return f.family.replace(/["']/g, '') === 'Inter' && f.status === 'loaded'; });
    var byText = inter ? a.getBoundingClientRect().width / 22.03 : 1;
    var byEm = b.getBoundingClientRect().width / 120;
    a.remove(); b.remove();
    return Math.max(byText, byEm);
  }
  var css = document.createElement('style');
  css.textContent =
    '#hero.dt-text-fix .hz-mag .hz-t,#hero.dt-text-fix .hz-mag .hz-s,#hero.dt-text-fix .hz-mag .hz-k,' +
    '#hero.dt-text-fix .hz-mag .hz-v,#hero.dt-text-fix .hz-mag .hz-chip,#hero.dt-text-fix .hz-mag .hz-num,' +
    '#hero.dt-text-fix .hz-mag .hz-node,#hero.dt-text-fix .hz-mag .hz-pill p{zoom:var(--dt-text-fix,1)}';
  document.head.appendChild(css);
  function apply() {
    var r = measure();
    var on = r > 1.08;
    hero.classList.toggle('dt-text-fix', on);
    if (on) hero.style.setProperty('--dt-text-fix', (1 / r).toFixed(4));
    else hero.style.removeProperty('--dt-text-fix');
  }
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(apply);
  var t; addEventListener('resize', function () { clearTimeout(t); t = setTimeout(apply, 200); });
})();
