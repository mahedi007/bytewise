import { boot, api, $, $$, esc, state, setLoading, waLink, PICKER_CLASSES } from '../core.js';

await boot({ active: 'tuition' });

const me = state.me?.user;
$('#bkClass').innerHTML = PICKER_CLASSES.map((c) => `<option ${me?.class_level === c ? 'selected' : ''}>${esc(c)}</option>`).join('');
$('#bkDays').innerHTML = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
  .map((d) => `<label><input type="checkbox" name="days" value="${d}"><span>${d}</span></label>`).join('');
if (me) {
  $('#bkName').value = me.name;
  $('#bkEmail').value = me.email;
  if (me.phone) $('#bkPhone').value = me.phone;
}

$$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
  $(`input[name=mode][value=${b.dataset.pick}]`).checked = true;
  $('#book').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => $('#bkName').focus(), 500);
}));
const pre = new URLSearchParams(location.search).get('mode');
if (pre === 'online' || pre === 'onsite') $(`input[name=mode][value=${pre}]`).checked = true;

$('#bookingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  const err = $('#bkErr');
  err.classList.add('hide');
  const btn = form.querySelector('button[type=submit]');
  const payload = {
    website: fd.get('website'),
    mode: fd.get('mode'),
    student_name: fd.get('student_name'),
    guardian_name: fd.get('guardian_name'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    class_level: fd.get('class_level'),
    focus: fd.get('focus'),
    preferred_days: fd.getAll('days').join(', '),
    preferred_time: fd.get('preferred_time'),
    message: fd.get('message'),
  };
  setLoading(btn, true, 'Sending…');
  try {
    await api.post('/api/bookings', payload);
    const text = `Hi! I just booked a ${payload.mode} trial class for ${payload.student_name} (${payload.class_level}). Focus: ${payload.focus}.`;
    $('#bookingArea').innerHTML = `
      <div class="celebrate">
        <div style="font-size:3.4rem">🎟️</div>
        <h2>Request received!</h2>
        <p>Thanks! We'll contact you on <b>${esc(payload.phone)}</b> within 24 hours to confirm a trial slot.</p>
        ${state.settings.whatsapp ? `<a class="btn btn-lg" href="${waLink(text)}" target="_blank" rel="noopener">💬 Speed it up on WhatsApp</a>` : ''}
        <p style="margin-top:16px"><a href="/learn">Meanwhile, try a free quest →</a></p>
      </div>`;
  } catch (ex) {
    err.textContent = ex.message;
    err.classList.remove('hide');
    setLoading(btn, false);
  }
});
