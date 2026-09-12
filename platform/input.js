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
const tapped = codes => codes.some(c => justPressed.has(c));

function moveCursor(index, length) {
  if (tapped(UP))   return (index + length - 1) % length;
  if (tapped(DOWN)) return (index + 1) % length;
  return index;
}
