const BATCH_SAMPLES = [
  "23_11Na",
  "235_92U3+",
  "14_7N-",
  "56_26Fe2+",
  "40_20Ca2+",
  "4_2He",
  "197_79Au",
  "238_92U",
  "1_1H",
  "16_8O2-",
  "abc",
  "23_Na",
  "23_92Na",
  "_11Na",
  "Fe",
  "235_92",
];
const COMPOUND_BATCH_SAMPLES = [
  "H2O",
  "CO2",
  "NaCl",
  "CaO",
  "MgO",
  "KCl",
  "LiF",
  "HCl",
  "NH3",
  "CH4",
  "C6H12O6",
  "Fe2O3",
  "Xx2O",
  "H0O",
  "2H",
  "Ca(OH)2",
];

function validateBatchEntry(s) {
  return currentMode === "compound"
    ? validateCompoundFormula(s)
    : validateOne(s);
}

function getBatchErrorReason(s, res) {
  return currentMode === "compound"
    ? getCompoundErrorReason(s, res)
    : getErrorReason(s, res);
}

function renderBatchEntry(s, res) {
  if (!res.valid || !res.parsed) {
    return getBatchErrorReason(s, res).slice(0, 36);
  }
  return currentMode === "compound" ? renderCompoundHTML(s) : renderAtomHTML(s);
}

async function runBatch() {
  const raw = document.getElementById("batchInput").value;
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 100);
  if (!lines.length) {
    showToast("No input to validate");
    return;
  }

  document.getElementById("batchStatBadge").textContent =
    `${currentMode.toUpperCase()} · ${lines.length} ENTRIES`;
  document.getElementById("batchResults").innerHTML = "";
  document.getElementById("batchValidCount").textContent = "0 ✓";
  document.getElementById("batchInvalidCount").textContent = "0 ✗";

  const bar = document.getElementById("batchProgressBar");
  const fill = document.getElementById("batchProgressFill");
  bar.style.display = "block";
  fill.style.width = "0%";

  let validCount = 0,
    invalidCount = 0;
  const resultsWrap = document.getElementById("batchResults");

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i];
    const res = validateBatchEntry(s);

    // Row
    const row = document.createElement("div");
    row.className = "batch-row";
    row.onclick = () => setInput(s);
    row.title = "Click to load into simulator";

    // Line number
    const num = document.createElement("div");
    num.className = "batch-num";
    num.textContent = i + 1;

    // Input string
    const str = document.createElement("div");
    str.className = "batch-str";
    str.textContent = s;

    // Rendered notation or error
    const notation = document.createElement("div");
    notation.className =
      "batch-notation" + (res.valid ? "" : " invalid-text");
    if (res.valid && res.parsed) notation.innerHTML = renderBatchEntry(s, res);
    else notation.textContent = renderBatchEntry(s, res);

    // Pill
    const pill = document.createElement("div");
    pill.className = "batch-pill " + (res.valid ? "valid" : "invalid");
    pill.textContent = res.valid ? "VALID" : "INVALID";

    row.appendChild(num);
    row.appendChild(str);
    row.appendChild(notation);
    row.appendChild(pill);
    resultsWrap.appendChild(row);

    if (res.valid) validCount++;
    else invalidCount++;

    // Update counters live
    document.getElementById("batchValidCount").textContent =
      validCount + " ✓";
    document.getElementById("batchInvalidCount").textContent =
      invalidCount + " ✗";
    fill.style.width = Math.round(((i + 1) / lines.length) * 100) + "%";

    // Small yield to allow repaint
    if (i % 5 === 4) await new Promise((r) => setTimeout(r, 0));
  }

  bar.style.display = "none";
  fill.style.width = "0%";
  document.getElementById("batchStatBadge").textContent =
    `${currentMode.toUpperCase()} · ${lines.length} DONE`;
  showToast(`Batch: ${validCount} valid, ${invalidCount} invalid`);
}

function clearBatch() {
  document.getElementById("batchInput").value = "";
  document.getElementById("batchResults").innerHTML =
    '<div class="batch-empty">Masukkan notasi di kiri lalu klik VALIDATE ALL</div>';
  document.getElementById("batchStatBadge").textContent = "0 ENTRIES";
  document.getElementById("batchValidCount").textContent = "0 ✓";
  document.getElementById("batchInvalidCount").textContent = "0 ✗";
  document.getElementById("batchProgressBar").style.display = "none";
}

function loadBatchSamples() {
  const samples =
    currentMode === "compound" ? COMPOUND_BATCH_SAMPLES : BATCH_SAMPLES;
  document.getElementById("batchInput").value = samples.join("\n");
  document.getElementById("batchStatBadge").textContent =
    `${currentMode.toUpperCase()} · ${samples.length} ENTRIES`;
}

function exportBatchCSV() {
  const rows = document.querySelectorAll(".batch-row");
  if (!rows.length) {
    showToast("No results to export");
    return;
  }
  const lines = document
    .getElementById("batchInput")
    .value.split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  let csv = "No,Mode,Input,Valid,Notation,Elements\n";
  rows.forEach((row, i) => {
    const s = lines[i] || "";
    const res = validateBatchEntry(s);
    const elements =
      currentMode === "compound" && res.valid && res.parsed
        ? Object.keys(res.parsed.composition)
            .map((sym) => ELEMENTS[sym].name)
            .join("; ")
        : res.valid && res.parsed
          ? ELEMENTS[res.parsed.symbol].name
          : "";
    csv += `${i + 1},"${currentMode}","${s}",${res.valid},"${s}","${elements}"\n`;
  });
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "fsa_batch_results.csv";
  a.click();
  showToast("Batch exported");
}
