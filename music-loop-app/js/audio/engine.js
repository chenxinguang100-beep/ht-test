// 音频引擎：封装 Tone.Transport、Loop 激活/停用、参数变更排队
// 所有参数变更（调式、主音、速度、移调）统一排队到"下一小节"应用，保证无缝切换。

import { createSynth, ensureMaster, setMasterVolume } from './synth-factory.js';
import { degreeToMidi, midiToNoteName } from './scales.js';
import { getLoopById } from './loops.js';

const LOOP_END = '2m'; // 所有 loop 循环长度 = 2 小节

export class Engine {
  constructor() {
    this.rootMidi   = 60;     // C4
    this.modeKey    = 'major';
    this.bpm        = 110;
    this.transpose  = 0;      // 半音移调（线性加到 rootMidi）
    this.active     = new Map(); // loopId -> { loopDef, synth, part }
    this.pending    = null;      // { rootMidi?, modeKey?, transpose?, bpm? }
    this.onPendingChange = null; // 供 UI 指示器
    this.onBeat = null;          // 供 UI beat indicator (cb(bar, beat, sixteenth))
    this._tickerId = null;
  }

  // ============ 生命周期 ============
  async start() {
    const Tone = window.Tone;
    await Tone.start();
    ensureMaster();
    Tone.Transport.bpm.value = this.bpm;
    Tone.Transport.timeSignature = 4;
    Tone.Transport.start('+0.05');
    this._startTicker();
  }

  stop() {
    const Tone = window.Tone;
    Tone.Transport.stop();
    Tone.Transport.position = '0:0:0';
    this._stopTicker();
    if (this.onBeat) this.onBeat(0, 0, 0);
  }

  isRunning() {
    return window.Tone && window.Tone.Transport.state === 'started';
  }

  // ============ Loop 激活/停用 ============

  /** 激活 loop（点击卡片）。如果 Transport 在运行，自动对齐到下一个 2 小节边界。 */
  activate(loopId) {
    if (this.active.has(loopId)) return false;
    const loopDef = getLoopById(loopId);
    if (!loopDef) return false;

    const synth = createSynth(loopDef.synthId);
    const part = this._buildPart(loopDef, synth);

    const startTime = this._nextLoopBoundary();
    part.start(startTime);

    this.active.set(loopId, { loopDef, synth, part });
    return true;
  }

  /** 停用 loop。同样对齐到 2 小节边界停止（避免截断感）。 */
  deactivate(loopId) {
    const item = this.active.get(loopId);
    if (!item) return false;
    const endTime = this._nextDeactivateBoundary();
    item.part.stop(endTime);
    // 延迟释放资源
    const disposeAt = window.Tone.Time(endTime).toSeconds() + 0.5;
    window.Tone.Transport.scheduleOnce(() => {
      try { item.part.dispose(); item.synth.dispose(); } catch (e) {}
    }, disposeAt);
    this.active.delete(loopId);
    return true;
  }

  isActive(loopId) {
    return this.active.has(loopId);
  }

  clearAll() {
    for (const id of Array.from(this.active.keys())) this.deactivate(id);
  }

  // ============ 参数变更（排队到下一小节）============

  requestChange(patch) {
    this.pending = Object.assign(this.pending || {}, patch);

    // Transport 未启动时直接应用（没有回放内容，无需排队）
    if (!this.isRunning()) {
      this._applyPending(window.Tone.now());
      return;
    }

    if (this.onPendingChange) this.onPendingChange(this.pending);

    // 已安排过就不重复安排（pending 会合并到同一个回调）
    if (this._pendingApplyScheduled) return;
    this._pendingApplyScheduled = true;

    window.Tone.Transport.scheduleOnce((time) => {
      this._applyPending(time);
    }, this._nextBarTime());
  }

  _applyPending(time) {
    const Tone = window.Tone;
    if (!this.pending) return;
    const p = this.pending;

    if (typeof p.bpm === 'number') {
      Tone.Transport.bpm.rampTo(p.bpm, 0.08, time);
      this.bpm = p.bpm;
    }

    const pitchChanged =
      typeof p.rootMidi === 'number' ||
      typeof p.modeKey === 'string'  ||
      typeof p.transpose === 'number';

    if (typeof p.rootMidi === 'number') this.rootMidi = p.rootMidi;
    if (typeof p.modeKey === 'string')  this.modeKey  = p.modeKey;
    if (typeof p.transpose === 'number') this.transpose = p.transpose;

    if (pitchChanged) {
      // 重新生成所有音高类 loop 的 Part 事件
      for (const { loopDef, synth, part } of this.active.values()) {
        if (loopDef.category === 'rhythm') continue;
        part.clear();
        this._populateEvents(part, loopDef);
      }
    }

    this.pending = null;
    this._pendingApplyScheduled = false;
    if (this.onPendingChange) this.onPendingChange(null);
  }

  // ============ Part 构建 ============
  _buildPart(loopDef, synth) {
    const Tone = window.Tone;
    const callback = this._makeCallback(loopDef, synth);
    const part = new Tone.Part(callback, []);
    part.loop = true;
    part.loopEnd = LOOP_END;
    this._populateEvents(part, loopDef);
    return part;
  }

  _makeCallback(loopDef, synth) {
    if (loopDef.category === 'rhythm') {
      return (time, ev) => {
        const vel = ev.velocity != null ? ev.velocity : 0.9;
        if (ev.note) {
          // 有音高的鼓件（kick/tom）
          synth.triggerAttackRelease(ev.note, ev.duration || '8n', time, vel);
        } else {
          // 噪声类（snare/hat/clap），签名不同
          synth.triggerAttackRelease(ev.duration || '16n', time, vel);
        }
      };
    }
    // 音高类：note 在 _populateEvents 时预先计算并注入
    return (time, ev) => {
      const vel = ev.velocity != null ? ev.velocity : 0.8;
      if (ev.notes && ev.notes.length) {
        synth.triggerAttackRelease(ev.notes, ev.duration || '4n', time, vel);
      } else if (ev.note) {
        synth.triggerAttackRelease(ev.note, ev.duration || '4n', time, vel);
      }
    };
  }

  _populateEvents(part, loopDef) {
    const effectiveRoot = this.rootMidi + this.transpose;
    for (const ev of loopDef.events) {
      if (loopDef.category === 'rhythm') {
        part.add(ev.time, ev);
      } else if (Array.isArray(ev.degrees)) {
        const notes = ev.degrees.map(d =>
          midiToNoteName(degreeToMidi(d, ev.octave || 0, effectiveRoot, this.modeKey))
        );
        part.add(ev.time, Object.assign({}, ev, { notes }));
      } else {
        const midi = degreeToMidi(ev.degree, ev.octave || 0, effectiveRoot, this.modeKey);
        part.add(ev.time, Object.assign({}, ev, { note: midiToNoteName(midi) }));
      }
    }
  }

  // ============ 时间对齐 ============
  _nextBarTime() {
    const Tone = window.Tone;
    const pos = Tone.Transport.position.toString(); // "bars:beats:sixteenths"
    const [barsStr] = pos.split(':');
    const nextBar = parseInt(barsStr, 10) + 1;
    return `${nextBar}:0:0`;
  }

  _nextLoopBoundary() {
    // 对齐到"当前"2 小节边界，让 Part 从 0 开始、自动跳过已过事件。
    // 所有激活 loop 相位同步，且新 loop 能立刻加入而不必等待。
    const Tone = window.Tone;
    if (!this.isRunning()) return 0;
    const pos = Tone.Transport.position.toString();
    const [barsStr] = pos.split(':');
    const bars = parseInt(barsStr, 10);
    const currentBoundary = bars - (bars % 2);
    return `${currentBoundary}:0:0`;
  }

  _nextDeactivateBoundary() {
    // 停用仍用"下一个"2 小节边界，让当前循环自然结束。
    const Tone = window.Tone;
    if (!this.isRunning()) return 0;
    const pos = Tone.Transport.position.toString();
    const [barsStr, beatsStr, sixStr] = pos.split(':');
    const bars = parseInt(barsStr, 10);
    const beats = parseFloat(beatsStr || '0');
    const six = parseFloat(sixStr || '0');
    const onBoundary = (bars % 2 === 0) && beats === 0 && six === 0;
    if (onBoundary) return `${bars}:0:0`;
    const nextEven = bars + (bars % 2 === 0 ? 2 : 1);
    return `${nextEven}:0:0`;
  }

  // ============ UI 节拍回调 ============
  _startTicker() {
    if (this._tickerId != null) return;
    const Tone = window.Tone;
    this._tickerId = Tone.Transport.scheduleRepeat((time) => {
      if (!this.onBeat) return;
      const pos = Tone.Transport.position.toString();
      const [barsStr, beatsStr, sixStr] = pos.split(':');
      const bar = parseInt(barsStr, 10);
      const beat = parseInt(beatsStr || '0', 10);
      const sixteenth = Math.floor(parseFloat(sixStr || '0'));
      window.Tone.Draw.schedule(() => {
        if (this.onBeat) this.onBeat(bar, beat, sixteenth);
      }, time);
    }, '8n');
  }

  _stopTicker() {
    if (this._tickerId == null) return;
    window.Tone.Transport.clear(this._tickerId);
    this._tickerId = null;
  }

  // ============ 其他 ============
  setMasterDb(db) { setMasterVolume(db); }
}
