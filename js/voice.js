// Text-to-speech for Gaju. Respects the mute switch stored in state.
import { state } from './state.js';

let voices = [];

function loadVoices() {
  try {
    voices = speechSynthesis.getVoices() || [];
  } catch (e) {}
}

if ('speechSynthesis' in window) {
  loadVoices();
  try {
    speechSynthesis.onvoiceschanged = loadVoices;
  } catch (e) {}
}

export function speak(text) {
  if (state.store.muted || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v =
      voices.find((x) => /en[-_]IN/i.test(x.lang)) ||
      voices.find((x) => /^en[-_](GB|US)/i.test(x.lang)) ||
      voices.find((x) => /^en/i.test(x.lang));
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else u.lang = 'en-IN';
    u.rate = 0.88;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch (e) {}
}

export function hush() {
  try {
    speechSynthesis.cancel();
  } catch (e) {}
}
