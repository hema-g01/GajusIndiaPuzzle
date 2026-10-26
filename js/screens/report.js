// Progress report for all saved players.
import { ALL_BADGES, badgeDesc, lvlName } from '../config.js';
import { startRound } from '../game/round.js';
import { PACKS } from '../packs.js';
import { save, state } from '../state.js';
import { backRow, curScreen, show } from '../ui/nav.js';
import { $, esc, fmtTime } from '../util.js';

const ROWS = [
  ['states', 1],
  ['states', 2],
  ['states', 3],
  ['states', 4],
  ['igeo', 0],
  ['kdist', 0],
  ['kplace', 0],
  ['wcont', 0],
  ['wsea', 0],
  ['wcountry', 0],
];

const gPack = (g) => g.pack || 'states';

function rowName(pk, l) {
  return pk === 'states'
    ? `${PACKS.states.emoji} States · ${lvlName(l)}`
    : `${PACKS[pk].emoji} ${PACKS[pk].short}`;
}

export function renderReport() {
  const cur = curScreen();
  if (cur !== 'report') state.reportFrom = cur;
  const names = state.store.order.filter(
    (n) => state.store.players[n] && state.store.players[n].games.length,
  );
  const totals = names.map((n) => ({
    n,
    stars: state.store.players[n].games.reduce((a, g) => a + g.stars, 0),
  }));
  const maxS = Math.max(1, ...totals.map((t) => t.stars));
  let html = `${backRow('report')}<div class="rep-top"><h2>📊 Progress report</h2></div>`;
  if (!names.length) {
    html += `<div class="empty"><svg viewBox="0 0 130 120" style="width:110px"><use href="#gaju"/></svg><p>No games yet. Play a game, and the report shows here.</p></div>`;
  } else {
    if (names.length > 1)
      html += `<h3>Total stars</h3><div class="compare">${totals
        .sort((a, b) => b.stars - a.stars)
        .map(
          (t) =>
            `<div class="bar-row"><b>${esc(state.store.players[t.n].avatar)} ${esc(t.n)}</b><div class="bar"><i style="width:${(t.stars / maxS) * 100}%"></i></div><span>${t.stars} ⭐</span></div>`,
        )
        .join('')}</div>`;
    names.forEach((n) => {
      const p = state.store.players[n],
        gs = p.games;
      const rows = ROWS.map(([pk, l]) => {
        const g = gs.filter((x) => gPack(x) === pk && (pk !== 'states' || x.level === l));
        if (!g.length)
          return `<tr><td>${rowName(pk, l)}</td><td colspan="6" style="color:var(--ink-soft)">Not played yet</td></tr>`;
        const best = Math.max(...g.map((x) => x.points ?? x.correct)),
          st = g.reduce((a, x) => a + (x.stars || 0), 0),
          c = g.reduce((a, x) => a + x.correct, 0),
          w = g.reduce((a, x) => a + x.incorrect, 0);
        const times = g.filter((x) => x.time != null).map((x) => x.time);
        return `<tr><td>${rowName(pk, l)}</td><td>${g.length}</td><td>${best}</td><td class="s">⭐ ${st}</td><td>${c}</td><td>${w}</td><td>${times.length ? fmtTime(Math.min(...times)) : '–'}</td></tr>`;
      }).join('');
      const byPack = {};
      Object.entries(p.errors).forEach(([k, c]) => {
        const pk = k.includes('|') ? k.split('|')[0] : 'states',
          nm = k.split('|').pop();
        if (PACKS[pk] && PACKS[pk].R[nm]) (byPack[pk] = byPack[pk] || []).push([nm, c]);
      });
      const hardHtml = Object.keys(byPack).length
        ? Object.entries(byPack)
            .map(([pk, list]) => {
              list.sort((a, b) => b[1] - a[1]);
              const lastLvl = (gs.filter((g) => gPack(g) === 'states').pop() || { level: 1 }).level;
              return `<div class="hard"><span class="rep-sec">${PACKS[pk].emoji} ${esc(PACKS[pk].short)}:</span> ${list
                .slice(0, 6)
                .map(
                  ([s, c]) =>
                    `<span class="chip">${esc(PACKS[pk].R[s].emoji)} ${esc(s)} ×${c}</span>`,
                )
                .join(
                  '',
                )}<button class="btn small green" data-practise="${esc(n)}" data-pack="${pk}" data-level="${pk === 'states' ? lastLvl : 0}">Practise these</button></div>`;
            })
            .join('')
        : `<div class="hard"><b>Difficult places:</b> <span>None yet. 🎉</span></div>`;
      html += `<div class="kid"><div class="kid-head"><span class="av">${p.avatar}</span><div><h3>${esc(n)}</h3><small>${gs.length} game${gs.length > 1 ? 's' : ''} · ${gs.reduce((a, g) => a + g.stars, 0)} stars in total</small></div></div>
        <div class="tbl-wrap"><table><thead><tr><th>Map quest</th><th>Games</th><th>Best points</th><th>Stars</th><th>Correct</th><th>Incorrect</th><th>Best time</th></tr></thead><tbody>${rows}</tbody></table></div>
        <b>Difficult places</b>${hardHtml}</div>`;
    });
    html += `<div class="badge-board"><h3>🏅 Badges</h3><div class="tbl-wrap"><table><thead><tr><th>Player</th>${ALL_BADGES.map((b) => `<th class="bh"><span>${b.emoji}</span>${b.name}<small>${badgeDesc(b)}</small></th>`).join('')}</tr></thead><tbody>
      ${names
        .map((n) => {
          const p = state.store.players[n],
            bd = p.badges || {};
          return `<tr><td><b>${esc(p.avatar)} ${esc(n)}</b></td>${ALL_BADGES.map((b) => `<td class="bc ${bd[b.k] ? 'got' : 'locked'}">${bd[b.k] ? `${b.emoji} ×${bd[b.k]}` : '🔒'}</td>`).join('')}</tr>`;
        })
        .join('')}
      </tbody></table></div></div>`;
    html += `<div style="margin-top:20px;display:flex;justify-content:flex-end"><button class="btn white small" id="clearAsk">🗑 Clear data</button></div><div id="clearBox"></div>`;
  }
  $('#reportBox').innerHTML = html;
  show('report');
  document.querySelectorAll('[data-practise]').forEach(
    (b) =>
      (b.onclick = () => {
        const n = b.dataset.practise,
          pk = b.dataset.pack,
          p = state.store.players[n];
        const regions = Object.entries(p.errors)
          .filter(([k]) => (k.includes('|') ? k.split('|')[0] : 'states') === pk)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map((e) => e[0].split('|').pop())
          .filter((s) => PACKS[pk].R[s]);
        startRound({
          pack: pk,
          players: [n],
          level: +b.dataset.level,
          mode: 'learning',
          timer: false,
          regions,
          practice: true,
        });
      }),
  );
  if ($('#clearAsk'))
    $('#clearAsk').onclick = () => {
      $('#clearBox').innerHTML =
        `<div class="confirm-box"><p>Remove all names and scores from this device? You cannot undo this.</p><button class="btn white small" id="clearNo">Cancel</button><button class="btn pink small" id="clearYes">Clear data</button></div>`;
      $('#clearNo').onclick = () => ($('#clearBox').innerHTML = '');
      $('#clearYes').onclick = () => {
        state.store = { players: {}, order: [], muted: state.store.muted };
        save();
        renderReport();
      };
    };
}
