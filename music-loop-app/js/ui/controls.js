// 顶部控制台：调式/主音/速度/移调 + 节拍指示器 + 进度

export class Controls {
  constructor(engine) {
    this.engine = engine;

    this.btnPlay   = document.getElementById('btn-play');
    this.btnStop   = document.getElementById('btn-stop');
    this.btnClear  = document.getElementById('btn-clear');
    this.btnRandom = document.getElementById('btn-random');

    this.selMode  = document.getElementById('sel-mode');
    this.selRoot  = document.getElementById('sel-root');
    this.inpBpm   = document.getElementById('inp-bpm');
    this.inpTrans = document.getElementById('inp-transpose');
    this.lblBpm   = document.getElementById('lbl-bpm');
    this.lblTrans = document.getElementById('lbl-trans');

    this.pendingEl = document.getElementById('pending-indicator');
    this.positionEl = document.getElementById('position-label');
    this.beatCells = document.getElementById('beat-cells');

    this._buildBeatCells();
    this._wire();
  }

  _buildBeatCells() {
    this.beatCells.innerHTML = '';
    // 2 小节 * 4 拍 = 8 格
    for (let i = 0; i < 8; i++) {
      const c = document.createElement('div');
      c.className = 'cell' + (i % 4 === 0 ? ' downbeat' : '');
      this.beatCells.appendChild(c);
    }
  }

  _wire() {
    this.selMode.addEventListener('change', () => {
      this.engine.requestChange({ modeKey: this.selMode.value });
    });
    this.selRoot.addEventListener('change', () => {
      this.engine.requestChange({ rootMidi: parseInt(this.selRoot.value, 10) });
    });
    this.inpBpm.addEventListener('input', () => {
      const v = parseInt(this.inpBpm.value, 10);
      this.lblBpm.textContent = v;
    });
    this.inpBpm.addEventListener('change', () => {
      this.engine.requestChange({ bpm: parseInt(this.inpBpm.value, 10) });
    });
    this.inpTrans.addEventListener('input', () => {
      const v = parseInt(this.inpTrans.value, 10);
      this.lblTrans.textContent = (v > 0 ? '+' : '') + v;
    });
    this.inpTrans.addEventListener('change', () => {
      this.engine.requestChange({ transpose: parseInt(this.inpTrans.value, 10) });
    });

    this.engine.onPendingChange = (pending) => {
      this.pendingEl.classList.toggle('active', !!pending);
    };

    this.engine.onBeat = (bar, beat, sixteenth) => {
      this.positionEl.textContent = `${bar} : ${beat} : ${sixteenth}`;
      // 2 小节 8 拍闪烁
      const phase = (bar % 2) * 4 + beat;
      const cells = this.beatCells.children;
      for (let i = 0; i < cells.length; i++) {
        cells[i].classList.toggle('active', i === phase);
      }
    };
  }

  setPlayingState(isPlaying) {
    this.btnPlay.textContent = isPlaying ? '⏸ 暂停' : '▶ 播放';
    this.btnPlay.classList.toggle('primary', !isPlaying);
  }
}
