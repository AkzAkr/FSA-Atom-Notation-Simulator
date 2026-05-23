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

function validateOne(s) {
  // Returns {valid, errorAt, errorChar, finalState, parsed}
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
      };
    state = next;
  }
  if (isAccepting(state)) {
    try {
      return {
        valid: true,
        errorAt: -1,
        errorChar: null,
        finalState: state,
        parsed: parseAtom(s),
      };
    } catch (e) {
      return {
        valid: true,
        errorAt: -1,
        errorChar: null,
        finalState: state,
        parsed: null,
      };
    }
  }
  return {
    valid: false,
    errorAt: s.length,
    errorChar: "EOF",
    finalState: state,
    parsed: null,
  };
}

function getErrorReason(s, res) {
  if (res.valid) return "";
  if (!s.trim()) return "empty input";
  if (res.errorAt < s.length)
    return `unexpected '${res.errorChar}' at pos ${res.errorAt} (state: ${res.finalState})`;
  return `incomplete — ended in non-accepting state '${res.finalState}'`;
}
