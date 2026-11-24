import { boot, api, $, esc, fmtBDT, timeAgo, modal, toast, setLoading, PICKER_CLASSES, state } from '../core.js';

const { me } = await boot({ requireAuth: true });
const u = me.user;

function profileCard() {
  $('#profile').innerHTML = `
    <div class="card" style="box-shadow:var(--shadow-lg)">
      <div class="row">
        <div class="avatar" style="width:68px;height:68px;font-size:1.9rem;background:var(--sky)">${esc(u.name.trim()[0] || '?').toUpperCase()}</div>
        <div><h2 style="margin:0;font-size:1.6rem">${esc(u.name)}</h2><div class="small muted">${esc(u.class_level || '')}${u.role === 'admin' ? ' · <b>Admin</b>' : ''}</div></div>
      </div>
      <div style="margin:22px 0 8px" class="row"><span class="sticker">Level ${u.level} · ${esc(u.level_name)}</span></div>
      <div class="row small" style="justify-content:space-between;font-weight:800;margin-top:14px"><span>⚡ ${u.xp} XP</span><span>${100 - u.level_progress} XP to Level ${u.level + 1}</span></div>
      <div class="xpbar"><i style="width:${u.level_progress}%"></i></div>
      <div class="grid grid-3" style="gap:10px;margin-top:20px">
        <div class="stat bg-lime"><b>${u.xp}</b><span>XP</span></div>
        <div class="stat bg-sun"><b>${u.streak}</b><span>🔥 streak</span></div>
        <div class="stat bg-pink"><b>${me.completed.length}</b><span>quests</span></div>
      </div>
      <p class="small muted" style="margin:14px 0 0">Best streak: ${Math.max(u.best_streak || 0, u.streak)} days</p>
      <div class="row" style="margin-top:18px">
        <button class="btn btn-sm btn-white" id="editProfile">✏️ Edit profile</button>
        <button class="btn btn-sm btn-white" id="changePw">🔑 Password</button>
        <button class="btn btn-sm btn-ghost" id="logout">Log out</button>
      </div>
      ${u.role === 'admin' ? '<a class="btn btn-ink" style="width:100%;margin-top:16px" href="/admin">🛠️ Open admin panel</a>' : ''}
    </div>`;
  $('#logout').addEventListener('click', async () => { await api.post('/api/auth/logout'); location.href = '/'; });
  $('#changePw').addEventListener('click', changePassword);
  $('#editProfile').addEventListener('click', editProfile);
}

function changePassword() {
  const m = modal(`
    <h2>Change password</h2>
    <form><div class="field"><label>Current password</label><input class="input" type="password" name="current" required autocomplete="current-password"></div>
    <div class="field"><label>New password</label><input class="input" type="password" name="next" minlength="8" required autocomplete="new-password"></div>
    <button class="btn" type="submit">Save</button></form>`);
  m.el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const btn = e.currentTarget.querySelector('button');
    setLoading(btn, true);
    try { await api.post('/api/me/password', { current: fd.get('current'), next: fd.get('next') }); toast('Password updated ✓'); m.close(); }
    catch (ex) { toast(ex.message, 'err'); setLoading(btn, false); }
  });
}

function editProfile() {
  const m = modal(`
    <h2>Edit profile</h2>
    <form><div class="field"><label>Name</label><input class="input" name="name" value="${esc(u.name)}" required></div>
    <div class="field"><label>Class</label><select class="input" name="class_level">${PICKER_CLASSES.map((c) => `<option ${c === u.class_level ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
    <div class="field"><label>Parent's WhatsApp</label><input class="input" name="phone" value="${esc(u.phone || '')}"></div>
    <button class="btn" type="submit">Save</button></form>`);
  m.el.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try { await api.post('/api/me/profile', Object.fromEntries(fd)); location.reload(); }
    catch (ex) { toast(ex.message, 'err'); }
  });
}

async function courses() {
  const { tracks } = await api.get('/api/tracks');
  const mine = tracks.filter((t) => t.done > 0 || t.unlocked || t.enrollment);
  const show = mine.length ? mine : tracks;
  $('#courses').innerHTML = (mine.length ? '' : '<p class="muted">Pick a course to begin your first quest:</p>') + show.map((t) => {
    const pct = t.lesson_count ? Math.round((t.done / t.lesson_count) * 100) : 0;
    return `
      <a class="mini-track" href="/track/${esc(t.slug)}">
        <span class="me bg-${esc(t.color)}">${esc(t.emoji)}</span>
        <div style="flex:1;min-width:0">
          <div class="row" style="justify-content:space-between"><b>${esc(t.title)}</b>
            <span>${t.unlocked ? '<span class="chip chip-ink">💎 Pro</span>' : t.enrollment === 'pending' ? '<span class="chip chip-sun">⏳ Checking payment</span>' : '<span class="chip chip-mint">Free</span>'}</span></div>
          <div class="small muted">${esc(t.classes)} · ${t.done}/${t.lesson_count} quests</div>
          <div class="xpbar" style="margin-top:6px"><i style="width:${pct}%"></i></div>
        </div>
      </a>`;
  }).join('');

  // "continue" suggestion: the user's class course, else the first with progress
  const target = mine.find((t) => t.done < t.lesson_count) || tracks.find((t) => t.slug === classTrack()) || tracks[0];
  if (target) {
    const { lessons } = await api.get('/api/tracks/' + target.slug);
    const nextLesson = lessons.find((l) => !l.completed && !l.locked);
    if (nextLesson) {
      $('#continue').innerHTML = `
        <div class="card bg-lime" style="margin-bottom:26px;box-shadow:var(--shadow-lg)">
          <span class="chip chip-ink">▶ Next quest</span>
          <h2 style="margin:12px 0 4px">${esc(nextLesson.title)}</h2>
          <p style="margin:0 0 16px;font-weight:600">${esc(target.emoji)} ${esc(target.title)} · ⏱ ${nextLesson.minutes} min · +${nextLesson.xp} XP</p>
          <a class="btn btn-lg btn-ink" href="/lesson/${esc(nextLesson.slug)}">Play now ➜</a>
        </div>`;
    }
  }
}
function classTrack() {
  const map = { PG: 'tiny-coders', Nursery: 'tiny-coders', KG: 'tiny-coders', 'Class 1': 'little-explorers', 'Class 2': 'little-explorers', 'Class 3': 'little-explorers', 'Class 4': 'junior-builders', 'Class 5': 'junior-builders', 'Class 6': 'junior-builders', 'Class 7': 'code-creators', 'Class 8': 'code-creators' };
  return map[u.class_level] || 'olevel-cs';
}

function badges() {
  $('#badges').innerHTML = me.badges.map((b) => `
    <div class="badge ${b.earned ? 'bg-sun' : 'off'}" title="${esc(b.desc)}">
      <div class="be">${b.emoji}</div><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>
    </div>`).join('');
}

function payments() {
  const S = { pending: 'chip-sun', active: 'chip-lime', rejected: 'chip-red' };
  const L = { pending: '⏳ Checking', active: '✅ Approved', rejected: '❌ Not approved' };
  $('#payments').innerHTML = me.enrollments.length
    ? `<div class="table-wrap"><table class="data"><tr><th>Course</th><th>Amount</th><th>TrxID</th><th>Status</th><th>When</th></tr>
        ${me.enrollments.map((e) => `<tr><td>${esc(e.track_emoji)} ${esc(e.track_title)}</td><td>${fmtBDT(e.amount)}</td><td><code>${esc(e.txn_id || e.method || '-')}</code></td>
          <td><span class="chip ${S[e.status]}">${L[e.status]}</span>${e.note ? `<div class="small muted">${esc(e.note)}</div>` : ''}</td><td class="small">${timeAgo(e.created_at)}</td></tr>`).join('')}
      </table></div>`
    : `<div class="card flat empty">No payments yet. <a href="/learn">Unlock a Pro course</a> when you're ready 💎</div>`;
}

profileCard();
badges();
payments();
courses().catch((e) => { $('#courses').innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
