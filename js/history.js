/* ─── HISTORY ─── */
let history = [];
function addHistory(inputStr, valid, mode = currentMode) {
  history.unshift({
    inputStr,
    valid,
    mode,
    ts: new Date().toLocaleTimeString(),
  });
  if (history.length > 30) history.pop();
  renderHistory();
}
function renderHistory() {
  const list = document.getElementById("histList");
  document.getElementById("histCount").textContent = history.length;
  if (!history.length) {
    list.innerHTML = '<div class="hist-empty">No simulations yet</div>';
    return;
  }
  list.innerHTML = history
    .map((h, i) => {
      const renderStr = h.valid
        ? h.mode === "compound"
          ? renderCompoundHTML(h.inputStr)
          : renderAtomHTML(h.inputStr)
        : `<span style="color:var(--red)">INVALID</span>`;
      const safeInput = h.inputStr
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
      return `<div class="hist-item" onclick="setFsaMode('${h.mode || "atom"}', true); setInput('${safeInput}')">
      <div class="hist-dot ${h.valid ? "valid" : "invalid"}"></div>
      <span class="hist-str">${escapeHtml(h.inputStr)}</span>
      <span class="hist-render">${renderStr}</span>
    </div>`;
    })
    .join("");
}
function clearHistory() {
  history = [];
  renderHistory();
}
function exportHistory() {
  if (!history.length) {
    showToast("No history to export");
    return;
  }
  const csv =
    "Input,Mode,Valid,Time\n" +
    history
      .map((h) => `"${h.inputStr}",${h.mode || "atom"},${h.valid},"${h.ts}"`)
      .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "fsa_history.csv";
  a.click();
  showToast("History exported");
}
