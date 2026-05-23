function renderAtomHTML(s) {
  const { mass, atomNum, symbol, charge } = parseAtom(s);
  return `<span class="atom-nuclide"><span class="atom-scripts"><span class="atom-mass">${escapeHtml(mass)}</span><span class="atom-z">${escapeHtml(atomNum)}</span></span><span class="atom-sym">${escapeHtml(symbol)}</span>${charge ? `<span class="atom-charge">${escapeHtml(charge)}</span>` : ""}</span>`;
}

/* ─── ELEMENT INFO ─── */
function showElementInfo(inputStr, parsed) {
  const { mass, atomNum, symbol } = parsed;
  const el = ELEMENTS[symbol];
  const massNum = parseInt(mass),
    atomNumN = parseInt(atomNum);
  const info = document.getElementById("elemInfo");
  if (!el) {
    info.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--ink-4);text-align:center;padding:12px 0;">Symbol <b>${escapeHtml(symbol)}</b><br>not in database</div>`;
    return;
  }
  const zMatch = el.Z === atomNumN;
  const neutrons = massNum - atomNumN;
  const massOk = massNum >= atomNumN && neutrons >= 0;
  const eConf = electronConfig(el.Z);
  info.innerHTML = `
    <div class="elem-grid">
      <div class="elem-item" style="grid-column:span 2;display:flex;align-items:center;gap:12px;padding:9px 12px;">
        <div style="font-family:'IBM Plex Mono',monospace;font-size:30px;color:${el.color};min-width:44px;text-align:center;font-weight:500;border-right:1px solid var(--border);padding-right:12px;">${escapeHtml(symbol)}</div>
        <div><div style="font-family:'IBM Plex Serif',serif;font-size:14px;font-weight:400;color:var(--ink);">${el.name}</div>
        <div style="font-family:'IBM Plex Mono',monospace;font-size:8px;color:var(--ink-4);margin-top:3px;letter-spacing:1px;">${el.group} <span class="elem-period-badge">Period ${el.period}</span></div></div>
      </div>
      <div class="elem-item"><div class="elem-key">Atomic No. (Z)</div><div class="elem-val">${el.Z}</div></div>
      <div class="elem-item"><div class="elem-key">Std Mass (u)</div><div class="elem-val">${el.mass}</div></div>
      <div class="elem-item"><div class="elem-key">Mass No. (A)</div><div class="elem-val">${massNum}</div></div>
      <div class="elem-item"><div class="elem-key">Neutrons (N)</div><div class="elem-val" style="color:${neutrons >= 0 ? "var(--green)" : "var(--red)"}">${neutrons >= 0 ? neutrons : "invalid"}</div></div>
      <div class="elem-item" style="grid-column:span 2;"><div class="elem-key">Electron Config</div><div class="elem-val" style="font-size:10px;letter-spacing:.5px;">${eConf}</div></div>
    </div>
    ${!zMatch ? `<div class="elem-warn">⚠ Z mismatch: given ${atomNumN}, but ${escapeHtml(symbol)} has Z=${el.Z} (${el.name})</div>` : `<div class="elem-ok">✓ Consistent: Z=${atomNumN} matches ${escapeHtml(symbol)} (${el.name})</div>`}
    ${!massOk ? `<div class="elem-warn">⚠ A=${massNum} must be ≥ Z=${atomNumN}</div>` : ""}`;
  // Draw Bohr + highlight table
  drawBohrAtom(el.Z, symbol, massNum);
  highlightPeriodicTable(symbol);
}
function clearElementInfo() {
  document.getElementById("elemInfo").innerHTML =
    `<div style="font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--ink-5);text-align:center;padding:14px 0;line-height:1.8;">Run a valid simulation<br>to see element data</div>`;
  clearBohrAtom();
  highlightPeriodicTable(null);
}

/* ─── LOG ─── */
