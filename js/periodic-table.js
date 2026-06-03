function buildPeriodicTable() {
  const grid = document.getElementById("ptGrid");
  grid.innerHTML = "";
  const posMap = {};
  PT_LAYOUT.forEach(([sym, col, row]) => {
    posMap[`${col},${row}`] = sym;
  });
  for (let r = 1; r <= 9; r++) {
    for (let c = 1; c <= 18; c++) {
      const sym = posMap[`${c},${r}`];
      const cell = document.createElement("div");
      cell.style.gridColumn = c;
      cell.style.gridRow = r;
      if (!sym) {
        cell.className = "pt-cell pt-empty";
      } else {
        const el = ELEMENTS[sym];
        const cls = el
          ? GROUP_CLASS[el.group] || "pt-nonmetal"
          : "pt-nonmetal";
        cell.className = `pt-cell ${cls}`;
        cell.id = `pt-${sym}`;
        if (el) {
          const z = document.createElement("span");
          z.className = "pt-z";
          z.textContent = el.Z;
          const symbol = document.createElement("span");
          symbol.className = "pt-symbol";
          symbol.textContent = sym;
          cell.appendChild(z);
          cell.appendChild(symbol);
          const tip = document.createElement("div");
          tip.className = "pt-tooltip";
          tip.textContent = `${el.name} · Z=${el.Z}`;
          cell.appendChild(tip);
          cell.title = `${el.name} (Z=${el.Z})`;
        }
        cell.onclick = () =>
          setInput(
            currentMode === "compound"
              ? sym
              : `${el ? Math.round(el.mass) : "?"}_${el ? el.Z : "?"}${sym}`,
          );
      }
      grid.appendChild(cell);
    }
  }
  const leg = document.getElementById("ptLegend");
  leg.innerHTML = LEGEND_ITEMS.map(
    ({ cls, label }) =>
      `<div class="pt-leg-item"><div class="pt-leg-dot ${cls}"></div>${label}</div>`,
  ).join("");
}

function highlightPeriodicTable(symbol) {
  document
    .querySelectorAll(".pt-cell.pt-highlight")
    .forEach((e) => e.classList.remove("pt-highlight"));
  const badge = document.getElementById("ptHighlightBadge");
  if (!symbol) {
    badge.textContent = "NO ELEMENT";
    return;
  }
  const cell = document.getElementById(`pt-${symbol}`);
  if (cell) {
    cell.classList.add("pt-highlight");
    cell.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }
  const el = ELEMENTS[symbol];
  badge.textContent = el ? `${el.name} · ${el.group}` : symbol;
}

function highlightPeriodicTableMany(symbols) {
  document
    .querySelectorAll(".pt-cell.pt-highlight")
    .forEach((e) => e.classList.remove("pt-highlight"));
  const unique = [...new Set(symbols)].filter((symbol) => ELEMENTS[symbol]);
  const badge = document.getElementById("ptHighlightBadge");
  if (!unique.length) {
    badge.textContent = "NO ELEMENT";
    return;
  }
  unique.forEach((symbol) => {
    const cell = document.getElementById(`pt-${symbol}`);
    if (cell) cell.classList.add("pt-highlight");
  });
  const firstCell = document.getElementById(`pt-${unique[0]}`);
  if (firstCell) {
    firstCell.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }
  badge.textContent =
    unique.length === 1
      ? `${ELEMENTS[unique[0]].name} · ${ELEMENTS[unique[0]].group}`
      : `${unique.length} elements in compound`;
}
