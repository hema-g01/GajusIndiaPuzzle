// Static game content that is not map data: levels, badges, questions, colours, avatars.

export const STORAGE_KEY = 'gaju-india-puzzle-v1';

export const TYPE_COLOR = {
  State: '#7c6cf2',
  'Union Territory': '#ff4f79',
  District: '#1fae6c',
  River: '#3d8fe0',
  'Mountain range': '#8a5a2b',
  'Mountain peak': '#7c6cf2',
  Dam: '#2ea89a',
  'Hydroelectric power station': '#e0a000',
  'Tourist centre': '#ff4f79',
  Continent: '#7c6cf2',
  Country: '#ff8a3d',
  Ocean: '#3d8fe0',
  Strait: '#2ea89a',
};

export const LEVELS = {
  1: {
    title: 'Level 1',
    name: 'Baby Elephant',
    size: 0.5,
    color: '#1fae6c',
    lines: true,
    qs: [],
    tol: [50, 0.45],
    desc: 'Dotted lines show each place.',
  },
  2: {
    title: 'Level 2',
    name: 'Young Elephant',
    size: 0.66,
    color: '#3d9fd3',
    lines: true,
    qs: ['capital'],
    tol: [40, 0.38],
    desc: 'Dotted lines help. Then pick the capital.',
  },
  3: {
    title: 'Level 3',
    name: 'Big Elephant',
    size: 0.83,
    color: '#7c6cf2',
    lines: false,
    qs: ['capital', 'language'],
    tol: [34, 0.33],
    desc: 'No dotted lines. Capital and language.',
  },
  4: {
    title: 'Level 4',
    name: 'Mighty Elephant',
    size: 1,
    color: '#ff4f79',
    lines: false,
    qs: ['capital', 'language', 'dance', 'food'],
    tol: [32, 0.3],
    desc: 'No dotted lines. Capital, language, dance and food.',
  },
};

export const lvlName = (l) => `${LEVELS[l].title} · ${LEVELS[l].name}`;

export const BADGES = [
  { k: 'hat', n: 3, emoji: '🏏', name: 'Hat-Trick Hero' },
  { k: 'tiger', n: 5, emoji: '🐯', name: 'High-Five Tiger' },
  { k: 'maharaja', n: 10, emoji: '👑', name: 'Map Maharaja' },
  { k: 'himalaya', n: 15, emoji: '🏔️', name: 'Himalaya Hero' },
];

export const PEACOCK = { k: 'peacock', emoji: '🦚', name: 'Perfect Peacock' };

export const ALL_BADGES = [...BADGES, PEACOCK];

export const badgeDesc = (b) => (b.n ? `${b.n} correct in a row` : 'All correct in one game');

export const Q = {
  capital: { label: 'Capital', ask: (n) => `What is the capital of ${n}?` },
  language: { label: 'Language', ask: (n) => `Which language do many people speak in ${n}?` },
  dance: { label: 'Dance form', ask: (n) => `Which dance form comes from ${n}?` },
  food: { label: 'Famous food', ask: (n) => `Which food is famous in ${n}?` },
};

export const AVATARS = ['🐯', '🦚', '🐘', '🐒', '🦜', '🐢', '🐇', '🦋', '🐬', '🦊', '🐼', '🐸'];

export const CHEERS = [
  'Super! ⭐',
  'Well done!',
  'Yay! You got it!',
  'Fantastic!',
  'Great job!',
  'Wow, correct!',
  'You are a map star!',
];

const KD_FIELDS = [
  ['tour', '📸 Tourist place'],
  ['river', '🌊 River'],
  ['mount', '⛰️ Mountain'],
  ['hydro', '⚡ Hydroelectric project'],
];

export const kdList = (r) => KD_FIELDS.filter(([k]) => r[k]).map(([k, l]) => [l, r[k]]);

export const kdSpeech = (r) =>
  KD_FIELDS.filter(([k]) => r[k])
    .map(([k, l]) => `${l.split(' ').slice(1).join(' ')}: ${r[k]}.`)
    .join(' ');
