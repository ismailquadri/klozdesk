/* Dreamteam site type fixes (every page; loaded by site/forms.js). Edit and deploy from ~/Desktop/dreamteam-webflow-assets
   (npx wrangler deploy); no Webflow publish needed.

   The hyphen (16 Nov, Sree: "make the dash look less like an em dash"). PP Telegraf's hyphen is drawn long, so in the
   headings "AI-native" or "Pre-meeting" it reads as a dash. Every hyphen set in Telegraf is wrapped in
   <span class="dt-hyphen"> and drawn from Inter instead (a short, plain hyphen), nothing else changes. Text added later
   (the teammates' cards, the hero cards) is picked up as it arrives. */
(function () {
  'use strict';
  var css = document.createElement('style');
  css.textContent = '.dt-hyphen{font-family:Inter,system-ui,sans-serif;font-weight:inherit;letter-spacing:0;margin:0 .02em}' +
    /* 16 Nov (Rehan, "make the text wrap"): no last line left holding one word. `pretty` where the browser has it;
       short intro paragraphs balance their lines, which every current browser (Safari / iPhone included) supports */
    'p,h1,h2,h3,h4,h5,h6,li,blockquote{text-wrap:pretty}' +
    '.home-memory_paragraph,.product-hero_lede{text-wrap:balance}';
  document.head.appendChild(css);

  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|INPUT|SELECT|OPTION|CODE|PRE|svg|text)$/i;
  var telegraf = new WeakMap();
  function isTelegraf(el) {
    if (telegraf.has(el)) return telegraf.get(el);
    var v = /telegraf/i.test(getComputedStyle(el).fontFamily);
    telegraf.set(el, v);
    return v;
  }
  function fix(root) {
    if (!root || root.nodeType !== 1 && root.nodeType !== 3) return;
    var nodes = [];
    if (root.nodeType === 3) nodes.push(root);
    else {
      var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n;
      while ((n = w.nextNode())) if (n.nodeValue.indexOf('-') > -1) nodes.push(n);
    }
    nodes.forEach(function (t) {
      var p = t.parentElement;
      if (!p || t.nodeValue.indexOf('-') < 0 || SKIP.test(p.tagName) || p.closest('.dt-hyphen,[contenteditable],svg') || !isTelegraf(p)) return;
      /* only hyphens inside a word ("AI-native"), not a spaced dash ("Rachel - Research") */
      var parts = t.nodeValue.split(/(?<=\S)-(?=\S)/);
      if (parts.length < 2) return;
      var f = document.createDocumentFragment();
      parts.forEach(function (s, i) {
        if (i) { var h = document.createElement('span'); h.className = 'dt-hyphen'; h.textContent = '-'; f.appendChild(h); }
        if (s) f.appendChild(document.createTextNode(s));
      });
      p.replaceChild(f, t);
    });
  }
  function start() {
    fix(document.body);
    if (!('MutationObserver' in window)) return;
    var queue = [], raf = 0;
    new MutationObserver(function (ms) {
      ms.forEach(function (m) { m.addedNodes.forEach(function (n) { if (!(n.classList && n.classList.contains('dt-hyphen'))) queue.push(n); }); });
      if (queue.length && !raf) raf = requestAnimationFrame(function () { raf = 0; var q = queue; queue = []; q.forEach(function (n) { if (n.isConnected) fix(n); }); });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
