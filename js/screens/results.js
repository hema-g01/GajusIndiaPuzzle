// End-of-turn summary and the final results screen.
import { PEACOCK, badgeDesc, lvlName } from '../config.js';
import { askPieces, modeLabel, startRound, stopTimer, turnIntro } from '../game/round.js';
import { renderReport } from './report.js';
import { rec, save, state } from '../state.js';
import { confetti } from '../ui/effects.js';
import { backRow, goHome, show } from '../ui/nav.js';
import { $, esc, fmtTime } from '../util.js';

const starsRow = (n) =>
  n
    ? n <= 10
      ? Array.from(
          { length: n },
          (_, i) => `<span class="on" style="animation-delay:${0.3 + i * 0.2}s">⭐</span>`,
        ).join('')
      : `<span class="on">⭐</span><b class="many">× ${n}</b>`
    : `<p class="first-star">Get 5 points for your first star!</p>`;

export function endTurn() {
  stopTimer();
  const time = (Date.now() - state.T.start) / 1000,
    timeSec = state.S.timer ? Math.round(time) : null;
  const points = state.T.correct,
    stars = Math.floor(points / 5),
    perfect = state.T.incorrect === 0 && points > 0;
  const p = rec(state.T.name);
  p.badges = p.badges || {};
  const earned = [];
  if (state.T.badge) {
    earned.push(state.T.badge);
    p.badges[state.T.badge.k] = (p.badges[state.T.badge.k] || 0) + 1;
  }
  if (perfect) {
    earned.push(PEACOCK);
    p.badges.peacock = (p.badges.peacock || 0) + 1;
  }
  p.games.push({
    date: Date.now(),
    pack: state.P.id,
    level: state.S.level,
    mode: state.S.mode,
    timer: state.S.timer,
    correct: state.T.correct,
    incorrect: state.T.incorrect,
    time: timeSec,
    points,
    stars,
    best: state.T.best,
    badge: state.T.badge ? state.T.badge.k : null,
    perfect,
    pieces: state.S.regions.length,
    practice: !!state.S.practice,
  });
  for (const k in state.T.errors) p.errors[k] = (p.errors[k] || 0) + state.T.errors[k];
  save();
  state.S.results.push({
    name: state.T.name,
    points,
    stars,
    correct: state.T.correct,
    incorrect: state.T.incorrect,
    time: timeSec,
    badges: earned.map((b) => b.emoji).join(''),
  });
  const last = state.S.turn === state.S.players.length - 1;
  const hard = Object.entries(state.T.errors)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((e) => e[0].split('|').pop());
  $('#endBox').innerHTML =
    `${backRow('end')}<div class="avbig">${p.avatar}</div><h2>Well done, ${esc(state.T.name)}!</h2>
    <div class="pts-big"><b>${points}</b> point${points === 1 ? '' : 's'}</div>
    <div class="stars">${starsRow(stars)}</div>
    <div class="stats"><div class="stat"><b>${state.T.correct}</b><small>Correct</small></div><div class="stat"><b>${state.T.incorrect}</b><small>Incorrect</small></div><div class="stat"><b>${state.T.best}</b><small>Best streak</small></div>${timeSec != null ? `<div class="stat"><b>${fmtTime(timeSec)}</b><small>Time</small></div>` : ''}</div>
    ${earned.length ? `<div class="badge-row">${earned.map((b) => `<div class="bdg"><span>${b.emoji}</span><b>${b.name}</b><small>${badgeDesc(b)}</small></div>`).join('')}</div>` : ''}
    ${hard.length ? `<p>Practise these again: <b>${hard.map(esc).join(', ')}</b></p>` : `<p>No mistakes. Amazing! 🎉</p>`}
    <button class="btn pink" id="endNext">${last ? (state.S.players.length > 1 ? 'See who won 🏆' : 'Finish ▶') : `Next: ${esc(state.S.players[state.S.turn + 1])} ▶`}</button>`;
  show('end');
  confetti(stars >= 2 ? 140 : 60);

  $('#endNext').onclick = () => {
    if (last) showResults();
    else {
      state.S.turn++;
      turnIntro();
    }
  };
}

function showResults() {
  const acc = (r) => r.correct / (r.correct + r.incorrect || 1);
  const rs = [...state.S.results].sort(
    (a, b) => b.points - a.points || acc(b) - acc(a) || (a.time ?? 1e9) - (b.time ?? 1e9),
  );
  const medal = ['🥇', '🥈', '🥉'];
  $('#resultsBox').innerHTML =
    `${backRow('results')}<h2>${state.S.players.length > 1 ? 'Results' : 'Great playing!'}</h2>
    <p>${state.P.emoji} ${esc(state.P.title)}${state.P.id === 'states' ? ' · ' + lvlName(state.S.level) : ''} · ${modeLabel()}</p>
    <div class="rank">${rs
      .map(
        (
          r,
          i,
        ) => `<div class="rank-row"><span class="pos">${state.S.players.length > 1 ? medal[i] || i + 1 : '⭐'}</span><span class="av">${rec(r.name).avatar}</span>
      <span class="nm"><b>${esc(r.name)} ${r.badges}</b><small>${r.points} points · ${r.incorrect} incorrect${r.time != null ? ' · ' + fmtTime(r.time) : ''}</small></span><span class="st3">⭐ ${r.stars}</span></div>`,
      )
      .join('')}</div>
    <div class="stats" style="margin-top:8px">
      <button class="btn green" id="again">Play again 🔄</button>
      ${state.P.id === 'states' && state.S.level < 4 ? `<button class="btn" id="nextLvl">Try ${lvlName(state.S.level + 1)} ▶</button>` : ''}
      <button class="btn white" id="toReport">📊 Progress report</button>
      <button class="btn white" id="toHome">🏠 Home</button>
    </div>`;
  show('results');
  confetti(200);
  const restart = (lvl) => {
    const cfg = {
      pack: state.P.id,
      players: state.S.players,
      level: lvl,
      mode: state.S.mode,
      timer: state.S.timer,
      practice: state.S.practice,
    };
    if (state.S.practice) {
      cfg.regions = state.S.regions;
      startRound(cfg);
    } else askPieces(cfg);
  };
  $('#again').onclick = () => restart(state.S.level);
  if ($('#nextLvl')) $('#nextLvl').onclick = () => restart(state.S.level + 1);
  $('#toReport').onclick = renderReport;
  $('#toHome').onclick = goHome;
}
