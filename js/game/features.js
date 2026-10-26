// Rivers, mountains and places: drawing, hit-testing, and the tap-to-find mode.
import { CHEERS, TYPE_COLOR } from '../config.js';
import { glow, layers, screenToMap, sparkle } from './map.js';
import { afterPlace } from './questions.js';
import { tapMode, updateHud } from './round.js';
import { gain, miss } from './scoring.js';
import { remaining } from './tray.js';
import { MAPS, ekey } from '../packs.js';
import { state } from '../state.js';
import { say } from '../ui/effects.js';
import { $, el, esc } from '../util.js';
import { speak } from '../voice.js';

export function drawFeature(f) {
  const g = el('g', { class: 'ft', 'data-n': f.name }, layers.feat);
  const M = MAPS[state.P.map],
    k = M.w / 1000;
  if (f.kind === 'point') {
    f.pts.forEach((seg) => {
      const [x, y] = seg[0];
      el('circle', { cx: x, cy: y, r: 26 * k + 6, class: 'f-glow', 'stroke-width': 4 }, g);
      el('circle', { cx: x, cy: y, r: 13 * k + 4, class: 'f-point' }, g);
      const t = el('text', { x, y: y + 1, class: 'f-em', 'font-size': 14 * k + 5 }, g);
      t.textContent = f.emoji;
    });
  } else {
    el('path', { d: f.d, class: 'f-glow', 'stroke-width': 22 * k + 6 }, g);
    el('path', { d: f.d, class: f.kind === 'river' ? 'f-river' : 'f-range' }, g);
    if (f.kind === 'range') {
      // little mountain triangles along the ridge
      const step = 36 * k + 8,
        sz = 8 * k + 4;
      f.pts.forEach((seg) => {
        let acc = step / 2;
        for (let i = 1; i < seg.length; i++) {
          const [x0, y0] = seg[i - 1],
            [x1, y1] = seg[i],
            L = Math.hypot(x1 - x0, y1 - y0);
          while (acc <= L) {
            const t = acc / L,
              x = x0 + (x1 - x0) * t,
              y = y0 + (y1 - y0) * t;
            el(
              'path',
              {
                d: `M${x - sz},${y + sz * 0.6}L${x},${y - sz}L${x + sz},${y + sz * 0.6}Z`,
                class: 'f-tri',
              },
              g,
            );
            acc += step;
          }
          acc -= L;
        }
      });
    }
  }
}

function distTo(f, p) {
  let best = Infinity;
  f.pts.forEach((seg) => {
    if (seg.length === 1) {
      best = Math.min(best, Math.hypot(p.x - seg[0][0], p.y - seg[0][1]));
      return;
    }
    for (let i = 1; i < seg.length; i++) {
      const [ax, ay] = seg[i - 1],
        [bx, by] = seg[i],
        dx = bx - ax,
        dy = by - ay,
        l2 = dx * dx + dy * dy;
      let t = l2 ? ((p.x - ax) * dx + (p.y - ay) * dy) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(p.x - (ax + t * dx), p.y - (ay + t * dy)));
    }
  });
  return best;
}

export function featureHit(n, p) {
  const tol = ((state.P.R[n].tol || state.P.cfg.tol) * MAPS[state.P.map].w) / 1000 + 10,
    dt = distTo(state.P.R[n], p);
  const others = state.S.regions.filter((x) => x !== n).map((x) => distTo(state.P.R[x], p));
  return dt <= tol && dt <= Math.min(Infinity, ...others) + 12;
}

function markFound(n) {
  const f = state.P.R[n],
    g = layers.feat.querySelector(`g[data-n="${CSS.escape(n)}"]`);
  if (g) {
    g.classList.remove('glow');
    g.classList.add('found');
  }
  const M = MAPS[state.P.map],
    k = M.w / 1000,
    [x, y] = f.lp;
  const fs = 16 * k + 7;
  const t = el(
    'text',
    {
      x: x + (f.kind === 'point' ? 16 * k + 8 : 6),
      y: y - (f.kind === 'point' ? 0 : 8),
      class: 'f-label lbl',
      'font-size': fs,
      'text-anchor': 'start',
      'dominant-baseline': 'central',
    },
    layers.lbl,
  );
  t.textContent = f.name;
  const bb = t.getBBox();
  if (bb.x + bb.width > M.w - 4) {
    t.setAttribute('text-anchor', 'end');
    t.setAttribute('x', x - (f.kind === 'point' ? 16 * k + 8 : 6));
  }
  sparkle(x, y, '#3d9fd3');
}

export function nextTarget() {
  const rem = remaining();
  if (!rem.length) {
    state.T.target = null;
    $('#pieces').innerHTML = '';
    return;
  }
  const n = rem[0],
    f = state.P.R[n];
  state.T.target = n;
  $('#pieces').innerHTML =
    `<div class="find-card"><span class="lbl2">Find:</span><span class="em">${f.emoji}</span><div><b>${esc(f.name)}</b><br><span class="tt" style="background:${TYPE_COLOR[f.type] || '#7c6cf2'}">${esc(f.type)}</span></div><button class="btn white small" id="hearFind">🔊 Hear</button></div>`;
  $('#hearFind').onclick = () => speak(`Find ${f.name}.`);
  $('#trayLeft').textContent = rem.length > 1 ? `${rem.length - 1} more after this` : 'Last one!';
  say(`Find ${f.name}! Tap it on the map.`);
  speak(`Find ${f.name}.`);
}

let tapStart = null;

export function found(n, revealed) {
  state.T.placed.add(n);
  if (!revealed) gain();
  markFound(n);
  updateHud();
  say(
    revealed
      ? `This is ${n}.`
      : CHEERS[Math.floor(Math.random() * CHEERS.length)] + ` That is ${n}.`,
  );
  afterPlace(n);
}

/** Wire pointer events on the map for "tap the place" mode. */
export function initTapMode() {
  $('#mapWrap').addEventListener('pointerdown', (e) => {
    if (
      !state.S ||
      !state.T ||
      !tapMode() ||
      !state.T.target ||
      !$('#modal').hidden ||
      state.T.busy
    )
      return;
    tapStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  $('#mapWrap').addEventListener('pointerup', (e) => {
    if (!tapStart || e.pointerId !== tapStart.id) return;
    const st = tapStart;
    tapStart = null;
    if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 16 || !state.T.target) return;
    const p = screenToMap(e.clientX, e.clientY),
      n = state.T.target;
    if (featureHit(n, p)) {
      found(n, false);
      return;
    }
    state.T.incorrect++;
    miss();
    const ek = ekey(state.P.id, n);
    state.T.errors[ek] = (state.T.errors[ek] || 0) + 1;
    state.T.tries[n] = (state.T.tries[n] || 0) + 1;
    const M = MAPS[state.P.map],
      x = el(
        'text',
        { x: p.x, y: p.y, class: 'tap-x', 'font-size': (40 * M.w) / 1000 + 10 },
        layers.fx,
      );
    x.textContent = '✗';
    setTimeout(() => x.remove(), 1000);
    if (state.T.tries[n] >= 3) {
      state.T.busy = true;
      glow(n, true);
      say(`Here is ${state.P.R[n].name}!`);
      setTimeout(() => {
        state.T.busy = false;
        found(n, true);
      }, 1600);
    } else say(`Not there. Try again!`);
  });
}
