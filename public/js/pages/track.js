import { boot, api, $, esc, fmtBDT, pathSlug, guest, state } from '../core.js';
import { openEnroll } from '../enroll.js';

await boot({ active: 'learn' });

const slug = pathSlug();
const KIND = { lesson: '📘 Lesson', game: '🎮 Game', project: '🛠️ Project', exam: '📝 Exam practice' };

async function load() {
  let data;
  try { data = await api.get('/api/tracks/' + encodeURIComponent(slug)); }
  catch (e) {
    $('#trackHead').innerHTML = `<div class="card empty">😕 ${esc(e.message)} <br><a class="btn" style="margin-top:14px" href="/learn">See all courses</a></div>`;
    $('#questMap').innerHTML = '';
    return;
  }
  const { track: t, lessons } = data;
  document.title = `${t.title} (${t.classes}) · ${state.settings.brand_name || 'ByteQuest'}`;
  const done = lessons.filter((l) => l.completed || (!state.me && guest.has(l.slug))).length;
  const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
  const freeCount = lessons.filter((l) => l.is_free).length;
  const next = lessons.find((l) => !l.locked && !(l.completed || (!state.me && guest.has(l.slug))));

  let cta;
  if (t.unlocked) cta = '<span class="chip chip-ink" style="font-size:1rem;padding:10px 16px">💎 Pro unlocked: every quest is yours</span>';
  else if (t.enrollment === 'pending') cta = '<span class="chip chip-sun" style="font-size:1rem;padding:10px 16px">⏳ Payment submitted, checking now</span>';
  else if (t.price_bdt > 0) cta = `<button class="btn btn-lg btn-ink" id="unlockBtn">💎 Unlock Pro · ${fmtBDT(t.price_bdt)}</button>`;
  else cta = '';

  $('#trackHead').innerHTML = `
    <section class="track-hero bg-${esc(t.color)}">
      <span class="big-emoji" aria-hidden="true">${esc(t.emoji)}</span>
      <div class="row" style="margin-bottom:12px"><span class="chip">${esc(t.classes)}</span>${t.ages ? `<span class="chip">${esc(t.ages)}</span>` : ''}${t.cambridge ? `<span class="chip">🎓 ${esc(t.cambridge)}</span>` : ''}</div>
      <h1 style="font-size:clamp(2.2rem,5vw,3.8rem);max-width:760px">${esc(t.title)}</h1>
      <p style="font-weight:800;font-size:1.2rem;max-width:640px">${esc(t.tagline || '')}</p>
      <p style="max-width:680px">${esc(t.description || '')}</p>
      <div style="max-width:460px;margin:18px 0">
        <div class="row small" style="justify-content:space-between;font-weight:800"><span>Your progress</span><span>${done}/${lessons.length} quests · ${pct}%</span></div>
        <div class="xpbar"><i style="width:${pct}%"></i></div>
      </div>
      <div class="row">
        ${next ? `<a class="btn btn-lg btn-white" href="/lesson/${esc(next.slug)}">${done ? 'Continue' : 'Start quest 1'} ➜</a>` : ''}
        ${cta}
      </div>
    </section>`;
  $('#unlockBtn')?.addEventListener('click', () => openEnroll(t, { onDone: load }));

  $('#mapCount').textContent = `${lessons.length} quests · ${freeCount} free`;
  $('#questMap').innerHTML = lessons.map((l, i) => {
    const isDone = l.completed || (!state.me && guest.has(l.slug));
    return `
      <a class="quest ${isDone ? 'done' : ''} ${l.locked ? 'locked' : ''}" href="/lesson/${esc(l.slug)}">
        <span class="q-num">${isDone ? '✓' : l.locked ? '🔒' : i + 1}</span>
        <div><h3>${esc(l.title)}</h3><p>${esc(l.summary || '')}</p></div>
        <div class="q-tags">
          <span class="chip">${KIND[l.kind] || KIND.lesson}</span>
          <span class="chip">⏱ ${l.minutes} min</span>
          <span class="chip chip-lime">+${l.xp} XP</span>
          ${l.is_free ? '<span class="chip chip-mint">FREE</span>' : '<span class="chip chip-violet">PRO</span>'}
        </div>
      </a>`;
  }).join('') || '<div class="card empty">Quests are being crafted. Check back soon! 🛠️</div>';
}

load();
