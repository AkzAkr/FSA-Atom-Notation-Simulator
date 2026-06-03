/* ─── SPEED ─── */
document
  .getElementById("speedSlider")
  .addEventListener("input", function () {
    document.getElementById("speedVal").textContent = this.value + "×";
  });
function getDelay() {
  return [900, 650, 450, 280, 120][
    parseInt(document.getElementById("speedSlider").value) - 1
  ];
}

/* ─── SIM ENGINE ─── */
let simRunning = false,
  stepMode = false,
  stepResolve = null,
  abortToken = null;
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
function waitForStep(token) {
  return new Promise((resolve, reject) => {
    const check = setInterval(() => {
      if (abortToken !== token) {
        clearInterval(check);
        stepResolve = null;
        reject("abort");
      }
    }, 50);
    stepResolve = () => {
      clearInterval(check);
      stepResolve = null;
      resolve();
    };
  });
}
function sleepOrAbort(ms, token) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    const check = setInterval(() => {
      if (abortToken !== token) {
        clearInterval(check);
        clearTimeout(t);
        reject("abort");
      }
    }, 50);
  });
}
async function runSimulation() {
  abortToken = (abortToken || 0) + 1;
  const myToken = abortToken;
  if (stepResolve) stepResolve();
  await sleep(80);
  if (abortToken !== myToken) return;
  simRunning = true;
  stepMode = false;
  setButtons("run");
  try {
    await simulate(myToken, false);
  } catch (e) {}
  if (abortToken === myToken) {
    simRunning = false;
    setButtons("idle");
  }
}
function stepNext() {
  if (!simRunning) {
    _launchStepSim();
    return;
  }
  if (stepMode && stepResolve) stepResolve();
}
async function _launchStepSim() {
  abortToken = (abortToken || 0) + 1;
  const myToken = abortToken;
  simRunning = true;
  stepMode = true;
  setButtons("step");
  try {
    await simulate(myToken, true);
  } catch (e) {}
  if (abortToken === myToken) {
    simRunning = false;
    stepMode = false;
    setButtons("idle");
  }
}
function setButtons(mode) {
  const r = document.getElementById("btnRun"),
    s = document.getElementById("btnStep");
  r.classList.remove("running");
  if (mode === "run") {
    r.disabled = true;
    r.classList.add("running");
    s.disabled = true;
  } else if (mode === "step") {
    r.disabled = false;
    s.disabled = false;
  } else {
    r.disabled = false;
    s.disabled = false;
  }
}

async function simulate(token, isStep) {
  if (currentMode === "compound") {
    await simulateCompound(token, isStep);
    return;
  }
  const input = document.getElementById("inputStr").value.trim();
  if (!input) {
    setStatus("", "AWAITING INPUT");
    return;
  }
  const DELAY = getDelay();
  clearLog();
  clearDiagram();
  clearElementInfo();
  setStatus("running", "PROCESSING...");
  document.getElementById("atomRender").innerHTML = "—";
  document.getElementById("sbChar").innerHTML = "";
  buildTape(input);
  document
    .querySelectorAll(".trans-table td.tc-highlight")
    .forEach((e) => e.classList.remove("tc-highlight"));
  logMsg(
    `// Simulating: "${input}"  [length: ${input.length}]`,
    "log-info",
  );
  logMsg("", "log-info");
  let currentState = "q0",
    valid = true;
  const pathTrace = [];
  activateNode("q0");
  if (isStep) await waitForStep(token);
  else await sleepOrAbort(DELAY * 0.4, token);
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    setTapeHead(i, "active", input.length);
    updateTapeProgress(i + 1, input.length);
    document.getElementById("sbChar").innerHTML =
      `Reading: <span class="char-highlight">${escapeHtml(ch)}</span> [${i + 1}/${input.length}]`;
    highlightTableCell(currentState, ch);
    const next = transition(currentState, ch);
    if (next === null) {
      logEntry(currentState, ch, "???", true);
      setTapeHead(i, "error", input.length);
      activateNode(currentState, "error");
      setStatus(
        "invalid",
        "✗ INVALID STRING",
        `Rejected at position ${i}`,
      );
      valid = false;
      break;
    }
    logEntry(currentState, ch, next);
    pathTrace.push({ from: currentState, to: next });
    activateTransition(currentState, next);
    if (isStep) await waitForStep(token);
    else await sleepOrAbort(DELAY * 0.35, token);
    activateNode(next);
    currentState = next;
    if (isStep) await waitForStep(token);
    else await sleepOrAbort(DELAY * 0.65, token);
  }
  if (valid) {
    if (isAccepting(currentState)) {
      const validation = validateOne(input);
      if (!validation.valid) {
        const reason = getErrorReason(input, validation);
        const safeReason = escapeHtml(reason);
        logMsg("", "log-info");
        logMsg(
          `FSA accepted format, but atom data invalid - ${reason}`,
          "log-error",
        );
        document.getElementById("atomRender").innerHTML =
          `<div class="atom-invalid-result"><div>FSA accepted format</div><span>Atom data invalid: ${safeReason}</span></div>`;
        setTapeHead(input.length, "error", input.length);
        activateNode(currentState, "error");
        setStatus(
          "invalid",
          "ATOM DATA INVALID",
          `FSA accepted format, but atom data invalid: ${safeReason}`,
        );
        addHistory(input, false);
        updateTapeProgress(input.length, input.length);
        return;
      }
      setTapeHead(input.length, "active", input.length);
      logMsg("", "log-info");
      logMsg(
        "// ε-transition to qf (end of input — accepted)",
        "log-info",
      );
      pathTrace.push({ from: currentState, to: "qf" });
      activateTransition(currentState, "qf");
      if (isStep) await waitForStep(token);
      else await sleepOrAbort(DELAY * 0.4, token);
      activateFinal("done");
      activateNode("q0", "done");
      drawPathTrace(pathTrace);
      if (isStep) await waitForStep(token);
      else await sleepOrAbort(DELAY * 0.3, token);
      logMsg("", "log-info");
      logMsg("✓ STRING ACCEPTED — Final state reached", "log-ok");
      setStatus("valid", "✓ VALID STRING", "All characters accepted");
      document.getElementById("atomRender").innerHTML =
        renderAtomHTML(input);
      const parsed = validation.parsed;
      showElementInfo(input, parsed);
      addHistory(input, true);
    } else {
      logMsg("", "log-info");
      logMsg(
        `✗ Ended in non-accepting state: ${currentState}`,
        "log-error",
      );
      activateNode(currentState, "error");
      setStatus(
        "invalid",
        "✗ INVALID STRING",
        `Ended in non-accepting state: ${currentState}`,
      );
      addHistory(input, false);
    }
  } else {
    addHistory(input, false);
  }
  updateTapeProgress(input.length, input.length);
}

function resetAll() {
  abortToken = (abortToken || 0) + 1;
  if (stepResolve) {
    const r = stepResolve;
    stepResolve = null;
    r();
  }
  simRunning = false;
  stepMode = false;
  setButtons("idle");
  clearLog();
  if (currentMode === "compound") clearCompoundDiagram();
  else clearDiagram();
  clearElementInfo();
  setStatus("", "AWAITING INPUT");
  document.getElementById("atomRender").innerHTML = "—";
  document.getElementById("tapeCells").innerHTML = "";
  document.getElementById("tapeProgress").textContent = "— no input —";
  document.getElementById("tapeProgFill").style.width = "0%";
  document.getElementById("tapeHeadLabel").textContent = "▼ HEAD @ 0";
  document.getElementById("sbChar").innerHTML = "";
  document.getElementById("logContainer").innerHTML =
    '<div class="log-info">// READY — Enter a string and press RUN or STEP</div>';
  if (currentMode === "compound") activateCompoundNode("c0");
  else activateNode("q0");
  document
    .querySelectorAll(".trans-table td.tc-highlight")
    .forEach((e) => e.classList.remove("tc-highlight"));
  liveValidate(document.getElementById("inputStr").value);
}
function clearInput() {
  document.getElementById("inputStr").value = "";
  document.getElementById("inputClear").style.display = "none";
  document
    .getElementById("inputStr")
    .classList.remove("valid-border", "invalid-border");
  resetAll();
}
function setInput(val) {
  document.getElementById("inputStr").value = val;
  liveValidate(val);
  resetAll();
}

/* ─── KEYBOARD ─── */
document.getElementById("inputStr").addEventListener("keydown", (e) => {
  if (e.key === "Enter") runSimulation();
  if (e.key === "Escape") clearInput();
});
document
  .getElementById("inputStr")
  .addEventListener("input", function () {
    liveValidate(this.value);
  });
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "r") {
    e.preventDefault();
    resetAll();
  }
});

/* ─── DARK MODE ─── */
