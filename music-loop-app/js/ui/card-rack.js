// 卡片架：每个分类一行卡片，点击切换激活状态

import { CATEGORIES, LOOPS_BY_CATEGORY } from '../audio/loops.js';

export class CardRack {
  constructor(root) {
    this.root = root;
    this._render();
  }

  _render() {
    this.root.innerHTML = '';
    CATEGORIES.forEach(cat => {
      const row = document.createElement('div');
      row.className = 'rack-row cat-' + cat.key;

      const label = document.createElement('div');
      label.className = 'row-label';
      label.innerHTML =
        `<div class="row-emoji">${cat.emoji}</div>` +
        `<div>${cat.label}卡片</div>`;
      row.appendChild(label);

      const list = document.createElement('div');
      list.className = 'rack-list';

      LOOPS_BY_CATEGORY[cat.key].forEach(loop => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.loopId = loop.id;
        card.innerHTML =
          `<span class="icon">${loop.icon}</span>` +
          `<span class="label">${loop.name}</span>`;
        card.addEventListener('click', () => {
          if (this.onCardClick) this.onCardClick(loop.id);
        });
        list.appendChild(card);
      });

      row.appendChild(list);
      this.root.appendChild(row);
    });
  }

  setActive(loopId, active) {
    const card = this.root.querySelector(`.card[data-loop-id="${loopId}"]`);
    if (card) card.classList.toggle('active', active);
  }

  getAllLoopIds() {
    return Array.from(this.root.querySelectorAll('.card')).map(c => c.dataset.loopId);
  }
}
