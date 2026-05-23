function buildTransitionTable() {
  const wrap = document.getElementById("transTableWrap");
  let html = '<table class="trans-table"><thead><tr><th>State</th>';
  TABLE_INPUTS.forEach((i) => (html += `<th>${i}</th>`));
  html += "<th>Accept</th></tr></thead><tbody>";
  TABLE_STATES.forEach((st) => {
    html += `<tr><td class="state-col" id="ttrow-${st}">${st}</td>`;
    TABLE_INPUTS.forEach((inp) => {
      const nx = cellTrans(st, inp);
      const id = `tt-${st}-${inp.replace(/[^a-z0-9]/gi, "_")}`;
      html += `<td id="${id}" class="${nx ? "has-trans" : ""}">${nx || "—"}</td>`;
    });
    const acc = isAccepting(st) || st === "qf";
    html += `<td class="${acc ? "tc-accept" : ""}">${acc ? "✓" : "—"}</td></tr>`;
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
}
function highlightTableCell(state, ch) {
  document
    .querySelectorAll(".trans-table td.tc-highlight")
    .forEach((e) => e.classList.remove("tc-highlight"));
  let ic = null;
  if (/[0-9]/.test(ch)) ic = "digit";
  else if (ch === "_") ic = "_";
  else if (/[A-Z]/.test(ch)) ic = "A-Z";
  else if (/[a-z]/.test(ch)) ic = "a-z";
  else if (ch === "+" || ch === "-") ic = "+/-";
  if (!ic) return;
  const id = `tt-${state}-${ic.replace(/[^a-z0-9]/gi, "_")}`;
  const el = document.getElementById(id);
  if (el) el.classList.add("tc-highlight");
}

/* ─── SVG DIAGRAM ─── */
const STATE_NODES = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
const TRANS_MAP = {
  "q0-q1": "t-q0-q1",
  "q1-q1": "t-q1-q1",
  "q1-q2": "t-q1-q2",
  "q2-q3": "t-q2-q3",
  "q3-q3": "t-q3-q3",
  "q3-q4": "t-q3-q4",
  "q4-q4": "t-q4-q4",
  "q4-q5": "t-q4-q5",
  "q4-q6": "t-q4-q6",
  "q5-q6": "t-q5-q6",
  "q4-qf": "t-q4-qf",
  "q6-qf": "t-q6-qf",
};
const TLABEL_MAP = {
  "q0-q1": "tl-q0-q1",
  "q1-q1": "tl-q1-q1",
  "q1-q2": "tl-q1-q2",
  "q2-q3": "tl-q2-q3",
  "q3-q3": "tl-q3-q3",
  "q3-q4": "tl-q3-q4",
  "q4-q4": "tl-q4-q4",
  "q4-q5": "tl-q4-q5",
  "q4-q6": "tl-q4-q6",
  "q5-q6": "tl-q5-q6",
  "q4-qf": "tl-q4-qf",
  "q6-qf": "tl-q6-qf",
};
function clearDiagram() {
  STATE_NODES.forEach((s) => {
    const n = document.getElementById("node-" + s),
      l = document.getElementById("label-" + s);
    if (n) n.className.baseVal = "state-circle";
    if (l) l.className.baseVal = "state-label";
  });
  ["node-qf-outer", "node-qf"].forEach((id) => {
    const e = document.getElementById(id);
    if (e)
      e.className.baseVal =
        id === "node-qf-outer" ? "final-ring" : "state-circle";
  });
  document.getElementById("label-qf").className.baseVal = "state-label";
  Object.values(TRANS_MAP).forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.className.baseVal = "transition-line";
  });
  Object.values(TLABEL_MAP).forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.className.baseVal = "transition-label";
  });
  document.querySelectorAll(".traced-overlay").forEach((e) => e.remove());
}
function activateNode(state, mode = "active") {
  STATE_NODES.forEach((s) => {
    const n = document.getElementById("node-" + s),
      l = document.getElementById("label-" + s);
    if (n) {
      n.className.baseVal = "state-circle";
      if (l) l.className.baseVal = "state-label";
    }
  });
  const node = document.getElementById("node-" + state);
  const label = document.getElementById("label-" + state);
  if (!node) return;
  node.className.baseVal = "state-circle " + mode;
  label.className.baseVal = "state-label " + mode;
  const svg = document.getElementById("fsa-svg");
  const cx = node.getAttribute("cx"),
    cy = node.getAttribute("cy");
  const p = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle",
  );
  p.setAttribute("cx", cx);
  p.setAttribute("cy", cy);
  p.setAttribute("r", "20");
  p.setAttribute("class", "pulse");
  if (mode === "error") p.setAttribute("stroke", "#8c2018");
  else if (mode === "done") p.setAttribute("stroke", "#125028");
  svg.appendChild(p);
  setTimeout(() => {
    try {
      svg.removeChild(p);
    } catch (e) {}
  }, 800);
}
function activateFinal(mode = "done") {
  ["node-qf-outer", "node-qf", "label-qf"].forEach((id) => {
    const e = document.getElementById(id);
    if (!e) return;
    if (id === "node-qf-outer")
      e.className.baseVal = "final-ring " + mode;
    else if (id === "node-qf")
      e.className.baseVal = "state-circle " + mode;
    else e.className.baseVal = "state-label " + mode;
  });
}
function activateTransition(from, to) {
  clearTransitions();
  const key = from + "-" + to;
  const le = document.getElementById(TRANS_MAP[key]),
    lb = document.getElementById(TLABEL_MAP[key]);
  if (le) le.className.baseVal = "transition-line active";
  if (lb) lb.className.baseVal = "transition-label active";
}
function clearTransitions() {
  Object.values(TRANS_MAP).forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.className.baseVal = "transition-line";
  });
  Object.values(TLABEL_MAP).forEach((id) => {
    const e = document.getElementById(id);
    if (e) e.className.baseVal = "transition-label";
  });
}
function drawPathTrace(path) {
  const counts = {};
  path.forEach(({ from, to }) => {
    const k = from + "-" + to;
    counts[k] = (counts[k] || 0) + 1;
  });
  Object.entries(counts).forEach(([k, count]) => {
    const srcEl = document.getElementById(TRANS_MAP[k]);
    if (!srcEl) return;
    const ov = srcEl.cloneNode(true);
    ov.setAttribute("id", "trace-" + k);
    ov.className.baseVal = "transition-line traced traced-overlay";
    ov.style.opacity = Math.min(0.25 + count * 0.2, 0.85).toString();
    srcEl.parentNode.insertBefore(ov, srcEl.nextSibling);
  });
}

/* ─── TAPE ─── */
function buildTape(input) {
  const track = document.getElementById("tapeCells");
  track.innerHTML = "";
  if (!input) {
    updateTapeProgress(0, 0);
    return;
  }
  for (let i = 0; i < input.length; i++) {
    const cell = document.createElement("div");
    cell.className = "tape-cell tc-pending";
    cell.id = "tape-" + i;
    cell.innerHTML = `<span class="tc-char">${escapeHtml(input[i])}</span><span class="tc-idx">${i}</span>`;
    track.appendChild(cell);
  }
  const end = document.createElement("div");
  end.className = "tape-cell tc-pending";
  end.style.opacity = ".3";
  end.innerHTML = `<span class="tc-char" style="font-size:8px">EOF</span><span class="tc-idx"></span>`;
  track.appendChild(end);
  updateTapeProgress(0, input.length);
}
function setTapeHead(idx, mode = "active", inputLen = 0) {
  document.querySelectorAll(".tape-cell").forEach((c, i) => {
    c.className =
      "tape-cell " +
      (i < idx
        ? "tc-read"
        : i === idx
          ? mode === "error"
            ? "tc-error"
            : "tc-active"
          : "tc-pending");
  });
  document.getElementById("tapeHeadLabel").textContent =
    `▼ HEAD @ ${idx}`;
  const wrapper = document.getElementById("tapeWrapper");
  const cell = document.getElementById("tape-" + idx);
  if (cell)
    wrapper.scrollLeft =
      cell.offsetLeft - wrapper.offsetWidth / 2 + cell.offsetWidth / 2;
}
function updateTapeProgress(pos, total) {
  const pct = total > 0 ? Math.round((pos / total) * 100) : 0;
  document.getElementById("tapeProgress").textContent =
    `Position ${pos} / ${total}  ·  ${pct}% processed`;
  document.getElementById("tapeProgFill").style.width = pct + "%";
}

/* ─── PARSE / RENDER ─── */
