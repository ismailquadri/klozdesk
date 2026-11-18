// Theme toggle
(function () {
  const stored = localStorage.getItem('dt-docs-theme');
  const initial = stored || 'light';
  // Pagefind's search UI switches only on the `data-pf-theme` attribute (it
  // does not read prefers-color-scheme), so we set it alongside our own
  // `data-theme`. Its --pf-* variables are remapped to our palette in CSS.
  function setTheme(t) {
    document.documentElement.dataset.theme = t;
    document.documentElement.dataset.pfTheme = t;
  }
  setTheme(initial);
  window.__toggleTheme = function () {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('dt-docs-theme', next);
  };
})();

// Code panel tabs + copy
function __initCodePanels() {
  document.querySelectorAll('.code-panel').forEach(function (panel) {
    // Legacy tab switching (used by the record-model panel and any panel
    // that still uses data-tab bodies).
    const tabs = panel.querySelectorAll('.code-panel-tab');
    const bodies = panel.querySelectorAll('.code-body[data-tab]');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const key = tab.dataset.tab;
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        bodies.forEach(function (b) { b.hidden = b.dataset.tab !== key; });
      });
    });

    // Request panels: with/without-associations sub-tabs. Mirrors the response
    // variant bar, but for request bodies. Owns `hidden` only — the object tabs
    // (contact/company/deal) filter via the .object-filtered-out class, so the
    // two dimensions compose without either clobbering the other.
    const reqVariantBar = panel.querySelector('.request-variant-bar');
    if (reqVariantBar) {
      const reqTabs = reqVariantBar.querySelectorAll('.request-variant-tab');
      const reqBodies = panel.querySelectorAll('.code-body[data-req-variant]');
      const reqSection = panel.closest('section.endpoint');

      function applyReqVariant(v) {
        reqTabs.forEach(function (t) {
          t.classList.toggle('active', t.dataset.reqVariant === v);
        });
        reqBodies.forEach(function (b) {
          b.hidden = b.dataset.reqVariant !== v;
        });
        // Publish to the section so the Test Request drawer prefills the body
        // that matches the curl on screen. Without this the drawer always
        // opened with the plain body even while the with-associations curl
        // was showing.
        if (reqSection) reqSection.dataset.currentReqVariant = v;

        // Keep the response panel telling the same story as the request. A tab
        // opts in with data-sync-response="<response variant>"; we replay a
        // click so the response panel's own handler owns its state rather than
        // us reaching into its closure.
        const activeTab = reqVariantBar.querySelector('.request-variant-tab.active');
        const syncTo = activeTab && activeTab.dataset.syncResponse;
        if (syncTo && reqSection) {
          const respTab = reqSection.querySelector('.response-variant-tab[data-variant="' + syncTo + '"]');
          if (respTab && !respTab.classList.contains('active')) respTab.click();
        }
      }

      reqTabs.forEach(function (t) {
        t.addEventListener('click', function () { applyReqVariant(t.dataset.reqVariant); });
      });

      const initial = reqVariantBar.querySelector('.request-variant-tab.active');
      applyReqVariant(initial ? initial.dataset.reqVariant : 'plain');
    }

    // Response panels: status tabs + variant sub-tabs + Show Schema toggle.
    if (panel.classList.contains('code-panel-response')) {
      const statusTabs = panel.querySelectorAll('.response-status-tab');
      const variantBars = panel.querySelectorAll('.response-variant-bar');
      const captions = panel.querySelectorAll('.response-caption');
      const respBodies = panel.querySelectorAll('.code-body[data-status]');
      const schemaBtn = panel.querySelector('.show-schema-toggle');

      const state = { status: null, variant: {}, view: 'example' };

      function apply() {
        // Show only the active status's variant bar
        variantBars.forEach(function (b) {
          b.hidden = b.dataset.statusVar !== state.status;
        });
        // Show only the active caption
        captions.forEach(function (c) {
          c.hidden = c.dataset.status !== state.status;
        });
        // Bodies: match status + view. For view=example, also match variant.
        respBodies.forEach(function (body) {
          const s = body.dataset.status;
          const v = body.dataset.variant;
          const view = body.dataset.view;
          let show = (s === state.status);
          if (state.view === 'schema') {
            show = show && (view === 'schema');
          } else {
            show = show && (view === 'example');
            if (v != null) {
              const activeVariant = state.variant[s] || null;
              show = show && (activeVariant == null || v === activeVariant);
            }
          }
          body.hidden = !show;
        });
        if (schemaBtn) schemaBtn.classList.toggle('active', state.view === 'schema');
      }

      // Init from initially-active elements
      const initialStatus = panel.querySelector('.response-status-tab.active');
      if (initialStatus) state.status = initialStatus.dataset.status;
      panel.querySelectorAll('.response-variant-bar').forEach(function (bar) {
        const active = bar.querySelector('.response-variant-tab.active');
        if (active) state.variant[bar.dataset.statusVar] = active.dataset.variant;
      });

      statusTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
          state.status = tab.dataset.status;
          statusTabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
          apply();
        });
      });
      variantBars.forEach(function (bar) {
        const varTabs = bar.querySelectorAll('.response-variant-tab');
        varTabs.forEach(function (t) {
          t.addEventListener('click', function () {
            state.variant[bar.dataset.statusVar] = t.dataset.variant;
            varTabs.forEach(function (x) { x.classList.toggle('active', x === t); });
            apply();
          });
        });
      });
      if (schemaBtn) {
        schemaBtn.addEventListener('click', function () {
          state.view = (state.view === 'schema') ? 'example' : 'schema';
          schemaBtn.textContent = (state.view === 'schema') ? 'Show Example' : 'Show Schema';
          apply();
        });
      }
      apply();
    }

    // Copy button — always copies the code inside its own panel
    const copy = panel.querySelector('.code-panel-copy');
    if (copy) {
      copy.addEventListener('click', function () {
        const visible = panel.querySelector('.code-body:not([hidden]):not(.object-filtered-out) code');
        if (!visible) return;
        navigator.clipboard.writeText(visible.textContent.trim());
        const label = copy.querySelector('.copy-label');
        if (label) {
          const prev = label.textContent;
          label.textContent = 'Copied';
          setTimeout(function () { label.textContent = prev; }, 1200);
        }
      });
    }
  });

  // Object-type tabs (Contact / Company / Deal). A section can have several
  // .code-object-tabs bars (one above request, one above response); all bars
  // in the section stay in sync, and every .code-body[data-object] within the
  // section is filtered by the active object. Uses a class rather than the
  // `hidden` attribute so this filter composes cleanly with the response
  // panel's status/variant/view filter, which already owns `hidden`.
  document.querySelectorAll('section.endpoint').forEach(function (section) {
    const bars = section.querySelectorAll('.code-object-tabs');
    if (!bars.length) return;
    const initial = section.querySelector('.code-object-tab.active');
    let current = (initial && initial.dataset.object) || 'contact';
    section.dataset.currentObject = current;
    function apply(obj) {
      current = obj;
      section.dataset.currentObject = obj;
      section.querySelectorAll('.code-object-tab').forEach(function (t) {
        t.classList.toggle('active', t.dataset.object === obj);
      });
      section.querySelectorAll('.code-body[data-object]').forEach(function (body) {
        body.classList.toggle('object-filtered-out', body.dataset.object !== obj);
      });
      // Status tabs scoped to one object (e.g. a 409 that only companies can
      // return): hide the tab for the other objects, and if it was the active
      // one, click the first still-visible status tab so no panel is left empty.
      // Only tabs that carry data-object are touched, so unscoped panels are
      // unaffected.
      section.querySelectorAll('.response-status-tab[data-object]').forEach(function (tab) {
        const hide = tab.dataset.object !== obj;
        tab.classList.toggle('object-filtered-out', hide);
        if (hide && tab.classList.contains('active')) {
          const tabs = tab.closest('.response-status-tabs');
          const fallback = tabs && tabs.querySelector('.response-status-tab:not(.object-filtered-out)');
          if (fallback) fallback.click();
        }
      });
      // A status tab that is NOT pinned to one object, but whose example bodies
      // are object-scoped (they carry data-object) and offer nothing for the
      // current object — e.g. a 400 for a type that has no validation errors,
      // such as a note. Hide the tab for this object, and if it was active fall
      // back to a visible one so the panel is never left empty. Statuses whose
      // body is shared (no data-object, like the 204) are left untouched.
      section.querySelectorAll('.code-panel-response').forEach(function (panel) {
        panel.querySelectorAll('.response-status-tab:not([data-object])').forEach(function (tab) {
          const status = tab.dataset.status;
          const objectScoped = panel.querySelector('.code-body[data-status="' + status + '"][data-view="example"][data-object]');
          if (!objectScoped) return;
          const forObj = panel.querySelector('.code-body[data-status="' + status + '"][data-view="example"][data-object="' + obj + '"]');
          const hide = !forObj;
          tab.classList.toggle('object-filtered-out', hide);
          if (hide && tab.classList.contains('active')) {
            const tabs = tab.closest('.response-status-tabs');
            const fallback = tabs && tabs.querySelector('.response-status-tab:not(.object-filtered-out)');
            if (fallback) fallback.click();
          }
        });
      });
      // Same idea one level down: a response-variant tab whose example bodies are
      // object-scoped but offer nothing for the current object — e.g. a note has
      // a 404 "record not found" but not the generic "unknown object type". Hide
      // that variant for this object, falling back if it was the active one.
      section.querySelectorAll('.code-panel-response .response-variant-bar').forEach(function (bar) {
        const panel = bar.closest('.code-panel-response');
        const status = bar.dataset.statusVar;
        let firstVisible = null, activeHidden = false;
        bar.querySelectorAll('.response-variant-tab').forEach(function (vt) {
          const variant = vt.dataset.variant;
          const objectScoped = panel.querySelector('.code-body[data-status="' + status + '"][data-variant="' + variant + '"][data-view="example"][data-object]');
          const forObj = panel.querySelector('.code-body[data-status="' + status + '"][data-variant="' + variant + '"][data-view="example"][data-object="' + obj + '"]');
          const hide = !!objectScoped && !forObj;
          vt.classList.toggle('object-filtered-out', hide);
          if (!hide && !firstVisible) firstVisible = vt;
          if (hide && vt.classList.contains('active')) activeHidden = true;
        });
        if (activeHidden && firstVisible) firstVisible.click();
      });
      // Resolve the {object} placeholder in the endpoint path displays (both
      // the prose route heading and the code-panel header) so they match the
      // concrete object type shown in the curl. {id} stays a free variable —
      // it's per-record and has no tab to pin it.
      section.querySelectorAll('.endpoint-path, .code-panel-endpoint-path').forEach(function (el) {
        if (el.dataset.pathTemplate == null) el.dataset.pathTemplate = el.textContent;
        el.textContent = el.dataset.pathTemplate.replace('{object}', obj);
      });
    }
    bars.forEach(function (bar) {
      bar.querySelectorAll('.code-object-tab').forEach(function (t) {
        t.addEventListener('click', function () { apply(t.dataset.object); });
      });
    });
    apply(current);
  });

  // Search stub
  const search = document.querySelector('.searchbar');
  if (search) {
    search.setAttribute('title', 'Search is stubbed in this mock.');
  }

  // Test Request buttons
  document.querySelectorAll('.test-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.dataset.endpoint;
      const raw = window.TEST_CONFIGS && window.TEST_CONFIGS[id];
      if (!raw) { console.warn('No test config for', id); return; }
      // Per-object configs: raw is { contact: {...}, company: {...}, deal: {...} }
      // Legacy flat configs: raw is the config itself.
      const section = btn.closest('section.endpoint');
      const obj = (section && section.dataset.currentObject) || 'contact';
      let cfg = (raw && raw.method) ? raw : (raw[obj] || raw.contact || Object.values(raw)[0]);
      // Endpoints with a request-variant bar (with/without associations) carry
      // per-variant overrides — `body` for Create, `query` for Retrieve. Merge
      // in the one matching the curl on screen. Copied, not mutated —
      // TEST_CONFIGS is shared state reused across every open.
      const reqVariant = section && section.dataset.currentReqVariant;
      if (reqVariant && cfg && cfg.variants && cfg.variants[reqVariant]) {
        cfg = Object.assign({}, cfg, cfg.variants[reqVariant]);
      }
      openTestDrawer(cfg);
    });
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __initCodePanels);
} else {
  __initCodePanels();
}

// ---------------- Page feedback ----------------
// Voting swaps the row's contents in place, so the page never reflows and the
// reader can't vote twice.
//
// When site.feedbackEndpoint is set (data-endpoint), the vote is POSTed to the
// dreamteam-feedback Worker the instant it's clicked — so a bare vote counts even
// if the reader leaves — and an optional comment + email step is revealed; a
// comment is attached to that same vote row on submit. When data-endpoint is empty
// the widget stays local-only and behaves exactly as it did before (no network),
// falling back to the support-address offer on a "No". Network calls fail silently
// to a thank-you: feedback must never break the page.
function __initFeedback() {
  const box = document.querySelector('.feedback');
  if (!box) return;

  const endpoint = (box.dataset.fbEndpoint || '').replace(/\/+$/, '');
  const page = box.dataset.fbPage || '';
  const title = box.dataset.fbTitle || '';
  const support = box.dataset.support || '';

  const CHECK = '<svg class="fb-icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
  const MAIL  = '<svg class="fb-icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>';

  let currentVote = null;   // 'yes' | 'no'
  let voteId = null;        // row id returned by POST /feedback
  let votePromise = null;   // in-flight vote POST, so submit can await the id
  let done = false;

  function showDone(vote, withComment) {
    done = true;
    box.classList.remove('is-collecting');
    box.classList.add('is-done');
    let body;
    if (withComment) {
      body = CHECK + '<span><strong>Thanks — got it.</strong> We read every note and use it to sharpen these docs.</span>';
    } else if (vote === 'yes') {
      body = CHECK + '<span><strong>Feedback submitted.</strong> Thanks — glad this page helped.</span>';
    } else {
      body = MAIL + '<span><strong>Thanks for your feedback.</strong> For further enquiry or assistance, you can reach us at ' +
        '<a href="mailto:' + escape(support) + '">' + escape(support) + '</a>.</span>';
    }
    box.innerHTML = '<span class="feedback-done" role="status">' + body + '</span>';
  }

  function showCommentStep(vote) {
    box.classList.add('is-collecting');
    const prompt = vote === 'yes'
      ? 'Glad it helped. Anything we should add?'
      : 'Sorry about that — what was missing or wrong?';
    box.innerHTML =
      '<form class="feedback-form" novalidate>' +
        '<p class="feedback-form-title" role="status">' + escape(prompt) +
          ' <span class="feedback-optional">optional</span></p>' +
        '<textarea class="feedback-comment" data-fb-comment rows="3" maxlength="2000" ' +
          'placeholder="Tell us more"></textarea>' +
        '<input class="feedback-email" data-fb-email type="email" autocomplete="email" ' +
          'placeholder="Email — only if you’d like a reply" />' +
        // Honeypot: hidden from humans, tempting to bots. A filled value is dropped server-side.
        '<input class="fb-hp" data-fb-hp tabindex="-1" autocomplete="off" aria-hidden="true" />' +
        '<div class="feedback-form-actions">' +
          '<button type="submit" class="feedback-submit" data-fb-submit>Send</button>' +
          '<button type="button" class="feedback-skip" data-fb-skip>No thanks</button>' +
        '</div>' +
      '</form>';
    const ta = box.querySelector('[data-fb-comment]');
    if (ta) ta.focus();
  }

  function postVote(vote) {
    if (!endpoint) return Promise.resolve(null);
    return fetch(endpoint + '/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: page, title: title, vote: vote === 'yes' ? 'up' : 'down' }),
    })
      .then(function (res) { return res.ok ? res.json().catch(function () { return {}; }) : {}; })
      .then(function (data) { return data && data.id != null ? data.id : null; })
      .catch(function () { return null; });
  }

  async function submitComment() {
    if (done) return;
    const commentEl = box.querySelector('[data-fb-comment]');
    const emailEl = box.querySelector('[data-fb-email]');
    const hpEl = box.querySelector('[data-fb-hp]');
    const comment = commentEl ? commentEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const hp = hpEl ? hpEl.value : '';

    // No comment, or unconfigured: the vote already counted, so just confirm.
    if (!comment || !endpoint) { showDone(currentVote, false); return; }

    let id = voteId;
    if (id == null && votePromise) { try { id = await votePromise; } catch (e) { id = null; } }
    if (id != null) {
      try {
        await fetch(endpoint + '/feedback/comment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: id, comment: comment, email: email, hp_url: hp }),
        });
      } catch (e) { /* swallow: the vote is already recorded; never block the reader */ }
    }
    showDone(currentVote, true);
  }

  box.addEventListener('click', function (e) {
    if (done) return;
    const voteBtn = e.target.closest('.feedback-btn');
    if (voteBtn && !currentVote) {
      currentVote = voteBtn.dataset.vote;
      if (!endpoint) { showDone(currentVote, false); return; }
      votePromise = postVote(currentVote).then(function (id) { voteId = id; return id; });
      showCommentStep(currentVote);
      return;
    }
    if (e.target.closest('[data-fb-skip]')) { showDone(currentVote, false); }
  });

  box.addEventListener('submit', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('feedback-form')) {
      e.preventDefault();
      submitComment();
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __initFeedback);
} else {
  __initFeedback();
}

// ---------------- Test Request drawer ----------------
let __drawer = null;

// Bearer token is remembered for the browser-tab session only: entered once,
// reused across every doc page + test request in this tab.
//
// sessionStorage, deliberately not localStorage: scope is one tab, and it is
// dropped on tab close rather than persisting across browser restarts. Note it
// is NOT a guaranteed erase — browsers retain sessionStorage for session
// restore (Cmd+Shift+T, crash recovery, "continue where you left off"), so the
// UI copy promises "kept only in this tab", not "erased on close". The Forget
// button is the deterministic clear.
//
// Wrapped in try/catch so a browser with storage disabled degrades to
// "type it each time" instead of breaking the drawer.
const AUTH_KEY = 'dt-docs-token';
function loadToken() {
  try { return sessionStorage.getItem(AUTH_KEY) || ''; } catch (e) { return ''; }
}
function saveToken(v) {
  try {
    if (v) sessionStorage.setItem(AUTH_KEY, v);
    else sessionStorage.removeItem(AUTH_KEY);
  } catch (e) { /* storage disabled — token just won't persist this session */ }
}

function ensureDrawer() {
  if (__drawer) return __drawer;
  const el = document.createElement('div');
  el.className = 'test-drawer';
  el.hidden = true;
  el.innerHTML = `
    <div class="test-drawer-body">
      <div class="test-drawer-topbar">
        <button class="close-btn" data-close aria-label="Close">×</button>
        <div class="url-preview">
          <span class="method-badge" data-method></span>
          <span class="url-base">https://api.dreamteamcrm.ai</span><span class="url-path" data-url></span>
        </div>
        <button class="send-btn" data-send>Send</button>
      </div>
      <div class="test-drawer-cols">
        <div class="test-drawer-left">
          <div class="drawer-section-title" data-collapsible>Authentication <span class="required-note">Required</span> <span class="meta" data-scheme>bearerAuth</span></div>
          <div class="drawer-section-body">
            <div class="kv-row">
              <span class="kv-name">Bearer Token</span>
              <span class="auth-input-wrap">
                <input data-auth type="password" placeholder="YOUR_TOKEN" autocomplete="off" spellcheck="false" />
                <button type="button" class="auth-reveal" data-reveal aria-label="Show token" title="Show token">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </span>
            </div>
            <div class="auth-remember" data-remember hidden>
              <span class="auth-remember-dot" aria-hidden="true"></span>
              <span>Saved for this tab</span>
              <button type="button" class="auth-forget" data-forget>Forget</button>
            </div>
            <p class="kv-empty" style="margin:4px 0 0;font-size:12px;">Bearer token from your Dreamteam profile page. The token already identifies your workspace - no other IDs needed. Kept only in this browser tab and never sent anywhere except the Dreamteam API. Use Forget when you're done, especially on a shared or screen-shared machine.</p>
          </div>

          <div class="drawer-section-title" data-collapsible>Variables</div>
          <div class="drawer-section-body" data-section="vars"></div>

          <div class="drawer-section-title" data-collapsible data-section-title="query">Query Parameters</div>
          <div class="drawer-section-body" data-section="query"></div>

          <div class="drawer-section-title" data-collapsible>Headers</div>
          <div class="drawer-section-body" data-section="headers"></div>

          <div class="drawer-section-title" data-collapsible data-section-title="body">Request Body</div>
          <div class="drawer-section-body" data-section="body">
            <textarea class="body-editor" data-body spellcheck="false" placeholder="{}"></textarea>
          </div>
        </div>
        <div class="test-drawer-right">
          <div class="response-header">
            <span>Response</span>
            <span class="response-status" data-status hidden></span>
            <span class="response-time" data-time></span>
          </div>
          <div data-response-container>
            <div class="response-empty">Click <strong>Send</strong> to run this request.</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  el.querySelector('[data-close]').addEventListener('click', () => el.hidden = true);
  el.addEventListener('click', e => { if (e.target === el) el.hidden = true; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el.hidden) el.hidden = true; });
  el.querySelector('[data-send]').addEventListener('click', () => sendTestRequest());

  // Remember the bearer token for this tab session. The drawer is a singleton
  // built once per page load, so seeding the input here carries the token
  // across every endpoint on the page and every doc page in the tab.
  const authInput = el.querySelector('[data-auth]');
  const rememberEl = el.querySelector('[data-remember]');
  const reflectAuth = () => { rememberEl.hidden = !authInput.value; };
  authInput.value = loadToken();
  reflectAuth();
  authInput.addEventListener('input', () => { saveToken(authInput.value); reflectAuth(); });
  el.querySelector('[data-forget]').addEventListener('click', () => {
    authInput.value = '';
    saveToken('');
    reflectAuth();
    authInput.focus();
  });

  // Masked by default so the credential isn't on screen during demos and
  // screen-shares; explicit toggle to check what was pasted. Mirrors the
  // Reveal control on the Dreamteam profile page that issues the token.
  const revealBtn = el.querySelector('[data-reveal]');
  revealBtn.addEventListener('click', () => {
    const shown = authInput.type === 'text';
    authInput.type = shown ? 'password' : 'text';
    revealBtn.classList.toggle('is-shown', !shown);
    const label = shown ? 'Show token' : 'Hide token';
    revealBtn.setAttribute('aria-label', label);
    revealBtn.setAttribute('title', label);
  });

  el.querySelectorAll('[data-collapsible]').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('collapsed'));
  });

  __drawer = el;
  return el;
}

function openTestDrawer(cfg) {
  const el = ensureDrawer();
  el.__cfg = cfg;

  // Method badge
  const method = (cfg.method || 'GET').toUpperCase();
  const methodEl = el.querySelector('[data-method]');
  methodEl.textContent = method;
  methodEl.className = 'method-badge method-' + method.toLowerCase();

  // Variables (path params)
  const varsEl = el.querySelector('[data-section="vars"]');
  varsEl.innerHTML = (cfg.variables || []).map(v => `
    <div class="kv-row">
      <span class="kv-name">${escape(v.name)} ${v.required ? '<span class="req">required</span>' : ''} <span class="kv-type">${escape(v.type || 'string')}</span></span>
      <input data-var="${escape(v.name)}" value="${escape(v.value || '')}" autocomplete="off" spellcheck="false" />
    </div>
  `).join('') || '<span class="kv-empty">No path variables.</span>';

  // Query params
  const queryEl = el.querySelector('[data-section="query"]');
  queryEl.innerHTML = (cfg.query || []).map(q => `
    <div class="kv-row">
      <span class="kv-name">${escape(q.name)} <span class="kv-type">${escape(q.type || 'string')}</span></span>
      <input data-query="${escape(q.name)}" data-type="${escape(q.type || 'string')}" value="${escape(q.value || '')}" placeholder="${escape(q.placeholder || '')}" autocomplete="off" spellcheck="false" />
    </div>
  `).join('') || '<span class="kv-empty">No query parameters.</span>';
  const querySectionTitle = el.querySelector('[data-section-title="query"]');
  querySectionTitle.style.display = (cfg.query && cfg.query.length) ? '' : 'none';
  queryEl.style.display = querySectionTitle.style.display;

  // Headers — always include accept + content-type; merge any extra
  const defaultHeaders = [
    { name: 'accept', value: 'application/json' },
    { name: 'content-type', value: cfg.contentType || 'application/json' },
  ];
  const extra = (cfg.headers || []);
  const headers = defaultHeaders.filter(h => !extra.find(e => e.name.toLowerCase() === h.name)).concat(extra);
  const headersEl = el.querySelector('[data-section="headers"]');
  headersEl.innerHTML = headers.map(h => `
    <div class="kv-row">
      <span class="kv-name">${escape(h.name)}</span>
      <input data-header="${escape(h.name)}" value="${escape(h.value)}" autocomplete="off" spellcheck="false" />
    </div>
  `).join('');

  // Body
  const bodyEl = el.querySelector('[data-body]');
  const bodySectionTitle = el.querySelector('[data-section-title="body"]');
  if (cfg.body != null) {
    bodyEl.value = cfg.body;
    bodySectionTitle.style.display = '';
    bodyEl.parentElement.style.display = '';
  } else {
    bodyEl.value = '';
    bodySectionTitle.style.display = 'none';
    bodyEl.parentElement.style.display = 'none';
  }

  // Reset response
  el.querySelector('[data-response-container]').innerHTML = '<div class="response-empty">Click <strong>Send</strong> to run this request.</div>';
  el.querySelector('[data-status]').hidden = true;
  el.querySelector('[data-time]').textContent = '';

  // Wire live URL preview
  el.querySelectorAll('[data-var], [data-query]').forEach(inp => {
    inp.addEventListener('input', updateUrlPreview);
  });
  updateUrlPreview();

  el.hidden = false;
}

function updateUrlPreview() {
  const el = __drawer;
  if (!el) return;
  const cfg = el.__cfg;
  let path = cfg.path;
  const varValues = {};
  el.querySelectorAll('[data-var]').forEach(inp => { varValues[inp.dataset.var] = inp.value; });
  path = path.replace(/\{(\w+)\}/g, (m, name) => {
    const v = varValues[name];
    if (v) return `<span class="url-var">${escape(v)}</span>`;
    return `<span class="url-var">{${name}}</span>`;
  });

  const queryEntries = [];
  el.querySelectorAll('[data-query]').forEach(inp => {
    if (!inp.value) return;
    // Array params (type string[]) repeat once per comma-separated value
    // (?associations=company&associations=note); scalar params keep their
    // value intact so e.g. sort=created_at,desc stays a single parameter.
    if (inp.dataset.type === 'string[]') {
      inp.value.split(',').forEach(v => {
        if (v.trim()) queryEntries.push([inp.dataset.query, v.trim()]);
      });
    } else if (inp.value.trim()) {
      queryEntries.push([inp.dataset.query, inp.value.trim()]);
    }
  });
  const qs = queryEntries.length
    ? '<span class="url-query">?' + queryEntries.map(([k, v]) => `${escape(k)}=${escape(v)}`).join('&amp;') + '</span>'
    : '';

  el.querySelector('[data-url]').innerHTML = path + qs;
}

async function sendTestRequest() {
  const el = __drawer;
  if (!el) return;
  const cfg = el.__cfg;
  const method = (cfg.method || 'GET').toUpperCase();

  // Build URL
  let path = cfg.path;
  el.querySelectorAll('[data-var]').forEach(inp => {
    path = path.replace(new RegExp('\\{' + inp.dataset.var + '\\}', 'g'), encodeURIComponent(inp.value || '{' + inp.dataset.var + '}'));
  });
  const queryEntries = [];
  el.querySelectorAll('[data-query]').forEach(inp => {
    if (!inp.value) return;
    // Match updateUrlPreview(): only string[] params split on comma into
    // repeated entries; scalars (sort=created_at,desc) stay intact.
    if (inp.dataset.type === 'string[]') {
      inp.value.split(',').forEach(v => {
        if (v.trim()) queryEntries.push([inp.dataset.query, v.trim()]);
      });
    } else if (inp.value.trim()) {
      queryEntries.push([inp.dataset.query, inp.value.trim()]);
    }
  });
  const qs = queryEntries.length ? '?' + queryEntries.map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&') : '';
  const url = 'https://api.dreamteamcrm.ai' + path + qs;

  // Headers
  const headers = {};
  el.querySelectorAll('[data-header]').forEach(inp => {
    if (inp.value) headers[inp.dataset.header] = inp.value;
  });
  const token = el.querySelector('[data-auth]').value;
  if (token) headers['Authorization'] = 'Bearer ' + token;

  // Body
  const bodyText = el.querySelector('[data-body]').value.trim();
  const init = { method, headers };
  if (['POST', 'PUT', 'PATCH'].includes(method) && bodyText) {
    init.body = bodyText;
  }

  // Fire
  const container = el.querySelector('[data-response-container]');
  const statusEl = el.querySelector('[data-status]');
  const timeEl = el.querySelector('[data-time]');
  container.innerHTML = '<div class="response-empty">Sending…</div>';
  statusEl.hidden = true;
  timeEl.textContent = '';

  const t0 = performance.now();
  try {
    const res = await fetch(url, init);
    const ms = Math.round(performance.now() - t0);
    const text = await res.text();
    let pretty = text;
    try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch (e) { /* not JSON */ }

    statusEl.hidden = false;
    statusEl.textContent = res.status + ' ' + res.statusText;
    statusEl.className = 'response-status ' + (res.ok ? 'ok' : 'err');
    timeEl.textContent = ms + ' ms';
    container.innerHTML = '<pre class="response-body"></pre>';
    container.querySelector('.response-body').textContent = pretty;
  } catch (err) {
    const ms = Math.round(performance.now() - t0);
    statusEl.hidden = false;
    statusEl.textContent = 'Network error';
    statusEl.className = 'response-status err';
    timeEl.textContent = ms + ' ms';
    container.innerHTML = `
      <div class="response-error-hint">
        <strong>Request could not complete from the browser.</strong><br>
        This is usually a CORS or network error — the API server may not allow requests from <code>${location.origin}</code>. Try running the request from your terminal using the curl example shown in the endpoint's Request tab, or use the v1 docs' built-in Test Request client which proxies through a compatible client.
      </div>
      <pre class="response-body" style="color:var(--text-muted);">Details: ${escape(err.message || String(err))}</pre>
    `;
  }
}

function escape(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ---------------- Back button (auto-injected) ----------------
// Renders a "← Back" pill at the top of every page's content, but only when
// the referrer is another page in the same v2 doc folder. This avoids showing
// a dead back button on cold entries (bookmarks, external links).
// "Back" button — shown only when the reader arrived from another page of these
// docs, so it never dead-ends on browser history from outside the doc set.
document.addEventListener('DOMContentLoaded', function () {
  const ref = document.referrer;
  if (!ref) return;
  let refUrl;
  try { refUrl = new URL(ref); } catch (_) { return; }
  if (refUrl.origin !== location.origin) return;

  // The doc-set root, taken from the sidebar brand link. It resolves correctly
  // under both URL styles — '/pages/dreamteam-api-docs-v2/' on GH Pages and
  // '/api/' on the S3 build — so we don't have to guess it from the path.
  const brand = document.querySelector('.sidebar-brand');
  if (!brand) return;
  const root = new URL(brand.href, location.href).pathname;

  // Was: `location.pathname.replace(/[^\/]*$/, '')`, which under folder-style
  // URLs ('/…/authentication/') strips nothing and yields the CURRENT page's
  // own path. The startsWith() test below then only ever passed on the index —
  // so Back appeared on Introduction (where it's meaningless) and nowhere else.
  // Comparing against the doc-set root is what was actually meant.
  if (!refUrl.pathname.startsWith(root)) return;
  if (refUrl.pathname === location.pathname && refUrl.search === location.search) return;

  // Introduction IS the root of the docs — there is nothing to go back to.
  const isIndex = location.pathname === root || location.pathname === root + 'index.html';
  if (isIndex) return;

  const content = document.querySelector('main.content');
  if (!content) return;

  const style = document.createElement('style');
  style.textContent = `
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px 6px 8px;
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      text-decoration: none;
      margin: 0 0 24px;
      background: transparent;
      transition: color .15s ease, border-color .15s ease, background .15s ease;
      cursor: pointer;
      position: relative;
      z-index: 1;
    }
    .back-link svg { flex: none; }
    .back-link:hover {
      color: var(--text);
      border-color: var(--text-muted);
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('a');
  btn.className = 'back-link';
  btn.href = '#';
  btn.setAttribute('aria-label', 'Back to previous page');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg><span>Back</span>';
  btn.addEventListener('click', function (e) {
    e.preventDefault();
    history.back();
  });

  content.prepend(btn);
});

// Mobile nav drawer (<=900px). The sidebar is off-canvas until opened; below
// that width it used to be display:none, so there was no navigation at all.
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('nav-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('nav-backdrop');
  if (!toggle || !sidebar || !backdrop) return;

  function setOpen(open) {
    sidebar.classList.toggle('open', open);
    backdrop.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    // Locks the page behind the drawer so it can't scroll under the reader's
    // finger while the drawer is what they're actually touching.
    document.body.classList.toggle('nav-open', open);
  }

  toggle.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('open'));
  });

  backdrop.addEventListener('click', function () { setOpen(false); });

  // Close on any nav link. Matters most for the in-page sub-nav anchors, which
  // don't reload the page — without this the drawer would sit there covering
  // the section it just scrolled to.
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Rotating to landscape / resizing past the breakpoint while open would leave
  // `overflow: hidden` on the body with no visible way to undo it.
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && sidebar.classList.contains('open')) setOpen(false);
  });
});

// ---------------- Search: relevance-order the sub-results ----------------
// Pagefind's stock modal renders a page's heading sub-results in DOCUMENT
// order, so a query like "create contact" lists "List records" and "Retrieve
// a record" above the exact match "Create a record". We can't change that from
// the component's options, so instead we run our own read-only Pagefind search
// in parallel to score each heading, then re-sort the rendered chips so the
// best match floats to the top and the weaker ones follow. Everything degrades
// gracefully: if anything throws, the stock (document-order) rendering stays.
(function () {
  let pfMod = null;
  const scoreCache = new Map(); // query -> { anchorId: score }

  function bundlePath() {
    const cfg = document.querySelector('pagefind-config');
    return (cfg && cfg.getAttribute('bundle-path')) || '/pagefind/';
  }

  async function ensurePagefind() {
    if (pfMod) return pfMod;
    pfMod = await import(bundlePath() + 'pagefind.js');
    await pfMod.init();
    return pfMod;
  }

  // Map heading anchor id -> summed match weight for the current query. Anchor
  // ids are effectively unique across the docs, so a flat map (max across
  // pages) is enough to rank chips without matching page URLs.
  async function scoresFor(query) {
    if (scoreCache.has(query)) return scoreCache.get(query);
    const pf = await ensurePagefind();
    const search = await pf.search(query);
    const data = await Promise.all(search.results.slice(0, 12).map((r) => r.data()));
    const map = {};
    for (const d of data) {
      for (const sr of d.sub_results || []) {
        const id = sr.anchor && sr.anchor.id;
        if (!id) continue;
        const score = (sr.weighted_locations || []).reduce((a, w) => a + w.weight, 0);
        map[id] = Math.max(map[id] || 0, score);
      }
    }
    scoreCache.set(query, map);
    return map;
  }

  let scheduled = false;
  let writing = false;

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(async () => {
      scheduled = false;
      try { await reorder(); } catch (_) { /* leave stock order */ }
    });
  }

  async function reorder() {
    if (writing) return;
    const lists = document.querySelectorAll('ul.pf-heading-chips');
    if (!lists.length) return;
    // Current query: read from whichever modal input is non-empty.
    let query = '';
    document.querySelectorAll('.pf-input').forEach((i) => { if (!query && i.value.trim()) query = i.value.trim(); });
    if (!query) return;

    const map = await scoresFor(query);

    writing = true;
    try {
      lists.forEach((list) => {
        const chips = Array.prototype.slice.call(list.children);
        if (chips.length < 2) return;
        chips.forEach((chip) => {
          const link = chip.querySelector('a.pf-heading-link');
          const href = (link && link.getAttribute('href')) || '';
          const id = href.split('#')[1] || '';
          chip.__score = map[id] != null ? map[id] : -1;
        });
        const sorted = chips.slice().sort((a, b) => b.__score - a.__score);
        // Only touch the DOM when the order actually changes (avoids a
        // needless mutation → observer → reorder loop).
        if (sorted.some((chip, idx) => chip !== chips[idx])) {
          sorted.forEach((chip) => list.appendChild(chip));
        }
      });
    } finally {
      writing = false;
    }
  }

  // The stock component renders results asynchronously and re-renders on every
  // keystroke, so watch for heading-chip lists appearing / changing.
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (
          (node.matches && node.matches('.pf-heading-chips, .pf-heading-chip, .pf-result')) ||
          (node.querySelector && node.querySelector('.pf-heading-chips'))
        ) {
          schedule();
          return;
        }
      }
    }
  });

  function start() { observer.observe(document.body, { childList: true, subtree: true }); }
  if (document.readyState !== 'loading') start();
  else document.addEventListener('DOMContentLoaded', start);
})();

// ---------------- Copy-link anchors on endpoint headings ----------------
// Injects a chain-link button after each endpoint <h2> that copies a deep link
// straight to that section, e.g.
//   https://docs.dreamteam.co/api/find-records#batch-fetch          (production)
//   https://archives.dreamteamcrm.net/pages/…/find-records#batch-fetch (internal)
// The URL is built from the reader's OWN location at click time, so it is always
// correct for whichever host they're viewing on — there is no hardcoded list of
// links to maintain, and it covers headings added later for free.
//
// "Endpoint heading" = the <h2> of an operation. Two page shapes exist:
//   • Find Records / Schema / Users / Pipelines wrap EACH operation in its own
//     <section class="endpoint" id="…">. The id on the section is the anchor,
//     and the METHOD + path row may sit a paragraph below the heading (e.g.
//     Batch Fetch has an intro <p>), so the section — not sibling order — is
//     what marks it.
//   • Records wraps its whole body in ONE id-less <section class="endpoint">
//     and puts the anchor id on each operation <h2>. Here the section can't
//     tell an operation apart from a concept heading, so we additionally require
//     that a METHOD + path row (.endpoint-head) belongs to the heading — which
//     is exactly what "The record model" (prose only) lacks.
// Result: every operation is tagged; concept headings like "The record model"
// and the prose guide pages (Authentication, Conventions, Pagination) are not.
function __initAnchorLinks() {
  const ICON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
    '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>' +
    '<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>';

  document.querySelectorAll('h2').forEach(function (h2) {
    // Resolve whether this heading is an operation, and what its anchor id is.
    let id = null;
    const idSection = h2.closest('section.endpoint[id]'); // per-operation sections
    if (idSection) {
      id = idSection.id;                                  // Find Records / Schema / Users / Pipelines
    } else if (h2.id && __hasEndpointHeadBeforeNextH2(h2)) {
      id = h2.id;                                         // Records: only true operations
    }
    if (!id) return;                              // concept heading or guide page — skip
    if (h2.querySelector('.anchor-copy')) return; // defensive: never double-add

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'anchor-copy';
    btn.setAttribute('aria-label', 'Copy link to this section');
    btn.setAttribute('data-pagefind-ignore', ''); // keep it out of the search index
    btn.dataset.tip = 'Copy link';
    btn.innerHTML = ICON;

    btn.addEventListener('click', function () {
      const url = location.origin + location.pathname + '#' + id;
      __copyText(url).then(function (ok) {
        btn.dataset.tip = ok ? 'Copied!' : 'Copy failed';
        btn.classList.add('is-copied');
        setTimeout(function () {
          btn.dataset.tip = 'Copy link';
          btn.classList.remove('is-copied');
        }, 1500);
      });
    });

    h2.appendChild(btn);
  });
}

// True when a METHOD + path row (.endpoint-head) follows this heading before the
// next <h2> — i.e. the heading actually introduces an operation. Used only on
// the Records page, whose operations and concept heading share one id-less
// <section class="endpoint">.
function __hasEndpointHeadBeforeNextH2(h2) {
  let n = h2.nextElementSibling;
  while (n && n.tagName !== 'H2') {
    if (n.classList && n.classList.contains('endpoint-head')) return true;
    n = n.nextElementSibling;
  }
  return false;
}

// Clipboard write with a legacy fallback for the rare non-secure context.
// Returns Promise<boolean> — true when the text actually reached the clipboard.
function __copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text).then(
      function () { return true; },
      function () { return __legacyCopy(text); }
    );
  }
  return Promise.resolve(__legacyCopy(text));
}
function __legacyCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (_) { return false; }
}

document.addEventListener('DOMContentLoaded', __initAnchorLinks);

// ---------------- Recipe step tabs ----------------
// A recipe step that is really two chained calls (e.g. meeting → recording id,
// then read the recording) uses one pill-tab bar to swap the whole
// request+response view — the same interaction as the object tabs, but scoped
// to the step and with no {object} path rewriting. Toggling the
// `.recipe-step-view` wrapper composes cleanly with the response panel's own
// status/view filter: the wrapper owns visibility of the whole call, while the
// inner response panel still manages which of its bodies (200, etc.) shows.
// Pages without `.recipe-step-tabs` are a no-op.
function __initRecipeStepTabs() {
  document.querySelectorAll('.recipe-step-tabs').forEach(function (bar) {
    const scope = bar.parentElement;
    if (!scope) return;
    const tabs = bar.querySelectorAll('.recipe-step-tab');
    const views = scope.querySelectorAll('.recipe-step-view');
    function apply(key) {
      tabs.forEach(function (t) { t.classList.toggle('active', t.dataset.stepView === key); });
      views.forEach(function (v) { v.hidden = v.dataset.stepView !== key; });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { apply(t.dataset.stepView); });
    });
    const initial = bar.querySelector('.recipe-step-tab.active') || tabs[0];
    if (initial) apply(initial.dataset.stepView);
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __initRecipeStepTabs);
} else {
  __initRecipeStepTabs();
}
