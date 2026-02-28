(() => {
  const data = window.travelData;

  const els = {
    hero: document.getElementById("hero"),
    overview: document.getElementById("overview"),
    dayTabs: document.getElementById("day-tabs"),
    dayHead: document.getElementById("day-head"),
    routeStrip: document.getElementById("route-strip"),
    timeline: document.getElementById("timeline"),
    budgetPanel: document.getElementById("budget-panel"),
    choicesPanel: document.getElementById("choices-panel")
  };

  if (!data || !Array.isArray(data.itinerary) || data.itinerary.length === 0) {
    renderNoData();
    return;
  }

  const state = {
    dayIndex: 0,
    selections: {}
  };

  initDefaultSelections();
  renderAll();

  function initDefaultSelections() {
    data.itinerary.forEach((day, dayIndex) => {
      (day.schedule || []).forEach((item, itemIndex) => {
        if (!item.isChoice) return;
        const key = selectionKey(dayIndex, itemIndex);
        const fallback = item.default || (Array.isArray(item.options) ? item.options[0] : null);
        if (fallback) state.selections[key] = fallback;
      });
    });
  }

  function renderAll() {
    renderHero();
    renderOverview();
    renderDayTabs();
    renderDayView();
    renderBudget();
    renderChoiceSummary();
  }

  function renderNoData() {
    const message = "No itinerary data found. Please load a data file first.";
    Object.values(els).forEach((el) => {
      if (el) el.innerHTML = `<div class=\"empty\">${escapeHtml(message)}</div>`;
    });
  }

  function renderHero() {
    const meta = data.meta || {};
    const routeMetrics = collectRouteMetrics();
    const uniqueCities = unique(
      data.itinerary
        .map((day) => (day.loc || "").split("->"))
        .flat()
        .map((item) => item.trim())
        .filter(Boolean)
    );

    els.hero.innerHTML = [
      '<div class="hero-top">',
      '<div>',
      `<h1 class="hero-title">${escapeHtml(meta.title || "One-day itinerary")}</h1>`,
      `<p class="hero-sub">${escapeHtml(uniqueCities.join(" · ") || "City pending")}</p>`,
      '</div>',
      `<div class="hero-chip">${escapeHtml((meta.travelers || 1) + " 人行程")}</div>`,
      '</div>',
      '<div class="hero-stats">',
      `<div class="hero-stat"><div class="hero-stat-label">日程点位</div><div class="hero-stat-value">${routeMetrics.totalStops}</div></div>`,
      `<div class="hero-stat"><div class="hero-stat-label">可选节点</div><div class="hero-stat-value">${routeMetrics.choiceCount}</div></div>`,
      `<div class="hero-stat"><div class="hero-stat-label">预算总计</div><div class="hero-stat-value">¥${formatNumber(calculateBudget().total)}</div></div>`,
      '</div>'
    ].join("");
  }

  function renderOverview() {
    const activeDay = data.itinerary[state.dayIndex];
    const tags = [];

    if (activeDay && activeDay.date) tags.push(`日期 ${activeDay.date}`);
    if (activeDay && activeDay.loc) tags.push(`区域 ${activeDay.loc}`);
    if (activeDay && activeDay.weather) tags.push(`天气 ${activeDay.weather}`);

    const mode = inferTransportMode();
    if (mode) tags.push(`交通 ${mode}`);

    els.overview.innerHTML = tags.map((tag) => `<span class="info-tag">${escapeHtml(tag)}</span>`).join("");
  }

  function renderDayTabs() {
    const dayCount = data.itinerary.length;
    els.dayTabs.style.setProperty("--day-count", String(dayCount));

    els.dayTabs.innerHTML = data.itinerary
      .map((day, index) => {
        const activeClass = index === state.dayIndex ? "active" : "";
        return [
          `<button class="day-tab ${activeClass}" data-day-index="${index}">`,
          `<div class="day-tab-num">Day ${day.day || index + 1}</div>`,
          `<div class="day-tab-loc">${escapeHtml(day.loc || "")}</div>`,
          "</button>"
        ].join("");
      })
      .join("");

    els.dayTabs.querySelectorAll(".day-tab").forEach((button) => {
      button.addEventListener("click", () => {
        state.dayIndex = Number(button.getAttribute("data-day-index"));
        renderAll();
      });
    });
  }

  function renderDayView() {
    const day = data.itinerary[state.dayIndex];
    const schedule = day.schedule || [];

    const startTime = schedule.length ? schedule[0].time || "--:--" : "--:--";
    const endTime = schedule.length ? schedule[schedule.length - 1].time || "--:--" : "--:--";

    els.dayHead.innerHTML = [
      '<div class="day-head-top">',
      `<h2 class="day-title">${escapeHtml(day.date || `Day ${day.day || state.dayIndex + 1}`)}</h2>`,
      `<span class="day-weather">${escapeHtml(day.weather || "天气待补充")}</span>`,
      '</div>',
      '<div class="day-meta">',
      `<span class="meta-pill">${schedule.length} 个点位</span>`,
      `<span class="meta-pill">${escapeHtml(startTime)} - ${escapeHtml(endTime)}</span>`,
      `<span class="meta-pill">${escapeHtml(day.loc || "")}</span>`,
      '</div>'
    ].join("");

    const routeNodes = buildRouteNodes(day, state.dayIndex);
    els.routeStrip.innerHTML = renderRouteStrip(routeNodes);

    els.timeline.innerHTML = schedule
      .map((item, itemIndex) => renderTimelineItem(day, state.dayIndex, item, itemIndex))
      .join("");

    els.timeline.querySelectorAll(".choice-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const key = button.getAttribute("data-choice-key");
        const value = button.getAttribute("data-choice-value");
        if (!key || !value) return;

        state.selections[key] = value;
        renderAll();
      });
    });
  }

  function renderRouteStrip(nodes) {
    if (nodes.length === 0) {
      return '<div class="empty">当前无可导航点位</div>';
    }

    const html = [];
    nodes.forEach((node, index) => {
      html.push(`<span class="route-node">${escapeHtml(node)}</span>`);
      if (index < nodes.length - 1) {
        html.push('<span class="route-arrow">→</span>');
      }
    });

    return html.join("");
  }

  function renderTimelineItem(day, dayIndex, item, itemIndex) {
    const resolved = resolveScheduleEntity(dayIndex, itemIndex, item);
    const entity = resolved.entity;
    const location = resolveLocation(entity);

    const title = item.title || (entity && entity.name) || "Untitled";
    const desc = item.desc || (entity && (entity.desc || entity.tips)) || "";

    const type = mapTypeLabel(item.type);
    const isSideQuest = Boolean(item.isSideQuest);

    const price = pickPrice(item, entity);
    const priceHtml = price > 0 ? `<span class="price-chip">¥${formatNumber(price)}</span>` : "";

    const navLink = location && location.coords ? buildAmapLink(location) : "";
    const navHtml = navLink
      ? `<a class="nav-link" href="${escapeHtml(navLink)}" target="_blank" rel="noreferrer">导航</a>`
      : "";

    const badges = [
      `<span class="badge type">${escapeHtml(type)}</span>`,
      isSideQuest ? '<span class="badge side">支线</span>' : ""
    ].join("");

    const choiceHtml = renderChoiceRow(resolved, dayIndex, itemIndex);

    return [
      '<li class="timeline-item">',
      `<div class="time-tag">${escapeHtml(item.time || "--:--")}</div>`,
      '<div class="item-card">',
      '<div class="item-top">',
      `<h3 class="item-title">${escapeHtml(title)}</h3>`,
      `<div class="item-actions">${priceHtml}${navHtml}</div>`,
      '</div>',
      `<div class="badges">${badges}</div>`,
      desc ? `<div class="item-desc">${escapeHtml(desc)}</div>` : "",
      choiceHtml,
      '</div>',
      '</li>'
    ].join("");
  }

  function renderChoiceRow(resolved, dayIndex, itemIndex) {
    if (!resolved.isChoice || !Array.isArray(resolved.options) || resolved.options.length === 0) {
      return "";
    }

    const key = selectionKey(dayIndex, itemIndex);

    const buttons = resolved.options
      .map((id) => {
        const option = resolve(id);
        if (!option) return "";

        const isActive = state.selections[key] === id;
        const className = isActive ? "choice-btn active" : "choice-btn";
        return `<button class="${className}" data-choice-key="${key}" data-choice-value="${escapeHtml(id)}">${escapeHtml(
          option.name || id
        )}</button>`;
      })
      .join("");

    return `<div class="choice-row">${buttons}</div>`;
  }

  function renderBudget() {
    const budget = calculateBudget();

    els.budgetPanel.innerHTML = [
      '<h3 class="panel-title">预算总览</h3>',
      '<div class="budget-list">',
      `<div class="budget-row"><span>酒店</span><span>¥${formatNumber(budget.hotel)}</span></div>`,
      `<div class="budget-row"><span>餐饮</span><span>¥${formatNumber(budget.dining)}</span></div>`,
      `<div class="budget-row"><span>活动</span><span>¥${formatNumber(budget.activity)}</span></div>`,
      `<div class="budget-row"><span>交通</span><span>¥${formatNumber(budget.transport)}</span></div>`,
      `<div class="budget-row total-row"><span>总计</span><span>¥${formatNumber(budget.total)}</span></div>`,
      '</div>'
    ].join("");
  }

  function renderChoiceSummary() {
    const day = data.itinerary[state.dayIndex];
    const blocks = [];

    (day.schedule || []).forEach((item, itemIndex) => {
      if (!item.isChoice) return;

      const key = selectionKey(state.dayIndex, itemIndex);
      const selectedId = state.selections[key];
      const selectedEntity = resolve(selectedId);

      if (!selectedEntity) return;

      blocks.push([
        '<div class="choice-block">',
        `<p class="choice-title">${escapeHtml(item.title || "可选项")}</p>`,
        `<p class="choice-summary">当前采纳: ${escapeHtml(selectedEntity.name || selectedId)}</p>`,
        '</div>'
      ].join(""));
    });

    els.choicesPanel.innerHTML = [
      '<h3 class="panel-title">本日采纳结果</h3>',
      blocks.length ? blocks.join("") : '<div class="empty">本日没有可选替换项</div>'
    ].join("");
  }

  function calculateBudget() {
    const meta = data.meta || {};
    const baseSettings = meta.baseSettings || {};
    const travelers = Number(meta.travelers || 1);

    let dining = 0;
    let activity = 0;

    data.itinerary.forEach((day, dayIndex) => {
      (day.schedule || []).forEach((item, itemIndex) => {
        const resolved = resolveScheduleEntity(dayIndex, itemIndex, item);
        const entity = resolved.entity;
        const price = pickPrice(item, entity);

        if (price <= 0) return;

        const type = String(item.type || (entity && entity.type) || "").toLowerCase();
        if (type.includes("dining") || type.includes("food") || type.includes("餐")) {
          dining += price * travelers;
        } else {
          activity += price * travelers;
        }
      });
    });

    const hotel = Number(baseSettings.hotelTotal || 0);
    const transport = Number(baseSettings.transportBudget || 0);

    return {
      hotel,
      dining,
      activity,
      transport,
      total: hotel + dining + activity + transport
    };
  }

  function collectRouteMetrics() {
    let totalStops = 0;
    let choiceCount = 0;

    data.itinerary.forEach((day) => {
      (day.schedule || []).forEach((item) => {
        totalStops += 1;
        if (item.isChoice) choiceCount += 1;
      });
    });

    return {
      totalStops,
      choiceCount
    };
  }

  function buildRouteNodes(day, dayIndex) {
    const nodes = [];

    (day.schedule || []).forEach((item, itemIndex) => {
      const resolved = resolveScheduleEntity(dayIndex, itemIndex, item);
      const entity = resolved.entity;
      const location = resolveLocation(entity);
      const routeLabel = pickRouteNodeLabel({ item, resolved, entity, location });
      if (!routeLabel) return;
      nodes.push(routeLabel);
    });

    return unique(nodes);
  }

  function pickRouteNodeLabel({ item, resolved, entity, location }) {
    if (resolved && resolved.isChoice && entity && entity.name) {
      return entity.name;
    }

    if (location && location.name) {
      return location.name;
    }

    if (entity && entity.name) {
      return entity.name;
    }

    if (item && item.title) {
      return item.title;
    }

    return "";
  }

  function resolveScheduleEntity(dayIndex, itemIndex, item) {
    if (!item) return { entity: null, isChoice: false };

    if (!item.isChoice) {
      return {
        entity: resolve(item.refId),
        isChoice: false
      };
    }

    const key = selectionKey(dayIndex, itemIndex);
    const options = Array.isArray(item.options) ? item.options : [];

    if (!state.selections[key]) {
      state.selections[key] = item.default || options[0] || null;
    }

    const pickedId = state.selections[key];

    return {
      entity: resolve(pickedId),
      isChoice: true,
      options,
      pickedId
    };
  }

  function selectionKey(dayIndex, itemIndex) {
    return `${dayIndex}-${itemIndex}`;
  }

  function resolve(id) {
    if (!id) return null;

    const inventory = data.inventory || {};
    const buckets = [
      inventory.locations || {},
      inventory.dining || {},
      inventory.activities || {},
      inventory.items || {}
    ];

    for (const bucket of buckets) {
      if (bucket[id]) return bucket[id];
    }

    return null;
  }

  function resolveLocation(entity) {
    if (!entity) return null;
    if (Array.isArray(entity.coords)) return entity;

    if (entity.locationId) {
      const location = resolve(entity.locationId);
      if (location && Array.isArray(location.coords)) return location;
    }

    return null;
  }

  function buildAmapLink(location) {
    return `https://uri.amap.com/marker?position=${location.coords.join(",")}&name=${encodeURIComponent(location.name || "")}`;
  }

  function inferTransportMode() {
    const transport = Number(data.meta && data.meta.baseSettings && data.meta.baseSettings.transportBudget);
    if (!Number.isFinite(transport)) return "";
    if (transport <= 120) return "步行/公交";
    if (transport <= 380) return "公交";
    return "驾车";
  }

  function pickPrice(item, entity) {
    if (item && Number.isFinite(Number(item.price))) {
      return Number(item.price);
    }

    if (entity && Number.isFinite(Number(entity.price))) {
      return Number(entity.price);
    }

    return 0;
  }

  function mapTypeLabel(type) {
    const value = String(type || "").toLowerCase();
    if (value.includes("transport") || value.includes("交通")) return "交通";
    if (value.includes("dining") || value.includes("food") || value.includes("餐")) return "餐饮";
    if (value.includes("activity") || value.includes("景") || value.includes("玩")) return "活动";
    return "安排";
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
})();
