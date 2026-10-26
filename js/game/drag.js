// Drag and drop of pieces onto the map, with snap, send-back and hints.
import { CHEERS } from '../config.js';
import { featureHit, found } from './features.js';
import { clearGlows, glow, mapSvg, mapToScreen, markDone, needGlow, screenToMap } from './map.js';
import { afterPlace } from './questions.js';
import { isFeat, updateHud } from './round.js';
import { gain, miss } from './scoring.js';
import { CFG, MAPS, ekey } from '../packs.js';
import { state } from '../state.js';
import { say } from '../ui/effects.js';
import { $, esc } from '../util.js';
import { speak } from '../voice.js';

let drag = null;

export function startDrag(e) {
  if (drag || !state.T || !$('#modal').hidden) return;
  e.preventDefault();
  const card = e.currentTarget,
    n = card.dataset.n,
    r = state.P.R[n];
  const f = document.createElement('div');
  if (isFeat()) {
    f.className = 'floater chip';
    f.innerHTML = `<span>${r.emoji}</span><span>${esc(n)}</span>`;
    document.body.appendChild(f);
    const b = f.getBoundingClientRect();
    drag = { n, card, f, ax: b.width / 2, ay: b.height / 2, id: e.pointerId };
  } else {
    f.className = 'floater';
    const s = mapSvg.getScreenCTM().a,
      [x0, y0, x1, y1] = r.bbox,
      w = x1 - x0,
      h = y1 - y0;
    let k = 1;
    const minPx = 56;
    if (Math.max(w, h) * s < minPx) k = minPx / (Math.max(w, h) * s);
    const pad = Math.max(w, h) * 0.05 + 2,
      W = (w + 2 * pad) * s * k,
      H = (h + 2 * pad) * s * k;
    f.innerHTML = `<svg width="${W}" height="${H}" viewBox="${x0 - pad} ${y0 - pad} ${w + 2 * pad} ${h + 2 * pad}" style="overflow:visible"><path d="${r.d}" fill="${r.color}" stroke="#2a2463" stroke-opacity=".5" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${k > 1 ? `<circle cx="${r.cx}" cy="${r.cy}" r="${Math.max(w, h) * 0.75}" fill="none" stroke="#ff4f79" stroke-width="${3 / k}" stroke-dasharray="${6 / k} ${4 / k}"/>` : ''}</svg>`;
    document.body.appendChild(f);
    drag = {
      n,
      card,
      f,
      ax: (r.cx - (x0 - pad)) * s * k,
      ay: (r.cy - (y0 - pad)) * s * k,
      id: e.pointerId,
    };
  }
  card.classList.add('lifted');
  moveFloater(e.clientX, e.clientY);
  speak(n);
  clearGlows();
  if (needGlow(n)) glow(n, true);
  window.addEventListener('pointermove', onMove, { passive: false });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onCancel);
}

function moveFloater(x, y) {
  drag.f.style.left = x - drag.ax + 'px';
  drag.f.style.top = y - drag.ay + 'px';
  drag.x = x;
  drag.y = y;
}

function onMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  e.preventDefault();
  moveFloater(e.clientX, e.clientY);
}

function endListeners() {
  window.removeEventListener('pointermove', onMove);
  window.removeEventListener('pointerup', onUp);
  window.removeEventListener('pointercancel', onCancel);
}

function onCancel(e) {
  if (!drag || e.pointerId !== drag.id) return;
  endListeners();
  sendBack(false);
}

function onUp(e) {
  if (!drag || e.pointerId !== drag.id) return;
  endListeners();
  const { n } = drag,
    r = state.P.R[n];
  const box = $('#mapWrap').getBoundingClientRect();
  const over =
    e.clientX >= box.left &&
    e.clientX <= box.right &&
    e.clientY >= box.top &&
    e.clientY <= box.bottom;
  if (!over) {
    sendBack(false);
    return;
  }
  const p = screenToMap(e.clientX, e.clientY);
  let ok;
  if (isFeat()) ok = featureHit(n, p);
  else {
    const L = CFG(),
      tol = Math.max(L.tol[0], L.tol[1] * Math.sqrt(r.area)),
      dt = Math.hypot(p.x - r.cx, p.y - r.cy);
    ok = dt <= tol;
    if (ok && state.P.nearest)
      ok = !state.S.regions.some(
        (x) =>
          x !== n &&
          !state.T.placed.has(x) &&
          Math.hypot(p.x - state.P.R[x].cx, p.y - state.P.R[x].cy) < dt - 2,
      );
  }
  if (ok) snapIn();
  else wrongDrop();
}

function sendBack(wrong) {
  const { f, card, n } = drag,
    b = card.getBoundingClientRect();
  f.classList.add('back');
  f.style.left = b.left + b.width / 2 - drag.ax + 'px';
  f.style.top = b.top + b.height / 2 - drag.ay + 'px';
  f.style.opacity = '0';
  setTimeout(() => {
    f.remove();
    card.classList.remove('lifted');
    if (wrong) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    }
  }, 350);
  glow(n, needGlow(n));
  drag = null;
}

function wrongDrop() {
  const n = drag.n,
    ek = ekey(state.P.id, n);
  state.T.incorrect++;
  miss();
  state.T.errors[ek] = (state.T.errors[ek] || 0) + 1;
  state.T.tries[n] = (state.T.tries[n] || 0) + 1;
  if (state.S.mode === 'learning')
    say(
      `Not there. ${where(state.P.R[n])} ${needGlow(n) ? 'Look for the glowing place!' : 'Try again!'}`,
    );
  else say('Not there. Try again!');
  sendBack(true);
}

function snapIn() {
  const { f, card, n } = drag,
    r = state.P.R[n];
  let sp;
  if (isFeat()) {
    const [x, y] = r.lp;
    sp = mapToScreen(x, y);
  } else sp = mapToScreen(r.cx, r.cy);
  f.classList.add('snap');
  f.style.left = sp.x - drag.ax + 'px';
  f.style.top = sp.y - drag.ay + 'px';
  f.style.opacity = '0';
  setTimeout(() => f.remove(), 450);
  card.remove();
  drag = null;
  if (isFeat()) {
    found(n, false);
    return;
  }
  state.T.placed.add(n);
  gain();
  markDone(n);
  updateHud();
  say(CHEERS[Math.floor(Math.random() * CHEERS.length)] + ` That is ${n}.`);
  afterPlace(n);
}

function where(r) {
  const M = MAPS[state.P.map];
  let x, y;
  if (state.P.kind === 'shape') {
    x = r.cx;
    y = r.cy;
  } else [x, y] = r.lp;
  if (state.P.map === 'world') {
    if (r.continent)
      return r.continent.startsWith('Europe and')
        ? 'It is very big, in the north of Europe and Asia.'
        : `It is in ${r.continent.replace(' (Oceania)', '')}.`;
    const fx = x / M.w,
      fy = y / M.h,
      v = fy < 0.3 ? 'top' : fy > 0.7 ? 'bottom' : '',
      h = fx < 0.36 ? 'left' : fx > 0.64 ? 'right' : '';
    if (!v && !h) return 'Look in the middle of the world map.';
    return `Look at the ${v}${v && h ? ' ' : ''}${h} of the world map.`;
  }
  if (state.P.map === 'kerala') {
    const v = y / M.h < 0.36 ? 'north' : y / M.h > 0.64 ? 'south' : 'middle';
    return `Look in the ${v} of Kerala.`;
  }
  if (r.name === 'Andaman and Nicobar Islands')
    return 'It is a group of islands in the sea on the east side.';
  if (r.name === 'Lakshadweep') return 'It is a group of tiny islands in the sea on the west side.';
  const fx = x / M.w,
    fy = y / M.h;
  if (fx > 0.66 && fy < 0.58) return 'Look in the north-east of India.';
  const v = fy < 0.33 ? 'north' : fy > 0.66 ? 'south' : '',
    h = fx < 0.34 ? 'west' : fx > 0.58 ? 'east' : '';
  if (!v && !h) return 'Look in the middle of India.';
  return `Look in the ${v}${v && h ? '-' : ''}${h} of India.`;
}
