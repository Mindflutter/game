// ===== main =====
// The frame loop and boot.

// ---------- the loop ----------
let last = performance.now();
let fps = 60;
function frame(now) {
  // Seconds since the previous frame. Capped, so that switching tabs
  // for a minute doesn't teleport everything across the screen.
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (dt > 0) fps += (1 / dt - fps) * 0.1;    // smoothed, or it's unreadable

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// ---------- boot ----------
// Query params are platform business: game/ never reads a URL, so the seed is
// passed in as an argument. ?seed=<n> replays an exact dive; without it, a
// fresh random seed is chosen and recorded in currentSeed.
const params = new URLSearchParams(location.search);
const seedParam = params.get('seed');

reset(seedParam === null ? undefined : Number(seedParam) >>> 0);
screen = 'title';       // reset() leaves us playing; the game opens on the menu
