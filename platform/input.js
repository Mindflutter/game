// ===== input (platform) -- rewritten on a port =====

// Keys by e.code, their position, never e.key, the character they type: a
// Russian layout or AZERTY changes the character, not the position.
const keys = new Set();
// Keys that went down this frame, so holding Down cannot fly through a menu.
// Cleared at the end of update().
const justPressed = new Set();
window.addEventListener('keydown', e => {
  keys.add(e.code);
  if (!e.repeat) justPressed.add(e.code);
});
// No keyup comes for a key let go while Cmd is down (on a Mac) or after the
// window lost focus, so either lets go of every key.
window.addEventListener('keyup', e => {
  if (e.code === 'MetaLeft' || e.code === 'MetaRight') keys.clear();
  else keys.delete(e.code);
});
window.addEventListener('blur', () => keys.clear());

// UP, DOWN, ... live in game/content.js: which key means what is content, and
// keeping it there holds the seam at seven names.
const tapped = codes => codes.some(c => justPressed.has(c));

// Mouse buttons share the key sets, under codes no keyboard produces, so menus
// read either device through tapped().
window.addEventListener('mousedown', e => {
  keys.add('Mouse' + e.button);
  justPressed.add('Mouse' + e.button);
});
window.addEventListener('mouseup', e => keys.delete('Mouse' + e.button));

// In view coordinates: the canvas is scaled and letterboxed, so undo both.
// game/ adds `cameraY` where it reads aim (D58). Pointing up until the mouse
// first moves, so the first shot has a direction.
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
