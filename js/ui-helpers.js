function logEntry(from, ch, to, isError = false) {
  const c = document.getElementById("logContainer");
  const d = document.createElement("div");
  d.className = "log-entry";
  if (isError)
    d.innerHTML = `<span class="log-error">✗ No transition from <b>${from}</b> on '<b>${escapeHtml(ch)}</b>' — REJECTED</span>`;
  else
    d.innerHTML = `<span class="log-from">${from}</span><span class="log-arrow"> ──</span><span class="log-char">${escapeHtml(ch)}</span><span class="log-arrow">──▶ </span><span class="log-to">${to}</span>`;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function logMsg(msg, cls = "log-info") {
  const c = document.getElementById("logContainer");
  const d = document.createElement("div");
  d.className = cls;
  d.textContent = msg;
  c.appendChild(d);
  c.scrollTop = c.scrollHeight;
}
function clearLog() {
  document.getElementById("logContainer").innerHTML = "";
}

/* ─── STATUS BAR ─── */
function setStatus(mode, text, charText = "") {
  const ind = document.getElementById("sbIndicator"),
    st = document.getElementById("sbStatus"),
    ch = document.getElementById("sbChar");
  ind.className = "sb-indicator " + mode;
  st.className = "sb-status " + mode;
  st.textContent = text;
  ch.innerHTML = charText;
}

/* ─── LIVE VALIDATE ─── */
function liveValidate(val) {
  const f = document.getElementById("inputStr");
  const clr = document.getElementById("inputClear");
  clr.style.display = val ? "block" : "none";
  f.classList.remove("valid-border", "invalid-border");
  if (!val) return;
  if (validateOne(val).valid) f.classList.add("valid-border");
  else f.classList.add("invalid-border");
}


function copyResult() {
  const input = document.getElementById("inputStr").value.trim();
  if (!input) {
    showToast("No result to copy");
    return;
  }
  navigator.clipboard
    .writeText(input)
    .then(() => showToast("Copied: " + input));
}
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2000);
}
