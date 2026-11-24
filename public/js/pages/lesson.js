import { boot, api, $, esc, fmtBDT, pathSlug, guest, state, celebrate, toast, waLink, setLoading } from '../core.js';
import { renderLesson, renderMarkdown, quizWidget, videoEmbed, parseQuiz } from '../widgets.js';
import { openEnroll } from '../enroll.js';

await boot({ active: 'learn' });

const slug = pathSlug();
const KIND = { lesson: '📘 Lesson', game: '🎮 Game', project: '🛠️ Project', exam: '📝 Exam practice' };

let data;
try {
  data = (await api.get('/api/lessons/' + encodeURIComponent(slug))).lesson;
} catch (e) {
  $('#lessonHead').innerHTML = '';
  $('#lessonBody').innerHTML = `<div class="card empty">😕 ${esc(e.message)}<br><a class="btn" style="margin-top:14px" href="/learn">Back to courses</a></div>`;
  throw e;
}
const L = data;
const brand = state.settings.brand_name || 'ByteQuest';
document.title = `${L.title} · ${L.track.title} · ${brand}`;
const alreadyDone = L.completed || (!state.me && guest.has(L.slug));

$('#crumbs').innerHTML = `<a href="/learn">Courses</a> <span>›</span> <a href="/track/${esc(L.track.slug)}">${esc(L.track.emoji)} ${esc(L.track.title)}</a> <span>›</span> <span>Quest ${L.position}</span>`;
$('#lessonHead').innerHTML = `
  <div class="row" style="margin-bottom:10px">
    <span class="chip bg-${esc(L.track.color)}">${KIND[L.kind] || KIND.lesson}</span>
    <span class="chip">⏱ ${L.minutes} min</span>
    <span class="chip chip-lime">+${L.xp} XP</span>
    ${L.is_free ? '<span class="chip chip-mint">FREE</span>' : '<span class="chip chip-violet">PRO</span>'}
    ${alreadyDone ? '<span class="chip chip-ink">✓ Completed</span>' : ''}
  </div>
  <h1 style="font-size:clamp(2rem,4.5vw,3.2rem)">${esc(L.title)}</h1>
  ${L.summary ? `<p class="muted" style="font-size:1.15rem">${esc(L.summary)}</p>` : ''}`;

// side panel
$('#lessonSide').innerHTML = `
  <div class="card bg-${esc(L.track.color)}" style="padding:20px">
    <div class="small" style="font-weight:800">${esc(L.track.emoji)} ${esc(L.track.title)}</div>
    <div style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin:4px 0 10px">Quest ${L.position} of ${L.total}</div>
    <div class="xpbar" style="background:#fff"><i style="width:${Math.round((L.position / L.total) * 100)}%"></i></div>
    <a class="btn btn-sm btn-white" style="margin-top:14px" href="/track/${esc(L.track.slug)}">🗺️ Quest map</a>
  </div>
  <div class="card flat" style="padding:20px">
    <h3 style="margin-bottom:6px">Stuck? 🤔</h3>
    <p class="small muted">Ask your teacher. Send a screenshot of your code on WhatsApp.</p>
    <a class="btn btn-sm" href="${waLink(`Hi! I'm stuck on "${L.title}" (${L.track.title}).`)}" target="_blank" rel="noopener">💬 Ask on WhatsApp</a>
  </div>
  <div class="card flat bg-pink" style="padding:20px">
    <h3 style="margin-bottom:6px">Want live classes?</h3>
    <p class="small">Online or onsite, 1:1 or small group.</p>
    <a class="btn btn-sm btn-white" href="/tuition">Book a trial 🎟️</a>
  </div>`;

// nav
$('#lessonNav').innerHTML = `
  ${L.prev ? `<a class="btn btn-white" href="/lesson/${esc(L.prev.slug)}">← ${esc(L.prev.title)}</a>` : '<span></span>'}
  ${L.next ? `<a class="btn btn-white" href="/lesson/${esc(L.next.slug)}">${esc(L.next.title)} ${L.next.is_free ? '' : '🔒'} →</a>` : `<a class="btn btn-white" href="/track/${esc(L.track.slug)}">Back to quest map 🗺️</a>`}`;

if (L.locked) {
  // ---------- locked (Pro) ----------
  const pending = L.track.enrollment === 'pending';
  $('#lessonBody').innerHTML = `
    <div class="locked-box">
      <div class="teaser">${renderMarkdown(L.teaser || '')}</div>
      <div class="card unlock-card bg-violet" style="box-shadow:var(--shadow-lg)">
        <div class="lock">🔒</div>
        <h2>This is a Pro quest</h2>
        <p style="font-weight:600">Unlock <b>${esc(L.track.title)}</b> to get every quest, project and boss level in the course.</p>
        ${pending
          ? '<p class="chip chip-sun" style="font-size:1rem;padding:10px 16px">⏳ Your payment is being checked</p>'
          : `<button class="btn btn-lg btn-ink" id="unlockBtn">💎 Unlock for ${fmtBDT(L.track.price_bdt)}</button>`}
        <p class="small" style="margin-top:14px">${state.me ? '' : 'Already paid? <a href="/login?next=' + encodeURIComponent(location.pathname) + '">Log in</a>'}</p>
      </div>
    </div>`;
  $('#unlockBtn')?.addEventListener('click', () => openEnroll(L.track, { onDone: () => location.reload() }));
} else {
  // ---------- open lesson ----------
  const v = videoEmbed(L.video_url);
  if (v) $('#lessonVideo').appendChild(v);
  renderLesson(L.content_md, $('#lessonBody'));

  const hasQuiz = parseQuiz(L.quiz_text).length > 0;
  const claim = async (score, btn) => {
    if (!state.me) {
      const fresh = guest.add(L.slug, L.xp);
      celebrate({ gained: fresh ? L.xp : 0, guestMode: true, title: fresh ? 'Quest complete!' : 'Nice replay!' });
      return;
    }
    setLoading(btn, true, 'Claiming…');
    try {
      const { reward, new_badges } = await api.post('/api/progress', { slug: L.slug, quiz_score: score });
      celebrate({ ...reward, badges: new_badges });
      setLoading(btn, false);
      if (btn) { btn.textContent = '✓ Claimed'; btn.disabled = true; }
      refreshHud(reward);
    } catch (e) {
      setLoading(btn, false);
      toast(e.message, 'err');
    }
  };

  if (hasQuiz) {
    const q = quizWidget(L.quiz_text, {
      onFinish: (pct, slot) => {
        slot.innerHTML = `<button class="btn btn-lg">${alreadyDone ? 'Save score' : `Claim +${L.xp} XP`} ⚡</button>`;
        const b = slot.querySelector('button');
        b.addEventListener('click', () => claim(pct, b));
      },
    });
    $('#lessonQuiz').appendChild(q);
  } else {
    $('#lessonComplete').innerHTML = `
      <div class="complete-bar">
        <div style="font-size:2.2rem">🏁</div>
        <div><b style="font-size:1.15rem">Finished the quest?</b><div class="small">${alreadyDone ? 'You already earned this XP. Replay anytime!' : `Claim your +${L.xp} XP and keep your streak alive.`}</div></div>
        <span class="spacer"></span>
        <button class="btn btn-lg btn-ink" id="claimBtn">${alreadyDone ? 'Mark again' : `Claim +${L.xp} XP`} ⚡</button>
      </div>`;
    $('#claimBtn').addEventListener('click', (e) => claim(null, e.currentTarget));
  }
}

function refreshHud(r) {
  const hud = document.querySelector('.hud-xp');
  if (hud) hud.textContent = `⚡ ${r.xp} XP`;
  const st = document.querySelector('.hud-streak');
  if (st) st.textContent = `🔥 ${r.streak}`;
}
