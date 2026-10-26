// Round and turn lifecycle: piece-count question, turn intro, starting a turn, timer and HUD.
import { LEVELS, lvlName } from '../config.js';
import { nextTarget } from './features.js';
import { buildMap } from './map.js';
import { updatePts } from './scoring.js';
import { refillTray } from './tray.js';
import { CFG, PACKS } from '../packs.js';
import { showTutorial } from '../screens/tutorial.js';
import { rec, state } from '../state.js';
import { clearFx, say } from '../ui/effects.js';
import { backRow, show } from '../ui/nav.js';
import { $, esc, fmtTime, shuffle } from '../util.js';
import { hush, speak } from '../voice.js';

function pickRegions(pack, k) {
  return shuffle(PACKS[pack].items.map((r) => r.name)).slice(0, k);
}

export function askPieces(cfg) {
  const p = PACKS[cfg.pack],
    tot = p.items.length,
    opts = [5, 10, 15].filter((k) => k < tot).concat([tot]);
  $('#turnBox').innerHTML =
    `${backRow('pieces')}<svg class="gaju-bob" viewBox="0 0 130 120" style="width:clamp(110px,16vw,170px)" aria-label="Gaju"><use href="#gaju"/></svg>
    <div class="rep-sec">${p.emoji} ${esc(p.title)}${cfg.pack === 'states' ? ' · ' + lvlName(cfg.level) : ''}</div>
    <h2>How many puzzle pieces do you want?</h2><p>Every child gets the same pieces.</p>
    <div class="num-grid pieces-q">${opts.map((k) => `<button class="num-btn" data-k="${k}">${k === tot ? 'All' : k}</button>`).join('')}</div>`;
  show('turn');
  speak('How many puzzle pieces do you want?');
  $('#turnBox')
    .querySelectorAll('[data-k]')
    .forEach(
      (b) =>
        (b.onclick = () => {
          hush();
          cfg.regions = pickRegions(cfg.pack, +b.dataset.k);
          startRound(cfg);
        }),
    );
}

export function startRound(cfg) {
  state.P = PACKS[cfg.pack];
  state.S = Object.assign({ turn: 0, results: [] }, cfg);
  turnIntro();
  showTutorial(() => {});
}

export function modeLabel() {
  return state.S.mode === 'learning' ? '🌱 Learning' : '🏆 Competition';
}

export function roundLabel() {
  return state.P.id === 'states' ? LEVELS[state.S.level].title : state.P.short;
}

export function turnIntro() {
  const name = state.S.players[state.S.turn],
    p = rec(name);
  $('#turnBox').innerHTML =
    `${backRow('turn')}<div class="avbig">${p.avatar}</div><h2>${esc(name)}, it is your turn!</h2>
   <p>${state.P.emoji} ${esc(state.P.title)}${state.P.id === 'states' ? ' · ' + lvlName(state.S.level) : ''}</p>
   <p>${modeLabel()}${state.S.timer ? ' · ⏱ Timer on' : ''} · ${state.S.regions.length} pieces</p>
   ${state.S.players.length > 1 ? `<p>Turn ${state.S.turn + 1} of ${state.S.players.length}</p>` : ''}
   <button class="btn pink" id="goTurn">Start ▶</button>`;
  show('turn');
  $('#goTurn').onclick = startTurn;
}

export const isFeat = () => state.P.kind === 'feature';

export const tapMode = () => isFeat() && state.S.mode === 'competition';

function startTurn() {
  const name = state.S.players[state.S.turn];
  state.T = {
    name,
    queue: shuffle([...state.S.regions]),
    placed: new Set(),
    tries: {},
    correct: 0,
    incorrect: 0,
    errors: {},
    start: Date.now(),
    target: null,
    streak: 0,
    best: 0,
    badge: null,
  };
  clearFx();
  const p = rec(name);
  $('#hudAv').textContent = p.avatar;
  $('#hudName').textContent = name;
  $('#hudLevel').textContent = `${roundLabel()} · ${state.S.mode === 'learning' ? '🌱' : '🏆'}`;
  $('#hudTimer').hidden = !state.S.timer;
  $('#pieces').innerHTML = '';
  $('#pieces').classList.toggle('cards', isFeat());
  $('#mapWrap').classList.toggle('tapmode', tapMode());
  show('game');
  buildMap();
  if (tapMode()) {
    $('#trayTitle').textContent = 'Find this on the map';
    nextTarget();
  } else {
    $('#trayTitle').textContent = isFeat()
      ? 'Drag a name card to the map'
      : 'Drag a piece to the map';
    refillTray();
    say(
      isFeat()
        ? 'Drag a name card to its place on the map!'
        : CFG().lines
          ? 'Drag a piece to its dotted place on the map!'
          : 'Drag a piece to its place on the map!',
    );
  }
  updateHud();
  updatePts();
  if (state.S.timer) startTimer();
}

let timerId = null;

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    $('#hudTimer').textContent = '⏱ ' + fmtTime((Date.now() - state.T.start) / 1000);
  }, 250);
}

export function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

export function updateHud() {
  const n = state.S.regions.length,
    d = state.T.placed.size;
  $('#hudBar').style.width = (d / n) * 100 + '%';
  $('#hudCount').textContent = `${d} / ${n} ${isFeat() ? 'found' : 'placed'}`;
}
