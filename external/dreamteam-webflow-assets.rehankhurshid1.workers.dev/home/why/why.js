/* Home, "Why Dreamteam?" stop (16 Nov). Served from Cloudflare (~/Desktop/dreamteam-webflow-assets/public/home/why/,
   npx wrangler deploy); styles in why.css next to it. The section is built in Webflow, its cards come from the "Why
   Dreamteam cards" CMS collection (any number; they are repeated here until both lanes are full).
   "Why Dreamteam?" v2 (16 Nov). Splits the copy into words, copies the five cards so both lanes stay
   full, and on desktop runs the pinned stop through one scroll engine.

   The engine (desktop wheel and keys, from the top of the problem section to just past this one):
   - the page follows the wheel with a little inertia (an exponential ease toward where the wheel has sent it), so a
     mouse's notches and a trackpad's swipe both read as one continuous, even glide;
   - the stops are gates: what is left of a flick or a spun wheel settles softly onto the next stop and stays there, and
     only a new scroll carries on past it, so no stop can be skipped (Rehan, 15 Nov) and nothing is ever snapped;
   - two stretches are glides rather than scrolls: problem → "Meet Dreamteam" and "Meet Dreamteam" → "Why Dreamteam?".
     One scroll sets the page gliding to the far stop over a set time on a quintic curve that starts at the speed the
     page already has and lands with no speed and no push (no stall, no jolt, no long tail), and the scrubbed scene
     plays along with it. A scroll back the other way turns the glide round mid-flight, from its current speed;
   - the page is only written from one place, one frame at a time; if anything else moves it (the scrollbar, a link, a
     find-in-page) the engine lets go and picks up from there.
   This replaces the problem scene's own wheel handling and the old timed hold on this stop (the problem scene keeps its
   touch handling). Everything the stops show is tied to the scroll in CSS, so it is exactly as smooth as the page. */
(function () {
  var sec = document.querySelector('.section_home-why');
  if (!sec) return;

  /* ---- the copy, one span per word (screen readers get the sentence) ---- */
  var n = 0;
  sec.querySelectorAll('.home-why_heading, .home-why_paragraph').forEach(function (el) {
    var text = el.textContent.replace(/\s+/g, ' ').trim();
    if (!text || el.querySelector('.home-why_word')) return;
    var sr = document.createElement('span'), vis = document.createElement('span');
    sr.className = 'home-why_sr'; sr.textContent = text;
    vis.setAttribute('aria-hidden', 'true');
    var ws = text.split(' '), into = vis;
    ws.forEach(function (w, i) {
      /* 16 Nov (Sree: "no orphan text"): the last two words sit in one unbreakable span, so a paragraph never ends on a
         lone word (a no-break space alone doesn't hold between the word boxes) */
      if (i) into.appendChild(document.createTextNode(' '));
      if (i === ws.length - 2 && ws.length > 3) { into = document.createElement('span'); into.className = 'home-why_keep'; vis.appendChild(into); }
      var s = document.createElement('span'); s.className = 'home-why_word'; s.textContent = w; s.style.setProperty('--i', n++); into.appendChild(s);
    });
    el.textContent = ''; el.appendChild(sr); el.appendChild(vis);
  });

  /* Shares of the pinned stretch (see the css): the switch, then the reading */
  var ENTER = 1, READ_FROM = 21, READ_TO = 84;   /* 16 Nov: the whole pinned stretch is the move in (G = E); was 0.14 */

  /* The heading blurs in as one block, only once "Meet Dreamteam" has gone (its blur-out is 0-6%, see the css) */
  sec.querySelectorAll('.home-why_heading .home-why_word').forEach(function (w) {
    w.classList.add('is-set');   /* 16 Nov: printed on the page, it scrolls in with it (see the css) */
  });
  /* The paragraphs, line by line (Rehan, 15 Nov; again 16 Nov: "should be line by line"): words are grouped by the line
     they sit on as laid out, and every word on a line shares that line's slice of the reading, so each line rises and
     whitens as one. Neighbouring lines overlap a little so the reading flows. Redone whenever the layout changes. */
  var pw = [].slice.call(sec.querySelectorAll('.home-why_paragraph .home-why_word'));
  /* the cards come on as the second paragraph starts (Rehan, 16 Nov): where its first line begins, in % of the stretch */
  var para2 = sec.querySelectorAll('.home-why_paragraph')[1], cardsFrom = 40;
  function lines() {
    var tops = [], idx = pw.map(function (w) { var t = Math.round(w.offsetTop); var k = tops.indexOf(t); if (k < 0) { tops.push(t); k = tops.length - 1; } return k; });
    /* 16 Nov (Sree): the stop opens on the title in its place with the first line already in (both 6.5-14%) and the
       second one part way in, still grey, showing there is more to scroll; the rest follow from 10% to READ_TO */
    var order = tops.slice().sort(function (a, b) { return a - b; }), L = order.length, FIRST = [0, 0], FROM = 9, SPAN = READ_TO - FROM;
    var rest = Math.max(1, L - 1), EACH = Math.min(14, SPAN / rest * 1.6), step = rest > 1 ? (SPAN - EACH) / (rest - 1) : 0;
    var wi = 0;
    pw.forEach(function (w, i) {
      var n = order.indexOf(tops[idx[i]]);
      var a = n === 0 ? FIRST[0] : FROM + (n - 1) * step, b = n === 0 ? FIRST[1] : a + EACH;
      w.classList.toggle('is-set', n === 0);
      w.style.setProperty('--a', a.toFixed(2) + '%'); w.style.setProperty('--b', b.toFixed(2) + '%');
      /* 16 Nov (Sree: "instead of scroll, it should happen automatically one after another, like play animation"):
         each line's start, in ms after the reading starts (see .is-reading in the css) */
      /* 16 Nov (Sree: "better stagger, it feels like one by one"): not line by line any more but a wave through the
         words in reading order, 16ms apart, each fading over 650ms, so many words are on their way at once */
      if (n === 0) w.style.setProperty('--t', '0ms'); else w.style.setProperty('--t', (40 + (wi++) * 16) + 'ms');
    });
    var first = para2 && para2.querySelector('.home-why_word');
    cardsFrom = ENTER * 100;   /* 16 Nov: the cards come on as the reading plays, on arrival */
  }
  lines(); addEventListener('resize', lines); if (document.fonts && document.fonts.ready) document.fonts.ready.then(lines);
  if ('ResizeObserver' in window) new ResizeObserver(lines).observe(sec.querySelector('.home-why_copy'));

  var main = sec.closest('.main-wrapper') || document.body;
  var iris = document.querySelector('.home-problem_iris'), stage = document.querySelector('.home-problem_component'), prob = document.querySelector('.section_home-problem');
  var staged = window.DT_ENGINE && window.CSS && CSS.supports('animation-timeline: view()') && CSS.supports('timeline-scope: --a') && iris && stage && prob;
  /* the CMS list: .home-why_cards (wrapper) > .home-why_lanes (list) > .home-why_slot (one per card) */
  var cards = sec.querySelector('.home-why_cards'), lanes = cards && (cards.querySelector('.home-why_lanes') || cards);
  var slots = lanes ? [].slice.call(lanes.querySelectorAll('.home-why_slot')) : [];
  /* order by the CMS "Order" field (bound to data-order); cards without one keep their place after the numbered ones */
  var ord = function (el) { var n = parseFloat(el.getAttribute('data-order')); return isNaN(n) ? 1e9 : n; };
  if (slots.some(function (el) { return el.hasAttribute('data-order'); })) {
    slots = slots.map(function (el, i) { return { el: el, i: i }; })
      .sort(function (a, b) { return (ord(a.el) - ord(b.el)) || (a.i - b.i); })
      .map(function (o) { lanes.appendChild(o.el); return o.el; });
  }
  /* both lanes stay full: the cards are repeated (hidden from screen readers) until there are ten */
  if (staged && slots.length) for (var k = 0; lanes.querySelectorAll('.home-why_slot').length < 10; k++) {
    var c = slots[k % slots.length].cloneNode(true); c.setAttribute('aria-hidden', 'true'); lanes.appendChild(c);
  }
  /* 16 Nov (Sree: "make it feel like random order, not sequential"; the cards "take too much attention"). The lanes
     used to run the same five cards in the same order on both sides, at the same heights, fading in one after another.
     Now each lane gets its own shuffled order (a card never sits level with its own copy on the other side), every card
     its own spot in the lap, distance from the edge and size, and they come on in a scattered order. Smaller cards sit
     further back (dimmer), so the copy in the middle stays the thing to read. Picked afresh on each visit. */
  if (staged && lanes) (function () {
    var all = [].slice.call(lanes.querySelectorAll('.home-why_slot')), n = Math.floor(all.length / 2);
    if (n < 2) return;
    var rnd = function (a, b) { return a + Math.random() * (b - a); };
    var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    var left = shuffle(all.slice(0, n)), right = shuffle(all.slice(n, 2 * n));
    /* the right lane starts half a slot later, and its order is turned until no card is level with its twin */
    var title = function (el) { return (el.textContent || '').trim().slice(0, 40); };
    for (var turn = 0; turn < n && right.some(function (el, i) { return title(el) === title(left[i]); }); turn++) right.push(right.shift());
    var order = []; for (var i = 0; i < n; i++) { order.push(left[i]); order.push(right[i]); }
    order.forEach(function (el) { lanes.appendChild(el); });   /* odd children run on the left, even on the right */
    var delays = shuffle(order.map(function (_, i) { return i; }));
    order.forEach(function (el, i) {
      var lane = i % 2, slot = Math.floor(i / 2), size = rnd(0.6, 0.78), depth = (size - 0.6) / 0.18;
      el.style.setProperty('--phase', ((slot + (lane ? 0.5 : 0) + rnd(-0.18, 0.18)) / n).toFixed(3));
      el.style.setProperty('--size', size.toFixed(3));
      el.style.setProperty('--offset', rnd(0, 0.5).toFixed(3));          /* toward the screen's edge, away from the copy */
      el.style.setProperty('--o', (0.42 + 0.26 * depth).toFixed(3));     /* smaller = further back = dimmer */
      el.style.setProperty('--d', Math.round(delays[i] * 140 + rnd(0, 90)) + 'ms');
    });
  })();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { sec.classList.toggle('is-playing', es[es.length - 1].isIntersecting); }, { rootMargin: '200px 0px' }).observe(sec);
  else sec.classList.add('is-playing');
  if (iris && window.MutationObserver) {
    var wait = function () { sec.classList.toggle('is-waiting', iris.dataset.dark ? iris.dataset.dark !== '1' : +(iris.style.opacity || 0) < 0.5); };
    new MutationObserver(wait).observe(iris, { attributes: true, attributeFilter: ['style', 'data-dark'] });
    wait();
  }
  if (!staged) { window.DT_ENGINE = false; return; }
  sec.classList.add('is-staged'); main.classList.add('has-why-stage');

  /* ---- where the stops are ----
     A: the problem section held, its scene at the start; B: "Meet Dreamteam" (old-home's dark stop: the problem
     section scrolled one screen past its own pin, whose top sits (vh - H) / 2 down the screen); this section's top is
     placed exactly there. G: "Why Dreamteam?" in, the reading starts. E: the end of the reading. */
  var vh = innerHeight, A = 0, B = 0, G = 0, E = 0, maxY = 0;
  function fit() {
    vh = innerHeight;
    sec.style.marginTop = '0px';
    var nat = sec.getBoundingClientRect().top + scrollY;
    B = Math.round(prob.getBoundingClientRect().top + scrollY + (vh + stage.offsetHeight) / 2);
    sec.style.marginTop = (B - nat) + 'px';
    A = B - vh;
    var stretch = sec.offsetHeight - vh;
    G = Math.round(B + ENTER * stretch);
    E = B + stretch;
    maxY = document.documentElement.scrollHeight - vh;
    titled = false; if (typeof whyHead !== 'undefined') title(true);
  }
  /* Where "Why Dreamteam?" is a title before it settles: centred where "Meet Dreamteam" was, at that heading's size.
     Measured from the layout (offsets), not the screen, so the animations running on them don't count */
  var whyHead = sec.querySelector('.home-why_heading'), whyText = whyHead && whyHead.querySelector('[aria-hidden]');
  var whyCopy = sec.querySelector('.home-why_copy'), memC = document.querySelector('.home-memory_component');
  var memIntro = memC && memC.querySelector('.home-memory_intro'), memHead = memIntro && memIntro.querySelector('.home-memory_heading');
  /* measured on the stop itself (where nothing on it is moved by an animation yet); until the page has been there, from
     where the heading is now and how far the page is from the stop */
  var titled = false;
  function title(force) {
    if (!whyHead || !whyText || !memHead || (titled && !force)) return;
    var off = scrollY - B, at = Math.abs(off) < 3;
    /* where it is drawn, less the settle it may still be in: the copy rises into place as the threads finish, and that
       motion is written on the intro as an inline translate (the footer code that mirrors the memory copy) */
    var r = memHead.getBoundingClientRect(), line = memHead.querySelector('br') ? r.height / 2 : r.height;
    var settle = (memIntro.style.translate || '').split(' ')[1] || '', dy = parseFloat(settle) || 0;
    if (/rem$/.test(settle)) dy *= parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var ty = r.top - dy + off + line / 2;
    /* 16 Nov (Sree): on its own the title sits in the middle of the screen under the nav, not up where the heading was */
    var navH = window.DT_NAV_H || ((document.querySelector('.header_component') || {}).offsetHeight || 0);
    ty = navH + (innerHeight - navH) / 2;
    var fy = whyCopy.offsetTop + whyHead.offsetTop + whyHead.offsetHeight / 2;
    var fx = whyCopy.offsetLeft + whyHead.offsetLeft + whyText.offsetLeft + whyText.offsetWidth / 2;
    var s = Math.max(1, Math.min(1.5, parseFloat(getComputedStyle(memHead).fontSize) / parseFloat(getComputedStyle(whyHead).fontSize) * 0.9));
    /* scaled from its left edge: the text's centre moves out by (s - 1) of half its width */
    sec.style.setProperty('--hx', (innerWidth / 2 - fx - (s - 1) * whyText.offsetWidth / 2).toFixed(1) + 'px');
    sec.style.setProperty('--hy', (ty - fy).toFixed(1) + 'px');
    sec.style.setProperty('--hs', s.toFixed(3));
    if (at) titled = true;
  }
  title(true);
  fit(); addEventListener('load', fit); addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  setTimeout(fit, 1500);

  /* State classes for anything else that reads them; nothing visual hangs on them any more */
  var on = false, carded = false, reading = false, pastOn = false;
  function state() {
    var v = scrollY > B + 2; if (v !== on) { on = v; sec.classList.toggle('is-why', v); main.classList.toggle('is-why', v); }
    /* the cards come on as the reading starts (just past G) and go once the section is mostly gone */
    if (!titled && Math.abs(scrollY - B) < 3) title(true);
    var c = scrollY >= B + cardsFrom / 100 * (E - B) - 3 && scrollY < E + 1.1 * vh;   /* 16 Nov: they stay until the section has scrolled away (was 0.5vh) */
    if (c !== carded) { carded = c; sec.classList.toggle('is-cards', c); }
    /* 16 Nov: past this stop, the "Meet Dreamteam" layer (pinned and dark, sized for the old, longer stop) is switched
       off, as it was covering the teammates' tabs and heading as they came in */
    var past = scrollY > E + 2; if (past !== pastOn) { pastOn = past; main.classList.toggle('is-why-past', past); }
    /* the reading plays on its own once the page is on the stop; scrolled back up to "Meet Dreamteam" it resets */
    var rd = scrollY >= G - 3 ? true : scrollY <= B + 0.5 * (G - B) ? false : reading;
    if (rd !== reading) { reading = rd; sec.classList.toggle('is-reading', rd); }
  }
  addEventListener('scroll', state, { passive: true }); addEventListener('resize', state); state();

  /* ---- the rail (16 Nov, Sree: "the title getting the line connection from the previous") ----
     "Meet Dreamteam" ends on one line running down the middle of the screen. Over the glide to this stop that line
     carries on here: it slides over to the left of the copy and bends in to the title, so the title arrives on the end
     of it. It stays as a rail beside the reading and leaves with the copy. Drawn on the pinned stage, in screen px. */
  var stageEl = sec.querySelector('.home-why_stage'), rail = null, railPath = null, railFade = null, railStops = [], from = null;
  if (stageEl && whyText) {
    var NS = 'http://www.w3.org/2000/svg';
    rail = document.createElementNS(NS, 'svg'); rail.setAttribute('aria-hidden', 'true'); rail.setAttribute('class', 'home-why_rail');
    rail.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;opacity:0';
    var defs = document.createElementNS(NS, 'defs'); rail.appendChild(defs);
    railFade = document.createElementNS(NS, 'linearGradient'); railFade.id = 'home-why-rail-fade'; railFade.setAttribute('gradientUnits', 'userSpaceOnUse');
    railFade.setAttribute('x1', 0); railFade.setAttribute('x2', 0); defs.appendChild(railFade);
    [[0, 0.35], [0.6, 0.35], [1, 0.6]]   /* 15 Nov (Sree's Figma 1452-6680): the line now runs into the beacon over the title (why.css) instead of fading out */.forEach(function (st) {
      var el = document.createElementNS(NS, 'stop'); el.setAttribute('offset', st[0]); el.setAttribute('stop-color', '#fff'); el.setAttribute('stop-opacity', st[1]); railFade.appendChild(el); railStops.push(el);
    });
    railPath = document.createElementNS(NS, 'path'); railPath.setAttribute('fill', 'none'); railPath.setAttribute('stroke', 'url(#home-why-rail-fade)');
    railPath.setAttribute('stroke-width', '1'); railPath.setAttribute('stroke-linecap', 'round'); rail.appendChild(railPath);
    stageEl.insertBefore(rail, stageEl.firstChild);
  }
  /* 16 Nov (Sree, 2nd pass): "Why Dreamteam?" is centred at the size of the "Meet Dreamteam" heading before it, and
     the line comes down from the top of the screen into it. The type is copied from that heading so the two match
     at every width. */
  function sizeTitle() {
    if (!whyHead || !memHead) return;
    var cm = getComputedStyle(memHead), s = whyHead.style;
    s.fontSize = cm.fontSize; s.lineHeight = cm.lineHeight; s.letterSpacing = cm.letterSpacing; s.fontWeight = cm.fontWeight;
    s.textAlign = 'center';
    /* centred on the screen, whatever the copy column's own offset */
    s.translate = '';
    var r = whyHead.getBoundingClientRect(), dx = innerWidth / 2 - (r.left + r.width / 2);
    s.translate = Math.abs(dx) > 1 ? dx.toFixed(1) + 'px 0' : '';
  }
  sizeTitle(); addEventListener('resize', sizeTitle); if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeTitle);
  /* where the last stop's line is, measured on that stop; the middle of the screen until the page has been there */
  function teaserAt() {
    /* the line leaves from the foot of the mark (its own top is hidden under the mark) */
    var t = document.querySelector('.section_home-memory .home-memory_logo');
    if (!t || Math.abs(scrollY - B) > 3) return;
    var r = t.getBoundingClientRect();
    if (r.height > 40) from = { x: r.left + r.width / 2, y: r.bottom };
  }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }
  var railKey = '';
  /* The line is drawn on the page that the glide scrolls: it starts at the foot of the mark and ends just above where
     "Why Dreamteam?" is, one screen further down, fading out over its last stretch. Both ends move with the scroll
     (worked out from it, not measured, as the scroll-driven move is applied after this runs). Before the page leaves
     the stop, the mark's own line shows instead; it is the same line, so the hand-off can't be seen. */
  function drawRail() {
    if (!rail) return;
    teaserAt();
    var span = Math.max(1, E - B), p = (scrollY - B) / span, sy = scrollY;
    var on = (p > 0 ? 1 : 0) * (1 - clamp((sy - E) / (0.35 * vh)));
    if (sy < B + 1) on = 0;
    var key = on.toFixed(3) + '|' + Math.round(sy) + '|' + innerWidth + 'x' + innerHeight;
    if (key === railKey) return; railKey = key;
    rail.style.opacity = on.toFixed(3);
    if (on <= 0) return;
    var st = stageEl.getBoundingClientRect(), H = innerHeight;
    var off = clamp(p / ENTER) * H;                                  /* how far the page has moved */
    var rest = whyCopy.offsetTop + whyHead.offsetTop + whyText.offsetTop;
    var x = innerWidth / 2 - st.left;
    var top = (from ? from.y - st.top : 0.62 * H) - off;             /* foot of the mark */
    var foot = rest + H - off - 18;                                  /* just above the title */
    railPath.setAttribute('d', 'M' + x.toFixed(1) + ' ' + Math.max(top, -20).toFixed(1) + 'L' + x.toFixed(1) + ' ' + Math.max(top + 1, foot).toFixed(1));
    railFade.setAttribute('y1', top.toFixed(1)); railFade.setAttribute('y2', foot.toFixed(1));
  }
  addEventListener('scroll', drawRail, { passive: true }); addEventListener('resize', drawRail); drawRail();

  /* The dark stop's mark, threads and cards are decoded before the page gets there, so the first glide through doesn't
     stop for them (it dropped ~600ms of frames on a cold visit) */
  var warm = false;
  function prewarm(now) {
    if (warm || (now !== true && scrollY < A - 1.5 * vh)) return;
    warm = true;
    document.querySelectorAll('.section_home-problem img, .section_home-memory img, .section_home-why img').forEach(function (img) {
      img.loading = 'eager'; if (img.decode) img.decode().catch(function () {});
    });
  }
  addEventListener('scroll', prewarm, { passive: true });
  /* or, if the reader lingers above, once the page is idle */
  addEventListener('load', function () { setTimeout(function () { (window.requestIdleCallback || setTimeout)(function () { prewarm(true); }); }, 2000); });

  /* ---- the engine ---- */
  var LAMBDA = 9;          /* inertia of free scrolling: the page closes 1 - e^(-9t) of the gap to its target, ~0.4s to settle */
  var GLIDES = { problem: 2600, enter: 1300 }, BACK = 0.8;   /* 16 Nov: problem glide 1350 -> 2600 ("terribly fast") */   /* ms each glide takes, a little quicker on the way back */
  var TOL = 3;             /* px: this close to a stop is on it (the stops move a pixel or two as late fonts and images land) */
  var x = scrollY, v = 0, target = x, mode = 'idle', glide = null, raf = 0, prev = 0, wrote = NaN;
  var gates = function () { return [A, B, G, E]; };
  function zone(y) { return y >= A - 0.75 * vh && y <= E + 0.5 * vh; }
  /* the stretch between two stops that is played as a glide, if y is inside one */
  function glideSpan(y, d) {
    if (Math.abs(y - A) <= TOL) return d > 0 ? [A, B, GLIDES.problem] : null;
    if (Math.abs(y - B) <= TOL) return d < 0 ? [A, B, GLIDES.problem] : [B, G, GLIDES.enter];
    if (Math.abs(y - G) <= TOL) return d < 0 ? [B, G, GLIDES.enter] : null;
    if (y > A && y < B) return [A, B, GLIDES.problem];
    if (y > B && y < G) return [B, G, GLIDES.enter];
    return null;
  }

  function start() { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; mode = 'idle'; v = 0; glide = null; }
  function write(y) {
    y = Math.max(0, Math.min(maxY, y));
    if (y !== wrote) { scrollTo(0, y); wrote = y; }
  }
  function frame(now) {
    raf = 0;
    /* someone else moved the page: let go and start again from where it is */
    if (!isNaN(wrote) && Math.abs(scrollY - wrote) > 2) { x = target = scrollY; stop(); wrote = NaN; return; }
    var dt = Math.min(0.05, Math.max(0.001, (now - prev) / 1000));
    prev = now;
    if (mode === 'glide') {
      /* quintic Hermite from (x0, v0, no push) to (to, at rest, no push), on the clock */
      var g = glide, T = g.ms / 1000, u = Math.min(1, (now - g.t0) / g.ms), u2 = u * u, u3 = u2 * u, u4 = u3 * u, u5 = u4 * u;
      var h0 = 1 - 10 * u3 + 15 * u4 - 6 * u5, h1 = u - 6 * u3 + 8 * u4 - 3 * u5, h5 = 10 * u3 - 15 * u4 + 6 * u5;
      var d0 = -30 * u2 + 60 * u3 - 30 * u4, d1 = 1 - 18 * u2 + 32 * u3 - 15 * u4;
      x = h0 * g.x0 + h1 * g.v0 * T + h5 * g.to;
      v = (d0 * g.x0 + d1 * g.v0 * T + (-d0) * g.to) / T;
      if (u >= 1) { x = target = g.to; v = 0; mode = 'idle'; glide = null; }
    } else if (mode === 'free') {
      var k = 1 - Math.exp(-LAMBDA * dt), nx = x + (target - x) * k;
      v = (nx - x) / dt; x = nx;
      if (Math.abs(target - x) < 0.3) { x = target; v = 0; mode = 'idle'; }
    }
    write(x);
    if (mode !== 'idle') raf = requestAnimationFrame(frame);
  }
  function startGlide(span, d) {
    var to = d > 0 ? span[1] : span[0];
    /* the time scales with the share of the stretch still to go, so a glide picked up part way isn't slow */
    var share = Math.min(1, Math.abs(to - x) / Math.max(1, span[1] - span[0]));
    glide = { to: to, x0: x, v0: mode === 'idle' ? 0 : v, t0: performance.now(), ms: Math.max(380, span[2] * (d < 0 ? BACK : 1) * Math.sqrt(share)), d: d, span: span };
    target = to; mode = 'glide'; start();
  }

  /* A new scroll, as opposed to the rest of one already going: a pause, or (on a trackpad, whose flick fades away)
     the size picking up again */
  var hist = [], lastAt = 0;
  function fresh(size, now) {
    var gap = now - lastAt; lastAt = now;
    if (gap > 180) hist.length = 0;
    hist.push(size); if (hist.length > 12) hist.shift();
    if (hist.length === 1) return true;
    if (hist.length < 6 || size < 6) return false;
    var a = (hist[hist.length - 1] + hist[hist.length - 2] + hist[hist.length - 3]) / 3, b = 0;
    for (var i = hist.length - 8 < 0 ? 0 : hist.length - 8; i < hist.length - 3; i++) b += hist[i];
    b /= Math.max(1, Math.min(5, hist.length - 3));
    if (a > 1.45 * b) { hist = [size]; return true; }
    return false;
  }

  function input(by, isNew) {
    var d = by > 0 ? 1 : -1;
    if (mode === 'glide') {
      /* one glide per scroll; a new scroll the other way turns it round, from wherever it has got to */
      if (isNew && d !== glide.d) startGlide(glide.span, d);
      return;
    }
    var base = mode === 'free' ? target : x;
    /* resting on (or settling onto) a stop: the rest of a scroll stays there, a new one moves on */
    var at = null;
    gates().forEach(function (g) { if (Math.abs(base - g) <= TOL) at = g; });
    if (at !== null && !isNew) return;
    var span = glideSpan(at !== null ? at : x, d);
    if (span) { startGlide(span, d); return; }
    /* free: move the target on, but never past the next stop in the way */
    var next = base + by;
    gates().forEach(function (g) { if (d > 0 ? g > base + TOL && g < next : g < base - TOL && g > next) next = g; });
    target = Math.max(0, Math.min(maxY, next));
    if (mode === 'idle') { x = scrollY; mode = 'free'; }
    start();
  }
  function ours() { return mode !== 'idle' || zone(scrollY); }

  addEventListener('wheel', function (e) {
    var by = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1);
    if (e.ctrlKey || !by || Math.abs(e.deltaX) > Math.abs(by) || !ours()) return;
    if (e.cancelable) e.preventDefault();
    if (mode === 'idle') x = target = scrollY;
    input(by, fresh(Math.abs(by), performance.now()));
  }, { capture: true, passive: false });

  addEventListener('keydown', function (e) {
    var k = e.key, down = k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey), up = k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey);
    if (!(down || up) || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !ours()) return;
    if (e.target.closest && e.target.closest(k === ' ' ? 'a, button, input, select, textarea, [contenteditable], [role="button"]' : 'input, textarea, select, [contenteditable]')) return;
    e.preventDefault();
    if (mode === 'idle') x = target = scrollY;
    input((down ? 1 : -1) * (k.indexOf('Arrow') ? 0.85 * vh : 90), !e.repeat);
  }, true);

  /* Touch (tablets): the page scrolls under the finger as usual; only the two glides are played for it, a swipe each */
  var finger = null;
  addEventListener('touchstart', function (e) { finger = e.touches.length === 1 ? { y: e.touches[0].clientY, spent: false } : null; }, { capture: true, passive: true });
  addEventListener('touchmove', function (e) {
    if (!finger || !e.cancelable) return;
    var by = finger.y - e.touches[0].clientY, d = by > 0 ? 1 : -1, y = mode === 'idle' ? scrollY : x;
    if (mode === 'glide') { e.preventDefault(); if (!finger.spent && Math.abs(by) > 24 && d !== glide.d) { finger.spent = true; startGlide(glide.span, d); } return; }
    if (y < B - TOL || y > G + TOL || !glideSpan(Math.round(y), d) || Math.abs(by) < 6) return;
    e.preventDefault();
    if (!finger.spent && Math.abs(by) > 24) { finger.spent = true; x = target = scrollY; startGlide(glideSpan(Math.round(y), d), d); }
  }, { capture: true, passive: false });
})();

/* 16 Nov (rotation): the desktop scroll engine (the pinned "Why Dreamteam?" stop and its moving cards) is chosen once, at
   load, from the same query as window.DT_ENGINE in the page head. Turning a tablet or resizing a window across 992px
   used to keep the layout chosen at load, so a phone-width view could show the desktop scene with cards over the title.
   When the answer flips, the page reloads into the right layout (the browser keeps the scroll position). */
(function () {
  if (!window.matchMedia) return;
  var mq = matchMedia('(min-width: 992px) and (prefers-reduced-motion: no-preference)'), was = mq.matches, t;
  var check = function () { clearTimeout(t); t = setTimeout(function () { if (mq.matches !== was) location.reload(); }, 250); };
  if (mq.addEventListener) mq.addEventListener('change', check); else if (mq.addListener) mq.addListener(check);
  addEventListener('resize', check); addEventListener('orientationchange', check);
})();
