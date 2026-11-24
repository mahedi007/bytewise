import { esc, fmtBDT, CLASS_TRACK, PICKER_CLASSES, prefs, state, $$ } from './core.js';

export function trackCard(t) {
  const pct = t.lesson_count ? Math.round((t.done / t.lesson_count) * 100) : 0;
  const status = t.unlocked
    ? '<span class="chip chip-ink">💎 Unlocked</span>'
    : t.enrollment === 'pending'
      ? '<span class="chip chip-sun">⏳ Payment checking</span>'
      : `<span class="chip">${t.free_count} free · ${fmtBDT(t.price_bdt)} Pro</span>`;
  return `
    <a class="card card-hover track-card bg-${esc(t.color)}" href="/track/${esc(t.slug)}" data-track="${esc(t.slug)}">
      ${t.slug === 'olevel-cs' ? '<span class="ribbon">EXAM PREP</span>' : ''}
      <span class="tc-emoji">${esc(t.emoji)}</span>
      <div class="tc-meta"><span class="chip">${esc(t.classes)}</span>${t.ages ? `<span class="chip">${esc(t.ages)}</span>` : ''}</div>
      <h3>${esc(t.title)}</h3>
      <p style="font-weight:800;margin:0">${esc(t.tagline || '')}</p>
      <p class="tc-desc">${esc(t.description || '')}</p>
      ${t.cambridge ? `<p class="small" style="margin:0;font-weight:700">🎓 ${esc(t.cambridge)}</p>` : ''}
      ${state.me && t.done ? `<div><div class="row small" style="justify-content:space-between;font-weight:800"><span>Progress</span><span>${t.done}/${t.lesson_count}</span></div><div class="xpbar" style="height:12px;background:#fff"><i style="width:${pct}%"></i></div></div>` : ''}
      <div class="tc-foot">${status}<span class="btn btn-sm btn-white">${t.done ? 'Continue' : 'Start'} ➜</span></div>
    </a>`;
}

export function renderTracks(grid, tracks) {
  grid.innerHTML = tracks.map(trackCard).join('') || '<div class="empty">No courses yet.</div>';
}

/** Class chips: highlights the matching course card. Remembers the choice on this device. */
export function classPicker(container, grid) {
  const saved = state.me?.user?.class_level || prefs.get('bq_class', '');
  container.innerHTML =
    PICKER_CLASSES.map((c) => `<button type="button" data-c="${esc(c)}">${c === 'PG' ? 'Playgroup' : esc(c)}</button>`).join('') +
    '<button type="button" data-c="">Show all</button>';
  const apply = (c, scroll) => {
    $$('button', container).forEach((b) => b.classList.toggle('on', b.dataset.c === c && !!c));
    const slug = CLASS_TRACK[c];
    $$('[data-track]', grid).forEach((card) => {
      card.classList.toggle('dim', !!slug && card.dataset.track !== slug);
      card.classList.toggle('pulse', !!slug && card.dataset.track === slug);
    });
    if (scroll && slug) grid.querySelector(`[data-track="${slug}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  container.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    prefs.set('bq_class', b.dataset.c);
    apply(b.dataset.c, true);
  });
  return () => apply(saved, false);
}
