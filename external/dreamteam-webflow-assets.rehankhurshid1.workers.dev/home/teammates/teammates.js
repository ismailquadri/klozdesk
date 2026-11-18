/* Home teammates panel: each teammate's screen plays its flow when its tab opens. Ported from the "Dreamteam Homepage
   Three" artifact (motion/05, Sree's picks from the team's flow demos, 3-12 Nov); only the trigger changed: the
   artifact played a card when its rail made it current, here it plays when the Webflow tabs script marks its
   .home-roles_screen data-active (and the panel is on screen). Needs window.DTM (home/homepage.js). Markup: the
   four HTML embeds in the screens (source copies in this folder: rachel/sally/raj/alex.html); styles: teammates.css. */

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
  /* Put the artifact's four cards into the Webflow screens (Rachel, Sally, Raj, Alex, in tab order), then start the
     flows. The screens' own Webflow contents are hidden in Webflow; the card markup lives next to this file. */
  const BASE = '/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/';
  const NAMES = ['rachel', 'sally', 'raj', 'alex'];
  const screens = [...document.querySelectorAll('.section_home-roles .home-roles_screen')];
  if (screens.length !== 4) return;
  Promise.all(NAMES.map(n => fetch(BASE + n + '.html').then(r => r.ok ? r.text() : '')))
    .then(html => {
      html.forEach((markup, i) => { if (markup && !screens[i].querySelector('.tx-canvas')) screens[i].insertAdjacentHTML('beforeend', markup); });
      fit(); addEventListener('resize', fit);
      flows();
    })
    .catch(err => console.error('Teammate screens failed to load:', err));

  /* Narrower than the artifact's 1120px canvas (tablets, phones): scale each card so its window fits the panel with
     12px either side, centred in the panel (Sree, 16 Nov: Alex's chat sat left of centre), instead of cropping it. The window is the card's frame (.tx-win) or,
     for Raj and Alex, their stage (.tmr-stage), measured in canvas units. Desktop keeps the canvas as drawn. */
  function fit() {
    screens.forEach(scr => {
      const cv = scr.querySelector('.tx-canvas');
      if (!cv) return;
      cv.style.transform = ''; cv.style.left = '';
      const W = scr.clientWidth;
      if (!W) return;   /* every width: at 1120+ this only centres */
      /* what is centred: the app window (Rachel, Sally, and Alex's window with his chat docked on its right, as drawn in
         the artifact; 16 Nov: centring his chat alone left the window hanging off to the left), or Raj's stage */
      const win = cv.querySelector('.tx-win') || cv.querySelector('.tma-frame') || cv.querySelector('.tmr-stage');
      const r = cv.getBoundingClientRect(), q = win && win.getBoundingClientRect();
      if (!q || !r.width) return;
      const unit = r.width / 1120, x = (q.left - r.left) / unit, w = q.width / unit;
      const k = Math.min(1, (W - 24) / w);
      cv.style.left = '0px';
      cv.style.transformOrigin = '0 0';
      cv.style.transform = 'translateX(' + ((W - w * k) / 2 - x * k).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';   /* centred */
    });
  }

  function flows() {
  const s = document.querySelector('.section_home-roles');
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
    const app = card.querySelector('.rs-app');
    const attr = document.createElement('p');
    attr.className = 'tmr8-attr'; attr.setAttribute('aria-hidden', 'true');
    attr.innerHTML = '<img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/rachel-sally/rachel.jpg" alt=""><b>Zara</b><span class="tmr8-state"><i></i><span>Qualifying WhatsApp lead…</span></span>';
    const head = app.querySelector('.rc-head'); head.replaceChild(attr, head.querySelector('.rc-en'));
    const state = attr.querySelector('.tmr8-state'), stateText = state.querySelector('span');
    const sum = app.querySelector('.rc-sum'), lines = [...sum.children];
    const bars = document.createElement('div'); bars.className = 'tmr8-bars'; bars.setAttribute('aria-hidden', 'true');
    bars.innerHTML = [92, 70, 88, 96, 62].map(w => `<i class="tmr8-bar" style="width:${w}%"></i>`).join('');
    sum.prepend(bars);
    const fills = [app.querySelector('.rc-site-v'), ...app.querySelectorAll('.rc-pill')].map(el => {
      const sk = document.createElement('i'); sk.className = 'tmr8-skel'; sk.setAttribute('aria-hidden', 'true');
      el.appendChild(sk);
      return { el, sk, kids: [...el.childNodes].filter(n => n !== sk) };
    });
    const valueOf = f => f.el.querySelectorAll(':scope > *:not(.tmr8-skel)');
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
    const screen = card.querySelector('.tmc-screen'), app = card.querySelector('.rs-app');
    const mk = html => { const d = document.createElement('div'); d.className = 'tmz'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = html; screen.appendChild(d); return d; };
    const mail = mk(`<div class="tmz-subj"><span class="tmz-ico"><img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/hero/type-mail.svg" alt=""></span><p>WhatsApp Business API · PrimeSolar NG</p></div>
      <div class="tmz-msg"><i class="tmz-scan"></i>
        <div class="tmz-from"><span class="tmz-av">NA</span><p class="tmz-who">Chidi Okafor <span>(Managing Director)</span><em>PrimeSolar NG · Victoria Island, Lagos</em></p><span class="tmz-when">1h ago</span></div>
        <div class="tmz-body">
          <p>Good afternoon, we are expanding our Victoria Island clinic. <span class="tmz-sig">Our ₦18.5M solar budget is approved</span>; we need zero downtime on our lab equipment. <span class="tmz-sig">We are commissioning the VI facility this month</span> and choosing an installer this week.</p>
          <p>We need a 20kVA hybrid inverter, 40kWh LiFePO4 battery bank, and roof panels. <span class="tmz-sig">We have not paid any vendor yet</span>. <span class="tmz-sig">Please send your Paystack invoice and 5-year warranty</span>.</p>
          <p>Chidi Okafor</p>
        </div></div>`);
    const deal = mk(`<div class="tmz-mate"><img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/hero/sally.png" alt=""><div><b>Koda</b><span>Voice &amp; Chat Scribe</span><p>Extracted from Chidi Okafor's WhatsApp message.</p></div></div>
      <div class="tmz-panel"><div class="tmz-lead"><img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/hero/athleap.png" alt=""><p>PrimeSolar NG<span>VI Clinic 20kVA Hybrid Solar Setup</span></p></div>
        <div class="tmz-chips"><span class="tmz-chip">Budget set</span><span class="tmz-chip">Moving this month</span><span class="tmz-chip">No vendor yet</span><span class="tmz-chip">Ready to buy</span></div>
        <div class="tmz-fields"><p><span>Value</span>₦18,500,000</p><p><span>Stage</span>Qualification</p><p><span>Close date</span>Nov 20 (in 4 weeks)</p><p class="tmz-wide"><span>System</span>20kVA Deye Hybrid + 40kWh Lithium + Roof Panels</p></div></div>
      <div class="tmz-btns"><span class="tmz-btn" data-confirm>Confirm &amp; Create Deal</span><span class="tmz-btn tmz-btn--ghost">Skip</span></div>
      <div class="tmz-toast" role="status"><i><img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/hero/toast-check.svg" alt=""></i>PrimeSolar ₦18.5M deal created</div>`);
    const scan = mail.querySelector('.tmz-scan'), sigs = [...mail.querySelectorAll('.tmz-sig')], msg = mail.querySelector('.tmz-msg');
    const mailParts = [...mail.children], dealParts = [...deal.children].filter(c => !c.classList.contains('tmz-toast')), done = deal.querySelector('.tmz-toast');
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
    const review = q('.tmr-review'), tabs = q('.tmr-tabbar'), title = q('.tmr-rtitle'), ask = q('.tmr-ask');
    const read = document.createElement('p');
    read.className = 'tmr8-read'; read.setAttribute('aria-hidden', 'true');
    read.innerHTML = '<img src="/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/assets/raj-alex/raj.jpg" alt="">Closed-Won is <b>₦120M</b> against a <b>₦100M</b> target, <b>120%</b> attained. <b>₦430M</b> is committed across three deals, and <b>₦140M</b> needs WhatsApp follow-up.';
    title.after(read);
    const readWords = words([read]);
    const [mix, target, ...stats] = qa('.tmr-card');
    const legend = qa('.tmr-legend li'), headline = q('.tmr-headline'), heroNum = q('.tmr-hero-num'), trend = q('.tmr-trend');
    const figs = qa('.tmr-fig'), statRow = stats[0] && stats[0].parentElement, prioDot = q('.tmr-prio i');
    // the sweep: one ring-shaped mask over the three segments, drawn clockwise from twelve o'clock
    const svg = q('.tmr-donut svg'), NS = 'http://www.w3.org/2000/svg';
    const id = 'tmr8-sweep', mask = document.createElementNS(NS, 'mask'); mask.id = id;
    const ring = document.createElementNS(NS, 'circle');
    Object.entries({ cx: 68, cy: 68, r: 59, fill: 'none', stroke: '#fff', 'stroke-width': 22, pathLength: 1, transform: 'rotate(-90 68 68)' }).forEach(([k, v]) => ring.setAttribute(k, v));
    ring.style.strokeDasharray = '1 1';
    mask.appendChild(ring); svg.querySelector('defs').appendChild(mask);
    const segs = document.createElementNS(NS, 'g'); segs.setAttribute('mask', `url(#${id})`);
    qa('.tmr-donut svg > g').forEach(g => segs.appendChild(g)); svg.appendChild(segs);
    const nums = new Map(qa('.tmr-donut-total, .tmr-hero-num, .tmr-stat-num').map(el => [el, el.textContent]));
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
    const under = review.offsetTop - q('.tmr-tabs').offsetTop;   // let it run up under the tab bar
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
        await Promise.all([count(q('.tmr-donut-total'), SWEEP), sleep(200).then(() => count(heroNum, SWEEP - 200))]);
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
        await Promise.all([scroll, ...stats.map((c, i) => rise(c, 10, 520, i * 90)), ...qa('.tmr-stat-num').map((n, i) => sleep(200 + i * 90).then(() => count(n, 1100)))]);
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
    const input = q('.tma-input'), hint = q('.tma-placeholder'), caret = q('.tma-caret'), send = q('.tma-send');
    const figma = [q('.tma-bubble--user'), q('.tma-bubble--agent'), q('.tma-typing')];
    const tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const stages = ['Lead', 'Qualified', 'Inspection', 'Quote Sent', 'Negotiation', 'Closed-Won'];
    const thread = document.createElement('div');
    thread.className = 'tmx'; thread.setAttribute('aria-hidden', 'true');
    thread.innerHTML = `<div class="tmx-in">
      <div class="tmx-row" data-m="hi"><div><p class="tmx-text">Hi, I’m Oga, your AI Sales Director. Tell me what to configure: WhatsApp routing, Naira stages, or SLA alerts.</p></div></div>
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
    card.querySelector('.tmr-stage').appendChild(thread);
    const m = k => thread.querySelector(`[data-m="${k}"]`);
    const rows = [...thread.querySelectorAll('.tmx-row')];
    const typed = document.createElement('span'); typed.className = 'tma-typed'; input.appendChild(typed);
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
        /* 16 Nov (Sree: "Alex chat is empty initially"): his greeting is there from the start */
        const hi = m('hi'); hi.style.gridTemplateRows = '1fr'; hi.style.opacity = '1';
        thread.scrollTop = 0; thread.querySelector('[data-card]').classList.remove('is-live');
        thread.querySelector('[data-pick]').classList.remove('is-hover');
        typed.textContent = ''; hint.style.visibility = ''; caret.style.left = ''; busy(); idle();
      },
      async run(alive) {
        await nap(300); if (!alive()) return;
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

  // ---- run each card when its tab opens (Webflow: the tabs script marks the open screen data-active) ----
  const cards = [...s.querySelectorAll('.tmc')].map(el => {
    const who = ['rachel', 'sally', 'raj', 'alex'].find(k => el.classList.contains('tmc-' + k));
    const f = who && flows[who] ? flows[who](el) : null;
    if (f) f.start();
    return { el, f, run: 0, played: false, screen: el.querySelector('.tmc-screen, .tmr-stage'), host: el.closest('.home-roles_screen') };
  }).filter(c => c.f && c.host);

  async function begin(c) {
    const id = ++c.run, alive = () => c.run === id;
    c.el.classList.remove('hl-on');
    if (c.played) {   // it played before: fade its finished screen out, back to the start, then replay
      await play(c.screen, [{ opacity: 1 }, { opacity: 0 }], 180, E.out);
      if (!alive()) return;
      c.f.start(); set(c.screen, { opacity: 1 });
    }
    c.played = true;
    // wait until its screen has faded in, then let it settle
    while (alive() && +getComputedStyle(c.host).opacity < .95) await sleep(120);
    await sleep(380);
    if (alive()) await c.f.run(alive);
    // then the one piece that matters lifts out of the window (Raj's at-risk deals, Rachel's fit for Sable)
    if (alive()) { await sleep(500); if (alive()) c.el.classList.add('hl-on'); }
  }
  const stop = c => { c.run++; c.el.classList.remove('hl-on'); };
  const inView = { on: false };
  function sync() {
    cards.forEach(c => {
      const want = inView.on && c.host.getAttribute('data-active') === 'true';
      if (want && !c.on) { c.on = true; begin(c); } else if (!want && c.on) { c.on = false; stop(c); }
    });
  }
  new MutationObserver(sync).observe(s, { subtree: true, attributes: true, attributeFilter: ['data-active'] });
  new IntersectionObserver(es => { inView.on = es[0].isIntersecting; sync(); }, { threshold: .35 }).observe(s.querySelector('.home-roles_panel') || s);
  }
})();
