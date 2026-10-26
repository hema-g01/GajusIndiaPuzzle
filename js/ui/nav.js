// Screen switching and the global Home / Back buttons.
import { stopTimer } from '../game/round.js';
import { setup, showStep } from '../screens/setup.js';
import { state } from '../state.js';
import { clearFx } from './effects.js';
import { closeModal, confirmBox } from './modal.js';
import { $ } from '../util.js';
import { hush } from '../voice.js';

export function show(id) {
  document.querySelectorAll('.screen').forEach((s) => (s.hidden = s.id !== 'scr-' + id));
  $('#muteFab').hidden = id === 'game';
  window.scrollTo(0, 0);
}

export function curScreen() {
  return (document.querySelector('.screen:not([hidden])') || { id: 'scr-home' }).id.replace(
    'scr-',
    '',
  );
}

export function goHome() {
  stopTimer();
  closeModal();
  hush();
  clearFx();
  show('home');
}

export function backRow(w) {
  return `<div class="back-row"><button class="btn white small" data-back="${w}">← Back</button><button class="btn white small" data-go="home">🏠 Home</button></div>`;
}

function toSetup() {
  stopTimer();
  closeModal();
  hush();
  clearFx();
  if (!setup.names.length) {
    goHome();
    return;
  }
  setup.pack = state.P.id;
  $('#questTag').textContent = state.P.emoji + ' ' + state.P.title;
  showStep('Mode');
  show('setup');
}

const stopRound = () =>
  confirmBox('Stop this round?', 'Finished turns stay in the progress report.', 'Stop', toSetup);

/** Wire the data-go and data-back buttons that appear on many screens. */
export function initNav() {
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-go]');
    if (!g || g.dataset.go !== 'home') return;
    const mid =
      state.S &&
      ['turn', 'end'].includes(curScreen()) &&
      state.S.results.length > 0 &&
      state.S.results.length < state.S.players.length;
    if (mid)
      confirmBox(
        'Go to the main page?',
        'Finished turns stay in the progress report.',
        'Go home',
        goHome,
      );
    else goHome();
  });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-back]');
    if (!b) return;
    const w = b.dataset.back;
    if (w === 'turn') {
      if (state.S && state.S.turn > 0) stopRound();
      else toSetup();
    } else if (w === 'end') {
      if (state.S && state.S.turn < state.S.players.length - 1) stopRound();
      else toSetup();
    } else if (w === 'results' || w === 'pieces') toSetup();
    else if (w === 'report') {
      if (state.reportFrom === 'home' || !document.getElementById('scr-' + state.reportFrom))
        goHome();
      else show(state.reportFrom);
    } else if (w === 'study') {
      if (state.studyFrom === 'home' || !document.getElementById('scr-' + state.studyFrom))
        goHome();
      else show(state.studyFrom);
    }
  });
}
