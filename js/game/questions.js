// Quiz questions after a piece lands, and the answer board.
import { Q, TYPE_COLOR, kdList, kdSpeech } from '../config.js';
import { nextTarget } from './features.js';
import { isFeat, tapMode } from './round.js';
import { gain, miss } from './scoring.js';
import { refillTray } from './tray.js';
import { CFG, ekey } from '../packs.js';
import { endTurn } from '../screens/results.js';
import { state } from '../state.js';
import { closeModal, openModal } from '../ui/modal.js';
import { $, esc, shuffle } from '../util.js';
import { hush, speak } from '../voice.js';

export function afterPlace(n) {
  const all = CFG().qs || [],
    qs = [...all];
  const next = () => {
    if (qs.length) {
      ask(n, qs.shift(), all.length - qs.length, all.length, next);
      return;
    }
    answerBoard(n, proceed);
  };
  setTimeout(next, 700);
}

function proceed() {
  closeModal();
  if (state.T.placed.size === state.S.regions.length) {
    state.T.target = null;
    $('#pieces').innerHTML = '';
    $('#trayLeft').textContent = '';
    setTimeout(endTurn, 700);
    return;
  }
  if (tapMode()) nextTarget();
  else refillTray();
}

function options(n, field) {
  const right = state.P.R[n][field];
  const pool = shuffle([...new Set(state.P.items.map((r) => r[field]).filter((v) => v !== right))]);
  return shuffle([right, ...pool.slice(0, state.S.level === 4 ? 3 : 2)]);
}

function ask(n, field, idx, total, done) {
  const r = state.P.R[n],
    opts = options(n, field),
    right = r[field];
  openModal(`<div class="q-head"><span class="em">${r.emoji}</span><div><h3>${esc(n)}</h3><div class="step">Question ${idx} of ${total} · ${Q[field].label}</div></div></div>
    <h2 class="q-text">${esc(Q[field].ask(n))}</h2>
    <div class="opts">${opts.map((o, i) => `<button class="opt" data-v="${esc(o)}"><span class="k">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}</div>`);
  speak(Q[field].ask(n));
  let locked = false;
  $('#modalBox')
    .querySelectorAll('.opt')
    .forEach(
      (b) =>
        (b.onclick = () => {
          if (locked || b.disabled) return;
          if (b.dataset.v === right) {
            locked = true;
            b.classList.add('right');
            gain();
            setTimeout(done, 1000);
            return;
          }
          state.T.incorrect++;
          miss();
          const ek = ekey(state.P.id, n);
          state.T.errors[ek] = (state.T.errors[ek] || 0) + 1;
          const rb = [...$('#modalBox').querySelectorAll('.opt')].find(
            (x) => x.dataset.v === right,
          );
          if (state.S.mode === 'learning') {
            b.classList.add('wrong');
            b.disabled = true;
            rb.classList.add('hint');
          } else {
            locked = true;
            b.classList.add('wrong');
            rb.classList.add('right');
            setTimeout(done, 1300);
          }
        }),
    );
}

function answerBoard(n, done) {
  const r = state.P.R[n];
  let inner, line;
  if (state.P.id === 'kdist') {
    inner = `<dl class="kd-list">${kdList(r)
      .map(([l, v]) => `<div><dt>${l}</dt><dd>${esc(v)}</dd></div>`)
      .join('')}</dl>`;
    line = `${n}. ${kdSpeech(r)}`;
  } else if (state.P.id === 'wcont') {
    inner = `<p class="ffact">${esc(r.fact)}</p>`;
    line = `${n}. ${r.fact}`;
  } else if (state.P.id === 'wcountry') {
    inner = `<dl class="kd-list"><div><dt>🏛 Capital</dt><dd>${esc(r.capital)}</dd></div><div><dt>🌍 Continent</dt><dd>${esc(r.continent)}</dd></div></dl><p class="ffact">${esc(r.fact)}</p>`;
    line = `${n}. Capital: ${r.capital}. Continent: ${r.continent}. ${r.fact}`;
  } else if (state.P.kind === 'shape') {
    inner = `<div class="cap"><small>${state.P.labelIcon} ${state.P.label}</small><b>${esc(r.capital)}</b></div>`;
    line = `${n}. ${state.P.label}: ${r.capital}.`;
  } else {
    inner = `<p class="ffact">${esc(r.fact)}</p>`;
    line = `${n}. ${r.fact}`;
  }
  openModal(`<div class="board-card"><div class="big">${r.emoji}</div><h2>${esc(n)}</h2><span class="type" style="background:${TYPE_COLOR[r.type] || '#7c6cf2'}">${esc(r.type)}</span>${inner}</div>
    <div class="modal-actions" style="justify-content:center"><button class="btn white small" id="sayAgain">🔊 Hear again</button><button class="btn green" id="factNext">Next ▶</button></div>`);
  setTimeout(() => speak(line), (CFG().qs || []).length ? 200 : 700);
  $('#sayAgain').onclick = () => speak(line);
  let gone = false;
  const auto =
    state.S.mode === 'competition' ? setTimeout(() => go(), isFeat() ? 7000 : 4000) : null;
  function go() {
    if (gone) return;
    gone = true;
    clearTimeout(auto);
    hush();
    done();
  }
  $('#factNext').onclick = go;
  $('#factNext').focus();
}
