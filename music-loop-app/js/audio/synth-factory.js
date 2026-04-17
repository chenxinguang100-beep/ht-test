// 音色工厂：为每种 loop 创建合适的 Tone 合成器/采样器
// 所有输出最终连接到同一个 master 总线，便于统一电平控制。

const T = () => window.Tone;

let master = null;
let compressor = null;
let reverbSend = null;

export function ensureMaster() {
  const Tone = T();
  if (master) return master;
  compressor = new Tone.Compressor({ threshold: -12, ratio: 3, attack: 0.02, release: 0.2 });
  master = new Tone.Gain(0.8);
  reverbSend = new Tone.Reverb({ decay: 2.4, wet: 0.28 });
  reverbSend.generate();

  compressor.connect(master);
  reverbSend.connect(compressor);
  master.toDestination();
  return master;
}

function connect(node, { wet = 0.1 } = {}) {
  ensureMaster();
  // 干信号 → compressor, 湿信号 → reverbSend
  const dry = new window.Tone.Gain(1 - wet);
  const wetGain = new window.Tone.Gain(wet);
  node.connect(dry);
  node.connect(wetGain);
  dry.connect(compressor);
  wetGain.connect(reverbSend);
  return node;
}

// ================ 鼓机 ================
export function createKick() {
  const Tone = T();
  const k = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.2 },
    volume: -4,
  });
  return connect(k, { wet: 0.04 });
}

export function createSnare() {
  const Tone = T();
  const s = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    volume: -10,
  });
  return connect(s, { wet: 0.15 });
}

export function createHat(open = false) {
  const Tone = T();
  const h = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: open ? 0.25 : 0.05,
      sustain: 0,
      release: open ? 0.2 : 0.02,
    },
    volume: -22,
  });
  const hp = new Tone.Filter(7000, 'highpass');
  h.connect(hp);
  connect(hp, { wet: 0.08 });
  return h;
}

export function createClap() {
  const Tone = T();
  const c = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.005, decay: 0.22, sustain: 0, release: 0.08 },
    volume: -12,
  });
  const bp = new Tone.Filter(1500, 'bandpass', -12);
  bp.Q.value = 1.2;
  c.connect(bp);
  connect(bp, { wet: 0.2 });
  return c;
}

export function createTom() {
  const Tone = T();
  const t = new Tone.MembraneSynth({
    pitchDecay: 0.08,
    octaves: 3,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.002, decay: 0.3, sustain: 0.01, release: 0.4 },
    volume: -10,
  });
  return connect(t, { wet: 0.2 });
}

// ================ 低音 ================
export function createBassWalk() {
  const Tone = T();
  const s = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    filter: { type: 'lowpass', Q: 3, rolloff: -24 },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.6, release: 0.2 },
    filterEnvelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.2, baseFrequency: 120, octaves: 2.5 },
    volume: -8,
  });
  return connect(s, { wet: 0.05 });
}

export function createBassPulse() {
  const Tone = T();
  const s = new Tone.MonoSynth({
    oscillator: { type: 'square' },
    filter: { type: 'lowpass' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 0.1 },
    filterEnvelope: { attack: 0.005, decay: 0.08, sustain: 0.2, release: 0.1, baseFrequency: 200, octaves: 2 },
    volume: -12,
  });
  return connect(s, { wet: 0.05 });
}

export function createBassFunk() {
  const Tone = T();
  const s = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.1 },
    filterEnvelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.12, baseFrequency: 150, octaves: 3.5 },
    volume: -9,
  });
  return connect(s, { wet: 0.08 });
}

export function createSubBass() {
  const Tone = T();
  const s = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.08, decay: 0.1, sustain: 0.9, release: 0.6 },
    volume: -6,
  });
  return connect(s, { wet: 0 });
}

export function createSynthBass() {
  const Tone = T();
  const s = new Tone.MonoSynth({
    oscillator: { type: 'fatsawtooth', count: 2, spread: 20 },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.2 },
    filterEnvelope: { attack: 0.005, decay: 0.15, sustain: 0.3, release: 0.2, baseFrequency: 180, octaves: 3 },
    volume: -10,
  });
  return connect(s, { wet: 0.08 });
}

// ================ 和声 / 铺底 ================
export function createPad() {
  const Tone = T();
  const s = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 28 },
    envelope: { attack: 0.6, decay: 0.4, sustain: 0.9, release: 1.4 },
    volume: -18,
  });
  const filter = new Tone.Filter(2200, 'lowpass');
  s.connect(filter);
  connect(filter, { wet: 0.45 });
  return s;
}

export function createArp() {
  const Tone = T();
  const s = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.2, release: 0.15 },
    volume: -14,
  });
  return connect(s, { wet: 0.3 });
}

export function createPiano() {
  const Tone = T();
  const s = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.4, sustain: 0.2, release: 0.8 },
    volume: -14,
  });
  return connect(s, { wet: 0.25 });
}

export function createStrings() {
  const Tone = T();
  const s = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 40 },
    envelope: { attack: 1.2, decay: 0.2, sustain: 0.95, release: 2.0 },
    volume: -20,
  });
  const filter = new Tone.Filter(3500, 'lowpass');
  s.connect(filter);
  connect(filter, { wet: 0.5 });
  return s;
}

export function createOrgan() {
  const Tone = T();
  const s = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.02, decay: 0.0, sustain: 1.0, release: 0.2 },
    volume: -22,
  });
  return connect(s, { wet: 0.25 });
}

export function createBell() {
  const Tone = T();
  const s = new Tone.FMSynth({
    harmonicity: 3.5,
    modulationIndex: 12,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.002, decay: 1.2, sustain: 0, release: 0.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0, release: 0.3 },
    volume: -16,
  });
  return connect(s, { wet: 0.4 });
}

// ================ 主旋律 ================
export function createLead() {
  const Tone = T();
  const s = new Tone.Synth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.25 },
    volume: -14,
  });
  const filter = new Tone.Filter(4000, 'lowpass');
  s.connect(filter);
  connect(filter, { wet: 0.25 });
  return s;
}

export function createPluck() {
  const Tone = T();
  const s = new Tone.PluckSynth({
    attackNoise: 0.8,
    dampening: 3200,
    resonance: 0.9,
    volume: -10,
  });
  return connect(s, { wet: 0.25 });
}

export function createWhistle() {
  const Tone = T();
  const s = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.04, decay: 0.1, sustain: 0.7, release: 0.2 },
    volume: -14,
  });
  const vibrato = new Tone.Vibrato(5, 0.05);
  s.connect(vibrato);
  connect(vibrato, { wet: 0.35 });
  return s;
}

export function createFMLead() {
  const Tone = T();
  const s = new Tone.FMSynth({
    harmonicity: 2,
    modulationIndex: 6,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.15, sustain: 0.7, release: 0.2 },
    volume: -16,
  });
  return connect(s, { wet: 0.3 });
}

export function createStaccato() {
  const Tone = T();
  const s = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.002, decay: 0.08, sustain: 0, release: 0.05 },
    volume: -16,
  });
  return connect(s, { wet: 0.2 });
}

// 中心映射：loopDef.synthId -> 工厂
export const SYNTH_FACTORIES = {
  kick: createKick,
  snare: createSnare,
  hat_closed: () => createHat(false),
  hat_open: () => createHat(true),
  clap: createClap,
  tom: createTom,

  bass_walk: createBassWalk,
  bass_pulse: createBassPulse,
  bass_funk: createBassFunk,
  sub_bass: createSubBass,
  synth_bass: createSynthBass,

  pad: createPad,
  arp: createArp,
  piano: createPiano,
  strings: createStrings,
  organ: createOrgan,
  bell: createBell,

  lead: createLead,
  pluck: createPluck,
  whistle: createWhistle,
  fm_lead: createFMLead,
  staccato: createStaccato,
};

export function createSynth(synthId) {
  const factory = SYNTH_FACTORIES[synthId];
  if (!factory) throw new Error('未知音色: ' + synthId);
  return factory();
}

export function setMasterVolume(db) {
  ensureMaster();
  master.gain.rampTo(window.Tone.dbToGain(db), 0.05);
}
