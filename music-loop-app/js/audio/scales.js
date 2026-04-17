// 调式/音阶/音高工具函数
// 所有 loop 以"级数"(1-based) + "八度偏移" 存储，运行时根据全局 root+mode 映射到 MIDI。

export const SCALES = {
  major:          [0, 2, 4, 5, 7, 9, 11],
  natural_minor:  [0, 2, 3, 5, 7, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
  melodic_minor:  [0, 2, 3, 5, 7, 9, 11],
  dorian:         [0, 2, 3, 5, 7, 9, 10],
  mixolydian:     [0, 2, 4, 5, 7, 9, 10],
};

export const MODE_LABELS = {
  major: '大调',
  natural_minor: '自然小调',
  harmonic_minor: '和声小调',
  melodic_minor: '旋律小调',
  dorian: '多利亚',
  mixolydian: '混合利底亚',
};

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * 将"级数(1..N) + 八度偏移" 转为 MIDI 音高。
 * 级数支持跨八度：8 = 下一个八度的 1; 0 = 下方八度的 7; -1 = 下方八度的 6 …
 */
export function degreeToMidi(degree, octaveOffset, rootMidi, modeKey) {
  const intervals = SCALES[modeKey] || SCALES.major;
  const scaleLen = intervals.length;           // 7
  // 将 1-based 级数转为 0-based 索引（可能跨八度）
  const d0 = degree - 1;
  const octShift = Math.floor(d0 / scaleLen);
  const idx = ((d0 % scaleLen) + scaleLen) % scaleLen;
  return rootMidi + 12 * (octaveOffset + octShift) + intervals[idx];
}

export function midiToNoteName(midi) {
  const n = Math.round(midi);
  const pc = ((n % 12) + 12) % 12;
  const oct = Math.floor(n / 12) - 1;
  return NOTE_NAMES[pc] + oct;
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** 便捷：把多个级数一次性转为 Tone.js 音名数组（用于和弦）。 */
export function degreesToNotes(degrees, octaveOffset, rootMidi, modeKey) {
  return degrees.map(d => midiToNoteName(degreeToMidi(d, octaveOffset, rootMidi, modeKey)));
}
