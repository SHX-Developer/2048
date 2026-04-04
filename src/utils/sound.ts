/**
 * Web Audio merge sound — no external files, synthesised on the fly.
 * AudioContext is created lazily on first use (browsers require a user gesture first).
 */

let _ctx: AudioContext | null = null;

function ctx(): AudioContext | null {
  try {
    if (!_ctx) _ctx = new AudioContext();
    if (_ctx.state === 'suspended') _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Play a short, clean merge "pop".
 * @param mergeCount  number of merges that happened in this move (1–4)
 * @param maxValue    highest merged tile value (used to pitch the tone up slightly)
 */
export function playMerge(mergeCount: number, maxValue: number) {
  const ac = ctx();
  if (!ac) return;

  const now = ac.currentTime;

  // Pitch rises logarithmically with tile value: 2→330Hz … 2048→660Hz
  const semitones = Math.log2(maxValue) * 1.5;          // 1.5 semitones per power of 2
  const freq      = 330 * Math.pow(2, semitones / 12);  // base note E4

  // Master gain — stays very soft
  const master = ac.createGain();
  master.gain.setValueAtTime(0, now);
  master.gain.linearRampToValueAtTime(0.09, now + 0.008);   // fast attack
  master.gain.exponentialRampToValueAtTime(0.001, now + 0.18); // smooth decay
  master.connect(ac.destination);

  // Primary sine — clean & warm
  const osc1 = ac.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(freq, now);
  // Slight upward pitch sweep gives a "popping" feel
  osc1.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.06);
  osc1.connect(master);
  osc1.start(now);
  osc1.stop(now + 0.2);

  // Quiet harmonic overtone (adds body)
  const osc2 = ac.createOscillator();
  osc2.type = 'sine';
  osc2.frequency.setValueAtTime(freq * 2, now);
  const g2 = ac.createGain();
  g2.gain.setValueAtTime(0.3, now);
  osc2.connect(g2);
  g2.connect(master);
  osc2.start(now);
  osc2.stop(now + 0.12);

  // If multiple merges, add a second staggered pop for richness
  if (mergeCount > 1) {
    const delay = 0.04;
    const osc3 = ac.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 1.5, now + delay);
    const g3 = ac.createGain();
    g3.gain.setValueAtTime(0, now + delay);
    g3.gain.linearRampToValueAtTime(0.05, now + delay + 0.006);
    g3.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
    osc3.connect(g3);
    g3.connect(ac.destination);
    osc3.start(now + delay);
    osc3.stop(now + delay + 0.14);
  }
}
