// ===== render (platform) =====
// Canvas drawing. Rewritten on a port.

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

let scale = 1, offX = 0, offY = 0;
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  scale = Math.min(canvas.width / ARENA_W, canvas.height / ARENA_H);
  offX = (canvas.width  - ARENA_W * scale) / 2;
  offY = (canvas.height - ARENA_H * scale) / 2;
}
window.addEventListener('resize', resize);
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

function drawUpgradeCards() {
  dimArena();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '30px system-ui, sans-serif';
  ctx.fillText('LEVEL UP', ARENA_W / 2, ARENA_H / 2 - 130);

  const w = 220, h = 140, gap = 24;
  const totalW = choices.length * w + (choices.length - 1) * gap;
  const left = ARENA_W / 2 - totalW / 2;
  const top  = ARENA_H / 2 - h / 2;

  choices.forEach((u, i) => {
    const x = left + i * (w + gap);
    ctx.fillStyle = 'rgba(16, 44, 58, 0.92)';
    ctx.fillRect(x, top, w, h);
    ctx.strokeStyle = '#2b6b7d';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, top + 0.5, w - 1, h - 1);

    ctx.fillStyle = '#bffcff';
    ctx.font = '19px system-ui, sans-serif';
    ctx.fillText(u.name, x + w / 2, top + 48);

    ctx.fillStyle = '#7fb0c0';
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(u.desc, x + w / 2, top + 78);

    ctx.fillStyle = '#4ff0ff';
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText('[ ' + (i + 1) + ' ]', x + w / 2, top + 114);
  });
}

// So a silent game can tell you why it is silent.
function audioStatus() {
  if (muted) return '   [M] muted';
  if (!audio) return '   sound: press a key';
  if (audio.state !== 'running') return '   sound: ' + audio.state;
  return '';
}

function dimArena(alpha = 0.82) {
  ctx.fillStyle = 'rgba(4, 7, 13, ' + alpha + ')';
  ctx.fillRect(0, 0, ARENA_W, ARENA_H);
}

// The play field. draw() has already set up arena coordinates and the shake.
function drawField() {
  // How far your shots reach — the player needs to see this.
  ctx.strokeStyle = 'rgba(79, 240, 255, 0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.range, 0, Math.PI * 2);
  ctx.stroke();

  // Gems blink for their last two seconds, then they're gone.
  for (const g of gems) {
    if (g.life < 2 && Math.floor(g.life * 8) % 2 === 0) continue;
    circle(g.x, g.y, g.r, '#a8ffd8', '#2affb0', 14);
  }

  // A wounded enemy shrinks, so you can see a big one is nearly finished,
  // and flashes white for a frame or two when hit.
  for (const e of enemies) {
    const hit = e.flash > 0;
    circle(e.x, e.y, e.r * (0.7 + 0.3 * e.hp / e.maxHp),
           hit ? '#ffffff' : e.color, hit ? '#ffffff' : e.glow, 18);
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
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (const b of bullets) {
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x - b.vx * 0.035, b.y - b.vy * 0.035);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Blink while invulnerable, so getting hit is visible.
  const blinking = player.hurt > 0 && Math.floor(player.hurt * 10) % 2 === 0;
  if (!blinking) circle(player.x, player.y, player.r, '#bffcff', '#4ff0ff', 25);

  // --- XP bar across the very top ---
  ctx.fillStyle = '#12303a';
  ctx.fillRect(0, 0, ARENA_W, 5);
  ctx.fillStyle = '#4ff0ff';
  ctx.fillRect(0, 0, ARENA_W * (xp / xpNext), 5);

  // --- HUD ---
  ctx.fillStyle = '#7fb0c0';
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('HP ' + player.hp + '/' + player.maxHp + '   LV ' + level +
               '   ' + elapsed.toFixed(1) + 's   ' + kills + ' killed' +
               audioStatus(), 16, 30);

  if (showFps) {
    ctx.fillStyle = '#3d6270';
    ctx.fillText('fps ' + Math.round(fps) + '    enemies ' + enemies.length +
                 '   shots ' + bullets.length + '   motes ' + gems.length +
                 '   sparks ' + particles.length, 16, 50);
  }
}

function drawDeath() {
  dimArena(0.75);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff5c85';
  ctx.font = '44px system-ui, sans-serif';
  ctx.fillText('CONSUMED', ARENA_W / 2, ARENA_H / 2 - 10);

  ctx.fillStyle = '#7fb0c0';
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('level ' + level + ', survived ' + elapsed.toFixed(1) + 's, killed ' +
               kills, ARENA_W / 2, ARENA_H / 2 + 26);

  ctx.fillStyle = '#2f5563';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('R to go again,  Esc for the menu', ARENA_W / 2, ARENA_H / 2 + 60);
}

function drawHint(text) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#2f5563';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(text, ARENA_W / 2, ARENA_H - 64);
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
    ctx.fillStyle = '#456b78';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText(menu.sub, ARENA_W / 2, 276);
  }

  menu.items.forEach((item, i) => {
    const on = i === menuIndex;
    ctx.fillStyle = on ? '#bffcff' : '#547f8d';
    ctx.font = (on ? '23px' : '20px') + ' system-ui, sans-serif';
    ctx.fillText(on ? '\u203a  ' + item.label + '  \u2039' : item.label,
                 ARENA_W / 2, 380 + i * 46);
  });

  drawHint('\u2191 \u2193 to choose,  Enter to pick');
}

function drawHelp() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '34px system-ui, sans-serif';
  ctx.fillText('HELP', ARENA_W / 2, 150);

  ctx.font = '16px system-ui, sans-serif';
  HELP_KEYS.forEach(([what, key], i) => {
    const y = 232 + i * 34;
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
  HELP_BLURB.forEach((line, i) => ctx.fillText(line, ARENA_W / 2, 470 + i * 27));

  drawHint('Esc to go back');
}

function drawOptions() {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#9ef7ff';
  ctx.font = '34px system-ui, sans-serif';
  ctx.fillText('OPTIONS', ARENA_W / 2, 190);

  OPTIONS.forEach((opt, i) => {
    const on = i === optionIndex;
    const y = 300 + i * 46;
    ctx.font = (on ? '20px' : '18px') + ' system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = on ? '#bffcff' : '#547f8d';
    ctx.fillText(opt.label, ARENA_W / 2 - 24, y);
    ctx.textAlign = 'left';
    ctx.fillStyle = on ? '#4ff0ff' : '#3d6270';
    ctx.fillText(on ? '\u2039 ' + opt.show() + ' \u203a' : opt.show(),
                 ARENA_W / 2 + 24, y);
  });

  drawHint('\u2191 \u2193 to choose,  \u2190 \u2192 to change,  Esc to go back');
}

function draw() {
  // Paint the whole window, including the letterbox margin, then switch
  // into arena coordinates and clip so nothing spills into the margin.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#04070d';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.setTransform(scale, 0, 0, scale, offX, offY);
  ctx.beginPath();
  ctx.rect(0, 0, ARENA_W, ARENA_H);
  ctx.clip();

  // Shake the contents, not the clip window, so the arena edge stays put.
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }

  if (screen === 'title')        drawMenu(MENUS.title);
  else if (screen === 'help')    drawHelp();
  else if (screen === 'options') drawOptions();
  else {
    drawField();
    if (screen === 'levelup')     drawUpgradeCards();
    else if (screen === 'paused') { dimArena(); drawMenu(MENUS.paused); }
    else if (screen === 'dead')   drawDeath();
  }

  ctx.restore();
}
