import { boot, api, $, $$, esc, fmtBDT, timeAgo, modal, toast, setLoading } from '../core.js';
import { renderLesson, quizWidget, parseQuiz } from '../widgets.js';

await boot({ active: 'admin', requireAdmin: true });

const panel = $('#panel');
let tracksCache = null;
const getTracks = async (fresh = false) => {
  if (!tracksCache || fresh) tracksCache = (await api.get('/api/admin/tracks')).tracks;
  return tracksCache;
};
const waUrl = (phone, text = '') => `https://wa.me/${String(phone || '').replace(/[^\d]/g, '')}${text ? '?text=' + encodeURIComponent(text) : ''}`;
const date = (ms) => (ms ? new Date(ms).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-');

const TABS = { overview, payments, bookings, students, lessons, courses, settings };
async function show(tab, ...args) {
  $$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  panel.innerHTML = '<div class="spinner"></div>';
  history.replaceState(null, '', '#' + tab);
  try { await TABS[tab](...args); } catch (e) { panel.innerHTML = `<div class="card empty">⚠️ ${esc(e.message)}</div>`; }
}
$('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.tab); });

async function refreshCounts() {
  const o = await api.get('/api/admin/overview');
  const set = (id, n) => { const el = $(id); el.textContent = n; el.classList.toggle('hide', !n); };
  set('#cPay', o.pending_payments);
  set('#cBook', o.new_bookings);
  return o;
}

// ---------------------------------------------------------------- overview
async function overview() {
  const o = await refreshCounts();
  panel.innerHTML = `
    <div class="grid grid-3">
      <div class="stat bg-lime"><b>${o.students}</b><span>students</span></div>
      <div class="stat bg-sky"><b>${o.active_7d}</b><span>active in the last 7 days</span></div>
      <div class="stat bg-sun"><b>${fmtBDT(o.revenue)}</b><span>approved course sales</span></div>
      <div class="stat bg-pink" style="cursor:pointer" data-go="payments"><b>${o.pending_payments}</b><span>payments to verify ➜</span></div>
      <div class="stat bg-violet" style="cursor:pointer" data-go="bookings"><b>${o.new_bookings}</b><span>new tuition requests ➜</span></div>
      <div class="stat bg-mint" style="cursor:pointer" data-go="lessons"><b>${o.lessons}</b><span>lessons ➜</span></div>
    </div>
    <div class="card flat" style="margin-top:24px">
      <h3>Daily routine ✅</h3>
      <ol style="margin:0;padding-left:1.2em">
        <li>Open <b>Payments</b>, check each TrxID in your bKash/Nagad app, then Approve or Reject.</li>
        <li>Open <b>Tuition requests</b>, tap WhatsApp to reply, then set the status.</li>
        <li>Paid cash for onsite classes? Go to <b>Students</b> → Grant course.</li>
      </ol>
    </div>`;
  $$('[data-go]', panel).forEach((d) => d.addEventListener('click', () => show(d.dataset.go)));
}

// ---------------------------------------------------------------- payments
async function payments(filter = 'pending') {
  const { enrollments } = await api.get('/api/admin/enrollments' + (filter ? '?status=' + filter : ''));
  panel.innerHTML = `
    <div class="row" style="margin-bottom:14px">
      ${['pending', 'active', 'rejected', ''].map((f) => `<button class="btn btn-sm ${f === filter ? 'btn-ink' : 'btn-white'}" data-f="${f}">${f || 'all'}</button>`).join('')}
    </div>
    ${enrollments.length ? `<div class="table-wrap"><table class="data">
      <tr><th>Student</th><th>Course</th><th>Paid</th><th>From / TrxID</th><th>When</th><th>Status</th><th></th></tr>
      ${enrollments.map((e) => `<tr>
        <td><b>${esc(e.user_name)}</b><div class="small muted">${esc(e.user_email)}<br>${esc(e.class_level || '')}</div></td>
        <td>${esc(e.track_emoji)} ${esc(e.track_title)}</td>
        <td><b>${fmtBDT(e.amount)}</b><div class="small">${esc(e.method || '')}</div></td>
        <td><div class="small">${esc(e.sender_number || '-')}</div><code style="font-size:1rem">${esc(e.txn_id || '-')}</code></td>
        <td class="small">${date(e.created_at)}</td>
        <td><span class="chip ${e.status === 'active' ? 'chip-lime' : e.status === 'pending' ? 'chip-sun' : 'chip-red'}">${e.status}</span>${e.note ? `<div class="small muted">${esc(e.note)}</div>` : ''}</td>
        <td style="white-space:nowrap">
          ${e.status !== 'active' ? `<button class="btn btn-sm" data-ok="${e.id}">✓ Approve</button>` : ''}
          ${e.status !== 'rejected' ? `<button class="btn btn-sm btn-white" data-no="${e.id}">✕ Reject</button>` : ''}
        </td></tr>`).join('')}
    </table></div>` : '<div class="card flat empty">Nothing here. 🎉</div>'}`;
  $$('[data-f]', panel).forEach((b) => b.addEventListener('click', () => payments(b.dataset.f)));
  $$('[data-ok]', panel).forEach((b) => b.addEventListener('click', async () => {
    setLoading(b, true, '…');
    await api.post('/api/admin/enrollments/' + b.dataset.ok, { status: 'active' });
    toast('Approved. Course unlocked 💎');
    refreshCounts(); payments(filter);
  }));
  $$('[data-no]', panel).forEach((b) => b.addEventListener('click', () => {
    const m = modal(`<h2>Reject payment</h2><form><div class="field"><label>Reason (the student will see this)</label>
      <input class="input" name="note" value="We couldn't find this TrxID. Please check and resubmit, or message us on WhatsApp."></div>
      <button class="btn btn-danger" type="submit">Reject</button></form>`);
    m.el.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      await api.post('/api/admin/enrollments/' + b.dataset.no, { status: 'rejected', note: new FormData(ev.currentTarget).get('note') });
      m.close(); toast('Rejected', 'info'); refreshCounts(); payments(filter);
    });
  }));
}

// ---------------------------------------------------------------- bookings
async function bookings() {
  const { bookings: list } = await api.get('/api/admin/bookings');
  const ST = ['new', 'contacted', 'confirmed', 'closed'];
  const C = { new: 'chip-pink', contacted: 'chip-sun', confirmed: 'chip-lime', closed: '' };
  panel.innerHTML = list.length ? `<div class="grid grid-2">${list.map((b) => `
    <div class="card flat" style="${b.status === 'closed' ? 'opacity:.6' : ''}">
      <div class="row"><span class="chip ${C[b.status]}">${b.status}</span><span class="chip">${b.mode === 'online' ? '💻 Online' : '🏫 Onsite'}</span><span class="spacer"></span><span class="small muted">${timeAgo(b.created_at)}</span></div>
      <h3 style="margin:12px 0 2px">${esc(b.student_name)} <span class="small muted">· ${esc(b.class_level || '')}</span></h3>
      <div class="small">${b.guardian_name ? `Guardian: <b>${esc(b.guardian_name)}</b> · ` : ''}📞 ${esc(b.phone)}${b.email ? ` · ✉️ ${esc(b.email)}` : ''}</div>
      <p class="small" style="margin:8px 0"><b>${esc(b.focus || '')}</b><br>${esc(b.preferred_days || 'Any day')} · ${esc(b.preferred_time || '')}</p>
      ${b.message ? `<p class="small muted" style="white-space:pre-wrap">“${esc(b.message)}”</p>` : ''}
      <div class="field" style="margin:10px 0"><input class="input" placeholder="Private note (e.g. trial Sat 5pm)" data-note="${b.id}" value="${esc(b.admin_note || '')}"></div>
      <div class="row">
        <a class="btn btn-sm" target="_blank" rel="noopener" href="${waUrl(b.phone, `Hi${b.guardian_name ? ' ' + b.guardian_name : ''}! Thanks for booking a ${b.mode} trial class for ${b.student_name}. `)}">💬 WhatsApp</a>
        <select class="input" style="width:auto;padding:8px" data-st="${b.id}">${ST.map((s) => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button class="btn btn-sm btn-white" data-save="${b.id}">Save</button>
      </div>
    </div>`).join('')}</div>` : '<div class="card flat empty">No tuition requests yet. Share your /tuition link! 📣</div>';
  $$('[data-save]', panel).forEach((btn) => btn.addEventListener('click', async () => {
    const id = btn.dataset.save;
    await api.post('/api/admin/bookings/' + id, { status: $(`[data-st="${id}"]`).value, admin_note: $(`[data-note="${id}"]`).value });
    toast('Saved ✓'); refreshCounts(); bookings();
  }));
}

// ---------------------------------------------------------------- students
async function students() {
  const [{ students: list }, tracks] = await Promise.all([api.get('/api/admin/students'), getTracks()]);
  panel.innerHTML = `
    <div class="row" style="margin-bottom:14px"><input class="input" id="sSearch" placeholder="🔍 Search name, email, phone or class" style="max-width:420px"><span class="chip">${list.length} accounts</span></div>
    <div class="table-wrap"><table class="data" id="sTable">
      <tr><th>Student</th><th>Class</th><th>XP</th><th>Quests</th><th>Pro courses</th><th>Last active</th><th></th></tr>
      ${list.map((s) => `<tr data-q="${esc((s.name + ' ' + s.email + ' ' + (s.phone || '') + ' ' + (s.class_level || '')).toLowerCase())}">
        <td><b>${esc(s.name)}</b> ${s.role === 'admin' ? '<span class="chip chip-ink">admin</span>' : ''}<div class="small muted">${esc(s.email)}${s.phone ? '<br>' + esc(s.phone) : ''}</div></td>
        <td>${esc(s.class_level || '-')}</td><td>⚡ ${s.xp}</td><td>${s.lessons_done}</td>
        <td>${(s.unlocked || '').split(',').filter(Boolean).map((sl) => { const t = tracks.find((x) => x.slug === sl); return `<span class="chip" title="${esc(sl)}">${t ? esc(t.emoji) + ' ' + esc(t.title) : esc(sl)} <button class="btn-ghost" style="border:0;background:none;cursor:pointer;padding:0" data-revoke="${s.id}" data-slug="${esc(sl)}" aria-label="Remove access">✕</button></span>`; }).join(' ') || '<span class="small muted">-</span>'}</td>
        <td class="small">${esc(s.last_active || '-')}</td>
        <td style="white-space:nowrap"><button class="btn btn-sm" data-grant="${s.id}" data-name="${esc(s.name)}">＋ Grant</button>
          <button class="btn btn-sm btn-white" data-pw="${s.id}" data-name="${esc(s.name)}">🔑 Reset</button>
          ${s.phone ? `<a class="btn btn-sm btn-white" target="_blank" rel="noopener" href="${waUrl(s.phone)}">💬</a>` : ''}</td>
      </tr>`).join('')}
    </table></div>`;
  $('#sSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    $$('#sTable tr[data-q]').forEach((tr) => tr.classList.toggle('hide', !!q && !tr.dataset.q.includes(q)));
  });
  $$('[data-grant]', panel).forEach((b) => b.addEventListener('click', () => {
    const m = modal(`<h2>Grant course to ${esc(b.dataset.name)}</h2>
      <p class="muted small">For cash payments, tuition students or scholarships.</p>
      <form><div class="field"><label>Course</label><select class="input" name="track_slug">${tracks.map((t) => `<option value="${esc(t.slug)}">${esc(t.emoji)} ${esc(t.title)} (${fmtBDT(t.price_bdt)})</option>`).join('')}</select></div>
      <div class="field"><label>How</label><div class="toggle-group"><label><input type="radio" name="method" value="cash" checked><span>💵 Cash paid</span></label><label><input type="radio" name="method" value="manual"><span>🎁 Free / tuition</span></label></div></div>
      <div class="field"><label>Amount received (৳)</label><input class="input" name="amount" type="number" min="0" value="0"></div>
      <div class="field"><label>Note</label><input class="input" name="note" placeholder="e.g. Onsite batch Jan"></div>
      <button class="btn" type="submit">Unlock 💎</button></form>`);
    m.el.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.currentTarget);
      await api.post('/api/admin/grant', { user_id: b.dataset.grant, ...Object.fromEntries(fd) });
      m.close(); toast('Course unlocked 💎'); students();
    });
  }));
  $$('[data-revoke]', panel).forEach((b) => b.addEventListener('click', async () => {
    if (!confirm('Remove access to this course?')) return;
    await api.post('/api/admin/revoke', { user_id: b.dataset.revoke, track_slug: b.dataset.slug });
    toast('Access removed', 'info'); students();
  }));
  $$('[data-pw]', panel).forEach((b) => b.addEventListener('click', () => {
    const temp = 'quest-' + Math.random().toString(36).slice(2, 8);
    const m = modal(`<h2>Reset password</h2><p>For <b>${esc(b.dataset.name)}</b>. Send them the new password, and they can change it later from their dashboard.</p>
      <form><div class="field"><label>New password</label><input class="input" name="password" value="${temp}" minlength="8" style="font-family:var(--font-mono)"></div>
      <button class="btn" type="submit">Set password</button></form>`);
    m.el.querySelector('form').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const pw = new FormData(ev.currentTarget).get('password');
      try { await api.post(`/api/admin/students/${b.dataset.pw}/password`, { password: pw }); m.close(); toast('Password reset ✓. Send it to the student.'); }
      catch (ex) { toast(ex.message, 'err'); }
    });
  }));
}

// ---------------------------------------------------------------- lessons
async function lessons(trackId = '') {
  const tracks = await getTracks();
  const { lessons: list } = await api.get('/api/admin/lessons' + (trackId ? '?track_id=' + trackId : ''));
  panel.innerHTML = `
    <div class="row" style="margin-bottom:14px">
      <select class="input" id="lTrack" style="max-width:320px"><option value="">All courses</option>${tracks.map((t) => `<option value="${t.id}" ${String(t.id) === String(trackId) ? 'selected' : ''}>${esc(t.emoji)} ${esc(t.title)}</option>`).join('')}</select>
      <span class="spacer"></span><button class="btn" id="newLesson">＋ New lesson</button>
    </div>
    <div class="table-wrap"><table class="data">
      <tr><th>#</th><th>Lesson</th><th>Course</th><th>Access</th><th>XP</th><th>Status</th><th></th></tr>
      ${list.map((l) => `<tr>
        <td>${l.sort}</td><td><b>${esc(l.title)}</b><div class="small muted">/lesson/${esc(l.slug)}</div></td>
        <td class="small">${esc(l.track_emoji)} ${esc(l.track_title)}</td>
        <td>${l.is_free ? '<span class="chip chip-mint">free</span>' : '<span class="chip chip-violet">pro</span>'}</td>
        <td>${l.xp}</td><td>${l.is_published ? '<span class="chip chip-lime">live</span>' : '<span class="chip">draft</span>'}</td>
        <td style="white-space:nowrap"><button class="btn btn-sm" data-edit="${l.id}">✏️ Edit</button> <a class="btn btn-sm btn-white" target="_blank" href="/lesson/${esc(l.slug)}">👁</a></td>
      </tr>`).join('')}
    </table></div>`;
  $('#lTrack').addEventListener('change', (e) => lessons(e.target.value));
  $('#newLesson').addEventListener('click', () => editLesson(null, $('#lTrack').value));
  $$('[data-edit]', panel).forEach((b) => b.addEventListener('click', () => editLesson(b.dataset.edit)));
}

const SNIPPETS = {
  python: '```python\nname = input("Your name? ")\nprint("Hello", name)\n```',
  web: '```web\n<h1 style="color:hotpink">Hello web!</h1>\n<button onclick="alert(\'Hi!\')">Click</button>\n```',
  botmaze: '```botmaze\n{"grid":["S..#","#.#.","...G"], "loops": false, "best": 5, "hint": "Plan the path first!"}\n```',
  binary: '```binary\n{"bits": 8, "target": 45}\n```',
  logic: '```logic\n{"gates": ["AND", "OR", "NOT"]}\n```',
  pseudocode: '```pseudocode\nDECLARE Total : INTEGER\nTotal ← 0\nFOR Count ← 1 TO 10\n    Total ← Total + Count\nNEXT Count\nOUTPUT Total\n```',
  reveal: '```reveal\nShow the answer\nThe answer is **42**.\n```',
  tip: '> 💡 **Pro tip:** write your tip here.',
  table: '| Term | Meaning |\n|---|---|\n| Bit | A single 0 or 1 |',
};

async function editLesson(id, defaultTrack = '') {
  const tracks = await getTracks();
  const L = id ? (await api.get('/api/admin/lessons/' + id)).lesson : {
    track_id: defaultTrack || tracks[0]?.id, title: '', slug: '', summary: '', sort: 99, is_free: 1, xp: 20, kind: 'lesson', minutes: 10,
    video_url: '', content_md: '## What you will learn\n\n- \n\n## Let\'s go!\n\n', quiz_text: 'Q: Your first question?\n- Wrong answer\n* Right answer\n- Another wrong one\n> Short explanation shown after answering.', is_published: 1,
  };
  panel.innerHTML = `
    <form id="lessonForm">
      <div class="row" style="margin-bottom:16px">
        <button type="button" class="btn btn-sm btn-white" id="back">← All lessons</button>
        <h2 style="margin:0">${id ? 'Edit lesson' : 'New lesson'}</h2><span class="spacer"></span>
        ${id ? `<button type="button" class="btn btn-sm btn-danger" id="del">🗑 Delete</button>` : ''}
        <button class="btn" type="submit">💾 Save</button>
      </div>
      <div class="card flat">
        <div class="grid grid-3" style="gap:0 18px">
          <div class="field"><label>Course</label><select class="input" name="track_id">${tracks.map((t) => `<option value="${t.id}" ${t.id == L.track_id ? 'selected' : ''}>${esc(t.emoji)} ${esc(t.title)}</option>`).join('')}</select></div>
          <div class="field"><label>Title</label><input class="input" name="title" value="${esc(L.title)}" required></div>
          <div class="field"><label>URL slug</label><input class="input" name="slug" value="${esc(L.slug)}" placeholder="auto from title"><span class="hint">Changing it breaks old links.</span></div>
        </div>
        <div class="field"><label>Summary (one line shown on the quest map)</label><input class="input" name="summary" value="${esc(L.summary || '')}"></div>
        <div class="grid grid-4" style="gap:0 18px">
          <div class="field"><label>Order #</label><input class="input" type="number" name="sort" value="${L.sort}"></div>
          <div class="field"><label>XP reward</label><input class="input" type="number" name="xp" value="${L.xp}"></div>
          <div class="field"><label>Minutes</label><input class="input" type="number" name="minutes" value="${L.minutes}"></div>
          <div class="field"><label>Type</label><select class="input" name="kind">${['lesson', 'game', 'project', 'exam'].map((k) => `<option ${k === L.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="gap:24px;margin-bottom:12px">
          <label class="row" style="gap:8px;font-weight:800"><input type="checkbox" name="is_free" ${L.is_free ? 'checked' : ''} style="width:20px;height:20px"> Free lesson (unchecked = Pro only)</label>
          <label class="row" style="gap:8px;font-weight:800"><input type="checkbox" name="is_published" ${L.is_published ? 'checked' : ''} style="width:20px;height:20px"> Published</label>
        </div>
        <div class="field"><label>Video link (optional)</label><input class="input" name="video_url" value="${esc(L.video_url || '')}" placeholder="YouTube (can be Unlisted) or Google Drive share link"></div>
      </div>

      <h3 style="margin-top:26px">Lesson content</h3>
      <div class="cheat" style="margin-bottom:12px"><b>Insert:</b> ${Object.keys(SNIPPETS).map((k) => `<button type="button" class="btn btn-sm btn-white" data-snip="${k}" style="margin:3px">${k}</button>`).join('')}
        <div class="small muted" style="margin-top:6px">Write in Markdown: <code>## Heading</code>, <code>**bold**</code>, <code>- list</code>, <code>![alt](image-url)</code>. The boxes above add interactive widgets.</div></div>
      <div class="editor-grid">
        <textarea class="input md-editor" name="content_md" id="mdEditor" spellcheck="false">${esc(L.content_md)}</textarea>
        <div class="preview-pane"><div class="chip" style="margin-bottom:10px">Live preview</div><div class="lesson-body" id="mdPreview"></div></div>
      </div>

      <h3 style="margin-top:26px">Quiz <span class="chip" id="qCount"></span></h3>
      <div class="cheat" style="margin-bottom:12px">
        <code>Q:</code> starts a question · <code>-</code> wrong option · <code>*</code> correct option · <code>&gt;</code> explanation. Leave empty for no quiz (students get a "Claim XP" button instead).
      </div>
      <div class="editor-grid">
        <textarea class="input md-editor" style="min-height:260px!important" name="quiz_text" id="quizEditor" spellcheck="false">${esc(L.quiz_text || '')}</textarea>
        <div id="quizPreview"></div>
      </div>
      <div class="row" style="margin-top:20px"><span class="spacer"></span><button class="btn btn-lg" type="submit">💾 Save lesson</button></div>
    </form>`;

  const md = $('#mdEditor');
  const qz = $('#quizEditor');
  let t1, t2;
  const preview = () => renderLesson(md.value, $('#mdPreview'));
  const previewQuiz = () => {
    const n = parseQuiz(qz.value).length;
    $('#qCount').textContent = n ? `${n} question${n > 1 ? 's' : ''}` : 'no quiz';
    const w = quizWidget(qz.value);
    $('#quizPreview').innerHTML = '';
    if (w) { w.style.marginTop = '0'; $('#quizPreview').appendChild(w); }
  };
  md.addEventListener('input', () => { clearTimeout(t1); t1 = setTimeout(preview, 600); });
  qz.addEventListener('input', () => { clearTimeout(t2); t2 = setTimeout(previewQuiz, 600); });
  md.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') { e.preventDefault(); const s = md.selectionStart; md.setRangeText('    ', s, md.selectionEnd, 'end'); }
  });
  preview(); previewQuiz();

  $$('[data-snip]').forEach((b) => b.addEventListener('click', () => {
    const s = md.selectionStart;
    md.setRangeText('\n' + SNIPPETS[b.dataset.snip] + '\n', s, md.selectionEnd, 'end');
    md.focus(); preview();
  }));
  $('#back').addEventListener('click', () => lessons());
  $('#del')?.addEventListener('click', async () => {
    if (!confirm('Delete this lesson? Student progress for it will also be removed.')) return;
    await api.del('/api/admin/lessons/' + id);
    toast('Lesson deleted', 'info'); lessons();
  });
  $('#lessonForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd);
    body.is_free = fd.get('is_free') === 'on';
    body.is_published = fd.get('is_published') === 'on';
    if (id) body.id = id;
    try {
      const r = await api.post('/api/admin/lessons', body);
      toast('Saved ✓');
      if (!id) editLesson(r.id);
    } catch (ex) { toast(ex.message, 'err'); }
  });
}

// ---------------------------------------------------------------- courses
async function courses() {
  const tracks = await getTracks(true);
  const COLORS = ['sun', 'sky', 'lime', 'pink', 'violet', 'orange'];
  panel.innerHTML = `<p class="muted">Set the Pro price for each course here. Price 0 means the whole course is free.</p>` +
    tracks.map((t) => `
    <form class="card flat" style="margin-bottom:16px" data-track="${t.id}">
      <div class="row" style="margin-bottom:12px"><span style="font-size:2rem">${esc(t.emoji)}</span><h3 style="margin:0">${esc(t.title)}</h3><span class="chip">${t.lesson_count} lessons</span><span class="chip">/track/${esc(t.slug)}</span></div>
      <div class="grid grid-4" style="gap:0 16px">
        <div class="field"><label>Title</label><input class="input" name="title" value="${esc(t.title)}"></div>
        <div class="field"><label>Emoji</label><input class="input" name="emoji" value="${esc(t.emoji)}"></div>
        <div class="field"><label>Pro price (৳)</label><input class="input" name="price_bdt" type="number" min="0" value="${t.price_bdt}"></div>
        <div class="field"><label>Colour</label><select class="input" name="color">${COLORS.map((c) => `<option ${c === t.color ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        <div class="field"><label>Classes label</label><input class="input" name="classes" value="${esc(t.classes)}"></div>
        <div class="field"><label>Ages label</label><input class="input" name="ages" value="${esc(t.ages || '')}"></div>
        <div class="field"><label>Order</label><input class="input" name="sort" type="number" value="${t.sort}"></div>
        <div class="field"><label>&nbsp;</label><label class="row" style="gap:8px;font-weight:800"><input type="checkbox" name="is_published" ${t.is_published ? 'checked' : ''} style="width:20px;height:20px"> Published</label></div>
      </div>
      <div class="field"><label>Cambridge alignment</label><input class="input" name="cambridge" value="${esc(t.cambridge || '')}"></div>
      <div class="field"><label>Tagline</label><input class="input" name="tagline" value="${esc(t.tagline || '')}"></div>
      <div class="field"><label>Description</label><textarea class="input" name="description" style="min-height:80px">${esc(t.description || '')}</textarea></div>
      <button class="btn" type="submit">💾 Save course</button>
    </form>`).join('');
  $$('form[data-track]', panel).forEach((f) => f.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(f);
    const body = Object.fromEntries(fd);
    body.is_published = fd.get('is_published') === 'on';
    body.id = f.dataset.track;
    try { await api.post('/api/admin/tracks', body); toast('Course saved ✓'); tracksCache = null; }
    catch (ex) { toast(ex.message, 'err'); }
  }));
}

// ---------------------------------------------------------------- settings
const SETTING_FIELDS = [
  ['Brand', [['brand_name', 'Brand / site name'], ['tagline', 'Tagline (footer)'], ['announcement', 'Top banner announcement (leave empty to hide)']]],
  ['Teacher profile', [['teacher_name', 'Your name'], ['teacher_title', 'Title line'], ['teacher_bio', 'Short bio', 'textarea'], ['teacher_photo', 'Photo URL (square image link)']]],
  ['Contact', [['whatsapp', 'WhatsApp number (digits with country code, e.g. 88017XXXXXXXX)'], ['phone', 'Phone (shown on site)'], ['email', 'Email'], ['facebook_url', 'Facebook page URL'], ['youtube_url', 'YouTube channel URL']]],
  ['Payments', [['bkash_number', 'bKash personal number (empty = hide bKash)'], ['nagad_number', 'Nagad personal number (empty = hide Nagad)'], ['payment_note', 'Note under the payment form', 'textarea']]],
  ['Tuition', [['online_fee', 'Online fee (number only, e.g. 3,500)'], ['online_fee_note', 'Online fee note'], ['onsite_fee', 'Onsite fee'], ['onsite_fee_note', 'Onsite fee note'], ['onsite_location', 'Onsite location / area']]],
];
async function settings() {
  const { settings: s } = await api.get('/api/admin/settings');
  panel.innerHTML = `<form id="setForm">${SETTING_FIELDS.map(([group, fields]) => `
    <div class="card flat" style="margin-bottom:16px"><h3>${group}</h3>
      ${fields.map(([k, label, type]) => `<div class="field"><label for="s_${k}">${esc(label)}</label>${type === 'textarea'
        ? `<textarea class="input" id="s_${k}" name="${k}" style="min-height:80px">${esc(s[k] || '')}</textarea>`
        : `<input class="input" id="s_${k}" name="${k}" value="${esc(s[k] || '')}">`}</div>`).join('')}
    </div>`).join('')}
    <button class="btn btn-lg" type="submit">💾 Save settings</button></form>`;
  $('#setForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api.post('/api/admin/settings', { settings: Object.fromEntries(new FormData(e.currentTarget)) }); toast('Settings saved ✓'); }
    catch (ex) { toast(ex.message, 'err'); }
  });
}

refreshCounts().catch(() => {});
show(TABS[location.hash.slice(1)] ? location.hash.slice(1) : 'overview');
