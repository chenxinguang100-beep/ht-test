(() => {
  const els = {
    inputTo: document.getElementById("input-to"),
    inputTitle: document.getElementById("input-title"),
    inputLine1: document.getElementById("input-line1"),
    inputLine2: document.getElementById("input-line2"),
    inputFrom: document.getElementById("input-from"),
    powerRange: document.getElementById("power-range"),
    powerReadout: document.getElementById("power-readout"),
    toggleAngel: document.getElementById("toggle-angel"),
    toggleBattle: document.getElementById("toggle-battle"),
    btnFly: document.getElementById("btn-fly"),
    cardTo: document.getElementById("card-to"),
    cardTitle: document.getElementById("card-title"),
    cardLine1: document.getElementById("card-line1"),
    cardLine2: document.getElementById("card-line2"),
    cardFrom: document.getElementById("card-from"),
    angel: document.getElementById("angel"),
  };

  const safeText = (value, fallback) => {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  };

  const updateCard = () => {
    els.cardTo.textContent = `给：${safeText(els.inputTo.value, "兄弟")}`;
    els.cardTitle.textContent = safeText(els.inputTitle.value, "勇者之祝");
    els.cardLine1.textContent = safeText(els.inputLine1.value, "愿你披风猎猎，铁血不息。");
    els.cardLine2.textContent = safeText(els.inputLine2.value, "每一次出征，都有归来之光。");
    els.cardFrom.textContent = `— ${safeText(els.inputFrom.value, "你的战友")}`;
  };

  const updatePower = () => {
    const value = Number(els.powerRange.value);
    document.documentElement.style.setProperty("--power", value);
    els.powerReadout.textContent = value;
  };

  const toggleAngel = () => {
    if (els.toggleAngel.checked) {
      els.angel.classList.remove("hidden");
    } else {
      els.angel.classList.add("hidden");
    }
  };

  const toggleBattle = () => {
    document.body.classList.toggle("battle", els.toggleBattle.checked);
  };

  const triggerAngel = () => {
    if (!els.toggleAngel.checked) {
      els.toggleAngel.checked = true;
      toggleAngel();
    }
    els.angel.classList.remove("launch");
    void els.angel.offsetWidth;
    els.angel.classList.add("launch");
  };

  [
    els.inputTo,
    els.inputTitle,
    els.inputLine1,
    els.inputLine2,
    els.inputFrom,
  ].forEach((input) => input.addEventListener("input", updateCard));

  els.powerRange.addEventListener("input", updatePower);
  els.toggleAngel.addEventListener("change", toggleAngel);
  els.toggleBattle.addEventListener("change", toggleBattle);
  els.btnFly.addEventListener("click", triggerAngel);

  updateCard();
  updatePower();
  toggleAngel();
})();
