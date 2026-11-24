// Shared front-end helpers: API calls, session state, nav/footer, toasts, modals, celebrations.

export const $ = (sel, el = document) => el.querySelector(sel);
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const api = {
  async req(method, path, data) {
    const res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: data !== undefined ? { 'content-type': 'application/json' } : {},
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
    let payload = {};
    try { payload = await res.json(); } catch { /* empty body */ }
    if (!res.ok) {
      const e = new Error(payload.error || `Request failed (${res.status})`);
      e.status = res.status;
      throw e;
    }
    return payload;
  },
  get: (p) => api.req('GET', p),
  post: (p, d = {}) => api.req('POST', p, d),
  del: (p) => api.req('DELETE', p),
};

export const state = { me: null, settings: {}, classLevels: [] };

// Which course fits which class
export const CLASS_TRACK = {
  PG: 'tiny-coders', Nursery: 'tiny-coders', KG: 'tiny-coders',
  'Class 1': 'little-explorers', 'Class 2': 'little-explorers', 'Class 3': 'little-explorers',
  'Class 4': 'junior-builders', 'Class 5': 'junior-builders', 'Class 6': 'junior-builders',
  'Class 7': 'code-creators', 'Class 8': 'code-creators',
  'Class 9': 'olevel-cs', 'Class 10': 'olevel-cs', 'Class 11': 'olevel-cs',
};
export const PICKER_CLASSES = ['PG', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11'];

export const fmtBDT = (n) => '৳' + Number(n || 0).toLocaleString('en-IN');
export const levelOf = (xp = 0) => {
  const names = ['Newbie', 'Rookie', 'Explorer', 'Builder', 'Hacker', 'Coder', 'Wizard', 'Ninja', 'Master', 'Legend'];
  const level = Math.floor(xp / 100) + 1;
  return { level, level_name: names[Math.min(level - 1, names.length - 1)], level_progress: xp % 100 };
};

export function timeAgo(ms) {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ---------- guest progress (before signing up) ----------
const GUEST_KEY = 'bq_guest_done';
const store = {
  get(k, f) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : f; } catch { return f; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
export const prefs = store;
export const guest = {
  all: () => store.get(GUEST_KEY, {}),
  slugs: () => Object.keys(guest.all()),
  has: (slug) => !!guest.all()[slug],
  add(slug, xp) { const a = guest.all(); if (!a[slug]) { a[slug] = xp; store.set(GUEST_KEY, a); return true; } return false; },
  xp: () => Object.values(guest.all()).reduce((s, n) => s + (Number(n) || 0), 0),
  clear: () => store.del(GUEST_KEY),
};

// ---------- boot ----------
export async function boot({ active = '', requireAuth = false, requireAdmin = false } = {}) {
  const [cfg, me] = await Promise.all([
    api.get('/api/config').catch(() => ({ settings: {}, class_levels: [] })),
    api.get('/api/me').catch(() => ({ user: null })),
  ]);
  state.settings = cfg.settings || {};
  state.classLevels = cfg.class_levels || PICKER_CLASSES;
  state.me = me.user ? me : null;
  renderNav(active);
  renderFooter();
  bindSettings();
  if ((requireAuth || requireAdmin) && !state.me) {
    location.replace('/login?next=' + encodeURIComponent(location.pathname + location.search));
    return new Promise(() => {});
  }
  if (requireAdmin && state.me.user.role !== 'admin') {
    location.replace('/dashboard');
    return new Promise(() => {});
  }
  return state;
}

/** Fill any element with data-s="settingKey" from site settings. */
export function bindSettings(root = document) {
  const s = state.settings;
  $$('[data-s]', root).forEach((el) => { if (s[el.dataset.s]) el.textContent = s[el.dataset.s]; });
  $$('[data-s-show]', root).forEach((el) => { el.classList.toggle('hide', !s[el.dataset.sShow]); });
  $$('[data-s-href]', root).forEach((el) => {
    const k = el.dataset.sHref;
    const v = s[k];
    if (!v) return;
    if (k === 'whatsapp') el.href = waLink('Hi! I found ' + (s.brand_name || 'your site') + ' and want to know more.');
    else if (k === 'phone') el.href = 'tel:' + v.replace(/[^\d+]/g, '');
    else if (k === 'email') el.href = 'mailto:' + v;
    else el.href = v;
  });
  const brand = s.brand_name;
  if (brand) document.title = document.title.replace(/ByteQuest/g, brand);
}

export const waLink = (text) =>
  `https://wa.me/${String(state.settings.whatsapp || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`;

function renderNav(active) {
  const slot = $('#app-nav');
  if (!slot) return;
  const s = state.settings;
  const me = state.me?.user;
  const brand = esc(s.brand_name || 'ByteQuest');
  const links = [
    ['learn', '/learn', 'Courses'],
    ['playground', '/playground', 'Playground'],
    ['tuition', '/tuition', 'Tuition'],
    ['leaderboard', '/learn#leaderboard', 'Leaderboard'],
  ];
  if (me?.role === 'admin') links.push(['admin', '/admin', 'Admin']);
  const gxp = guest.xp();
  let right;
  if (me) {
    right = `
      <a class="hud" href="/dashboard" title="Your XP and streak">
        <span class="hud-xp">⚡ ${me.xp} XP</span><span class="hud-streak">🔥 ${state.me.user.streak}</span>
      </a>
      <a class="avatar" href="/dashboard" title="My dashboard">${esc(me.name.trim()[0] || '?').toUpperCase()}</a>`;
  } else {
    right = `
      ${gxp ? `<a class="hud" href="/login?mode=signup" title="Sign up to save your XP"><span class="hud-xp">⚡ ${gxp} XP</span></a>` : ''}
      <a class="btn btn-ghost btn-sm" href="/login">Log in</a>
      <a class="btn btn-sm" href="/login?mode=signup">🚀 <span class="btn-join-text">Join free</span></a>`;
  }
  slot.innerHTML = `
    ${s.announcement ? `<div class="announce">${esc(s.announcement)}</div>` : ''}
    <nav class="nav">
      <div class="wrap nav-inner">
        <a class="logo" href="/"><span class="logo-mark">&lt;/&gt;</span><span class="logo-text">${brand}</span></a>
        <div class="nav-links" id="navLinks">
          ${links.map(([k, h, t]) => `<a href="${h}" class="${k === active ? 'active' : ''}">${t}</a>`).join('')}
        </div>
        <div class="nav-right">
          ${right}
          <button class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false">☰</button>
        </div>
      </div>
    </nav>`;
  $('#menuBtn').addEventListener('click', (e) => {
    const open = $('#navLinks').classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
}

function renderFooter() {
  const slot = $('#app-footer');
  if (!slot) return;
  const s = state.settings;
  const brand = esc(s.brand_name || 'ByteQuest');
  slot.innerHTML = `
    <footer class="footer">
      <div class="wrap">
        <div class="footer-grid">
          <div>
            <a class="logo" href="/"><span class="logo-mark">&lt;/&gt;</span><span>${brand}</span></a>
            <p style="margin-top:14px;opacity:.8">${esc(s.tagline || '')}</p>
            <p class="small" style="opacity:.7">Taught by ${esc(s.teacher_name || '')}</p>
          </div>
          <div><h4>Learn</h4><ul>
            <li><a href="/track/tiny-coders">Tiny Coders (PG–KG)</a></li>
            <li><a href="/track/little-explorers">Little Explorers (Class 1–3)</a></li>
            <li><a href="/track/junior-builders">Junior Builders (Class 4–6)</a></li>
            <li><a href="/track/code-creators">Code Creators (Class 7–8)</a></li>
            <li><a href="/track/olevel-cs">O Level CS 2210</a></li>
          </ul></div>
          <div><h4>Explore</h4><ul>
            <li><a href="/playground">Code Playground</a></li>
            <li><a href="/tuition">Online & onsite tuition</a></li>
            <li><a href="/#pricing">Pricing</a></li>
            <li><a href="/dashboard">My dashboard</a></li>
          </ul></div>
          <div><h4>Talk to us</h4><ul>
            ${s.whatsapp ? `<li><a href="${waLink('Hi! I have a question about ' + (s.brand_name || 'your classes'))}" target="_blank" rel="noopener">💬 WhatsApp</a></li>` : ''}
            ${s.phone ? `<li><a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">📞 ${esc(s.phone)}</a></li>` : ''}
            ${s.email ? `<li><a href="mailto:${esc(s.email)}">✉️ ${esc(s.email)}</a></li>` : ''}
            ${s.facebook_url ? `<li><a href="${esc(s.facebook_url)}" target="_blank" rel="noopener">Facebook</a></li>` : ''}
            ${s.youtube_url ? `<li><a href="${esc(s.youtube_url)}" target="_blank" rel="noopener">YouTube</a></li>` : ''}
          </ul></div>
        </div>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} ${brand}. All rights reserved.</span>
          <span>Cambridge-aligned learning. Not affiliated with or endorsed by Cambridge University Press &amp; Assessment.</span>
        </div>
      </div>
    </footer>`;
}

// ---------- toasts ----------
export function toast(msg, type = 'ok', ms = 3200) {
  let box = $('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

// ---------- modal ----------
export function modal(html, { onClose, wide = false } = {}) {
  const back = document.createElement('div');
  back.className = 'modal-back';
  back.innerHTML = `<div class="modal card" role="dialog" aria-modal="true" style="${wide ? 'width:min(760px,100%)' : ''}">
      <button class="modal-x" aria-label="Close">✕</button>${html}</div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); };
  const onKey = (e) => e.key === 'Escape' && close();
  back.addEventListener('click', (e) => { if (e.target === back) close(); });
  back.querySelector('.modal-x').addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('input, select, textarea, button:not(.modal-x)');
  first && setTimeout(() => first.focus(), 50);
  return { el: back.querySelector('.modal'), close };
}

// ---------- confetti + celebration ----------
export function confetti(duration = 2200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'confetti-canvas';
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const W = (c.width = innerWidth), H = (c.height = innerHeight);
  const colors = ['#c8f542', '#ff8fc0', '#7dd3fc', '#ffd23f', '#b8a4ff', '#17131f'];
  const parts = Array.from({ length: 160 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 200, y: H * 0.35,
    vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4,
    s: Math.random() * 8 + 5, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const start = performance.now();
  (function frame(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.45; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66); ctx.restore();
    }
    if (t - start < duration) requestAnimationFrame(frame); else c.remove();
  })(start);
}

export function celebrate({ gained = 0, leveled_up, level, level_name, streak, badges = [], guestMode = false, title }) {
  confetti();
  const badgeHtml = badges.length
    ? `<div class="row" style="justify-content:center;margin:14px 0">${badges
        .map((b) => `<span class="chip chip-sun">${b.emoji} ${esc(b.name)}</span>`).join('')}</div>`
    : '';
  const m = modal(`
    <div class="celebrate">
      <div style="font-size:3.2rem">${leveled_up ? '🏆' : '🎉'}</div>
      <h2 style="margin:6px 0">${esc(title || (leveled_up ? 'LEVEL UP!' : 'Quest complete!'))}</h2>
      ${gained ? `<div class="big">+${gained} XP</div>` : `<p class="muted">Already completed. Your XP is safe.</p>`}
      ${leveled_up ? `<p><span class="sticker">Level ${level} · ${esc(level_name)}</span></p>` : ''}
      ${streak ? `<p style="font-weight:800">🔥 ${streak}-day streak</p>` : ''}
      ${badgeHtml ? `<p style="font-weight:800;margin-bottom:0">New badge${badges.length > 1 ? 's' : ''} unlocked!</p>${badgeHtml}` : ''}
      ${guestMode ? `<p class="muted small">You're playing as a guest. Create a free account so your XP, streak and badges are saved.</p>
        <a class="btn btn-lg" href="/login?mode=signup">Save my XP 🚀</a>` : `<button class="btn btn-lg" data-close>Keep going ➜</button>`}
    </div>`);
  m.el.querySelector('[data-close]')?.addEventListener('click', m.close);
  return m;
}

export function setLoading(btn, on, text) {
  if (!btn) return;
  if (on) { btn.dataset.label = btn.innerHTML; btn.disabled = true; btn.innerHTML = text || 'Working…'; }
  else { btn.disabled = false; if (btn.dataset.label) btn.innerHTML = btn.dataset.label; }
}

export const qs = (k) => new URLSearchParams(location.search).get(k);
/** For pretty URLs like /track/olevel-cs → 'olevel-cs' (falls back to ?slug=) */
export const pathSlug = () => qs('slug') || decodeURIComponent(location.pathname.split('/').filter(Boolean)[1] || '');
