// 32 个 Loop 的数据定义。
// 统一约定：
//  - 循环长度 = 2 小节 (loopEnd: "2m")
//  - 时间格式 "bar:beat:sixteenth"，相对 Part 起始
//  - category: rhythm | bass | harmony | melody
//  - synthId:  指向 synth-factory.js 中的工厂
//  - 音高类 loop 的事件使用 { degree, octave }（可跨八度：degree>7 自动升八度）
//  - 和弦类 loop 使用 { degrees:[…] } 代替 degree
//  - 节奏类 loop 使用 { drum: 'kick'|'tom_low'|... }，与音阶/调式无关
//  - 所有 duration 使用 Tone.js 时长记号

export const CATEGORIES = [
  { key: 'rhythm',  label: '节奏', emoji: '🥁', color: 'var(--rhythm)' },
  { key: 'bass',    label: '低音', emoji: '🎸', color: 'var(--bass)' },
  { key: 'harmony', label: '和声', emoji: '🎶', color: 'var(--harmony)' },
  { key: 'melody',  label: '旋律', emoji: '🎹', color: 'var(--melody)' },
];

// ========= 工具：快速填充等间距 8 分音符 =========
function everyEighth(bars, eventBuilder) {
  const out = [];
  for (let b = 0; b < bars; b++) {
    for (let beat = 0; beat < 4; beat++) {
      for (let s = 0; s < 4; s += 2) { // 每拍 2 个 8 分
        const time = `${b}:${beat}:${s}`;
        out.push(eventBuilder(time, b, beat, s));
      }
    }
  }
  return out;
}

// ===================================================
// 🥁 节奏 (6)
// ===================================================
const RHYTHM_LOOPS = [
  {
    id: 'beat_kick', category: 'rhythm', name: '底鼓', icon: '🥁',
    synthId: 'kick',
    events: [
      { time: '0:0:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '0:1:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '0:2:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '0:3:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '1:0:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '1:1:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '1:2:0', drum: 'kick', note: 'C1', duration: '8n' },
      { time: '1:3:0', drum: 'kick', note: 'C1', duration: '8n' },
    ],
  },
  {
    id: 'beat_snare', category: 'rhythm', name: '军鼓', icon: '🪘',
    synthId: 'snare',
    events: [
      { time: '0:1:0', duration: '8n' },
      { time: '0:3:0', duration: '8n' },
      { time: '1:1:0', duration: '8n' },
      { time: '1:3:0', duration: '8n' },
    ],
  },
  {
    id: 'beat_hat', category: 'rhythm', name: '闭镲', icon: '🎩',
    synthId: 'hat_closed',
    events: everyEighth(2, (time) => ({ time, duration: '16n' })),
  },
  {
    id: 'beat_open_hat', category: 'rhythm', name: '开镲', icon: '🌀',
    synthId: 'hat_open',
    events: [
      { time: '0:3:2', duration: '8n' },
      { time: '1:3:2', duration: '8n' },
    ],
  },
  {
    id: 'beat_clap', category: 'rhythm', name: '拍手', icon: '👏',
    synthId: 'clap',
    events: [
      { time: '0:1:0', duration: '8n' },
      { time: '0:3:0', duration: '8n' },
      { time: '1:1:0', duration: '8n' },
      { time: '1:2:2', duration: '8n', velocity: 0.7 },
      { time: '1:3:0', duration: '8n' },
    ],
  },
  {
    id: 'beat_tom_fill', category: 'rhythm', name: '碎拍 Tom', icon: '🔊',
    synthId: 'tom',
    events: [
      { time: '0:3:2', drum: 'tom', note: 'A2', duration: '16n' },
      { time: '1:2:0', drum: 'tom', note: 'C2', duration: '16n' },
      { time: '1:2:2', drum: 'tom', note: 'E2', duration: '16n' },
      { time: '1:3:0', drum: 'tom', note: 'G2', duration: '16n' },
      { time: '1:3:2', drum: 'tom', note: 'A2', duration: '16n' },
      { time: '1:3:3', drum: 'tom', note: 'C3', duration: '16n' },
    ],
  },
];

// ===================================================
// 🎸 低音 (6)
// ===================================================
const BASS_LOOPS = [
  {
    id: 'bass_walk', category: 'bass', name: '行走贝斯', icon: '🚶',
    synthId: 'bass_walk',
    events: [
      { time: '0:0:0', degree: 1, octave: -2, duration: '4n' },
      { time: '0:1:0', degree: 3, octave: -2, duration: '4n' },
      { time: '0:2:0', degree: 5, octave: -2, duration: '4n' },
      { time: '0:3:0', degree: 6, octave: -2, duration: '4n' },
      { time: '1:0:0', degree: 5, octave: -2, duration: '4n' },
      { time: '1:1:0', degree: 4, octave: -2, duration: '4n' },
      { time: '1:2:0', degree: 3, octave: -2, duration: '4n' },
      { time: '1:3:0', degree: 2, octave: -2, duration: '4n' },
    ],
  },
  {
    id: 'bass_pulse', category: 'bass', name: '脉冲贝斯', icon: '⚡',
    synthId: 'bass_pulse',
    events: everyEighth(2, (time, b) => ({
      time,
      degree: b === 0 ? 1 : 5,
      octave: -2,
      duration: '8n',
    })),
  },
  {
    id: 'bass_funk', category: 'bass', name: 'Funk 切音', icon: '🕺',
    synthId: 'bass_funk',
    events: [
      { time: '0:0:0', degree: 1, octave: -2, duration: '16n' },
      { time: '0:0:3', degree: 1, octave: -2, duration: '16n' },
      { time: '0:1:2', degree: 3, octave: -2, duration: '16n' },
      { time: '0:2:0', degree: 1, octave: -2, duration: '16n' },
      { time: '0:3:2', degree: 5, octave: -2, duration: '16n' },
      { time: '1:0:0', degree: 1, octave: -2, duration: '16n' },
      { time: '1:1:2', degree: 4, octave: -2, duration: '16n' },
      { time: '1:2:0', degree: 3, octave: -2, duration: '16n' },
      { time: '1:2:3', degree: 3, octave: -2, duration: '16n' },
      { time: '1:3:2', degree: 5, octave: -2, duration: '16n' },
    ],
  },
  {
    id: 'sub_bass', category: 'bass', name: 'Sub 低频', icon: '🌊',
    synthId: 'sub_bass',
    events: [
      { time: '0:0:0', degree: 1, octave: -2, duration: '1m' },
      { time: '1:0:0', degree: 5, octave: -2, duration: '1m' },
    ],
  },
  {
    id: 'synth_bass', category: 'bass', name: '合成贝斯', icon: '🎛',
    synthId: 'synth_bass',
    events: [
      { time: '0:0:0', degree: 1, octave: -2, duration: '8n' },
      { time: '0:1:0', degree: 5, octave: -2, duration: '8n' },
      { time: '0:2:0', degree: 8, octave: -2, duration: '8n' },
      { time: '0:3:0', degree: 5, octave: -2, duration: '8n' },
      { time: '1:0:0', degree: 6, octave: -2, duration: '8n' },
      { time: '1:1:0', degree: 10, octave: -2, duration: '8n' },
      { time: '1:2:0', degree: 4, octave: -2, duration: '8n' },
      { time: '1:3:0', degree: 5, octave: -2, duration: '8n' },
    ],
  },
  {
    id: 'bass_octave', category: 'bass', name: '八度跳', icon: '🦘',
    synthId: 'bass_pulse',
    events: everyEighth(2, (time, b, beat, s) => {
      const isUp = (beat * 2 + s / 2) % 2 === 1;
      const deg = b === 0 ? 1 : 5;
      return { time, degree: deg, octave: isUp ? -1 : -2, duration: '8n' };
    }),
  },
];

// ===================================================
// 🎶 和声 (10)
// ===================================================
const HARMONY_LOOPS = [
  {
    id: 'harm_pad_tonic', category: 'harmony', name: '主和弦长音', icon: '☁️',
    synthId: 'pad',
    events: [{ time: '0:0:0', degrees: [1, 3, 5, 8], octave: 0, duration: '2m' }],
  },
  {
    id: 'harm_pad_IV_V', category: 'harmony', name: 'Pad IV-V', icon: '🌤',
    synthId: 'pad',
    events: [
      { time: '0:0:0', degrees: [4, 6, 8], octave: 0, duration: '1m' },
      { time: '1:0:0', degrees: [5, 7, 9], octave: 0, duration: '1m' },
    ],
  },
  {
    id: 'harm_pad_vi_IV', category: 'harmony', name: 'Pad vi-IV', icon: '🌙',
    synthId: 'pad',
    events: [
      { time: '0:0:0', degrees: [6, 8, 10], octave: 0, duration: '1m' },
      { time: '1:0:0', degrees: [4, 6, 8], octave: 0, duration: '1m' },
    ],
  },
  {
    id: 'harm_pad_prog', category: 'harmony', name: 'Pad 进行', icon: '🌈',
    synthId: 'pad',
    events: [
      { time: '0:0:0', degrees: [1, 3, 5], octave: 0, duration: '2n' },
      { time: '0:2:0', degrees: [5, 7, 9], octave: 0, duration: '2n' },
      { time: '1:0:0', degrees: [6, 8, 10], octave: 0, duration: '2n' },
      { time: '1:2:0', degrees: [4, 6, 8], octave: 0, duration: '2n' },
    ],
  },
  {
    id: 'harm_arp_up', category: 'harmony', name: '上行琶音', icon: '⬆️',
    synthId: 'arp',
    events: [
      { time: '0:0:0', degree: 1, octave: 0, duration: '8n' },
      { time: '0:0:2', degree: 3, octave: 0, duration: '8n' },
      { time: '0:1:0', degree: 5, octave: 0, duration: '8n' },
      { time: '0:1:2', degree: 8, octave: 0, duration: '8n' },
      { time: '0:2:0', degree: 1, octave: 0, duration: '8n' },
      { time: '0:2:2', degree: 3, octave: 0, duration: '8n' },
      { time: '0:3:0', degree: 5, octave: 0, duration: '8n' },
      { time: '0:3:2', degree: 8, octave: 0, duration: '8n' },
      { time: '1:0:0', degree: 5, octave: 0, duration: '8n' },
      { time: '1:0:2', degree: 7, octave: 0, duration: '8n' },
      { time: '1:1:0', degree: 9, octave: 0, duration: '8n' },
      { time: '1:1:2', degree: 12, octave: 0, duration: '8n' },
      { time: '1:2:0', degree: 4, octave: 0, duration: '8n' },
      { time: '1:2:2', degree: 6, octave: 0, duration: '8n' },
      { time: '1:3:0', degree: 8, octave: 0, duration: '8n' },
      { time: '1:3:2', degree: 11, octave: 0, duration: '8n' },
    ],
  },
  {
    id: 'harm_arp_down', category: 'harmony', name: '下行琶音', icon: '⬇️',
    synthId: 'arp',
    events: [
      { time: '0:0:0', degree: 8, octave: 0, duration: '8n' },
      { time: '0:0:2', degree: 5, octave: 0, duration: '8n' },
      { time: '0:1:0', degree: 3, octave: 0, duration: '8n' },
      { time: '0:1:2', degree: 1, octave: 0, duration: '8n' },
      { time: '0:2:0', degree: 8, octave: 0, duration: '8n' },
      { time: '0:2:2', degree: 5, octave: 0, duration: '8n' },
      { time: '0:3:0', degree: 3, octave: 0, duration: '8n' },
      { time: '0:3:2', degree: 1, octave: 0, duration: '8n' },
      { time: '1:0:0', degree: 12, octave: 0, duration: '8n' },
      { time: '1:0:2', degree: 9, octave: 0, duration: '8n' },
      { time: '1:1:0', degree: 7, octave: 0, duration: '8n' },
      { time: '1:1:2', degree: 5, octave: 0, duration: '8n' },
      { time: '1:2:0', degree: 10, octave: 0, duration: '8n' },
      { time: '1:2:2', degree: 8, octave: 0, duration: '8n' },
      { time: '1:3:0', degree: 6, octave: 0, duration: '8n' },
      { time: '1:3:2', degree: 4, octave: 0, duration: '8n' },
    ],
  },
  {
    id: 'harm_piano', category: 'harmony', name: '钢琴伴奏', icon: '🎹',
    synthId: 'piano',
    events: [
      { time: '0:0:0', degrees: [1, 3, 5], octave: 0, duration: '4n' },
      { time: '0:2:0', degrees: [1, 3, 5], octave: 0, duration: '4n' },
      { time: '0:3:2', degrees: [5, 7, 9], octave: 0, duration: '8n' },
      { time: '1:0:0', degrees: [6, 8, 10], octave: 0, duration: '4n' },
      { time: '1:2:0', degrees: [4, 6, 8], octave: 0, duration: '4n' },
      { time: '1:3:2', degrees: [5, 7, 9], octave: 0, duration: '8n' },
    ],
  },
  {
    id: 'harm_strings', category: 'harmony', name: '弦乐长音', icon: '🎻',
    synthId: 'strings',
    events: [
      { time: '0:0:0', degrees: [1, 3, 5, 8], octave: 0, duration: '1m' },
      { time: '1:0:0', degrees: [4, 6, 8, 10], octave: 0, duration: '1m' },
    ],
  },
  {
    id: 'harm_organ', category: 'harmony', name: '管风琴', icon: '⛪',
    synthId: 'organ',
    events: [
      { time: '0:0:0', degrees: [1, 3, 5], octave: 0, duration: '2n' },
      { time: '0:2:0', degrees: [1, 3, 5], octave: 0, duration: '2n' },
      { time: '1:0:0', degrees: [4, 6, 8], octave: 0, duration: '2n' },
      { time: '1:2:0', degrees: [5, 7, 9], octave: 0, duration: '2n' },
    ],
  },
  {
    id: 'harm_bell', category: 'harmony', name: '铃铛和声', icon: '🔔',
    synthId: 'bell',
    events: [
      { time: '0:1:0', degree: 8, octave: 0, duration: '4n' },
      { time: '0:2:2', degree: 10, octave: 0, duration: '4n' },
      { time: '0:3:2', degree: 12, octave: 0, duration: '4n' },
      { time: '1:0:2', degree: 10, octave: 0, duration: '4n' },
      { time: '1:2:0', degree: 8, octave: 0, duration: '4n' },
      { time: '1:3:2', degree: 6, octave: 0, duration: '4n' },
    ],
  },
];

// ===================================================
// 🎹 主旋律 (10)
// ===================================================
const MELODY_LOOPS = [
  {
    id: 'mel_lead_a', category: 'melody', name: '主题 A', icon: '🎵',
    synthId: 'lead',
    events: [
      { time: '0:0:0', degree: 1, octave: 1, duration: '4n' },
      { time: '0:1:0', degree: 3, octave: 1, duration: '4n' },
      { time: '0:2:0', degree: 5, octave: 1, duration: '4n' },
      { time: '0:3:0', degree: 3, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:1:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:2:0', degree: 3, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 2, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_lead_b', category: 'melody', name: '主题 B', icon: '🎶',
    synthId: 'lead',
    events: [
      { time: '0:0:0', degree: 5, octave: 1, duration: '8n' },
      { time: '0:0:2', degree: 3, octave: 1, duration: '8n' },
      { time: '0:1:0', degree: 2, octave: 1, duration: '4n' },
      { time: '0:2:0', degree: 1, octave: 1, duration: '4n' },
      { time: '0:3:0', degree: 3, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:1:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:2:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 3, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_lead_c', category: 'melody', name: '高音主题', icon: '🎼',
    synthId: 'lead',
    events: [
      { time: '0:0:0', degree: 8, octave: 1, duration: '4n' },
      { time: '0:1:0', degree: 7, octave: 1, duration: '4n' },
      { time: '0:2:0', degree: 5, octave: 1, duration: '4n' },
      { time: '0:3:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 8, octave: 1, duration: '4n' },
      { time: '1:1:0', degree: 10, octave: 1, duration: '4n' },
      { time: '1:2:0', degree: 8, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 5, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_pluck_a', category: 'melody', name: '拨弦 A', icon: '🪕',
    synthId: 'pluck',
    events: [
      { time: '0:0:0', degree: 1, octave: 1, duration: '8n' },
      { time: '0:0:2', degree: 5, octave: 1, duration: '8n' },
      { time: '0:1:0', degree: 3, octave: 1, duration: '8n' },
      { time: '0:1:2', degree: 1, octave: 1, duration: '8n' },
      { time: '0:2:0', degree: 5, octave: 1, duration: '8n' },
      { time: '0:2:2', degree: 3, octave: 1, duration: '8n' },
      { time: '0:3:0', degree: 6, octave: 1, duration: '8n' },
      { time: '0:3:2', degree: 5, octave: 1, duration: '8n' },
      { time: '1:0:0', degree: 1, octave: 1, duration: '8n' },
      { time: '1:0:2', degree: 5, octave: 1, duration: '8n' },
      { time: '1:1:0', degree: 3, octave: 1, duration: '8n' },
      { time: '1:1:2', degree: 1, octave: 1, duration: '8n' },
      { time: '1:2:0', degree: 4, octave: 1, duration: '8n' },
      { time: '1:2:2', degree: 6, octave: 1, duration: '8n' },
      { time: '1:3:0', degree: 5, octave: 1, duration: '8n' },
      { time: '1:3:2', degree: 3, octave: 1, duration: '8n' },
    ],
  },
  {
    id: 'mel_pluck_b', category: 'melody', name: '五声拨弦', icon: '🎋',
    synthId: 'pluck',
    events: [
      { time: '0:0:0', degree: 1, octave: 1, duration: '4n' },
      { time: '0:1:0', degree: 2, octave: 1, duration: '4n' },
      { time: '0:2:0', degree: 3, octave: 1, duration: '4n' },
      { time: '0:3:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:1:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:2:0', degree: 3, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 1, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_bell', category: 'melody', name: '铃铛旋律', icon: '🎐',
    synthId: 'bell',
    events: [
      { time: '0:0:0', degree: 8, octave: 1, duration: '4n' },
      { time: '0:1:2', degree: 10, octave: 1, duration: '4n' },
      { time: '0:3:0', degree: 8, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 12, octave: 1, duration: '4n' },
      { time: '1:1:2', degree: 10, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 8, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_whistle', category: 'melody', name: '口哨', icon: '😗',
    synthId: 'whistle',
    events: [
      { time: '0:0:0', degree: 5, octave: 1, duration: '4n.' },
      { time: '0:1:2', degree: 8, octave: 1, duration: '4n.' },
      { time: '0:3:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 5, octave: 1, duration: '2n' },
      { time: '1:2:0', degree: 3, octave: 1, duration: '2n' },
    ],
  },
  {
    id: 'mel_fm_lead', category: 'melody', name: 'FM 主奏', icon: '✨',
    synthId: 'fm_lead',
    events: [
      { time: '0:0:0', degree: 1, octave: 1, duration: '8n' },
      { time: '0:0:2', degree: 3, octave: 1, duration: '8n' },
      { time: '0:1:0', degree: 5, octave: 1, duration: '4n' },
      { time: '0:2:0', degree: 3, octave: 1, duration: '8n' },
      { time: '0:2:2', degree: 1, octave: 1, duration: '8n' },
      { time: '0:3:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:0:0', degree: 8, octave: 1, duration: '4n' },
      { time: '1:1:0', degree: 5, octave: 1, duration: '4n' },
      { time: '1:2:0', degree: 6, octave: 1, duration: '4n' },
      { time: '1:3:0', degree: 3, octave: 1, duration: '4n' },
    ],
  },
  {
    id: 'mel_penta', category: 'melody', name: '五声快板', icon: '🎎',
    synthId: 'pluck',
    events: [
      { time: '0:0:0', degree: 1, octave: 1, duration: '8n' },
      { time: '0:0:2', degree: 3, octave: 1, duration: '8n' },
      { time: '0:1:0', degree: 5, octave: 1, duration: '8n' },
      { time: '0:1:2', degree: 6, octave: 1, duration: '8n' },
      { time: '0:2:0', degree: 5, octave: 1, duration: '8n' },
      { time: '0:2:2', degree: 3, octave: 1, duration: '8n' },
      { time: '0:3:0', degree: 5, octave: 1, duration: '8n' },
      { time: '0:3:2', degree: 6, octave: 1, duration: '8n' },
      { time: '1:0:0', degree: 8, octave: 1, duration: '8n' },
      { time: '1:0:2', degree: 6, octave: 1, duration: '8n' },
      { time: '1:1:0', degree: 5, octave: 1, duration: '8n' },
      { time: '1:1:2', degree: 3, octave: 1, duration: '8n' },
      { time: '1:2:0', degree: 2, octave: 1, duration: '8n' },
      { time: '1:2:2', degree: 3, octave: 1, duration: '8n' },
      { time: '1:3:0', degree: 5, octave: 1, duration: '8n' },
      { time: '1:3:2', degree: 1, octave: 1, duration: '8n' },
    ],
  },
  {
    id: 'mel_staccato', category: 'melody', name: '跳音 Stab', icon: '💥',
    synthId: 'staccato',
    events: [
      { time: '0:0:0', degree: 5, octave: 1, duration: '16n' },
      { time: '0:1:0', degree: 5, octave: 1, duration: '16n' },
      { time: '0:2:0', degree: 3, octave: 1, duration: '16n' },
      { time: '0:3:0', degree: 1, octave: 1, duration: '16n' },
      { time: '1:0:0', degree: 2, octave: 1, duration: '16n' },
      { time: '1:1:0', degree: 2, octave: 1, duration: '16n' },
      { time: '1:2:0', degree: 3, octave: 1, duration: '16n' },
      { time: '1:3:0', degree: 5, octave: 1, duration: '16n' },
    ],
  },
];

export const ALL_LOOPS = [
  ...RHYTHM_LOOPS,
  ...BASS_LOOPS,
  ...HARMONY_LOOPS,
  ...MELODY_LOOPS,
];

export const LOOPS_BY_CATEGORY = CATEGORIES.reduce((acc, c) => {
  acc[c.key] = ALL_LOOPS.filter(l => l.category === c.key);
  return acc;
}, {});

export function getLoopById(id) {
  return ALL_LOOPS.find(l => l.id === id);
}
