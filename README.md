# Gaju's India Puzzle

A map puzzle game for children. Drag states, districts, continents and countries onto the map, answer a few questions, and learn with Gaju the elephant. It is plain HTML, CSS and JavaScript (ES modules): **no build step, no dependencies**.

## Run it

ES modules do not load from `file://`, so open the game through a web server:

```bash
npx serve .
```

or, with Python:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Publish on GitHub Pages

1. Push this folder to a GitHub repository (the folder that holds `index.html` must be the repo root).
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment** choose **Deploy from a branch**, pick `main` and `/ (root)`, then save.
4. The game appears at `https://<user>.github.io/<repo>/` after a minute.

Every path in the project is relative, so it works from a sub-path like `/<repo>/` without changes. `.nojekyll` tells Pages to serve the files as they are.

## Project layout

```
index.html            page shell: markup for every screen, links the CSS and one script
css/                  styles, loaded in numeric order (see "CSS" below)
data/                 map data: shapes, facts, capitals. Edit content here
  india.js            India outline, 36 states and territories, rivers and mountains
  kerala.js           Kerala outline, 14 districts, rivers and places
  world.js            world outline, continents, countries, oceans and straits
js/
  main.js             entry point: calls each screen's init function
  config.js           levels, badges, quiz questions, colours, avatars
  packs.js            the seven quests (PACKS) and the three maps (MAPS)
  state.js            the one object that holds game state, plus saving to localStorage
  util.js             small DOM and formatting helpers
  voice.js            text-to-speech for Gaju
  screens/            one file per screen: home, setup, study, report, results, tutorial
  game/               the playing field: round, map, features, tray, drag, questions, scoring
  ui/                 shared pieces: nav (screens and back buttons), modal, effects, hud
legacy/               the original single-file game, kept for reference
```

### How the code fits together

- **State lives in one place.** `js/state.js` exports `state` with `P` (current quest), `S` (current round), `T` (current child's turn) and `store` (saved players). Read and write it from any module; never copy it.
- **Screens are shown by id.** `show('home')` in `js/ui/nav.js` reveals `#scr-home` and hides the others.
- **Each screen has an `init...()` function** that attaches its event handlers once. `main.js` calls them in order. Importing a module never touches the page by itself.
- **A quest is data.** Each entry in `PACKS` (`js/packs.js`) names a map, an item list and the settings for that quest. To add a quest, add the data file, one `PACKS` entry, a quest button in `index.html` and a tutorial entry.

### CSS

The files are slices of the original stylesheet in their original order, and later files deliberately override earlier ones (`10-welcome.css` refines `03-home.css`, and so on). Keep the numeric order. Merging the overrides into one rule per selector is a good future clean-up.

## Saved data

Players, scores, badges and the mute switch are stored in the browser's `localStorage` under the key `gaju-india-puzzle-v1`. Nothing leaves the device.

## Checks

```bash
npm test
```

runs the data checks in `tests/` with Node's built-in test runner.
