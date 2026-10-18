// ===== checks =====
// Open index.html?test and read the console. Only what a browser alone can check --
// canvas, audio, real input, the window (D39); the game's logic is tested in Node, tests/.

// ---------- checks: open index.html?test and look at the console ----------
if (location.search === '?test') {
  // ---------- harness ----------
  // A check that cannot fail is not a check (D39). check() counts; report() is
  // the only thing that says whether the suite passed, and it runs once, last,
  // after the awaits.
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

  // Point at something and pull the trigger. The weapon fires along the cursor,
  // so a check that expects a shot to land says where the cursor is rather than
  // inheriting it; and it is manual (D28), so the check holds 'Mouse0', which
  // is how a mouse button reaches the game (D22).
  // A real press is always preceded by a frame with the button up, which is
  // what arms the trigger (D47). These helpers start mid-press, so they assert
  // that precondition instead of simulating it. The arming logic itself is
  // exercised by its own check, in tests/combat.test.js.
  const holdFire = () => { fireArmed = true; keys.add('Mouse0'); };
  const ceaseFire = () => keys.delete('Mouse0');

  // --- window size (D29) ---
  // The same seed, played through the real mouse path at three window sizes,
  // must reach the bottom of the dive in the same time. The window reaches the
  // game only through `aim`, so aim arrives as mousemove events in *client*
  // pixels -- the letterbox conversion, and the camera on top of it, are what is
  // under test. The whole dive: it runs on through every layer (D66).
  const AIM_GRID = 20;                 // x1, x1.35 and x1.8 all land it on whole pixels
  const traverse = (w, h) => {
    resize(w, h);
    reset(4471);
    // The cap grows with the dive -- 450s a layer is headroom -- so another layer
    // does not fail this for a reason that has nothing to do with window size.
    for (let i = 0; i < LAYERS.length * 450 / FIXED_DT && screen !== 'won'; i++) {
      player.hurt = player.iframes;
      if (screen === 'mods') { justPressed.add('Digit1'); justPressed.add('Enter'); }
      else if (enemies.length) {
        // At the first fish, to the nearest AIM_GRID view px: a point all three
        // scales put on a whole client pixel, so the aim, and so the dive, is
        // the same at every size. A whole-pixel aim at the fish itself lands a
        // different fraction of a pixel off at each, and once fish hover
        // around the diver rather than sit on it (D108), one grazing shot
        // sends the dive another way.
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
  // The water tint paints the margin too, so a dim screen has to cover it as
  // well, or it leaves bright bands down the sides. A window wider than 16:10,
  // so there is a side margin to read.
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

  // Sound is a no-op before the player has pressed anything, not a crash.
  check(audio === null, 'no audio context before a key press');
  sound('shoot');

  // Every binding must work on a non-Latin keyboard. These dispatch real
  // events with the character a Russian (or AZERTY) layout actually produces,
  // while the physical key stays the same.
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
  // tap() presses a key for exactly one frame, the way a real press arrives.
  const tap = code => { justPressed.add(code); update(1 / 60); };

  // The cursor wraps at both ends.
  screen = 'title'; menuIndex = 0;
  tap('ArrowUp');
  check(menuIndex === MENUS.title.items.length - 1, 'cursor wraps upward');
  tap('ArrowDown');
  check(menuIndex === 0, 'cursor wraps back down');

  // Holding a key must not scroll the menu: a repeat is not a fresh press.
  screen = 'title'; menuIndex = 0;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', repeat: true }));
  update(1 / 60);
  check(menuIndex === 0, 'key auto-repeat must not move the cursor');

  // ---------- screens fit ----------
  // Help's layout is derived from the data; this guard keeps it so. No state
  // check can see text running through text.
  // A text's last baseline must sit a line's height above the hint's, or the
  // two touch: ten pixels between baselines let the help's last line sit on
  // the hint while this passed.
  const LINE_CLEAR = 24;
  openScreen('help');
  draw();
  check(helpBottom < HINT_Y - LINE_CLEAR,
    'the help screen must end above the hint: content ends at ' + helpBottom +
    ', hint sits at ' + HINT_Y + ' -- add a row and it overflows');
  screen = 'title';

  // `home` stacks its layer list above its rows and its rows above the hint,
  // both from tables (LAYERS, WEAPONS, EQUIPMENT, ATTRIBUTES). Drawn with every layer shown
  // -- the tallest the list gets -- so a sixth layer or a third gear item fails
  // here rather than running text through text.
  // Read from the layout's own owners: the lines from `MENUS.home.lines`, drawn
  // `HOME_LINE` apart from `HOME_LAYERS_TOP`, the rows from `rowRect()`.
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
  // Every menu's rows end above the hint too: the weapons, equipment and
  // attribute screens and the debug setup's grid (D102) grow from tables, and a
  // menu cannot notice its rows running into the hint. The lowest row, wherever
  // its grid puts it.
  for (const [name, menu] of Object.entries(MENUS)) {
    const end = Math.max(...menu.items.map((_, i) => { const r = rectOf(menu, i); return r.y + r.h; }));
    check(end < HINT_Y - 10,
      name + ': the rows must end above the hint, rows end at ' + end + ', hint at ' + HINT_Y);
  }

  // Every screen whose Back leads home is drawn as that menu (D114): draw()
  // names the menus it draws, and one it does not know falls through to the
  // dive's field.
  {
    const was = { screen, drawMenu };
    const drawn = [];
    drawMenu = m => drawn.push(m);
    const homes = Object.entries(MENUS).filter(([, m]) => m.back === BACK_HOME.run);
    for (const [name] of homes) { screen = name; draw(); }
    screen = was.screen;
    drawMenu = was.drawMenu;
    const missed = homes.filter(([, m]) => !drawn.includes(m)).map(([name]) => name);
    check(homes.length > 0 && missed.length === 0,
      'every screen Back leads home from must draw as its menu, drawn as something else: ' + missed.join(','));
  }

  // The challenges under the Attributes and pause screens' rows (D109) grow with
  // CHALLENGES, and each line with its ask, so neither the stack nor a line can be
  // left to the eye: the lines end above the hint, and every line -- at every
  // rung, earned or not -- fits the view, as does every rung's notice and the
  // notice of all of them paying on one tick.
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

  // The debug setup's tips sit on one line under its columns (D102), and the
  // renderer cannot notice one running off the view: each must fit, with
  // every weapon carried, since some tips change with it.
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

  // The same rule sideways: a mod's description and its rows of numbers are
  // text in a fixed-width box, and the renderer centres them, so it cannot
  // notice one running off the edge.
  const widest = widestCardLine();
  check(widest <= CARD_W - CARD_PAD * 2,
    'every line of a mod card must fit it: widest is ' + Math.round(widest) +
    'px, the card allows ' + (CARD_W - CARD_PAD * 2) + 'px');

  // ...and downwards. Continue and the hint sit under the cards (D85), derived
  // from their box, so a taller card pushes both down -- out of the view, if far
  // enough. Read from the owners, cardRect() and continueRect().
  const cardsEnd = cardRect(0, 3).y + CARD_H;
  const contEnd = continueRect().y + continueRect().h;
  check(cardsEnd < continueRect().y && contEnd < MOD_HINT_Y - 10 && MOD_HINT_Y < ARENA_H - 20,
    'the cards, Continue and the hint must stack inside the view: cards end at ' + cardsEnd +
    ', Continue at ' + contEnd + ', the hint sits at ' + MOD_HINT_Y);

  // advance() is the stepped-mode driver: exactly n ticks, no wall clock at all.
  applyScenario('one-drifter');
  const steppedFrom = elapsed;
  advance(30);
  // Derived from FIXED_DT, not a hardcoded step, so the step can change without
  // editing this.
  check(Math.abs(elapsed - steppedFrom - 30 * FIXED_DT) < 1e-9,
    'advance(30) must move exactly 30 fixed ticks, moved ' + (elapsed - steppedFrom));

  // ?test is not a scenario, so the frame loop must still run normally here.
  check(stepped === false, '?test must not be stepped');

  // Leave the game in a known state before the frame loop gets it. This has to
  // stay synchronous: the loop starts as soon as this block returns, and the
  // sound checks below are async, so deferring the reset would let the loop play
  // out whatever the last check left behind.
  reset();

  // Every sound must actually be loud enough to hear. Render each one offline
  // through the real voice() and measure its peak.
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
