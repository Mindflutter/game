// ===== audio (platform) =====
// WebAudio synthesis. Rewritten on a port.

let audio = null;
let master = null;

// One voice: an oscillator through its own volume envelope. Takes the context
// as an argument so the checks can render it offline and measure how loud it is.
function voice(ac, dest, s, t, pitch = 1) {
  const freq = s.freq * pitch;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = s.type;
  osc.frequency.setValueAtTime(freq, t);
  if (s.slide !== 1) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * s.slide), t + s.dur);
  }
  gain.gain.setValueAtTime(s.vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);   // never ramp to 0
  osc.connect(gain).connect(dest);
  osc.start(t);
  osc.stop(t + s.dur);
}

// Browsers refuse to make noise before the user interacts, so the context is
// built on the first key press -- and resumed on later ones, because some
// browsers hand back a suspended context anyway.
window.addEventListener('keydown', e => {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    // A dozen enemies dying at once would sum past 1.0 and clip; the
    // compressor rides that down instead of letting it crackle.
    const comp = audio.createDynamicsCompressor();
    master = audio.createGain();
    master.connect(comp).connect(audio.destination);
  } else if (audio.state === 'suspended') {
    audio.resume();
  }
});

// The gain follows game/'s `volume` here, before every voice, so game/ sets a
// number and never reaches for the node (D18).
function sound(name, pitch = 1) {
  if (!audio || muted) return;
  master.gain.value = volume;
  voice(audio, master, SOUNDS[name], audio.currentTime, pitch);
}
