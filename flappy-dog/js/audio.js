/**
 * AudioAnalyzer
 * 麦克风输入采集，实时分析音量（RMS）和音调（FFT主频）
 *
 * 机制：
 *   isActive   — 有声音输入（超过噪音底线）→ 柴犬前进
 *   shouldJump — 音量突增（大声喊/拍手）或高音调（>800Hz） → 起跳
 */
class AudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.stream = null;
    this.isReady = false;

    // 当前读数
    this.volume = 0;
    this.smoothedVolume = 0;
    this.pitch = 0;

    // 阈值（会在 calibrate 后自动调整）
    this.noiseFloor = 0.008;
    this.activeThreshold = 0.015;  // 有声 → 前进
    this.jumpThreshold = 0.07;     // 大声 → 起跳
    this.pitchJumpHz = 800;        // 高音调阈值 (Hz) → 也触发跳跃

    // 数据缓冲区
    this._timeDomain = null;
    this._freqDomain = null;
  }

  async init() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,  // 保留原始信号，利于音调检测
        autoGainControl: false,
      },
    });

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.25;

    const src = this.audioContext.createMediaStreamSource(this.stream);
    src.connect(this.analyser);

    this._timeDomain = new Float32Array(this.analyser.fftSize);
    this._freqDomain = new Float32Array(this.analyser.frequencyBinCount);

    this.isReady = true;
    this._calibrate();
  }

  /** 采集约 1s 环境噪音，自动设置阈值 */
  _calibrate() {
    const samples = [];
    const id = setInterval(() => {
      if (!this.isReady) return;
      this.analyser.getFloatTimeDomainData(this._timeDomain);
      samples.push(this._rms(this._timeDomain));
    }, 60);

    setTimeout(() => {
      clearInterval(id);
      if (samples.length === 0) return;
      const floor = Math.max(...samples);
      this.noiseFloor = floor;
      this.activeThreshold = floor + 0.008;
      // 跳跃阈值：噪音底线的 5 倍，但至少 0.05
      this.jumpThreshold = Math.max(floor * 5, 0.05);
    }, 1000);
  }

  update() {
    if (!this.isReady) return;

    // 音量 RMS
    this.analyser.getFloatTimeDomainData(this._timeDomain);
    this.volume = this._rms(this._timeDomain);
    this.smoothedVolume = this.smoothedVolume * 0.65 + this.volume * 0.35;

    // 音调（主频 Hz）
    this.pitch = this._dominantPitch();
  }

  _rms(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    return Math.sqrt(sum / data.length);
  }

  _dominantPitch() {
    this.analyser.getFloatFrequencyData(this._freqDomain);
    const sr = this.audioContext.sampleRate;
    const binHz = sr / this.analyser.fftSize;

    const minBin = Math.floor(80 / binHz);
    const maxBin = Math.floor(3500 / binHz);

    let maxDb = -Infinity;
    let maxBin2 = minBin;
    for (let i = minBin; i <= maxBin; i++) {
      if (this._freqDomain[i] > maxDb) {
        maxDb = this._freqDomain[i];
        maxBin2 = i;
      }
    }
    // 信号太弱则不报音调
    return maxDb > -45 ? maxBin2 * binHz : 0;
  }

  /** 有声输入（前进） */
  get isActive() {
    return this.volume > this.activeThreshold;
  }

  /** 大声/高音 → 起跳 */
  get shouldJump() {
    const loudJump = this.volume > this.jumpThreshold;
    const pitchJump = this.pitch > this.pitchJumpHz && this.isActive;
    return loudJump || pitchJump;
  }

  /**
   * 音量条百分比（0-100），以跳跃阈值为 50%
   * 便于在 UI 上标记跳跃线位置
   */
  get volumePercent() {
    return Math.min(100, (this.smoothedVolume / (this.jumpThreshold * 2)) * 100);
  }

  destroy() {
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioContext) this.audioContext.close();
  }
}
