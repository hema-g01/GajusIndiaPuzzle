// The map SVG: drawing, marking pieces done, sparkles, glow hints and coordinate conversion.
import { drawFeature } from './features.js';
import { isFeat } from './round.js';
import { CFG, MAPS } from '../packs.js';
import { state } from '../state.js';
import { $, el } from '../util.js';

export const mapSvg = $('#map');
export const layers = {};

export function buildMap() {
  const M = MAPS[state.P.map];
  mapSvg.innerHTML = '';
  mapSvg.setAttribute('viewBox', `0 0 ${M.w} ${M.h}`);
  el('rect', { x: -M.w, y: -M.h, width: 3 * M.w, height: 3 * M.h, fill: 'url(#waves)' }, mapSvg);
  M.neighbors.forEach((n) =>
    el(
      'path',
      {
        d: n.d,
        fill: '#f1e9d6',
        stroke: '#d8c9a8',
        'stroke-width': 1.2,
        'stroke-linejoin': 'round',
      },
      mapSvg,
    ),
  );
  if (M.sphere)
    el(
      'path',
      { d: M.sphere, fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-opacity': 0.7 },
      mapSvg,
    );
  el(
    'path',
    {
      d: M.outline,
      fill: '#fff3d3',
      stroke: '#ffffff',
      'stroke-width': M.sphere ? 3 : 7,
      'stroke-linejoin': 'round',
    },
    mapSvg,
  );
  el(
    'path',
    {
      d: M.outline,
      fill: 'none',
      stroke: '#c99a4c',
      'stroke-width': 2,
      'stroke-linejoin': 'round',
    },
    mapSvg,
  );
  layers.st = el('g', {}, mapSvg);
  layers.ring = el('g', {}, mapSvg);
  layers.feat = el('g', {}, mapSvg);
  layers.lbl = el('g', {}, mapSvg);
  layers.fx = el('g', {}, mapSvg);
  if (isFeat()) {
    M.base.forEach((r) => {
      const p = el(
        'path',
        { d: r.d, 'stroke-linejoin': 'round', stroke: '#fff', 'stroke-width': 1.2 },
        layers.st,
      );
      p.style.fill = r.color;
      p.style.fillOpacity = '.22';
    });
    state.S.regions.forEach((n) => drawFeature(state.P.R[n]));
    return;
  }
  const L = CFG(),
    inRound = new Set(state.S.regions);
  state.P.items.forEach((r) => {
    const p = el(
      'path',
      { d: r.d, class: 'st', 'data-n': r.name, 'stroke-linejoin': 'round' },
      layers.st,
    );
    p.style.fill = r.color;
    if (!inRound.has(r.name)) {
      p.classList.add('pre');
      addLabel(r, false);
    } else {
      p.classList.add('todo');
      if (L.lines) p.classList.add('lines');
      p.style.fill = '';
      if (r.area < 450 && L.lines)
        el(
          'circle',
          { cx: r.cx, cy: r.cy, r: 15, class: 'tiny-ring', 'data-n': r.name },
          layers.ring,
        );
    }
  });
}

function stPath(n) {
  return layers.st.querySelector(`path[data-n="${CSS.escape(n)}"]`);
}

function addLabel(r, anim) {
  const size = Math.max(12, Math.min(34, Math.sqrt(r.area) * 0.2));
  const t = el('text', { x: r.cx, y: r.cy, class: 'lbl', 'font-size': size }, layers.lbl);
  t.textContent = r.emoji;
  if (!anim) t.style.animation = 'none';
}

export function markDone(n) {
  const r = state.P.R[n],
    p = stPath(n);
  p.classList.remove('todo', 'lines', 'glow');
  p.classList.add('done');
  p.style.fill = r.color;
  const ring = layers.ring.querySelector(`circle[data-n="${CSS.escape(n)}"]`);
  if (ring) ring.classList.add('done');
  else if (r.area < 450)
    el('circle', { cx: r.cx, cy: r.cy, r: 15, class: 'tiny-ring done' }, layers.ring);
  addLabel(r, true);
  sparkle(r.cx, r.cy, r.color);
}

export function sparkle(x, y, color) {
  const cols = [color, '#ffb627', '#ff4f79', '#ffffff'];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2,
      d = 40 + Math.random() * 30;
    const c = el(
      'circle',
      { cx: x, cy: y, r: 4 + Math.random() * 4, fill: cols[i % 4], class: 'spark' },
      layers.fx,
    );
    c.style.setProperty('--sx', Math.cos(a) * d + 'px');
    c.style.setProperty('--sy', Math.sin(a) * d + 'px');
    setTimeout(() => c.remove(), 950);
  }
}

export function needGlow(n) {
  return (
    state.S.mode === 'learning' &&
    (state.T.tries[n] || 0) >= (state.P.id === 'states' && state.S.level > 2 ? 2 : 1)
  );
}

export function clearGlows() {
  mapSvg.querySelectorAll('.glow').forEach((p) => p.classList.remove('glow'));
}

export function glow(n, on) {
  const e = isFeat() ? layers.feat.querySelector(`g[data-n="${CSS.escape(n)}"]`) : stPath(n);
  if (e) e.classList.toggle('glow', on);
}

export function mapToScreen(x, y) {
  const m = mapSvg.getScreenCTM();
  return { x: m.a * x + m.e, y: m.d * y + m.f, s: m.a };
}

export function screenToMap(x, y) {
  const m = mapSvg.getScreenCTM();
  return { x: (x - m.e) / m.a, y: (y - m.f) / m.d };
}
