// Lesson renderer: Markdown → HTML, then special code fences become interactive widgets.
//
//   ```python      runnable, editable Python (Pyodide, runs in the browser)
//   ```web         live HTML/CSS/JS editor with preview
//   ```botmaze     robot maze game  (JSON config)
//   ```binary      binary switch toy (JSON config, optional)
//   ```logic       logic gate lab    (JSON config, optional)
//   ```pseudocode  Cambridge-style pseudocode, highlighted
//   ```reveal      "tap to reveal" answer box (first line = button label)
//
// Requires window.marked and window.DOMPurify (loaded from /vendor).

import { esc, confetti } from './core.js';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

export function renderMarkdown(md) {
  const html = window.marked.parse(md || '', { gfm: true, breaks: false });
  return window.DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });
}

export function renderLesson(md, container) {
  container.innerHTML = renderMarkdown(md);
  enhance(container);
}

export function enhance(container) {
  container.querySelectorAll('a[href^="http"]').forEach((a) => { a.target = '_blank'; a.rel = 'noopener'; });
  container.querySelectorAll('pre > code').forEach((code) => {
    const lang = (code.className.match(/language-([\w-]+)/) || [])[1];
    const src = code.textContent.replace(/\n$/, '');
    const pre = code.parentElement;
    const maker = WIDGETS[lang];
    if (!maker) return;
    try { pre.replaceWith(maker(src)); } catch (e) { console.warn('Widget failed', lang, e); }
  });
}

const WIDGETS = {
  python: (src) => pythonWidget(src),
  py: (src) => pythonWidget(src),
  web: (src) => webWidget(src),
  html: (src) => webWidget(src),
  botmaze: (src) => botMaze(src),
  binary: (src) => binaryWidget(src),
  logic: (src) => logicWidget(src),
  pseudocode: (src) => pseudoWidget(src),
  reveal: (src) => revealWidget(src),
};

const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const parseJSON = (s, f = {}) => { try { return s.trim() ? JSON.parse(s) : f; } catch { return f; } };

function tabbable(textarea) {
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: en, value } = textarea;
      textarea.value = value.slice(0, s) + '    ' + value.slice(en);
      textarea.selectionStart = textarea.selectionEnd = s + 4;
    }
  });
  const fit = () => { textarea.style.height = 'auto'; textarea.style.height = Math.max(140, textarea.scrollHeight + 6) + 'px'; };
  textarea.addEventListener('input', fit);
  requestAnimationFrame(fit);
}

// ======================================================================
// Python (Pyodide)
// ======================================================================
let pyPromise = null;
export function loadPython() {
  if (pyPromise) return pyPromise;
  pyPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PYODIDE_URL + 'pyodide.js';
    s.onload = async () => {
      try {
        const py = await window.loadPyodide({ indexURL: PYODIDE_URL });
        await py.runPythonAsync(`
import builtins, sys, js
def _bq_input(prompt=''):
    r = js.prompt(str(prompt))
    r = '' if r is None else str(r)
    print(str(prompt) + r)
    return r
builtins.input = _bq_input
_bq_steps = [0]
def _bq_trace(frame, event, arg):
    if event == 'line':
        _bq_steps[0] += 1
        if _bq_steps[0] > 3_000_000:
            raise RuntimeError('Infinite loop guard: your code ran 3 million steps. Check your while loop!')
    return _bq_trace
`);
        resolve(py);
      } catch (e) { pyPromise = null; reject(e); }
    };
    s.onerror = () => { pyPromise = null; reject(new Error('Could not download the Python engine. Check your internet and try again.')); };
    document.head.appendChild(s);
  });
  return pyPromise;
}

function friendlyPyError(msg) {
  const lines = String(msg).trim().split('\n');
  const last = lines[lines.length - 1] || msg;
  const lineNo = [...String(msg).matchAll(/File "<exec>", line (\d+)/g)].pop()?.[1];
  const hints = {
    SyntaxError: 'Check for a missing bracket ), quote " or colon : at the end of if/for/while lines.',
    IndentationError: 'Python cares about spaces! Lines inside if/for/while/def need to be indented by 4 spaces.',
    NameError: "You used a name Python doesn't know yet. Check the spelling, or create the variable first.",
    TypeError: 'You mixed types, e.g. text + number. Try str() or int() to convert.',
    ValueError: "A value had the wrong shape, e.g. int('hello'). Check what the user typed.",
    ZeroDivisionError: "You can't divide by zero, not even in Python!",
    IndexError: "You asked for a list position that doesn't exist. Lists start at 0.",
  };
  const type = (last.match(/^(\w+Error)/) || [])[1];
  return `🐞 ${last}${lineNo ? ` (line ${lineNo})` : ''}${hints[type] ? `\n💡 ${hints[type]}` : ''}`;
}

export async function runPython(code, outEl) {
  outEl.innerHTML = '';
  let total = 0;
  const write = (text, cls) => {
    total += text.length;
    if (total > 20000) { if (total - text.length <= 20000) outEl.insertAdjacentHTML('beforeend', '<span class="sys">\n…output trimmed</span>'); return; }
    const span = document.createElement('span');
    if (cls) span.className = cls;
    span.textContent = text;
    outEl.appendChild(span);
    outEl.scrollTop = outEl.scrollHeight;
  };
  write('Booting Python engine… (first run takes a few seconds)\n', 'sys');
  let py;
  try { py = await loadPython(); } catch (e) { outEl.innerHTML = ''; write(e.message, 'err'); return false; }
  outEl.innerHTML = '';
  py.setStdout({ batched: (s) => write(s + '\n') });
  py.setStderr({ batched: (s) => write(s + '\n', 'err') });
  try {
    // fetch any extra modules the code imports (e.g. sqlite3) before running
    await py.loadPackagesFromImports(code, { messageCallback: () => {} });
    py.runPython('_bq_steps[0] = 0\nsys.settrace(_bq_trace)');
    await py.runPythonAsync(code);
    if (!outEl.textContent) write('✓ Ran with no output. Try print("something")!', 'sys');
    return true;
  } catch (e) {
    write(friendlyPyError(e.message), 'err');
    return false;
  } finally {
    try { py.runPython('sys.settrace(None)'); } catch { /* ignore */ }
  }
}

export function pythonWidget(src, { big = false, title = 'Python' } = {}) {
  const w = el(`
    <div class="widget ${big ? 'pg-big' : ''}">
      <div class="widget-bar"><span class="dots"><i></i><i></i><i></i></span><span>🐍 ${esc(title)}</span>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-white" data-reset title="Reset code">↺ Reset</button>
        <button class="btn btn-sm" data-run>▶ Run</button>
      </div>
      <textarea class="code-area" spellcheck="false" aria-label="Python code editor"></textarea>
      <pre class="code-out" aria-live="polite"><span class="sys">Press ▶ Run to see the output</span></pre>
    </div>`);
  const ta = w.querySelector('textarea');
  ta.value = src;
  tabbable(ta);
  const out = w.querySelector('.code-out');
  const run = async () => {
    const b = w.querySelector('[data-run]');
    b.disabled = true; b.textContent = '⏳ Running';
    await runPython(ta.value, out);
    b.disabled = false; b.textContent = '▶ Run';
  };
  w.querySelector('[data-run]').addEventListener('click', run);
  ta.addEventListener('keydown', (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); } });
  w.querySelector('[data-reset]').addEventListener('click', () => { ta.value = src; ta.dispatchEvent(new Event('input')); out.innerHTML = '<span class="sys">Code reset</span>'; });
  w.getCode = () => ta.value;
  w.setCode = (c) => { ta.value = c; ta.dispatchEvent(new Event('input')); };
  return w;
}

// ======================================================================
// Web (HTML/CSS/JS)
// ======================================================================
export function webWidget(src, { big = false } = {}) {
  const w = el(`
    <div class="widget ${big ? 'pg-big' : ''}">
      <div class="widget-bar" style="background:var(--pink)"><span class="dots"><i></i><i></i><i></i></span><span>🌐 HTML · CSS · JS</span>
        <span class="spacer"></span>
        <button class="btn btn-sm btn-white" data-reset>↺ Reset</button>
        <button class="btn btn-sm" data-run>▶ Run</button>
      </div>
      <div class="web-split">
        <textarea class="code-area" spellcheck="false" aria-label="HTML editor"></textarea>
        <iframe sandbox="allow-scripts allow-modals" title="Live preview"></iframe>
      </div>
    </div>`);
  const ta = w.querySelector('textarea');
  const frame = w.querySelector('iframe');
  ta.value = src;
  tabbable(ta);
  const run = () => { frame.srcdoc = ta.value; };
  let t;
  ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 500); });
  w.querySelector('[data-run]').addEventListener('click', run);
  w.querySelector('[data-reset]').addEventListener('click', () => { ta.value = src; run(); });
  w.getCode = () => ta.value;
  w.setCode = (c) => { ta.value = c; run(); };
  setTimeout(run, 50);
  return w;
}

// ======================================================================
// Bot maze  — {"grid":["S..#","#.#.","...G"], "loops":true, "hint":"..."}
//   S = start, G = goal, # = wall, * = gem (optional, must collect all)
// ======================================================================
const DIRS = { up: [-1, 0, '⬆️'], down: [1, 0, '⬇️'], left: [0, -1, '⬅️'], right: [0, 1, '➡️'] };

export function botMaze(src) {
  const cfg = parseJSON(src, { grid: ['S..', '.#.', '..G'] });
  const grid = cfg.grid.map((r) => r.split(''));
  const rows = grid.length, cols = Math.max(...grid.map((r) => r.length));
  let start = [0, 0];
  const gems = new Set();
  grid.forEach((r, y) => r.forEach((c, x) => { if (c === 'S') start = [y, x]; if (c === '*') gems.add(`${y},${x}`); }));
  const loops = !!cfg.loops;
  const w = el(`
    <div class="widget">
      <div class="widget-bar" style="background:var(--sun)"><span>🤖 Bot Maze${cfg.title ? ' · ' + esc(cfg.title) : ''}</span><span class="spacer"></span><span class="chip">Get the bot to the ⭐${gems.size ? ' and grab every 💎' : ''}</span></div>
      <div class="maze-wrap">
        <div class="maze" style="grid-template-columns:repeat(${cols}, auto)"></div>
        <div>
          <div class="cmd-pad">${Object.entries(DIRS).map(([k, d]) => `<button data-cmd="${k}" aria-label="${k}">${d[2]}</button>`).join('')}</div>
          <div class="program" aria-label="Your program"></div>
          <div class="row">
            <button class="btn" data-go>▶ Run program</button>
            <button class="btn btn-white btn-sm" data-clear>🗑 Clear</button>
            <span class="chip" data-count>0 blocks</span>
          </div>
          <p class="maze-msg" aria-live="polite">${esc(cfg.hint || (loops ? 'Tip: use the + button to repeat a move instead of adding the same arrow again.' : 'Plan the path, then press Run!'))}</p>
        </div>
      </div>
    </div>`);
  const mazeEl = w.querySelector('.maze');
  const progEl = w.querySelector('.program');
  const msg = w.querySelector('.maze-msg');
  let program = [];
  let busy = false;

  const draw = (pos, trail = new Set(), got = new Set(), bump = false) => {
    mazeEl.innerHTML = '';
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const c = grid[y][x] || '#';
      const d = document.createElement('div');
      d.className = 'cell' + (c === '#' ? ' wall' : '') + (trail.has(`${y},${x}`) ? ' trail' : '');
      if (pos[0] === y && pos[1] === x) d.innerHTML = `<span class="bot ${bump ? 'bump' : ''}">🤖</span>`;
      else if (c === 'G') d.textContent = '⭐';
      else if (c === '*' && !got.has(`${y},${x}`)) d.textContent = '💎';
      else if (c === '#') d.textContent = '🧱';
      mazeEl.appendChild(d);
    }
  };
  const blocksUsed = () => program.length;
  const drawProgram = (active = -1) => {
    progEl.innerHTML = '';
    program.forEach((p, i) => {
      const chip = document.createElement('span');
      chip.className = 'prog-chip' + (i === active ? ' running' : '');
      chip.innerHTML = `${DIRS[p.cmd][2]}${loops ? ` <b>×${p.n}</b> <button data-m="${i}" aria-label="fewer">−</button><button data-p="${i}" aria-label="more">+</button>` : ''} <button class="x" data-x="${i}" aria-label="remove">✕</button>`;
      progEl.appendChild(chip);
    });
    w.querySelector('[data-count]').textContent = `${blocksUsed()} block${blocksUsed() === 1 ? '' : 's'}`;
  };
  progEl.addEventListener('click', (e) => {
    if (busy) return;
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.x !== undefined) program.splice(+t.dataset.x, 1);
    if (t.dataset.p !== undefined) program[+t.dataset.p].n = Math.min(9, program[+t.dataset.p].n + 1);
    if (t.dataset.m !== undefined) program[+t.dataset.m].n = Math.max(1, program[+t.dataset.m].n - 1);
    drawProgram();
  });
  w.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => {
    if (busy || program.length >= 30) return;
    program.push({ cmd: b.dataset.cmd, n: 1 });
    drawProgram();
  }));
  w.querySelector('[data-clear]').addEventListener('click', () => { if (busy) return; program = []; drawProgram(); draw(start); msg.textContent = 'Fresh start! Build a new program.'; });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  w.querySelector('[data-go]').addEventListener('click', async () => {
    if (busy || !program.length) { if (!program.length) msg.textContent = 'Add some arrows first! ⬆️⬇️⬅️➡️'; return; }
    busy = true;
    let pos = [...start];
    const trail = new Set([pos.join(',')]);
    const got = new Set();
    msg.textContent = 'Running… 🤖';
    let ok = true;
    outer: for (let i = 0; i < program.length; i++) {
      for (let k = 0; k < program[i].n; k++) {
        drawProgram(i);
        const [dy, dx] = DIRS[program[i].cmd];
        const ny = pos[0] + dy, nx = pos[1] + dx;
        const cell = grid[ny]?.[nx];
        if (!cell || cell === '#') {
          draw(pos, trail, got, true);
          msg.textContent = '💥 Bonk! The bot hit a wall. Find the bug in your program and try again.';
          ok = false;
          break outer;
        }
        pos = [ny, nx];
        trail.add(pos.join(','));
        if (cell === '*') got.add(pos.join(','));
        draw(pos, trail, got);
        await sleep(330);
      }
    }
    drawProgram();
    if (ok) {
      const atGoal = grid[pos[0]][pos[1]] === 'G';
      if (atGoal && got.size === gems.size) {
        const best = cfg.best ? (blocksUsed() <= cfg.best ? ' Perfect: you used the fewest blocks possible! 🏅' : ` Can you do it in ${cfg.best} blocks?`) : '';
        msg.textContent = `🎉 You did it!${best}`;
        confetti(1400);
      } else if (atGoal) msg.textContent = '⭐ Reached the star, but you missed some 💎 gems!';
      else msg.textContent = '🤔 The bot stopped before the ⭐. Add more moves!';
    }
    busy = false;
  });
  draw(start);
  drawProgram();
  return w;
}

// ======================================================================
// Binary switches — {"bits":8, "target":45}
// ======================================================================
export function binaryWidget(src) {
  const cfg = parseJSON(src, {});
  const n = Math.min(16, Math.max(1, cfg.bits || 8));
  let target = cfg.target ?? null;
  const state = Array(n).fill(0);
  const w = el(`
    <div class="widget">
      <div class="widget-bar" style="background:var(--lime)"><span>💡 Binary Switches</span><span class="spacer"></span>
        ${target !== null ? `<span class="chip chip-sun" data-target>Challenge: make ${target}</span>` : ''}
        <button class="btn btn-sm btn-white" data-new>🎲 New challenge</button></div>
      <div class="bits"></div>
      <div class="bit-readout">
        <span class="chip chip-ink" data-bin></span><span class="chip chip-lime" data-den></span><span class="chip chip-violet" data-hex></span>
      </div>
      <p class="maze-msg center" style="padding:0 18px 14px" aria-live="polite"></p>
    </div>`);
  const bitsEl = w.querySelector('.bits');
  const msg = w.querySelector('.maze-msg');
  const draw = () => {
    bitsEl.innerHTML = state.map((b, i) => `<div class="bit"><small>${2 ** (n - 1 - i)}</small><button class="${b ? 'on' : ''}" data-i="${i}" aria-pressed="${!!b}">${b}</button></div>`).join('');
    const val = state.reduce((s, b, i) => s + b * 2 ** (n - 1 - i), 0);
    w.querySelector('[data-bin]').textContent = 'Binary ' + state.join('');
    w.querySelector('[data-den]').textContent = 'Denary ' + val;
    w.querySelector('[data-hex]').textContent = 'Hex ' + val.toString(16).toUpperCase().padStart(Math.ceil(n / 4), '0');
    if (target !== null) msg.textContent = val === target ? `🎉 Yes! ${target} in binary is ${state.join('')}` : val > target ? '⬇️ Too big. Switch something off.' : '';
  };
  bitsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    state[+b.dataset.i] ^= 1;
    draw();
    const val = state.reduce((s, x, i) => s + x * 2 ** (n - 1 - i), 0);
    if (target !== null && val === target) confetti(1000);
  });
  w.querySelector('[data-new]').addEventListener('click', () => {
    target = 1 + Math.floor(Math.random() * (2 ** n - 1));
    state.fill(0);
    let chip = w.querySelector('[data-target]');
    if (!chip) { chip = el('<span class="chip chip-sun" data-target></span>'); w.querySelector('[data-new]').before(chip); }
    chip.textContent = `Challenge: make ${target}`;
    draw();
  });
  draw();
  return w;
}

// ======================================================================
// Logic gates — {"gates":["AND","OR","NOT","XOR","NAND","NOR"]}
// ======================================================================
const GATES = {
  AND: (a, b) => a & b, OR: (a, b) => a | b, NOT: (a) => a ^ 1, XOR: (a, b) => a ^ b,
  NAND: (a, b) => (a & b) ^ 1, NOR: (a, b) => (a | b) ^ 1,
};
export function logicWidget(src) {
  const cfg = parseJSON(src, {});
  const gates = (cfg.gates || Object.keys(GATES)).filter((g) => GATES[g]);
  let gate = gates[0];
  let A = 0, B = 0;
  const w = el(`
    <div class="widget">
      <div class="widget-bar" style="background:var(--violet)"><span>🔌 Logic Gate Lab</span><span class="spacer"></span>
        <select class="input" style="width:auto;padding:6px 10px" aria-label="Gate">${gates.map((g) => `<option>${g}</option>`).join('')}</select></div>
      <div class="logic-wrap">
        <div class="logic-row">
          <div class="row" style="flex-direction:column;gap:8px"><button class="switch" data-a>A = 0</button><button class="switch" data-b>B = 0</button></div>
          <span style="font-size:1.6rem">➜</span><div class="gate-box" data-g></div><span style="font-size:1.6rem">➜</span>
          <div class="lamp" data-out>0</div>
        </div>
        <table class="truth"></table>
      </div>
    </div>`);
  const draw = () => {
    const one = gate === 'NOT';
    w.querySelector('[data-b]').classList.toggle('hide', one);
    w.querySelector('[data-a]').textContent = `A = ${A}`; w.querySelector('[data-a]').classList.toggle('on', !!A);
    w.querySelector('[data-b]').textContent = `B = ${B}`; w.querySelector('[data-b]').classList.toggle('on', !!B);
    w.querySelector('[data-g]').textContent = gate;
    const out = GATES[gate](A, B);
    const lamp = w.querySelector('[data-out]'); lamp.textContent = out; lamp.classList.toggle('on', !!out);
    const rows = one ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
    w.querySelector('.truth').innerHTML = `<tr><th>A</th>${one ? '' : '<th>B</th>'}<th>X</th></tr>` +
      rows.map((r) => `<tr class="${r[0] === A && (one || r[1] === B) ? 'now' : ''}"><td>${r[0]}</td>${one ? '' : `<td>${r[1]}</td>`}<td>${GATES[gate](r[0], r[1] ?? 0)}</td></tr>`).join('');
  };
  w.querySelector('[data-a]').addEventListener('click', () => { A ^= 1; draw(); });
  w.querySelector('[data-b]').addEventListener('click', () => { B ^= 1; draw(); });
  w.querySelector('select').addEventListener('change', (e) => { gate = e.target.value; draw(); });
  draw();
  return w;
}

// ======================================================================
// Pseudocode (Cambridge style)
// ======================================================================
const PSEUDO_KW = ['DECLARE', 'CONSTANT', 'INPUT', 'OUTPUT', 'IF', 'THEN', 'ELSE', 'ENDIF', 'CASE', 'OF', 'OTHERWISE', 'ENDCASE',
  'FOR', 'TO', 'STEP', 'NEXT', 'WHILE', 'DO', 'ENDWHILE', 'REPEAT', 'UNTIL', 'PROCEDURE', 'ENDPROCEDURE', 'FUNCTION',
  'ENDFUNCTION', 'RETURNS', 'RETURN', 'CALL', 'AND', 'OR', 'NOT', 'INTEGER', 'REAL', 'STRING', 'CHAR', 'BOOLEAN', 'ARRAY',
  'TRUE', 'FALSE', 'DIV', 'MOD', 'OPENFILE', 'READFILE', 'WRITEFILE', 'CLOSEFILE', 'READ', 'WRITE', 'LENGTH', 'SUBSTRING',
  'UCASE', 'LCASE', 'ROUND', 'RANDOM'];
export function pseudoWidget(src) {
  const kw = new RegExp(`\\b(${PSEUDO_KW.join('|')})\\b`, 'g');
  const html = src.split('\n').map((line) => {
    const ci = line.indexOf('//');
    const code = ci > -1 ? line.slice(0, ci) : line;
    const comment = ci > -1 ? line.slice(ci) : '';
    const parts = code.split(/("[^"]*")/g).map((p, i) =>
      i % 2 ? `<span class="str">${esc(p)}</span>` : esc(p).replace(kw, '<span class="kw">$1</span>').replace(/(?<![\w#&])(\d+(\.\d+)?)(?![\w;])/g, '<span class="num">$1</span>').replace(/←|&lt;-/g, '←')
    ).join('');
    return parts + (comment ? `<span class="cm">${esc(comment)}</span>` : '');
  }).join('\n');
  return el(`<div class="pseudo"><div class="widget-bar"><span>📜 Cambridge pseudocode</span></div><pre>${html}</pre></div>`);
}

// ======================================================================
// Reveal box — first line is the button label, the rest is Markdown
// ======================================================================
export function revealWidget(src) {
  const [label, ...rest] = src.split('\n');
  const w = el(`<div class="reveal"><button aria-expanded="false">👀 ${esc(label || 'Show answer')}</button><div class="reveal-body"></div></div>`);
  w.querySelector('.reveal-body').innerHTML = renderMarkdown(rest.join('\n'));
  w.querySelector('button').addEventListener('click', (e) => {
    const open = w.classList.toggle('open');
    e.currentTarget.setAttribute('aria-expanded', open);
  });
  return w;
}

// ======================================================================
// Quiz
//   Q: Question text
//   - wrong option
//   * correct option
//   > explanation shown after answering (optional)
// ======================================================================
export function parseQuiz(text) {
  const qs = [];
  let cur = null;
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (/^Q[:.]/i.test(line)) { cur = { q: line.replace(/^Q[:.]\s*/i, ''), opts: [], answer: -1, why: '' }; qs.push(cur); }
    else if (cur && /^[-*]\s+/.test(line)) { if (line[0] === '*') cur.answer = cur.opts.length; cur.opts.push(line.replace(/^[-*]\s+/, '')); }
    else if (cur && line.startsWith('>')) cur.why += (cur.why ? ' ' : '') + line.replace(/^>\s*/, '');
    else if (cur && !cur.opts.length) cur.q += ' ' + line;
  }
  return qs.filter((q) => q.opts.length >= 2 && q.answer > -1);
}

export function quizWidget(text, { onFinish } = {}) {
  const qs = parseQuiz(text);
  if (!qs.length) return null;
  const w = el(`<section class="quiz" aria-label="Quiz"></section>`);
  let i = 0, score = 0;
  const marks = [];
  const inline = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');
  const dots = () => `<div class="quiz-dots">${qs.map((_, k) => `<i class="${marks[k] === true ? 'r' : marks[k] === false ? 'w' : k === i ? 'c' : ''}"></i>`).join('')}</div>`;
  const show = () => {
    const q = qs[i];
    w.innerHTML = `
      <div class="quiz-head"><span class="sticker" style="background:#fff">🧠 Boss Check · ${i + 1}/${qs.length}</span>${dots()}</div>
      <div class="quiz-q">${inline(q.q)}</div>
      <div class="quiz-opts">${q.opts.map((o, k) => `<button class="quiz-opt" data-k="${k}"><span class="key">${'ABCDEF'[k]}</span><span>${inline(o)}</span></button>`).join('')}</div>
      <div data-after></div>`;
    w.querySelectorAll('.quiz-opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.k)));
  };
  const answer = (k) => {
    const q = qs[i];
    const right = k === q.answer;
    if (right) score++;
    marks[i] = right;
    w.querySelectorAll('.quiz-opt').forEach((b, idx) => {
      b.disabled = true;
      if (idx === q.answer) b.classList.add('right');
      else if (idx === k) b.classList.add('wrong');
    });
    w.querySelector('.quiz-dots').outerHTML = dots();
    w.querySelector('[data-after]').innerHTML = `
      <div class="quiz-explain">${right ? '✅ Correct!' : '❌ Not quite.'} ${inline(q.why)}</div>
      <div class="row" style="margin-top:14px"><span class="spacer"></span><button class="btn btn-lg btn-white" data-next>${i < qs.length - 1 ? 'Next ➜' : 'See my score 🏁'}</button></div>`;
    w.querySelector('[data-next]').addEventListener('click', () => { i++; i < qs.length ? show() : finish(); });
    w.querySelector('[data-next]').focus();
  };
  const finish = () => {
    const pct = Math.round((score / qs.length) * 100);
    const msg = pct === 100 ? 'FLAWLESS! +10 bonus XP 🏆' : pct >= 70 ? 'Great job! 🔥' : pct >= 40 ? 'Nice try! Review and go again 💪' : 'Every coder starts somewhere. Retry! 🌱';
    w.innerHTML = `
      <div class="center">
        <div style="font-size:3rem">${pct === 100 ? '🏆' : pct >= 70 ? '🎯' : '💡'}</div>
        <h2 style="margin:4px 0">${score} / ${qs.length} correct</h2>
        <p style="font-weight:800">${msg}</p>
        <div class="row" style="justify-content:center"><button class="btn btn-white" data-retry>↺ Retry quiz</button><span data-claim></span></div>
      </div>`;
    w.querySelector('[data-retry]').addEventListener('click', () => { i = 0; score = 0; marks.length = 0; show(); });
    onFinish && onFinish(pct, w.querySelector('[data-claim]'));
  };
  show();
  return w;
}

export function videoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return el(`<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${yt[1]}" title="Lesson video" allow="accelerometer; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`);
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return el(`<div class="video-embed"><iframe src="https://drive.google.com/file/d/${drive[1]}/preview" title="Lesson video" allow="autoplay" allowfullscreen loading="lazy"></iframe></div>`);
  return el(`<p><a class="btn btn-sky" href="${esc(url)}" target="_blank" rel="noopener">🎬 Watch the lesson video</a></p>`);
}
