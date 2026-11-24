import { api, modal, esc, fmtBDT, state, toast, setLoading, waLink } from './core.js';

/** Opens the "Unlock Pro" flow for a course. track = { slug, title, emoji, price_bdt } */
export function openEnroll(track, { onDone } = {}) {
  if (!state.me) {
    location.href = '/login?mode=signup&next=' + encodeURIComponent(location.pathname);
    return;
  }
  const s = state.settings;
  const methods = [
    s.bkash_number && { id: 'bkash', label: 'bKash', num: s.bkash_number, color: 'pink' },
    s.nagad_number && { id: 'nagad', label: 'Nagad', num: s.nagad_number, color: 'orange' },
  ].filter(Boolean);
  const m = modal(`
    <span class="chip chip-lime">💎 Unlock Pro</span>
    <h2 style="margin:12px 0 4px">${esc(track.emoji)} ${esc(track.title)}</h2>
    <p class="muted" style="margin-bottom:18px">Every quest, project and boss level in this course. One-time payment.</p>
    <div class="card flat bg-sun" style="padding:18px;margin-bottom:18px">
      <div class="row" style="justify-content:space-between"><b>Amount to send</b><span class="price" style="font-size:2rem">${fmtBDT(track.price_bdt)}</span></div>
      <ol style="margin:10px 0 0;padding-left:1.2em;font-weight:600">
        <li>Open your bKash or Nagad app → <b>Send Money</b></li>
        <li>Send <b>${fmtBDT(track.price_bdt)}</b> to ${methods.map((x) => `<b>${esc(x.label)}: ${esc(x.num)}</b>`).join(' or ')}</li>
        <li>Reference: your name. Copy the <b>TrxID</b> from the SMS</li>
      </ol>
    </div>
    <form id="enrollForm">
      <div class="field"><label>Paid with</label>
        <div class="toggle-group">${methods.map((x, i) => `<label><input type="radio" name="method" value="${x.id}" ${i === 0 ? 'checked' : ''}><span>${esc(x.label)}</span></label>`).join('')}</div>
      </div>
      <div class="field"><label for="enSender">Number you paid from</label><input class="input" id="enSender" name="sender_number" inputmode="tel" placeholder="01XXXXXXXXX" required value="${esc(state.me.user.phone || '')}"></div>
      <div class="field"><label for="enTxn">Transaction ID (TrxID)</label><input class="input" id="enTxn" name="txn_id" placeholder="e.g. 9BX7K2M4QP" required autocomplete="off" style="text-transform:uppercase;font-family:var(--font-mono)"></div>
      <div class="form-error hide" id="enErr"></div>
      <button class="btn btn-lg" style="width:100%" type="submit">Submit payment ✓</button>
      <p class="small muted" style="margin:12px 0 0">${esc(s.payment_note || '')}</p>
      ${s.whatsapp ? `<p class="small" style="margin:6px 0 0">Prefer cash or have a problem? <a href="${waLink(`Hi! I want to unlock ${track.title}.`)}" target="_blank" rel="noopener">Message on WhatsApp</a></p>` : ''}
    </form>`);
  const form = m.el.querySelector('#enrollForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type=submit]');
    const err = m.el.querySelector('#enErr');
    err.classList.add('hide');
    setLoading(btn, true, 'Submitting…');
    try {
      const fd = new FormData(form);
      await api.post('/api/enroll', { track_slug: track.slug, method: fd.get('method'), sender_number: fd.get('sender_number'), txn_id: fd.get('txn_id') });
      m.el.innerHTML = `
        <div class="celebrate">
          <div style="font-size:3rem">⏳</div>
          <h2>Payment submitted!</h2>
          <p>We're checking your TrxID. <b>${esc(track.title)}</b> unlocks as soon as it's verified, usually within a few hours. You'll see it in your dashboard.</p>
          <a class="btn btn-lg" href="/dashboard">Go to my dashboard</a>
        </div>`;
      onDone && onDone();
    } catch (ex) {
      err.textContent = ex.message;
      err.classList.remove('hide');
      setLoading(btn, false);
      if (ex.status === 409) toast(ex.message, 'info');
    }
  });
}
