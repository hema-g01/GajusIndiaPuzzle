// Setup wizard: how many children, names, level, mode.
import { AVATARS, LEVELS } from '../config.js';
import { askPieces } from '../game/round.js';
import { PACKS } from '../packs.js';
import { rec, save, state } from '../state.js';
import { goHome, show } from '../ui/nav.js';
import { $, esc } from '../util.js';

export const setup = { n: 1, names: [], level: 1, mode: 'learning', timer: true, pack: 'states' };

export function openSetup(pack) {
  setup.pack = pack;
  state.P = PACKS[pack];
  $('#questTag').textContent = state.P.emoji + ' ' + state.P.title;
  showStep('Count');
  show('setup');
}

let curStep = 'Count';

export function showStep(st) {
  curStep = st;
  ['Count', 'Names', 'Level', 'Mode'].forEach((k) => ($('#step' + k).hidden = k !== st));
  if (st === 'Level') buildLevelStep();
  if (st === 'Mode') buildModeStep();
  window.scrollTo(0, 0);
}

function setCount(i) {
  setup.n = i;
  buildNames();
  showStep('Names');
}

function countFromBox() {
  const v = Number($('#kidCount').value);
  const ok = Number.isInteger(v) && v >= 1 && v <= 10;
  $('#kidCountErr').hidden = ok;
  if (ok) setCount(v);
}

function buildNames() {
  const list = $('#nameList');
  list.innerHTML = '';
  for (let i = 0; i < setup.n; i++) {
    const row = document.createElement('div');
    row.className = 'name-row';
    row.innerHTML = `<span class="av">${AVATARS[i % AVATARS.length]}</span><input id="pname${i}" maxlength="16" placeholder="Child ${i + 1}" autocomplete="off" value="${esc(setup.names[i] || '')}">`;
    list.appendChild(row);
    row.querySelector('input').addEventListener('input', updateAvatars);
  }
  const saved = state.store.order;
  $('#savedWrap').hidden = !saved.length;
  $('#saved').innerHTML = saved
    .map(
      (n) =>
        `<button class="chip" data-n="${esc(n)}">${esc(state.store.players[n].avatar)} ${esc(n)}</button>`,
    )
    .join('');
  $('#saved')
    .querySelectorAll('.chip')
    .forEach(
      (c) =>
        (c.onclick = () => {
          const inputs = [...document.querySelectorAll('#nameList input')];
          if (inputs.some((x) => x.value.trim() === c.dataset.n)) return;
          const empty = inputs.find((x) => !x.value.trim());
          if (empty) {
            empty.value = c.dataset.n;
            updateAvatars();
          }
        }),
    );
  updateAvatars();
}

function updateAvatars() {
  document.querySelectorAll('#nameList .name-row').forEach((row, i) => {
    const v = row.querySelector('input').value.trim();
    row.querySelector('.av').textContent =
      v && state.store.players[v]
        ? state.store.players[v].avatar
        : AVATARS[(state.store.order.length + i) % AVATARS.length];
  });
}

function buildLevelStep() {
  state.P = PACKS[setup.pack];
  $('#levelGrid').innerHTML = Object.entries(LEVELS)
    .map(
      ([
        k,
        L,
      ]) => `<button class="lvl-card" data-level="${k}" aria-pressed="${+k === setup.level}" style="--c:${L.color}">
    <span class="lvl-num">${L.title}</span><span class="lvl-ele"><svg viewBox="0 0 130 120" style="width:${Math.round(L.size * 100)}%"><use href="#gaju"/></svg></span>
    <b>${L.name}</b><small>${L.desc}</small></button>`,
    )
    .join('');
  $('#levelGrid')
    .querySelectorAll('.lvl-card')
    .forEach(
      (b) =>
        (b.onclick = () => {
          setup.level = +b.dataset.level;
          $('#levelGrid')
            .querySelectorAll('.lvl-card')
            .forEach((x) => x.setAttribute('aria-pressed', x === b));
          setTimeout(() => showStep('Mode'), 250);
        }),
    );
}

function buildModeStep() {
  state.P = PACKS[setup.pack];
  const feat = state.P.kind === 'feature';
  $('#learnDesc').textContent = feat
    ? 'No timer. Drag the name cards to the map. Gaju helps after a mistake.'
    : 'No timer. Gaju helps after a mistake. Try again with no penalty.';
  $('#compDesc').textContent = feat
    ? 'Gaju says a name. Tap the place on the map. No hints.'
    : 'No hints. Get points fast for more stars.';
  $('#modeGrid')
    .querySelectorAll('.mode-card')
    .forEach((x) => x.setAttribute('aria-pressed', x.dataset.mode === setup.mode));
  $('#timerWrap').hidden = setup.mode !== 'competition';
}

/** Wire every control of the setup wizard. */
export function initSetup() {
  $('#setupBack').onclick = () => {
    if (curStep === 'Count') goHome();
    else if (curStep === 'Names') showStep('Count');
    else if (curStep === 'Level') showStep('Names');
    else showStep(setup.pack === 'states' ? 'Level' : 'Names');
  };
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement('button');
    b.className = 'num-btn';
    b.textContent = i;
    b.onclick = () => setCount(i);
    $('#numGrid').appendChild(b);
  }
  $('#kidCountGo').onclick = countFromBox;
  $('#kidCount').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') countFromBox();
  });
  $('#namesNext').onclick = () => {
    const seen = new Set();
    setup.names = [...document.querySelectorAll('#nameList input')].map((x, i) => {
      let v = x.value.trim().replace(/\s+/g, ' ') || `Child ${i + 1}`;
      let base = v,
        k = 2;
      while (seen.has(v)) v = `${base} ${k++}`;
      seen.add(v);
      return v;
    });
    showStep(setup.pack === 'states' ? 'Level' : 'Mode');
  };
  $('#modeGrid')
    .querySelectorAll('.mode-card')
    .forEach(
      (b) =>
        (b.onclick = () => {
          setup.mode = b.dataset.mode;
          buildModeStep();
        }),
    );
  $('#timerToggle').onclick = function () {
    setup.timer = !setup.timer;
    this.setAttribute('aria-pressed', setup.timer);
    this.lastChild.textContent = setup.timer ? 'Timer on' : 'Timer off';
  };
  $('#startRound').onclick = () => {
    setup.names.forEach(rec);
    save();
    askPieces({
      pack: setup.pack,
      players: [...setup.names],
      level: setup.pack === 'states' ? setup.level : 0,
      mode: setup.mode,
      timer: setup.mode === 'competition' && setup.timer,
    });
  };
}
