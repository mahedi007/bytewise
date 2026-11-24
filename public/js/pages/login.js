import { boot, api, $, $$, esc, qs, guest, state, setLoading, waLink, prefs, PICKER_CLASSES } from '../core.js';

await boot();

const next = (() => {
  const n = qs('next') || '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard';
})();
if (state.me) location.replace(next);

const savedClass = prefs.get('bq_class', '');
$('#suClass').innerHTML = '<option value="">Select class…</option>' +
  PICKER_CLASSES.map((c) => `<option ${c === savedClass ? 'selected' : ''} value="${esc(c)}">${c === 'PG' ? 'Playgroup (PG)' : esc(c)}</option>`).join('');
if (state.settings.whatsapp) $('#forgotLink').href = waLink('Hi! I forgot my password. My account email is: ');
const gxp = guest.xp();
if (gxp) $('#guestNote').innerHTML = `🎁 You've earned <b>${gxp} XP</b> as a guest. Sign up and it moves into your account!`;

function setMode(mode) {
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  $('#signupForm').classList.toggle('hide', mode !== 'signup');
  $('#loginForm').classList.toggle('hide', mode !== 'login');
  history.replaceState(null, '', `?mode=${mode}${qs('next') ? '&next=' + encodeURIComponent(qs('next')) : ''}`);
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
setMode(qs('mode') === 'signup' ? 'signup' : 'login');

async function submit(form, path, build) {
  const err = form.querySelector('[data-err]');
  err.classList.add('hide');
  const btn = form.querySelector('button[type=submit]');
  setLoading(btn, true, 'One sec…');
  try {
    const fd = new FormData(form);
    await api.post(path, { ...build(fd), guest_completed: guest.slugs() });
    guest.clear();
    location.replace(next);
  } catch (e) {
    err.textContent = e.message;
    err.classList.remove('hide');
    setLoading(btn, false);
  }
}

$('#signupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  submit(e.currentTarget, '/api/auth/signup', (fd) => ({
    name: fd.get('name'), email: fd.get('email'), password: fd.get('password'),
    class_level: fd.get('class_level'), phone: fd.get('phone'),
  }));
});
$('#loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  submit(e.currentTarget, '/api/auth/login', (fd) => ({ email: fd.get('email'), password: fd.get('password') }));
});
