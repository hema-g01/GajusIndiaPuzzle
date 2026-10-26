// The one place that owns mutable game state. Import `state` and read/write its fields;
// never keep a second copy of these in another module.
//   P  current quest (a PACKS entry)        S  current round (players, level, mode, results)
//   T  current child's turn (queue, score)  store  saved players, persisted to localStorage
import { AVATARS, STORAGE_KEY } from './config.js';

export const state = {
  P: null,
  S: null,
  T: null,
  store: { players: {}, order: [], muted: false },
  reportFrom: 'home',
  studyFrom: 'home',
};

try {
  const s = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (s && s.players) Object.assign(state.store, s);
} catch (e) {}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.store));
  } catch (e) {}
}

export function rec(name) {
  if (!state.store.players[name]) {
    state.store.players[name] = {
      avatar: AVATARS[state.store.order.length % AVATARS.length],
      games: [],
      errors: {},
    };
    state.store.order.push(name);
  }
  return state.store.players[name];
}
