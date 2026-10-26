// Map definitions (MAPS) and the seven quests (PACKS) built from the data files.
import { IGEO, INDIA_OUTLINE, MAP_H, MAP_W, REGIONS } from '../data/india.js';
import { KDIST, KMAP, KPLACE } from '../data/kerala.js';
import { WCONT, WCOUNTRY, WMAP, WSEA } from '../data/world.js';
import { LEVELS } from './config.js';
import { state } from './state.js';

const bboxOf = (str) => {
  const v = str.match(/-?\d+(\.\d+)?/g).map(Number);
  const a = [1e9, 1e9, -1e9, -1e9];
  for (let i = 0; i < v.length; i += 2) {
    a[0] = Math.min(a[0], v[i]);
    a[2] = Math.max(a[2], v[i]);
    a[1] = Math.min(a[1], v[i + 1]);
    a[3] = Math.max(a[3], v[i + 1]);
  }
  return a;
};

function fixBoxes(list) {
  list.forEach((r) => {
    const parts = r.d
      .split('M')
      .filter(Boolean)
      .map((p) => bboxOf(p));
    const pad = Math.max(6, Math.sqrt(r.area) * 0.15);
    let main = parts.filter(
      (b) => r.cx >= b[0] - pad && r.cx <= b[2] + pad && r.cy >= b[1] - pad && r.cy <= b[3] + pad,
    );
    if (!main.length) main = parts;
    const all = bboxOf(r.d),
      spread = Math.max(all[2] - all[0], all[3] - all[1]);
    r.bbox =
      spread > 3 * Math.sqrt(r.area) + 40
        ? main.reduce((a, b) => [
            Math.min(a[0], b[0]),
            Math.min(a[1], b[1]),
            Math.max(a[2], b[2]),
            Math.max(a[3], b[3]),
          ])
        : all;
  });
}

fixBoxes(REGIONS);
fixBoxes(KDIST);
fixBoxes(WCONT);
fixBoxes(WCOUNTRY);

export const MAPS = {
  india: {
    w: MAP_W,
    h: MAP_H,
    outline: INDIA_OUTLINE,
    neighbors: [],
    base: REGIONS,
    place: 'India',
  },
  kerala: {
    w: KMAP.w,
    h: KMAP.h,
    outline: KMAP.outline,
    neighbors: KMAP.neighbors,
    base: KDIST,
    place: 'Kerala',
  },
  world: {
    w: WMAP.w,
    h: WMAP.h,
    outline: WMAP.outline,
    sphere: WMAP.sphere,
    neighbors: [],
    base: WCONT,
    place: 'the world',
  },
};

export const PACKS = {
  states: {
    id: 'states',
    kind: 'shape',
    map: 'india',
    title: 'Indian States and Territories',
    short: 'States',
    emoji: '🗺️',
    color: '#ff4f79',
    items: REGIONS,
    word: 'state',
    label: 'Capital',
    labelIcon: '🏛',
    secs: { 1: 10, 2: 14, 3: 18, 4: 26 },
  },
  igeo: {
    id: 'igeo',
    kind: 'feature',
    map: 'india',
    title: 'Mountains and Rivers of India',
    short: 'Mountains and rivers',
    emoji: '🏔️',
    color: '#3d9fd3',
    items: IGEO,
    word: 'place',
    cfg: { qs: [], tol: 34 },
    secs: 12,
  },
  kdist: {
    id: 'kdist',
    kind: 'shape',
    map: 'kerala',
    title: 'Kerala: Districts',
    short: 'Kerala districts',
    emoji: '🌴',
    color: '#1fae6c',
    items: KDIST,
    word: 'district',
    label: 'Headquarters',
    labelIcon: '🏢',
    cfg: { lines: true, qs: [], tol: [30, 0.4] },
    secs: 10,
  },
  kplace: {
    id: 'kplace',
    kind: 'feature',
    map: 'kerala',
    title: 'Kerala: Important Places',
    short: 'Kerala places',
    emoji: '🏞️',
    color: '#ffb627',
    items: KPLACE,
    word: 'place',
    cfg: { qs: [], tol: 30 },
    secs: 12,
  },
  wcont: {
    id: 'wcont',
    kind: 'shape',
    map: 'world',
    title: 'World: Continents',
    short: 'Continents',
    emoji: '🌍',
    color: '#7c6cf2',
    items: WCONT,
    word: 'continent',
    cfg: { lines: true, qs: [], tol: [40, 0.3] },
    nearest: true,
    secs: 10,
  },
  wsea: {
    id: 'wsea',
    kind: 'feature',
    map: 'world',
    title: 'World: Oceans and Straits',
    short: 'Oceans and straits',
    emoji: '🌊',
    color: '#3d9fd3',
    items: WSEA,
    word: 'place',
    cfg: { qs: [], tol: 26 },
    secs: 12,
  },
  wcountry: {
    id: 'wcountry',
    kind: 'shape',
    map: 'world',
    title: 'World: Major Countries',
    short: 'Major countries',
    emoji: '🌐',
    color: '#ff8a3d',
    items: WCOUNTRY,
    word: 'country',
    label: 'Capital',
    labelIcon: '🏛',
    cfg: { lines: true, qs: [], tol: [30, 0.35] },
    nearest: true,
    secs: 10,
  },
};

Object.values(PACKS).forEach((p) => (p.R = Object.fromEntries(p.items.map((i) => [i.name, i]))));

export const CFG = () => (state.P.id === 'states' ? LEVELS[state.S.level] : state.P.cfg);

export const ekey = (pack, n) => (pack === 'states' ? n : pack + '|' + n);

state.P = PACKS.states;
