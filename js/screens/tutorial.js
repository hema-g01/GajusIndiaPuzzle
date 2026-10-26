// The "How to play" dialog with its animated demo.
import { REGIONS } from '../../data/india.js';
import { KDIST } from '../../data/kerala.js';
import { WCONT, WCOUNTRY } from '../../data/world.js';
import { LEVELS } from '../config.js';
import { roundLabel } from '../game/round.js';
import { miniStudy } from './study.js';
import { state } from '../state.js';
import { closeModal, openModal } from '../ui/modal.js';
import { $, esc } from '../util.js';

const TUT = {
  1: [
    ['Touch a piece', 'Put your finger (or the mouse) on a state piece. Gaju says its name.'],
    ['Drag it to the map', 'Move it to its dotted place on the map.'],
    [
      'Let go!',
      'When it is in the right place, it snaps in. After a mistake in Learning mode, the right place glows.',
    ],
  ],
  2: [
    ['Drag a piece', 'Drag each piece to its dotted place on the map.'],
    ['Pick the capital', 'Then Gaju asks a question. Tap the capital city of that state.'],
    ['Collect stars', 'Each correct answer is 1 point. Every 5 points give you a star!'],
  ],
  3: [
    [
      'No dotted lines!',
      'This time the map has no lines inside. Look at the shape and the places around it.',
    ],
    ['Two questions', 'After each piece, pick the capital and the language.'],
    ['Need help?', 'In Learning mode Gaju tells you where to look.'],
  ],
  4: [
    ['Expert level', 'No dotted lines. Look at the shape of each piece carefully.'],
    ['Four questions', 'Pick the capital, the language, the dance form and the famous food.'],
    ['Win badges', 'Get 3, 5, 10 or 15 correct in a row to unlock badges!'],
  ],
  kdist: [
    ['Touch a district', 'Put your finger on a district piece. Gaju says its name.'],
    ['Drag it to Kerala', 'Move it to its dotted place on the map of Kerala.'],
    [
      'Learn about it',
      'When it snaps in, the board shows its famous tourist place, river, mountain and power project.',
    ],
  ],
  wcont: [
    ['Touch a continent', 'Put your finger on a continent piece. Gaju says its name.'],
    ['Drag it to the world map', 'Move it to its dotted place on the world map.'],
    ['Hear a fun fact', 'When it snaps in, Gaju tells you a fun fact about that continent.'],
  ],
  wcountry: [
    ['Touch a country', 'Put your finger on a country piece. Gaju says its name.'],
    [
      'Drag it to the world map',
      'Move it to its dotted place. Small countries have a pink ring to help you.',
    ],
    [
      'Learn about it',
      'When it snaps in, the board shows its capital, its continent and a fun fact.',
    ],
  ],
  featL: [
    [
      'Look at the map',
      'Blue lines are rivers. Brown lines are mountain ranges. Round markers are peaks and places.',
    ],
    ['Drag a name card', 'Drag each name card to its river, mountain or place on the map.'],
    ['Hear a fun fact', 'When you are correct, Gaju tells you a fun fact.'],
  ],
  featC: [
    ['Listen to Gaju', 'Gaju says a name, for example: Find the Ganga.'],
    ['Tap the place', 'Tap that river, mountain or place on the map.'],
    ['Three tries', 'After three wrong taps, Gaju shows the answer.'],
  ],
};

function demoShapes(list, pieceName, others) {
  const R = Object.fromEntries(list.map((r) => [r.name, r])),
    b = [1e9, 1e9, -1e9, -1e9];
  [pieceName, ...others.slice(0, 2)].forEach((n) => {
    const q = R[n].bbox;
    b[0] = Math.min(b[0], q[0]);
    b[1] = Math.min(b[1], q[1]);
    b[2] = Math.max(b[2], q[2]);
    b[3] = Math.max(b[3], q[3]);
  });
  const w = b[2] - b[0],
    h = b[3] - b[1],
    m = w * 0.35,
    vb = [b[0] - m * 0.3, b[1] - m * 0.2, w + m * 1.3, h + m * 0.4],
    k = R[pieceName];
  const lines = state.P.id !== 'states' || LEVELS[state.S.level].lines;
  return `<svg viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">
    ${others.map((n) => `<path d="${R[n].d}" fill="${R[n].color}" fill-opacity=".55" stroke="#fff" stroke-width="1.5"/>`).join('')}
    <path d="${k.d}" fill="#fff3d3" ${lines ? `stroke="#c99a4c" stroke-width="1.6" stroke-dasharray="5 4"` : ''}/>
    <g class="demo-piece" style="--dx:${w * 0.85}px;--dy:${h * 0.05}px"><path d="${k.d}" stroke="#fff" stroke-width="2"/>
      <text x="${k.cx + 8}" y="${k.cy + 14}" font-size="${w * 0.16}">👆</text></g></svg>`;
}

function demoFeature() {
  const tap = state.S.mode === 'competition';
  return `<svg viewBox="0 0 200 200"><path d="M30,20 C80,10 150,30 170,70 C185,110 160,170 110,185 C60,195 25,150 20,100 C15,60 10,30 30,20Z" fill="#fff3d3" stroke="#c99a4c" stroke-width="2"/>
    <path d="M40,60 C70,70 80,100 110,110 C140,120 150,150 175,160" fill="none" stroke="#3d8fe0" stroke-width="6" stroke-linecap="round"/>
    <path d="M60,150 L90,125 L120,140" fill="none" stroke="#b98a5a" stroke-width="7" stroke-linecap="round" opacity=".7"/>
    ${
      tap
        ? `<g class="demo-piece" style="--dx:40px;--dy:50px"><text x="100" y="118" font-size="30">👆</text></g>`
        : `<g class="demo-piece" style="--dx:30px;--dy:-80px"><rect x="72" y="92" width="76" height="26" rx="10" fill="#fff" stroke="#ff4f79" stroke-width="2"/><text x="110" y="110" font-size="13" text-anchor="middle" font-family="sans-serif" font-weight="700" fill="#2a2463">🌊 Ganga</text></g>`
    }</svg>`;
}

function tutSteps() {
  if (state.P.id === 'states') return TUT[state.S.level];
  if (state.P.id === 'kdist') return TUT.kdist;
  if (state.P.id === 'wcont' || state.P.id === 'wcountry') return TUT[state.P.id];
  return state.S.mode === 'competition' ? TUT.featC : TUT.featL;
}

function demoSvg() {
  if (state.P.id === 'states')
    return demoShapes(REGIONS, 'Kerala', [
      'Tamil Nadu',
      'Karnataka',
      'Goa',
      'Puducherry',
      'Andhra Pradesh',
    ]);
  if (state.P.id === 'kdist')
    return demoShapes(KDIST, 'Thrissur', ['Palakkad', 'Ernakulam', 'Malappuram', 'Idukki']);
  if (state.P.id === 'wcont') return demoShapes(WCONT, 'Africa', ['Europe', 'Asia']);
  if (state.P.id === 'wcountry')
    return demoShapes(WCOUNTRY, 'India', ['China', 'Nepal', 'Sri Lanka']);
  return demoFeature();
}

export function showTutorial(done) {
  const steps = [...tutSteps(), null];
  let i = 0;
  const head = (s) =>
    `<div class="q-head"><svg viewBox="0 0 130 120" style="width:72px"><use href="#gaju"/></svg><div><div class="step">How to play · ${esc(roundLabel())}</div><h2>${esc(s)}</h2></div></div>`;
  const render = () => {
    const last = i === steps.length - 1,
      dots = `<div class="dots">${steps.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>`;
    const body = steps[i]
      ? `<div class="tut"><div class="tut-demo">${demoSvg()}</div><div>${head(steps[i][0])}<p style="font-size:1.2em;margin:.2em 0">${esc(steps[i][1])}</p>${dots}</div></div>`
      : `${head('Study board')}<p style="margin:.2em 0">Look at the answers before you play. Skip if you know them!</p>${miniStudy()}${dots}`;
    openModal(
      body +
        `<div class="modal-actions"><button class="btn white small" id="tutSkip">Skip</button>
      <button class="btn ${last ? 'pink' : 'green'}" id="tutNext">${last ? "Let's play! ▶" : 'Next ▶'}</button></div>`,
      !steps[i],
    );
    $('#tutSkip').onclick = () => {
      closeModal();
      done();
    };
    $('#tutNext').onclick = () => {
      if (!last) {
        i++;
        render();
      } else {
        closeModal();
        done();
      }
    };
  };
  render();
}
