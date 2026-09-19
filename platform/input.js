// ===== input (platform) =====
// Keyboard. Rewritten on a port.

// ---------- input ----------
// Remember which keys are held down right now, BY PHYSICAL POSITION.
// e.code is the key itself ('KeyW'); e.key is the character that key types,
// which depends on the keyboard layout -- on a Russian layout WASD type
// ц/ф/ы/в, so matching on the character ignored them entirely. Position also
// does the right thing on AZERTY, where those four keys are labelled ZQSD.
const keys = new Set();
// Menus need to know a key *went down this frame*, not that it is held --
// otherwise holding Down flies through the list. Cleared at the end of update().
const justPressed = new Set();
window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (!e.repeat) justPressed.add(e.code);     // ignore the OS key-repeat
});
window.addEventListener('keyup', e => keys.delete(e.code));

const UP    = ['ArrowUp', 'KeyW'];
const DOWN  = ['ArrowDown', 'KeyS'];
const LEFT  = ['ArrowLeft', 'KeyA'];
const RIGHT = ['ArrowRight', 'KeyD'];
const GO    = ['Enter', 'NumpadEnter', 'Space'];
const DASH  = ['Space'];
const CLICK = ['Mouse0'];
const tapped = codes => codes.some(c => justPressed.has(c));

// Mouse buttons ride in the same two sets as the keys, under codes a keyboard
// can never produce ('Mouse0'), so menus can use tapped() without caring which
// device the player reached for.
window.addEventListener('mousedown', e => {
  keys.add('Mouse' + e.button);
  justPressed.add('Mouse' + e.button);
});
window.addEventListener('mouseup', e => keys.delete('Mouse' + e.button));

// Where you are aiming, in ARENA coordinates. The canvas is a scaled,
// letterboxed view of a fixed 1280x800 world, so a screen pixel is not a world
// pixel -- undo the scale and the letterbox offset the renderer applied.
// Starts pointing straight up, so the first shot has a direction even if the
// mouse has never moved.
const aim = { x: ARENA_W / 2, y: 0 };
window.addEventListener('mousemove', e => {
  aim.x = (e.clientX - offX) / scale;
  aim.y = (e.clientY - offY) / scale;
});

function moveCursor(index, length) {
  if (tapped(UP))   return (index + length - 1) % length;
  if (tapped(DOWN)) return (index + 1) % length;
  return index;
}
