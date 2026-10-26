// The welcome screen: quest thumbnails and the Study / Report / New session buttons.
import { IGEO, INDIA_OUTLINE, MAP_H, MAP_W, REGIONS } from '../../data/india.js';
import { KDIST, KMAP, KPLACE } from '../../data/kerala.js';
import { WCONT, WCOUNTRY, WMAP, WSEA } from '../../data/world.js';
import { renderReport } from './report.js';
import { openSetup, setup } from './setup.js';
import { renderStudy } from './study.js';
import { save, state } from '../state.js';
import { confirmBox } from '../ui/modal.js';
import { show } from '../ui/nav.js';
import { $, el } from '../util.js';

/** Draw the small map picture on each quest button. */
export function renderQuestMaps() {
  const box = (svg, w, h, pad) =>
    svg.setAttribute('viewBox', `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`);
  let svg = $('#qm-states');
  box(svg, MAP_W, MAP_H, 10);
  REGIONS.forEach((r) =>
    el('path', { d: r.d, fill: r.color, stroke: '#fff', 'stroke-width': 2.5 }, svg),
  );
  svg = $('#qm-igeo');
  box(svg, MAP_W, MAP_H, 10);
  el('path', { d: INDIA_OUTLINE, fill: '#fff3d3', stroke: '#c99a4c', 'stroke-width': 4 }, svg);
  IGEO.forEach((f) => {
    if (f.kind === 'river')
      el(
        'path',
        { d: f.d, fill: 'none', stroke: '#1e78d6', 'stroke-width': 9, 'stroke-linecap': 'round' },
        svg,
      );
    else if (f.kind === 'range')
      el(
        'path',
        {
          d: f.d,
          fill: 'none',
          stroke: '#8a5a2b',
          'stroke-width': 13,
          'stroke-linecap': 'round',
          'stroke-opacity': 0.75,
        },
        svg,
      );
  });
  svg = $('#qm-kdist');
  box(svg, KMAP.w, KMAP.h, 0);
  svg.setAttribute('viewBox', '170 40 420 960');
  KDIST.forEach((r) =>
    el('path', { d: r.d, fill: r.color, stroke: '#fff', 'stroke-width': 3 }, svg),
  );
  svg = $('#qm-kplace');
  svg.setAttribute('viewBox', '170 40 420 960');
  el('path', { d: KMAP.outline, fill: '#d9f2c9', stroke: '#5fb85a', 'stroke-width': 4 }, svg);
  KPLACE.forEach((f) => {
    if (f.kind === 'river')
      el(
        'path',
        { d: f.d, fill: 'none', stroke: '#1e78d6', 'stroke-width': 8, 'stroke-linecap': 'round' },
        svg,
      );
    else if (f.kind === 'point') {
      const [x, y] = f.pts[0][0];
      el(
        'circle',
        { cx: x, cy: y, r: 13, fill: '#fff', stroke: '#e08a00', 'stroke-width': 5 },
        svg,
      );
    }
  });
  const wbox = (svg) => svg.setAttribute('viewBox', `-5 -5 ${WMAP.w + 10} ${WMAP.h + 10}`);
  svg = $('#qm-wcont');
  wbox(svg);
  WCONT.forEach((r) =>
    el('path', { d: r.d, fill: r.color, stroke: '#fff', 'stroke-width': 1.5 }, svg),
  );
  svg = $('#qm-wsea');
  wbox(svg);
  el('path', { d: WMAP.sphere, fill: '#9bd6f2' }, svg);
  el('path', { d: WMAP.outline, fill: '#fff3d3', stroke: '#c99a4c', 'stroke-width': 1.5 }, svg);
  WSEA.forEach((f) =>
    f.pts.forEach((s) => {
      const [x, y] = s[0];
      el(
        'circle',
        {
          cx: x,
          cy: y,
          r: f.type === 'Ocean' ? 16 : 11,
          fill: '#fff',
          stroke: f.type === 'Ocean' ? '#1e78d6' : '#ff4f79',
          'stroke-width': 5,
        },
        svg,
      );
    }),
  );
  svg = $('#qm-wcountry');
  wbox(svg);
  el('path', { d: WMAP.outline, fill: '#efe6d0', stroke: '#c99a4c', 'stroke-width': 1.5 }, svg);
  WCOUNTRY.forEach((r) =>
    el('path', { d: r.d, fill: r.color, stroke: '#fff', 'stroke-width': 1 }, svg),
  );
}

/** Wire the quest, study, report and new-session buttons. */
export function initHome() {
  document.querySelectorAll('[data-play]').forEach(
    (b) =>
      (b.onclick = () => {
        openSetup(b.dataset.play);
      }),
  );
  $('#btnReport').onclick = () => renderReport();
  $('#btnStudy').onclick = () => renderStudy('states');
  $('#btnNew').onclick = () =>
    confirmBox(
      'Delete all names and scores?',
      'The game removes every player, score and badge from this device. You cannot undo this.',
      'Yes, start fresh',
      () => {
        state.store = { players: {}, order: [], muted: state.store.muted };
        save();
        setup.names = [];
        setup.n = 1;
        state.S = null;
        state.T = null;
        $('#kidCount').value = '';
        $('#kidCountErr').hidden = true;
        $('#hello').textContent = 'All clean! Pick a map quest to start.';
        show('home');
      },
    );
}
