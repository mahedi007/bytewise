import { boot, api, $, esc, fmtBDT, state } from '../core.js';
import { renderTracks, classPicker } from '../tracks-ui.js';

await boot({ active: '' });

const grid = $('#trackGrid');
const applySaved = classPicker($('#classPicker'), grid);
try {
  const { tracks } = await api.get('/api/tracks');
  renderTracks(grid, tracks);
  applySaved();
  const paid = tracks.map((t) => t.price_bdt).filter((p) => p > 0);
  if (paid.length) $('#proFrom').textContent = 'from ' + fmtBDT(Math.min(...paid));
} catch (e) {
  grid.innerHTML = `<div class="empty">Couldn't load courses: ${esc(e.message)}</div>`;
}

const photo = state.settings.teacher_photo;
if (photo) $('#teacherPhoto').innerHTML = `<img src="${esc(photo)}" alt="${esc(state.settings.teacher_name || 'Teacher')}">`;
