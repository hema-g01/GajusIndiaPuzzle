// Data checks: every quest has well-formed items, and the data still matches the original single-file game.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { PACKS, MAPS } from '../js/packs.js';
import * as india from '../data/india.js';
import * as kerala from '../data/kerala.js';
import * as world from '../data/world.js';

const SHAPE_FIELDS = ['name', 'type', 'emoji', 'fact', 'd', 'color', 'cx', 'cy', 'area'];
const FEATURE_FIELDS = ['name', 'type', 'emoji', 'fact', 'kind', 'pts', 'lp'];

test('every quest has items with the fields its kind needs', () => {
  for (const pack of Object.values(PACKS)) {
    assert.ok(pack.items.length > 0, `${pack.id} has items`);
    const need = pack.kind === 'shape' ? SHAPE_FIELDS : FEATURE_FIELDS;
    for (const item of pack.items) {
      for (const f of need)
        assert.ok(item[f] !== undefined && item[f] !== '', `${pack.id}/${item.name}: missing ${f}`);
    }
  }
});

test('item names are unique within a quest', () => {
  for (const pack of Object.values(PACKS)) {
    const names = pack.items.map((i) => i.name);
    assert.equal(new Set(names).size, names.length, `${pack.id} has duplicate names`);
  }
});

test('every quest points at a real map', () => {
  for (const pack of Object.values(PACKS)) assert.ok(MAPS[pack.map], `${pack.id} -> ${pack.map}`);
});

test('shape pieces get a bounding box', () => {
  for (const pack of Object.values(PACKS).filter((p) => p.kind === 'shape')) {
    for (const item of pack.items) assert.equal(item.bbox.length, 4, `${pack.id}/${item.name}`);
  }
});

test('quiz fields exist for every item of the quests that ask them', () => {
  for (const f of ['capital', 'language', 'dance', 'food']) {
    for (const r of india.REGIONS) assert.ok(r[f], `${r.name}: ${f}`);
  }
});

// The original game stays in legacy/ for reference. While it is there, the data must not drift from it.
const legacy = new URL('../legacy/gajus-india-puzzle.original.html', import.meta.url);
test('data matches the original single-file game', { skip: !fs.existsSync(legacy) }, () => {
  const lines = fs.readFileSync(legacy, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.startsWith('const MAP_W='));
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(
    lines
      .slice(start, start + 11)
      .join('\n')
      .replace(/\bconst\b/g, 'var'),
    ctx,
  );
  const mine = { ...india, ...kerala, ...world };
  for (const [name, value] of Object.entries(mine)) {
    // bbox is computed at load time by packs.js, so compare without it
    const strip = (v) => JSON.parse(JSON.stringify(v, (k, x) => (k === 'bbox' ? undefined : x)));
    assert.deepEqual(strip(value), strip(ctx[name]), name);
  }
  assert.equal(Object.keys(mine).length, 12);
});
