import { boot, api, $, esc } from '../core.js';
import { renderTracks, classPicker } from '../tracks-ui.js';

await boot({ active: 'learn' });

const grid = $('#trackGrid');
const applySaved = classPicker($('#classPicker'), grid);
api.get('/api/tracks')
  .then(({ tracks }) => { renderTracks(grid, tracks); applySaved(); })
  .catch((e) => { grid.innerHTML = `<div class="empty">Couldn't load courses: ${esc(e.message)}</div>`; });

api.get('/api/leaderboard')
  .then(({ leaders }) => {
    $('#leaders').innerHTML = leaders.length
      ? leaders.map((l, i) => `
          <div class="leader">
            <span class="rank">${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
            <div><b>${esc(l.name)}</b><div class="small muted">${esc(l.class_level || '')} · Lv ${l.level} ${esc(l.level_name)}</div></div>
            <span class="spacer"></span>
            ${l.streak > 1 ? `<span class="chip chip-sun">🔥 ${l.streak}</span>` : ''}
            <span class="chip chip-lime">⚡ ${l.xp}</span>
          </div>`).join('')
      : '<div class="empty">🏁 The board is empty. Finish a quest and be the first legend!</div>';
  })
  .catch(() => { $('#leaders').innerHTML = '<div class="empty">Leaderboard unavailable right now.</div>'; });
