// The tray of draggable pieces beside the map.
import { startDrag } from './drag.js';
import { isFeat } from './round.js';
import { state } from '../state.js';
import { $, esc } from '../util.js';

export function remaining() {
  return state.T.queue.filter((n) => !state.T.placed.has(n));
}

export function refillTray() {
  const box = $('#pieces'),
    rem = remaining(),
    max = isFeat() ? 5 : 6,
    showN = rem.slice(0, max);
  const have = [...box.children].map((c) => c.dataset.n);
  [...box.children].forEach((c) => {
    if (!showN.includes(c.dataset.n)) c.remove();
  });
  showN.forEach((n) => {
    if (!have.includes(n)) box.appendChild(makePiece(n));
  });
  const more = rem.length - showN.length;
  $('#trayLeft').textContent =
    more > 0
      ? `${more} more piece${more > 1 ? 's' : ''} after these`
      : rem.length
        ? 'Last pieces!'
        : '';
}

function pieceSvg(r, pad) {
  const [x0, y0, x1, y1] = r.bbox,
    w = x1 - x0,
    h = y1 - y0,
    m = Math.max(w, h) * pad + 2;
  const tiny = r.area < 450,
    mm = tiny ? Math.max(w, h) * 0.9 : m;
  return `<svg viewBox="${x0 - mm} ${y0 - mm} ${w + 2 * mm} ${h + 2 * mm}" preserveAspectRatio="xMidYMid meet"><path d="${r.d}" fill="${r.color}" stroke="#2a2463" stroke-opacity=".45" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>${tiny ? `<circle cx="${(x0 + x1) / 2}" cy="${(y0 + y1) / 2}" r="${Math.max(w, h) * 1.25}" fill="none" stroke="#ff4f79" stroke-width="${Math.max(w, h) / 12}" stroke-dasharray="${Math.max(w, h) / 5} ${Math.max(w, h) / 8}"/>` : ''}</svg>`;
}

function makePiece(n) {
  const r = state.P.R[n],
    d = document.createElement('div');
  d.dataset.n = n;
  if (isFeat()) {
    d.className = 'piece fc';
    d.innerHTML = `<span class="em">${r.emoji}</span><span>${esc(n)}<small>${esc(r.type)}</small></span>`;
  } else {
    d.className = 'piece';
    d.innerHTML = pieceSvg(r, 0.08) + `<span>${esc(n)}</span>`;
  }
  d.setAttribute('role', 'button');
  d.setAttribute('aria-label', `Piece: ${n}`);
  d.addEventListener('pointerdown', startDrag);
  return d;
}
