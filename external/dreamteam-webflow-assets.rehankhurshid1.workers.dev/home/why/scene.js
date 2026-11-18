/* 16 Nov: now includes the phone patches (cards off on phones, the phone line) and the flick fix (shared/perf/patches/ios-2026-11-16c);
   Home's footer loads this file again instead of the temporary Webflow copy. */
/* Home, problem → "Meet Dreamteam" transition. Moved out of its Webflow embed on 16 Nov so it is edited and deployed here
   (~/Desktop/dreamteam-webflow-assets, npx wrangler deploy). The embed on the Home page now only points to this file. */
/* Dreamteam problem to memory transition.
   The problem section pins while its clutter is pulled into one point and sinks out of focus and the copy blurs away.
   The memory section is held in place over it: the Dreamteam mark starts to grow out of the point the clutter is
   pulled into, and once the clutter is gone the page dims to the memory section's dark the way it lights up further
   down, in one short fade that runs on its own once started; then the threads draw in from both edges to the mark,
   the outermost first, one after another, the mark pulsing as they arrive, and the copy settles in, all playing through
   to the end on their own once started.
   That is the first of two stops on the dark; one scroll from there plays the change to the second on its own: the
   copy steps aside, the mark and its threads rise, four paths run out of the mark, each agent arrives at the end of
   its path, and the group lifts a little as the agents' copy settles in under them. A scroll made while a change is
   playing, and whatever is left of a flick that has landed, is held back so no stop gets skipped; one more scroll
   past either end carries on along the page.
   Once the problem section is held, one scroll glides the page through the whole transition to the dark (and back).
   Without the script, or with reduced motion, the sections simply follow each other with the agents and their copy
   under the memory copy.
   On a phone the clutter sits along the bottom of the screen, wider than it, and the scroll slides it right to left to
   show the rest before pulling it in. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;
  var stage = document.querySelector('.home-problem_component');
  var memory = document.querySelector('.home-memory_component');
  var iris = stage && stage.querySelector('.home-problem_iris');
  if (!stage || !memory || !iris || !window.CSS || !CSS.supports('translate', '1px')) return;

  var PIN = 1, STOP = 1; /* scroll distance of the transition, and between the stops on the dark, in viewport heights (PIN was 1.4 until 8 Nov: shortened on client review) */
  /* Last piece onto the table is the first one pulled away; the shadows under the pile go as soon as anything lifts */
  var ORDER = ['is-contact', 'is-event', 'is-sheet', 'is-calendar', 'is-chat', 'is-zoom', 'is-gmail', 'is-crm', 'is-contacts', 'is-sticky', 'is-envelope'];
  /* The mark appears at MARK_AT, a share of the problem stretch: while the copy is still blurring away and the clutter
     is still being pulled into it, so the screen is never left empty. The clutter is gone by GONE, and only then, at
     DARK_AT, does the page fade to the memory section's dark (read from that section); it goes back to light only once
     scrolled back past BRIGHTEN, so resting near the line can't make it flicker, and the clutter has not come back by
     then. The fade takes FADE ms whatever the scroll does, like the light change further down; the memory section stays
     see-through until the fade has finished */
  var MARK_AT = 0.52, GONE = 0.88, DARK_AT = 0.92, BRIGHTEN = 0.9, FADE = 500, CURVE = 'cubic-bezier(0.4, 0, 0.2, 1)';
  /* 16 Nov (desktop, why stop on): the change to the dark is one scrubbed sequence instead of a timed fade. The copy
     clears first (COPY_OUT), the clutter is drawn into the point and each piece fades as it arrives, the mark grows out
     of that point (MARK_AT), and the dark comes up over the whole screen with the scroll (IRIS: an eased fade; a
     circle opening out of the mark was tried and dropped, Rehan 16 Nov) */
  var IRIS = window.DT_ENGINE ? [0.52, 0.9] : null, COPY_OUT = IRIS ? [0.04, 0.4] : [0.16, 0.68];
  if (IRIS) { MARK_AT = 0.3; DARK_AT = IRIS[1]; }
  /* The threads come out of the mark once the scroll reaches THREADS_AT, and then play through on their own over WEAVE
     ms, so stopping the scroll never leaves them part drawn; scrolled back above THREADS_BACK they wind back into the
     mark, quicker, over UNWEAVE ms. */
  /* 16 Nov: from 0.99 / 0.96, so the threads start while the glide is still settling in (with the dark), instead of
     after it lands, which left the mark alone on an empty screen for ~1.5s */
  var THREADS_AT = window.DT_ENGINE ? 0.72 : 0.93, THREADS_BACK = window.DT_ENGINE ? 0.68 : 0.9, DRAW = 950, SPREAD = 650, WEAVE = DRAW + SPREAD, UNWEAVE = 600;
  /* 9 Nov: the threads no longer turn in as a ribbon, streak in or scale out. They draw themselves in from their outer
     ends to the mark in BANDS groups, each over DRAW ms and each a step later than the last (SPREAD ms from first to
     last): the outermost threads first and the ones near the middle later, with a little scatter so neighbours don't
     march together, so they join the mark one after another (see draw below). Each group's edge is soft, FEATHER of the
     fan's width. The two strands of light at the mark come up with the last group, and at PULSE_AT of the run the mark
     gives one soft pulse */
  var BANDS = 6, FEATHER = 0.14;
  var PULSE_AT = 0.86;
  /* The memory copy settles in over the last COPY_FROM of the threads' run. The change to the agents takes AGENTS ms,
     and BACK of that on the way back up. Scrolled by something other than a wheel, key or swipe (a scrollbar, the
     tail of a flick on a phone), NUDGE of the way to a stop sends its change on its way */
  var COPY_FROM = window.DT_ENGINE ? 0.25 : 0.5, AGENTS = 2200, BACK = 0.7, NUDGE = 0.3, LAST = 1;
  /* 8 Nov: the agents and their copy are one stop (the third state): the paths and agents take the first AGENTS_TO of the
     change, the group lifts and the copy settles in from TEAM_FROM */
  var AGENTS_TO = 0.62, TEAM_FROM = 0.5;
  function cast() { renderAgents(span(flow, 0, AGENTS_TO), span(flow, TEAM_FROM, 1)); }
  /* The problem stretch is a stop too (8 Nov): once the problem section is held, one scroll (wheel, key or swipe) glides
     the page through the whole transition to the first stop on the dark in GLIDE ms, and back up in GLIDE_BACK ms, so the
     scrubbed transition still plays with the page moving, but a fast flick can't run past the dark state */
  var GLIDE = 1600, GLIDE_BACK = 1100;
  /* On a phone the section fills the screen and, once it is held there, the scroll slides the clutter right to left until
     its far end (the width of its pile) is in view: PAN px of scroll for each px it slides, the pieces in front a little
     further than the ones behind (DRIFT). On a short screen the space closes up to TOP above the copy, GAP under it and
     FOOT under the clutter (in rem), and only then does the clutter shrink to fit */
  var PHONE = window.matchMedia('(max-width: 479px)'), PAN = 3, TOP = 3, GAP = 1.5, FOOT = 1.25;
  var DRIFT = { 'is-envelope': 0.8, 'is-gmail': 0.9, 'is-event': 0.95, 'is-zoom': 1.05, 'is-sticky': 1.08, 'is-calendar': 1.1, 'is-contact': 1.05, 'is-sheet': 1.12, 'is-chat': 1.1 };
  /* The agents state as drawn at full size: the mark is 125.115 wide, its paths start this far up under it and run on
     behind each agent's frame, PATH_END past the frame's top, this far below it; the agents' copy sits TEAM_GAP under
     them once the group has lifted by LIFT. On the first stop the mark sits at HOME of the screen height, and with the
     agents the group sits ABOVE of it over the middle of the screen */
  var MARK = 125.115, PATH_START = 32, PATH_END = 107, AGENTS_GAP = 168, TRACK = 15, TEAM_GAP = 88, LIFT = 87, HOME = 0.56,   /* 16 Nov (Sree): 0.462 -> 0.56, the copy and mark sit lower on the first stop */ ABOVE = 0.049;

  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function span(p, a, b) { return clamp((p - a) / (b - a)); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(2 - 2 * t, 3) / 2; }
  function out(t) { return 1 - Math.pow(1 - t, 3); }

  var section = stage.parentNode, memorySection = memory.parentNode;
  var content = stage.querySelector('.home-problem_content');
  var grid = stage.querySelector('.home-problem_grid');
  var piles = Array.prototype.slice.call(stage.querySelectorAll('.home-problem_pile'));
  var fans = memory.querySelectorAll('.home-memory_fan');
  var logo = memory.querySelector('.home-memory_logo');
  /* The mark is the first thing on the dark, so it can't be left to load once it is needed */
  if (logo) logo.loading = 'eager';
  var arrival = memory.querySelector('.home-memory_content');
  var visualBox = memory.querySelector('.home-memory_visual');
  var agents = memory.querySelector('.home-memory_agents');
  var team = memory.querySelector('.home-memory_team');
  /* While the agents are on stage the group may rise past the top of the section, over the same dark, so the section
     only clips sideways when the browser can do that */
  var spill = CSS.supports('overflow-x', 'clip');

  /* Extra scroll track after each pinned component; the sections themselves keep no size of their own */
  function track(parent) {
    var el = document.createElement('div');
    el.setAttribute('aria-hidden', 'true');
    parent.appendChild(el);
    return el;
  }
  var spacer = track(section), memorySpacer = track(memorySection);

  /* The paths from the mark to each agent, drawn under the threads: a dark track with a thin line of light down its middle */
  var NS = 'http://www.w3.org/2000/svg', paths = null, links = [];
  function svg(name, attrs, parent) {
    var el = document.createElementNS(NS, name);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(el);
    return el;
  }
  if (agents && visualBox) {
    paths = svg('svg', { 'class': 'home-memory_paths', 'aria-hidden': 'true', focusable: 'false' });
    paths.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none';
    var light = svg('linearGradient', { id: 'home-memory-path-light', gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 }, svg('defs', {}, paths));
    svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, light);
    svg('stop', { offset: 1, 'stop-color': '#fff' }, light);
    memory.insertBefore(paths, visualBox);
    Array.prototype.forEach.call(agents.querySelectorAll('.home-memory_agent'), function (card) {
      var g = svg('g', {}, paths), drawn = { fill: 'none', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 };
      drawn.stroke = '#252525';
      var trackPath = svg('path', drawn, g);
      drawn.stroke = 'url(#home-memory-path-light)';
      links.push({ card: card, frame: card.querySelector('.home-memory_agent-frame') || card, group: g, track: trackPath, line: svg('path', drawn, g) });
    });
  }

  /* 8 Nov: on the first stop the screen under the copy was empty and read as the end of the page. A hint of the agents'
     paths now runs on below it: one line from under the copy that splits into four toward where the agents will be and
     fades out past the bottom of the screen, with light running down it now and then. It draws in as the copy settles
     and turns into the real paths as the agents come on (see morphTeaser) */
  var teaser = null, teaserFades = [], teaserLines = [], teaserAnims = [], teaserOn = false;
  if (paths) {
    teaser = svg('svg', { 'class': 'home-memory_teaser', 'aria-hidden': 'true', focusable: 'false' });
    teaser.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;opacity:0';
    var tdefs = svg('defs', {}, teaser);
    /* 16 Nov (Sree, "doesn't feel continuous"): the line no longer fades out on its way down; it runs at full strength
       off the bottom of the screen, so it reads as going on into what comes next (the light running down it still fades) */
    [['line', 0.35, 0.35], ['run', 0.9, 0]].forEach(function (f) {
      var lg = svg('linearGradient', { id: 'home-memory-teaser-' + f[0], gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 }, tdefs);
      svg('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, lg);
      svg('stop', { offset: 0.2, 'stop-color': '#fff', 'stop-opacity': f[1] }, lg);
      svg('stop', { offset: 1, 'stop-color': '#fff', 'stop-opacity': f[2] }, lg);
      teaserFades.push(lg);
    });
    memory.insertBefore(teaser, visualBox);
    links.forEach(function (ln, i) {
      ln.tease = svg('path', { fill: 'none', stroke: 'url(#home-memory-teaser-line)', 'stroke-width': 1, pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, teaser);
      ln.teaseRun = svg('path', { fill: 'none', stroke: 'url(#home-memory-teaser-run)', 'stroke-width': 1.5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0.1 1.2', 'stroke-dashoffset': 0.1 }, teaser);
      teaserLines.push(ln.tease);
      if (ln.teaseRun.animate) {
        var run = ln.teaseRun.animate([{ strokeDashoffset: '0.1px', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, { strokeDashoffset: '-1px', offset: 0.7 }, { strokeDashoffset: '-1px' }],
          { duration: 3200, delay: i * 240, iterations: Infinity });
        run.pause();
        teaserAnims.push(run);
      }
    });
  }
  /* 16 Nov (phones; the user: "add the same line animation that desktop has in the mobile to avoid dead space"). With
     no agents stop (767px and below) the hint above stays off, and "Why Dreamteam?" is not the pinned stop with the
     rail and beacon (why.js, desktop only), so a screen of empty dark was left between the mark and the title. The
     same line now runs from the foot of the mark down to the same small red beacon over "Why Dreamteam?": it draws in
     as the threads finish, the beacon comes on as it arrives, light runs down it now and then like the hint's (only
     while it is on screen), and it scrolls with the page. It is drawn in the Why section, which sits over this one
     (z-index 2 over 1), so the stretch over that section isn't covered */
  var whySec = document.querySelector('.section_home-why'), whyHead = whySec && whySec.querySelector('.home-why_heading');
  var rail = null, railLine = null, railRun = null, railFades = [], railBeacon = null, railAnim = null, railGeo = null, railKey = '', railPlaying = false;
  if (paths && whySec && whyHead && logo) {
    rail = svg('svg', { 'class': 'home-why_phone-rail', 'aria-hidden': 'true', focusable: 'false' });
    rail.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;overflow:visible;pointer-events:none;display:none';
    var rdefs = svg('defs', {}, rail);
    /* the rail's own fade (why.js): even, a little brighter into the beacon; the light running down it fades out */
    [['line', [[0, 0.35], [0.6, 0.35], [1, 0.6]]], ['run', [[0, 0], [0.2, 0.9], [1, 0]]]].forEach(function (f) {
      var lg = svg('linearGradient', { id: 'home-why-phone-rail-' + f[0], gradientUnits: 'userSpaceOnUse', x1: 0, x2: 0 }, rdefs);
      f[1].forEach(function (st) { svg('stop', { offset: st[0], 'stop-color': '#fff', 'stop-opacity': st[1] }, lg); });
      railFades.push(lg);
    });
    railLine = svg('path', { fill: 'none', stroke: 'url(#home-why-phone-rail-line)', 'stroke-width': 1, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '1 1', 'stroke-dashoffset': 1 }, rail);
    railRun = svg('path', { fill: 'none', stroke: 'url(#home-why-phone-rail-run)', 'stroke-width': 1.5, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': '0.1 1.2', 'stroke-dashoffset': 0.1 }, rail);
    if (railRun.animate) {
      railAnim = railRun.animate([{ strokeDashoffset: '0.1px', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' }, { strokeDashoffset: '-1px', offset: 0.7 }, { strokeDashoffset: '-1px' }],
        { duration: 3200, iterations: Infinity });
      railAnim.pause();
    }
    /* the beacon as why.css draws it on desktop */
    railBeacon = document.createElement('span');
    railBeacon.className = 'home-why_phone-beacon';
    railBeacon.setAttribute('aria-hidden', 'true');
    railBeacon.style.cssText = 'position:absolute;left:0;top:0;width:7px;height:7px;border-radius:50%;translate:-50% -50%;background:#6E3FF3;pointer-events:none;' +
      'box-shadow:0 0 0 4px rgba(110, 63, 243,.18),0 0 18px 6px rgba(110, 63, 243,.35);opacity:0;display:none';
    whySec.insertBefore(railBeacon, whySec.firstChild);
    whySec.insertBefore(rail, whySec.firstChild);
  }
  function railPlay(on) {
    if (on === railPlaying) return;
    railPlaying = on;
    if (railAnim) { if (on) railAnim.play(); else railAnim.pause(); }
  }
  /* From the foot of the mark (measured in the memory component, which is held while the page moves on under it) to
     just above the title, where the beacon is (18px, as on desktop); worked out on every scroll and step of the draw */
  function railDraw(drawIn) {
    if (!rail) return;
    var off = !railGeo || drawIn <= 0 || whySec.classList.contains('is-staged');
    if (!off) {
      var w = whySec.getBoundingClientRect(), m = memory.getBoundingClientRect(), h = whyHead.getBoundingClientRect();
      var x = m.left + railGeo.x - w.left, top = m.top + railGeo.foot - w.top, end = h.top - w.top - 18;
      off = end - top < 48;
    }
    if (off) {
      if (railKey !== 'off') { railKey = 'off'; rail.style.display = railBeacon.style.display = 'none'; railPlay(false); }
      return;
    }
    var key = drawIn.toFixed(4) + '|' + x.toFixed(1) + '|' + top.toFixed(1) + '|' + end.toFixed(1);
    if (key !== railKey) {
      railKey = key;
      rail.style.display = railBeacon.style.display = '';
      var d = 'M' + x.toFixed(1) + ' ' + top.toFixed(1) + 'L' + x.toFixed(1) + ' ' + end.toFixed(1);
      railLine.setAttribute('d', d);
      railRun.setAttribute('d', d);
      railFades.forEach(function (lg) { lg.setAttribute('y1', top.toFixed(1)); lg.setAttribute('y2', end.toFixed(1)); });
      railLine.style.strokeDashoffset = (1 - drawIn).toFixed(4);
      railRun.style.display = drawIn >= 1 ? '' : 'none';
      railBeacon.style.left = x.toFixed(1) + 'px';
      railBeacon.style.top = end.toFixed(1) + 'px';
      railBeacon.style.opacity = span(drawIn, 0.85, 1).toFixed(3);
    }
    railPlay(drawIn >= 1 && w.top + top < vh && w.top + end > 0);
  }
  /* Lays the hint out from just under the copy (top) to just past the bottom of the screen; on a screen with too little
     room under the copy it stays off */
  function placeTeaser(x0, top, hold) {
    if (!teaser) return;
    var end = vh - hold + 8, room = end - top;
    teaser.style.display = room < 96 ? 'none' : '';
    teaserGeo = null;
    teaserKey = '';
    if (room < 96) return;
    teaser.setAttribute('width', memory.offsetWidth);
    teaser.setAttribute('height', Math.ceil(end));
    teaserFades.forEach(function (lg) { lg.setAttribute('y1', top.toFixed(1)); lg.setAttribute('y2', end.toFixed(1)); });
    var split = top + 0.38 * room, h = end - split;
    teaserGeo = { x0: x0, top: top, split: split, end: end, h: h };
    /* 16 Nov (Sree: "don't keep this many branches"): one straight line down the middle to the bottom of the screen;
       only the first of the four strands is drawn */
    links.forEach(function (ln, i) {
      var d = 'M' + x0.toFixed(1) + ' ' + top.toFixed(1) + 'L' + x0.toFixed(1) + ' ' + end.toFixed(1);
      ln.tease.setAttribute('d', d);
      ln.teaseRun.setAttribute('d', d);
      ln.tease.style.display = ln.teaseRun.style.display = i ? 'none' : '';
    });
  }
  /* 9 Nov: the hint no longer fades away as the agents come on and the paths draw in again: it is the same lines. As the
     copy steps aside, its top climbs to the foot of the rising mark, and its four ends bend to where the paths will run,
     eased in and out like the mark's rise, so by the time the paths light up along it the hint lies exactly on them and
     hands over to them. Scrolled back up, it plays the other way */
  var teaserGeo = null, teaserKey = '';
  function mix(a, b, t) { return a + (b - a) * t; }
  function morphTeaser(q, up, lifted) {
    if (!teaserGeo) return;
    var g = teaserGeo, m = inOut(span(q, 0.02, 0.4)), e = inOut(span(q, 0.12, 0.62)), key = m.toFixed(4) + '|' + e.toFixed(4) + '|' + up.toFixed(4) + '|' + lifted;
    if (key === teaserKey) return;
    teaserKey = key;
    teaser.style.translate = lifted;
    /* Only the lines move: the light running down them stays on the first stop, where nothing else is moving */
    var still = q <= 0, top = g.top, end = g.end;
    links.forEach(function (ln) {
      ln.teaseRun.style.display = still && ln === links[0] ? '' : 'none';
      if (ln.y0 === undefined) return;
      var foot = ln.y0 + rise * (1 - up), H = ln.y1 - foot;
      top = mix(g.top, foot, m);
      end = mix(g.end, ln.y1, e);
      var d = 'M' + g.x0.toFixed(1) + ' ' + top.toFixed(1) + 'L' + g.x0.toFixed(1) + ' ' + end.toFixed(1);   /* stays one straight line */
      ln.tease.setAttribute('d', d);
      if (still) ln.teaseRun.setAttribute('d', d);
    });
    teaserFades.forEach(function (lg, n) { if (still || !n) { lg.setAttribute('y1', top.toFixed(1)); lg.setAttribute('y2', end.toFixed(1)); } });
  }

  /* The threads, drawn as lines of their own: thread i of 74 as drawn in the left fan (736.378 x 477.491), lit from its
     outer end to the mark along the drawing's gradient, which ends at GLOW[i]; the right fan mirrors it. Each is drawn
     from the mark (at x = MOUTH, on the line through it, AXIS) outward. Each fan's drawing stays in place, hidden, to
     keep the layout. (9 Nov: the ribbon turn that laid them flat and opened them out is gone.) */
  var FAN_W = 736.378, FAN_H = 477.491, THREADS = 74, AXIS = 234.799, MOUTH = 735.878, LAND = 32;   /* 16 Nov: 48 -> 32, a tighter band */
  var GLOW = [134,412.1,136.8,416.3,139.8,420.8,143,425.4,146.5,430.2,150.4,435.2,154.5,440.4,159,445.9,163.9,451.6,169.3,457.5,175.3,463.7,181.8,470.2,188.9,476.8,196.8,483.8,205.5,491,215.2,498.3,225.8,505.9,237.8,513.6,251.1,521.3,265.9,529,282.5,536.5,300.9,543.5,321.7,550,344.8,555.5,370.6,559.6,399,561.7,430.5,561.1,464.9,557,501.8,548.3,540.7,534.1,580.8,513,620.5,484.1,657.8,446.9,690.2,401.5,715.5,348.4,731.2,289.8,735.8,228.2,728.8,167.3,711,109.6,684,58,650.2,14.1,612.3,-21.2,572.4,-48.4,532.4,-68,493.8,-81,457.5,-88.6,423.7,-91.9,392.8,-91.9,364.9,-89.3,339.8,-84.9,317.2,-79.1,296.9,-72.5,278.8,-65.3,262.7,-57.8,248.2,-50.1,235.2,-42.3,223.5,-34.7,213,-27.2,203.6,-19.9,195.3,-13,187.6,-6.1,180.6,0.5,174,7.2,168.2,13.3,162.9,19.2,158,24.9,153.8,30,149.5,35.5,145.8,40.4,142.3,45.2,139.3,49.6,136.3,54,133.4,58.4,130.9,62.4];
  /* Two strands of light where the threads gather, from the mark outward, and the start and end of each one's gradient */
  var BEAMS = [[[690.51, 234.168, 670.381, 233.821, 650.558, 233.474, 630.837, 233.063, 611.321, 232.653, 591.906, 232.18, 572.697, 231.706], 572.697, 231.706, 685.634, 256.436, 0.296],
    [[716.975, 234.642, 696.743, 234.736, 676.614, 235.02, 656.689, 235.557, 636.968, 236.283, 617.349, 237.262, 597.935, 238.461], 597.935, 238.461, 706.041, 202.118, 0.122]];
  /* Which group each thread joins, the same on both sides: a scatter that looks random but never changes */
  function scatter(i, seed) { var a = Math.sin(i * 12.9898 + seed) * 43758.5453; return a - Math.floor(a); }
  /* A thread (or strand) as drawn, and its gradient's run */
  function lay(ln) {
    var p = ln.pts, q = [];
    for (var j = 0; j < p.length; j += 2) q.push(p[j] + ' ' + p[j + 1]);
    ln.el.setAttribute('d', 'M' + q[0] + (ln.curve ? 'C' + q.slice(1).join(' ') : 'L' + q.slice(1).join('L')));
    ln.grad.setAttribute('y1', ln.ends[1]);
    ln.grad.setAttribute('y2', ln.ends[3]);
  }
  /* Each fan's threads are split into BANDS groups, each drawn once into its own layer. A group is shown through a window
     the width of the fan plus a soft edge (a mask), which slides in from the outer side while the drawing inside slides
     the other way by as much, so the threads stay put and are uncovered from their outer ends to the mark. Only
     transform and opacity move, so the browser runs it on the compositor at the display's full rate (120fps where the
     screen allows) without painting anything again */
  var looms = [];
  Array.prototype.forEach.call(fans, function (fan, side) {
    var mirror = fan.classList.contains('is-right'), id = 'home-memory-thread-' + side + '-';
    var loom = document.createElement('div'), bands = [], lines = [], anims = [];
    loom.setAttribute('aria-hidden', 'true');
    loom.style.cssText = 'position:absolute;pointer-events:none';
    var from = mirror ? 'right' : 'left', solid = (100 / (1 + FEATHER)).toFixed(2);
    var mask = 'linear-gradient(to ' + (mirror ? 'left' : 'right') + ', #000 ' + solid + '%, transparent)';
    for (var b = 0; b < BANDS; b++) {
      var clip = document.createElement('div'), slide = document.createElement('div');
      clip.style.cssText = 'position:absolute;top:0;bottom:0;' + from + ':0;width:' + (100 * (1 + FEATHER)).toFixed(2) + '%;overflow:hidden;will-change:transform,opacity;' +
        '-webkit-mask-image:' + mask + ';mask-image:' + mask;
      slide.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;will-change:transform';
      var art = svg('svg', { viewBox: '0 0 ' + FAN_W + ' ' + FAN_H, preserveAspectRatio: 'none', fill: 'none', focusable: 'false' }, slide);
      art.style.cssText = 'position:absolute;top:0;height:100%;' + from + ':0;width:' + solid + '%;overflow:visible';
      clip.appendChild(slide);
      loom.appendChild(clip);
      bands.push({ defs: svg('defs', {}, art), g: svg('g', mirror ? { transform: 'matrix(-1 0 0 1 ' + FAN_W + ' 0)' } : {}, art) });
      if (clip.animate) {
        var timing = { duration: DRAW, delay: b * SPREAD / (BANDS - 1), easing: 'cubic-bezier(0.3, 0, 0.15, 1)', fill: 'both' };
        anims.push(clip.animate([{ transform: 'translateX(' + (mirror ? '' : '-') + '100%)', opacity: 0 }, { opacity: 1, offset: 0.2 }, { transform: 'none', opacity: 1 }], timing));
        anims.push(slide.animate([{ transform: 'translateX(' + (mirror ? '-' : '') + '100%)' }, { transform: 'none' }], timing));
      }
    }
    anims.forEach(function (an) { an.pause(); });
    function line(pts, curve, k, ends, stops, band) {
      var lg = svg('linearGradient', { id: id + k, gradientUnits: 'userSpaceOnUse', x1: ends[0], x2: ends[2] }, bands[band].defs);
      stops.forEach(function (st) { svg('stop', { offset: st[0], 'stop-color': st[1], 'stop-opacity': st[2] }, lg); });
      var el = svg('path', { stroke: 'url(#' + id + k + ')', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, bands[band].g);
      var ln = { el: el, grad: lg, pts: pts, curve: curve, ends: ends, k: k };
      lay(ln);
      lines.push(ln);
    }
    /* Which group each thread joins: the outermost go first, the ones nearest the middle last, with a little scatter */
    var order = [];
    for (var i = 0; i < THREADS; i++) {
      var y = 0.51 + 6.52699 * i;
      order.push({ i: i, at: 0.72 * (1 - Math.min(1, Math.abs(y - AXIS) / (FAN_H - AXIS))) + 0.28 * scatter(i, 9.7) });
    }
    order.sort(function (p, q) { return p.at - q.at; });
    order.forEach(function (o, rank) {
      var i = o.i, y0 = 0.51 + 6.52699 * i;
      /* The end at the mark, its two handles, then the outer end. 16 Nov (Rehan, option A): the threads no longer pinch
         to one point; each ends at its own height across the mark's side (SPREAD units either side of the axis, in the
         fan's own order), arriving level, so the fan lands on the tile like a ribbon plugging in */
      var ey = AXIS + (y0 - AXIS) / (FAN_H - AXIS) * LAND;
      line([MOUTH, +ey.toFixed(4), 520, +ey.toFixed(4), 201.714, +(153.1251 + 2.17567 * i).toFixed(4), 12.7493, +y0.toFixed(4)], true, i,
        [12.7493, y0, GLOW[2 * i], GLOW[2 * i + 1]], [[0, '#D4C8EC', 0.34], [0.65, '#E3D4D0', 0.391], [1, '#F4EEED', 0.51]],
        Math.floor(rank * BANDS / THREADS));
    });
    BEAMS.forEach(function (bm, j) { line(bm[0], false, 'beam' + j, bm.slice(1, 5), [[0, '#fff', 0], [1, '#fff', bm[5]]], BANDS - 1); });
    fan.parentNode.insertBefore(loom, fan.nextSibling);
    looms.push({ fan: fan, svg: loom, lines: lines, anims: anims });
  });

  /* 16 Nov (Rehan): on desktop the threads no longer slide in as groups from the edges; each is drawn on its own,
     outward from the mark (see lineAt), as one crisp stroke cut back to the part between the mark and its tip */
  var SHOOT = !!window.DT_ENGINE;
  function hash(i, k) { var v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }
  if (SHOOT) looms.forEach(function (lm) {
    lm.anims.forEach(function (an) { an.cancel(); });
    lm.anims = [];
    lm.lines.forEach(function (ln) { ln.last = null; });
  });
  /* the first part of a cubic, from its start (the mark) to parameter t, squashed by q toward the height it starts at */
  function cutCubic(p, t, q) {
    var L = function (a, b) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
    var p0 = [p[0], p[1]], p1 = [p[2], p[3]], p2 = [p[4], p[5]], p3 = [p[6], p[7]];
    var a = L(p0, p1), b = L(p1, p2), c = L(p2, p3), d = L(a, b), e = L(b, c), f = L(d, e);
    var Y = function (pt) { return pt[0].toFixed(2) + ' ' + (p0[1] + (pt[1] - p0[1]) * q).toFixed(2); };
    return 'M' + Y(p0) + 'C' + Y(a) + ' ' + Y(d) + ' ' + Y(f);
  }
  function eOut(t) { return 1 - Math.pow(1 - t, 3); }
  /* 16 Nov (Rehan picked "unfurl" of five tried, with less stagger): each thread draws outward from the mark along its
     own curve; the centre leads only a little (the outermost start STAGGER of the run later, plus a touch of scatter),
     so the fan grows out of the ribbon almost as one */
  var STAGGER = 0.16, SCATTER = 0.03, RUN = 0.8;
  function lineAt(ln, f) {
    var c = Math.min(1, Math.abs(ln.pts[7] - AXIS) / (FAN_H - AXIS));
    var r = clamp((f - STAGGER * c - SCATTER * hash(ln.k, 3)) / RUN);
    return r <= 0.002 ? '' : cutCubic(ln.pts, eOut(r), 1);
  }
  function shoot(f) {
    if (!SHOOT) return;
    looms.forEach(function (lm) {
      lm.lines.forEach(function (ln) {
        var d;
        if (!ln.curve) d = f >= 0.85 ? null : '';   /* the two strands of light come up as the fan finishes */
        else d = f >= 1 ? null : lineAt(ln, f);
        if (d === ln.last) return;
        ln.last = d;
        if (d === null) lay(ln); else ln.el.setAttribute('d', d);
      });
    });
  }
  shoot(0);

  var pieces = [];
  Array.prototype.forEach.call(stage.querySelectorAll('.home-problem_piece'), function (el, i) {
    var rank = ORDER.length, a = Math.sin(i * 41.7 + 3.1) * 9999.1, drift = 1;
    for (var j = 0; j < ORDER.length; j++) if (el.classList.contains(ORDER[j])) rank = j;
    for (var key in DRIFT) if (el.classList.contains(key)) drift = DRIFT[key];
    pieces.push({ el: el, shade: /\bis-shade/.test(el.className), start: 0.06 + rank * 0.032, spin: (a - Math.floor(a) - 0.5) * 40, drift: drift });
  });

  var vw, vh, H, T, D, S, irisH, dark, focusX, focusY, panAt = 0, rise = 0, lift = 0, last = NaN;
  /* The section's size on a phone; on anything else, or if it no longer is one, it goes back to its own */
  function fitPhone() {
    var fit = 1;
    stage.style.height = stage.style.paddingTop = '';
    piles.forEach(function (pile) { pile.style.bottom = ''; });
    panAt = 0;
    if (!PHONE.matches || !piles.length || !content) return { fit: fit, slide: 0 };
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize), pad = parseFloat(getComputedStyle(stage).paddingTop);
    var foot = parseFloat(getComputedStyle(piles[0]).bottom), tall = piles[0].offsetHeight;
    var short = GAP * rem - (vh - pad - content.offsetHeight - tall - foot);
    if (short > 0) {
      var less = Math.min(short, Math.max(0, pad - TOP * rem));
      pad -= less;
      short -= less;
      less = Math.min(short, Math.max(0, foot - FOOT * rem));
      foot -= less;
      short -= less;
      fit = Math.max(0.6, 1 - short / tall);
    }
    stage.style.height = vh + 'px';
    stage.style.paddingTop = pad + 'px';
    piles.forEach(function (pile) { pile.style.bottom = foot + 'px'; });
    var slide = Math.max(0, fit * (piles[0].offsetWidth - vw / 2) - vw / 2);
    panAt = slide * PAN;
    return { fit: fit, slide: slide };
  }
  function measure() {
    vw = document.documentElement.clientWidth;
    vh = document.documentElement.clientHeight;
    var phone = fitPhone();
    H = stage.offsetHeight;
    T = (vh - H) / 2;
    D = PIN * vh + panAt;
    /* 16 Nov: the page can switch the agents off with its own styles (display: none on .home-memory_agents, below
       768px). Then there is no agents stop: the first stop on the dark is the last, and the paths and the hint under
       the copy stay off */
    var agentsOn = !!agents && getComputedStyle(agents).display !== 'none';
    S = agentsOn ? STOP * vh : 0;
    irisH = Math.max(H, vh) + 2;
    if (paths) [agents, team].forEach(function (el) {
      if (!el) return;
      el.style.position = 'absolute';
      el.style.left = el.style.right = el.style.marginTop = '0';
    });
    if (paths && spill) {
      memory.style.overflowX = 'clip';
      memory.style.overflowY = 'visible';
      memory.style.minHeight = '';
    }
    /* The memory section is held so its mark sits at HOME of the screen, unless that would push its copy off the bottom */
    var visual = logo && logo.offsetParent !== memory ? logo.offsetParent : null;
    var logoX = logo ? (visual ? visual.offsetLeft : 0) + logo.offsetLeft + logo.offsetWidth / 2 : memory.offsetWidth / 2;
    var logoY = logo ? (visual ? visual.offsetTop : 0) + logo.offsetTop + logo.offsetHeight / 2 : memory.offsetHeight / 2;
    var bottom = arrival ? arrival.offsetParent === memory ? arrival.offsetTop + arrival.offsetHeight : arrival.offsetParent.offsetTop + arrival.offsetTop + arrival.offsetHeight : memory.offsetHeight;
    var hold = Math.min(HOME * vh - logoY, vh - bottom - 24);
    /* 16 Nov: without the agents under it, the first dark stop is laid out on its own: its copy and the mark are centred
       as one group in the screen under the nav (it used to sit high, leaving the bottom half empty for the agents) */
    var intro = memory.querySelector('.home-memory_intro');
    if (!paths && intro && logo && !PHONE.matches) {
      var gTop = intro.offsetTop, gBottom = logoY + logo.offsetHeight / 2, navH = window.DT_NAV_H || 0;
      hold = Math.min(navH + (vh - navH - (gBottom - gTop)) / 2 - gTop, vh - bottom - 24);
    }
    focusX = logoX;
    focusY = hold + logoY;
    /* Both pin for the same stretch; the memory section is pulled up over the problem one so it is already in place */
    stage.style.position = memory.style.position = 'sticky';
    stage.style.top = T + 'px';
    memory.style.top = hold + 'px';
    /* The dark is a layer the height of the screen behind the clutter, so the pile stays on top as the page dims */
    iris.style.height = irisH + 'px';
    iris.style.zIndex = '-1';
    pieces.forEach(function (p) {
      var pile = p.el.offsetParent;
      p.on = !!pile;
      if (!p.on) return;
      var cx = pile.offsetLeft + p.el.offsetLeft + p.el.offsetWidth / 2, cy = pile.offsetTop + p.el.offsetTop + p.el.offsetHeight / 2;
      p.dx = focusX - cx;
      p.dy = focusY - T - cy;
      /* Where it sits and how far it slides on a phone, the whole clutter shrunk towards the middle of its foot */
      p.fit = phone.fit;
      p.x = (phone.fit - 1) * (cx - vw / 2);
      p.y = (1 - phone.fit) * (pile.offsetTop + pile.offsetHeight - cy);
      p.slide = phone.slide * p.drift;
    });
    looms.forEach(function (lm) {
      var s = lm.svg.style, f = lm.fan;
      s.left = f.offsetLeft + 'px'; s.top = f.offsetTop + 'px'; s.width = f.offsetWidth + 'px'; s.height = f.offsetHeight + 'px';
      f.style.visibility = 'hidden';
    });
    /* The section's own dark, even if it is measured while handing over further down, where it turns see-through */
    var over = memory.classList.contains('is-handover');
    memory.classList.remove('is-handover');
    memory.style.backgroundColor = '';
    dark = getComputedStyle(memory).backgroundColor;
    memory.classList.toggle('is-handover', over);
    if (paths) paths.style.display = agentsOn ? '' : 'none';
    if (paths && logo && agentsOn) placeAgents(logoX, logoY - logo.offsetHeight / 2, logo.offsetHeight, hold);
    if (paths && agentsOn) placeTeaser(logoX, bottom + 40, hold);
    else if (teaser) { teaser.style.display = 'none'; teaserGeo = null; }
    /* Without the agents stop, the line from the foot of the mark to "Why Dreamteam?" (see railDraw) */
    railGeo = rail && !agentsOn ? { x: logoX, foot: logoY + logo.offsetHeight / 2 } : null;
    railKey = '';
    /* A section shorter than the screen stays held a little past the last stop, so the next one isn't left peeking in
       under it there */
    var tail = S ? Math.max(0, vh - hold - memory.offsetHeight) : 0;
    spacer.style.height = memorySpacer.style.height = D + LAST * S + tail + 'px';
    memorySection.style.marginTop = -(T + H + D + LAST * S + tail - hold) + 'px';
    last = NaN;
    memory.dispatchEvent(new CustomEvent('dreamteam:measured'));
  }

  /* The agents state: the mark rises so that it, its paths and the agents sit together in the middle of the screen,
     and the agents are laid out in place under it (out of the flow, so the section keeps its size) */
  function placeAgents(x0, markTop, markH, hold) {
    var k = logo.offsetWidth / MARK, gap = AGENTS_GAP * k;
    var group = markH + gap + agents.offsetHeight;
    var top = Math.max(24, (vh - group) / 2 - ABOVE * vh);
    rise = Math.max(0, hold + markTop - top);
    var y0 = markTop - rise + markH - PATH_START * k, agentsTop = markTop - rise + markH + gap;
    agents.style.top = agentsTop + 'px';
    paths.setAttribute('width', memory.offsetWidth);
    paths.setAttribute('height', memory.offsetHeight);
    var reach = [], y1 = y0, lowest = y0;
    links.forEach(function (ln) {
      var x1 = agents.offsetLeft + ln.card.offsetLeft + ln.card.offsetWidth / 2, h;
      y1 = agentsTop + ln.card.offsetTop + ln.frame.offsetTop + PATH_END * k;
      h = y1 - y0;
      lowest = Math.max(lowest, y1);
      var d = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'C' + x0.toFixed(1) + ' ' + (y0 + 0.5 * h).toFixed(1) + ' ' + x1.toFixed(1) + ' ' +
        (y0 + 0.163 * h).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
      ln.track.setAttribute('d', d);
      ln.line.setAttribute('d', d);
      ln.track.setAttribute('stroke-width', (TRACK * k).toFixed(2));
      ln.line.setAttribute('stroke-width', Math.max(1, k).toFixed(2));
      ln.reach = Math.abs(x1 - x0);
      ln.x1 = x1;
      ln.y0 = y0;
      ln.y1 = y1;
      reach.push(ln.reach);
    });
    /* How far below the top of the threads' box the paths reach once the mark has risen, for the light that runs along them */
    visualBox.dataset.reach = (lowest + rise - visualBox.offsetTop).toFixed(1);
    /* The light along each path fades in from above the mark to full at the agent */
    light.setAttribute('y1', (y0 - 0.27 * (y1 - y0)).toFixed(1));
    light.setAttribute('y2', y1.toFixed(1));
    /* The two agents nearest the mark arrive first */
    reach.sort(function (a, b) { return a - b; });
    links.forEach(function (ln) { ln.outer = ln.reach > reach[(reach.length - 1) >> 1] ? 1 : 0; });
    if (!team) return;
    /* Their copy goes under them; the group lifts by the drawn amount, or more if the copy would not fit on screen,
       but never takes the mark off the top (nor, where the section still clips, cuts the threads along its top) */
    var teamTop = agentsTop + agents.offsetHeight + TEAM_GAP * k, teamBottom = teamTop + team.offsetHeight;
    team.style.top = teamTop + 'px';
    var room = (spill ? vh : Math.min(vh, hold + memory.offsetHeight)) - 32 - (hold + teamBottom);
    var most = Math.min(hold + markTop - rise - 16, !spill && hold > 0 ? visualBox.offsetTop - rise : Infinity);
    lift = Math.max(0, Math.min(most, Math.max(LIFT * k, -room)));
    /* On a very short screen the copy closes up to the agents, by up to half the gap, before anything is cut */
    var short = Math.min(-room - lift, TEAM_GAP * k / 2);
    if (short > 0) {
      teamTop -= short;
      teamBottom -= short;
      team.style.top = teamTop + 'px';
    }
    /* and the section stays long enough to hold the copy once it scrolls on */
    if (spill && teamBottom - lift + 48 > memory.offsetHeight) memory.style.minHeight = Math.ceil(teamBottom - lift + 48) + 'px';
    /* Where the copy ends up once the group has lifted, for the agent cards that take over from it */
    memory.dataset.teamEnd = (teamTop - lift).toFixed(1);
  }

  /* Dims on the way down and brightens on the way up, never the other way round, so nothing that nudges the page can
     flip it back; the first call (and one with no movement) just settles it */
  var dimmed = null, darkAt = Infinity, lastP = null;
  /* The dark as a circle opening out of the mark, tied to the scroll. The circle is centred on the mark as it is on the
     screen (read before anything is written this frame) and ends past the farthest corner. data-dark tells the header
     and the why stop once it is over the nav. */
  var irisGeo = null;
  function irisMeasure() {
    if (!IRIS || !logo) return;
    var ir = iris.getBoundingClientRect(), lr = logo.getBoundingClientRect();
    var cx = lr.left + lr.width / 2, cy = lr.top + lr.height / 2;
    irisGeo = { x: cx - ir.left, y: cy - ir.top, R: Math.hypot(Math.max(cx, vw - cx), Math.max(cy, vh - cy)) + 24 };
  }
  function irisOpen(p) {
    var k = inOut(span(p, IRIS[0], IRIS[1])), g = irisGeo;
    iris.style.transition = 'none';
    iris.style.backgroundColor = dark;
    iris.style.visibility = k > 0 ? 'visible' : 'hidden';
    iris.style.opacity = k >= 1 ? '1' : k.toFixed(4);
    iris.style.clipPath = '';
    var over = k > 0.45 ? '1' : '0';
    if (iris.dataset.dark !== over) { iris.dataset.dark = over; dispatchEvent(new Event('dt-theme')); }
  }
  function shade(p) {
    if (IRIS) { irisOpen(p); return; }
    var on = dimmed ? p > BRIGHTEN : p >= DARK_AT, moved = lastP === null ? 0 : p - lastP;
    lastP = p;
    if (on === dimmed || (dimmed !== null && (on ? moved < 0 : moved > 0))) return;
    var fade = dimmed !== null;
    dimmed = on;
    darkAt = on ? performance.now() + (fade ? FADE : 0) : Infinity;
    iris.style.transition = fade ? 'opacity ' + FADE + 'ms ' + CURVE : 'none';
    iris.style.visibility = 'visible';
    iris.style.backgroundColor = dark;
    iris.style.opacity = on ? '1' : '0';
    /* Once fully dark, let the memory section close up behind it */
    if (on && fade) setTimeout(function () { last = NaN; queue(); }, FADE + 20);
  }

  function renderProblem(p, g) {
    var idle = p <= 0;
    pieces.forEach(function (pc) {
      var s = pc.el.style, x = pc.on ? pc.x - pc.slide * g : 0, y = pc.on ? pc.y : 0;
      if (idle || !pc.on) {
        s.rotate = s.filter = s.opacity = '';
        s.translate = x || y ? x.toFixed(1) + 'px ' + y.toFixed(1) + 'px' : '';
        s.scale = pc.on && pc.fit < 1 ? pc.fit.toFixed(3) : '';
        s.willChange = pc.on && panAt ? 'translate' : '';
        return;
      }
      if (pc.shade) { s.opacity = (1 - span(p, 0.06, 0.34)).toFixed(3); return; }
      /* Pulled to the point where the mark will appear, shrinking into the distance and losing focus as it goes */
      /* with the circle, the pieces go a little closer together and quicker, so the last is in before the dark opens */
      var st = IRIS ? 0.04 + (pc.start - 0.06) * 0.7 : pc.start;
      var t = inOut(span(p, st, st + (IRIS ? 0.3 : 0.44))), k = 0.94 * t;
      s.willChange = 'translate, scale, rotate, filter, opacity';
      s.translate = (x + (pc.dx - x) * k).toFixed(1) + 'px ' + (y + (pc.dy - y) * k).toFixed(1) + 'px';
      s.rotate = (pc.spin * t).toFixed(2) + 'deg';
      if (IRIS) {
        /* drawn right into the point: smaller as it goes, a light blur only, and fading as it arrives (no heap) */
        s.scale = (pc.fit * (1 - 0.8 * t)).toFixed(3);
        s.filter = 'blur(' + (5 * t).toFixed(2) + 'px)';
        s.opacity = (1 - span(t, 0.45, 0.95)).toFixed(3);
        return;
      }
      s.scale = (pc.fit * (1 - 0.5 * t)).toFixed(3);
      s.filter = 'blur(' + (16 * t).toFixed(2) + 'px)';
      /* The blurred heap keeps closing in as the mark grows out of it, and is gone by GONE, before the page dims */
      s.opacity = ((1 - 0.3 * t) * (1 - span(p, 0.64, GONE))).toFixed(3);
    });
    var c = inOut(span(p, COPY_OUT[0], COPY_OUT[1])), g2 = span(p, 0.06, 0.6);
    if (content) {
      content.style.filter = idle ? '' : 'blur(' + ((IRIS ? 10 : 14) * c).toFixed(2) + 'px)';
      content.style.opacity = idle ? '' : (1 - c).toFixed(3);
      content.style.scale = idle ? '' : (1 - 0.06 * c).toFixed(3);
      if (IRIS) content.style.translate = idle ? '' : '0 ' + (-1.25 * c).toFixed(3) + 'rem';
    }
    if (grid) {
      grid.style.opacity = idle ? '' : (1 - g2).toFixed(3);
      grid.style.scale = idle ? '' : (1 - 0.08 * g2).toFixed(3);
    }
    shade(p);
  }

  /* Going on plays every group forward from wherever it is; going off winds them all back toward their outer ends at
     once, over UNWEAVE ms. The short lights that run along the threads into the mark (the memory threads script) start
     once they are all in. */
  function draw(on) {
    looms.forEach(function (lm) {
      lm.anims.forEach(function (an) {
        /* Nothing drawn yet: nothing to wind back (playing back from 0 would jump to the end first) */
        if (!on && !(an.currentTime > 0)) { an.pause(); return; }
        an.playbackRate = on ? 1 : -DRAW / UNWEAVE;
        an.play();
      });
    });
  }
  function threads(w) {
    if (looms.length) visualBox.dataset.threads = w >= 1 ? 'drawn' : 'drawing';
  }
  /* Sets the threads running out (or back in) from wherever they are, on a clock of their own rather than the scroll */
  var woven = 0, weaveOn = false, weaving = null, weaveRaf = 0, pulsed = false;
  function weave(on) {
    if (on === weaveOn) return;
    weaveOn = on;
    /* The line field behind the mark (Home footer code) launches and winds back on this */
    memory.dispatchEvent(new CustomEvent('dreamteam:weave', { detail: { on: on } }));
    draw(on);
    /* 16 Nov: with the unfurl (desktop) the threads start as the dark comes up and draw in 1.25s, done as the glide lands */
    weaving = { from: woven, start: performance.now(), ms: on ? (SHOOT ? 1250 : WEAVE) * (1 - woven) : UNWEAVE * woven };
    cancelAnimationFrame(weaveRaf);
    weaveRaf = requestAnimationFrame(spin);
  }
  function spin(now) {
    if (!weaving) return;
    var k = weaving.ms > 0 ? clamp((now - weaving.start) / weaving.ms) : 1;
    woven = weaveOn ? weaving.from + (1 - weaving.from) * k : weaving.from * (1 - k);
    threads(woven);
    shoot(woven);
    /* The mark takes the signals in: one soft pulse as the last of them arrive */
    if (weaveOn && woven >= PULSE_AT && !pulsed && logo && logo.animate) {
      pulsed = true;
      logo.animate([{ scale: 1, filter: 'drop-shadow(0 0 0 rgba(255, 244, 238, 0))' }, { scale: 1.06, filter: 'drop-shadow(0 0 1.5rem rgba(255, 244, 238, 0.45))', offset: 0.35 },
        { scale: 1, filter: 'drop-shadow(0 0 0 rgba(255, 244, 238, 0))' }], { duration: 700, easing: 'cubic-bezier(0.2, 0, 0, 1)' });
    }
    if (!weaveOn) pulsed = false;
    settleCopy();
    if (k < 1) weaveRaf = requestAnimationFrame(spin);
    else weaving = null;
  }

  function renderMemory(p) {
    var done = p >= 1, hidden = p < MARK_AT;
    memory.style.visibility = hidden && !done ? 'hidden' : '';
    memorySection.style.pointerEvents = hidden && !done ? 'none' : '';
    /* See-through until the page has dimmed behind it */
    memory.style.backgroundColor = p < DARK_AT || (!IRIS && performance.now() < darkAt) ? 'transparent' : '';
    var l = out(span(p, MARK_AT, MARK_AT + 0.28));
    if (logo) {
      logo.style.opacity = done ? '' : Math.min(1, l * 2).toFixed(3);
      logo.style.scale = done ? '' : (0.3 + 0.7 * l).toFixed(3);
      logo.style.filter = done ? '' : 'blur(' + (10 * (1 - l)).toFixed(2) + 'px)';
    }
    /* Once reached, the threads play through whether or not the scroll keeps going */
    weave(done || p >= (weaveOn ? THREADS_BACK : THREADS_AT));
  }

  /* The memory copy settles in as the threads finish, and steps aside as the agents come on */
  function settleCopy() {
    railDraw(inOut(span(woven, 0.6, 1)));
    if (teaser) {
      var drawIn = inOut(span(woven, 0.6, 1)), tv = drawIn * (1 - span(span(flow, 0, AGENTS_TO), 0.68, 0.92));
      teaser.style.opacity = tv.toFixed(3);
      teaserLines.forEach(function (p) { p.style.strokeDashoffset = (1 - drawIn).toFixed(4); });
      if ((tv > 0 && flow <= 0) !== teaserOn) {
        teaserOn = tv > 0 && flow <= 0;
        teaserAnims.forEach(function (a) { if (teaserOn) a.play(); else a.pause(); });
      }
    }
    if (!arrival) return;
    var a = out(span(woven, COPY_FROM, 1)), aside = span(flow, 0, 0.15), k = a * (1 - aside), s = arrival.style;
    s.opacity = k >= 1 ? '' : k.toFixed(3);
    s.translate = k >= 1 ? '' : '0 ' + (aside > 0 ? -1.5 * aside : 1.5 * (1 - a)).toFixed(3) + 'rem';
    s.filter = k >= 1 ? '' : 'blur(' + (8 * (1 - k)).toFixed(2) + 'px)';
  }

  function renderAgents(q, r) {
    if (!paths) return;
    var idle = q <= 0, up = inOut(span(q, 0.05, 0.4));
    /* Then the whole group lifts and the agents' copy settles in under it */
    var u = inOut(span(r, 0, 0.64)), c = out(span(r, 0.43, 1)), lifted = r > 0 ? '0 ' + (-lift * u).toFixed(1) + 'px' : '';
    visualBox.style.translate = idle ? '' : '0 ' + (-rise * up - lift * u).toFixed(1) + 'px';
    paths.style.translate = agents.style.translate = lifted;
    if (teaser) morphTeaser(q, up, lifted);
    if (team) {
      team.style.opacity = c.toFixed(3);
      team.style.translate = c >= 1 ? lifted : '0 calc(' + (-lift * u).toFixed(1) + 'px + ' + (1.5 * (1 - c)).toFixed(3) + 'rem)';
      team.style.filter = c >= 1 || c <= 0 ? '' : 'blur(' + (8 * (1 - c)).toFixed(2) + 'px)';
    }
    /* Each path runs out of the mark, then its agent arrives where it ends */
    links.forEach(function (ln) {
      var d = inOut(span(q, 0.4 + 0.05 * ln.outer, 0.71 + 0.1 * ln.outer)), a = out(span(q, 0.58 + 0.1 * ln.outer, 0.82 + 0.18 * ln.outer));
      ln.group.style.visibility = d > 0 ? '' : 'hidden';
      /* Once the path is whole and its agent has arrived, light may run along it */
      ln.group.dataset.ready = d >= 1 && a >= 1 ? 'true' : 'false';
      ln.track.style.strokeDashoffset = ln.line.style.strokeDashoffset = (1 - d).toFixed(4);
      var s = ln.card.style;
      s.opacity = a.toFixed(3);
      s.translate = a >= 1 ? '' : '0 ' + (1 - a).toFixed(3) + 'rem';
      s.scale = a >= 1 ? '' : (0.94 + 0.06 * a).toFixed(3);
      s.filter = a >= 1 || a <= 0 ? '' : 'blur(' + (6 * (1 - a)).toFixed(2) + 'px)';
    });
  }

  /* Where the page has got to on the stops decides which one it is on; flow, on a clock of its own, follows at its own
     pace from 0 (the first stop) to LAST and can turn round part way without a jump */
  var stop = 0, flow = 0, flowRaf = 0, flowAt = 0, placed = false;
  function pick(x) {
    /* 16 Nov: with "Why Dreamteam?" straight after this stop, the agents step isn't used; scrolling on into Why no
       longer moves this scene to it, so coming back up never replays it (Sree: "some of the weirdest stuff") */
    if (document.querySelector('.has-why-stage')) x = Math.min(x, 0);
    if (x >= stop + NUDGE) while (stop < LAST && x >= stop + NUDGE) stop++;
    else while (stop > 0 && x <= stop - NUDGE) stop--;
    /* A page that arrives from elsewhere starts on the stop it is on */
    if (!placed) { placed = true; flow = stop; }
    run();
  }
  function run() {
    if (flow === stop || flowRaf) return;
    flowAt = performance.now();
    flowRaf = requestAnimationFrame(play);
  }
  function play(now) {
    var down = flow < stop, ms = AGENTS, dt = Math.max(0, now - flowAt) / (down ? ms : ms * BACK);
    flowAt = now;
    flow = down ? Math.min(stop, flow + dt) : Math.max(stop, flow - dt);
    cast();
    settleCopy();
    flowRaf = flow === stop ? 0 : requestAnimationFrame(play);
  }

  /* One scroll, one stop. Near the stops, a wheel, a key or a swipe moves the page straight to the next one (nothing
     shows it, the sections are held there) and holds it until the change has played; what is left of a flick then
     stays held too, because it fades where a new scroll builds. A wheel that started scrolling before it reached the
     stops can't be cancelled, so the page is put back on the stop for as long as that wheel keeps going */
  var recent = [], wheelAt = 0, heldAt = NaN, holdUntil = 0, armed = false, finger = null;
  /* 16 Nov (phones): see coasted() below. touching: a finger is on the screen; coast: while the page may be coasting
     after a flick, the time by which its next scroll must come (0 when it is not); coastFrom: where the page was when
     the finger left it, and liftAt: when; settle: until when a taken coast is kept off the page (0 when none is) */
  var touching = false, coast = 0, coastFrom = 0, liftAt = 0, downAt = 0, downY = NaN, lastY = window.scrollY, settle = 0, pinning = false;
  function travelled() { return T - section.getBoundingClientRect().top; }
  function busy() { return !!glide || flow !== stop || (weaveOn && woven < 1); }
  /* Moves the page to a scroll position on a clock of its own, easing in and out; scroll that arrives meanwhile is held */
  var glide = null;
  function glideTo(to, ms) {
    var from = window.scrollY;
    glide = { from: from, to: to, start: performance.now(), ms: Math.max(300, ms) };
    heldAt = from;
    holdUntil = glide.start + glide.ms + 200;
    requestAnimationFrame(function step(now) {
      if (!glide) return;
      var k = clamp((now - glide.start) / glide.ms);
      heldAt = glide.from + (glide.to - glide.from) * inOut(k);
      window.scrollTo(0, heldAt);
      if (k < 1) requestAnimationFrame(step);
      else { glide = null; holdUntil = performance.now() + 200; }
    });
  }
  function land(k) {
    stop = k;
    heldAt = window.scrollY + D + k * S - travelled();
    if (Math.abs(window.scrollY - heldAt) >= 1) window.scrollTo(0, heldAt);
    run();
  }
  /* Whether a scroll of by px is the stops' to take; if not, it carries on along the page */
  function take(by, fresh) {
    var s = travelled(), end = D + LAST * S, next = stop + (by > 0 ? 1 : -1);
    if (glide) return true;
    /* In the problem stretch: down glides through the transition to the dark, up glides back to the start of it */
    if (s >= -1 && s < D - 1) {
      if (by > 0) { glideTo(window.scrollY + D - s, GLIDE * (1 - Math.max(0, s) / D)); return true; }
      if (s > 1) { glideTo(window.scrollY - s, GLIDE_BACK * s / D); return true; }
      return false;
    }
    if (s < D - 1 || s > end + 1) {
      if (s < D ? by < 0 || s + by < D : by > 0 || s + by > end) return false;
      /* Arriving from above with a scroll big enough to jump the whole transition: play it on the way instead */
      if (s < D) { glideTo(window.scrollY + D - s, GLIDE); return true; }
      land(LAST);
      return true;
    }
    /* 15 Nov: without the agents there is only the one stop on the dark; past it the page scrolls on */
    if (!S && by > 0 && s >= D - 1) return false;
    if (busy() || !fresh) { land(stop); return true; }
    /* Up from the dark: glide back through the transition to the problem section */
    if (next < 0) { glideTo(window.scrollY - s, GLIDE_BACK); return true; }
    if (next > LAST) return false;
    land(next);
    return true;
  }
  function mean(n) {
    var part = recent.slice(-n), sum = 0;
    part.forEach(function (v) { sum += v; });
    return sum / part.length;
  }
  function wheel(e) {
    if (window.DT_ENGINE) return; /* 16 Nov: on desktop the why stop's engine (why.js) moves the page */
    var by = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh : 1), now = performance.now(), size = Math.abs(by);
    if (e.ctrlKey || !by || Math.abs(e.deltaX) > size) return;
    if (now - wheelAt > 200) recent.length = 0;
    wheelAt = now;
    recent.push(size);
    if (recent.length > 70) recent.shift();
    holdUntil = take(by, recent.length === 1 || (size >= 4 && mean(10) >= mean(70))) ? now + 200 : 0;
    if (!holdUntil) return;
    if (e.cancelable) e.preventDefault();
  }
  function key(e) {
    if (window.DT_ENGINE) return;
    var t = e.target, name = e.key, space = name === ' ', down = name === 'ArrowDown' || name === 'PageDown' || (space && !e.shiftKey);
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !(down || name === 'ArrowUp' || name === 'PageUp' || space)) return;
    if (t && t.closest && t.closest(space ? 'a, button, input, select, textarea, [contenteditable], [role="button"]' : 'input, select, textarea, [contenteditable]')) return;
    if (take((down ? 1 : -1) * (name.indexOf('Arrow') ? 0.9 * vh : 40), !e.repeat)) e.preventDefault();
  }
  function touchStart(e) { finger = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, spent: false } : null; }
  function touchMove(e) {
    if (!finger || !e.cancelable) return;
    var s = travelled(), by = finger.y - e.touches[0].clientY, next = stop + (by > 0 ? 1 : -1);
    if (!by || Math.abs(e.touches[0].clientX - finger.x) > Math.abs(by)) return;
    /* The problem stretch, and up from the first dark stop: a swipe glides through the transition */
    if ((s >= -1 && s < D - 1 && (by > 0 || s > 1)) || glide) {
      e.preventDefault();
      if (Math.abs(by) >= 24 && !finger.spent && !glide) { finger.spent = true; take(by, true); }
      return;
    }
    if (s < D - 1 || s > D + LAST * S + 1) return;
    /* With no agents stop (S = 0) the first stop on the dark is the last: a swipe on from it carries on along the page */
    if (!busy() && !finger.spent && next > (S ? LAST : 0)) return;
    e.preventDefault();
    if (Math.abs(by) >= 24 && !finger.spent && !busy()) { finger.spent = true; take(by, true); }
  }
  /* 16 Nov (phones): a flick that starts above or below the stops coasts into them with no finger on the screen. iOS
     sends no touch events while the page coasts, so the swipe rules above never saw it: in iOS Safari a hard flick
     crossed the whole transition in under half a second and carried on past the dark, and a softer one stopped part
     way through it (a white screen with only the mark). A coast is now taken the way a swipe is: in the problem
     stretch it glides on through the transition at the transition's own pace (down to the dark, up to the start of
     it), and one that comes up from below is taken where it reaches the last stop, as a swipe up from there would be.
     So is a finger that drags the page into the stretch and lets go there.
     iOS keeps the coast running underneath a scripted scroll, and nothing a page can do ends it (tried: taking the
     page's scrolling away for a frame or two, and a native smooth scroll). It does not show while the script moves the
     page every frame, but a page stopped dead against a strong coast shakes, and once the script lets go the coast
     carries the page on (24 to 94 px past the stop in the tests). So a coast is never stopped dead: it is always
     glided, the glide lands no sooner than LAND_AFTER ms after the finger lifted, when the coast has all but run out,
     and the page is then put on its place every frame (pin) until COAST_MAX ms after the lift, or a finger comes back.
     Only a touch that travelled starts a coast (a tap on a link or on the status bar does not). The coast is over once
     its scroll pauses for COAST_GAP ms (a busy page can hold scroll events up for a few hundred ms, so the gap is
     long), COAST_MAX ms after the finger lifted, or when a finger comes back. A coast first seen already past the
     dark (only when scroll events were held up) is left alone. Not with the desktop engine (window.DT_ENGINE), which
     moves the page itself. */
  var COAST_GAP = 1000, COAST_MAX = 3200, LAND_AFTER = 1500;
  function fingerDown(e) { touching = true; coast = settle = 0; downAt = window.scrollY; downY = e.touches.length === 1 ? e.touches[0].clientY : NaN; }
  function fingerUp(e) {
    touching = e.touches.length > 0;
    if (touching || window.DT_ENGINE || glide) return;
    /* after a quick flick the page may not have caught up with the finger yet, so the finger's own travel counts too */
    var t = e.changedTouches && e.changedTouches[0], swiped = t && downY === downY ? downY - t.clientY : 0, by = window.scrollY - downAt;
    if (Math.abs(swiped) < 10 && Math.abs(by) < 10) return;
    liftAt = performance.now();
    coast = liftAt + COAST_GAP;
    coastFrom = travelled();
    if (Math.abs(by) >= 10) coasted(by > 0 ? 1 : -1);
  }
  function pin() {
    if (touching || performance.now() > settle) { settle = 0; pinning = false; return; }
    /* while a glide runs it moves the page itself; after it the page stays where it was put */
    if (!glide) { window.scrollTo(0, heldAt); holdUntil = performance.now() + 200; }
    requestAnimationFrame(pin);
  }
  function coasted(dir) {
    var now = performance.now();
    if (touching || glide || now < holdUntil) return;
    var s = travelled(), end = D + (S ? LAST : 0) * S;
    if (dir < 0 && coastFrom > end + 1) {
      if (s > end) return;
      if (s <= 1) { coast = 0; return; }
    }
    else if (!(s >= 0 && s < D - 1 && (dir > 0 || s > 1))) return;
    coast = 0;
    if (!take(dir, true)) return;
    if (glide) {
      var least = Math.min(GLIDE, liftAt + LAND_AFTER - now);
      if (glide.ms < least) { glide.ms = least; holdUntil = glide.start + glide.ms + 200; }
    } else holdUntil = now + 200;
    settle = liftAt + COAST_MAX;
    if (!pinning) { pinning = true; requestAnimationFrame(pin); }
  }
  /* Only needed near the stops, so the rest of the page scrolls without waiting on them */
  function arm(on) {
    if (on === armed) return;
    armed = on;
    var act = on ? 'addEventListener' : 'removeEventListener';
    window[act]('wheel', wheel, { passive: false });
    window[act]('touchstart', touchStart, { passive: true });
    window[act]('touchmove', touchMove, { passive: false });
  }
  function moved() {
    var now = performance.now(), y = window.scrollY, dir = y > lastY ? 1 : y < lastY ? -1 : 0;
    if (now < holdUntil && Math.abs(y - heldAt) > 1) {
      window.scrollTo(0, heldAt);
      y = heldAt;
    } else if (coast) {
      if (now > coast || now > liftAt + COAST_MAX) coast = 0;
      else { coast = now + COAST_GAP; if (dir) coasted(dir); }
    }
    lastY = y;
    queue();
  }

  var queued = false;
  function update() {
    queued = false;
    var scrolled = T - section.getBoundingClientRect().top;
    if (scrolled === last) return;
    last = scrolled;
    var g = panAt ? clamp(scrolled / panAt) : 0, p = clamp((scrolled - panAt) / (D - panAt));
    renderProblem(p, g * g * (3 - 2 * g));
    renderMemory(p);
    if (S) pick((scrolled - D) / S);
    cast();
    settleCopy();
    arm(scrolled > D - 2 * vh && scrolled < D + LAST * S + 2 * vh); /* 15 Nov: armed without the agents too, so the glide to the dark still holds */
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  function refit() { measure(); queue(); }

  measure();
  update();
  window.addEventListener('scroll', moved, { passive: true });
  window.addEventListener('touchstart', fingerDown, { passive: true });
  window.addEventListener('touchend', fingerUp, { passive: true });
  window.addEventListener('touchcancel', fingerUp, { passive: true });
  window.addEventListener('keydown', key);
  window.addEventListener('resize', refit);
  var ro = 'ResizeObserver' in window ? new ResizeObserver(refit) : null;
  if (ro) { ro.observe(stage); ro.observe(memory); }
  /* Images that arrive after the first measure (the mark, the clutter) have no height until they load, which would
     put the light and the pull point off centre, so measure again as each one comes in */
  stage.addEventListener('load', refit, true);
  memory.addEventListener('load', refit, true);
  /* Likewise the copy changes height once the web font arrives */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);

  if (reduceMotion.addEventListener) reduceMotion.addEventListener('change', function (e) {
    if (!e.matches) return;
    window.removeEventListener('scroll', moved);
    window.removeEventListener('touchstart', fingerDown);
    window.removeEventListener('touchend', fingerUp);
    window.removeEventListener('touchcancel', fingerUp);
    coast = settle = 0;
    window.removeEventListener('keydown', key);
    arm(false);
    cancelAnimationFrame(flowRaf);
    flowRaf = stop = flow = 0;
    S = 0;
    window.removeEventListener('resize', refit);
    stage.removeEventListener('load', refit, true);
    memory.removeEventListener('load', refit, true);
    if (ro) ro.disconnect();
    pieces.forEach(function (pc) { pc.on = false; });
    renderProblem(0, 0);
    PHONE = { matches: false };
    fitPhone();
    renderMemory(1);
    if (paths) {
      renderAgents(0, 0);
      paths.parentNode.removeChild(paths);
      if (teaser) { teaserAnims.forEach(function (a) { a.cancel(); }); teaser.parentNode.removeChild(teaser); }
      if (rail) { if (railAnim) railAnim.cancel(); rail.parentNode.removeChild(rail); railBeacon.parentNode.removeChild(railBeacon); rail = null; railGeo = null; }
      [agents, team].forEach(function (el) {
        if (el) el.style.position = el.style.left = el.style.right = el.style.top = el.style.marginTop = el.style.translate = el.style.opacity = el.style.filter = '';
      });
      links.forEach(function (ln) { var s = ln.card.style; s.opacity = s.translate = s.scale = s.filter = ''; });
    }
    spacer.parentNode.removeChild(spacer);
    memorySpacer.parentNode.removeChild(memorySpacer);
    stage.style.position = stage.style.top = memory.style.position = memory.style.top = '';
    memory.style.overflowX = memory.style.overflowY = memory.style.minHeight = '';
    memorySection.style.marginTop = iris.style.height = iris.style.zIndex = '';
    iris.style.visibility = iris.style.opacity = iris.style.backgroundColor = iris.style.transition = memory.style.backgroundColor = '';
    delete memory.dataset.teamEnd;
    cancelAnimationFrame(weaveRaf);
    weaving = null;
    woven = 1;
    memory.dispatchEvent(new CustomEvent('dreamteam:weave', { detail: { on: true, instant: true } }));
    settleCopy();
    looms.forEach(function (lm) { lm.svg.parentNode.removeChild(lm.svg); lm.fan.style.visibility = ''; });
    if (visualBox) { delete visualBox.dataset.threads; delete visualBox.dataset.reach; }
  });
})();
