/* The new homepage (dreamteam-stage /home-new). Built by pages/home/webflow/convert.py; do not edit here.
   homepage-v2.js (Home, 14 Nov perf pass): a copy with the black section's scroll scene and the floating cards tied
   1:1 to the scroll, with nothing measured per frame that can be measured once. Changes are marked "perf pass". */
window.HOME_SVG_URLS = window.HOME_SVG_URLS || {"fan-1":"/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74bc134188219e00919f4_homepage-svg-fan-1.svg","fan-2":"/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74bc17dcfebb7107a6595_homepage-svg-fan-2.svg"};
/* The line fans are too large for an HTML embed, so they load from the site's assets into their placeholders first. */
window.HOME_SVG = Promise.all([...document.querySelectorAll('[data-home-svg]')].map(el => fetch((window.HOME_SVG_URLS || {})[el.dataset.homeSvg] || ('svg/' + el.dataset.homeSvg + '.svg')).then(r => r.text()).then(t => { const box = document.createElement('div'); box.innerHTML = t; const s = box.firstElementChild; if (s) { s.setAttribute('class', el.getAttribute('class')); el.replaceWith(s); } })));
/* The site's header and the hero's fit. The site's Nav component takes the old nav's place. Its announcement bar
   scrolls away and the nav bar sticks under the top of the screen (sticky on this page only, from the global embed;
   the header's top is pulled up by the bar's height). The pinned scenes read the nav bar's height from
   window.DT_NAV_H and --nav-h; the hero fills the first screen under the whole header (--bar-h is the announcement
   bar) and its 720px composition is fitted to that room (--hz-fit). */
(() => {
  const root = document.documentElement, hero = document.getElementById('hero');
  const nav = document.querySelector('[data-home-nav]') || document.querySelector('.nav_component');
  const header = nav && nav.closest('.header_component');
  const bar = header && header.querySelector('.announcement_component');
  let navH = -1, barH = -1;
  function fitHero() {
    if (!hero) return;
    const room = innerHeight - navH - barH - 32;
    const z = Math.max(.66, Math.min(1.15, (innerWidth / 2 - 32) / 656, room / 720));
    hero.style.setProperty('--hz-fit', z.toFixed(3));
  }
  function sizes() {
    const n = nav ? Math.round(nav.getBoundingClientRect().height) : 0;
    const b = bar && getComputedStyle(bar).display !== 'none' ? Math.round(bar.getBoundingClientRect().height) : 0;
    if (n !== navH) root.style.setProperty('--nav-h', n + 'px');
    if (b !== barH) { root.style.setProperty('--bar-h', b + 'px'); if (header) header.style.top = -b + 'px'; }
    navH = n; barH = b;
    window.DT_NAV_H = navH;
    fitHero();
  }
  sizes();
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(sizes); if (nav) ro.observe(nav); if (bar) ro.observe(bar); }
  addEventListener('resize', sizes);
})();
/* Dreamteam homepage scripts. Each block is self-contained and runs once the page has parsed (loaded with defer). */

// Peeks: each placeholder gets a copy of the neighbouring teammate card.
document.querySelectorAll('.tm-peek[data-peek]').forEach(p=>{
  const src=document.querySelector('.homepage-teammates_card[data-card="'+p.dataset.peek+'"]:not(.tm-peek .homepage-teammates_card)');
  if(!src) return; const c=src.cloneNode(true); c.removeAttribute('id');
  c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id')); c.setAttribute('aria-hidden','true'); c.inert=true; p.appendChild(c);
});

/* Shared motion runtime. Values come from the flow motion spec:
   durations 140 / 220 / 380 / 560 ms, camera 900 ms; ease-out to arrive or settle, ease-move to travel.
   Every section loop starts from its finished composition, runs only while it is on screen and the tab is visible,
   and never runs under prefers-reduced-motion. */
window.DTM = (() => {
  const T = { press: 140, fast: 220, med: 380, slow: 560, camera: 900 };
  // Curves from Emil Kowalski's animate skill: a strong ease-out for anything arriving or leaving, a strong
  // ease-in-out for things travelling on screen. Never ease-in on UI.
  const E = { out: 'cubic-bezier(.23,1,.32,1)', move: 'cubic-bezier(.77,0,.175,1)' };

  // A spring with no bounce (critically damped), written as a CSS linear() curve so WAAPI can play it without a
  // library. `d` is the perceived duration in ms (Apple-style); the curve runs 1.2x that to settle fully.
  // Moves decelerate the way a real object does: fast off the mark, then a long soft landing, never overshooting.
  const hasLinear = typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)');
  const springs = {};
  function spring(d) {
    if (!hasLinear) return { easing: E.out, duration: d };
    if (!springs[d]) {
      const w = 2 * Math.PI / (d / 1000), L = 1.2 * d / 1000, pts = [];
      for (let i = 0; i <= 40; i++) { const t = L * i / 40; pts.push((1 - (1 + w * t) * Math.exp(-w * t)).toFixed(4)); }
      pts[40] = '1';
      springs[d] = { easing: `linear(${pts.join(', ')})`, duration: Math.round(L * 1000) };
    }
    return springs[d];
  }

  // Move an element on a spring while fading it on its own, shorter ease-out: opacity lands early, the position
  // keeps settling after. from/to are { opacity?, transform?, filter? }.
  function move(el, from, to, { d = 500, fade = 220, delay = 0 } = {}) {
    const sp = spring(d);
    const pick = (o, keys) => Object.fromEntries(keys.filter(k => k in o).map(k => [k, o[k]]));
    const body = ['transform', 'filter'], tone = ['opacity'];
    const jobs = [];
    if (body.some(k => k in from)) jobs.push(play(el, [pick(from, body), pick(to, body)], sp.duration, sp.easing, delay));
    if (tone.some(k => k in from)) jobs.push(play(el, [pick(from, tone), pick(to, tone)], fade, E.out, delay));
    return Promise.all(jobs);
  }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Never animate transform on an element whose layout uses a transform (e.g. translateX(-50%) centring):
  // the end state is written to its style and replaces it. Centre those with left/top instead.
  // Animate one element (or a list) and resolve when done. The end state is written to the element's style,
  // so finished animations don't pile up across loops.
  function play(el, frames, dur = T.med, ease = E.out, delay = 0) {
    const list = el instanceof Element ? [el] : [...el];
    return Promise.all(list.map(n => {
      const a = n.animate(frames, { duration: dur, easing: ease, delay, fill: 'both' });
      return a.finished.then(() => { try { a.commitStyles(); } catch (e) {} a.cancel(); }, () => {});
    }));
  }
  // Set styles instantly (for resets while a layer is out of sight).
  const set = (el, styles) => (el instanceof Element ? [el] : [...el]).forEach(n => Object.assign(n.style, styles));

  // A loop that pauses while its section is off screen or the tab is hidden.
  function loop(section, body) {
    if (reduced || !section) return;
    let visible = false, wake = null;
    const ready = () => visible && !document.hidden;
    const gate = () => ready() ? Promise.resolve() : new Promise(r => (wake = r));
    const check = () => { if (ready() && wake) { const w = wake; wake = null; w(); } };
    new IntersectionObserver(es => { visible = es[0].isIntersecting; check(); }, { threshold: 0.15 }).observe(section);
    document.addEventListener('visibilitychange', check);
    // wait(ms): a pause that also holds while the section is out of view
    const wait = async ms => { await gate(); await new Promise(r => setTimeout(r, ms)); await gate(); };
    (async () => { await gate(); for (;;) await body(wait); })();
  }

  // Wrap every word of the given paragraphs in a span, for streamed text.
  function words(paras) {
    const out = [];
    paras.forEach(p => {
      const parts = p.textContent.split(/(\s+)/);
      p.textContent = '';
      parts.forEach(t => {
        if (!t) return;
        if (/^\s+$/.test(t)) { p.appendChild(document.createTextNode(t)); return; }
        const s = document.createElement('span'); s.className = 'homepage_dtm-w'; s.textContent = t; p.appendChild(s); out.push(s);
      });
    });
    return out;
  }

  return { T, E, play, set, move, spring, loop, words, reduced };
})();

/* Customers banner + rail. The rail runs on CSS (two copies, a seamless loop) and pauses while pointed at. Hovering
   or focusing a logo lifts every copy of it; a customer with a quote hands it to the banner, which blurs across. The
   banner steps through the quotes every 6s while the section is in view, 6s after the last hover. */
(() => {
  const s = document.getElementById('customers');
  if (!s) return;
  const reduced = window.DTM && window.DTM.reduced;
  const qs = [...s.querySelectorAll('.homepage-customers_q')], order = qs.map(q => q.dataset.k);
  const tiles = [...s.querySelectorAll('.homepage-customers_tile')];
  let idx = 0, timer = null;
  const mark = k => tiles.forEach(t => t.classList.toggle('homepage_hot', t.dataset.k === k));
  function show(k) {
    const next = order.indexOf(k);
    if (next < 0 || next === idx) return;
    const cur = qs[idx];
    cur.classList.remove('homepage_on'); cur.classList.add('homepage_out'); cur.setAttribute('aria-hidden', 'true');
    setTimeout(() => cur.classList.remove('homepage_out'), 600);
    idx = next; qs[idx].classList.add('homepage_on'); qs[idx].removeAttribute('aria-hidden');
  }
  const stop = () => { clearTimeout(timer); timer = null; };
  const play = () => { stop(); if (reduced) return; timer = setTimeout(function tick() { show(order[(idx + 1) % order.length]); timer = setTimeout(tick, 6000); }, 6000); };
  tiles.forEach(t => {
    const on = () => { mark(t.dataset.k); if (order.includes(t.dataset.k)) { stop(); show(t.dataset.k); } };
    const off = () => { mark(null); play(); };
    t.addEventListener('pointerenter', on); t.addEventListener('pointerleave', off);
    t.addEventListener('focus', on); t.addEventListener('blur', off);
  });
  new IntersectionObserver(es => { es[0].isIntersecting ? play() : stop(); }, { threshold: .3 }).observe(s);
})();

/* "Your deals are built everywhere except the CRM." (Figma 276:15915): the clutter drops onto the table one piece at a
   time as the section comes into view, alternating sides, then the tools in it carry on working by themselves:
   the rep starts the CRM's next step and deletes it, the call counts down, the recording plays, a check runs down the
   duplicate contacts, the cell selection wanders between the numbers nobody trusts, the sticky note's deadline gets
   circled again, and the Gmail and Calendar icons keep nagging. Ported from the team's Webflow staging site
   (dreamteam-stage.webflow.io, "Dreamteam problem section"), onto our Figma build.
   Ours: the pieces land on a no-bounce spring (theirs overshoot; Sree, 2026-11-03: "No bounce please"). The drop
   moves each piece's card (the child of .tk-fl), because the scroll transition (03-problem-memory) moves .tk-fl.
   Every piece sits in its designed state by default; nothing plays under reduced motion or while off screen. */
(() => {
  const s = document.getElementById('tasks');
  if (!s || !window.DTM || window.DTM.reduced || !Element.prototype.animate) return;
  const { spring, E } = window.DTM;
  const q = c => s.querySelector(c);
  const qa = c => [...s.querySelectorAll(c)];

  // drop order alternates the two sides so the table fills from both ends
  const ORDER = ['envelope', 'sticky-note', 'contacts-card', 'recording-card', 'crm-card', 'sheet-card', 'app-gmail',
    'chat-bubble', 'meeting-card', 'person-card', 'app-calendar', 'app-slack', 'app-zoom', 'app-docs'];
  const STAGGER = 120, DROP = 720;
  const pieces = ORDER.map(k => q(`[data-layer="${k}"]`)).filter(Boolean);

  // a fixed, uneven toss per piece so the pile lands the same way every visit
  const toss = i => { const a = Math.sin(i * 12.9898 + 1.7) * 43758.5453, b = Math.sin(i * 78.233 + .3) * 12345.678;
    return { rot: (a - Math.floor(a) - .5) * 22, dx: (b - Math.floor(b) - .5) * 48 }; };

  let visible = false, armed = false, fired = false, pulled = false;
  const loops = [];
  const between = (a, b) => a + Math.random() * (b - a);
  // timers that only move the story on while the section is on screen
  const later = (fn, ms) => setTimeout(() => (visible && !pulled ? fn() : later(fn, 500)), ms);
  s.addEventListener('tk-pull', e => { pulled = e.detail; loops.forEach(a => (visible && !pulled ? a.play() : a.pause())); });
  const loop = (el, frames, opts) => { const a = el.animate(frames, opts); if (!visible) a.pause(); loops.push(a); return a; };

  // lift the pieces off the table just before the section scrolls in, so they can fall into place
  function arm() {
    if (armed) return; armed = true;
    const sp = spring(DROP);
    pieces.forEach((el, i) => {
      const t = toss(i);
      el._drop = el.animate([
        { translate: `${t.dx.toFixed(1)}px -42px`, rotate: `${t.rot.toFixed(1)}deg`, scale: '1.2', opacity: 0 },
        { translate: '0 0', rotate: '0deg', scale: '1', opacity: 1 },
      ], { duration: sp.duration, easing: sp.easing, delay: i * STAGGER, fill: 'backwards' });
      el._drop.pause();
    });
  }
  function fire() {
    if (fired) return; arm(); fired = true;
    pieces.forEach(el => el._drop.play());
    later(startLive, pieces.length * STAGGER + DROP);
  }

  /* Gmail and Calendar nag: a short shake, now and then. `rotate`, so their designed tilt (a transform) stays */
  function nag(el, deg, every, dur, onNag) {
    later(function go() {
      el.animate(deg.map(d => ({ rotate: d + 'deg' })), { duration: dur, easing: 'ease-in-out' });
      if (onNag) onNag();
      later(go, between(...every));
    }, between(...every));
  }
  function nags() {
    const badge = q('.homepage-tasks_badge'), count = q('.homepage-tasks_badge span');
    let unread = parseInt(count.textContent, 10) || 8;
    nag(q('.homepage-tasks_gmail'), [0, -9, 8, -6, 4, 0], [2200, 3200], 620, () => {
      unread += 1 + Math.floor(Math.random() * 2);
      count.textContent = unread > 99 ? '99+' : String(unread);
      badge.animate([{ scale: '1.3' }, { scale: '1' }], { duration: 360, easing: E.out });
    });
    nag(q('.homepage-tasks_gcal'), [0, 13, -11, 9, -6, 3, 0], [2600, 3800], 760);
  }

  /* CRM: the rep starts logging a next step, thinks better of it and deletes it again */
  function crm() {
    const dd = q('.homepage-tasks_crm .homepage-tasks_caret').parentElement, caret = q('.homepage-tasks_crm .homepage-tasks_caret'), hint = q('.homepage-tasks_crm .homepage-tasks_ph');
    const STEPS = ['Send pricing', 'Call Jo re net-60', 'Follow up Fri'];
    const typed = document.createElement('span');
    dd.insertBefore(typed, caret);
    const follow = () => { caret.style.left = (2.66 + typed.offsetWidth) + 'px'; };
    let blink = null, n = 0;
    const idle = () => { blink = loop(caret, [{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .5 }, { opacity: 0 }], { duration: 1060, iterations: Infinity }); };
    const busy = () => { if (blink) { blink.cancel(); loops.splice(loops.indexOf(blink), 1); blink = null; } };
    function type(word, i) {
      if (i === 0) { busy(); hint.style.visibility = 'hidden'; }
      typed.textContent = word.slice(0, i + 1); follow();
      if (i + 1 < word.length) later(() => type(word, i + 1), between(70, 150));
      else { idle(); later(() => erase(word.length), between(1600, 2400)); }
    }
    function erase(i) {
      if (i === STEPS[n].length) busy();
      typed.textContent = typed.textContent.slice(0, i - 1); follow();
      if (i > 1) later(() => erase(i - 1), 38);
      else { hint.style.visibility = ''; idle(); n = (n + 1) % STEPS.length; later(() => type(STEPS[n], 0), between(1800, 2800)); }
    }
    idle(); later(() => type(STEPS[n], 0), 900);
  }

  /* Meeting: the call keeps getting closer */
  function countdown() {
    const el = q('.homepage-tasks_meet .homepage-tasks_t-tag'), first = el.textContent, m = /(\d+):(\d{2})/.exec(first);
    if (!m) return;
    const start = +m[1] * 60 + +m[2]; let left = start;
    later(function tick() {
      left = left > 0 ? left - 1 : start;
      el.textContent = first.replace(/\d+:\d{2}/, Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2));
      later(tick, 1000);
    }, 1000);
  }

  /* Zoom recording: it plays on, the part still to come stays faint under a veil, with a playhead at the edge */
  function recording() {
    const wave = q('.homepage-tasks_wave'), card = wave.parentElement;
    const box = document.createElement('div');
    box.setAttribute('aria-hidden', 'true');
    box.style.cssText = `position:absolute;left:${wave.offsetLeft}px;top:${wave.offsetTop}px;width:${wave.offsetWidth}px;height:${wave.offsetHeight}px;pointer-events:none`;
    box.innerHTML = '<i style="position:absolute;inset:0;background:var(--dt-white);opacity:.6;transform-origin:100% 50%"></i>'
      + '<i style="position:absolute;left:0;top:-4px;bottom:-4px;width:100%"><b style="position:absolute;left:0;top:0;bottom:0;width:2px;margin-left:-1px;border-radius:1px;background:var(--dt-ink)"></b></i>';
    card.appendChild(box);
    const [veil, head] = box.children, PLAY = 14000, from = .38, opts = { duration: PLAY, iterations: Infinity, easing: 'linear' };
    loop(veil, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], opts).currentTime = from * PLAY;
    loop(head, [{ transform: 'translateX(0%)', opacity: 0 }, { opacity: 1, offset: .015 }, { opacity: 1, offset: .985 }, { transform: 'translateX(100%)', opacity: 0 }], opts).currentTime = from * PLAY;
  }

  /* Contacts: a check runs down the list and flags each of the three duplicates in turn */
  function contacts() {
    const rows = qa('.homepage-tasks_contacts .homepage-tasks_row'), list = rows[0].parentElement;
    const flag = document.createElement('i');
    flag.setAttribute('aria-hidden', 'true');
    flag.style.cssText = `position:absolute;left:${rows[0].offsetLeft}px;top:${rows[0].offsetTop}px;width:${rows[0].offsetWidth}px;height:${rows[0].offsetHeight}px;border-radius:8.335px;box-shadow:inset 0 0 0 1.2px var(--tk-alert-line);pointer-events:none;opacity:0`;
    list.style.position = 'relative'; list.appendChild(flag);
    const step = rows[1].offsetTop - rows[0].offsetTop, ease = 'cubic-bezier(.3,0,.2,1)';
    const at = (y, o, offset) => ({ transform: `translateY(${y}px)`, opacity: o, offset, easing: ease });
    loop(flag, [at(0, 0, 0), at(0, 1, .05), at(0, 1, .2), at(step, 1, .27), at(step, 1, .42), at(2 * step, 1, .49), at(2 * step, 1, .66), at(2 * step, 0, .72), at(2 * step, 0, 1)],
      { duration: 7200, iterations: Infinity, delay: 400 });
  }

  /* Spreadsheet: the selection wanders between the cells nobody trusts */
  function sheet() {
    const cells = qa('.homepage-tasks_sheet .homepage-tasks_cell'), table = cells[0].parentElement;
    const pick = [cells[1], cells[2], cells[4], cells[5]];
    const sel = document.createElement('i');
    sel.setAttribute('aria-hidden', 'true');
    sel.style.cssText = 'position:absolute;box-shadow:inset 0 0 0 2px var(--dt-ink);pointer-events:none';
    table.appendChild(sel);
    const box = c => ({ left: c.offsetLeft + 'px', top: c.offsetTop + 'px', width: c.offsetWidth + 'px', height: c.offsetHeight + 'px' });
    let at = 0; Object.assign(sel.style, box(pick[at]));
    later(function hop() {
      const next = (at + 1 + Math.floor(Math.random() * (pick.length - 1))) % pick.length, b = box(pick[next]);
      sel.animate([box(pick[at]), b], { duration: 200, easing: E.out });
      Object.assign(sel.style, b); at = next;
      later(hop, between(1300, 2600));
    }, 1200);
  }

  /* Sticky note: the deadline gets circled again, a little harder each time */
  function sticky() {
    const p = q('.homepage-tasks_sticky p'), word = 'FRI!!', i = p.textContent.indexOf(word);
    if (i < 0) return;
    const range = document.createRange(), text = p.firstChild;
    range.setStart(text, i); range.setEnd(text, i + word.length);
    const span = document.createElement('span'); range.surroundContents(span);
    const note = q('.homepage-tasks_sticky'), w = span.offsetWidth + 18, h = span.offsetHeight + 6;
    const svgNS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = `position:absolute;left:${p.offsetLeft + span.offsetLeft - 9}px;top:${p.offsetTop + span.offsetTop - 3}px;width:${w}px;height:${h}px;overflow:visible;pointer-events:none`;
    // a hand-drawn loop: once round the word, overlapping where it started
    const rx = w / 2, ry = h / 2;
    const d = `M${rx * 1.7} ${ry * .25} C${rx * 1.1} ${-ry * .2} ${rx * .1} ${ry * .1} ${rx * .08} ${ry * 1.05} C${rx * .05} ${ry * 1.95} ${rx * 1.9} ${ry * 2.05} ${rx * 1.96} ${ry * .95} C${rx * 2} ${ry * .3} ${rx * 1.3} ${ry * .05} ${rx * .9} ${ry * .2}`;
    const pen = document.createElementNS(svgNS, 'path');
    pen.setAttribute('d', d); pen.setAttribute('pathLength', '1'); pen.setAttribute('fill', 'none');
    pen.setAttribute('stroke', 'currentColor'); pen.setAttribute('stroke-width', '2.4'); pen.setAttribute('stroke-linecap', 'round');
    pen.style.cssText = 'stroke-dasharray:1.05 1.05;stroke-dashoffset:1.05';
    svg.style.color = getComputedStyle(p).color;   // the note's own ink
    svg.appendChild(pen); note.appendChild(svg);
    later(function redraw() {
      pen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: E.out, fill: 'forwards' }).finished.then(() => later(() => {
        pen.getAnimations().forEach(a => a.cancel());
        pen.animate([{ strokeDashoffset: 1.05, opacity: 1 }, { strokeDashoffset: 0, opacity: 1 }], { duration: 760, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' })
          .finished.then(() => later(redraw, between(3600, 5200)), () => {});
      }, 500), () => {});
    }, 2400);
  }

  function startLive() { [nags, crm, countdown, recording, contacts, sheet, sticky].forEach(f => { try { f(); } catch (e) {} }); }

  new IntersectionObserver(es => { if (es[es.length - 1].isIntersecting) arm(); }, { rootMargin: '0px 0px 40% 0px' }).observe(s);
  new IntersectionObserver(es => {
    visible = es[es.length - 1].isIntersecting;
    loops.forEach(a => (visible && !pulled ? a.play() : a.pause()));
    if (visible) fire();
  }, { rootMargin: '0px 0px -20% 0px' }).observe(s);
})();

/* Tasks -> "Introducing Dreamteam" (Figma 276:15915, then Sree's 1134:25078, 2026-11-11), one pinned scroll.
   Ported from the team's Webflow staging site ("Dreamteam problem to memory transition") onto our sections:
   1. The tasks section pins while its clutter is pulled into one point, shrinking and losing focus, and its copy
      blurs away. As the Dreamteam mark grows out of that point the page dims to the dark of the section below, in
      one short fade that runs on its own once started.
   2. The threads draw in from both edges until they meet the mark, and "Introducing Dreamteam" settles in above it.
   3. It holds a moment, then lets go: the section scrolls on, and the rep on her call and the five cards come in
      (motion/03c-salescall). The old rise into the teammates frame went with that frame.
   Everything follows the scroll position, so it plays both ways, except the threads: they play out in one go once the
   scroll reaches them (playFans). It runs from 1100px wide, where the section keeps its
   Figma layout; narrower, with reduced motion, or without the script, the sections simply follow each other. */
(() => {
  const tasks = document.getElementById('tasks');
  const over = document.getElementById('product-overview');
  if (!tasks || !over || !window.DTM || window.DTM.reduced || !CSS.supports('translate', '1px')) return;
  const wide = matchMedia('(min-width:1100px)');
  if (!wide.matches) return;

  // scroll distance of each stretch, in viewport heights: the pull and the mark, then a short hold on the heading
  const PIN = 2.8, HOLD = .5;
  const MARK_AT = .47, BRIGHTEN = .46, CLEAR = .5, FADE = 500, CURVE = 'cubic-bezier(.4,0,.2,1)';
  const ORDER = ['app-docs', 'app-zoom', 'app-slack', 'app-calendar', 'person-card', 'meeting-card', 'chat-bubble', 'app-gmail',
    'sheet-card', 'crm-card', 'recording-card', 'contacts-card', 'sticky-note', 'envelope'];

  const clamp = x => (x < 0 ? 0 : x > 1 ? 1 : x);
  const span = (p, a, b) => clamp((p - a) / (b - a));
  const inOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2);
  const out = t => 1 - Math.pow(1 - t, 3);

  const wrap = el => { const w = document.createElement('div'), sp = document.createElement('div');
    sp.setAttribute('aria-hidden', 'true'); el.before(w); w.append(el, sp); return { w, sp }; };
  const W1 = wrap(tasks), W2 = wrap(over);
  let W1top = 0;   // perf pass: the wrapper's place on the page, measured once and again when the layout changes

  const iris = document.createElement('div');
  iris.className = 'homepage-tasks_iris';
  iris.setAttribute('aria-hidden', 'true');
  iris.style.cssText = 'position:absolute;left:0;right:0;opacity:0;visibility:hidden;pointer-events:none';
  tasks.prepend(iris);
  const content = tasks.querySelector('.homepage-tasks_copy'), grid = tasks.querySelector('.homepage-tasks_grid');
  const fades = [...tasks.querySelectorAll('.homepage-tasks_fade')];
  const pieces = [...tasks.querySelectorAll('.homepage-tasks_fl')].map((el, i) => {
    const k = (el.firstElementChild && el.firstElementChild.dataset.layer) || '';
    const rank = ORDER.indexOf(k) < 0 ? ORDER.length : ORDER.indexOf(k), a = Math.sin(i * 41.7 + 3.1) * 9999.1;
    return { el, start: .03 + rank * .012, spin: (a - Math.floor(a) - .5) * 40 };
  });

  const promote = on => {
    pieces.forEach(pc => { pc.el.style.willChange = on ? 'translate, scale, rotate, filter, opacity' : ''; });
    content.style.willChange = on ? 'filter, opacity, scale' : '';
    [grid, ...fades].forEach(el => { el.style.willChange = on ? 'opacity' : ''; });
  };
  new IntersectionObserver(es => promote(es[es.length - 1].isIntersecting), { rootMargin: '50% 0px 50% 0px' }).observe(W1.w);

  const logo = over.querySelector('.homepage-memory_logo');
  const fans = [...over.querySelectorAll('.homepage-memory_fan')], arrival = over.querySelector('.homepage-salescall_head') || over.querySelector('.homepage-memory_copy');

  let vh, H, T, D, E, hold, dark, last = NaN;
  const rel = (el, box) => { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, top: r.top - b.top, bottom: r.bottom - b.top, h: r.height }; };

  function measure() {
    pieces.forEach(pc => { const s = pc.el.style; s.translate = s.scale = s.rotate = s.filter = s.opacity = ''; });
    [logo, arrival].forEach(el => { el.style.translate = el.style.scale = el.style.filter = ''; });
    vh = innerHeight;
    const top0 = (window.DT_NAV_H || 0);
    H = tasks.offsetHeight; T = top0 + (vh - top0 - H) / 2;
    D = PIN * vh; E = HOLD * vh;
    // the section is held so its mark sits mid-screen, but never so high that its heading leaves the top
    const lg = rel(logo, over), head = rel(arrival, over);
    hold = Math.max(top0 + (vh - top0) / 2 - lg.y, top0 + 24 - head.top);
    tasks.style.position = over.style.position = 'sticky';
    tasks.style.top = T + 'px'; over.style.top = hold + 'px';
    W1.sp.style.height = W2.sp.style.height = D + E + 'px';
    W2.w.style.marginTop = -(T + H + D + E - hold) + 'px';
    tasks.style.overflowX = 'clip'; tasks.style.overflowY = 'visible';
    over.style.overflowX = 'clip'; over.style.overflowY = 'visible';
    const ih = Math.max(H, vh) + 2;
    iris.style.height = ih + 'px'; iris.style.top = (H - ih) / 2 + 'px';
    over.style.backgroundColor = '';
    dark = getComputedStyle(over).backgroundColor;
    const ox = rel(logo, over).x + over.getBoundingClientRect().left;
    const fy = hold + lg.y;
    const tr = tasks.getBoundingClientRect();
    pieces.forEach(pc => {
      const r = pc.el.getBoundingClientRect(), m = getComputedStyle(pc.el.parentElement).transform;
      const k = m && m !== 'none' ? new DOMMatrix(m).a : 1;
      pc.dx = (ox - (r.left + r.width / 2)) / k;
      pc.dy = (fy - (r.top - tr.top + T + r.height / 2)) / k;
    });
    W1top = W1.w.getBoundingClientRect().top + scrollY;
    last = NaN;
  }

  let dimmed = null, darkAt = Infinity, lastP = null;
  function shade(p) {
    const on = dimmed ? p > BRIGHTEN : p >= MARK_AT, moved = lastP === null ? 0 : p - lastP;
    lastP = p;
    if (on === dimmed || (dimmed !== null && (on ? moved < 0 : moved > 0))) return;
    const fade = dimmed !== null;
    dimmed = on;
    darkAt = on ? performance.now() + (fade ? FADE : 0) : Infinity;
    iris.style.transition = fade ? `opacity ${FADE}ms ${CURVE}` : 'none';
    iris.style.visibility = 'visible';
    iris.style.backgroundColor = dark;
    iris.style.opacity = on ? '1' : '0';
    if (on && fade) setTimeout(() => { last = NaN; queue(); }, FADE + 20);
    dispatchEvent(new Event('dt-theme'));
  }

  let pullIdle = true;
  function renderTasks(p) {
    const idle = p <= 0;
    if (idle !== pullIdle) { pullIdle = idle; tasks.dispatchEvent(new CustomEvent('tk-pull', { detail: !idle })); }
    pieces.forEach(pc => {
      const s = pc.el.style;
      if (idle) { s.translate = s.scale = s.rotate = s.filter = s.opacity = ''; return; }
      const t = inOut(span(p, pc.start, pc.start + .22)), k = .94 * t;
      s.translate = `${(pc.dx * k).toFixed(1)}px ${(pc.dy * k).toFixed(1)}px`;
      s.scale = (1 - .5 * t).toFixed(3);
      s.rotate = (pc.spin * t).toFixed(2) + 'deg';
      s.filter = `blur(${(16 * t).toFixed(2)}px)`;
      s.opacity = ((1 - .3 * t) * (1 - span(p, .32, .46))).toFixed(3);
    });
    const c = inOut(span(p, .08, .34)), g = span(p, .03, .3);
    content.style.filter = idle ? '' : `blur(${(14 * c).toFixed(2)}px)`;
    content.style.opacity = idle ? '' : (1 - c).toFixed(3);
    content.style.scale = idle ? '' : (1 - .06 * c).toFixed(3);
    grid.style.opacity = idle ? '' : (.5 * (1 - g)).toFixed(3);
    fades.forEach(f => { f.style.opacity = idle ? '' : (1 - span(p, .03, .17)).toFixed(3); });
    shade(p);
  }

  /* The threads open out of the mark as in the reference recording (Sree, 2026-11-13). First a nearly flat bundle
     shoots out of the logo, each line at its own pace (the centre lines lead and the rest follow a little apart, so the
     tips stay ragged), and as the lines run the whole fan opens up and down into its shape, slowly at first and then
     quickly. Each line's own curve is cut back to the part between the mark and its tip and squashed toward the mark's
     height, so it stays one crisp stroke at every step. The streaks of light join once the threads are whole. Both fans
     are drawn with the mark at their right edge (the right one is mirrored). */
  let fanSet = null;
  const hash = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  const fanLines = () => fans.map(fan => {
    const svg = fan.querySelector('svg.homepage-memory_fan-art');
    if (!svg) return null;
    const ls = [...svg.querySelectorAll('path')].map((path, i) => {
      const d = path.getAttribute('d'), n = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number), pts = [];
      for (let j = 0; j + 1 < n.length; j += 2) pts.push([n[j], n[j + 1]]);
      if (pts.length < 2) return null;
      if (pts[0][0] > pts[pts.length - 1][0]) pts.reverse();   // the outer end first, the mark last
      return { path, d, pts, cubic: /C/.test(d) && pts.length === 4, i, last: null };
    }).filter(Boolean);
    if (!ls.length) return null;
    const ends = ls.map(l => l.pts[l.pts.length - 1][1]).sort((a, b) => a - b), yc = ends[ends.length >> 1];
    const far = Math.max(...ls.map(l => Math.abs(l.pts[0][1] - yc))) || 1;
    ls.forEach(l => {
      const c = Math.abs(l.pts[0][1] - yc) / far;   // 0 for the centre line, 1 for the top and bottom ones
      l.delay = .1 * c + .36 * hash(l.i, 1);
      l.span = .28 + .24 * hash(l.i, 2);
    });
    return { ls, yc, streaks: fan.querySelector('.homepage-memory_fan-streaks') };
  }).filter(Boolean);
  /* the part of a line from x = X to the mark, squashed by s toward the mark's height yc */
  function cut(l, X, s, yc) {
    const q = l.pts, Y = y => (yc + (y - yc) * s).toFixed(2), P = pt => pt[0].toFixed(2) + ' ' + Y(pt[1]);
    if (l.cubic) {
      const [p0, p1, p2, p3] = q;
      const bx = t => { const u = 1 - t; return u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0]; };
      let lo = 0, hi = 1;
      if (X > p0[0]) for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (bx(m) < X) lo = m; else hi = m; }
      const t = X > p0[0] ? (lo + hi) / 2 : 0, L = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      const a12 = L(p1, p2), a23 = L(p2, p3), b = L(L(p0, p1), a12), c = L(a12, a23), e = L(b, c);
      return 'M' + P(e) + 'C' + P(c) + ' ' + P(a23) + ' ' + P(p3);
    }
    let j = 1;
    while (j < q.length - 1 && q[j][0] <= X) j++;
    const a = q[j - 1], b = q[j], t = X <= a[0] ? 0 : Math.min(1, (X - a[0]) / ((b[0] - a[0]) || 1));
    return 'M' + P([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) + q.slice(j).map(pt => 'L' + P(pt)).join('');
  }
  function drawFans(f) {
    if (!fanSet || !fanSet.length) fanSet = fanLines();   // the drawings load after the page (see the loader)
    // the bundle shoots out a fifth open, then opens the rest of the way while the slower lines are still running
    const sp = clamp((f - .22) / .73), s = .18 + .82 * sp * sp * sp * (sp * (sp * 6 - 15) + 10);
    fanSet.forEach(({ ls, yc, streaks }) => {
      ls.forEach(l => {
        const r = clamp((f - l.delay) / l.span), g = 1 - (1 - r) * (1 - r), x0 = l.pts[0][0], x1 = l.pts[l.pts.length - 1][0];
        const d = f >= 1 ? l.d : g <= .002 ? '' : cut(l, x1 - g * (x1 - x0), s, yc);
        if (d === l.last) return;
        l.last = d;
        l.path.setAttribute('d', d);
      });
      if (streaks) streaks.style.opacity = f >= 1 ? '' : '0';
    });
  }
  /* The threads play out in one go (Sree, 2026-11-13): once the mark is nearly whole, a scroll past FAN_AT runs the whole
     fan out over FAN_MS on its own, without stopping part-way however the scroll goes, and a scroll back above FAN_BACK
     runs it back. The rest of the scene still follows the scroll. */
  const FAN_AT = .55, FAN_BACK = .53, FAN_MS = 900, FAN_BACK_MS = 600;
  let fanGoal = 0, fanShown = NaN, fanT = 0, fanQueued = false;
  function fanStep(now) {
    fanQueued = false;
    const dt = Math.min(34, Math.max(0, now - fanT));
    fanT = now;
    fanShown = fanGoal > fanShown ? Math.min(1, fanShown + dt / FAN_MS) : Math.max(0, fanShown - dt / FAN_BACK_MS);
    drawFans(fanShown);
    if (fanShown !== fanGoal) { fanQueued = true; requestAnimationFrame(fanStep); }
  }
  function playFans(p) {
    if (p >= FAN_AT) fanGoal = 1; else if (p < FAN_BACK) fanGoal = 0;
    // on the first look, or while the mark is not yet showing (the scene is hidden), they are simply where they belong
    if (Number.isNaN(fanShown) || p < MARK_AT) { fanShown = fanGoal; drawFans(fanShown); return; }
    if (fanShown !== fanGoal && !fanQueued) { fanQueued = true; fanT = performance.now(); requestAnimationFrame(fanStep); }
  }

  function renderMemory(p) {
    const shown = p >= MARK_AT;
    over.style.visibility = shown ? '' : 'hidden';
    over.style.backgroundColor = p < CLEAR || performance.now() < darkAt ? 'transparent' : '';
    const l = out(span(p, MARK_AT, .6)), a = out(span(p, .68, .9));
    logo.style.opacity = Math.min(1, l * 2).toFixed(3);
    logo.style.scale = (.3 + .7 * l).toFixed(3);
    logo.style.filter = l >= 1 ? '' : `blur(${(10 * (1 - l)).toFixed(2)}px)`;
    playFans(p);
    arrival.style.opacity = a.toFixed(3);
    arrival.style.translate = `0 ${(1.5 * (1 - a)).toFixed(3)}rem`;
    arrival.style.filter = a >= 1 ? '' : `blur(${(8 * (1 - a)).toFixed(2)}px)`;
  }

  let queued = false, shown = NaN, tPrev = 0;
  function update(now) {
    queued = false;
    now = now || performance.now();
    // perf pass: the scene follows the scroll 1:1 (no easing tail), from the scroll and the wrapper's measured top
    const target = clamp((T - (W1top - scrollY)) / D);
    shown = target;
    tPrev = now;
    if (shown === last) return;
    last = shown;
    renderTasks(shown); renderMemory(shown);
  }

  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function refit() { requestAnimationFrame(() => { measure(); queue(); }); }

  measure(); update();
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', refit);
  // perf pass: content above that changes height (images, fonts) moves the wrapper; read its place again then
  if ('ResizeObserver' in window) new ResizeObserver(() => { W1top = W1.w.getBoundingClientRect().top + scrollY; queue(); }).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  addEventListener('load', refit);
  wide.addEventListener('change', () => location.reload());
})();

/* "Dreamteam remembers all of it" and the teammates (Figma 276:16184, 276:16508): the short tails of light drawn on
   the threads run along them and slip into the Dreamteam mark, each on its own timing, then set off again from
   further out. After the team's Webflow staging site ("Dreamteam memory threads"); ours moves the Figma streaks
   themselves. They start where the design places them, and only run while their section is on screen; with reduced
   motion they stay where the design places them. */
(() => {
  if (!window.DTM || window.DTM.reduced || !Element.prototype.animate) return;
  ['product-overview', 'teammates'].forEach(id => {
    const s = document.getElementById(id);
    if (!s) return;
    const logo = s.querySelector('.homepage-memory_logo'), runs = [];
    const start = () => {
      const lr = logo.getBoundingClientRect(), cx = lr.left + lr.width / 2, cy = lr.top + lr.height / 2;
      s.querySelectorAll('.homepage-memory_fan-streaks [data-layer="streak"]').forEach((path, i) => {
        const ctm = path.getScreenCTM();
        if (!ctm) return;
        // the mark, in this streak's own drawing units, so the mirrored right side runs the right way too
        const m = new DOMPoint(cx, cy).matrixTransform(ctm.inverse());
        const L = path.getTotalLength(), a = path.getPointAtLength(0), b = path.getPointAtLength(L);
        const [far, near] = Math.hypot(a.x - m.x, a.y - m.y) > Math.hypot(b.x - m.x, b.y - m.y) ? [a, b] : [b, a];
        const len = Math.hypot(near.x - far.x, near.y - far.y) || 1, ux = (near.x - far.x) / len, uy = (near.y - far.y) / len;
        const reach = Math.min(240, Math.hypot(m.x - near.x, m.y - near.y) * .8);   // stop short of the mark itself
        const back = 70, h = (i * 0.618) % 1;
        const anim = path.animate([
          { transform: `translate(${(-ux * back).toFixed(1)}px, ${(-uy * back).toFixed(1)}px)`, opacity: 0 },
          { opacity: 1, offset: .2 },
          { opacity: 1, offset: .7 },
          { transform: `translate(${(ux * reach).toFixed(1)}px, ${(uy * reach).toFixed(1)}px)`, opacity: 0 },
        ], { duration: 2600 + h * 1600, iterations: Infinity, easing: 'cubic-bezier(.45,0,.75,1)', delay: -h * 2600 });
        runs.push(anim);
      });
    };
    let begun = false;
    new IntersectionObserver(es => {
      const on = es[es.length - 1].isIntersecting;
      if (on && !begun) { begun = true; start(); }
      runs.forEach(a => (on ? a.play() : a.pause()));
    }).observe(s);
  });
})();

/* Teammates (Figma "Teammates · concept", As built 578:868; Sree, 2026-11-05): one panel pinned while the reader scrolls.
   The runway is one stretch of scroll per teammate, so scrolling always steps Rachel -> Sally -> Raj -> Alex in order
   and the section holds until all four have been shown, both ways. A tab (click, or arrow keys on the tab row) jumps
   to its teammate by scrolling to its stretch; while that scroll runs, the chosen teammate stays on show. The panel on
   show is marked .is-current, which starts its screen's flow (motion/05). Narrower than 1024px, or with reduced
   motion, nothing pins and the tabs simply switch the panel. */
(() => {
  const s = document.getElementById('teammate-cards');
  if (!s || !s.classList.contains('section_homepage-teammates')) return;
  const tabs = [...s.querySelectorAll('.homepage-teammates_tab')], texts = [...s.querySelectorAll('.homepage-teammates_text')], panels = [...s.querySelectorAll('.homepage-teammates_panel')];
  const runway = s.querySelector('.homepage-teammates_runway'), N = panels.length;
  const wide = matchMedia('(min-width:1024px)');
  const reduced = window.DTM && window.DTM.reduced;
  const pinned = () => wide.matches && !reduced;
  if (reduced) s.classList.add('homepage-teammates_static');
  let cur = -1, hold = null, holdTimer = 0, pos = -1, lockUntil = 0;
  const HOLD = 700;   // ms each teammate holds before the next scroll can move on

  function show(i) {
    if (i === cur) return;
    cur = i;
    tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    texts.forEach((t, k) => t.classList.toggle('is-on', k === i));
    panels.forEach((p, k) => { p.classList.toggle('is-current', k === i); p.dataset.pos = k - i; p.querySelector('.homepage-teammates_card').inert = k !== i; });
  }
  const navH = () => (window.DT_NAV_H || 0);
  const stretch = () => runway.offsetHeight - (innerHeight - navH());
  const start = () => runway.getBoundingClientRect().top + scrollY - navH();
  // which stretch the scroll is in: -1 above the section, N below it
  const raw = () => { const len = stretch(); return len > 0 ? Math.floor((navH() - runway.getBoundingClientRect().top) / len * N) : 0; };
  const at = () => Math.max(0, Math.min(N - 1, raw()));
  // hold the scroll inside teammate i's stretch, at the end it came in from
  const keep = (i, dir) => scrollTo({ top: start() + stretch() * (i + (dir > 0 ? .1 : .9)) / N, behavior: 'instant' });
  /* A fast scroll (a flick, momentum) can cross several stretches between two frames. It still moves one teammate at
     a time: each step shows the next teammate, keeps the scroll in its stretch and holds it there a moment, so all four
     are always seen, in order, both ways. Leaving the section past either end stays free. */
  function onScroll() {
    if (!pinned() || hold !== null) return;
    const r = raw();
    if (r < 0 || r >= N) { pos = r < 0 ? -1 : N; lockUntil = 0; return; }
    if (performance.now() < lockUntil) { if (pos >= 0 && pos < N && r !== pos) keep(pos, r > pos ? 1 : -1); return; }
    if (r === pos) return;
    const dir = Math.sign(r - pos), next = pos + dir;
    pos = next;
    if (next < 0 || next >= N) return;
    show(next);
    lockUntil = performance.now() + HOLD;
    if (r !== next) keep(next, dir);
  }

  function go(i) {
    if (!pinned()) { show(i); return; }
    hold = i; pos = i; show(i);
    scrollTo({ top: start() + stretch() * (i + .5) / N, behavior: 'smooth' });
    clearTimeout(holdTimer);
    const release = () => { clearTimeout(holdTimer); hold = null; pos = Math.max(-1, Math.min(N, raw())); lockUntil = 0; };
    if ('onscrollend' in window) addEventListener('scrollend', release, { once: true });
    holdTimer = setTimeout(release, 1400);
  }
  tabs.forEach((t, k) => t.addEventListener('click', () => go(k)));
  panels.forEach((p, k) => p.addEventListener('click', () => { if (Math.abs(k - cur) === 1) go(k); }));
  s.querySelector('.homepage-teammates_tabs').addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const k = (cur + d + N) % N; go(k); tabs[k].focus({ preventScroll: true });
  });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  wide.addEventListener('change', onScroll);
  cur = 0; show(0); cur = -1; pos = pinned() ? Math.max(-1, Math.min(N, raw())) : 0; show(pinned() ? at() : 0);
})();


/* Teammate cards: each card's screen plays its teammate's flow when the card comes to the centre of the rail, after
   the team's flow demos (alpha.dreamteamaihq.com/website/flows.html, Sree's picks, 2026-11-03), rebuilt in this site's
   style: our cards, tags and type, presses instead of a cursor, springs with no bounce, staggers of 45-110ms.
   - Rachel ("Rachel - Enrich"): Jo Barrett's brief lands bare and fills in from shimmer, field by field, then each
     section resolves from placeholder lines as the screen scrolls to it; her state turns to "Enriched".
   - Sally ("Zero context loss"): Nick Alvarez's email from Athleap is scanned and its buying signals light up; Sally
     drafts the deal from it (the hero's Athleap card) and it is confirmed in one press.
   - Raj ("Raj reads the pipeline", on our own review and charts): his read types into a callout, the donut draws
     itself in one sweep with its total counting in step, then the review glides down to the committed and at-risk.
   - Alex ("Ask, and it reasons"): the ask is typed and sent, he thinks, shows the new pipeline as a preview that waits
     for approval, it is approved, and a follow-up picked from his suggestions is done too.
   Without script or with reduced motion each card shows its Figma screen. A card that leaves the centre keeps its
   finished screen; the next time it arrives it fades back to the start and replays. */
(() => {
  const s = document.getElementById('teammate-cards');
  if (!s || !window.DTM || window.DTM.reduced) return;
  const { E, play, set, move, words } = window.DTM;
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rise = (el, px = 8, d = 480, delay = 0) => move(el, { opacity: 0, transform: `translateY(${px}px)`, filter: 'blur(4px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }, { d, fade: 240, delay });
  const pop = (el, d = 360, delay = 0) => move(el, { opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }, { d, fade: 200, delay });
  const stream = (ws, gap = 22) => Promise.all(ws.map((w, i) => move(w, { opacity: 0, filter: 'blur(4px)', transform: 'translateY(4px)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }, { d: 420, fade: 260, delay: i * gap })));

  const flows = {};
  const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

  flows.rachel = card => {
    // "Rachel - Enrich", company edition: the Research tab opens on placeholder lines, Sable's summary resolves, then the
    // website and each context pill fill in from shimmer, and her state turns from "Enriching company" to "Enriched"
    const app = card.querySelector('.homepage-teammates_rs-app');
    const attr = document.createElement('p');
    attr.className = 'homepage_tmr8-attr'; attr.setAttribute('aria-hidden', 'true');
    attr.innerHTML = '<img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c6776984fef06d0e3b3_homepage-rachel-sally-rachel.webp" alt=""><b>Zara</b><span class="tmr8-state"><i></i><span>Qualifying WhatsApp lead…</span></span>';
    const head = app.querySelector('.homepage-teammates_rc-head'); head.replaceChild(attr, head.querySelector('.homepage-teammates_rc-en'));
    const state = attr.querySelector('.tmr8-state'), stateText = state.querySelector('span');
    const sum = app.querySelector('.homepage-teammates_rc-sum'), lines = [...sum.children];
    const bars = document.createElement('div'); bars.className = 'homepage_tmr8-bars'; bars.setAttribute('aria-hidden', 'true');
    bars.innerHTML = [92, 70, 88, 96, 62].map(w => `<i class="tmr8-bar" style="width:${w}%"></i>`).join('');
    sum.prepend(bars);
    const fills = [app.querySelector('.homepage-teammates_rc-site-v'), ...app.querySelectorAll('.homepage-teammates_rc-pill')].map(el => {
      const sk = document.createElement('i'); sk.className = 'homepage_tmr8-skel'; sk.setAttribute('aria-hidden', 'true');
      el.appendChild(sk);
      return { el, sk, kids: [...el.childNodes].filter(n => n !== sk) };
    });
    const valueOf = f => f.el.querySelectorAll(':scope > *:not(.homepage_tmr8-skel)');
    return {
      start() {
        state.classList.remove('is-done'); stateText.textContent = 'Qualifying WhatsApp lead…';
        set(bars, { display: '', opacity: 1 }); set(lines, { opacity: 0, display: 'none' });
        fills.forEach(f => { f.sk.style.width = Math.max(28, f.el.offsetWidth) + 'px'; set(f.sk, { opacity: 1 }); f.el.style.color = 'transparent'; set([...valueOf(f)], { opacity: 0 }); f.el.classList.add('is-loading'); });
      },
      async run(alive) {
        await sleep(900);
        if (!alive()) return;
        await play(bars, [{ opacity: 1 }, { opacity: 0 }], 200, E.out); bars.style.display = 'none';
        set(lines, { display: '' });
        lines.forEach((l, i) => rise(l, 6, 440, i * 120));
        await sleep(800);
        for (const f of fills) {
          if (!alive()) return;
          play(f.sk, [{ opacity: 1 }, { opacity: 0 }], 200, E.out);
          f.el.style.color = ''; f.el.classList.remove('is-loading');
          [...valueOf(f)].forEach(v => set(v, { opacity: 1 }));
          await move(f.el, { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)' }, { d: 380, fade: 220 });
          await sleep(110);
        }
        state.classList.add('is-done'); stateText.textContent = 'Qualified ✓';
        await pop(state, 360);
      },
    };
  };

  flows.sally = card => {
    // "Zero context loss" (flows/zero-context-loss): an email lands, Sally scans it and the buying signals light up;
    // she drafts the deal from it (the hero's Athleap card, Figma 313:1890) and it is confirmed in one press. Nick's
    // words are his website form's, from the Electric City Paper data.
    const screen = card.querySelector('.homepage-teammates_tmc-screen'), app = card.querySelector('.homepage-teammates_rs-app');
    const mk = html => { const d = document.createElement('div'); d.className = 'homepage_tmz'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = html; screen.appendChild(d); return d; };
    const mail = mk(`<div class="tmz-subj"><span class="tmz-ico"><img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c6790160070abd45e5c_homepage-hero-type-mail.svg" alt=""></span><p>WhatsApp Business API · PrimeSolar NG</p></div>
      <div class="tmz-msg"><i class="tmz-scan"></i>
        <div class="tmz-from"><span class="tmz-av">NA</span><p class="tmz-who">Chidi Okafor <span>(Managing Director)</span><em>PrimeSolar NG · Victoria Island, Lagos</em></p><span class="tmz-when">1h ago</span></div>
        <div class="tmz-body">
          <p>Good afternoon, we are expanding our Victoria Island clinic. <span class="tmz-sig">Our ₦18.5M solar budget is approved</span>; we need zero downtime on our lab equipment. <span class="tmz-sig">We are commissioning the VI facility this month</span> and choosing an installer this week.</p>
          <p>We need a 20kVA hybrid inverter, 40kWh LiFePO4 battery bank, and roof panels. <span class="tmz-sig">We have not paid any vendor yet</span>. <span class="tmz-sig">Please send your Paystack invoice and 5-year warranty</span>.</p>
          <p>Chidi Okafor</p>
        </div></div>`);
    const deal = mk(`<div class="tmz-mate"><img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c66450000a129acad15_homepage-hero-sally.webp" alt=""><div><b>Koda</b><span>Voice &amp; Chat Scribe</span><p>Extracted from Chidi Okafor's WhatsApp message.</p></div></div>
      <div class="tmz-panel"><div class="tmz-lead"><img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c66e55cbb5f9533492f_homepage-hero-athleap.webp" alt=""><p>PrimeSolar NG<span>VI Clinic 20kVA Hybrid Solar Setup</span></p></div>
        <div class="tmz-chips"><span class="tmz-chip">Budget set</span><span class="tmz-chip">Moving this month</span><span class="tmz-chip">No vendor yet</span><span class="tmz-chip">Ready to buy</span></div>
        <div class="tmz-fields"><p><span>Value</span>₦18,500,000</p><p><span>Stage</span>Qualification</p><p><span>Close date</span>Nov 20 (in 4 weeks)</p><p class="tmz-wide"><span>System</span>20kVA Deye Hybrid + 40kWh Lithium + Roof Panels</p></div></div>
      <div class="tmz-btns"><span class="tmz-btn" data-confirm>Confirm &amp; Create Deal</span><span class="tmz-btn tmz-btn--ghost">Skip</span></div>
      <div class="homepage_tmz-toast" role="status"><i><img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c67450000a129acad29_homepage-hero-toast-check.svg" alt=""></i>PrimeSolar ₦18.5M deal created</div>`);
    const scan = mail.querySelector('.tmz-scan'), sigs = [...mail.querySelectorAll('.tmz-sig')], msg = mail.querySelector('.tmz-msg');
    const mailParts = [...mail.children], dealParts = [...deal.children].filter(c => !c.classList.contains('homepage_tmz-toast')), done = deal.querySelector('.homepage_tmz-toast');
    const chips = [...deal.querySelectorAll('.tmz-chip')], fields = [...deal.querySelectorAll('.tmz-fields p')];
    const confirm = deal.querySelector('[data-confirm]');
    return {
      start() {
        set(app, { opacity: 0 }); set([mail, deal], { opacity: 1, transform: 'none', filter: '' });
        set(mailParts, { opacity: 0 }); set(dealParts, { opacity: 0 }); set(chips, { opacity: 0 }); set(fields, { opacity: 0 });
        sigs.forEach(x => x.classList.remove('is-found')); deal.style.visibility = 'hidden'; set(done, { opacity: 0 });
      },
      async run(alive) {
        await Promise.all(mailParts.map((el, i) => rise(el, 8, 480, i * 80)));
        await sleep(500); if (!alive()) return;
        // the scan sweeps the message once, lighting each signal as it passes
        const h = msg.offsetHeight;
        scan.animate([{ opacity: 0, transform: 'translateY(0)' }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .92 }, { opacity: 0, transform: `translateY(${h}px)` }], { duration: 1500, easing: E.move });
        const mt = msg.getBoundingClientRect().top;
        sigs.forEach(x => { const at = (x.getBoundingClientRect().top - mt) / h; setTimeout(() => x.classList.add('is-found'), 120 + at * 1380); });
        await sleep(2900); if (!alive()) return;
        // the email steps back; Sally's draft takes over
        await play(mail, [{ opacity: 1, transform: 'none', filter: 'blur(0px)' }, { opacity: 0, transform: 'scale(.98)', filter: 'blur(4px)' }], 300, E.out);
        deal.style.visibility = '';
        await rise(dealParts[0], 8, 460);
        await move(dealParts[1], { opacity: 0, transform: 'translateY(14px) scale(.98)' }, { opacity: 1, transform: 'none' }, { d: 560, fade: 260 });
        await Promise.all(chips.map((c, i) => pop(c, 360, i * 90)));
        await sleep(200);
        await Promise.all(fields.map((f, i) => rise(f, 6, 440, i * 45)));
        await rise(dealParts[2], 6, 420);
        await sleep(1800); if (!alive()) return;
        // confirmed in one press
        await play(confirm, [{ transform: 'scale(1)' }, { transform: 'scale(.96)' }], 100, E.out);
        await move(confirm, { transform: 'scale(.96)' }, { transform: 'none' }, { d: 300 });
        // done: the hero's toast rises in the corner, as it does after each task up there
        await move(done, { opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }, { d: 480, fade: 220 });
      },
    };
  };

  flows.raj = card => {
    // "Raj reads the pipeline" (flows/raj-pipeline), on our own review and its charts: under the pinned tabs Raj gives
    // his read in a callout, the donut draws itself in one clockwise sweep with its total counting up in step and each
    // legend row arriving as the sweep reaches its segment, the target counts up on the same curve, then the review
    // glides down like a briefing to the committed and at-risk figures. The read uses only the card's own numbers.
    const q = c => card.querySelector(c), qa = c => [...card.querySelectorAll(c)];
    const review = q('.homepage-teammates_tmr-review'), tabs = q('.homepage-teammates_tmr-tabbar'), title = q('.homepage-teammates_tmr-rtitle'), ask = q('.homepage-teammates_tmr-ask');
    const read = document.createElement('p');
    read.className = 'homepage_tmr8-read'; read.setAttribute('aria-hidden', 'true');
    read.innerHTML = '<img src="/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74c6739dbbb00513048ce_homepage-raj-alex-raj.webp" alt="">Closed-Won is <b>₦120M</b> against a <b>₦100M</b> target, <b>120%</b> attained. <b>₦430M</b> is committed across three deals, and <b>₦140M</b> needs WhatsApp follow-up.';
    title.after(read);
    const readWords = words([read]);
    const [mix, target, ...stats] = qa('.homepage-teammates_tmr-card');
    const legend = qa('.homepage-teammates_tmr-legend li'), headline = q('.homepage-teammates_tmr-headline'), heroNum = q('.homepage-teammates_tmr-hero-num'), trend = q('.homepage-teammates_tmr-trend');
    const figs = qa('.homepage-teammates_tmr-fig'), statRow = stats[0] && stats[0].parentElement, prioDot = q('.homepage-teammates_tmr-prio i');
    // the sweep: one ring-shaped mask over the three segments, drawn clockwise from twelve o'clock
    const svg = q('.homepage-teammates_tmr-donut svg'), NS = 'http://www.w3.org/2000/svg';
    const id = 'tmr8-sweep', mask = document.createElementNS(NS, 'mask'); mask.id = id;
    const ring = document.createElementNS(NS, 'circle');
    Object.entries({ cx: 68, cy: 68, r: 59, fill: 'none', stroke: '#fff', 'stroke-width': 22, pathLength: 1, transform: 'rotate(-90 68 68)' }).forEach(([k, v]) => ring.setAttribute(k, v));
    ring.style.strokeDasharray = '1 1';
    mask.appendChild(ring); svg.querySelector('defs').appendChild(mask);
    const segs = document.createElementNS(NS, 'g'); segs.setAttribute('mask', `url(#${id})`);
    qa('.homepage-teammates_tmr-donut svg > g').forEach(g => segs.appendChild(g)); svg.appendChild(segs);
    const nums = new Map(qa('.homepage-teammates_tmr-donut-total, .homepage-teammates_tmr-hero-num, .homepage-teammates_tmr-stat-num').map(el => [el, el.textContent]));
    // one curve for everything that moves together: ease in-out, so the sweep and its count start and land as one
    const curve = 'cubic-bezier(.65,0,.35,1)', inOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2);
    const count = (el, ms) => new Promise(r => {
      const text = nums.get(el), m = /([\d.]+)/.exec(text); if (!m) return r();
      const to = parseFloat(m[1]), t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / ms);
        el.textContent = text.replace(m[1], k < 1 ? String(Math.round(to * inOut(k))) : m[1]); k < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step);
    });
    // scroll the review inside a fixed window just under the tabs, as the flow's briefing does
    let scrolled = 0;
    const under = review.offsetTop - q('.homepage-teammates_tmr-tabs').offsetTop;   // let it run up under the tab bar
    const scrollTo = (y, ms) => new Promise(r => {
      const from = scrolled, t0 = performance.now();
      const step = now => { const k = Math.min(1, (now - t0) / ms); scrolled = from + (y - from) * inOut(k);
        review.style.translate = `0 ${(-scrolled).toFixed(1)}px`; review.style.clipPath = `inset(${Math.max(0, scrolled - under).toFixed(1)}px -40px -200px -40px)`;
        k < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step);
    });
    const hidden = [tabs, title, read, mix, target, ...stats, ...legend, headline, trend, ...figs, ask].filter(Boolean);
    return {
      start() {
        set(hidden, { opacity: 0 }); set(readWords, { opacity: 0 });
        ring.style.strokeDashoffset = '1';
        nums.forEach((t, el) => { el.textContent = t.replace(/[\d.]+/, '0'); });
        scrolled = 0; review.style.translate = ''; review.style.clipPath = '';
      },
      async run(alive) {
        await rise(tabs, 6, 420);
        await rise(title, 8, 420);
        set(read, { opacity: 1 }); await rise(read, 6, 420);
        await Promise.all(readWords.map((w, i) => move(w, { opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)' }, { d: 360, fade: 220, delay: i * 20 })));
        if (!alive()) return;
        await Promise.all([rise(mix, 12, 560), rise(target, 12, 560, 80)]);
        // the donut draws, its total counts in step, the legend arrives with its segments
        const SWEEP = 1500;
        ring.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: SWEEP, easing: curve, fill: 'forwards' })
          .finished.then(() => { ring.style.strokeDashoffset = '0'; });
        legend.forEach((l, i) => rise(l, 4, 420, [120, 640, 980][i] || i * 300));
        rise(headline, 6, 440, 200);
        await Promise.all([count(q('.homepage-teammates_tmr-donut-total'), SWEEP), sleep(200).then(() => count(heroNum, SWEEP - 200))]);
        if (!alive()) return;
        rise(trend, 4, 420);
        await Promise.all(figs.map((f, i) => rise(f, 4, 420, 120 + i * 80)));
        await sleep(900); if (!alive()) return;
        // the briefing scrolls on to the committed and at-risk figures
        const cut = parseFloat(getComputedStyle(card).getPropertyValue('--tx-cut')) || 0;
        const over = statRow ? statRow.offsetTop + statRow.offsetHeight - (318 - cut) : 0;
        set(stats, { opacity: 1 });
        const scroll = over > 0 ? scrollTo(over, 1500) : Promise.resolve();
        await sleep(300);
        await Promise.all([scroll, ...stats.map((c, i) => rise(c, 10, 520, i * 90)), ...qa('.homepage-teammates_tmr-stat-num').map((n, i) => sleep(200 + i * 90).then(() => count(n, 1100)))]);
        if (!alive()) return;
        if (prioDot) await prioDot.animate([{ opacity: 1 }, { opacity: .25 }, { opacity: 1 }, { opacity: .25 }, { opacity: 1 }], { duration: 1600, easing: 'ease-in-out' }).finished;
        rise(ask, 10, 520);
      },
    };
  };

  flows.alex = card => {
    // Alex, after "Ask, and it reasons" (flows/operator-reasoning): asked for a pipeline change, he thinks, shows the
    // new pipeline as a preview that waits for approval, it is approved, then a follow-up is picked from his
    // suggestions and he does that too. Electric City Paper's pipeline and deals; the copy follows his Figma card.
    const q = c => card.querySelector(c);
    const input = q('.homepage-teammates_tma-input'), hint = q('.homepage-teammates_tma-placeholder'), caret = q('.homepage-teammates_tma-caret'), send = q('.homepage-teammates_tma-send');
    const figma = [q('.homepage-teammates_tma-bubble-user'), q('.homepage-teammates_tma-bubble-agent'), q('.homepage-teammates_tma-typing')];
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const stages = ['Lead', 'Qualified', 'Inspection', 'Quote Sent', 'Negotiation', 'Closed-Won'];
    const thread = document.createElement('div');
    thread.className = 'homepage_tmx'; thread.setAttribute('aria-hidden', 'true');
    thread.innerHTML = `<div class="tmx-in">
      <div class="tmx-row" data-m="q1"><div><p class="tmx-user">Add an Inspection stage after Qualified.</p></div></div>
      <div class="tmx-row" data-m="t1"><div><p class="tmx-think"><i></i>Reading your pipeline stages…</p></div></div>
      <div class="tmx-row" data-m="r1"><div>
        <p class="tmx-done">${tick}Thought for 3s</p>
        <p class="tmx-text">Got it. <b>Inspection</b> goes between Qualified and Proposal. Active Lekki &amp; Abuja deals stay in place.</p>
        <div class="tmx-card" data-card>
          <p class="tmx-card-head">Sales pipeline · preview</p>
          <div class="tmx-stages">${stages.map((st, i) => `${i ? '<span class="tmx-arrow">→</span>' : ''}<span class="tmx-stage${st === 'Inspection' ? ' tmx-stage--new' : ''}"${st === 'Inspection' ? ' data-new' : ''}>${st}</span>`).join('')}</div>
          <div class="tmx-foot"><span class="tmx-ask">Waits for your approval</span><span class="tmx-live">${tick}Live for the whole team</span><span class="tmx-btns tmx-ask"><span class="tmx-btn" data-approve>Approve</span><span class="tmx-btn tmx-btn--ghost">Edit</span></span></div>
        </div>
      </div></div>
      <div class="tmx-row" data-m="c1"><div>
        <p class="tmx-label">Explore further:</p>
        <div class="tmx-chips">
          <span class="tmx-chip" data-pick><b>1</b>Nudge reps on WhatsApp if quote sits 48h</span>
          <span class="tmx-chip"><b>2</b>Who gets the 8 AM WhatsApp pipeline brief?</span>
          <span class="tmx-chip"><b>3</b>Show me every deal above ₦50M</span>
        </div>
      </div></div>
      <div class="tmx-row" data-m="q2"><div><p class="tmx-user">Nudge reps on WhatsApp if quote sits 48h</p></div></div>
      <div class="tmx-row" data-m="t2"><div><p class="tmx-think"><i></i>Setting up the rule…</p></div></div>
      <div class="tmx-row" data-m="r2"><div>
        <p class="tmx-done">${tick}Thought for 2s</p>
        <p class="tmx-text">Done. Any quote silent for <b>48 hours</b> triggers a 1-tap WhatsApp follow-up nudge to the assigned rep.</p>
        <div class="tmx-card"><p class="tmx-card-head">Pilot · rule</p><div class="tmx-stages"><span class="tmx-stage">Silent 48h after Quote</span><span class="tmx-arrow">→</span><span class="tmx-stage tmx-stage--new">1-Tap WhatsApp Nudge to Rep</span></div></div>
      </div></div>
      <div class="tmx-row" data-m="q3"><div><p class="tmx-user">Who gets the 8 AM WhatsApp pipeline brief?</p></div></div>
      <div class="tmx-row" data-m="t3"><div><p class="tmx-think"><i></i>Checking who gets notified…</p></div></div>
      <div class="tmx-row" data-m="r3"><div>
        <p class="tmx-done">${tick}Thought for 1s</p>
        <p class="tmx-text">You and the Head of Sales receive the 8:00 AM WhatsApp summary daily. Say the word to add branch managers.</p>
      </div></div>
    </div>`;
    card.querySelector('.homepage-teammates_tmr-stage').appendChild(thread);
    const m = k => thread.querySelector(`[data-m="${k}"]`);
    const rows = [...thread.querySelectorAll('.tmx-row')];
    const typed = document.createElement('span'); typed.className = 'homepage_tma-typed'; input.appendChild(typed);
    let blink = null;
    const idle = () => { blink = caret.animate([{ opacity: 1 }, { opacity: 1, offset: .5 }, { opacity: 0, offset: .5 }, { opacity: 0 }], { duration: 1060, iterations: Infinity }); };
    const busy = () => { if (blink) { blink.cancel(); blink = null; } };
    // a message opens its own room (height and fade together), then the thread glides to keep it in view
    const open = el => play(el, [{ gridTemplateRows: '0fr', opacity: 0 }, { gridTemplateRows: '1fr', opacity: 1 }], 360, E.out);
    const close = el => play(el, [{ gridTemplateRows: '1fr', opacity: 1 }, { gridTemplateRows: '0fr', opacity: 0 }], 200, E.out).then(() => { el.style.display = 'none'; });
    const follow = (ms = 700) => new Promise(r => {
      const from = thread.scrollTop, to = Math.max(0, thread.scrollHeight - thread.clientHeight), t0 = performance.now();
      if (to - from < 1) return r();
      const step = now => { const k = Math.min(1, (now - t0) / ms), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(2 - 2 * k, 3) / 2;
        thread.scrollTop = from + (to - from) * e; k < 1 ? requestAnimationFrame(step) : r(); };
      requestAnimationFrame(step);
    });
    const nap = ms => sleep(ms * .6);   // the whole flow runs faster (Sree, 2026-11-12)
    const type = async (msg, alive) => {
      busy(); hint.style.visibility = 'hidden';
      for (let i = 1; i <= msg.length; i++) { if (!alive()) return false; typed.textContent = msg.slice(0, i); caret.style.left = (14 + typed.offsetWidth + 1) + 'px'; await sleep(20 + Math.random() * 26); }
      idle(); await nap(400);
      await press(send);
      typed.textContent = ''; caret.style.left = ''; hint.style.visibility = '';
      return true;
    };
    const press = async el => { await play(el, [{ transform: 'scale(1)' }, { transform: 'scale(.95)' }], 100, E.out); await move(el, { transform: 'scale(.95)' }, { transform: 'none' }, { d: 300 }); };
    return {
      start() {
        set(figma, { opacity: 0 }); rows.forEach(r => { r.style.gridTemplateRows = '0fr'; r.style.opacity = '0'; r.style.display = ''; });
        thread.scrollTop = 0; thread.querySelector('[data-card]').classList.remove('is-live');
        thread.querySelector('[data-pick]').classList.remove('is-hover');
        typed.textContent = ''; hint.style.visibility = ''; caret.style.left = ''; busy(); idle();
      },
      async run(alive) {
        await nap(600); if (!alive()) return;
        // the ask is typed and sent
        if (!await type('Add an Inspection stage after Qualified.', alive)) return;
        await open(m('q1')); await nap(500);
        // he thinks, then shows his work
        await open(m('t1')); await nap(1400); if (!alive()) return;
        await close(m('t1'));
        await open(m('r1')); follow(900);
        const stagesEls = [...thread.querySelectorAll('[data-m="r1"] .tmx-stage, [data-m="r1"] .tmx-arrow')];
        await Promise.all(stagesEls.map((el, i) => rise(el, 4, 420, i * 45)));
        await pop(thread.querySelector('[data-new]'), 420);
        await nap(1400); if (!alive()) return;
        // approved
        const approve = thread.querySelector('[data-approve]');
        await press(approve); await nap(120);
        thread.querySelector('[data-card]').classList.add('is-live');
        await rise(thread.querySelector('.tmx-live'), 4, 420);
        await nap(900); if (!alive()) return;
        // his suggestions, and the first is picked
        await open(m('c1')); await follow(800);
        await nap(900); if (!alive()) return;
        const pick = thread.querySelector('[data-pick]');
        pick.classList.add('is-hover'); await nap(420); await press(pick); pick.classList.remove('is-hover');
        await open(m('q2')); await follow(600); await nap(400);
        await open(m('t2')); await follow(400); await nap(1100); if (!alive()) return;
        await close(m('t2'));
        await open(m('r2')); await follow(900);
        // a follow-up of the user's own, typed, and his answer
        await nap(1200); if (!alive()) return;
        if (!await type('Who gets the 8 AM WhatsApp pipeline brief?', alive)) return;
        await open(m('q3')); await follow(500); await nap(300);
        await open(m('t3')); await follow(400); await nap(900); if (!alive()) return;
        await close(m('t3'));
        await open(m('r3')); await follow(700);
      },
    };
  };

  // ---- run each card when it reaches the centre ----
  const cards = [...s.querySelectorAll('.homepage-teammates_card')].map(el => {
    const who = ['rachel', 'sally', 'raj', 'alex'].find(k => el.classList.contains('homepage-teammates_tmc-' + k));
    const f = who && flows[who] ? flows[who](el) : null;
    if (f) f.start();
    return { el, f, run: 0, played: false, screen: el.querySelector('.homepage-teammates_tmc-screen, .homepage-teammates_tmr-stage') };
  }).filter(c => c.f);

  async function begin(c) {
    const id = ++c.run, alive = () => c.run === id;
    c.el.classList.remove('homepage_hl-on');
    if (c.played) {   // it played before: fade its finished screen out, back to the start, then replay
      await play(c.screen, [{ opacity: 1 }, { opacity: 0 }], 180, E.out);
      if (!alive()) return;
      c.f.start(); set(c.screen, { opacity: 1 });
    }
    c.played = true;
    // wait until the cards are actually showing (they fade in as the heading hands over), then let it settle
    const track = s.querySelector('.homepage-teammates_tr-track');
    while (alive() && +getComputedStyle(track).opacity < .95) await sleep(120);
    await sleep(380);
    if (alive()) await c.f.run(alive);
    // then the one piece that matters lifts out of the window (Raj's at-risk deals, Rachel's fit for Sable)
    if (alive()) { await sleep(500); if (alive()) c.el.classList.add('homepage_hl-on'); }
  }
  const stop = c => { c.run++; c.el.classList.remove('homepage_hl-on'); };

  const railOn = () => matchMedia('(min-width:1024px)').matches || !!s.querySelector('.homepage-teammates_panel');
  // on the rail: the card the rail marks current; stacked: the card most of the way on screen
  new MutationObserver(() => cards.forEach(c => {
    if (!railOn()) return;
    const cur = c.el.closest('.homepage-teammates_tr-card').classList.contains('is-current');
    if (cur && !c.on) { c.on = true; begin(c); } else if (!cur && c.on) { c.on = false; stop(c); }
  })).observe(s, { subtree: true, attributes: true, attributeFilter: ['class'] });
  // the rail only marks a card current while the section is pinned; also start the first card when it comes into view
  const io = new IntersectionObserver(es => es.forEach(e => {
    const c = cards.find(k => k.el === e.target);
    if (!c) return;
    const want = railOn() ? e.isIntersecting && c.el.closest('.homepage-teammates_tr-card').classList.contains('is-current') : e.intersectionRatio > .5;
    if (want && !c.on) { c.on = true; begin(c); } else if (!want && c.on && !railOn()) { c.on = false; stop(c); }
  }), { threshold: [0, .5] });
  cards.forEach(c => io.observe(c.el));
})();

/* "One CRM. Two ways in." (Figma 276:17146, illustrations 439:7258 and 439:7309).
   Entry, once per card as it comes into view: the window rises in first, then what floats above it. On the app card
   the row of teammate chips lifts in and each teammate arrives in turn; on the headless card the bar of AI tools
   settles from just above with each logo popping in, then the question and Dreamteam's answer slide into place.
   Springs with no bounce, staggers 50-80ms (the hero's runtime and rules).
   Parallax, while the cards are on screen: each layer drifts at its own depth as the page scrolls, the glows slowest,
   the window steady, the chips, the tool bar and the answer card a little faster, so they read as layers above the
   window. Uses the CSS `translate` property, separate from the entry's `transform`; eased toward the scroll, not locked.
   Reduced motion: no entry, no parallax; the finished cards stand still. */
(() => {
  const s = document.getElementById('minimal');
  if (!s || !window.DTM || window.DTM.reduced) return;
  const { move, set, spring } = window.DTM;
  const q = c => s.querySelector(c), qa = c => [...s.querySelectorAll(c)];
  const appCard = q('.homepage-ways_card-ui'), mcpCard = q('.homepage-ways_card-headless');
  const app = {
    glows: qa('.homepage-ways_card-ui .homepage-ways_glow'), win: q('.homepage-ways_day-win'), team: q('.homepage-ways_day-team'), mates: qa('.homepage-ways_day-mate'),
  };
  const mcp = {
    glows: qa('.homepage-ways_card-headless .homepage-ways_glow'), win: q('.homepage-ways_mcp-win'), tools: q('.homepage-ways_mcp-tools'), tiles: qa('.homepage-ways_mcp-tile'),
    ask: q('.homepage-ways_mcp-ask'), result: q('.homepage-ways_mcp-result'),
  };
  if (!app.win || !mcp.win) return;

  // ---- entry ----
  const rise = (el, y, d, delay = 0, extra = '') => move(el, { opacity: 0, transform: `translateY(${y}px)${extra}` }, { opacity: 1, transform: 'none' }, { d, fade: 260, delay });
  set([app.win, app.team, ...app.mates], { opacity: 0 });
  set([mcp.win, mcp.tools, ...mcp.tiles, mcp.ask, mcp.result], { opacity: 0 });
  const enterApp = async () => {
    rise(app.win, 24, 720);
    await new Promise(r => setTimeout(r, 260));
    rise(app.team, 20, 640, 0, ' scale(.97)');
    app.mates.forEach((m, i) => rise(m, 10, 520, 140 + i * 80));
  };
  const enterMcp = async () => {
    rise(mcp.win, 24, 720);
    await new Promise(r => setTimeout(r, 220));
    rise(mcp.tools, -14, 620);
    mcp.tiles.forEach((t, i) => move(t, { opacity: 0, transform: 'scale(.9)' }, { opacity: 1, transform: 'none' }, { d: 420, fade: 200, delay: 120 + i * 55 }));
    await new Promise(r => setTimeout(r, 420));
    rise(mcp.ask, 8, 480);
    await new Promise(r => setTimeout(r, 200));
    move(mcp.result, { opacity: 0, transform: 'translate(16px, 20px) scale(.97)' }, { opacity: 1, transform: 'none' }, { d: 680, fade: 280 });
  };
  [[appCard, enterApp], [mcpCard, enterMcp]].forEach(([card, go]) => new IntersectionObserver((es, io) => {
    if (es[0].isIntersecting) { io.disconnect(); go(); }
  }, { threshold: 0.35 }).observe(card));

  // ---- parallax ----
  // depth: px of drift across a full pass of the card through the screen (negative drifts the other way)
  const layers = [
    { card: appCard, els: app.glows, depth: -16 }, { card: appCard, els: [app.team], depth: 22 },
    { card: mcpCard, els: mcp.glows, depth: -16 }, { card: mcpCard, els: [mcp.tools], depth: 14 }, { card: mcpCard, els: [mcp.result], depth: 26 },
  ];
  const state = new Map(layers.map(l => [l, { now: 0, target: 0 }]));
  let raf = 0, visible = false;
  const measure = () => layers.forEach(l => {
    const r = l.card.getBoundingClientRect();
    // -1 when the card's centre is at the bottom of the screen, 0 mid-screen, 1 at the top
    const p = Math.max(-1, Math.min(1, (innerHeight / 2 - (r.top + r.height / 2)) / (innerHeight / 2 + r.height / 2)));
    state.get(l).target = -p * l.depth;
  });
  const tick = () => {
    let moving = false;
    layers.forEach(l => {
      const st = state.get(l); st.now += (st.target - st.now) * 0.12;
      if (Math.abs(st.target - st.now) > 0.05) moving = true;
      l.els.forEach(el => { el.style.translate = `0 ${st.now.toFixed(2)}px`; });
    });
    raf = moving && visible ? requestAnimationFrame(tick) : 0;
  };
  const kick = () => { if (!visible) return; measure(); if (!raf) raf = requestAnimationFrame(tick); };
  new IntersectionObserver(es => { visible = es[0].isIntersecting; kick(); }).observe(q('.homepage-ways_cards'));
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
})();

/* Hover tilt on the floating layers of both illustrations (the chip row; the tool bar and the answer card): like the
   hero's video, the end under the pointer sinks away a little. On the CSS `rotate` property, separate from the entry's
   `transform` and the parallax's `translate`; eased toward the pointer, no bounce. Only with a fine pointer that can
   hover, and never under reduced motion. Hit-tested against each layer at rest, so a sinking edge never flickers. */
(() => {
  const s = document.getElementById('minimal');
  if (!s || !window.DTM || window.DTM.reduced || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const targets = [
    { el: s.querySelector('.homepage-ways_day-team'), max: 3 },     // wide: a gentler tilt
    { el: s.querySelector('.homepage-ways_mcp-tools'), max: 5 },
    { el: s.querySelector('.homepage-ways_mcp-result'), max: 6 },
  ].filter(t => t.el).map(t => ({ ...t, x: 0, y: 0, tx: 0, ty: 0 }));
  targets.forEach(t => { t.el.parentElement.style.perspective = '900px'; });
  const restRect = el => { const r = el.style.rotate; el.style.rotate = 'none'; const b = el.getBoundingClientRect(); el.style.rotate = r; return b; };
  let raf = 0;
  const tick = () => {
    let moving = false;
    targets.forEach(t => {
      t.x += (t.tx - t.x) * 0.14; t.y += (t.ty - t.y) * 0.14;
      if (Math.abs(t.tx - t.x) > 0.001 || Math.abs(t.ty - t.y) > 0.001) moving = true;
      const a = Math.hypot(t.x, t.y) * t.max;
      t.el.style.rotate = a < 0.01 ? '' : `${(-t.y).toFixed(4)} ${t.x.toFixed(4)} 0 ${a.toFixed(3)}deg`;
    });
    raf = moving ? requestAnimationFrame(tick) : 0;
  };
  s.addEventListener('pointermove', e => {
    targets.forEach(t => {
      const b = restRect(t.el), u = (e.clientX - b.left) / b.width, v = (e.clientY - b.top) / b.height;
      const over = u >= 0 && u <= 1 && v >= 0 && v <= 1;
      t.tx = over ? u * 2 - 1 : 0; t.ty = over ? v * 2 - 1 : 0;
      if (over) t.el.parentElement.style.perspectiveOrigin = `${t.el.offsetLeft + t.el.offsetWidth / 2}px ${t.el.offsetTop + t.el.offsetHeight / 2}px`;
    });
    if (!raf) raf = requestAnimationFrame(tick);
  });
  s.addEventListener('pointerleave', () => { targets.forEach(t => { t.tx = t.ty = 0; }); if (!raf) raf = requestAnimationFrame(tick); });
})();

/* The ground under "One CRM. Two ways in." turns from its warm beige to white as the testimonials below come up the
   screen: nothing while their top edge is below the screen, all white once it reaches 40% from the top. A pure
   function of the scroll, so it runs backward as you scroll back up. It is a change of colour, not movement, so it
   stays under reduced motion. */
(() => {
  const s = document.getElementById('minimal'), next = document.getElementById('investors') || document.getElementById('testimonials');
  if (!s || !next || !CSS.supports('color', 'color-mix(in srgb, red 50%, white)')) return;
  let raf = 0, last = -1;
  const paint = () => {
    raf = 0;
    const top = next.getBoundingClientRect().top;
    const t = Math.max(0, Math.min(1, (innerHeight - top) / (innerHeight * 0.6)));
    const k = Math.round(t * 1000) / 10;
    if (k === last) return;
    last = k;
    s.style.setProperty('--mn-bg-now', `color-mix(in srgb, var(--dt-white) ${k}%, var(--mn-bg))`);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(paint); };
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  paint();
})();

/* "We love building for small businesses." (Figma 466:814): six quote cards on a rail that drifts slowly right to left
   on its own (Sree, 2026-11-03: "keep moving slightly, very slowly"). No photos and no flip (2026-11-05). No buttons.
   - The six cards are followed by one copy of themselves, hidden from screen readers, so the drift never runs out:
     when the row has travelled one full set, it steps back by exactly that much, which looks identical.
   - Pausing: with the pointer on a card the drift eases to a stop, and eases back up when the pointer leaves. Keyboard
     focus inside the rail and a drag pause it too. A drag or swipe moves the rail by hand; the drift picks up from
     wherever it is let go.
   - Entry: the first cards rise in one after another. Uses `transform` on the cards; the hover lift is `translate`
     (CSS), so they never fight.
   Reduced motion: no drift, no entry; the rail scrolls sideways by hand. */
(() => {
  const s = document.getElementById('testimonials');
  if (!s) return;
  const D = window.DTM || {};
  const reduced = D.reduced ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  const view = s.querySelector('.tm-view'), row = s.querySelector('.tm-row'), rail = s.querySelector('.tm-rail');
  if (!view || !row || !rail) return;
  const ease = 'cubic-bezier(.23,1,.32,1)';
  const spring = d => (D.spring ? D.spring(d) : { easing: ease, duration: d });

  if (reduced) {
    // no drift: the six cards sit in a row the reader scrolls sideways
    view.style.overflowX = 'auto'; view.style.cursor = 'auto';
    return;
  }

  // ---- the copy that keeps the drift going ----
  const originals = [...row.children], N = originals.length;
  originals.forEach(c => {
    const x = c.cloneNode(true);
    x.setAttribute('aria-hidden', 'true');
    x.tabIndex = -1;
    row.appendChild(x);
  });
  const cards = [...row.children];

  // ---- geometry ----
  let setW = 0;
  const measure = () => { setW = cards[N].offsetLeft - cards[0].offsetLeft; };

  // ---- the drift ----
  const SPEED = -22;                     // px a second: slow enough to read a card as it passes
  let x = 0, v = 0, last = 0, raf = 0;
  let inView = false, overCard = false, focus = false, dragging = false, started = false;
  const wrap = () => { if (setW) { while (x <= -setW) x += setW; while (x > 0) x -= setW; } };
  const place = () => { row.style.transform = `translateX(${x.toFixed(2)}px)`; };
  const want = () => (started && inView && !document.hidden && !overCard && !focus && !dragging ? SPEED : 0);
  const frame = now => {
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    const target = want();
    v += (target - v) * (1 - Math.exp(-dt * 5));        // ease toward the target speed: a soft stop, a soft start
    if (Math.abs(v) < 0.01 && target === 0) v = 0;
    if (!dragging) { x += v * dt; wrap(); place(); }
    raf = inView && !document.hidden && (v !== 0 || target !== 0 || dragging) ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  const kick = () => { if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame); };

  cards.forEach(c => {
    c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { overCard = true; kick(); } });
    c.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') { overCard = false; kick(); } });
  });
  rail.addEventListener('focusin', () => { focus = true; kick(); });
  rail.addEventListener('focusout', () => { focus = rail.contains(document.activeElement); kick(); });
  document.addEventListener('visibilitychange', kick);

  // ---- drag / swipe ----
  let startX = 0, baseX = 0, moved = false, pid = null;
  view.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    pid = e.pointerId; startX = e.clientX; baseX = x; moved = false;
  });
  view.addEventListener('pointermove', e => {
    if (e.pointerId !== pid) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) < 6) return;
    if (!moved) { moved = true; dragging = true; view.classList.add('is-dragging'); try { view.setPointerCapture(pid); } catch (_) {} kick(); }
    x = baseX + dx; wrap(); place();
  });
  const end = e => {
    if (e.pointerId !== pid) return;
    pid = null; dragging = false; view.classList.remove('is-dragging');
    // a touch has no hover to end, so the drift comes back once the finger lifts
    if (e.pointerType !== 'mouse') overCard = false;
    kick();
    setTimeout(() => { moved = false; }, 0);
  };
  view.addEventListener('pointerup', end);
  view.addEventListener('pointercancel', end);
  view.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

  // ---- entry, then the drift ----
  measure(); place();
  addEventListener('resize', () => { measure(); wrap(); place(); });
  const first = cards.slice(0, 4);
  first.forEach(c => { c.style.opacity = 0; });
  new IntersectionObserver(es => {
    inView = es[0].isIntersecting;
    if (inView && !rail.dataset.entered) {
      rail.dataset.entered = '1';
      measure();
      first.forEach((c, k) => {
        const sp = spring(760);
        c.style.opacity = '';
        c.animate([{ opacity: 0, transform: 'translateY(32px) scale(.98)' }, { opacity: 1, transform: 'none' }],
          { duration: sp.duration, easing: sp.easing, delay: k * 90, fill: 'backwards' });
      });
      setTimeout(() => { started = true; kick(); }, 1100);
    }
    kick();
  }, { threshold: 0.2 }).observe(rail);
})();

/* Investors tiles: on hover the warm glow sits under the pointer and eases after it as it moves (the customers' large
   tile does the same). Without a fine pointer, or under reduced motion, the glow stays centred. */
(() => {
  const s = document.getElementById('investors');
  if (!s || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const reduced = window.DTM && window.DTM.reduced;
  s.querySelectorAll('.homepage-investors_tile').forEach(t => {
    const g = t.querySelector('.homepage-investors_glow');
    const at = (x, y) => { g.style.transform = `translate(${x}px, ${y}px)`; };
    const centre = () => at(t.clientWidth / 2, t.clientHeight / 2);
    centre();
    if (reduced) return;
    t.addEventListener('pointerenter', e => { const r = t.getBoundingClientRect(); g.style.transitionDuration = '420ms, 0ms'; at(e.clientX - r.left, e.clientY - r.top); requestAnimationFrame(() => { g.style.transitionDuration = ''; }); });
    t.addEventListener('pointermove', e => { const r = t.getBoundingClientRect(); at(e.clientX - r.left, e.clientY - r.top); });
    addEventListener('resize', () => { if (!t.matches(':hover')) centre(); });
  });
})();


/* First fold (Sree, 2026-11-11 / 11-12): the hero opens on the whole team, four photos pinned loosely with their names
   (option E, "Mood board"). Then each teammate takes a turn, Rachel -> Raj -> Sally -> Alex, and the team comes back.
   - To a turn: the others drift off and fade, staggered by distance; the one on turn straightens and opens into the
     portrait card: its frame un-tilts and un-zooms, its picture's window opens and its warm ground grows, all on one
     critically damped spring (no bounce, no linear moves). Where it lands it is pixel for pixel the portrait card, so
     the hand-over to the real card is invisible; the card behind, the card in front and the quote follow it in.
   - Turn to turn: the existing hand-over (the teammate changes first, the cards and the quote follow, 110-300ms apart).
   - Back to the team: the reverse; the card closes back into its photo while the others drift back in.
   - Geometry moves on transforms and clip masks only, never layout, so it stays on the compositor.
   - It runs only while the hero is on screen and holds while the pointer is over the art; a headline avatar brings
     its teammate forward. Under reduced motion the team stays on, and an avatar shows its teammate without motion. */
(() => {
  const s = document.getElementById('hero');
  const art = s && s.querySelector('.homepage-hero_art');
  if (!art || !window.DTM) return;
  const { spring, E } = window.DTM;
  const reduced = window.DTM.reduced;
  const hz = s.querySelector('.homepage-hero_component');
  const avs = [...s.querySelectorAll('.homepage-hero_av')];
  const slots = [...art.querySelectorAll('.homepage-hero_fl:not(.homepage-hero_fl-intro) .homepage-hero_mag')].map(m => ({ m, st: [...m.querySelectorAll(':scope > .homepage-hero_st')], portrait: !!m.closest('.homepage-hero_fl-portrait') }));
  const names = [...art.querySelectorAll('.homepage-hero_name')];
  const pbg = art.querySelector('.homepage-hero_pbg');
  const tiles = [...art.querySelectorAll('.homepage-hero_pt-o')].map(o => {
    const g = JSON.parse(o.dataset.g);
    return { o, g, pt: o.querySelector('.homepage-hero_portrait'), bg: o.querySelector('.homepage-hero_pt-bg'), cut: o.querySelector('.homepage-hero_pt-cut'), tag: o.querySelector('.homepage-hero_pt-tag') };
  });
  const N = 4;
  // a tile's two poses: pinned on the board, and opened into the portrait card
  const pose = (t, open) => open ? {
    pt: { transform: 'translate(0px,0px) rotate(0deg) scale(1)' },
    cut: { clipPath: 'inset(-220px -220px 0px -220px round 16px)' },
    bg: { transform: 'translate(0px,0px) scale(1,1)', borderRadius: '16px / 16px' },
  } : {
    pt: { transform: `translate(${t.g.tx}px,${t.g.ty}px) rotate(${t.g.rot}deg) scale(${t.g.z})` },
    cut: { clipPath: `inset(${t.g.win[0]}px ${t.g.win[1]}px ${t.g.win[2]}px ${t.g.win[3]}px round ${t.g.r}px)` },
    bg: { transform: `translate(${t.g.bx}px,${t.g.by}px) scale(${t.g.sx},${t.g.sy})`, borderRadius: `${t.g.rx}px / ${t.g.ry}px` },
  };
  const cancel = el => el.getAnimations().forEach(a => a.cancel());
  // morph a tile between its poses; resolves when the spring has settled
  function morph(t, open, delay = 0) {
    const sp = spring(reduced ? 1 : 900), from = pose(t, !open), to = pose(t, open), opt = { duration: reduced ? 1 : sp.duration, easing: sp.easing, delay, fill: 'both' };
    [t.pt, t.cut, t.bg].forEach(cancel);
    return Promise.all([t.pt.animate([from.pt, to.pt], opt).finished, t.cut.animate([from.cut, to.cut], opt).finished, t.bg.animate([from.bg, to.bg], opt).finished]);
  }
  // which way a photo drifts when it leaves: out from the board's centre
  const away = t => { const cx = t.g.tx + t.g.ox - 175, cy = t.g.ty + t.g.oy - 120, d = Math.hypot(cx, cy) || 1; return [cx / d * 26, cy / d * 26]; };
  function leave(t, delay) {
    const [dx, dy] = away(t), sp = spring(700);
    cancel(t.o);
    t.o.animate([{ transform: 'none' }, { transform: `translate(${dx}px,${dy}px) scale(.92)` }], { duration: reduced ? 1 : sp.duration, easing: sp.easing, delay, fill: 'forwards' });
    return t.o.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduced ? 1 : 380, easing: E.out, delay, fill: 'forwards' }).finished;
  }
  function arrive(t, delay) {
    const [dx, dy] = away(t), sp = spring(900);
    cancel(t.o); t.o.classList.remove('is-gone');
    t.o.animate([{ transform: `translate(${dx}px,${dy}px) scale(.92)` }, { transform: 'none' }], { duration: reduced ? 1 : sp.duration, easing: sp.easing, delay, fill: 'backwards' });
    t.o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: reduced ? 1 : 460, easing: E.out, delay, fill: 'backwards' });
  }
  const tag = (t, show, delay = 0) => { cancel(t.tag); t.tag.animate([{ opacity: show ? 0 : 1 }, { opacity: show ? 1 : 0 }], { duration: reduced ? 1 : (show ? 360 : 200), easing: E.out, delay, fill: 'both' }); };
  // the teammate's own states, in every slot but the portrait (that one is handed over instantly)
  const states = (i, v, { portrait = false } = {}) => slots.forEach(sl => {
    if (sl.portrait !== portrait) return;
    const el = sl.st[i];
    if (v) { el.classList.remove('is-out'); void el.offsetWidth; el.classList.add('is-on'); }
    else if (el.classList.contains('is-on')) { el.classList.remove('is-on'); el.classList.add('is-out'); setTimeout(() => el.classList.remove('is-out'), 560); }
  });
  const snap = (els, fn) => { els.forEach(e => e.classList.add('homepage-hero_snap')); fn(); void art.offsetWidth; requestAnimationFrame(() => els.forEach(e => e.classList.remove('homepage-hero_snap'))); };
  const lightAll = v => avs.forEach((a, k) => { a.classList.toggle('is-on', v === -1 || k === v); a.setAttribute('aria-pressed', v === -1 || k === v ? 'true' : 'false'); });

  let cur = -1, busy = false;   // -1: the team
  async function toTeammate(i) {
    busy = true; lightAll(i);
    tiles.forEach((t, k) => { if (k !== i) leave(t, Math.abs(k - i) * 45); });
    const t = tiles[i];
    tag(t, false);
    t.o.classList.add('is-still');                                // settles in 420ms, well inside the morph
    cancel(t.o); t.o.classList.remove('is-gone'); t.o.style.zIndex = 2;
    setTimeout(() => states(i, true), reduced ? 0 : 420);       // the cards and the quote follow it in
    await morph(t, true);
    // landed: the real portrait card takes over, frame for frame the same
    const portrait = slots.find(sl => sl.portrait).st[i];
    snap([portrait, pbg], () => { portrait.classList.add('is-on'); hz.classList.remove('is-group'); });
    names.forEach((n, k) => n.classList.toggle('is-on', k === i));
    t.o.classList.add('is-gone'); t.o.style.zIndex = '';
    // put the hidden photo back on the board, ready for the team's return
    [t.pt, t.cut, t.bg].forEach(cancel);
    const closed = pose(t, false);
    Object.assign(t.pt.style, closed.pt); Object.assign(t.cut.style, closed.cut); Object.assign(t.bg.style, closed.bg);
    tiles.forEach((o, k) => { if (k !== i) o.o.classList.add('is-gone'); });
    cur = i; busy = false;
  }
  async function toTeam() {
    const i = cur; busy = true; lightAll(-1);
    const t = tiles[i], portrait = slots.find(sl => sl.portrait).st[i];
    // the portrait card becomes its photo again, in place, then closes back onto the board
    cancel(t.o); t.o.classList.remove('is-gone'); t.o.style.zIndex = 2;
    [t.pt, t.cut, t.bg].forEach(cancel);
    const open = pose(t, true);
    Object.assign(t.pt.style, open.pt); Object.assign(t.cut.style, open.cut); Object.assign(t.bg.style, open.bg);
    snap([portrait, pbg], () => { portrait.classList.remove('is-on'); hz.classList.add('is-group'); });
    names.forEach(n => n.classList.remove('is-on'));
    states(i, false);
    tiles.forEach((o, k) => { if (k !== i) arrive(o, 240 + Math.abs(k - i) * 70); });
    const done = morph(t, false, 80);
    t.o.classList.remove('is-still');                             // the float grows back from zero as it closes
    tiles.forEach((o, k) => tag(o, true, k === i ? 760 : 620 + Math.abs(k - i) * 70));
    await done;
    const closed = pose(t, false);
    Object.assign(t.pt.style, closed.pt); Object.assign(t.cut.style, closed.cut); Object.assign(t.bg.style, closed.bg);
    t.o.style.zIndex = ''; cur = -1; busy = false;
  }
  function turn(i) {
    if (i === cur) return;
    const prev = cur; cur = i; lightAll(i);
    states(prev, false); states(prev, false, { portrait: true });
    states(i, true); states(i, true, { portrait: true });
    names.forEach((n, k) => n.classList.toggle('is-on', k === i));
  }
  const go = i => (busy ? null : cur === -1 ? (i === -1 ? null : toTeammate(i)) : i === -1 ? toTeam() : turn(i));

  // the loop: the team, Rachel, Raj, Sally, Alex, the team…
  const HOLD_TEAM = 3600, HOLD_ONE = 5000;
  let timer = 0, hover = false, visible = false;
  const next = () => (cur === -1 ? 0 : cur === N - 1 ? -1 : cur + 1);
  const schedule = () => { clearTimeout(timer); if (!reduced && visible && !hover && !document.hidden) timer = setTimeout(async () => { if (!busy) await go(next()); schedule(); }, cur === -1 ? HOLD_TEAM : HOLD_ONE); };
  avs.forEach((a, k) => a.addEventListener('click', async () => { if (busy) return; clearTimeout(timer); await go(cur === k ? -1 : k); schedule(); }));
  art.addEventListener('pointerenter', () => { hover = true; clearTimeout(timer); });
  art.addEventListener('pointerleave', () => { hover = false; schedule(); });
  document.addEventListener('visibilitychange', schedule);

  // first sight: the four photos land on the board one after another
  let entered = reduced;
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && !entered) {
      entered = true;
      tiles.forEach((t, k) => {
        const sp = spring(1000);
        t.o.animate([{ transform: 'translateY(28px) scale(.94)' }, { transform: 'none' }], { duration: sp.duration, easing: sp.easing, delay: 120 + k * 90, fill: 'backwards' });
        t.o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: E.out, delay: 120 + k * 90, fill: 'backwards' });
      });
    }
    schedule();
  }, { threshold: .3 }).observe(art);

  // below 1180px the art sits under the copy, scaled to fit the screen
  const fit = () => { const w = s.querySelector('.homepage-hero_component').clientWidth - 32; art.style.setProperty('--hz-zoom', innerWidth < 960 ? Math.min(1, w / 640).toFixed(3) : 1); };
  fit(); addEventListener('resize', fit);
})();

/* "Introducing Dreamteam" (Figma 1134:25078): once the mark has formed and the reader scrolls on, the rep's photo rises
   in and the five cards land around her one by one, each from the side it sits on; the one multi-layered wave behind
   her ripples outward from the photo. Without script or under reduced motion everything sits where Figma has it. */
(() => {
  const s = document.getElementById('product-overview');
  if (!s || !s.classList.contains('is-salescall') || !window.DTM || window.DTM.reduced) return;
  const { move, set } = window.DTM;
  const photo = s.querySelector('.homepage-salescall_photo'), cards = [...s.querySelectorAll('.homepage-salescall_card')], waves = [...s.querySelectorAll('.homepage-salescall_wave')];
  const foot = s.querySelector('.homepage-salescall_foot');
  const wide = matchMedia('(min-width:1100px)').matches;
  if (!wide) return;
  set([photo, ...cards, ...waves, foot], { opacity: 0 });
  let done = false;
  const go = () => {
    if (done) return; done = true;
    move(photo, { opacity: 0, transform: 'translateY(40px) scale(.96)' }, { opacity: 1, transform: 'none' }, { d: 900, fade: 420 });
    waves.slice().reverse().forEach((w, i) => move(w, { opacity: 0, transform: 'scale(.82)' }, { opacity: 1, transform: 'none' }, { d: 1400, fade: 700, delay: 120 + i * 110 }));
    // then one multi-layered wave ripples outward (Sree, 2026-11-11): Figma's five rings each travel out to where the next
    // one sits, taking on its strength, so the whole set flows from the photo without a seam; the innermost fades in from
    // nothing and the outermost fades away. One loop of 100px every 3.2s. Pauses with the section off screen.
    setTimeout(() => {
      const rings = waves.slice().sort((a, b) => a.offsetWidth - b.offsetWidth);
      const R = [160, 260, 360, 460, 560], OP = [.05, .04, .032, .024, .0048], P = 3200;
      const runs = rings.map((w, i) => {
        const s1 = (R[i] + 100) / R[i], end = i < 4 ? OP[i + 1] / OP[i] : 0;
        const frames = i === 0
          ? [{ transform: 'scale(1)', opacity: 0 }, { transform: `scale(${(1 + (s1 - 1) * .3).toFixed(4)})`, opacity: 1, offset: .3 }, { transform: `scale(${s1.toFixed(4)})`, opacity: end }]
          : [{ transform: 'scale(1)', opacity: 1 }, { transform: `scale(${s1.toFixed(4)})`, opacity: end }];
        return w.animate(frames, { duration: P, iterations: Infinity, easing: 'linear' });
      });
      new IntersectionObserver(es => runs.forEach(a => (es[es.length - 1].isIntersecting ? a.play() : a.pause()))).observe(s.querySelector('.homepage-salescall_waves'));
    }, 1900);
    // landing order: the nearest first, alternating sides
    const order = [1, 0, 3, 2, 4];
    order.forEach((k, n) => {
      const c = cards[k], left = parseFloat(getComputedStyle(c.closest('.homepage-salescall_fl')).left) < 720;
      move(c, { opacity: 0, transform: `translate(${left ? -36 : 36}px, 24px) scale(.94)`, filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }, { d: 820, fade: 340, delay: 380 + n * 120 });
    });
    const risk = s.querySelector('.homepage-salescall_risk');
    if (risk) move(risk, { transform: 'scaleX(0)' }, { transform: 'none' }, { d: 900, delay: 1100 });
    move(foot, { opacity: 0, transform: 'translateY(24px)', filter: 'blur(6px)' }, { opacity: 1, transform: 'none', filter: 'blur(0px)' }, { d: 700, fade: 360, delay: 900 });
  };
  // the photo arrives once it is well up the screen, after the pinned mark has let go
  const check = () => { if (photo.getBoundingClientRect().top < innerHeight * .62) { go(); removeEventListener('scroll', check); } };
  addEventListener('scroll', check, { passive: true }); check();
})();

/* Floating cards (Sree, 2026-11-11): the hero's teammate cards and the five cards around the rep drift at their own
   depth as the page scrolls, so they read as layers floating over the page. Parallax moves each card's outer layer on
   `translate`, so it never fights the entry and turn animations on `transform` or the tilt on `rotate`. The magnet pull
   was tried and dropped (Sree, 2026-11-11: "too much"). Reduced motion: none. */
(() => {
  if (!window.DTM || window.DTM.reduced) return;
  // ---- parallax: depth is px of drift across one pass of the card through the screen ----
  const layers = [...document.querySelectorAll('.homepage-hero_fl[data-depth], #hero .hz-fl[data-depth], .homepage-salescall_fl[data-depth]')].map(el => ({ el, depth: +el.dataset.depth, now: 0, target: 0 }));
  if (layers.length) {
    // perf pass: only the cards near the screen are measured, once a frame (in the scroll event, before anything is
    // written), and each moves straight to its place, 1:1 with the scroll, with no easing tail
    let raf = 0, measured = false;
    const active = new Set(layers);
    const measure = () => { measured = true; active.forEach(l => {
      if (l.el.closest('.is-salescall') && innerWidth < 1100) { l.target = 0; return; }
      const r = l.el.getBoundingClientRect(), cy = r.top - l.now + r.height / 2;
      const p = Math.max(-1.2, Math.min(1.2, (innerHeight / 2 - cy) / (innerHeight / 2 + r.height / 2)));
      l.target = -p * l.depth;
    }); };
    const tick = () => {
      raf = 0; measured = false;
      active.forEach(l => { if (Math.abs(l.target - l.now) < .05) return; l.now = l.target; l.el.style.translate = `0 ${l.now.toFixed(2)}px`; });
    };
    const kick = () => { if (!measured) measure(); if (!raf) raf = requestAnimationFrame(tick); };
    if ('IntersectionObserver' in window) {
      active.clear();
      const io = new IntersectionObserver(es => { es.forEach(e => { const l = layers.find(x => x.el === e.target); if (e.isIntersecting) active.add(l); else active.delete(l); }); measured = false; kick(); }, { rootMargin: '50% 0px 50% 0px' });
      layers.forEach(l => io.observe(l.el));
    }
    addEventListener('scroll', kick, { passive: true }); addEventListener('resize', () => { measured = false; kick(); }); kick();
  }
})();

/* On a short screen the pinned visual is shorter than its 558px canvas and the window bleeds off the bottom. Tell the
   CSS how much is lost (--tx-cut) so the pieces at the window's foot ride up and stay whole. Pinned layout only. */
(() => {
  const s = document.querySelector('.section_homepage-teammates'); if (!s) return;
  const vis = s.querySelector('.homepage-teammates_visual');
  const fit = () => {
    const pinned = !s.classList.contains('homepage-teammates_static') && matchMedia('(min-width:1024px)').matches;
    s.style.setProperty('--tx-cut', (pinned ? Math.max(0, Math.round(558 - vis.getBoundingClientRect().height)) : 0) + 'px');
    // a floating card is never cut (Sree, 2026-11-12): if its panel is shorter than where the card ends, lift it
    // until it clears the panel's foot by 32px (room for its 4px bob and its shadow)
    s.querySelectorAll('.homepage-teammates_hl').forEach(hl => {
      const panel = hl.closest('.homepage-teammates_panel'); if (!panel || !hl.offsetParent) return;
      const pr = panel.getBoundingClientRect(), k = pr.height / panel.offsetHeight || 1;
      const parentTop = (hl.offsetParent.getBoundingClientRect().top - pr.top) / k;
      const lifted = parseFloat(hl.style.getPropertyValue('--hl-lift')) || 0;
      const over = parentTop + hl.offsetTop + lifted + hl.offsetHeight + 32 - panel.offsetHeight;
      hl.style.setProperty('--hl-lift', Math.max(0, Math.ceil(over)) + 'px');
    });
  };
  fit(); addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit);
  new ResizeObserver(fit).observe(vis);
  // Raj: the At risk card is the highlight. On hl-on it leaves its row for the window's layer (a same-size gap holds
  // its place), then scales up by 8% and rises only as far as it must to clear the panel's foot by 32px; off, it goes home
  const raj = s.querySelector('.homepage-teammates_tmc-raj'), risk = raj && raj.querySelector('.homepage-teammates_tmr-stat-risk');
  let gap = null;
  const place = () => {
    if (!gap) return;
    const panel = raj.closest('.homepage-teammates_panel'), pr = panel.getBoundingClientRect(), k = pr.height / panel.offsetHeight || 1;
    const ar = raj.getBoundingClientRect(), gr = gap.getBoundingClientRect();
    const left = (gr.left - ar.left) / k, top = (gr.top - ar.top) / k, w = gr.width / k, h = risk.offsetHeight, S = 1.08;
    const aTop = (ar.top - pr.top) / k, aLeft = (ar.left - pr.left) / k;
    Object.assign(risk.style, { left: left + 'px', top: top + 'px', width: w + 'px' });
    const foot = panel.offsetHeight - 32 - aTop, right = panel.offsetWidth - 16 - aLeft;
    const dy = Math.max(16 - aTop - (top + h / 2 - h * S / 2), Math.min(-14, foot - (top + h / 2 + h * S / 2)));
    const dx = Math.min(24, right - (left + w / 2 + w * S / 2));
    risk.style.transform = risk.classList.contains('is-up') ? `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${S})` : 'none';
  };
  const lift = () => {
    if (gap || !risk) return;
    gap = document.createElement('div'); gap.className = 'homepage_tmr-stat-gap'; gap.style.height = risk.offsetHeight + 'px'; gap.style.flex = `0 0 ${risk.offsetWidth}px`;
    risk.replaceWith(gap); raj.appendChild(risk); risk.classList.add('is-lifted');
    place(); risk.getBoundingClientRect();
    risk.classList.add('is-up'); place();
  };
  const drop = () => {
    if (!gap) return;
    risk.classList.remove('is-lifted', 'is-up'); risk.style.left = risk.style.top = risk.style.width = risk.style.transform = '';
    gap.replaceWith(risk); gap = null;
  };
  if (risk) {
    new MutationObserver(() => raj.classList.contains('homepage_hl-on') ? lift() : drop()).observe(raj, { attributes: true, attributeFilter: ['class'] });
    addEventListener('resize', place);
  }
  // and again whenever a card's highlight turns on, so it is measured where it will show
  new MutationObserver(fit).observe(s, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();

/* Investors: the title and the tiles ride a touch faster than the footer's sunset behind them, so they read as a layer
   in front of it (Sree, 2026-11-12). 6% of the distance from the screen's middle, capped at 24px either way: toned down
   from 18% / 80px (Sree, 2026-11-12: "reduce the overall parallax"). */
(() => {
  const sec = document.querySelector('.section_homepage-investors'), inner = sec && sec.querySelector('.homepage-investors_inner');
  if (!inner || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let queued = false;
  const update = () => {
    queued = false;
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    if (r.bottom < -100 || r.top > vh + 100) return;
    const y = Math.max(-24, Math.min(24, (r.top + r.height / 2 - vh / 2) * .06));
    inner.style.transform = `translate3d(0,${y.toFixed(1)}px,0)`;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true }); addEventListener('resize', queue); update();
})();

(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const groups = [
    ['#customers', ['.homepage-customers_title', '.homepage-customers_rail', '.homepage-customers_banner']],
    ['#minimal', ['.homepage-ways_title', '.homepage-ways_card']],
    ['#investors', ['.homepage-investors_title', '.homepage-investors_tile']],
  ];
  groups.forEach(([sel, parts]) => {
    const s = document.querySelector(sel); if (!s) return;
    const els = parts.flatMap(p => [...s.querySelectorAll(p)]);
    els.forEach((el, i) => { el.classList.add('homepage_rv'); el.style.setProperty('--rv-d', i * 90 + 'ms'); });
    new IntersectionObserver((es, io) => {
      if (!es[0].isIntersecting) return;
      io.disconnect(); els.forEach(el => el.classList.add('is-in'));
    }, { rootMargin: '0px 0px -12% 0px' }).observe(s);
  });
})();

/* Production refinements that need a measurement. Alex's chat on a narrow screen: zoomed so its 401px panel fits the
   teammates' panel with 8px to spare on each side (--tmx-pz). */
(() => {
  const s = document.querySelector('.section_homepage-teammates'); if (!s) return;
  const vis = s.querySelector('.homepage-teammates_visual');
  const fit = () => s.style.setProperty('--tmx-pz', innerWidth < 1024 ? Math.min(1, (vis.clientWidth - 16) / 401).toFixed(3) : 1);
  fit(); addEventListener('resize', fit);
})();

/* The teammates' tab row scrolls sideways on a phone: keep the chosen tab in view as the tabs change (by click, by
   keyboard or by the page's own scroll), without moving the page. */
(() => {
  const row = document.querySelector('.section_homepage-teammates .homepage-teammates_tabs'); if (!row) return;
  const show = () => {
    if (row.scrollWidth <= row.clientWidth) return;
    const on = row.querySelector('.homepage-teammates_tab.is-on'); if (!on) return;
    const left = on.offsetLeft - row.offsetLeft - 16, right = left + on.offsetWidth + 32;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth)
      row.scrollTo({ left: Math.max(0, left), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  new MutationObserver(show).observe(row, { subtree: true, attributes: true, attributeFilter: ['class'] });
})();

/* "One CRM. Two ways in.": each card's 512px scene is scaled to fit its window (below 541px the design's own scale
   applies instead). */
(() => {
  const v = document.querySelector('.section_homepage-ways .homepage-ways_vignette'), s = document.querySelector('.section_homepage-ways'); if (!v || !s) return;
  const fit = () => {
    if (innerWidth <= 540) { s.style.removeProperty('--mn-fit'); return; }
    s.style.setProperty('--mn-fit', Math.min(1, v.clientWidth / 512).toFixed(3));
  };
  fit(); addEventListener('resize', fit);
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(v);
})();


/* The hero's ribbon, alive (Sree, 2026-11-13): the band of slats in the hero's bottom-right corner rolls slowly along
   its length, as the ribbon on the Webflow site does, and turns once quickly as the page opens before settling into
   that slow roll. It is the Webflow ribbon's drawing, fitted to this hero's still (/external/cdn.prod.website-files.com/6ae71fd0be66c6cfefaf4a84/6af74b15481c726d57bb43a5_homepage-hero3-spiral.webp): a band of
   slats laid along a spine, seen from a little to one side. Each slat leans along the spine by LEAN and stands out from
   it by how far the band has turned there, so the band narrows to a crossing every half turn and shows its other face
   beyond it. Each slat is a coloured face, a light leading edge, a darker trailing edge and a red cap at one end.
   The still stays in place as the fallback: the canvas fades in over it already in the still's pose, and only then is
   the still put away. With reduced motion, or below 960px where the hero hides it, the still is all there is. */
(() => {
  const still = document.querySelector('.section_homepage-hero .homepage-hero_spiral, #hero .hz-spiral');   // Home: the artifact hero's still (14 Nov)
  if (!still || !('getContext' in document.createElement('canvas'))) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)'), wide = matchMedia('(min-width:960px)');

  /* The still's box is 408 x 288 (hero units); the canvas reaches TOP above it and LEFT to its left, so the rolling band
     (which rises up to ~46 above the box in the open, and ~105 where the right-hand fade starts) never meets an edge.
     Its right and bottom edges are the still's, under the hero's white fades. */
  const BOX_W = 408, BOX_H = 288, LEFT = 24, TOP = 120, CW = BOX_W + LEFT, CH = BOX_H + TOP;
  /* the fitted pose: the drawing (1440 x 1245 units, as on Webflow) is scaled by K, turned by ROT and moved by (TX, TY)
     into the box, at turn TURN0 */
  const K = 0.839, ROT = -0.32, TX = -598.336, TY = 102.396, TURN0 = 3.377;
  const VIEW_W = 1440, PERIOD = 60;   // seconds per full turn of the slow roll
  const CURVE = [-72.86, -455.252, 227.401, 149.811, -408.1, 493.57];   // the spine's height, in (x - 720) / 720
  const STEP = 11.3, REACH = 340;
  const LEAN = -143.744, SWAY = 34.605, SPREAD_C = -155.779, SPREAD_S = -153.37, HALF = 393.413, PHASE = 1.361, TIGHTEN = -0.84;
  const CAP = 3, CREAM_W = .6;
  const FRONT = 'rgb(167, 139, 250)', BACK = 'rgb(208, 191, 255)', CREAM = 'rgb(237, 233, 254)', RIM = 'rgb(139, 92, 246)';
  const CAP_FRONT = 'rgb(110, 63, 243)', CAP_BACK = 'rgb(79, 38, 199)';
  const MOST = Math.hypot(SPREAD_C, SPREAD_S);

  const heightAt = x => { const t = (x - VIEW_W / 2) / (VIEW_W / 2); let y = 0; for (const c of CURVE) y = y * t + c; return y; };
  /* one slat every STEP along the spine, out from the middle both ways; only those that can reach the canvas are kept */
  const slats = (() => {
    const walk = dir => {
      const list = [];
      for (let at = VIEW_W / 2, s = 0; at >= -REACH && at <= VIEW_W + REACH; s += dir * STEP) {
        const e = 2, dx = 2 * e, dy = heightAt(at + e) - heightAt(at - e), l = Math.hypot(dx, dy) || 1;
        list.push({ x: at, y: heightAt(at), tx: dx / l, ty: dy / l, s });
        at += dir * STEP * dx / l;
      }
      return list;
    };
    const all = walk(-1).slice(1).reverse().concat(walk(1)).reverse();
    const c = Math.cos(ROT), s = Math.sin(ROT), reach = (Math.abs(LEAN) + Math.abs(SWAY) + MOST) / 2 + 20;
    return all.filter(sl => {
      const bx = TX + K * (c * sl.x - s * sl.y) + LEFT, by = TY + K * (s * sl.x + c * sl.y) + TOP, r = reach * K;
      return bx > -r && bx < CW + r && by > -r && by < CH + r;
    });
  })();

  const canvas = document.createElement('canvas');
  canvas.className = 'homepage-hero_ribbon';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function draw(turn) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const z = canvas.width / CW;
    ctx.setTransform(z, 0, 0, z, 0, 0);
    ctx.translate(LEFT + TX, TOP + TY); ctx.rotate(ROT); ctx.scale(K, K);
    ctx.lineJoin = 'round';
    const thick = STEP;
    for (const sl of slats) {
      const far = sl.s / 720, th = PHASE + Math.PI * sl.s / HALF + TIGHTEN * far * far * far + turn, c = Math.cos(th), s = Math.sin(th);
      const along = LEAN + SWAY * s, across = SPREAD_C * c + SPREAD_S * s, nx = -sl.ty, ny = sl.tx;
      const vx = along * sl.tx + across * nx, vy = along * sl.ty + across * ny;
      const x0 = sl.x - vx / 2, y0 = sl.y - vy / 2, x1 = x0 + vx, y1 = y0 + vy, ex = -sl.tx * thick, ey = -sl.ty * thick;
      /* across the spine one way shows the front of the band, the other way its back; edge-on, its light edge widens */
      const front = across > 0, edgeOn = 1 - Math.abs(across) / MOST;
      ctx.fillStyle = front ? FRONT : BACK;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1 + ex, y1 + ey); ctx.lineTo(x0 + ex, y0 + ey); ctx.closePath(); ctx.fill();
      if (front) { ctx.strokeStyle = RIM; ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(x1 + ex, y1 + ey); ctx.lineTo(x0 + ex, y0 + ey); ctx.stroke(); }
      ctx.strokeStyle = CREAM; ctx.lineWidth = (2.6 + 2.2 * edgeOn * edgeOn * edgeOn) * CREAM_W;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      const len = Math.hypot(vx, vy) || 1, ux = vx / len * CAP, uy = vy / len * CAP;
      ctx.fillStyle = front ? CAP_FRONT : CAP_BACK;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + ux, y0 + uy); ctx.lineTo(x0 + ux + ex, y0 + uy + ey); ctx.lineTo(x0 + ex, y0 + ey); ctx.closePath(); ctx.fill();
    }
  }

  /* the canvas's pixels follow its size on screen (the hero is zoomed to fit), at up to twice the screen's density */
  function size() {
    const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d));
    if (w === canvas.width && h === canvas.height) return false;
    canvas.width = w; canvas.height = h;
    return true;
  }

  /* the slow roll, plus one extra full turn over SPIN ms as the page opens: fast at first, slowing until only the roll
     is left, so it lands exactly where the roll alone would have put it */
  const SPIN = 1250;
  let t0 = 0, spinFrom = 0, visible = false, running = false, last = -Infinity, live = false;
  const spun = now => { const left = 1 - (now - spinFrom) / SPIN; return !spinFrom || left <= 0 ? 0 : Math.PI * 2 * (1 - left * left * left); };
  const turnAt = now => TURN0 + Math.PI * 2 * ((now - t0) / 1000) / PERIOD + spun(now);
  const GAP = 1000 / 30;   // the slow roll is smooth at 30 frames a second; the fast turn draws every frame
  function frame(now) {
    if (!visible || !live) { running = false; return; }
    if (now - last >= (now < spinFrom + SPIN ? 0 : GAP - 2)) { last = now; draw(turnAt(now)); }
    requestAnimationFrame(frame);
  }
  const wake = () => { if (!running && visible && live) { running = true; requestAnimationFrame(frame); } };

  let watched = false, hideAt = 0;
  function watch() {
    if (watched) return;
    watched = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; wake(); }).observe(canvas);
    else visible = true;
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (live && size()) draw(turnAt(performance.now())); }).observe(canvas);
  }
  /* once the canvas covers it, the still is put away and the fast turn begins (on the fade's end, or after it at the
     latest, in case no transition runs) */
  function covered() {
    clearTimeout(hideAt);
    if (!live || still.style.visibility === 'hidden') return;
    still.style.visibility = 'hidden';
    spinFrom = performance.now();
    wake();
  }
  canvas.addEventListener('transitionend', e => { if (e.propertyName === 'opacity' && canvas.classList.contains('is-live')) covered(); });

  function start() {
    if (live || reduce.matches || !wide.matches) return;
    still.after(canvas);
    size();
    t0 = performance.now();
    draw(TURN0);   // the still's own pose, so the fade-in shows no change
    live = true;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!live) return;
      canvas.classList.add('is-live');
      hideAt = setTimeout(covered, 800);
    }));
    watch();
    wake();
  }
  /* back to the still if motion is turned off, or the hero goes narrow (where it hides the ribbon altogether) */
  function stop() {
    if (!live) return;
    live = false; spinFrom = 0;
    clearTimeout(hideAt);
    still.style.visibility = '';
    canvas.classList.remove('is-live');
    canvas.remove();
  }
  const check = () => (reduce.matches || !wide.matches ? stop() : start());
  [reduce, wide].forEach(m => m.addEventListener ? m.addEventListener('change', check) : m.addListener(check));
  check();
})();



/* 16 Nov: the stacked hero (below 1180px) lines its copy up with the header logo; --nav-x is the logo's left edge. */
(() => {
  const set = () => { const l = document.querySelector('.nav_logo'); if (l) document.documentElement.style.setProperty('--nav-x', Math.round(l.getBoundingClientRect().left) + 'px'); };
  set(); addEventListener('resize', set); addEventListener('load', set);
})();
