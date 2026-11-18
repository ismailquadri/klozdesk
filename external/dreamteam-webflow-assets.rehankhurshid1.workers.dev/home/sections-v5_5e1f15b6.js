/* Hero scripts from the latest artifact (Homepage Three, 14 Nov) */

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
  const art = s && s.querySelector('.hz-art');
  if (!art || !window.DTM) return;
  const { spring, E } = window.DTM;
  const reduced = window.DTM.reduced;
  const hz = s.querySelector('.hz');
  const avs = [...s.querySelectorAll('.hz-av')];
  const slots = [...art.querySelectorAll('.hz-fl:not(.hz-fl-intro) .hz-mag')].map(m => ({ m, st: [...m.querySelectorAll(':scope > .hz-st')], portrait: !!m.closest('.hz-fl-portrait') }));
  const names = [...art.querySelectorAll('.hz-name')];
  const pbg = art.querySelector('.hz-pbg');
  const tiles = [...art.querySelectorAll('.pt-o')].map(o => {
    const g = JSON.parse(o.dataset.g);
    return { o, g, pt: o.querySelector('.pt'), bg: o.querySelector('.pt-bg'), cut: o.querySelector('.pt-cut'), tag: o.querySelector('.pt-tag') };
  });
  const N = 4;
  const you = art.querySelector('.hz-you');
  const youAway = (v, delay = 0) => { if (!you) return; you.style.transitionDelay = delay + 'ms'; you.classList.toggle('is-away', v); };
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
  const snap = (els, fn) => { els.forEach(e => e.classList.add('hz-snap')); fn(); void art.offsetWidth; requestAnimationFrame(() => els.forEach(e => e.classList.remove('hz-snap'))); };
  const lightAll = v => avs.forEach((a, k) => { a.classList.toggle('is-on', v === -1 || k === v); a.setAttribute('aria-pressed', v === -1 || k === v ? 'true' : 'false'); });

  let cur = -1, busy = false;   // -1: the team
  async function toTeammate(i) {
    busy = true; lightAll(i);
    youAway(true);
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
    youAway(false, 520);
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
  // a photo on the team board opens its teammate, like its headline avatar
  tiles.forEach((t, k) => [t.cut, t.tag].forEach(el => el.addEventListener('click', async () => { if (busy || cur !== -1) return; clearTimeout(timer); await go(k); schedule(); })));
  // 16 Nov: hover pauses the rotation for a mouse or pen only. A finger is not a hover: on iOS a touch that turns into a
  // scroll ends in pointercancel and this element never gets its pointerleave, so the rotation stayed paused for good.
  art.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; hover = true; clearTimeout(timer); });
  art.addEventListener('pointerleave', e => { if (e.pointerType === 'touch') return; hover = false; schedule(); });
  document.addEventListener('visibilitychange', schedule);

  // first sight: the four photos land on the board one after another
  let entered = reduced, artIn = false, facesIn = false;
  new IntersectionObserver(es => {
    artIn = es[0].isIntersecting; visible = artIn || facesIn;
    if (artIn && !entered) {
      entered = true;
      // only while the team is still up: once the rotation has moved on (see the faces below) the photos are not on the board to land
      if (cur === -1 && !busy) tiles.forEach((t, k) => {
        const sp = spring(1000);
        t.o.animate([{ transform: 'translateY(28px) scale(.94)' }, { transform: 'none' }], { duration: sp.duration, easing: sp.easing, delay: 120 + k * 90, fill: 'backwards' });
        t.o.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 480, easing: E.out, delay: 120 + k * 90, fill: 'backwards' });
      });
      if (you && cur === -1 && !busy) { const sp = spring(1000); you.animate([{ transform: 'scale(.86)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: sp.duration, easing: sp.easing, delay: 120 + N * 90, fill: 'backwards' }); }
    }
    schedule();
  }, { threshold: .3 }).observe(art);
  // 16 Nov: on a phone the art sits under the copy, and at the top of the page less than 30% of it is on screen (28% in
  // Safari on an iPhone 17), so the rotation never started there. The faces in the headline show the rotation too, so it
  // also runs while they are on screen.
  const faces = s.querySelector('.hz-team');
  if (faces) new IntersectionObserver(es => { facesIn = es[0].isIntersecting; visible = artIn || facesIn; schedule(); }).observe(faces);

  // below 1180px the art sits under the copy, scaled to fit the screen
  const fit = () => { const w = s.querySelector('.hz').clientWidth - 32; art.style.setProperty('--hz-zoom', innerWidth < 1180 ? Math.min(1, w / 640).toFixed(3) : 1); };
  fit(); addEventListener('resize', fit);
})();


/* hero cards: their numbers count up as the card comes in (2026-11-13) */
(() => {
  const art = document.querySelector('#hero .hz-art'); if (!art) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const run = el => {
    const to = +el.dataset.count, from = +(el.dataset.from || 0), dec = +(el.dataset.dec || 0);
    const put = v => { el.textContent = el.dataset.fmt.replace('#', v.toFixed(dec)); };
    clearTimeout(el._t); cancelAnimationFrame(el._r);
    if (reduce) { put(to); return; }
    put(from);
    el._t = setTimeout(() => {
      const t0 = performance.now(), dur = +(el.dataset.dur || 800);
      const step = t => { const k = Math.min(1, (t - t0) / dur); put(from + (to - from) * (1 - (1 - k) ** 3)); if (k < 1) el._r = requestAnimationFrame(step); };
      el._r = requestAnimationFrame(step);
    }, +(el.dataset.delay || 0));
  };
  const mo = new MutationObserver(ms => { for (const m of ms) if (m.target.classList.contains('is-on') && !(m.oldValue || '').includes('is-on')) m.target.querySelectorAll('[data-count]').forEach(run); });
  art.querySelectorAll('.hz-st').forEach(st => mo.observe(st, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
})();

