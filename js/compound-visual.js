const MOLECULE_TEMPLATES = {
  H2O: {
    title: "Bent water molecule",
    atoms: [
      { symbol: "O", x: 0, y: -8 },
      { symbol: "H", x: -58, y: 42 },
      { symbol: "H", x: 58, y: 42 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
    ],
  },
  CO2: {
    title: "Linear carbon dioxide",
    atoms: [
      { symbol: "O", x: -76, y: 0 },
      { symbol: "C", x: 0, y: 0 },
      { symbol: "O", x: 76, y: 0 },
    ],
    bonds: [
      [0, 1, 2],
      [1, 2, 2],
    ],
  },
  NaCl: {
    title: "Ionic pair",
    atoms: [
      { symbol: "Na", x: -52, y: 0, charge: "+" },
      { symbol: "Cl", x: 52, y: 0, charge: "-" },
    ],
    bonds: [[0, 1, 0]],
  },
  CaO: {
    title: "Calcium oxide ionic pair",
    atoms: [
      { symbol: "Ca", x: -52, y: 0, charge: "2+" },
      { symbol: "O", x: 52, y: 0, charge: "2-" },
    ],
    bonds: [[0, 1, 0]],
  },
  MgO: {
    title: "Magnesium oxide ionic pair",
    atoms: [
      { symbol: "Mg", x: -52, y: 0, charge: "2+" },
      { symbol: "O", x: 52, y: 0, charge: "2-" },
    ],
    bonds: [[0, 1, 0]],
  },
  KCl: {
    title: "Potassium chloride ionic pair",
    atoms: [
      { symbol: "K", x: -52, y: 0, charge: "+" },
      { symbol: "Cl", x: 52, y: 0, charge: "-" },
    ],
    bonds: [[0, 1, 0]],
  },
  LiF: {
    title: "Lithium fluoride ionic pair",
    atoms: [
      { symbol: "Li", x: -52, y: 0, charge: "+" },
      { symbol: "F", x: 52, y: 0, charge: "-" },
    ],
    bonds: [[0, 1, 0]],
  },
  HCl: {
    title: "Hydrogen chloride sketch",
    atoms: [
      { symbol: "H", x: -48, y: 0 },
      { symbol: "Cl", x: 48, y: 0 },
    ],
    bonds: [[0, 1, 1]],
  },
  O2: {
    title: "Diatomic oxygen",
    atoms: [
      { symbol: "O", x: -42, y: 0 },
      { symbol: "O", x: 42, y: 0 },
    ],
    bonds: [[0, 1, 2]],
  },
  N2: {
    title: "Diatomic nitrogen",
    atoms: [
      { symbol: "N", x: -42, y: 0 },
      { symbol: "N", x: 42, y: 0 },
    ],
    bonds: [[0, 1, 3]],
  },
  NH3: {
    title: "Ammonia sketch",
    atoms: [
      { symbol: "N", x: 0, y: -8 },
      { symbol: "H", x: -62, y: 34 },
      { symbol: "H", x: 0, y: 64 },
      { symbol: "H", x: 62, y: 34 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
    ],
  },
  CH4: {
    title: "Methane 2D sketch",
    atoms: [
      { symbol: "C", x: 0, y: 0 },
      { symbol: "H", x: 0, y: -68 },
      { symbol: "H", x: 68, y: 0 },
      { symbol: "H", x: 0, y: 68 },
      { symbol: "H", x: -68, y: 0 },
    ],
    bonds: [
      [0, 1, 1],
      [0, 2, 1],
      [0, 3, 1],
      [0, 4, 1],
    ],
  },
};

function drawCompoundVisual(formula, parsed) {
  const svg = document.getElementById("bohrSVG");
  svg.innerHTML = "";
  svg.setAttribute("viewBox", "-120 -120 240 240");
  const ns = "http://www.w3.org/2000/svg";
  const template = MOLECULE_TEMPLATES[formula];

  if (template) drawMoleculeTemplate(svg, ns, template);
  else drawCompoundCluster(svg, ns, parsed);

  const totalAtoms = Object.values(parsed.composition).reduce(
    (sum, count) => sum + count,
    0,
  );
  document.getElementById("bohrInfo").innerHTML = `
    <div class="bohr-badge">Types <span>${Object.keys(parsed.composition).length}</span></div>
    <div class="bohr-badge">Atoms <span>${totalAtoms}</span></div>
    <div class="bohr-badge">Mode <span>2D</span></div>
  `;
  document.getElementById("bohrAnimBadge").textContent = template
    ? "MOLECULE"
    : "COMPOSITION";
}

function drawMoleculeTemplate(svg, ns, template) {
  template.bonds.forEach(([a, b, order]) => {
    const p1 = template.atoms[a];
    const p2 = template.atoms[b];
    drawBond(svg, ns, p1, p2, order);
  });
  template.atoms.forEach((atom) => drawMoleculeAtom(svg, ns, atom));
  drawMoleculeTitle(svg, ns, template.title);
}

function drawBond(svg, ns, p1, p2, order) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ox = (-dy / len) * 4;
  const oy = (dx / len) * 4;
  const offsets =
    order === 3
      ? [-1, 0, 1]
      : order === 2
        ? [-0.6, 0.6]
        : order === 0
          ? [0]
          : [0];
  offsets.forEach((mul) => {
    const line = document.createElementNS(ns, "line");
    line.setAttribute("x1", p1.x + ox * mul);
    line.setAttribute("y1", p1.y + oy * mul);
    line.setAttribute("x2", p2.x + ox * mul);
    line.setAttribute("y2", p2.y + oy * mul);
    line.setAttribute("class", order === 0 ? "molecule-bond ionic" : "molecule-bond");
    svg.appendChild(line);
  });
}

function drawMoleculeAtom(svg, ns, atom) {
  const el = ELEMENTS[atom.symbol];
  const radius = atom.symbol.length > 1 ? 19 : 17;
  const group = document.createElementNS(ns, "g");
  group.setAttribute("class", "molecule-atom");
  const circle = document.createElementNS(ns, "circle");
  circle.setAttribute("cx", atom.x);
  circle.setAttribute("cy", atom.y);
  circle.setAttribute("r", radius);
  circle.setAttribute("fill", el ? el.color : "var(--bg-card)");
  circle.setAttribute("fill-opacity", "0.22");
  circle.setAttribute("stroke", el ? el.color : "var(--border-strong)");
  circle.setAttribute("stroke-width", "1.4");
  group.appendChild(circle);

  const text = document.createElementNS(ns, "text");
  text.setAttribute("x", atom.x);
  text.setAttribute("y", atom.y + 1);
  text.setAttribute("class", "molecule-atom-label");
  text.textContent = atom.symbol;
  group.appendChild(text);

  if (atom.charge) {
    const charge = document.createElementNS(ns, "text");
    charge.setAttribute("x", atom.x + radius - 2);
    charge.setAttribute("y", atom.y - radius + 3);
    charge.setAttribute("class", "molecule-charge");
    charge.textContent = atom.charge;
    group.appendChild(charge);
  }
  svg.appendChild(group);
}

function drawMoleculeTitle(svg, ns, title) {
  const text = document.createElementNS(ns, "text");
  text.setAttribute("x", "0");
  text.setAttribute("y", "100");
  text.setAttribute("class", "molecule-title");
  text.textContent = title;
  svg.appendChild(text);
}

function drawCompoundCluster(svg, ns, parsed) {
  const entries = Object.entries(parsed.composition);
  const radius = 64;
  entries.forEach(([symbol, count], i) => {
    const angle = -Math.PI / 2 + (i / entries.length) * Math.PI * 2;
    drawMoleculeAtom(svg, ns, {
      symbol,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
    const text = document.createElementNS(ns, "text");
    text.setAttribute("x", Math.cos(angle) * (radius + 30));
    text.setAttribute("y", Math.sin(angle) * (radius + 30) + 3);
    text.setAttribute("class", "molecule-count");
    text.textContent = `x${count}`;
    svg.appendChild(text);
  });
  const center = document.createElementNS(ns, "circle");
  center.setAttribute("cx", "0");
  center.setAttribute("cy", "0");
  center.setAttribute("r", "24");
  center.setAttribute("class", "molecule-cluster-core");
  svg.appendChild(center);
  drawMoleculeTitle(svg, ns, "Generic composition view");
}
