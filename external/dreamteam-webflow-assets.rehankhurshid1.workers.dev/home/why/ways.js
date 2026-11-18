/* Home, "One CRM. Two ways in." light handoff and quotes. Moved out of its Webflow embed on 16 Nov so it is edited and deployed here
   (~/Desktop/dreamteam-webflow-assets, npx wrangler deploy). The embed on the Home page now only points to this file. */
/* Dreamteam "One CRM. Two ways in." section.
   The lights come up as the section arrives: once it has risen far enough up the screen, the dark roles section
   above and this one fade to white together, so the two never meet at a hard edge, and copy sitting straight on that
   background swaps ink halfway through (this section's copy starts light, the roles copy ends dark). The fade runs on
   its own once started, so stopping mid-scroll never leaves the page resting on grey; scrolling back down past a
   slightly lower line dims both again. Further down, the customer quotes drift sideways in an endless row and ease to
   a stop under a pointer or focus, and the card under the pointer turns over to its coloured back (a tap turns it on
   touch screens; with reduced motion the back fades in instead). Without the script each section keeps its own
   colour and the quotes stay a row of fronts that scrolls sideways. */
(function () {
  var section = document.querySelector('.home-ways_component');
  if (!section) return;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Light handoff (16 Nov, scrubbed). Whatever section sits straight under the dark teammates (now "One CRM. Two ways
     in.") wears the teammates' #222 film; as it rises from LIT_FROM to LIT_TO (fractions of the screen height), the
     teammates' dark wash and that film fade together with the scroll, eased, over the same colour (the lower
     section's own background), so the two sections are one colour at every scroll position and never read as two
     parts (Sree, 15 Nov: "it feels two part based on BG animation"). The lower section's heading blends from white to
     ink with it; the teammates' copy swaps ink at the midpoint (.is-lit). The film's strength is --dim (1 dark, 0
     clear) on the lower section's component; .is-dim marks its dark half for the header (fixes.js). Without the
     script there is no film and each section keeps its own colour. */
  var above = document.querySelector('.home-roles_component');
  var rolesSec = document.querySelector('.section_home-roles');
  var secs = Array.prototype.slice.call(document.querySelectorAll('section'));
  var nextSec = rolesSec ? secs[secs.indexOf(rolesSec) + 1] : null;
  var gate = nextSec ? (nextSec.firstElementChild || nextSec) : section;
  var LIT_FROM = 0.95, LIT_TO = 0.3, wash = above && above.querySelector('.home-roles_wash');
  var gateHead = gate.querySelector('h2');
  var INKS = [['.home-roles_copy-heading', '#111', false], ['.home-roles_copy-text', 'rgba(0, 0, 0, 0.7)', false]];
  var inks = [];
  INKS.forEach(function (k) {
    Array.prototype.forEach.call(document.querySelectorAll(k[0]), function (el) { inks.push({ el: el, ink: k[1], onDark: k[2] }); });
  });
  function rgb(c) { var m = String(c).match(/[\d.]+/g) || [255, 255, 255]; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; }
  /* the colour both sections end on: the lower section's own background (its component's, else the section's) */
  var under = rgb(getComputedStyle(gate).backgroundColor);
  if (under[3] < 0.5 && nextSec) under = rgb(getComputedStyle(nextSec).backgroundColor);
  if (under[3] < 0.5) under = [255, 255, 255, 1];
  var white = 'rgb(' + under.slice(0, 3).join(',') + ')', INK = [28, 29, 31];
  function mix(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
  var lastP = -1, half = null;
  gate.style.setProperty('--wash-t', '0s');
  function light() {
    if (!above) return;
    var r = gate.getBoundingClientRect().top / window.innerHeight;
    var p = Math.min(1, Math.max(0, (LIT_FROM - r) / (LIT_FROM - LIT_TO)));
    p = p * p * (3 - 2 * p);                                        /* smoothstep: no hard start or stop */
    if (Math.abs(p - lastP) < 0.002) return;
    lastP = p;
    /* the teammates' dark is their wash (a full-height #111 -> #222 layer); under it the section takes the lower
       section's colour, so the wash and the #222 film fade at the same rate over the same colour */
    above.style.transition = 'none'; above.style.backgroundColor = white;
    if (wash) { wash.style.transition = 'none'; wash.style.opacity = String(1 - p); }
    gate.style.setProperty('--dim', String(1 - p));
    if (gateHead) gateHead.style.color = mix([255, 255, 255], INK, p);
    var on = p >= 0.5;
    if (on !== half) {
      half = on;
      above.classList.toggle('is-lit', on);
      gate.classList.toggle('is-lit', on);
      gate.classList.toggle('is-dim', !on);
      inks.forEach(function (k) { k.el.style.transition = 'color 200ms ease'; k.el.style.color = k.onDark === !on ? k.ink : ''; });
    }
  }

  /* Quotes: an endless row, one set of cards after another, starting where the design cuts the first card */
  var quotes = section.querySelector('.home-ways_quotes'), track = quotes && quotes.querySelector('.home-ways_track');
  var START = -15.4367, SPEED = 1.75, EASE = 5; /* rem from the left edge, rem per second, how quickly it eases to a stop */
  var cards = track ? Array.prototype.slice.call(track.children) : [], clones = [];
  var running = false, x = 0, v = 0, set = 0, rem = 16, held = false, onScreen = false, raf = 0, lastT = 0;

  function measure() {
    rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    set = clones.length ? clones[0].offsetLeft - cards[0].offsetLeft : 0;
  }
  function fill() {
    measure();
    /* Enough copies that the row never runs out on the widest screen */
    while (set && track.scrollWidth - set < quotes.clientWidth + set) copies();
  }
  /* One more set of cards, hidden from assistive tech, always face up */
  function copies() {
    cards.forEach(function (card) {
      var copy = card.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(copy.querySelectorAll('[style]'), function (el) { el.removeAttribute('style'); });
      track.appendChild(copy);
      clones.push(copy);
    });
  }
  function start() {
    if (running || !track || !cards.length || reduceMotion.matches) return;
    running = true;
    /* Clip sideways only, so a card's near edge can swing past the row's top and bottom as it turns */
    quotes.style.overflowX = window.CSS && CSS.supports('overflow-x', 'clip') ? 'clip' : 'hidden';
    quotes.style.paddingLeft = quotes.style.paddingRight = '0px';
    copies();
    fill();
    x = START * rem;
    v = SPEED;
    place();
    wake();
  }
  function stop() {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    if (turned && clones.indexOf(turned) > -1) turn(null);
    clones.forEach(function (c) { c.remove(); });
    clones = [];
    quotes.style.overflowX = quotes.style.paddingLeft = quotes.style.paddingRight = track.style.transform = '';
  }
  function place() {
    /* Wrap by whole sets so the jump is invisible */
    var first = START * rem;
    while (x <= first - set) x += set;
    while (x > first) x -= set;
    track.style.transform = 'translate3d(' + x.toFixed(2) + 'px, 0, 0)';
  }
  function frame(t) {
    raf = 0;
    if (!running || !onScreen || document.hidden) { lastT = 0; return; }
    var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0;
    lastT = t;
    v += ((held ? 0 : SPEED) - v) * Math.min(1, dt * EASE);
    x -= v * rem * dt;
    place();
    raf = requestAnimationFrame(frame);
  }
  function wake() { if (running && !raf) { lastT = 0; raf = requestAnimationFrame(frame); } }
  function hold(on) { held = on; wake(); }

  /* Turning a card over: the card under the pointer shows its back, and only one card is ever turned */
  var turned = null, tapped = false;
  function turn(card) {
    if (card === turned) return;
    [turned, card].forEach(function (c, i) {
      if (!c) return;
      var on = i === 1, inner = c.querySelector('.home-ways_card-inner'), front = c.querySelector('.home-ways_quote'), back = c.querySelector('.home-ways_quote-back');
      if (!inner || !front || !back) return;
      if (reduceMotion.matches) {
        inner.style.transform = '';
        back.style.transform = 'none';
        front.style.transition = back.style.transition = 'opacity 0.3s ease';
        front.style.opacity = on ? '0' : '1';
        back.style.opacity = on ? '1' : '0';
      } else {
        front.style.opacity = back.style.opacity = back.style.transform = front.style.transition = back.style.transition = '';
        inner.style.transform = on ? 'rotateY(180deg)' : '';
      }
    });
    turned = card;
  }
  function cardAt(e) { return e.target.closest ? e.target.closest('.home-ways_card') : null; }

  if (quotes) {
    quotes.addEventListener('pointerover', function (e) { if (e.pointerType !== 'touch') turn(cardAt(e)); });
    quotes.addEventListener('click', function (e) {
      if (!tapped) return;
      var card = cardAt(e);
      turn(card === turned ? null : card);
      hold(!!turned);
    });
    quotes.addEventListener('pointerdown', function (e) { tapped = e.pointerType === 'touch'; });
    quotes.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') hold(true); });
    quotes.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') { hold(false); turn(null); } });
    quotes.addEventListener('focusin', function () { hold(true); });
    quotes.addEventListener('focusout', function () { hold(false); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { onScreen = e[e.length - 1].isIntersecting; wake(); }).observe(quotes);
    else onScreen = true;
    document.addEventListener('visibilitychange', wake);
  }

  var queued = false;
  function queue() { if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; light(); }); } }
  function refit() {
    light();
    if (running) { var at = set ? (x - START * rem) / set : 0; fill(); x = START * rem + at * set; place(); }
  }

  light();
  start();
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', function (e) { turn(null); if (e.matches) stop(); else start(); });
})();
