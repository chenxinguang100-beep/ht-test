// 舞台：4 行（节奏/低音/和声/旋律），每行展示 category 内已激活的 loop 角色
// 点击角色 → 停用对应 loop

import { CATEGORIES, LOOPS_BY_CATEGORY } from '../audio/loops.js';

const EMOJI_POOL = ['🐻', '🦊', '🐼', '🐨', '🐯', '🦁', '🐸', '🐵', '🐶', '🐱',
                    '🐰', '🐹', '🦝', '🐺', '🦦', '🦥', '🐮', '🐷', '🦄', '🐙'];

export class Stage {
  constructor(root) {
    this.root = root;
    this.slotNodes = new Map(); // loopId -> DOM 节点（已填充时）
    this._render();
  }

  _render() {
    this.root.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'stage-row cat-' + cat.key;

      const label = document.createElement('div');
      label.className = 'row-label';
      label.innerHTML =
        `<div class="row-emoji">${cat.emoji}</div>` +
        `<div>${cat.label}</div>`;
      row.appendChild(label);

      const slots = document.createElement('div');
      slots.className = 'row-slots';
      slots.dataset.category = cat.key;

      const loops = LOOPS_BY_CATEGORY[cat.key];
      loops.forEach((loop, i) => {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.loopId = loop.id;
        slot.dataset.name = loop.name;
        slot.title = loop.name;
        // 空槽时显示淡淡的占位图标
        slot.innerHTML = `<span class="placeholder" style="opacity:.25">${loop.icon}</span>`;
        slot.addEventListener('click', () => this._handleClick(loop.id));
        slots.appendChild(slot);
      });

      row.appendChild(slots);
      this.root.appendChild(row);
    });
  }

  _handleClick(loopId) {
    if (this.onSlotClick) this.onSlotClick(loopId);
  }

  /** 将 slot 变成"角色上场"状态 */
  fill(loopId) {
    const slot = this.root.querySelector(`.slot[data-loop-id="${loopId}"]`);
    if (!slot) return;
    const emoji = this._pickEmojiFor(loopId);
    slot.classList.add('filled');
    slot.innerHTML = `<span class="character">${emoji}</span>`;
    this.slotNodes.set(loopId, slot);
  }

  /** 清除 slot 的角色 */
  empty(loopId) {
    const slot = this.root.querySelector(`.slot[data-loop-id="${loopId}"]`);
    if (!slot) return;
    slot.classList.remove('filled', 'pending');
    const loop = this._findLoop(loopId);
    slot.innerHTML = `<span class="placeholder" style="opacity:.25">${loop ? loop.icon : '?'}</span>`;
    this.slotNodes.delete(loopId);
  }

  markPending(loopId, pending) {
    const slot = this.root.querySelector(`.slot[data-loop-id="${loopId}"]`);
    if (!slot) return;
    slot.classList.toggle('pending', pending);
  }

  _pickEmojiFor(loopId) {
    // 用 loopId 的 hash 选 emoji，同一个 loop 每次上场都是同一个角色
    let h = 0;
    for (let i = 0; i < loopId.length; i++) h = (h * 31 + loopId.charCodeAt(i)) >>> 0;
    return EMOJI_POOL[h % EMOJI_POOL.length];
  }

  _findLoop(loopId) {
    for (const cat of CATEGORIES) {
      const found = LOOPS_BY_CATEGORY[cat.key].find(l => l.id === loopId);
      if (found) return found;
    }
    return null;
  }
}
