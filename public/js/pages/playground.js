import { boot, $, $$, prefs, esc } from '../core.js';
import { pythonWidget, webWidget, binaryWidget, logicWidget } from '../widgets.js';

await boot({ active: 'playground' });

const PY_START = `# Welcome to the Python playground! 🐍
# Press ▶ Run (or Ctrl + Enter)

name = input("What's your name? ")
print("Hi", name, "👋")

for i in range(3, 0, -1):
    print(i, "...")
print("Blast off! 🚀")
`;
const WEB_START = `<!doctype html>
<html>
<head>
<style>
  body { font-family: sans-serif; background: #fff6e6; display: grid; place-items: center; height: 90vh; }
  button { font-size: 24px; padding: 14px 24px; border: 3px solid #17131f; border-radius: 14px; background: #c8f542; cursor: pointer; }
</style>
</head>
<body>
  <div style="text-align:center">
    <h1 id="title">Click the button!</h1>
    <button onclick="clicked()">Press me</button>
  </div>
  <script>
    let count = 0;
    function clicked() {
      count = count + 1;
      document.getElementById('title').textContent = 'Clicked ' + count + ' times 🎉';
    }
  </script>
</body>
</html>`;

const py = pythonWidget(prefs.get('bq_pg_py', PY_START), { big: true, title: 'Python · main.py' });
const web = webWidget(prefs.get('bq_pg_web', WEB_START), { big: true });
$('#pgPython').appendChild(py);
$('#pgWeb').appendChild(web);
$('#pgBits').append(binaryWidget('{"bits":8}'), logicWidget('{}'));

// autosave to this device
setInterval(() => { prefs.set('bq_pg_py', py.getCode()); prefs.set('bq_pg_web', web.getCode()); }, 3000);

$$('.pg-tabs button').forEach((b) => b.addEventListener('click', () => {
  $$('.pg-tabs button').forEach((x) => x.classList.toggle('on', x === b));
  $('#pgPython').classList.toggle('hide', b.dataset.tab !== 'python');
  $('#pgWeb').classList.toggle('hide', b.dataset.tab !== 'web');
  $('#pgBits').classList.toggle('hide', b.dataset.tab !== 'bits');
}));

const CHALLENGES = [
  { e: '🎲', t: 'Dice roller', d: 'Use import random and random.randint(1, 6) to roll two dice and print the total.', code: 'import random\n\n# roll two dice and print the total\n' },
  { e: '🌡️', t: 'Temperature converter', d: 'Ask for a temperature in °C and print it in °F. Formula: F = C × 9 / 5 + 32.', code: 'c = float(input("Temperature in C: "))\n# your code here\n' },
  { e: '🔢', t: 'Times table', d: 'Ask for a number and print its times table from 1 to 12 with a for loop.', code: 'n = int(input("Which times table? "))\n' },
  { e: '🔐', t: 'Password checker', d: 'Keep asking for a password until the user types "open sesame". Count the attempts.', code: 'attempts = 0\n' },
  { e: '📊', t: 'Average of scores', d: 'Store 5 test scores in a list, then print the highest, lowest and average.', code: 'scores = [72, 85, 90, 64, 78]\n' },
  { e: '🐢', t: 'FizzBuzz', d: 'Print 1 to 30, but "Fizz" for multiples of 3, "Buzz" for 5, and "FizzBuzz" for both.', code: 'for i in range(1, 31):\n    pass\n' },
];
$('#challenges').innerHTML = CHALLENGES.map((c, i) => `
  <div class="card card-hover">
    <div style="font-size:2rem">${c.e}</div>
    <h3>${esc(c.t)}</h3>
    <p class="muted small">${esc(c.d)}</p>
    <button class="btn btn-sm" data-ch="${i}">Load in editor</button>
  </div>`).join('');
$('#challenges').addEventListener('click', (e) => {
  const b = e.target.closest('[data-ch]');
  if (!b) return;
  const c = CHALLENGES[+b.dataset.ch];
  py.setCode(`# ${c.e} Challenge: ${c.t}\n# ${c.d}\n\n${c.code}`);
  $$('.pg-tabs button')[0].click();
  py.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
