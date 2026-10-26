// ===== checks =====
// Open index.html?test and read the console. Only what a browser alone can check --
// canvas, audio, real input, the window (D39); the game's logic is tested in Node, tests/.

if (location.search === '?test') {
  // ---------- harness ----------
  // A check that cannot fail is not a check (D39): report() alone says whether
  // the suite passed, once, last, after the awaits.
  let passed = 0;
  const failures = [];
  const check = (cond, msg) => {
    if (cond) { passed++; return; }
    failures.push(msg);
    console.error('FAIL: ' + msg);
  };
  const report = () => {
    const total = passed + failures.length;
    if (failures.length) {
      console.log('%c' + failures.length + ' of ' + total + ' checks FAILED',
        'color:#f44;font-weight:bold;font-size:14px');
      failures.forEach(f => console.log('  x ' + f));
    } else {
      console.log('%c' + total + ' checks passed',
        'color:#4c4;font-weight:bold;font-size:14px');
    }
  };

  // A throw partway through would end the suite without a report: caught here,
  // so report() always runs and the throw counts as the failure it is.
  window.addEventListener('error', e => {
    failures.push('SUITE THREW: ' + (e.message || e));
    report();
  });

  // 'Mouse0' is how a mouse button reaches the game (D22). A real press arms the
  // trigger with a frame up first (D47); these start mid-press, so arm it.
  const holdFire = () => { fireArmed = true; keys.add('Mouse0'); };
  const ceaseFire = () => keys.delete('Mouse0');

  // --- window size (D29) ---
  // The same seed through the real mouse path at three window sizes must reach
  // the bottom in the same time: `aim` arrives in client pixels, so the
  // letterbox conversion and the camera are what is under test.
  const AIM_GRID = 20;                 // x1, x1.35 and x1.8 all land it on whole pixels
  const traverse = (w, h) => {
    resize(w, h);
    reset(4471);
    // 900s a layer is headroom over what a stationary starting Gun takes, so
    // another layer cannot fail this.
    for (let i = 0; i < LAYERS.length * 900 / FIXED_DT && screen !== 'won'; i++) {
      player.hurt = player.iframes;
      if (screen === 'mods') { justPressed.add('Digit1'); justPressed.add('Enter'); }
      else if (enemies.length) {
        // On the AIM_GRID, which every scale puts on a whole client pixel: aimed
        // at the fish itself, each size lands a different fraction off, and one
        // grazing shot sends the dive another way.
        const e = enemies[0];
        const gx = Math.round(e.x / AIM_GRID) * AIM_GRID;
        const gy = Math.round((e.y - cameraY) / AIM_GRID) * AIM_GRID;
        window.dispatchEvent(new MouseEvent('mousemove', {
          clientX: Math.round(offX + gx * scale), clientY: Math.round(offY + gy * scale) }));
        holdFire();
      } else ceaseFire();
      update(FIXED_DT);                          // update() clears justPressed
    }
    ceaseFire();
    return screen === 'won' ? elapsed : -1;
  };
  const traverseFrom = performance.now();
  const sizes = [[1280, 800], [1920, 1080], [3440, 1440]].map(([w, h]) => traverse(w, h));
  resize();                                            // back to the real window
  check(sizes.every(t => t > 0), 'D29: every window size must reach the bottom: ' + sizes.join(', '));
  // Exactly: with the aim on the grid, every size plays the same dive.
  check(new Set(sizes).size === 1,
    'D29: difficulty must not depend on window size, times ' + sizes.map(t => t.toFixed(2)).join(' / '));
  console.log('D29 times to the bottom: ' + sizes.map(t => t.toFixed(2)).join(' / ') +
              ' (check took ' + Math.round(performance.now() - traverseFrom) + 'ms)');

  // --- the dim reaches the letterbox (D58) ---
  // The tint paints the margin too, so a dim screen must cover it, or leave
  // bright bands. Wider than 16:10, so there is a side margin to read.
  resize(1800, 800);
  reset(1);
  screen = 'mods';
  draw();
  const px = (x, y) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
  const margin = px(5, 790);
  const inside = px(Math.round(offX) + 5, 790);
  resize();
  check(margin.every((c, i) => Math.abs(c - inside[i]) <= 2),
    'a dim screen must darken the margin as much as the view: margin ' + margin + ', view ' + inside);

  // --- a hurt fish keeps its size and carries a bar (D121) ---
  reset(1);
  queuePaused = true;
  enemies.length = 0;
  placeEnemy('bulwark', ARENA_W / 2 + 200, cameraY + ARENA_H / 2);
  const f = enemies[0];
  f.hp = 1;
  draw();
  const at = (x, y) => px(Math.round(x * scale + offX), Math.round((y - cameraY) * scale + offY));
  const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 8);
  check(near(at(f.x + f.r * 0.9, f.y), hex(f.color)),
    'a hurt fish must keep its full size: ' + at(f.x + f.r * 0.9, f.y));
  check(near(at(f.x - f.r + 3, f.y - f.r - 7), hex(f.glow)),
    'a hurt fish must carry its bar: ' + at(f.x - f.r + 3, f.y - f.r - 7));

  // --- an open mouth jolts with its body (D140) ---
  // The bump stretched to 0.6 of the radius, so the jolted mouth's edge and
  // the one left at rest sit pixels apart: halfway along the jolt, a mouth
  // moved with the body is open water, one left behind is body.
  // The diver level with it on its left, so the mouth opens straight at it.
  Object.assign(player, { x: f.x - 200, y: f.y });
  Object.assign(f, { hp: f.maxHp, flash: 0, phase: 'jaws', phaseTime: f.bite.windup - LEAP_TIME,
                     bump: BUMP_TIME * 0.6 / BUMP_SIZE, bumpX: 1, bumpY: 0 });
  draw();
  const mid = at(f.x + 0.3 * f.r, f.y);
  check(!near(mid, hex(f.color)), 'an open mouth must jolt with its body: ' + mid);

  // Sound is a no-op before the player has pressed anything, not a crash.
  check(audio === null, 'no audio context before a key press');
  sound('shoot');

  // Real events with the character a Russian or AZERTY layout types, on the
  // same physical key: every binding must still work.
  reset();
  keys.clear();
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ц', code: 'KeyW' }));
  check(keys.has('KeyW'), 'a Russian-layout W must register');
  const yBefore = player.y;
  update(0.1);
  check(player.y < yBefore, 'a Russian-layout W must move the player up');
  window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ц', code: 'KeyW' }));
  check(!keys.has('KeyW'), 'releasing it must stop the player');

  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
  window.dispatchEvent(new Event('blur'));
  check(!keys.has('KeyS'), 'a key held as the window loses focus must not stay held');
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'MetaLeft' }));
  window.dispatchEvent(new KeyboardEvent('keyup', { code: 'MetaLeft' }));
  check(!keys.has('KeyS'), 'a key let go under Cmd must not stay held');

  // The death screen opens on Go home (D90); a Russian-layout W steps up to
  // Dive again, and Enter takes it.
  reset();
  screen = 'dead';
  menuIndex = 1;
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '\u0446', code: 'KeyW' }));
  update(1 / 60);
  window.dispatchEvent(new KeyboardEvent('keyup', { key: '\u0446', code: 'KeyW' }));
  check(menuIndex === 0, 'a Russian-layout W must move the death screen\'s cursor, at ' + menuIndex);
  justPressed.add('Enter');
  update(1 / 60);
  check(screen === 'playing', 'Dive again must begin a dive, got ' + screen);

  reset();
  screen = 'mods';
  choices = [MODS.find(u => u.name === 'Fins'), MODS.find(u => u.name === 'Nerve')];
  choiceIndex = 1;
  // '&' is what an unshifted 1 types on a French AZERTY keyboard.
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '&', code: 'Digit1' }));
  update(1 / 60);
  check(screen === 'mods' && choiceIndex === 0,
    'an AZERTY-layout 1 must mark the first mod, marked ' + choiceIndex);
  window.dispatchEvent(new KeyboardEvent('keyup', { key: '&', code: 'Digit1' }));
  keys.clear();
  screen = 'playing';
  choices = [];

  // --- the menu cursor (platform/input.js) ---
  const tap = code => { justPressed.add(code); update(1 / 60); };

  screen = 'title'; menuIndex = 0;
  tap('ArrowUp');
  check(menuIndex === MENUS.title.items.length - 1, 'cursor wraps upward');
  tap('ArrowDown');
  check(menuIndex === 0, 'cursor wraps back down');

  screen = 'title'; menuIndex = 0;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', repeat: true }));
  update(1 / 60);
  check(menuIndex === 0, 'key auto-repeat must not move the cursor');

  // ---------- screens fit ----------
  // No state check sees text running through text. A line's height, not ten
  // pixels: ten let the help's last line sit on the hint while this passed.
  const LINE_CLEAR = 24;
  openScreen('help');
  draw();
  check(helpBottom < HINT_Y - LINE_CLEAR,
    'the help screen must end above the hint: content ends at ' + helpBottom +
    ', hint sits at ' + HINT_Y + ' -- add a row and it overflows');
  screen = 'title';

  // `home` with every layer shown, the tallest its list gets, measured from the
  // layout's own owners.
  const metaWas = meta;
  meta = { ...freshMeta(), cleared: LAYERS.length };
  const listEnd = HOME_LAYERS_TOP + (MENUS.home.lines.length - 1) * HOME_LINE;
  const firstRow = rowRect(0, HOME_TOP), lastRow = rowRect(MENUS.home.items.length - 1, HOME_TOP);
  meta = metaWas;
  check(listEnd < firstRow.y - 4,
    'home: the layer list must end above the rows, list ends at ' + listEnd +
    ', rows start at ' + firstRow.y);
  check(lastRow.y + lastRow.h < HINT_Y - 10,
    'home: the rows must end above the hint, rows end at ' + (lastRow.y + lastRow.h) +
    ', hint at ' + HINT_Y);
  // Every menu's rows too: the weapons, equipment, attribute and debug (D102)
  // screens grow from tables.
  for (const [name, menu] of Object.entries(MENUS)) {
    const end = Math.max(...menu.items.map((_, i) => { const r = rectOf(menu, i); return r.y + r.h; }));
    check(end < HINT_Y - 10,
      name + ': the rows must end above the hint, rows end at ' + end + ', hint at ' + HINT_Y);
  }

  // A screen draw() does not name falls through to the dive's field (D114).
  {
    const was = { screen, drawRows };
    const drawn = [];
    drawRows = m => drawn.push(m);   // every menu's rows, whatever draws the rest
    // The setup screen has a drawing of its own, and wants a setup to draw.
    const homes = Object.entries(MENUS).filter(([name]) => name !== 'debug');
    for (const [name] of homes) { screen = name; draw(); }
    screen = was.screen;
    drawRows = was.drawRows;
    const missed = homes.filter(([, m]) => !drawn.includes(m)).map(([name]) => name);
    check(homes.length > 0 && missed.length === 0,
      'every menu must draw its rows, drawn as something else: ' + missed.join(','));
  }

  // Challenge lines (D109) grow with CHALLENGES and their asks: the stack ends
  // above the hint, and every line at every rung, and every notice, fits.
  {
    const metaWas = meta;
    for (const [name, menu] of Object.entries(MENUS).filter(([, m]) => m.challenges)) {
      const end = challengesTop(menu) + (challengeLines().length - 1) * CHALLENGE_LINE;
      check(end < HINT_Y - LINE_CLEAR,
        name + ': the challenge lines must end above the hint, they end at ' + end + ', hint at ' + HINT_Y);
    }
    let widest = 0, which = '';
    const measure = (font, text) => {
      ctx.font = font;
      const width = ctx.measureText(text).width;
      if (width > widest) { widest = width; which = text; }
    };
    for (const t of CHALLENGES) {
      for (let k = 0; k <= t.rungs.length; k++) {
        meta = { ...freshMeta(), challenges: { [t.name]: k } };
        challengeLines().forEach(line => measure(CHALLENGE_FONT, line));
        if (k) measure(NOTICE_FONT, t.name + ': ' + t.ask(t.rungs[k - 1]) + ' \u2014 10 points');
      }
    }
    measure(NOTICE_FONT, CHALLENGES.map(t => t.name).join(', ') + ' \u2014 50 points');
    meta = metaWas;
    check(widest < ARENA_W - 32, 'challenges: every line and notice must fit the view, the widest is ' +
      Math.round(widest) + 'px: ' + which);
  }

  // The debug tips (D102), with every weapon carried, since some change with it.
  {
    const was = debugSetup;
    debugSetup = parseSetup('', 1);
    ctx.font = DEBUG_TIP_FONT;
    let widest = 0, which = '';
    for (const w of WEAPONS) {
      debugSetup.weapon = w.name;
      for (const r of MENUS.debug.items) {
        const width = ctx.measureText(r.tip).width;
        if (width > widest) { widest = width; which = r.tip; }
      }
    }
    debugSetup = was;
    check(widest < ARENA_W - 32, 'debug: every tip must fit the view, the widest is ' +
      Math.round(widest) + 'px: ' + which);
  }

  // The gate line above them, in the same font: a drawn gate names each type
  // with its grades (D126), so its width is the pools', on many seeds.
  {
    const was = debugSetup;
    let widest = 0, which = '';
    for (let seed = 1; seed <= 100; seed++) for (let layer = 0; layer < LAYERS.length; layer++) {
      for (let gate = 0; gate < LAYERS[layer].stretches.reduce((a, s) => a + s.draw, 0); gate++) {
        debugSetup = { ...parseSetup('', 1), seed, layer, gate };
        const line = gateLine(), width = ctx.measureText(line).width;
        if (width > widest) { widest = width; which = line; }
      }
    }
    debugSetup = was;
    check(widest < ARENA_W - 32, 'debug: every gate line must fit the view, the widest is ' +
      Math.round(widest) + 'px: ' + which);
  }

  // The same rule sideways: the renderer centres a card's lines in a fixed-width
  // box, so it cannot notice one running off the edge.
  const widest = widestCardLine();
  check(widest <= CARD_W - CARD_PAD * 2,
    'every line of a mod card must fit it: widest is ' + Math.round(widest) +
    'px, the card allows ' + (CARD_W - CARD_PAD * 2) + 'px');

  // ...and downwards (D85): a taller card pushes Continue and the hint down.
  const cardsEnd = cardRect(0, 3).y + CARD_H;
  const contEnd = continueRect().y + continueRect().h;
  check(cardsEnd < continueRect().y && contEnd < MOD_HINT_Y - 10 && MOD_HINT_Y < ARENA_H - 20,
    'the cards, Continue and the hint must stack inside the view: cards end at ' + cardsEnd +
    ', Continue at ' + contEnd + ', the hint sits at ' + MOD_HINT_Y);

  applyScenario('one-drifter');
  const steppedFrom = elapsed;
  advance(30);
  check(Math.abs(elapsed - steppedFrom - 30 * FIXED_DT) < 1e-9,
    'advance(30) must move exactly 30 fixed ticks, moved ' + (elapsed - steppedFrom));

  check(stepped === false, '?test must not be stepped');

  // Synchronous: the loop starts as soon as this block returns, and the sound
  // checks are async, so a deferred reset would let the loop play out whatever
  // the last check left.
  reset();

  (async () => {
    for (const [name, spec] of Object.entries(SOUNDS)) {
      const off = new OfflineAudioContext(1, 44100, Math.ceil(44100 * (spec.dur + 0.05)));
      voice(off, off.destination, spec, 0);
      const d = (await off.startRendering()).getChannelData(0);
      let peak = 0;
      for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i]));
      check(peak >= 0.15,
        'sound "' + name + '" is too quiet to hear: peak ' + peak.toFixed(3) +
        ' (' + (20 * Math.log10(peak)).toFixed(1) + ' dBFS)');
    }
    report();
  })();
}

// A stepped scenario never starts the loop (D37 -- Scenarios): the whole point
// is that nothing advances until advance() moves it.
if (!stepped) requestAnimationFrame(frame);
