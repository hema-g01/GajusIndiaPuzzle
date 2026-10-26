// Study board: flash-card reference for every quest.
import { TYPE_COLOR, kdList } from '../config.js';
import { PACKS } from '../packs.js';
import { state } from '../state.js';
import { backRow, curScreen, show } from '../ui/nav.js';
import { $, esc } from '../util.js';

function studyCards(pack) {
  const p = PACKS[pack];
  return p.items
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => {
      const c = TYPE_COLOR[r.type] || '#7c6cf2';
      let body;
      if (pack === 'states')
        body = `<dl><dt>🏛 Capital</dt><dd>${esc(r.capital)}</dd><dt>🗣 Language</dt><dd>${esc(r.language)}</dd><dt>💃 Dance</dt><dd>${esc(r.dance)}</dd><dt>🍲 Food</dt><dd>${esc(r.food)}</dd></dl>`;
      else if (pack === 'wcountry')
        body = `<dl><dt>🏛 Capital</dt><dd>${esc(r.capital)}</dd><dt>🌍 Continent</dt><dd>${esc(r.continent)}</dd></dl><p>${esc(r.fact)}</p>`;
      else if (pack === 'kdist')
        body = `<dl>${kdList(r)
          .map(([l, v]) => `<dt>${l}</dt><dd>${esc(v)}</dd>`)
          .join('')}</dl>`;
      else body = `<p>${esc(r.fact)}</p>`;
      return `<div class="scard" style="--c:${c}" data-say="${esc(pack)}|${esc(r.name)}"><div class="t"><span>${r.emoji}</span><div><b>${esc(r.name)}</b><small>${esc(r.type)}</small></div></div>${body}</div>`;
    })
    .join('');
}

export function renderStudy(tab) {
  const cur = curScreen();
  if (cur !== 'study') state.studyFrom = cur;
  const tabs = Object.values(PACKS)
    .map(
      (p) =>
        `<button class="tab" role="tab" aria-selected="${p.id === tab}" data-tab="${p.id}">${p.emoji} ${esc(p.short)}</button>`,
    )
    .join('');
  $('#studyBox').innerHTML = `${backRow('study')}<div class="rep-top"><h2>📖 Study board</h2></div>
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="study-grid">${studyCards(tab)}</div>`;
  show('study');
  $('#studyBox')
    .querySelectorAll('[data-tab]')
    .forEach((b) => (b.onclick = () => renderStudy(b.dataset.tab)));
}

export function miniStudy() {
  const rows = state.P.items.slice().sort((a, b) => a.name.localeCompare(b.name));
  let head, body;
  if (state.P.id === 'states') {
    head = '<th>State / UT</th><th>Capital</th><th>Language</th><th>Dance form</th><th>Food</th>';
    body = rows
      .map(
        (r) =>
          `<tr><td>${r.emoji} ${esc(r.name)}</td><td>${esc(r.capital)}</td><td>${esc(r.language)}</td><td>${esc(r.dance)}</td><td>${esc(r.food)}</td></tr>`,
      )
      .join('');
  } else if (state.P.id === 'kdist') {
    head =
      '<th>District</th><th>Tourist place</th><th>River</th><th>Mountain</th><th>Hydroelectric project</th>';
    body = rows
      .map(
        (r) =>
          `<tr><td>${r.emoji} ${esc(r.name)}</td>${['tour', 'river', 'mount', 'hydro'].map((k) => `<td>${esc(r[k] || '–')}</td>`).join('')}</tr>`,
      )
      .join('');
  } else if (state.P.id === 'wcountry') {
    head = '<th>Country</th><th>Capital</th><th>Continent</th><th>Fact</th>';
    body = rows
      .map(
        (r) =>
          `<tr><td>${r.emoji} ${esc(r.name)}</td><td>${esc(r.capital)}</td><td>${esc(r.continent)}</td><td>${esc(r.fact)}</td></tr>`,
      )
      .join('');
  } else {
    head = '<th>Name</th><th>Type</th><th>Fact</th>';
    body = rows
      .map(
        (r) =>
          `<tr><td>${r.emoji} ${esc(r.name)}</td><td>${esc(r.type)}</td><td>${esc(r.fact)}</td></tr>`,
      )
      .join('');
  }
  return `<div class="mini-study"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}
