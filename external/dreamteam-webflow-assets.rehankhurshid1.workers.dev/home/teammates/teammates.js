/* Klozdesk AI Teammates Panel Loader & Responsive Scaler
   Loads the 4 localized African sales superpower cards in tab order:
   1. Tobi (raj.html) - The WhatsApp Follow-Up Specialist (Automated 3-day polite check-ins when client is active)
   2. Zara (rachel.html) - Payment & Invoice Closer (Instant Paystack/Flutterwave link generation & automatic ledger reconciliation)
   3. Koda (sally.html) - Lead & KYC Filter (Instant CAC registration & business email check badge)
   4. Oga (alex.html) - Post-Meeting Debrief Assistant ("Send voice note" trigger converting 1-min audio rants into structured CRM updates)
*/
(() => {
  const BASE = '/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/home/teammates/';
  const NAMES = ['raj', 'rachel', 'sally', 'alex'];
  const screens = [...document.querySelectorAll('.section_home-roles .home-roles_screen')];
  if (screens.length !== 4) return;

  Promise.all(NAMES.map(n => fetch(BASE + n + '.html').then(r => r.ok ? r.text() : '')))
    .then(html => {
      html.forEach((markup, i) => {
        if (markup && !screens[i].querySelector('.tx-canvas')) {
          screens[i].insertAdjacentHTML('beforeend', markup);
        }
      });
      fit();
      addEventListener('resize', fit);
      setupTabTransitions();
    })
    .catch(err => console.error('Teammate screens failed to load:', err));

  function fit() {
    screens.forEach(scr => {
      const cv = scr.querySelector('.tx-canvas');
      if (!cv) return;
      cv.style.transform = '';
      cv.style.left = '';
      const W = scr.clientWidth;
      if (!W) return;
      const win = cv.querySelector('.kloz-tm-stage') || cv.querySelector('.tmr-stage') || cv.querySelector('.tx-win') || cv.querySelector('.tma-frame');
      const r = cv.getBoundingClientRect();
      const q = win && win.getBoundingClientRect();
      if (!q || !r.width) return;
      const unit = r.width / 1120;
      const x = (q.left - r.left) / unit;
      const w = q.width / unit;
      const k = Math.min(1, (W - 24) / w);
      cv.style.left = '0px';
      cv.style.transformOrigin = '0 0';
      cv.style.transform = 'translateX(' + ((W - w * k) / 2 - x * k).toFixed(1) + 'px) scale(' + k.toFixed(4) + ')';
    });
  }

  function setupTabTransitions() {
    const s = document.querySelector('.section_home-roles');
    if (!s) return;
    new MutationObserver(() => {
      fit();
    }).observe(s, { subtree: true, attributes: true, attributeFilter: ['data-active'] });
  }
})();
