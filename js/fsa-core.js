/* FSA core: transitions, accepting states, atom parser, and pure validation. */
function transition(state, ch) {
  const d = /[0-9]/.test(ch),
    U = /[A-Z]/.test(ch),
    l = /[a-z]/.test(ch),
    s = ch === "+" || ch === "-",
    u = ch === "_";
  switch (state) {
    case "q0":
      if (d) return "q1";
      break;
    case "q1":
      if (d) return "q1";
      if (u) return "q2";
      break;
    case "q2":
      if (d) return "q3";
      break;
    case "q3":
      if (d) return "q3";
      if (U) return "q4";
      break;
    case "q4":
      if (l) return "q4";
      if (d) return "q5";
      if (s) return "q6";
      break;
    case "q5":
      if (s) return "q6";
      break;
    case "q6":
      break;
  }
  return null;
}
function isAccepting(state) {
  return state === "q4" || state === "q6";
}

/* ─── TRANSITION TABLE ─── */

const TABLE_STATES = ["q0", "q1", "q2", "q3", "q4", "q5", "q6"];
const TABLE_INPUTS = ["digit", "_", "A-Z", "a-z", "+/-"];
function cellTrans(state, ic) {
  const map = { digit: "0", _: "_", "A-Z": "A", "a-z": "a", "+/-": "+" };
  return transition(state, map[ic]);
}

function parseAtom(s) {
  const ui = s.indexOf("_");
  const mass = s.slice(0, ui);
  const rest = s.slice(ui + 1);
  let ae = 0;
  while (ae < rest.length && /[0-9]/.test(rest[ae])) ae++;
  const atomNum = rest.slice(0, ae);
  const after = rest.slice(ae);
  let se = 1;
  while (se < after.length && /[a-z]/.test(after[se])) se++;
  return {
    mass,
    atomNum,
    symbol: after.slice(0, se),
    charge: after.slice(se),
  };
}

function validateAtomSemantics(parsed) {
  const massNum = Number.parseInt(parsed.mass, 10);
  const atomNum = Number.parseInt(parsed.atomNum, 10);
  const el = ELEMENTS[parsed.symbol];

  if (!el) {
    return {
      valid: false,
      reason: `unknown element symbol '${parsed.symbol}'`,
    };
  }
  if (atomNum !== el.Z) {
    return {
      valid: false,
      reason: `Z mismatch: '${parsed.symbol}' is Z=${el.Z}, not Z=${atomNum}`,
    };
  }
  if (massNum < atomNum) {
    return {
      valid: false,
      reason: `mass number A=${massNum} must be >= Z=${atomNum}`,
    };
  }
  const isotopeRange = getKnownIsotopeMassRange(parsed.symbol);
  if (!isotopeRange) {
    return {
      valid: false,
      reason: `no isotope data available for '${parsed.symbol}'`,
    };
  }
  if (!isKnownIsotopeMass(parsed.symbol, massNum)) {
    return {
      valid: false,
      reason: `'${parsed.symbol}' has known isotopes A=${isotopeRange[0]}-${isotopeRange[1]}, not A=${massNum}`,
    };
  }
  return { valid: true, reason: "" };
}

function validateOne(s) {
  // Returns {valid, errorAt, errorChar, finalState, parsed, semanticError}
  let state = "q0";
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = transition(state, ch);
    if (next === null)
      return {
        valid: false,
        errorAt: i,
        errorChar: ch,
        finalState: state,
        parsed: null,
        semanticError: "",
      };
    state = next;
  }
  if (isAccepting(state)) {
    try {
      const parsed = parseAtom(s);
      const semantic = validateAtomSemantics(parsed);
      return {
        valid: semantic.valid,
        errorAt: -1,
        errorChar: null,
        finalState: state,
        parsed,
        semanticError: semantic.reason,
      };
    } catch (e) {
      return {
        valid: false,
        errorAt: -1,
        errorChar: null,
        finalState: state,
        parsed: null,
        semanticError: "could not parse accepted atom notation",
      };
    }
  }
  return {
    valid: false,
    errorAt: s.length,
    errorChar: "EOF",
    finalState: state,
    parsed: null,
    semanticError: "",
  };
}

function getErrorReason(s, res) {
  if (res.valid) return "";
  if (res.semanticError) return res.semanticError;
  if (!s.trim()) return "empty input";
  if (res.errorAt < s.length)
    return `unexpected '${res.errorChar}' at pos ${res.errorAt} (state: ${res.finalState})`;
  return `incomplete — ended in non-accepting state '${res.finalState}'`;
}
