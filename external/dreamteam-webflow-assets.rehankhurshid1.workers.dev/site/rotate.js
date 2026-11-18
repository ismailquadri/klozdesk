/* Rotating testimonials (every page; loaded by site/forms.js; acts only where the markup exists). Edit and deploy from
   ~/Desktop/dreamteam-webflow-assets (npx wrangler deploy); no Webflow publish needed.

   Pricing's testimonial card (16 Nov, Lakshmi's three quotes): .pricing-testimonial_items holds one
   .pricing-testimonial_item per quote, stacked in one grid cell (Webflow classes). One shows at a time and they
   cross-fade every 6s while the card is on screen; hovering or focusing the card holds the current one. With reduced
   motion only the first shows. Add or remove quotes in Webflow by duplicating or deleting an item. */
(function () {
  'use strict';
  var lists = document.querySelectorAll('.pricing-testimonial_items');
  if (!lists.length) return;
  var css = document.createElement('style');
  css.textContent =
    '.pricing-testimonial_item{opacity:0;visibility:hidden;translate:0 .5rem;transition:opacity .5s cubic-bezier(.22,1,.36,1),translate .6s cubic-bezier(.22,1,.36,1),visibility 0s .5s}' +
    '.pricing-testimonial_item.is-active{opacity:1;visibility:visible;translate:0 0;transition-delay:.12s,.12s,0s}' +
    '.pricing-testimonial_item.is-leaving{translate:0 -.5rem}' +
    '@media (prefers-reduced-motion: reduce){.pricing-testimonial_item{transition:none!important;translate:none!important}}';
  document.head.appendChild(css);
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  lists.forEach(function (list) {
    var items = [].slice.call(list.querySelectorAll(':scope > .pricing-testimonial_item'));
    if (!items.length) return;
    var idx = 0, timer = null, held = false, seen = false;
    items.forEach(function (el, i) { el.classList.toggle('is-active', i === 0); if (i) el.setAttribute('aria-hidden', 'true'); });
    function go(next) {
      var cur = items[idx];
      cur.classList.remove('is-active'); cur.classList.add('is-leaving'); cur.setAttribute('aria-hidden', 'true');
      setTimeout(function () { cur.classList.remove('is-leaving'); }, 650);
      idx = next; items[idx].classList.add('is-active'); items[idx].removeAttribute('aria-hidden');
    }
    function stop() { clearTimeout(timer); timer = null; }
    function play() {
      stop();
      if (reduced || items.length < 2 || held || !seen) return;
      timer = setTimeout(function tick() { go((idx + 1) % items.length); timer = setTimeout(tick, 6000); }, 6000);
    }
    var card = list.closest('.pricing-testimonial_card') || list;
    card.addEventListener('pointerenter', function () { held = true; stop(); });
    card.addEventListener('pointerleave', function () { held = false; play(); });
    card.addEventListener('focusin', function () { held = true; stop(); });
    card.addEventListener('focusout', function () { held = false; play(); });
    if ('IntersectionObserver' in window)
      new IntersectionObserver(function (es) { seen = es[0].isIntersecting; seen ? play() : stop(); }, { threshold: .4 }).observe(card);
    else { seen = true; play(); }
  });
})();
