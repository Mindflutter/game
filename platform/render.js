// ===== render (platform) =====
// Canvas drawing. Rewritten on a port.

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let scale = 1, offX = 0, offY = 0;
// Takes a size so the D29 check can play the same dive at three window sizes;
// the listener wraps it, or the resize *event* would arrive as `w`.
function resize(w = window.innerWidth, h = window.innerHeight) {
  canvas.width = w;
  canvas.height = h;
  scale = Math.min(canvas.width / ARENA_W, canvas.height / ARENA_H);
  offX = (canvas.width  - ARENA_W * scale) / 2;
  offY = (canvas.height - ARENA_H * scale) / 2;
}
window.addEventListener('resize', () => resize());
resize();

// ---------- draw: paint one frame ----------
function circle(x, y, r, fill, glow, blur = 20) {
  ctx.shadowBlur = blur;
  ctx.shadowColor = glow;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// Where your shots will go: a dashed line out to the edge of the ring, fading
// as it goes so it guides the eye without competing with the enemies, and a
// crosshair sitting exactly where the shots will die.
function drawAimLine() {
  const dx = aim.x - player.x, dy = aim.y + cameraY - player.y;   // aim is in the view
  const d = Math.hypot(dx, dy) || 1;
  const ex = player.x + (dx / d) * player.range;
  const ey = player.y + (dy / d) * player.range;

  const fade = ctx.createLinearGradient(player.x, player.y, ex, ey);
  fade.addColorStop(0, 'rgba(159, 247, 255, 0.30)');
  fade.addColorStop(1, 'rgba(159, 247, 255, 0.04)');

  ctx.save();
  ctx.setLineDash([7, 9]);
  ctx.strokeStyle = fade;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(player.x + (dx / d) * (player.r + 6), player.y + (dy / d) * (player.r + 6));
  ctx.lineTo(ex, ey);
  ctx.stroke();
  ctx.restore();

  // A small ring with four ticks, brighter than the line so the end reads
  // clearly without drawing the eye off the enemies.
  ctx.strokeStyle = 'rgba(159, 247, 255, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  for (const [tx, ty] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.moveTo(ex + tx * 6, ey + ty * 6);
    ctx.lineTo(ex + tx * 10, ey + ty * 10);
  }
  ctx.stroke();
}

// A CSS font string, so it lives here and not in game/: it means nothing in
// the layer that survives to Rust, and both of its readers are in this file.
const CARD_DESC_FONT = '13px system-ui, sans-serif';

// Seconds a boost on the floor blinks before it is gone (D86): the warning.
// Drawing only, so it lives here.
const BOOST_BLINK = 2;

// Whole numbers stay whole; anything fractional gets two places at most, so a
// 0.30000000000000004 cannot reach the screen.
const fmtStat = n => (Number.isInteger(n) ? n : +n.toFixed(2));

// The widest mod description, in pixels, at the font the cards draw it in.
// A mod is a line of prose in a fixed-width box, and nothing in the game state
// can see it running off the edge. The check calls this; `measureText` is
// canvas, so the rule lives in the browser suite.
function widestModDesc() {
  ctx.font = CARD_DESC_FONT;
  return Math.max(...MODS.map(m => ctx.measureText(m.desc).width));
}

// The layer end's pick (D85): the cards, a card marked, and Continue. The
// wording is Claude's placeholder (ideas.md -> friendlier end-of-dive messages).
function drawModCards() {
  dimArena();

  // The layer just cleared. A check can open the cards with no plan behind them.
  const entry = plan[batchIndex - 1];
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '30px system-ui, sans-serif';
  ctx.fillText(entry ? LAYERS[entry.layer].name.toUpperCase() + ' CLEARED' : 'LAYER END',
               ARENA_W / 2, ARENA_H / 2 - 130);
  ctx.fillStyle = '#5d8b99';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('a valuable mod, for the rest of the dive', ARENA_W / 2, ARENA_H / 2 - 105);

  choices.forEach((u, i) => {
    const { x, y, w, h } = cardRect(i, choices.length);
    const on = i === choiceIndex;

    ctx.fillStyle = on ? 'rgba(28, 74, 92, 0.96)' : 'rgba(16, 44, 58, 0.92)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = on ? '#4ff0ff' : '#2b6b7d';
    ctx.lineWidth = on ? 2 : 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    // An ordinary mod comes at the bigger step here, and says so.
    ctx.fillStyle = '#bffcff';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText(u.end ? u.name : u.name + ' \u00d7' + END_STEP, x + w / 2, y + 38);

    ctx.fillStyle = on ? '#9ef7ff' : '#7fb0c0';
    ctx.font = CARD_DESC_FONT;
    ctx.fillText(u.desc, x + w / 2, y + 64);

    // The numbers (D52): the change worked out from the mod itself, the stack
    // from modCounts, so a repeated card reads differently from a fresh one.
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = on ? '#6fd8e8' : '#4d7a8a';
    // No slice: the card draws every row the mod moves, and a check holds the
    // pool to MOD_ROWS, so a mod that moved a third stat fails the suite rather
    // than quietly losing a number off the bottom of the card.
    modPreview(u, cardStep(u)).forEach((c, n) => {
      ctx.fillText(c.stat + '  ' + fmtStat(c.from) + ' → ' + fmtStat(c.to),
                   x + w / 2, y + 90 + n * 17);
    });

    ctx.fillStyle = on ? '#4d7a8a' : '#3d6270';
    ctx.fillText('held ' + (modCounts[u.name] || 0) + ' of ' + u.max, x + w / 2, y + 132);

    ctx.fillStyle = on ? '#4ff0ff' : '#2b6b7d';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(on ? '[ MARKED ]' : '[ ' + (i + 1) + ' ]', x + w / 2, y + 160);
  });

  const c = continueRect();
  ctx.fillStyle = 'rgba(28, 74, 92, 0.96)';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = '#4ff0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
  ctx.fillStyle = '#bffcff';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('CONTINUE', ARENA_W / 2, c.y + c.h / 2 + 6);

  ctx.fillStyle = '#5d8b99';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(choices.length
    ? 'arrows, click or 1 2 3 to mark a card,  Enter or Continue to take it'
    : 'nothing left to choose:  Enter or Continue to go on', ARENA_W / 2, MOD_HINT_Y);
}

// Where the mod screen's bottom hint sits: under Continue, which sits under
// the cards (`continueRect()` in content.js owns both boxes). Taller cards push
// all of it down, so a check holds the hint inside the view.
const MOD_HINT_Y = continueRect().y + continueRect().h + 34;

// So a silent game can tell you why it is silent.
function audioStatus() {
  if (muted) return '   [M] muted';
  if (!audio) return '   sound: press a key';
  if (audio.state !== 'running') return '   sound: ' + audio.state;
  return '';
}

// Dims the whole window, margin included: the margin is painted the water's
// colour, so a dim limited to the view would leave it as bright bands.
function dimArena(alpha = 0.82) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = 'rgba(4, 7, 13, ' + alpha + ')';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

// Paints over whatever spilled past the view -- an arrival just outside it, a
// spark, the shake -- in the water's colour. Not a clip: a clip would also
// stop the dim screens from reaching the margin.
function coverMargins() {
  const vw = ARENA_W * scale, vh = ARENA_H * scale;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = waterColor();
  ctx.fillRect(0, 0, offX, canvas.height);
  ctx.fillRect(offX + vw, 0, canvas.width - offX - vw, canvas.height);
  ctx.fillRect(0, 0, canvas.width, offY);
  ctx.fillRect(0, offY + vh, canvas.width, canvas.height - offY - vh);
  ctx.restore();
}

// The water: specks carried by the current, so it shows flowing even while a
// fight holds the camera still (D58). Drawn in the view, scrolled by `waterY`.
// PLACEHOLDER GRAPHICS -- the moving background is to be replaced with real
// art later (ideas.md -> "A lively background"); only the flow is settled.
// Hashed from the grid cell, never from rng(): drawing must not consume the
// dive's seeded sequence, or the same seed replays differently depending on
// what happened to be on screen.
const SPECK_CELL = 90;
function drawSpecks() {
  ctx.fillStyle = 'rgba(159, 247, 255, 0.18)';
  const top = Math.floor(waterY / SPECK_CELL);
  for (let j = top; j <= top + ARENA_H / SPECK_CELL + 1; j++) {
    for (let i = 0; i < ARENA_W / SPECK_CELL; i++) {
      const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
      const f = h - Math.floor(h);                   // 0..1, fixed per cell
      if (f < 0.35) ctx.fillRect(i * SPECK_CELL + (f * 200) % SPECK_CELL,
                                 j * SPECK_CELL + (f * 530) % SPECK_CELL - waterY, 2, 2);
    }
  }
}

// The play field. draw() has already set up arena coordinates and the shake.
function drawField() {
  drawSpecks();                  // the water, in the view: it flows on its own

  // World draws go through the camera; the HUD below does not.
  ctx.save();
  ctx.translate(0, -cameraY);

  // How far your shots reach — the player needs to see this.
  ctx.strokeStyle = 'rgba(79, 240, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.range, 0, Math.PI * 2);
  ctx.stroke();

  if (screen === 'playing') drawAimLine();

  // Gems fly to you and never fade (D35), so there is no blink to warn of it.
  for (const g of gems) circle(g.x, g.y, g.r, '#a8ffd8', '#2affb0', 14);

  // What kills drop besides gems (D84, D86). PLACEHOLDER GRAPHICS: a mod is a
  // gold coin flying in; a boost a magenta diamond where it fell, blinking out
  // over its last BOOST_BLINK seconds.
  for (const d of drops) {
    if (d.mod) circle(d.x, d.y, d.r, '#fff1b8', '#ffc400', 24);
    else if (d.life > BOOST_BLINK || Math.floor(d.life * 8) % 2 === 0) {
      const k = d.r * 1.7;
      ctx.save();
      ctx.fillStyle = '#ffd1fb';
      ctx.shadowColor = '#ff3df2';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - k);
      ctx.lineTo(d.x + k, d.y);
      ctx.lineTo(d.x, d.y + k);
      ctx.lineTo(d.x - k, d.y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  // A wounded enemy shrinks, so you can see a big one is nearly finished,
  // and flashes white for a frame or two when hit. A lunger winding up (D64)
  // swells, glows harder and lays its lane down ahead of it -- the tell --
  // all of it growing with `k`, 0 to 1 across the wind-up.
  // A puffer swelling (D95) is the same tell, harder: it puffs up and draws the
  // ring its burst will reach.
  for (const e of enemies) {
    const hit = e.flash > 0;
    const winding = e.phase === 'windup', fusing = e.phase === 'fuse';
    const k = winding ? e.phaseTime / e.lunge.windup : fusing ? e.phaseTime / e.fuse.time : 0;
    if (fusing) {
      ctx.save();
      ctx.globalAlpha = 0.15 + 0.45 * k;
      ctx.strokeStyle = e.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.fuse.blast, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    if (winding) {
      ctx.save();
      ctx.globalAlpha = 0.1 + 0.25 * k;
      ctx.strokeStyle = e.glow;
      ctx.lineWidth = e.r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.lineTo(e.x + e.aimX * e.lunge.reach, e.y + e.aimY * e.lunge.reach);
      ctx.stroke();
      ctx.restore();
    }
    circle(e.x, e.y, e.r * (0.7 + 0.3 * e.hp / e.maxHp) * (1 + (fusing ? 0.8 : 0.25) * k),
           hit ? '#ffffff' : e.color, hit ? '#ffffff' : e.glow, 18 + 30 * k);
    // A biter's open jaws (D108): a dark wedge toward the diver, widening
    // through the wind-up, gone when they snap shut. PLACEHOLDER GRAPHICS.
    if (e.phase === 'jaws') {
      const a = Math.atan2(player.y - e.y, player.x - e.x);
      const open = 0.9 * Math.min(1, e.phaseTime / e.bite.windup);
      ctx.fillStyle = '#05080f';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y);
      ctx.arc(e.x, e.y, e.r, a - open, a + open);
      ctx.closePath();
      ctx.fill();
    }
    // The glowing fish that carries the batch's mod (D84): a gold ring that
    // pulses. PLACEHOLDER GRAPHICS.
    if (e.carrier) {
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(elapsed * 8);
      ctx.strokeStyle = '#ffe680';
      ctx.shadowColor = '#ffc400';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Sparks shrink as they die.
  for (const p of particles) {
    circle(p.x, p.y, p.r * (p.life / p.maxLife), p.color, p.glow, 10);
  }

  // Bullets are streaks, not dots — so they don't read as gems, and so you
  // can see which way they're going.
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#9ef7ff';
  ctx.strokeStyle = '#eaffff';
  ctx.lineCap = 'round';
  for (const b of bullets) {
    if (b.evil) continue;
    // As wide as the shot's hitbox, so a knife's slash and a swollen shot look
    // as big as they hit (D97).
    ctx.lineWidth = Math.max(3, b.r);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // An enemy's shot is a round blob in its spitter's blue, so it never reads
  // as one of yours (D95). PLACEHOLDER GRAPHICS.
  for (const b of bullets) if (b.evil) circle(b.x, b.y, b.r, '#cfe3ff', '#1f6fff', 16);

  // Blink while invulnerable, so getting hit is visible — but never during a
  // dash: blinking out mid-flight is exactly what made the dash read as a
  // teleport, since the eye saw the player at one end and then the other.
  const blinking = player.hurt > 0 && player.dashTime <= 0 &&
                   Math.floor(player.hurt * 10) % 2 === 0;
  if (!blinking) circle(player.x, player.y, player.r, '#bffcff', '#4ff0ff', 25);
  // Where the body faces (D107) -- where a dash from a standstill goes.
  // PLACEHOLDER GRAPHICS.
  if (!blinking) {
    const fx = Math.cos(player.facing), fy = Math.sin(player.facing);
    ctx.strokeStyle = '#0d3b47';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + fx * player.r * 0.2, player.y + fy * player.r * 0.2);
    ctx.lineTo(player.x + fx * player.r * 0.9, player.y + fy * player.r * 0.9);
    ctx.stroke();
  }

  // The suit's guard (D100): a gold ring while it has a hit left to take this
  // batch. PLACEHOLDER GRAPHICS.
  if (guardLeft > 0) {
    ctx.save();
    ctx.strokeStyle = '#ffe680';
    ctx.shadowColor = '#ffc400';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // The Knife's cut (D105): the swept wedge, fading as `swingLeft` runs out.
  // PLACEHOLDER GRAPHICS.
  if (player.swingLeft > 0) {
    const face = Math.atan2(player.swingY, player.swingX);
    const half = player.swing.arc * Math.PI / 360;
    const t = player.swingLeft / player.swing.time;
    ctx.fillStyle = 'rgba(191, 252, 255, ' + (0.35 * t).toFixed(3) + ')';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.arc(player.x, player.y, player.range + player.shotRadius, face - half, face + half);
    ctx.closePath();
    ctx.fill();
  }

  // The wave the dash pushes ahead of it: an arc at the edge of its reach,
  // facing the way the dash is going, brightest at the start of the lunge.
  if (player.dashTime > 0) {
    const face = Math.atan2(player.dashDy, player.dashDx);
    const half = Math.acos(DASH_ARC);
    const t = player.dashTime / DASH_TIME;
    ctx.strokeStyle = 'rgba(191, 252, 255, ' + (0.15 + 0.5 * t).toFixed(3) + ')';
    ctx.lineWidth = 3 + 3 * t;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + DASH_REACH * 0.7,
            face - half, face + half);
    ctx.stroke();
  }

  // ...and the ring it leaves when it lands: it expands and fades, just enough
  // to say the lunge finished rather than stopped.
  if (player.dashEnd > 0) {
    const t = player.dashEnd / DASH_END;            // 1 -> 0
    ctx.strokeStyle = 'rgba(159, 247, 255, ' + (0.5 * t).toFixed(3) + ')';
    ctx.lineWidth = 2 + 2 * t;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + (1 - t) * DASH_REACH, 0, Math.PI * 2);
    ctx.stroke();
  }

  // The dash recharging: an arc that sweeps closed as it comes back. Nothing
  // is drawn once it's ready, so a clean ring means you have it.
  if (player.dashCd > 0) {
    const left = player.dashCd / player.dashCooldown;
    ctx.strokeStyle = 'rgba(79, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 6, -Math.PI / 2,
            -Math.PI / 2 + (1 - left) * Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();

  // --- HUD ---
  const STATUS_STEP = 20;
  // The status bar: its lines are game/'s, their rows derived from the count.
  // The sound's state rides on the first, since only the platform knows it.
  ctx.textAlign = 'left';
  const status = statusLines();
  status.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.font = (line.bold ? 'bold 15px' : line.small ? '13px' : '14px') + ' system-ui, sans-serif';
    ctx.fillText(line.text + (i === 0 ? audioStatus() : ''), 16, 30 + i * STATUS_STEP);
  });

  // The layer's name, while the current carries you into it (D72) -- derived:
  // the next batch is a layer's first and has not arrived. PLACEHOLDER
  // GRAPHICS, like the water's colour: the cheapest "a new layer" until art.
  const next = plan[batchIndex];
  if (screen === 'playing' && next && enemies.length === 0 &&
      (batchIndex === 0 || plan[batchIndex - 1].end)) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ef7ff';
    ctx.font = '30px system-ui, sans-serif';
    ctx.fillText(LAYERS[next.layer].name, ARENA_W / 2, 200);
    ctx.textAlign = 'left';
  }
  // A micro-task paying out: a line, never a stop (the genre contract, 6).
  // Only in play: its clock runs only there, so under an end screen it would
  // hang on forever.
  if (screen === 'playing' && noticeTime > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8ffd8';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(notice, ARENA_W / 2, 240);
    ctx.textAlign = 'left';
  }
  // A pickup, named as it lands (D84, D86), on its own line under the task's.
  if (screen === 'playing' && bannerTime > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffe9a8';
    ctx.font = '17px system-ui, sans-serif';
    ctx.fillText(banner, ARENA_W / 2, 270);
    ctx.textAlign = 'left';
  }

  if (showFps) {
    ctx.fillStyle = '#3d6270';
    ctx.fillText('fps ' + Math.round(fps) + '    enemies ' + enemies.length +
                 '   shots ' + bullets.length + '   gems ' + gems.length +
                 '   drops ' + drops.length +
                 '   sparks ' + particles.length, 16, 30 + status.length * STATUS_STEP);
  }

  // A debug dive says so, with its setup and its two keys (D102), where a
  // screenshot for an issue will carry them.
  if (debugSetup) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4d7a8a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('DEBUG  ' + setupCode() + '      R again   Backspace setup', 16, ARENA_H - 16);
  }
}

// The end of a dive, either way it ends: death, or the win at the bottom of the
// last layer (D68, D72). The wording is Claude's placeholder, open to Igor
// (ideas.md -> friendlier end-of-dive messages).
const END_SCREENS = {
  dead: { heading: 'CONSUMED',      color: '#ff5c85' },
  won:  { heading: 'ABYSS CLEARED', color: '#9ef7ff' },
};

// A refused save, said where the player will see it (the technical contract:
// "rejected loudly"). main.js sets it at boot and keeps the refused text aside.
let saveError = '';
function drawSaveError() {
  if (!saveError) return;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5c85';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('Your save was not loaded: ' + saveError + '. It is kept aside, not lost.',
               ARENA_W / 2, HINT_Y - 30);
}

function drawEnd() {
  const end = END_SCREENS[screen];
  dimArena(0.75);

  ctx.textAlign = 'center';
  ctx.fillStyle = end.color;
  ctx.font = '44px system-ui, sans-serif';
  ctx.fillText(end.heading, ARENA_W / 2, ARENA_H / 2 - 10);

  ctx.fillStyle = '#7fb0c0';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(currency + ' gems, ' + elapsed.toFixed(1) + 's, killed ' + kills,
               ARENA_W / 2, ARENA_H / 2 + 26);

  drawRows(MENUS[screen]);       // Dive again, Go home (D90)
}

// The y the hint sits on. Screens that stack rows from a data table must end
// above it, and a check asserts they do: no state check can see text running
// through text.
const HINT_Y = ARENA_H - 64;

// Where the last line of the help screen ends. Set by drawHelp(), read by the
// checks; there is no other way to notice a screen has outgrown itself.
let helpBottom = 0;

function drawHint(text) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f5563';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(text, ARENA_W / 2, HINT_Y);
}

function drawMenu(menu) {
  ctx.textAlign = 'center';
  ctx.shadowBlur = 28;
  ctx.shadowColor = '#4ff0ff';
  ctx.fillStyle = '#bffcff';
  ctx.font = '58px system-ui, sans-serif';
  ctx.fillText(menu.heading, ARENA_W / 2, 240);
  ctx.shadowBlur = 0;

  if (menu.sub) {
    ctx.fillStyle = menu.warn ? '#ff5c85' : '#456b78';   // a warning reads red (D103)
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(menu.sub, ARENA_W / 2, 276);
  }

  drawRows(menu);
}

// A menu's rows and its hint -- the menus' and the end screens' alike.
function drawRows(menu) {
  ctx.textAlign = 'center';
  // A row that cannot be taken right now -- a tier you cannot afford -- is
  // drawn dim, highlighted or not.
  menu.items.forEach((item, i) => {
    const on = i === menuIndex;
    ctx.fillStyle = item.dim ? (on ? '#5d8b99' : '#2f5563') : (on ? '#bffcff' : '#547f8d');
    ctx.font = (on ? '23px' : '20px') + ' system-ui, sans-serif';
    ctx.fillText(on ? '\u203a  ' + item.label + '  \u2039' : item.label,
                 ARENA_W / 2, menu.top + i * ROW_STEP);
  });

  drawHint('\u2191 \u2193 or mouse,  Enter or click to pick');
}

// `home` (D38, D66): the menu, plus its layer lines -- which layers show, and
// how, is `MENUS.home.lines` in game/; this only prints them.
function drawHome() {
  drawMenu(MENUS.home);
  ctx.textAlign = 'center';
  ctx.font = '15px system-ui, sans-serif';
  MENUS.home.lines.forEach((line, i) => {
    ctx.fillStyle = line.locked ? '#2f5563' : '#7fb0c0';
    ctx.fillText(line.text, ARENA_W / 2, HOME_LAYERS_TOP + i * HOME_LINE);
  });
}

// The marked row's tip on the debug setup (D102), one line: a check measures
// every tip at this font against the view's width.
const DEBUG_TIP_FONT = '15px system-ui, sans-serif';

// The debug mode's setup (D102): which rows there are, where each sits and
// what it holds are `MENUS.debug` and `debugRect()` in game/; this prints them.
// A value row reads its label on the left and `‹ value ›` at three quarters
// across, where a click on either side moves it (`clickStep()`).
function drawDebug() {
  const menu = MENUS.debug;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#bffcff';
  ctx.font = '40px system-ui, sans-serif';
  ctx.fillText(menu.heading, ARENA_W / 2, 100);
  ctx.fillStyle = '#7fb0c0';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText(menu.sub, ARENA_W / 2, 138);
  ctx.fillStyle = '#456b78';
  ctx.font = '13px system-ui, sans-serif';
  DEBUG_COLS.forEach((name, c) => ctx.fillText(name, debugColX(c), DEBUG_TOP - 44));

  menu.items.forEach((item, i) => {
    const r = debugRect(i), on = i === menuIndex, y = r.y + 21;
    if (on) {
      ctx.fillStyle = 'rgba(79, 240, 255, 0.08)';
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }
    ctx.fillStyle = item.dim ? (on ? '#5d8b99' : '#2f5563') : (on ? '#bffcff' : '#7fb0c0');
    ctx.font = (on ? '17px' : '16px') + ' system-ui, sans-serif';
    if (!item.change) {
      ctx.textAlign = 'center';
      ctx.fillText(on ? '\u203a  ' + item.label + '  \u2039' : item.label, r.x + r.w / 2, y);
      return;
    }
    const v = r.x + r.w * 3 / 4;
    ctx.textAlign = 'left';
    ctx.fillText(item.label, r.x + 12, y);
    ctx.textAlign = 'center';
    ctx.fillText(String(item.value), v, y);
    ctx.fillStyle = on ? '#4ff0ff' : '#2f5563';
    ctx.fillText('\u2039', v - r.w * 0.19, y);
    ctx.fillText('\u203a', v + r.w * 0.19, y);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#7fb0c0';
  ctx.font = '15px system-ui, sans-serif';
  menu.lines.forEach((line, k) => ctx.fillText(line, ARENA_W / 2, debugBottom() + 14 + k * 22));
  ctx.fillStyle = '#bffcff';
  ctx.font = DEBUG_TIP_FONT;
  ctx.fillText(menu.items[menuIndex].tip, ARENA_W / 2, debugBottom() + 42);

  drawHint('\u2191 \u2193 or mouse to choose,  \u2190 \u2192 or click \u2039 \u203a to change (Shift: by 5),' +
           '  Enter on Dive or R to dive.  In a dive: R again, Backspace back here.  M: sound');
}

function drawHelp() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '34px system-ui, sans-serif';
  ctx.fillText('HELP', ARENA_W / 2, 150);

  // The blurb starts below the key list rather than at a fixed y, so a new key
  // row pushes the blurb down instead of running through it.
  const keyTop = 232, keyStep = 34;
  const blurbTop = keyTop + HELP_KEYS.length * keyStep + 30;

  ctx.font = '16px system-ui, sans-serif';
  HELP_KEYS.forEach(([what, key], i) => {
    const y = keyTop + i * keyStep;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#547f8d';
    ctx.fillText(what, ARENA_W / 2 - 24, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#bffcff';
    ctx.fillText(key, ARENA_W / 2 + 24, y);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6f97a5';
  ctx.font = '15px system-ui, sans-serif';
  HELP_BLURB.forEach((line, i) => ctx.fillText(line, ARENA_W / 2, blurbTop + i * 27));
  helpBottom = blurbTop + (HELP_BLURB.length - 1) * 27;

  drawHint('Esc or click to go back');
}

function drawOptions() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '34px system-ui, sans-serif';
  ctx.fillText('OPTIONS', ARENA_W / 2, 190);

  OPTIONS.forEach((opt, i) => {
    const on = i === optionIndex;
    const y = OPTION_TOP + i * ROW_STEP;
    ctx.font = (on ? '20px' : '18px') + ' system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = on ? '#bffcff' : '#547f8d';
    ctx.fillText(opt.label, ARENA_W / 2 - 24, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = on ? '#4ff0ff' : '#3d6270';
    ctx.fillText(on ? '\u2039 ' + opt.show() + ' \u203a' : opt.show(),
                 ARENA_W / 2 + 24, y);
  });

  drawHint('\u2191 \u2193 or mouse,  \u2190 \u2192 or click to change,  Esc to go back');
}

// The water darkens with depth: each layer's own colour at its top (D72),
// near-black at its bottom. The letterbox margin gets the same colour, so it
// stays invisible. PLACEHOLDER GRAPHICS, as the layer's name is.
function waterColor() {
  // No dive has been drawn yet -- the title at boot: the top of the first layer.
  let color = LAYERS[0].color, lit = 1;
  if (plan.length) {
    const l = layerAt(cameraY);
    const first = plan.findIndex(e => e.layer === l);
    const last = plan.findLastIndex(e => e.layer === l);
    const top = first ? gateDepth(first - 1) : 0;     // where the layer begins
    lit = 1 - Math.min(1, Math.max(0, (cameraY - top) / (gateDepth(last) - top)));
    color = LAYERS[l].color;
  }
  const [r, g, b] = color;
  return 'rgb(' + Math.round(4 + (r - 4) * lit) + ',' + Math.round(7 + (g - 7) * lit) + ',' +
         Math.round(13 + (b - 13) * lit) + ')';
}

function draw() {
  // Paint the whole window, including the letterbox margin, then switch
  // into view coordinates. What spills into the margin is painted over by
  // coverMargins() once the field is drawn.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = waterColor();
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, offX, offY);

  // Shake the contents, not the margin, so the view's edge stays put.
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  if (screen === 'title')        { drawMenu(MENUS.title); drawSaveError(); }
  else if (screen === 'home')    drawHome();
  else if (screen === 'gear' || screen === 'attributes' || screen === 'newGame') drawMenu(MENUS[screen]);
  else if (screen === 'help')    drawHelp();
  else if (screen === 'options') drawOptions();
  else if (screen === 'debug')   drawDebug();
  else {
    drawField();
    coverMargins();
    if (screen === 'mods')        drawModCards();
    else if (screen === 'paused') { dimArena(); drawMenu(MENUS.paused); }
    else if (screen === 'dead' || screen === 'won') drawEnd();
  }

  ctx.restore();
}
