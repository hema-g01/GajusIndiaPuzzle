// Game-screen buttons: mute, help, back and exit.
import { stopTimer, turnIntro } from '../game/round.js';
import { showTutorial } from '../screens/tutorial.js';
import { save, state } from '../state.js';
import { confirmBox } from './modal.js';
import { goHome } from './nav.js';
import { $ } from '../util.js';
import { hush } from '../voice.js';

function syncMute() {
  document.querySelectorAll('.mute-btn').forEach((b) => {
    b.textContent = state.store.muted ? '🔇' : '🔊';
    b.title = state.store.muted ? 'Voice off: tap to unmute' : 'Voice on: tap to mute';
  });
}

/** Wire the mute, help, exit and back buttons. */
export function initHud() {
  syncMute();
  document.querySelectorAll('.mute-btn').forEach(
    (b) =>
      (b.onclick = () => {
        state.store.muted = !state.store.muted;
        save();
        syncMute();
        if (state.store.muted) hush();
      }),
  );
  $('#btnHelp').onclick = () => {
    if (!$('#modal').hidden) return;
    const t0 = Date.now();
    showTutorial(() => {
      state.T.start += Date.now() - t0;
    });
  };
  $('#btnExit').onclick = () => {
    if (!$('#modal').hidden) return;
    confirmBox('Stop this game?', 'The scores of this turn are not saved.', 'Stop', goHome);
  };
  $('#btnBack').onclick = () => {
    if (!$('#modal').hidden) return;
    confirmBox('Go back?', 'This turn starts again from the beginning.', 'Go back', () => {
      stopTimer();
      hush();
      turnIntro();
    });
  };
}
