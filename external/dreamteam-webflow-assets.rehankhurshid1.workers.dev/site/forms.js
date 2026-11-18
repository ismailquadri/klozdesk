/* Dreamteam site forms (every page; loaded from the site footer code). Ported from dreamteam.ai's site code (15 Nov),
   so the new site's forms behave exactly like the live ones:

   1. Every form with an email box is numbered (data-form-position / data-form-count) for tracking, duplicate ids are
      made unique, and the submit gets #demo-submit when it has no id. The email box is set up for email (autocomplete,
      lower-cased on blur) and prefilled from ?email= in the URL.
   2. Work email only: the domain is checked against the live site's list of personal-email domains (kept as SHA-256
      hashes, as on the live site). A personal address gets an inline note under the box (the live site used alert())
      and the form won't send.
   3. Bot check: Webflow's Turnstile widget still loads, but the submit no longer waits for its token (16 Nov): nothing reads it.
   4. The scheduler: if RevenueHero hasn't loaded yet, the submit waits for it (up to 8s), then goes on.
   5. The lead goes to HubSpot (portal 245433002, form 646a3cc7-...) with the visitor's hubspotutk cookie; Webflow's own
      form handler is switched off for these forms, as on the live site.
   6. RevenueHero (router 7553, or <body data-booking="...">) gets the same fields and opens its booking dialog; when
      there is no booking to show, the form's "done" message replaces the form.
   7. Tracking: window.dtTrack pushes dt_* events to the dataLayer (and Clarity when present): form view, start,
      submit, blocked, scheduler queued/unavailable/error. GTM itself is not on this site yet. Add ?dt_debug=1 to the URL
      to see the forms and their events on the page.

   Edit and deploy from ~/Desktop/dreamteam-webflow-assets (npx wrangler deploy); no Webflow publish needed. */
(function () {
  'use strict';
  var HUBSPOT = 'https://api.hsforms.com/submissions/v3/integration/submit/245433002/646a3cc7-ba38-414a-bbc7-f2262152d00f';
  var ROUTER = '7553';
  var WAIT = 8000;
  /* personal-email domains, SHA-256 of the lower-cased domain (the live site's list) */
  var PERSONAL = new Set(
[
    "4ee67b96740982d561618070d4e1b8279e04542452ad55274fb2c952bd9d241b",
    "591bfe88c880df9685d3e298cac2271681a78e017441426ae3d5bd6c73cd3db7",
    "b33960790a6de22ca95a61c6d1310b3487304529cb0af6f3e9b80d2e5ddf76b8",
    "f81e0a262b0f3b39ec26b0a510c71ccd8612d26943abe338e13f77f3ab1a1a59",
    "06ae6b52ed986ed5349967715ae18b67f83e52e67984ab7e0b2b5404a7ef8cf2",
    "c22cfa842338a6a38b612b7e816bb209002e20150aabc74067195bdd938f1795",
    "98094d8ac24edb4cd7d642d498b69567d7ff20f8d68e279b4b02606587b3725e",
    "48bf93ce6376a67021edeff13584235b852ec01e188e65151fcd71f3ecfc8bcf",
    "3e2ae79c33547fe9e8c159276ef409a2140d527f75c0646d3f076b27512b6cdd",
    "14e0dae7a689043f6427ca7c596e09b4045b6b5711a3ccc9707ad86ee18dc34e",
    "c3b2f6305fe639414879a8e1d152fa887437ad8e93db8656abb54d15d1696e2d",
    "fb1a8477d681c97d362a21f01ddc0e723b34ea34863b46f4da443f93f0da8403",
    "abc34802cb5ecee9ceda738d7c78d9b88eef9b15f3743844f4101f10b419daaf",
    "e4a000438535d16701b57546646ac2284c4115a156212a4a82c73d13a673046c",
    "7795a0faae5ae2c8e3459b0e1cdedd1e7f4be67ceb002ed0d93605b0a9fe427e",
    "f847386b0fb0e44f2e7c00d5accda4ab356cb2a6f28e229ff54806cfebd15ce8",
    "8304152effb3d856f0d1ece1645b52538121cd5630bae462e3f996881622f8a3",
    "f572176ac44010a7c2529c39a9edcac1af924710c2647bebfe78a28b6a84ba2b",
    "3fcb8282b84676ebee7140e39ecae16eeb199064c7c7e4432e28c9b57e4b6039",
    "43ed0d7955f05323b4f9f31598d2e4e335299e830e9ab1e7723eb37b77a1eeea",
    "3a4908053810a15a289ddd8907e89dde8093290836c7c5bcb0191173b825079f",
    "a259c2b50d785080f8be7f17caf8156c8d18f47edbaf518fa6f59f29cd28f15c",
    "0bd023f4a98a52634dd261fe479560103091c6bb966d2752a0e13582b1574052",
    "97315ff74944e5b0eb5574cee9629327d6efdd8c2a12b71c53fecc846a9d0eaa",
    "8af81f3c805fa9cd37ef32960f8327d608b887b25cba84445f7b40cef2932579",
    "f9815957d39b05c2c620b80b31c7d2cfcade4c4256c42e456cf5af2383180616",
    "ac5e52b97c67ee5c49ef815d5e3298b2d0da69a6fdae9b9272e08c7229b1e57d",
    "64f2aefd83f2761dffada167e0739a35ac39a65b5c00d7dfba123332eba5ef6d",
    "7f4b2e8dd4917e084fd8bc1efe455064209711398f03482c4ffe0e0f1cd11112",
    "b43832b11cd83820c2f78ab311f9191aba3f4ed26ed0a450c4139d0902bfe6d7",
    "ad599af890e802f117556c107f1cbb9de370e7709eea8175f23e10fe3f2b6c30",
    "1586cb5ffaafa268b3a61f3adc46974f9813ec939eb88028d74b39d4c53ba2cc",
    "b157b3314acb5e8ada8a07a9dd07591470c25de4d078034361f63eea0b601db1",
    "d3e894336ae7045b63827c599ea9eca6b5903f325028feb31c713e8134418558",
    "98b1a3f9ca928762a92860bb871584a93f161f65f3ac5a296bf8c0579edacd25",
    "0f1de5405979e6c34bfc59de331f2395d6eb5ae51598e59c74db98aa877f9902",
    "e7c2c37a8879c886683c766d1a2c8e7ee5f69b31e916b04600c8692821679a07",
    "f3e1ce41e28266ce50fb2bbf09b2155a4d8de6d38a62e0c297ab9d7e0de5b3ae",
    "4501c40249d8e7680eb44ef9f9365f4b72d779c6e70b2f252f9b0adf1989c6a7",
    "962fc8b91480c13949c777f5a6bbd26c96a28e0aae31a2b9b9623a1d18a20bbe",
    "22a8b232114117b463fcf503eae2278ed288a0304b3c9f87e16b8e553fdf6b08",
    "b493f9a77d77dfaad89ad98401fc84d4af4cbdde7152258690eec6b27f59c5f0",
    "435153fc19bb5c45981ee81201d2adcc054b0a6ab98a9447f161ea40834f6852",
    "8fa80750152a6cecf566e74abcc1c57f6990bb6964ce0a947de854ea53582f65",
    "ee4f0a9a866b8ae849b3947d381d2f2d34b884b5392d66769844620ca6c6fc09",
    "26928794cbaf7d765bc56a2d5f3daa8e78fe52e27e652aad02be089b1080a6cd",
    "5fc3b78604d30471f6640e0942319581b9f4034b77bf09f26e4d0a2c98539230",
    "78dff0d5911f93ec1d5e1903ee0cb9c912a03fd5327a21fec6b69bdc8b066254",
    "2112ee85a0a2353e504acc9bcae79c5fb637480adfa823792375070ed7bd7270",
    "a588cf385e5a5f26fb3b23e356d7efd75779f77a2cc5115da43c1904c2536c49",
    "2c35afc8cd6ca25385d04089cc97f0da974b87ad0e1755ec3a2b0ca057986df7",
    "0630d9941cfe92d2d47d5e4db63bb7b196909d4afc0ce789b200355afc0d705c",
    "98e9e698e2c8d371cd1213d96bea7d1dc688c5498a8745ad05910c696ec59d51",
    "680b3a8df221dd11c16201fdc8ab83ad8f284e9e1259427c5b46652cacc3458c",
    "ebc933389c0b7fde67922fa91a97dbaf3cb14a764a73813149836819924f84ae",
    "05b5616fa89869a19b089f3e29de07521f4c4e088bf5f8951a343ac5ba78f3a0",
    "d50f7a43292dae41fd60d5c8d04cff3a5aa42cb6333856b10db31835497ea1c7",
    "de11eb8e09b9007ceeb41dffd7a1568db81fdfddef11c227c2c3ab1b36f2c8f1",
    "08e6e232981164c7cb42c33a2f6e5308a5e50d88045c12cc4ba73c29b4b57f75",
    "402b8981163925294bc723965d256c3c4676621d419fcdd7f607be84610efd43",
    "7c4e7828de2ffb8bf706f99bf32a02001c42dbba2955b2cd3cd511b3cae7ce8f",
    "1eec7adc7a3b2d821f78668d51dc55664a62842ad37490beec9c04b96007e698",
    "ada31fee6a0c5c92a5ba49fd700c5f66077afe6a93d17f4adb62e08fe71f7274",
    "4045506a516038a8695d14cd00274560b70d9bc15f1cf7653d1a8ade8b600b25",
    "0a07ceb3933ae580ae223ae40fc9b0cb86b3f1fe1aacd8f5238285de0e22cf38",
    "16903debca7c3db011fb5c3e14d8aa76d1f943293ff2e2696f142d80bfa2c14f",
    "b1d9c2195abd15346987d39fc31f20a8d77d1ec815a98608de8b9340c70c028b",
    "923924d81e805723bfdfc73683291217b8decdf5abcfd1ee1626a642943d76ed",
    "6129c1f50e027bda52e3cc9b3a70c57ddc962999b465d0f757becbe9eef3c0f6",
    "681805995a0bf3ad8e97d8ea24e5dca90f8bb72b80196c59866391dee2e0f0ab",
    "e534ef78be4276048918885519c684a43f3b32ac282f9e180f9819a879bc9fac",
    "b0dfd4a217c0fb8d36c89d00d030e08ab69610a73c30de5ed4309beaf435658e",
    "658bdcfa167a3f855b10298ff7959cd0d2ea62f2dc1ffd4b46bf81cef114c179",
    "53098e5dccbbbff90da00f40ac306e68227f33b5fbdc402ffb2a8b2b7563edbe",
    "17beb25c830927360f28f119662d293efb037dcf93dd8833397f0d268b5dddf1",
    "1f69b1038cee7f1e3e67aa48c77970ae6d7dc0631a55f5051ab5d68425529f95",
    "9bb4d1ff64e165c5020bee45003595e1bbca2a96a592e1f39e5f15088130b872",
    "6e6faa9131ef27c9419665c8e09fc100019e7a7e4cc01a9ee430061b53c7ed03",
    "7c0f8dfafa9bed68a205d3160b5b4b0487ffff8bb1a0a2c0ade622682205a0c9",
    "77f3e4bca5e8a0be07cf5ad6c4d2f4bff369c458965e6767f59d4a5aa7edfe7c",
    "c1adff28035f67f7337edf46a392df14645e9a3e7774d15027729ac82c5c6be1",
    "f2105a9402cdba00b20994a2fc88d44aea2a3f8b82e630447f7c3d6c98692075",
    "dc5c34fc587aa0b1b2d15ce7805e6afb3ca37fb00df9249b4dc92cb32402a2f2",
    "85a7ba2ce061d4a839cf504b544e0d7163ed61d6bbc3910bd121f0f744177f42",
    "d9440e97ae58a143baf5b4fee0a1cfc388ec3c7097b43f8f658a88d2f02126b7",
    "c26ffec4b22723e3eca81a3817a18bb05ddbbc1c8ac819987cb4b2cc40ba3377",
    "3885078857a5f84f7bb405eeb694a37ee0eff99ce267888fee0235497644c59d",
    "d6656df145a1503a9b415b83130353852bb4d86cbd105c2e6ea248793e5fc5e9",
    "b00520a285545ae40ceb936532b048f9f0ff509624aa838c5c363c088ab6e76e",
    "48ab1b6c872033056ce3a30a82a220e1f371d12306b0c0411a671a5634d5b7e9",
    "8623d5e92773bd3921d5241424f3f565f18929903ec7f429706cd0065aa80e71",
    "077d4dae45828c1a1ea2a80d4ee3bdf2f5e0f1425b91bca3f8d764c2c257b1cf",
    "352d9766677bd4d0e9c40c51a517b39f170782373eda138e1f042f2ee661174a",
    "92a4fbcdd2c01c44c93c35536117c28f9d4aff5bf6f311e13f83d38b92ede08f",
    "d7f454e83148371792044204f0294c7c1eaa5c593964212354168c43368e2a40",
    "2655cf7b03eeebc9e21d1b2ce28e60bc209c8c8f2c4fd1a57c78bff88260cebb",
    "120d983275fb39fa0c8b18b87e85d14df0f3b93470665abf04707b9d24f219ed",
    "5025bf11fb304a899d086af5a8dada89bbee00a4ed2693730e75021b6d17efcd",
    "c0a0f6c21c8dbeb24f8f903958241c17190dc599dbd3919216b7390d620cdd17",
    "ebbbf8ba0522794752dfb29402576d5a0fdace99e01c42d9335198bccd211dd8",
    "51a19b04dc509ef62cd5ba5af8edf7ea57bc382cb6ed7be7323b7f62a7424f45",
    "f7b86e15eaa50b82761feecb9878896c44e510bdad2eb8ee91d09c8d0397cf5d",
    "06ef83e9dc56e381b0de8792250a1bfe166bbdc1cb917e4c2d2d92e7b9a92a56",
    "16dc321f2e55b69f792b785d39cba04b6c698360e7c85c53cdcfcccc3210464d",
    "e11b65b1735047e4c1a98ab4c50224f97dccc2586cade3602b133e1550cea0f2",
    "fd3b36a4157d28bba6bce38c9a7244b37bcb459c97732473847a393392ee84f4",
    "a22e2faeaa3498ff8b4bf5ca8e190a7bda6a0cc5d114bad41cccdc35ae5914f1",
    "fd091ec7de93d265e6e9b276350a94104e88a2d738239509cb292e2980628b9e",
    "b7ecdcb1c8882d28880cfa930c7de02bd3d267c71c2db1d933ab2643f2272130",
    "0e87856d851a4f9b3954e808571c83d7da89ea4ff59fe3973507d7c79bdc1cff",
    "b959b0964e0ea9960d695f243572da9e6027c1722ea2e05d60f9873cded46131",
    "83766db589eb9627f327dcad66092792bac6c70d6335eff95064da71d815256a",
    "35e441e49b5d839db7b2bf0add0459567cac8c16275a8daa9671ca4af56651a8",
    "333226db07354b5db859c8b7bef0686eef695fb2b51710c985a956097b633739",
    "bb6f0b51b6c2107d92f3145fea245ccc6e853424ee0c8a7d648ae90f58f20ada",
    "a0a8a4277ffc29c592cd543bdb390fd69f0ac1182be33d1e16a21ad734d40c24",
    "9fda2d569d92a42c5e012c9aba56e9ee83d0090d3a6622a4e218898109b70280",
    "133066d136b708a4150de48314e419b20860bced2de42ece461f283b86bf9a64",
    "694fc24880c28651880471ad7685beb80f715affda02e595fdc424e77d7c7d45",
    "d388e17d7c0fbeb1ef57d30eef1761d9040f71eea5d435614c025146db759feb",
    "586b66a22aff427d586576258f907712c671c6224504667f7e68081e9331ab40",
    "84329d036d54cd903ba6baa190526d689fbc0c3e20a5b2508c072ad0debe523a",
    "d74fffc85c6a47314db7215bc9198a2e4cb1b3b6f0572e69f2eed2f64a0452d3",
    "079bdbe5ffe8e6d1ae7bf32a59f825684cba323357622e0e94fe01a04bafea73",
    "e2b650e90e444a051e8d70bd46da8f6d3f30445f4b4f49e0c33da9f41b475f05",
    "a3136afdf4de515d906bf35e0ac18b27dbf5d6892adf2e9316f92524a9e6e173",
    "8c2b9420def8d231d9d4fe0e5209fdffcd4e5feec70afd7e3f4c0ca81267e32b",
    "41ea93c9bbd553cccaef5fdc301148f522aca8e4d77541e5ea49e7f5b40e5a3f",
    "1ee2f495c24991da44ee0b8e9989bf8f04370c1dc31c3512e328b6abac6b4d41",
    "4770971de008c2fc245583e13c5dedcb53dedd12f2b4a2a8694c69c8553c4803",
    "277d6d0ac2f547e421a8af27549486080aac754c5e5ba768e9912a1f1a73cbe3",
    "c2486832d687e44d492c3ea89b96ad88ded1565b4708c1c0c9a078db49d71ea8",
    "1e439330a1bcffb176b3c3da03c5960e6d3ad9cfa7943946ff5f9357a6ec691e",
    "cc67c39ea3028d637a7fac89a75482fefa56eb7fac5e7955d6b6d1c592992825",
    "e59b4b8a9d7d61e35cd3e276bc0306405ce94ea780977e53e8eb553d4f53a174",
    "f14a4e202b5b56caa6f8780d1025b6aa7cd02642bd40b85e2bfca41caabe5523",
    "495a00045502d0f2f5b35d68cd9e792791a3ac78ebe1529304117f08b71ef4b3",
    "4bbe1c3386bfea98fc7edb35e2435564a8e6f709b2e73b9df699eae8dd387b0a",
    "11bf328683c5cb0df063b2e05e556cf8376f2c6193375c32ba3cf867dd068729"
  ]  );
  /* The messages (Bharath, 16 Nov): 1 empty, 2 not an email, 3 not a work email (throwaway or personal), 4 send failed,
     5 sent (with the address they typed) */
  /* LEGACY (Rehan, 16 Nov): until Surya signs off the new inline messages, every form behaves like the current
     dreamteam.ai site: the browser's own check for an empty or malformed email, a browser alert() plus a red box for a
     personal email, and Webflow's own done/fail messages. Set to false to switch to the inline notes (the new
     behaviour, also kept as forms.inline-note.js). */
  var LEGACY = true, LEGACY_ALERT = 'Please use a work email. We do not accept personal domains.';
  var EMPTY = 'Enter your work email.', INVALID = 'Check your email address.', NOTE = 'Use your work email to schedule a demo.',
      FAILED = 'That didn\u2019t go through on our end. Try again.',
      SENT = function (email) { return 'Thanks. We\u2019ll email ' + email + ' to book a time.'; };
  /* What counts as an email: one @, nothing an address can't hold, no dot at either end of the name or doubled, and a
     domain with a real ending (.com, .io, ...). The browser's own check let "jo@acme" through. */
  function isEmail(v) {
    var m = /^([a-z0-9!#$%&'*+\/=?^_`{|}~.-]+)@((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,})$/i.exec(v);
    return !!m && m[1].charAt(0) !== '.' && m[1].slice(-1) !== '.' && m[1].indexOf('..') < 0 && v.length <= 254;
  }

  var page = location.pathname;
  var pageType = page.indexOf('/lp/') === 0 ? 'lp' : page.indexOf('/vs/') === 0 ? 'vs' : page === '/' ? 'home' : 'page';
  var dataLayer = window.dataLayer = window.dataLayer || [];
  window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
  var CLARITY_TAG = { dt_form_start: 'form_start', dt_form_submit_attempt: 'form_click', dt_work_email_blocked: 'form_blocked', dt_form_submit: 'form_submit', dt_meeting_booked: 'form_booked' };

  function submitOf(form) { return form.querySelector('input[type="submit"], button[type="submit"]'); }
  function emailOf(form) { return form.querySelector('input[type="email"]'); }
  function sectionOf(form) {
    var s = form.closest('section, .section');
    return s ? s.id || (s.className || '').split(/\s+/).filter(function (c) { return c && c !== 'section'; })[0] || 'section' : 'none';
  }

  /* ---- 7. tracking ---- */
  window.dtTrack = function (event, form, extra) {
    var e = { event: event };
    var info = form ? {
      form_id: form.id || '', form_position: +form.dataset.formPosition || 0, form_count: +form.dataset.formCount || 0,
      form_section: sectionOf(form), form_cta: (function (b) { return b ? (b.value || b.textContent || '').trim().slice(0, 60) : ''; })(submitOf(form)),
      page_type: pageType, page_path: page, scheduler: form.dataset.scheduler || 'none', router_id: document.body.dataset.booking || ''
    } : { page_type: pageType, page_path: page };
    Object.keys(info).forEach(function (k) { e[k] = info[k]; });
    Object.keys(extra || {}).forEach(function (k) { e[k] = extra[k]; });
    dataLayer.push(e);
    try { window.clarity('event', event); if (form && CLARITY_TAG[event]) window.clarity('set', CLARITY_TAG[event], 'form ' + e.form_position); } catch (err) {}
    if (window.dtDebug) window.dtDebug(e, form);
  };

  function init() {
    var body = document.body;
    if (!/^\d+$/.test((body.dataset.booking || '').trim())) body.dataset.booking = ROUTER;
    var forms = Array.prototype.filter.call(document.querySelectorAll('form'), function (f) { return emailOf(f) && submitOf(f); });
    if (!forms.length) return;

    /* ---- 1. numbering, ids, the email box ---- */
    var seen = {}, words = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
    forms.forEach(function (form, i) {
      var n = i + 1, suffix = words[n] || 'x' + n;
      function unique(el) {
        var id = el.id;
        if (!id) return;
        if (!seen[id]) { seen[id] = true; return; }
        var next = id + '--form-' + suffix;
        form.querySelectorAll('label[for="' + id + '"]').forEach(function (l) { l.htmlFor = next; });
        el.id = next;
      }
      var submit = submitOf(form);
      if (!submit.id) submit.id = 'demo-submit';
      if (!LEGACY) form.noValidate = true;            /* our own inline note instead of the browser's bubble */
      form.dataset.formPosition = n;
      form.dataset.formCount = forms.length;
      form.dataset.scheduler = 'revenuehero';
      unique(form);
      form.querySelectorAll('[id]').forEach(unique);
    });
    /* As on the current site: Webflow disables the button while its bot check loads; keep it clickable (the submit
       below waits for the token) unless it's showing its "Please wait..." text. */
    if (LEGACY) forms.forEach(function (form) {
      var btn = submitOf(form);
      function free() { if (btn.disabled && !(btn.dataset.wait && btn.value === btn.dataset.wait)) btn.disabled = false; }
      new MutationObserver(free).observe(btn, { attributes: true, attributeFilter: ['disabled'] }); free();
    });
    var fromUrl = (new URLSearchParams(location.search).get('email') || '').trim().toLowerCase();
    var urlOk = isEmail(fromUrl);
    forms.forEach(function (form) {
      var input = emailOf(form);
      input.setAttribute('autocomplete', 'email'); input.setAttribute('inputmode', 'email');
      input.setAttribute('autocapitalize', 'off'); input.setAttribute('enterkeyhint', 'go'); input.spellcheck = false;
      input.addEventListener('blur', function () {
        var v = input.value.trim().toLowerCase();
        if (v !== input.value) { input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      if (urlOk && !input.value) { input.value = fromUrl; setTimeout(function () { input.dispatchEvent(new Event('input', { bubbles: true })); }, 0); }
    });
    ['https://assets.revenuehero.io', 'https://app.revenuehero.io', 'https://popup.schedulehero.io', 'https://challenges.cloudflare.com', 'https://api.hsforms.com']
      .forEach(function (href) { var l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; if (href === 'https://app.revenuehero.io') l.crossOrigin = 'anonymous'; document.head.appendChild(l); });

    /* ---- 2. work email only ---- */
    var verdicts = new Map();
    function isWork(email) {
      if (verdicts.has(email)) return Promise.resolve(verdicts.get(email));
      var domain = (email.split('@')[1] || '').toLowerCase();
      if (!domain) return Promise.resolve(false);
      if (!(window.crypto && crypto.subtle)) return Promise.resolve(true);
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(domain)).then(function (buf) {
        var hex = Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        var ok = !PERSONAL.has(hex); verdicts.set(email, ok); return ok;
      }, function () { return true; });
    }
    function noteFor(form) {
      var note = form.querySelector('.dt-form_note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'dt-form_note home-hero_hint';
        note.id = 'dt-form-note-' + form.dataset.formPosition;
        note.setAttribute('role', 'alert');
        note.hidden = true;
        note.textContent = NOTE;
        form.appendChild(note);
      }
      return note;
    }
    function flag(form, on, msg) {
      if (LEGACY) {                                    /* as on the current site */
        var box = emailOf(form);
        box.style.borderColor = on ? 'red' : ''; box.style.backgroundColor = on ? '#fff5f5' : '';
        form.classList.toggle('is-invalid', on);
        if (on) { alert(msg || LEGACY_ALERT); box.focus(); }
        return;
      }
      var input = emailOf(form), note = noteFor(form);
      note.textContent = msg || NOTE;
      note.hidden = !on;
      form.classList.toggle('is-invalid', on);
      if (on) { input.setAttribute('aria-invalid', 'true'); input.setAttribute('aria-describedby', note.id); }
      else { input.removeAttribute('aria-invalid'); input.removeAttribute('aria-describedby'); }
    }
    forms.forEach(function (form) {
      var input = emailOf(form);
      input.addEventListener('input', function () {
        var v = input.value.trim();
        if (form.classList.contains('is-invalid')) flag(form, false);
        if (v) isWork(v);
      });
      input.addEventListener('blur', function () {
        var v = input.value.trim();
        if (!LEGACY && v.indexOf('@') > 0) isWork(v).then(function (ok) { if (!ok) flag(form, true); });
      });
    });

    /* ---- 3 + 4. waiting for the bot check and the scheduler ---- */
    function waitFor(test, ms, step) {
      return new Promise(function (resolve) {
        var t0 = Date.now();
        (function tick() { if (test() || Date.now() - t0 >= ms) resolve(test()); else setTimeout(tick, step); })();
      });
    }
    var rhLoadedAt = 0, rh = null;
    function rhReady() { return !!rh && Date.now() - rhLoadedAt > 100; }

    /* ---- 6. RevenueHero ---- */
    var router = (body.dataset.booking || '').trim();
    var s = document.createElement('script');
    s.src = 'https://assets.revenuehero.io/scheduler.min.js';
    s.onload = function () { try { rh = new window.RevenueHero({ routerId: router, showLoader: false });   /* our status line shows the steps, not RevenueHero's dark loader (16 Nov) */ rhLoadedAt = Date.now(); } catch (err) { console.error('RevenueHero failed to start:', err); } };
    document.head.appendChild(s);

    /* ---- 5. the submit: Webflow's own handler is kept out; HubSpot, then RevenueHero ---- */
    function say(msg, text) { var t = msg.querySelector('div') || msg; t.textContent = text; }
    function done(form) {
      if (typeof status === 'function') status(form, null);
      var box = form.closest('.w-form') || form.parentElement, msg = box && box.querySelector('.w-form-done');
      var email = (emailOf(form).value || '').trim().toLowerCase();
      if (msg) { if (email && !LEGACY) say(msg, SENT(email)); form.style.display = 'none'; msg.style.display = 'block'; }
    }
    function fail(form) {
      if (typeof status === 'function') status(form, null);
      var box = form.closest('.w-form') || form.parentElement, msg = box && box.querySelector('.w-form-fail');
      if (msg) { if (!LEGACY) say(msg, FAILED); msg.style.display = 'block'; }
    }
    /* 16 Nov (Rehan): the submit is a visible sequence, so people know what is happening: "Sending your details",
       then "Got it. Opening the calendar", then the booking calendar opens, no sooner than ~2.4s after the click. The line
       sits where the consent note is (that steps aside while it shows). One-shot fill on the bar, no loops; reduced
       motion gets the text only. */
    /* 16 Nov (Rehan's sequence): 1. default; 2. on submit the arrow circle shows a spinning ring; 3. once sent, the field
       becomes "Form submitted"; 4. that text blurs out and "Opening the calendar" blurs in while a soft fill sweeps across
       the box; 5. the calendar opens and the box settles on "Submission received". */
    var STEPS = { sent: 'Form submitted', opening: 'Opening the calendar\u2026', done: 'Submission received' };
    var CALM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    function status(form, step) {
      var el = form.querySelector('.dt-form_status');
      if (!el) {
        el = document.createElement('div');
        el.className = 'dt-form_status'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); el.hidden = true;
        el.innerHTML = '<span class="dt-form_status-mark" aria-hidden="true"></span><span class="dt-form_status-text"></span><span class="dt-form_status-bar" aria-hidden="true"></span>';
        var field = form.querySelector('.home-hero_form-field');
        if (field) field.parentNode.insertBefore(el, field); else form.appendChild(el);
      }
      /* 16 Nov (Rehan): the steps take the place of the email box and button (same size and shape, so nothing jumps) */
      var box = form.querySelector('.home-hero_form-field');
      if (step && box && !form.classList.contains('is-status')) {
        el.style.minHeight = box.offsetHeight + 'px';
        el.style.borderRadius = getComputedStyle(box).borderRadius;
      }
      var t = el.querySelector('.dt-form_status-text'), wasHidden = el.hidden;
      form.classList.toggle('is-status', !!step);
      el.hidden = !step;
      el.dataset.step = step || '';
      clearTimeout(t._dtSwap);
      if (!step) { t.textContent = ''; t.classList.remove('is-out'); return; }
      var txt = STEPS[step];
      if (wasHidden || !t.textContent || CALM) { t.textContent = txt; t.classList.remove('is-out'); return; }
      if (t.textContent === txt) return;
      t.classList.add('is-out');                                  /* blur the old words out, then the new ones in */
      t._dtSwap = setTimeout(function () { t.textContent = txt; t.classList.remove('is-out'); }, 240);
    }
    function pause(ms) { return new Promise(function (r) { setTimeout(r, Math.max(0, ms)); }); }
    function fields(form) {
      return Array.from(new FormData(form)).filter(function (kv) { return kv[0] && kv[0] !== 'cf-turnstile-response'; })
        .map(function (kv) { return { name: kv[0].toLowerCase(), value: kv[1] }; });
    }
    function cookie(name) { var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)')); return m ? m[1] : ''; }

    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (forms.indexOf(form) < 0) return;
      e.preventDefault();
      /* 16 Nov (Rehan): the re-sent submit below is for HubSpot's collected-forms listener only (it listens on the form,
         so this document-level capture listener used to swallow it). Let it through; keep the page from navigating. */
      if (form.__dtPass) return;
      e.stopImmediatePropagation();                     /* Webflow's jQuery form handler never sees it */
      if (form.dataset.dtBusy) return;
      var input = emailOf(form), email = input.value.trim().toLowerCase(), button = submitOf(form);
      window.dtTrack('dt_form_submit_attempt', form);
      if (!LEGACY && (!email || !isEmail(email))) {
        flag(form, true, email ? INVALID : EMPTY);   /* no refocus: it opened autofill lists over the message (16 Nov) */
        window.dtTrack('dt_form_invalid', form, { reason: email ? 'invalid' : 'empty' });
        return;
      }
      form.dataset.dtBusy = 'true';
      var label = button.value;
      function reset() { delete form.dataset.dtBusy; button.value = label; button.disabled = false; form.classList.remove('is-busy', 'is-busy-done'); }
      isWork(email).then(function (ok) {
        if (!ok) {
          flag(form, true);
          window.dtTrack('dt_work_email_blocked', form);
          if (window.gtag) window.gtag('event', 'non_biz_email_error');
          reset();
          return;
        }
        /* 16 Nov (Rehan): hand the checked submit to HubSpot's collected-forms listener, as the old site did. That capture is
           what gave HubSpot the visitor's source (Paid social, UTMs, page views); without it every lead arrived through
           RevenueHero as "Offline sources". Webflow's own handler is switched off for this one event. */
        try {
          var wd = window.jQuery && window.jQuery.data(form, '.w-form'), wh = wd && wd.handler;
          if (wd) wd.handler = null;
          form.__dtPass = true;
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        } catch (err) {} finally { form.__dtPass = false; if (wd) wd.handler = wh; }
        if (button.dataset.wait) button.value = button.dataset.wait;
        button.disabled = true;
        /* 16 Nov (Rehan): no wait for Webflow's bot-check token any more. Nothing reads it (the lead goes to HubSpot and
           RevenueHero, not Webflow), and on the live Home hero it often hadn't arrived, so every submit sat on "please wait"
           for the full 8s. The HubSpot send starts straight away; only the booking dialog waits, for RevenueHero to load. */
        window.__dtLastForm = form;   /* before the HubSpot send: the site's LeadsWebflowFirst script reads it to send this lead to Webflow first */
        var hubspot = fetch(HUBSPOT, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
          body: JSON.stringify({ fields: fields(form), context: { hutk: cookie('hubspotutk'), pageUri: location.href, pageName: document.title } })
        }).then(function (r) { return r.ok; }, function (err) { console.error('HubSpot form submit failed:', err); return false; });
        var t0 = Date.now();
        /* 16 Nov (Rehan): 1. the button fills once while the lead sends (the form stays); 2. after ~1-2s the form gives way
           to "Got it. Opening the calendar"; 3. the calendar opens; 4. the form stays in its submitted state ("Thanks. We've
           got your details."), so closing the calendar shows the lead went in. */
        form.classList.add('is-busy');
        if (button.dataset.wait) button.value = 'Sending\u2026';
        var sentAt = hubspot.then(function () { return pause(900 - (Date.now() - t0)); })
          .then(function () { status(form, 'sent'); return pause(900); })
          .then(function () { status(form, 'opening'); return Date.now(); });
        return waitFor(rhReady, WAIT, 50)
          .then(function (ready) {
            window.dtTrack(ready ? 'dt_submit_queued' : 'dt_scheduler_unavailable', form);
            window.__dtLastForm = form;
            window.__dtRhSeen = {};
            window.dtTrack('dt_form_submit', form);
            var redirect = form.getAttribute('redirect') || form.getAttribute('data-redirect');
            if (!ready) {
              return hubspot.then(function (ok) { if (redirect && ok) location.href = redirect; else ok ? done(form) : fail(form); });
            }
            var data = {};
            new FormData(form).forEach(function (v, k) { if (k !== 'cf-turnstile-response') data[k] = v; });
            data.email = email;
            return rh.submit(data).then(function (session) {
              if (session) return sentAt.then(function (at) { return pause(at + 1500 - Date.now()); })
                .then(function () { closePopup(form); rh.dialog.open(session); status(form, 'done'); window.dtTrack('dt_scheduler_opened', form); });
              else { try { rh.dialog.close(); } catch (err) {} hubspot.then(function (ok) { ok ? done(form) : fail(form); }); }
            }).catch(function (err) {
              console.error('RevenueHero submit failed:', err);
              window.dtTrack('dt_scheduler_error', form);
              hubspot.then(function (ok) { ok ? done(form) : fail(form); });
            });
          })
          .then(reset, reset);
      });
    }, true);

    /* RevenueHero's own events, as the live site tracks them (each once per submit, slot picks every time) */
    var RH_EVENTS = { PAGE_LOADED: 'dt_scheduler_loaded', SLOT_SELECTED: 'dt_slot_selected', MEETING_BOOKED: 'dt_meeting_booked',
      MEETING_ALREADY_BOOKED: 'dt_meeting_already_booked', PROSPECT_DISQUALIFIED: 'dt_prospect_disqualified',
      AT_QUOTA_SHOWN: 'dt_scheduler_at_quota', CLOSE_DIALOG: 'dt_scheduler_closed' };
    window.addEventListener('message', function (e) {
      var type = e.data && e.data.type, name = RH_EVENTS[type];
      if (!name) return;
      var host = (e.origin || '').replace(/^https?:\/\//, '');
      if (e.source !== window && !/(^|\.)(schedulehero|revenuehero)\.io$/.test(host)) return;
      var seen = window.__dtRhSeen = window.__dtRhSeen || {};
      if (type !== 'SLOT_SELECTED' && seen[type]) return;
      seen[type] = true;
      window.dtTrack(name, window.__dtLastForm || null, { rh_event: type });
    });

    /* views and starts */
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); window.dtTrack('dt_form_view', en.target); } });
    }, { threshold: 0.5 }) : null;
    forms.forEach(function (form) {
      if (io) io.observe(form);
      form.addEventListener('focusin', function start() { form.removeEventListener('focusin', start); window.dtTrack('dt_form_start', form); });
    });

    /* ?dt_debug=1: outline each form and list its events on the page */
    if (/[?&]dt_debug=1/.test(location.search)) {
      var log = document.createElement('div');
      log.style.cssText = 'position:fixed;left:12px;bottom:12px;z-index:2147483647;width:320px;max-height:45vh;overflow:auto;padding:10px 12px;background:#111;color:#fff;font:12px/1.5 ui-monospace,Menlo,monospace;border-radius:8px';
      log.innerHTML = '<b>Form events (newest first)</b>';
      body.appendChild(log);
      forms.forEach(function (f) { f.style.outline = '3px solid #e11d48'; f.style.outlineOffset = '6px'; });
      window.dtDebug = function (ev) {
        var row = document.createElement('div');
        row.textContent = new Date().toTimeString().slice(0, 8) + '  ' + (ev.form_position ? 'Form ' + ev.form_position : 'page') + '  ' + ev.event;
        log.insertBefore(row, log.children[1] || null);
      };
    }
  }

  /* the note under the box, where the page has no style for it (Home's hero styles it in home-v5.css) */
  /* 8. The "Book a demo" popup (Nav > Demo popup, a native Webflow Modal): its stylesheet, and it closes before the
     booking dialog opens, since a modal sits above everything else on the page. */
  var popupCss = document.createElement('link');
  popupCss.rel = 'stylesheet'; popupCss.href = '/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/site/demo-popup/popup.css';
  document.head.appendChild(popupCss);
  /* site-wide type fixes (the short hyphen in Telegraf headings): site/type.js */
  var typeJs = document.createElement('script');
  typeJs.src = '/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/site/type.js'; typeJs.defer = true;
  document.head.appendChild(typeJs);
  /* rotating testimonials (Pricing's card): site/rotate.js, which does nothing where there are none */
  if (document.querySelector('.pricing-testimonial_items')) {
    var rotJs = document.createElement('script');
    rotJs.src = '/external/dreamteam-webflow-assets.rehankhurshid1.workers.dev/site/rotate.js'; rotJs.defer = true;
    document.head.appendChild(rotJs);
  }
  /* Anything marked data-demo-open (or linking to #book-demo), like the footer's Schedule a demo button, opens the same
     popup as the navbar's button: it lives in the Nav component, so the click is handed to that button, which Webflow
     links to the popup (16 Nov: the footer is back to a single button, no email box). */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-demo-open], a[href="#book-demo"]');
    if (!t) return;
    var nav = document.querySelector('.header_component .nav_actions .button:not(.is-secondary)');
    var pop = document.querySelector('.demo-popup_component');
    if (!nav && !pop) return;
    e.preventDefault();
    if (nav) nav.click(); else if (pop.showModal && !pop.open) pop.showModal();
  });
  /* 16 Nov (Rehan): "Schedule a demo" opens the popup with the cursor in the email box, on every screen, so the visitor
     can type straight away (on a phone the keyboard comes up with it). popup.css sits the card near the top on phones, so
     the box stays above the keyboard. Webflow's modal usually focuses the box itself; this makes sure of it. */
  (function () {
    var pop = document.querySelector('.demo-popup_component');
    if (!pop) return;
    /* 16 Nov (Rehan): on a phone the card sits right on top of the keyboard, not at the top of the screen with a gap
       under it. The browser's visual viewport says how tall the keyboard is; the card's bottom margin follows it. With
       no keyboard up, popup.css places it (near the top on phones). */
    var vv = window.visualViewport;
    function place() {
      if (!vv || !pop.open || innerWidth > 479) { pop.style.marginTop = pop.style.marginBottom = ''; return; }
      var kb = Math.round(innerHeight - vv.height - vv.offsetTop);
      if (kb > 120) { pop.style.marginTop = 'auto'; pop.style.marginBottom = (kb + 12) + 'px'; }
      else { pop.style.marginTop = pop.style.marginBottom = ''; }
    }
    if (vv) { vv.addEventListener('resize', place); vv.addEventListener('scroll', place); }
    new MutationObserver(function () {
      place();
      if (!pop.open) return;
      var box = pop.querySelector('input[type="email"]');
      if (box && document.activeElement !== box) box.focus({ preventScroll: true });
    }).observe(pop, { attributes: true, attributeFilter: ['open'] });
  })();
  function closePopup(form) {
    var pop = form.closest('.demo-popup_component');
    if (!pop) return;
    var x = pop.querySelector('.demo-popup_close');
    if (pop.open && typeof pop.close === 'function') pop.close(); else if (x) x.click();
  }

  var css = document.createElement('style');
  css.textContent = /* the submit steps (16 Nov) */
    '.dt-form_status{display:flex;align-items:center;justify-content:center;gap:.625rem;position:relative;box-sizing:border-box;width:100%;margin:0;padding:1rem 1.5rem;border:1px solid rgba(28,29,31,.12);background:#fff;box-shadow:0 1px 11px rgba(0,0,0,.06);overflow:hidden;font-size:1rem;line-height:1.4;color:#1c1d1f;text-align:center;animation:dtStatusIn .2s ease-out}' +
    '.dt-form_status[hidden]{display:none}.is-status .home-hero_form-field{display:none!important}' +
    '.dt-form_status-mark{position:relative;z-index:1;flex:none;width:1.125rem;height:1.125rem;border-radius:50%;background:#1c1d1f url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27%3E%3Cpath d=%27M4.5 8.2l2.3 2.3 4.7-4.9%27 fill=%27none%27 stroke=%27%23fff%27 stroke-width=%271.6%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E") center/100% no-repeat}' +
    '.dt-form_status-text{position:relative;z-index:1;transition:filter .24s ease-out,opacity .24s ease-out}.dt-form_status-text.is-out{filter:blur(6px);opacity:0}' +
    '.dt-form_status-bar{display:none}' +
    /* the fill: a soft brand wash sweeps left to right while the calendar opens, and stays */
    '.dt-form_status::before{content:"";position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,rgba(167, 139, 250,.30),rgba(129, 140, 248,.42));transform-origin:left;transform:scaleX(0)}' +
    '.dt-form_status[data-step=opening]::before{transform:scaleX(1);transition:transform 1.4s cubic-bezier(.4,0,.2,1)}' +
    '.dt-form_status[data-step=done]::before{transform:scaleX(1)}' +
    /* the button while the lead sends: the arrow gives way to a spinning ring inside the circle */
    '.is-busy .button_icon-wrapper.is-form-submit img{opacity:0}' +
    '.is-busy .button_icon-wrapper.is-form-submit::after{content:"";position:absolute;inset:.625rem;border:2px solid rgba(28,29,31,.2);border-top-color:#1c1d1f;border-radius:50%;animation:dtSpin .8s linear infinite}' +
    'html .demo-popup_content form.is-busy .button_icon-wrapper.is-form-submit::after{border-color:rgba(255,255,255,.3);border-top-color:#fff}' +
    '@keyframes dtSpin{to{transform:rotate(360deg)}}' +
    '.is-busy .button.is-form-submit{cursor:progress}' +
    '@media (prefers-reduced-motion:reduce){.is-busy .button_icon-wrapper.is-form-submit::after{animation-duration:2.4s}.dt-form_status-text{transition:none}.dt-form_status::before{transition:none!important}}' +
    '@keyframes dtStatusIn{from{opacity:0;transform:translateY(-2px)}to{opacity:1;transform:none}}' +
    '@media (prefers-reduced-motion:reduce){.dt-form_status{animation:none}.dt-form_status-bar{display:none}}' +
    '.is-status .home-hero_consent,.is-status .contact-options_form-note{display:none!important}' +
    '' +
    '.dt-form_note{margin:.75rem 0 0;padding:0 .25rem;font-size:.75rem;line-height:1.5;color:#4B22C4;text-align:left}.dt-form_note[hidden]{display:none}' +
    '.home-hero_form.is-invalid .home-hero_consent,.home-hero_form.is-invalid .contact-options_form-note{display:none!important}' +
    /* the Demo form stacks (email above, full-width button below) when the space it sits in is narrow, whatever the
       screen: the footer column and the Pricing card. Same look as the form's phone layout. */
    '.home-hero_form-block{container-type:inline-size}' +
    '@container (max-width:30rem){.home-hero_form-field{flex-wrap:wrap;height:auto;padding:.5rem;row-gap:.5rem;border-radius:1.875rem}' +
    '.home-hero_form-icon{margin-left:1rem}.home-hero_input{flex:1 1 calc(100% - 3rem)}.home-hero_submit-wrapper{width:100%}.home-hero_form-field .button.is-form-submit{width:100%}' +
    '.contact-options_form-note,.dt-form_note{padding-left:1rem}}' +
    /* 16 Nov (Rehan): the demo pop-up keeps the email and its round arrow button on one line at every width (the
       stacked layout above left a stray black dot on phones), and drops its tall desktop height on phones */
    '.demo-popup_content .home-hero_form-field{flex-wrap:nowrap!important;row-gap:0!important;border-radius:100vw!important}' +
    '.demo-popup_content .home-hero_input{flex:1 1 0!important;min-width:0!important}.demo-popup_content .home-hero_submit-wrapper{width:auto!important}' +
    '@media (max-width:479px){.demo-popup_content{min-height:0!important;row-gap:2rem}}' +
    /* footer: over the form the real pointer is back (the footer swaps it for a "You" cursor), the "You" steps aside,
       and the consent line is light enough to read on the dark */
    '.footer_component.is-you .footer_form,.footer_component.is-you .footer_form *{cursor:auto}' +
    '.footer_component.is-you .footer_form input[type=email]{cursor:text}.footer_component.is-you .footer_form [type=submit]{cursor:pointer}' +
    '.footer_component:has(.footer_form:hover) .footer_you{opacity:0!important}' +
    '.footer_form .contact-options_form-note{color:rgba(255,255,255,.55)}.footer_form .dt-form_note{color:#A78BFA}' +
    /* 16 Nov: the browser's autofill paints the email box light blue (a filled pill inside the white field). Its fill and
       text colour are held off for good, so a filled address looks like a typed one; the field keeps its own white */
    '.home-hero_input:-webkit-autofill,.home-hero_input:-webkit-autofill:hover,.home-hero_input:-webkit-autofill:focus,.home-hero_input:-webkit-autofill:active{' +
    '-webkit-text-fill-color:#1c1d1f;caret-color:#1c1d1f;-webkit-box-shadow:0 0 0 1000px transparent inset;transition:background-color 600000s 0s,color 600000s 0s}' +
    '.home-hero_input:autofill{background-color:transparent!important;color:#1c1d1f}' +
    /* the error also shows on the field itself (a red edge), so it still reads if a dropdown covers the message */
    '.home-hero_form-field{transition:border-color .2s ease,box-shadow .2s ease}' +
    '.home-hero_form.is-invalid .home-hero_form-field{border-color:#4B22C4;box-shadow:0 0 0 1px #4B22C4,0 1px 11px rgba(0,0,0,.08)}' +
    '.footer_form .home-hero_form.is-invalid .home-hero_form-field,.footer_form.is-invalid .home-hero_form-field{border-color:#A78BFA;box-shadow:0 0 0 1px #A78BFA}';
  document.head.appendChild(css);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
