// Points, stars and badges.
import { BADGES, badgeDesc } from '../config.js';
import { state } from '../state.js';
import { fx } from '../ui/effects.js';
import { $ } from '../util.js';

export function updatePts() {
  const st = Math.floor(state.T.correct / 5);
  $('#hudPts').textContent =
    `${state.T.correct} point${state.T.correct === 1 ? '' : 's'} · ⭐ ${st}`;
}

export function gain() {
  state.T.correct++;
  state.T.streak++;
  state.T.best = Math.max(state.T.best, state.T.streak);
  updatePts();
  if (state.T.correct % 5 === 0) {
    const k = state.T.correct / 5;
    const h = $('#hudPts');
    h.classList.remove('bump');
    void h.offsetWidth;
    h.classList.add('bump');
    fx(
      `<div class="fx-card fx-star"><span class="big">⭐</span><b>Star ${k}!</b><small>5 more points</small></div>`,
      1500,
    );
  }
  const b = BADGES.find((x) => x.n === state.T.streak);
  if (b && (!state.T.badge || b.n > state.T.badge.n)) {
    const up = !!state.T.badge;
    state.T.badge = b;
    fx(
      `<div class="fx-card fx-badge"><span class="big">${b.emoji}</span><small>${up ? 'Badge upgraded!' : 'Badge unlocked!'}</small><b>${b.name}</b><i>${badgeDesc(b)}</i></div>`,
      2000,
    );
  }
}

export function miss() {
  state.T.streak = 0;
}
