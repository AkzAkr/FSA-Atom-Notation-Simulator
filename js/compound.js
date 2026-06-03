let currentMode = "atom";

const COMPOUND_STATES = ["c0", "c1", "c2", "c3"];
const COMPOUND_INPUTS = ["A-Z", "a-z", "1-9", "0"];

function compoundTransition(state, ch) {
  const U = /[A-Z]/.test(ch);
  const l = /[a-z]/.test(ch);
  const nz = /[1-9]/.test(ch);
  const z = ch === "0";
  switch (state) {
    case "c0":
      if (U) return "c1";
      break;
    case "c1":
      if (l) return "c2";
      if (nz) return "c3";
      if (U) return "c1";
      break;
    case "c2":
      if (nz) return "c3";
      if (U) return "c1";
      break;
    case "c3":
      if (nz || z) return "c3";
      if (U) return "c1";
      break;
  }
  return null;
}

function isCompoundAccepting(state) {
  return state === "c1" || state === "c2" || state === "c3";
}

function compoundCellTrans(state, inputClass) {
  const map = { "A-Z": "H", "a-z": "e", "1-9": "2", 0: "0" };
  return compoundTransition(state, map[inputClass]);
}

function parseCompoundFormula(s) {
  const terms = [];
  const composition = {};
  let i = 0;
  while (i < s.length) {
    if (!/[A-Z]/.test(s[i])) {
      throw new Error(`expected element symbol at pos ${i}`);
    }
    let symbol = s[i++];
    if (i < s.length && /[a-z]/.test(s[i])) symbol += s[i++];
    let countText = "";
    while (i < s.length && /[0-9]/.test(s[i])) countText += s[i++];
    if (countText.startsWith("0")) {
      throw new Error(`atom count cannot start with 0 after ${symbol}`);
    }
    const count = countText ? Number.parseInt(countText, 10) : 1;
    if (!Number.isFinite(count) || count < 1) {
      throw new Error(`invalid atom count after ${symbol}`);
    }
    terms.push({ symbol, count });
    composition[symbol] = (composition[symbol] || 0) + count;
  }
  return { terms, composition };
}

function validateCompoundFormula(s) {
  let state = "c0";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = compoundTransition(state, ch);
    if (next === null) {
      return {
        valid: false,
        errorAt: i,
        errorChar: ch,
        finalState: state,
        parsed: null,
        semanticError: "",
      };
    }
    state = next;
  }
  if (!isCompoundAccepting(state)) {
    return {
      valid: false,
      errorAt: s.length,
      errorChar: "EOF",
      finalState: state,
      parsed: null,
      semanticError: "",
    };
  }
  try {
    const parsed = parseCompoundFormula(s);
    for (const term of parsed.terms) {
      if (!ELEMENTS[term.symbol]) {
        return {
          valid: false,
          errorAt: -1,
          errorChar: null,
          finalState: state,
          parsed,
          semanticError: `unknown element symbol '${term.symbol}'`,
        };
      }
    }
    return {
      valid: true,
      errorAt: -1,
      errorChar: null,
      finalState: state,
      parsed,
      semanticError: "",
    };
  } catch (e) {
    return {
      valid: false,
      errorAt: -1,
      errorChar: null,
      finalState: state,
      parsed: null,
      semanticError: e.message,
    };
  }
}

function getCompoundErrorReason(s, res) {
  if (res.valid) return "";
  if (res.semanticError) return res.semanticError;
  if (!s.trim()) return "empty input";
  if (res.errorAt < s.length)
    return `unexpected '${res.errorChar}' at pos ${res.errorAt} (state: ${res.finalState})`;
  return `incomplete compound formula - ended in state '${res.finalState}'`;
}

function renderCompoundHTML(s) {
  const parsed = parseCompoundFormula(s);
  return `<span class="compound-formula">${parsed.terms
    .map(
      ({ symbol, count }) =>
        `<span class="compound-term"><span class="compound-symbol">${escapeHtml(symbol)}</span>${count > 1 ? `<sub>${count}</sub>` : ""}</span>`,
    )
    .join("")}</span>`;
}

function showCompoundInfo(inputStr, parsed) {
  const info = document.getElementById("elemInfo");
  const entries = Object.entries(parsed.composition);
  info.innerHTML = `
    <div class="compound-info">
      <div class="compound-info-title">${renderCompoundHTML(inputStr)}</div>
      <div class="compound-info-sub">Simple compound formula · ${entries.length} element type${entries.length === 1 ? "" : "s"}</div>
      <div class="compound-grid">
        ${entries
          .map(([symbol, count]) => {
            const el = ELEMENTS[symbol];
            return `<div class="compound-item">
              <span class="compound-item-symbol" style="color:${el.color}">${escapeHtml(symbol)}</span>
              <span class="compound-item-name">${escapeHtml(el.name)}</span>
              <span class="compound-item-count">${count}</span>
            </div>`;
          })
          .join("")}
      </div>
    </div>`;
  drawCompoundVisual(inputStr, parsed);
  highlightPeriodicTableMany(entries.map(([symbol]) => symbol));
}

function buildCompoundTransitionTable() {
  const wrap = document.getElementById("transTableWrap");
  let html = '<table class="trans-table"><thead><tr><th>State</th>';
  COMPOUND_INPUTS.forEach((i) => (html += `<th>${i}</th>`));
  html += "<th>Accept</th></tr></thead><tbody>";
  COMPOUND_STATES.forEach((st) => {
    html += `<tr><td class="state-col" id="ttrow-${st}">${st}</td>`;
    COMPOUND_INPUTS.forEach((inp) => {
      const nx = compoundCellTrans(st, inp);
      const id = `ctt-${st}-${inp.replace(/[^a-z0-9]/gi, "_")}`;
      html += `<td id="${id}" class="${nx ? "has-trans" : ""}">${nx || "-"}</td>`;
    });
    html += `<td class="${isCompoundAccepting(st) ? "tc-accept" : ""}">${isCompoundAccepting(st) ? "yes" : "-"}</td></tr>`;
  });
  html += "</tbody></table>";
  wrap.innerHTML = html;
}

function highlightCompoundTableCell(state, ch) {
  document
    .querySelectorAll(".trans-table td.tc-highlight")
    .forEach((e) => e.classList.remove("tc-highlight"));
  let ic = null;
  if (/[A-Z]/.test(ch)) ic = "A-Z";
  else if (/[a-z]/.test(ch)) ic = "a-z";
  else if (/[1-9]/.test(ch)) ic = "1-9";
  else if (ch === "0") ic = "0";
  if (!ic) return;
  const id = `ctt-${state}-${ic.replace(/[^a-z0-9]/gi, "_")}`;
  const el = document.getElementById(id);
  if (el) el.classList.add("tc-highlight");
}

function buildCompoundDiagram() {
  const diagram = document.getElementById("compoundDiagram");
  if (!diagram) return;
  diagram.innerHTML = `
    <svg class="compound-fsa-svg" viewBox="0 0 760 270" role="img" aria-label="Compound formula FSA">
      <defs>
        <marker id="carr" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon class="arr-default" points="0 0,7 2.5,0 5" />
        </marker>
        <marker id="carr-active" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <polygon class="arr-active" points="0 0,7 2.5,0 5" />
        </marker>
      </defs>
      <pattern id="compoundDots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r=".6" fill="var(--border)" opacity=".5" />
      </pattern>
      <rect width="760" height="270" fill="url(#compoundDots)" />

      <line x1="34" y1="138" x2="72" y2="138" class="compound-start-line" marker-end="url(#carr)" />
      <text class="transition-label" x="28" y="128">START</text>

      <path id="cedge-c0-c1" class="compound-transition" d="M 112 138 L 205 138" />
      <text id="clabel-c0-c1" class="transition-label" x="158" y="126">A-Z</text>

      <path id="cedge-c1-c2" class="compound-transition" d="M 265 138 L 348 138" />
      <text id="clabel-c1-c2" class="transition-label" x="306" y="126">a-z</text>

      <path id="cedge-c2-c3" class="compound-transition" d="M 408 138 L 498 138" />
      <text id="clabel-c2-c3" class="transition-label" x="454" y="126">1-9</text>

      <path id="cedge-c1-c3" class="compound-transition" d="M 252 162 C 315 225 460 224 518 162" />
      <text id="clabel-c1-c3" class="transition-label" x="385" y="231">1-9</text>

      <path id="cedge-c2-c1" class="compound-transition" d="M 367 108 C 325 58 292 58 252 108" />
      <text id="clabel-c2-c1" class="transition-label" x="308" y="57">A-Z</text>

      <path id="cedge-c3-c1" class="compound-transition" d="M 535 105 C 468 22 318 22 245 105" />
      <text id="clabel-c3-c1" class="transition-label" x="392" y="24">A-Z</text>

      <path id="cedge-c1-c1" class="compound-transition" d="M 235 110 C 235 70 278 70 278 104 C 278 124 260 132 244 132" />
      <text id="clabel-c1-c1" class="transition-label" x="278" y="78">A-Z</text>

      <path id="cedge-c3-c3" class="compound-transition" d="M 528 110 C 528 70 571 70 571 104 C 571 124 553 132 537 132" />
      <text id="clabel-c3-c3" class="transition-label" x="572" y="78">0-9</text>

      <path id="cedge-c1-cf" class="compound-transition accept" d="M 228 110 C 210 45 95 54 98 112" />
      <text id="clabel-c1-cf" class="transition-label" x="142" y="54">ε</text>
      <path id="cedge-c2-cf" class="compound-transition accept" d="M 378 108 C 326 20 104 20 100 112" />
      <text id="clabel-c2-cf" class="transition-label" x="245" y="19">ε</text>
      <path id="cedge-c3-cf" class="compound-transition accept" d="M 520 112 C 436 -8 100 -5 94 112" />
      <text id="clabel-c3-cf" class="transition-label" x="354" y="12">ε (accept)</text>

      <circle id="cnode-c0" class="compound-node-svg" cx="92" cy="138" r="24" />
      <text id="clabel-c0" class="compound-state-label" x="92" y="133">c0</text>
      <text class="compound-state-caption" x="92" y="151">start</text>

      <circle id="cnode-c1" class="compound-node-svg accepting" cx="235" cy="138" r="24" />
      <circle class="compound-final-ring" cx="235" cy="138" r="31" />
      <text id="clabel-c1" class="compound-state-label" x="235" y="133">c1</text>
      <text class="compound-state-caption" x="235" y="151">symbol</text>

      <circle id="cnode-c2" class="compound-node-svg accepting" cx="378" cy="138" r="24" />
      <circle class="compound-final-ring" cx="378" cy="138" r="31" />
      <text id="clabel-c2" class="compound-state-label" x="378" y="133">c2</text>
      <text class="compound-state-caption" x="378" y="151">tail</text>

      <circle id="cnode-c3" class="compound-node-svg accepting" cx="528" cy="138" r="24" />
      <circle class="compound-final-ring" cx="528" cy="138" r="31" />
      <text id="clabel-c3" class="compound-state-label" x="528" y="133">c3</text>
      <text class="compound-state-caption" x="528" y="151">count</text>

      <g class="compound-note">
        <rect x="594" y="54" width="120" height="104" />
        <text x="608" y="78">Simple formula</text>
        <text x="608" y="99">Element = A-Z a-z?</text>
        <text x="608" y="120">Count = 1-9 0-9*</text>
        <text x="608" y="141">No parentheses yet</text>
      </g>
    </svg>`;
}

function clearCompoundDiagram() {
  document
    .querySelectorAll(
      ".compound-node-svg, .compound-state-label, .compound-transition, .transition-label",
    )
    .forEach((e) => e.classList.remove("active", "done", "error"));
}

function activateCompoundNode(state, mode = "active") {
  document
    .querySelectorAll(".compound-node-svg, .compound-state-label")
    .forEach((e) => e.classList.remove("active", "error"));
  const node = document.getElementById(`cnode-${state}`);
  const label = document.getElementById(`clabel-${state}`);
  if (node) node.classList.add(mode);
  if (label) label.classList.add(mode);
}

function activateCompoundEdge(from, to) {
  document
    .querySelectorAll(".compound-transition, .transition-label")
    .forEach((e) => e.classList.remove("active"));
  const edge = document.getElementById(`cedge-${from}-${to}`);
  const label = document.getElementById(`clabel-${from}-${to}`);
  if (edge) edge.classList.add("active");
  if (label) label.classList.add("active");
}

function setFsaMode(mode, preserveInput = false) {
  currentMode = mode === "compound" ? "compound" : "atom";
  const isCompound = currentMode === "compound";
  document.getElementById("modeAtom").classList.toggle("active", !isCompound);
  document
    .getElementById("modeCompound")
    .classList.toggle("active", isCompound);
  document.getElementById("inputStr").placeholder = isCompound
    ? "e.g. H2O or C6H12O6"
    : "e.g. 235_92U3+";
  document.getElementById("inputHint").textContent = isCompound
    ? "FORMAT: [Element][count?] repeated - no parentheses yet"
    : "FORMAT: [mass]_[Z][Symbol][charge?] - Enter to run";
  document.getElementById("atomQuickTests").style.display = isCompound
    ? "none"
    : "flex";
  document.getElementById("compoundQuickTests").style.display = isCompound
    ? "flex"
    : "none";
  document.getElementById("fsa-svg").style.display = isCompound
    ? "none"
    : "block";
  document.getElementById("compoundDiagram").style.display = isCompound
    ? "block"
    : "none";
  document.getElementById("fsaTitle").textContent = isCompound
    ? "Compound FSA - Simple Formula Grammar"
    : "FSA Diagram - State Transition Graph";
  document.getElementById("resultTitle").textContent = isCompound
    ? "Result - Compound Formula"
    : "Result - Scientific Notation";
  if (!preserveInput) {
    document.getElementById("inputStr").value = isCompound ? "H2O" : "23_11Na";
  }
  if (isCompound) {
    buildCompoundDiagram();
    buildCompoundTransitionTable();
  } else {
    buildTransitionTable();
  }
  clearBatch();
  resetAll();
}

async function simulateCompound(token, isStep) {
  const input = document.getElementById("inputStr").value.trim();
  if (!input) {
    setStatus("", "AWAITING INPUT");
    return;
  }
  const DELAY = getDelay();
  clearLog();
  clearCompoundDiagram();
  clearElementInfo();
  setStatus("running", "PROCESSING COMPOUND...");
  document.getElementById("atomRender").innerHTML = "-";
  document.getElementById("sbChar").innerHTML = "";
  buildTape(input);
  logMsg(`// Simulating compound formula: "${input}"`, "log-info");
  logMsg("", "log-info");
  let currentState = "c0";
  let valid = true;
  activateCompoundNode("c0");
  if (isStep) await waitForStep(token);
  else await sleepOrAbort(DELAY * 0.4, token);
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    setTapeHead(i, "active", input.length);
    updateTapeProgress(i + 1, input.length);
    document.getElementById("sbChar").innerHTML =
      `Reading: <span class="char-highlight">${escapeHtml(ch)}</span> [${i + 1}/${input.length}]`;
    highlightCompoundTableCell(currentState, ch);
    const next = compoundTransition(currentState, ch);
    if (next === null) {
      logEntry(currentState, ch, "???", true);
      setTapeHead(i, "error", input.length);
      activateCompoundNode(currentState, "error");
      setStatus("invalid", "INVALID COMPOUND", `Rejected at position ${i}`);
      valid = false;
      break;
    }
    logEntry(currentState, ch, next);
    activateCompoundEdge(currentState, next);
    if (isStep) await waitForStep(token);
    else await sleepOrAbort(DELAY * 0.35, token);
    activateCompoundNode(next);
    currentState = next;
    if (isStep) await waitForStep(token);
    else await sleepOrAbort(DELAY * 0.65, token);
  }
  if (valid) {
    if (isCompoundAccepting(currentState)) {
      const validation = validateCompoundFormula(input);
      if (!validation.valid) {
        const reason = getCompoundErrorReason(input, validation);
        logMsg("", "log-info");
        logMsg(
          `FSA accepted formula pattern, but compound data invalid - ${reason}`,
          "log-error",
        );
        document.getElementById("atomRender").innerHTML =
          `<div class="atom-invalid-result"><div>FSA accepted formula pattern</div><span>Compound data invalid: ${escapeHtml(reason)}</span></div>`;
        setTapeHead(input.length, "error", input.length);
        activateCompoundNode(currentState, "error");
        setStatus("invalid", "COMPOUND DATA INVALID", reason);
        addHistory(input, false, "compound");
        updateTapeProgress(input.length, input.length);
        return;
      }
      setTapeHead(input.length, "active", input.length);
      document
        .querySelectorAll(".compound-node")
        .forEach((e) => e.classList.add("done"));
      logMsg("", "log-info");
      logMsg("COMPOUND ACCEPTED - formula pattern and elements match", "log-ok");
      setStatus("valid", "VALID COMPOUND", "Formula pattern and elements match");
      document.getElementById("atomRender").innerHTML =
        renderCompoundHTML(input);
      showCompoundInfo(input, validation.parsed);
      addHistory(input, true, "compound");
    } else {
      logMsg("", "log-info");
      logMsg(`Ended in non-accepting state: ${currentState}`, "log-error");
      activateCompoundNode(currentState, "error");
      setStatus(
        "invalid",
        "INVALID COMPOUND",
        `Ended in non-accepting state: ${currentState}`,
      );
      addHistory(input, false, "compound");
    }
  } else {
    addHistory(input, false, "compound");
  }
  updateTapeProgress(input.length, input.length);
}
