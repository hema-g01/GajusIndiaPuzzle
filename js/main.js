// Entry point. Every screen exposes an init function that attaches its event handlers;
// this file calls them once, draws the home screen and shows it.
import { initTapMode } from './game/features.js';
import { initHome, renderQuestMaps } from './screens/home.js';
import { initSetup } from './screens/setup.js';
import { initHud } from './ui/hud.js';
import { initNav, show } from './ui/nav.js';

renderQuestMaps();
initHome();
initSetup();
initTapMode();
initHud();
initNav();
show('home');
