// ===== render (platform) -- rewritten on a port =====

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

// Faded, so it guides the eye without competing with the fish.
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

// CSS fonts live here, not in game/: they mean nothing after the port.
const CARD_DESC_FONT = '13px system-ui, sans-serif';
const CARD_ROW_FONT = '12px system-ui, sans-serif';

// Seconds a floor boost blinks before it goes (D86). Drawing only, so here.
const BOOST_BLINK = 2;

// No game state can see a card's text run off its box, so the browser suite
// measures it here.
function widestCardLine() {
  const width = (font, text) => { ctx.font = font; return ctx.measureText(text).width; };
  return Math.max(...MODS.flatMap(m => [width(CARD_DESC_FONT, m.desc),
    ...modPreview(m, cardStep(m)).map(c => width(CARD_ROW_FONT, statLine(c)))]));
}

// The layer end's pick (D85). The wording is Claude's placeholder (ideas.md).
function drawModCards() {
  dimArena();

  // A check can open the cards with no plan behind them.
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

    ctx.fillStyle = '#bffcff';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText(u.end ? u.name : u.name + ' \u00d7' + END_STEP, x + w / 2, y + 38);

    ctx.fillStyle = on ? '#9ef7ff' : '#7fb0c0';
    ctx.font = CARD_DESC_FONT;
    ctx.fillText(u.desc, x + w / 2, y + 64);

    ctx.font = CARD_ROW_FONT;
    ctx.fillStyle = on ? '#6fd8e8' : '#4d7a8a';
    // No slice: a check holds every mod to MOD_ROWS, so a row too many fails
    // the suite instead of falling off the card.
    modPreview(u, cardStep(u)).forEach((c, n) => {
      ctx.fillText(statLine(c), x + w / 2, y + 90 + n * 17);
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

// Derived from Continue's box, so taller cards push it down; a check holds it
// in view.
const MOD_HINT_Y = continueRect().y + continueRect().h + 34;

// So a silent game can tell you why it is silent.
function audioStatus() {
  if (muted) return '   [M] muted';
  if (!audio) return '   sound: press a key';
  if (audio.state !== 'running') return '   sound: ' + audio.state;
  return '';
}

// The +N (D35): over the diver while gems come, then on its way to the counter.
function gemText(n, x, y) {
  ctx.save();
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#a8ffd8';
  ctx.shadowColor = '#2affb0';
  ctx.shadowBlur = 10;
  ctx.fillText('+' + n, x, y);
  ctx.restore();
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

// The current, shown by specks scrolled with `waterY` (D58). PLACEHOLDER
// GRAPHICS (ideas.md -> "A lively background"). Hashed per cell, never rng():
// drawing must not consume the seeded sequence.
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

// draw() has already set up view coordinates and the shake.
function drawField() {
  drawSpecks();

  // World draws go through the camera; the HUD below does not.
  ctx.save();
  ctx.translate(0, -cameraY);

  ctx.strokeStyle = 'rgba(79, 240, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.range, 0, Math.PI * 2);
  ctx.stroke();

  if (screen === 'playing') drawAimLine();

  for (const g of gems) circle(g.x, g.y, g.r, '#a8ffd8', '#2affb0', 14);

  // PLACEHOLDER GRAPHICS: a mod is a gold coin, a boost a magenta diamond.
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

  // A wounded fish carries a bar and keeps its size, the size of its body
  // (D121). A tell grows with `k`, 0 to 1 across it.
  for (const e of enemies) {
    const hit = e.flash > 0;
    const winding = e.phase === 'windup', fusing = e.phase === 'fuse';
    const fanning = winding && e.attack === 'fan', A = fanning ? e.fan : e.lunge;
    const k = winding ? e.phaseTime / A.windup : fusing ? e.phaseTime / e.fuse.time : 0;
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
      ctx.lineWidth = fanning ? 2 * A.r : e.r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const a of fanning ? fanAims(e) : [Math.atan2(e.aimY, e.aimX)]) {
        ctx.moveTo(e.x, e.y);
        ctx.lineTo(e.x + Math.cos(a) * A.reach, e.y + Math.sin(a) * A.reach);
      }
      ctx.stroke();
      ctx.restore();
    }
    // The bump: the body, and the mouth cut from it, jolted along the hit and
    // flattened along it, easing back. Drawn about the body's centre, turned
    // to the hit.
    const b = e.bump > 0 ? BUMP_SIZE * e.bump / BUMP_TIME : 0;
    const turn = b ? Math.atan2(e.bumpY, e.bumpX) : 0;
    // Where the body is drawn: out along a biter's leap (D141), else at rest.
    const toDiver = Math.atan2(player.y - e.y, player.x - e.x), leap = biteLeap(e);
    const bx = e.x + Math.cos(toDiver) * leap, by = e.y + Math.sin(toDiver) * leap;
    const onBody = () => {
      ctx.save();
      ctx.translate(bx, by);
      if (b) {
        ctx.translate(e.bumpX * b * e.r, e.bumpY * b * e.r);
        ctx.rotate(turn);
        ctx.scale(1 - b, 1 + b);
      }
    };
    onBody();
    circle(0, 0, e.r * (1 + (fusing ? 0.8 : 0.25) * k),
           hit ? '#ffffff' : e.color, hit ? '#ffffff' : e.glow, 18 + 30 * k);
    ctx.restore();
    // The grade on the body, above the first (D119). PLACEHOLDER GRAPHICS.
    if (e.grade > 1) {
      ctx.save();
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = '#05080f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.grade, bx, by);
      ctx.restore();
    }
    // Only once hurt, so a one-hit fish never has one. PLACEHOLDER GRAPHICS.
    if (e.hp < e.maxHp) {
      ctx.fillStyle = '#05080f';
      ctx.fillRect(bx - e.r, by - e.r - 9, 2 * e.r, 4);
      ctx.fillStyle = e.glow;
      ctx.fillRect(bx - e.r, by - e.r - 9, 2 * e.r * e.hp / e.maxHp, 4);
    }
    // A biter's open jaws (D108). PLACEHOLDER GRAPHICS.
    if (e.phase === 'jaws') {
      const a = toDiver - turn;
      const open = 0.9 * Math.min(1, e.phaseTime / e.bite.windup);
      onBody();
      ctx.fillStyle = '#05080f';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, e.r, a - open, a + open);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    // The fish carrying the batch's mod (D84). PLACEHOLDER GRAPHICS.
    if (e.carrier) {
      ctx.save();
      ctx.globalAlpha = 0.8 + 0.2 * Math.sin(elapsed * 8);
      ctx.strokeStyle = '#ffe680';
      ctx.shadowColor = '#ffc400';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(bx, by, e.r + 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const p of particles) {
    const t = p.life / p.maxLife;                    // 1 -> 0
    if (p.ring === undefined) { circle(p.x, p.y, p.r * t, p.color, p.glow, 10); continue; }
    // A splash's ring (D125): out to its reach fast, then fading there.
    ctx.save();
    ctx.globalAlpha = 0.7 * t;
    ctx.strokeStyle = p.color;
    ctx.shadowColor = p.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.ring + (p.r - p.ring) * Math.sqrt(Math.min(1, 3 * (1 - t))), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Streaks, not dots: a shot never reads as a gem, and shows its heading.
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#9ef7ff';
  ctx.strokeStyle = '#eaffff';
  ctx.lineCap = 'round';
  for (const b of bullets) {
    if (b.evil) continue;
    // As wide as its hitbox, so it looks as big as it hits (D97).
    ctx.lineWidth = Math.max(3, b.r);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  // Round and blue, so an enemy's shot never reads as yours (D95).
  // PLACEHOLDER GRAPHICS.
  for (const b of bullets) if (b.evil) circle(b.x, b.y, b.r, '#cfe3ff', '#1f6fff', 16);

  // A hit blinks; the dash's own invulnerability does not (D121). Not mid-dash
  // either: blinking out mid-flight made the dash read as a teleport.
  const blinking = player.hurt > 0 && player.dashTime <= 0 &&
                   Math.floor(player.hurt * 10) % 2 === 0;
  if (!blinking) circle(player.x, player.y, player.r, '#bffcff', '#4ff0ff', 25);
  // The facing (D107). PLACEHOLDER GRAPHICS.
  if (!blinking) {
    const fx = Math.cos(player.facing), fy = Math.sin(player.facing);
    ctx.strokeStyle = '#0d3b47';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(player.x + fx * player.r * 0.2, player.y + fy * player.r * 0.2);
    ctx.lineTo(player.x + fx * player.r * 0.9, player.y + fy * player.r * 0.9);
    ctx.stroke();
  }

  // The suit's guard (D100). PLACEHOLDER GRAPHICS.
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

  // The Knife's cut (D105). PLACEHOLDER GRAPHICS.
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

  if (player.dashEnd > 0) {
    const t = player.dashEnd / DASH_END;            // 1 -> 0
    ctx.strokeStyle = 'rgba(159, 247, 255, ' + (0.5 * t).toFixed(3) + ')';
    ctx.lineWidth = 2 + 2 * t;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + (1 - t) * DASH_REACH, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Nothing once ready: a clean ring means the dash is back.
  if (player.dashCd > 0) {
    const left = player.dashCd / player.dashCooldown;
    ctx.strokeStyle = 'rgba(79, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.r + 6, -Math.PI / 2,
            -Math.PI / 2 + (1 - left) * Math.PI * 2);
    ctx.stroke();
  }

  if (gemPop.n) gemText(gemPop.n, player.x, player.y - player.r - 14);

  ctx.restore();

  // --- HUD ---
  const STATUS_STEP = 20;
  // The sound's state rides on the first line: only the platform knows it.
  ctx.textAlign = 'left';
  const status = statusLines();
  let counter;
  status.forEach((line, i) => {
    ctx.fillStyle = line.color;
    ctx.font = (line.bold ? 'bold 15px' : line.small ? '13px' : '14px') + ' system-ui, sans-serif';
    const text = line.text + (i === 0 ? audioStatus() : ''), y = 30 + i * STATUS_STEP;
    // The gems' number drawn apart, so the +N has somewhere to land and it
    // can swell as it does.
    const m = /^(.*GEMS )(\d+)(.*)$/.exec(text);
    if (!m) return ctx.fillText(text, 16, y);
    const w = ctx.measureText(m[2]).width, x = 16 + ctx.measureText(m[1]).width;
    ctx.fillText(m[1], 16, y);
    ctx.fillText(m[3], x + w, y);
    counter = { x: x + w / 2, y: y - 5 };
    const s = 1 + 0.4 * gemPop.bump / GEM_BUMP;
    ctx.save();
    ctx.translate(counter.x, counter.y);
    ctx.scale(s, s);
    ctx.textAlign = 'center';
    ctx.fillText(m[2], 0, 5);
    ctx.restore();
  });
  // In flight it speeds up from the diver to the counter.
  if (gemPop.flyN && counter) {
    const k = (1 - gemPop.fly / GEM_FLY) ** 2;
    const fx = player.x, fy = player.y - cameraY - player.r - 14;
    gemText(gemPop.flyN, fx + (counter.x - fx) * k, fy + (counter.y + 5 - fy) * k);
  }

  // The layer's name while the current carries you into it (D72): the next
  // batch is a layer's first and has not arrived. PLACEHOLDER GRAPHICS.
  const next = plan[batchIndex];
  if (screen === 'playing' && next && !batchLive() &&
      (batchIndex === 0 || plan[batchIndex - 1].end)) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#9ef7ff';
    ctx.font = '30px system-ui, sans-serif';
    ctx.fillText(LAYERS[next.layer].name, ARENA_W / 2, 200);
    ctx.textAlign = 'left';
  }
  // Only in play: its clock runs only there, so under an end screen it would
  // hang on.
  if (screen === 'playing' && noticeTime > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#a8ffd8';
    ctx.font = NOTICE_FONT;
    ctx.fillText(notice, ARENA_W / 2, 240);
    ctx.textAlign = 'left';
  }
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

  // Where a screenshot for an issue will carry it (D102).
  if (debugSetup) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4d7a8a';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('DEBUG  ' + setupCode() + '      R again   Backspace setup', 16, ARENA_H - 16);
  }
}

// The wording is Claude's placeholder (ideas.md).
const END_SCREENS = {
  dead: { heading: 'CONSUMED',      color: '#ff5c85' },
  won:  { heading: 'ABYSS CLEARED', color: '#9ef7ff' },
};

// A refused save, said on screen: rejected loudly, never lost.
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

  drawRows(MENUS[screen]);
}

// Rows stacked from data must end above the hint; a check asserts it.
const HINT_Y = ARENA_H - 64;

// Where help's or the catalogue's last line ends, for the check: either can
// outgrow the screen.
let helpBottom = 0;

function drawHint(text) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f5563';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(text, ARENA_W / 2, HINT_Y);
}

// A check measures every challenge line and notice at these (D109).
const CHALLENGE_FONT = '15px system-ui, sans-serif';
const NOTICE_FONT = '17px system-ui, sans-serif';

function drawMenu(menu) {
  ctx.textAlign = 'center';
  ctx.shadowBlur = 28;
  ctx.shadowColor = '#4ff0ff';
  ctx.fillStyle = '#bffcff';
  ctx.font = '58px system-ui, sans-serif';
  ctx.fillText(menu.heading, ARENA_W / 2, 240);
  ctx.shadowBlur = 0;

  if (menu.sub) {
    ctx.fillStyle = menu.warn ? '#ff5c85' : '#456b78';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(menu.sub, ARENA_W / 2, 276);
  }

  drawRows(menu);

  if (menu.challenges) {
    ctx.font = CHALLENGE_FONT;
    challengeLines().forEach((line, i) => {
      ctx.fillStyle = i ? '#7fb0c0' : '#456b78';    // the first says what they are
      ctx.fillText(line, ARENA_W / 2, challengesTop(menu) + i * CHALLENGE_LINE);
    });
  }
}

function drawRows(menu) {
  ctx.textAlign = 'center';
  menu.items.forEach((item, i) => {
    const on = i === menuIndex;
    ctx.fillStyle = item.dim ? (on ? '#5d8b99' : '#2f5563') : (on ? '#bffcff' : '#547f8d');
    ctx.font = (on ? '23px' : '20px') + ' system-ui, sans-serif';
    ctx.fillText(on ? '\u203a  ' + item.label + '  \u2039' : item.label,
                 ARENA_W / 2, menu.top + i * ROW_STEP);
  });

  drawHint('\u2191 \u2193 or mouse,  Enter or click to pick');
}

function drawHome() {
  drawMenu(MENUS.home);
  ctx.textAlign = 'center';
  ctx.font = '15px system-ui, sans-serif';
  MENUS.home.lines.forEach((line, i) => {
    ctx.fillStyle = line.locked ? '#2f5563' : '#7fb0c0';
    ctx.fillText(line.text, ARENA_W / 2, HOME_LAYERS_TOP + i * HOME_LINE);
  });
}

// A check measures every tip at this against the view's width.
const DEBUG_TIP_FONT = '15px system-ui, sans-serif';

// A value row: its label left, `‹ value ›` three quarters across, where
// `clickStep()` reads the click.
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
  ctx.font = DEBUG_TIP_FONT;
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
  const keyTop = 212, keyStep = 34;
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

// What is not met yet keeps its place, so the list never reshuffles. PLACEHOLDER: words only.
function drawCatalogue() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '34px system-ui, sans-serif';
  ctx.fillText('CATALOGUE', ARENA_W / 2, 150);
  ctx.fillStyle = '#6f97a5';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText(meta.seen.length + ' of ' + CATALOGUE.length + ' met', ARENA_W / 2, 186);

  const top = 240, step = 30;
  ctx.font = '16px system-ui, sans-serif';
  CATALOGUE.forEach((c, i) => {
    const y = top + i * step, seen = meta.seen.includes(c.name);
    ctx.textAlign = 'right';
    ctx.fillStyle = seen ? '#bffcff' : '#3d5f6b';
    ctx.fillText(seen ? c.name : '???', ARENA_W / 2 - 160, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#6f97a5';
    if (seen) ctx.fillText(c.desc, ARENA_W / 2 - 130, y);
  });
  helpBottom = top + (CATALOGUE.length - 1) * step;

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

// Each layer's colour at its top (D72), near-black at its bottom; the margin
// too, so it stays invisible. PLACEHOLDER GRAPHICS.
function waterColor() {
  // Before any dive -- the title at boot -- the first layer's top.
  let color = LAYERS[0].color, lit = 1;
  if (plan.length) {
    const l = layerAt(cameraY);
    const first = plan.findIndex(e => e.layer === l);
    const last = plan.findLastIndex(e => e.layer === l);
    const top = first ? gateDepth(first - 1) : 0;
    lit = 1 - Math.min(1, Math.max(0, (cameraY - top) / (gateDepth(last) - top)));
    color = LAYERS[l].color;
  }
  const [r, g, b] = color;
  return 'rgb(' + Math.round(4 + (r - 4) * lit) + ',' + Math.round(7 + (g - 7) * lit) + ',' +
         Math.round(13 + (b - 13) * lit) + ')';
}

function draw() {
  // The whole window, margin included; coverMargins() paints over what spills.
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
  else if (['weapons', 'equipment', 'attributes', 'newGame'].includes(screen)) drawMenu(MENUS[screen]);
  else if (screen === 'help')    drawHelp();
  else if (screen === 'catalogue') drawCatalogue();
  else if (screen === 'options') drawOptions();
  else if (screen === 'debug')   drawDebug();
  else {
    drawField();
    coverMargins();
    if (screen === 'mods')        drawModCards();
    else if (screen === 'paused' || screen === 'goHome') { dimArena(); drawMenu(MENUS[screen]); }
    else if (screen === 'dead' || screen === 'won') drawEnd();
  }

  ctx.restore();
}
