// Transient effects: queued reward cards, the mascot speech bubble and confetti.
import { $ } from '../util.js';

const fxQ = [];
let fxBusy = false,
  fxTimer = null;

export function fx(html, ms, sound) {
  fxQ.push({ html, ms, sound });
  runFx();
}

function runFx() {
  if (fxBusy || !fxQ.length) return;
  fxBusy = true;
  const f = fxQ.shift(),
    d = $('#fxLayer');
  d.innerHTML = f.html;
  d.hidden = false;
  if (f.sound) f.sound();
  fxTimer = setTimeout(() => {
    d.hidden = true;
    d.innerHTML = '';
    fxBusy = false;
    runFx();
  }, f.ms);
}

export function clearFx() {
  fxQ.length = 0;
  clearTimeout(fxTimer);
  fxBusy = false;
  const d = $('#fxLayer');
  d.hidden = true;
  d.innerHTML = '';
}

let sayTimer = null;

export function say(t) {
  const b = $('#bubble');
  b.textContent = t;
  b.classList.remove('pop', 'hide');
  void b.offsetWidth;
  b.classList.add('pop');
  clearTimeout(sayTimer);
  sayTimer = setTimeout(() => b.classList.add('hide'), 3000);
}

export function confetti(count) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = $('#confetti'),
    c = cv.getContext('2d');
  cv.hidden = false;
  const W = (cv.width = innerWidth),
    H = (cv.height = innerHeight);
  const cols = ['#ff4f79', '#ffb627', '#1fae6c', '#7c6cf2', '#3d9fd3', '#ff8a3d'];
  const ps = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: -20 - Math.random() * H * 0.5,
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4,
    r: Math.random() * 6.3,
    s: 6 + Math.random() * 8,
    c: cols[Math.floor(Math.random() * cols.length)],
  }));
  const t0 = performance.now();
  (function f(t) {
    c.clearRect(0, 0, W, H);
    ps.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.r += 0.1;
      c.save();
      c.translate(p.x, p.y);
      c.rotate(p.r);
      c.fillStyle = p.c;
      c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      c.restore();
    });
    if (t - t0 < 3200) requestAnimationFrame(f);
    else {
      c.clearRect(0, 0, W, H);
      cv.hidden = true;
    }
  })(t0);
}
