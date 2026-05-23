const SHELL_MAX = [2, 8, 18, 32, 18, 8, 2];
const SHELL_RADII = [24, 40, 56, 74, 90, 106, 120];
const SHELL_SPEEDS = [1.8, 2.6, 3.4, 4.4, 5.5, 6.8, 8.2];

function drawBohrAtom(Z, symbol, massNum) {
  const svg = document.getElementById("bohrSVG");
  svg.innerHTML = "";
  const ns = "http://www.w3.org/2000/svg";

  // Compute shell distribution
  let z = Z;
  const shells = [];
  SHELL_MAX.forEach((max, i) => {
    if (z <= 0) return;
    const n = Math.min(z, max);
    shells.push({ shell: i, count: n, radius: SHELL_RADII[i] });
    z -= n;
  });

  // Neutrons
  const A = parseInt(massNum) || Z * 2;
  const N = A - Z;

  // Background
  const bgCircle = document.createElementNS(ns, "circle");
  bgCircle.setAttribute("cx", "0");
  bgCircle.setAttribute("cy", "0");
  bgCircle.setAttribute("r", "108");
  bgCircle.setAttribute("fill", "none");
  svg.appendChild(bgCircle);

  // Draw orbits
  shells.forEach(({ radius }) => {
    const orbit = document.createElementNS(ns, "circle");
    orbit.setAttribute("cx", "0");
    orbit.setAttribute("cy", "0");
    orbit.setAttribute("r", radius);
    orbit.setAttribute("fill", "none");
    orbit.setAttribute("stroke", "var(--border)");
    orbit.setAttribute("stroke-width", "0.8");
    orbit.setAttribute("stroke-dasharray", "3 2");
    svg.appendChild(orbit);
  });

  // Nucleus
  const nuclRadius = Math.min(14, 6 + Math.log(Z + 1) * 3);
  const nucl = document.createElementNS(ns, "circle");
  nucl.setAttribute("cx", "0");
  nucl.setAttribute("cy", "0");
  nucl.setAttribute("r", nuclRadius);
  nucl.setAttribute("fill", "var(--amber)");
  nucl.setAttribute("fill-opacity", "0.18");
  nucl.setAttribute("stroke", "var(--amber)");
  nucl.setAttribute("stroke-width", "1.2");
  svg.appendChild(nucl);

  // Nucleus label
  const nuclText = document.createElementNS(ns, "text");
  nuclText.setAttribute("x", "0");
  nuclText.setAttribute("y", "1");
  nuclText.setAttribute("text-anchor", "middle");
  nuclText.setAttribute("dominant-baseline", "central");
  nuclText.setAttribute("fill", "var(--amber)");
  nuclText.setAttribute("font-family", "'IBM Plex Mono',monospace");
  nuclText.setAttribute("font-size", Z > 99 ? "5" : Z > 9 ? "6" : "7");
  nuclText.setAttribute("font-weight", "500");
  nuclText.textContent = symbol;
  svg.appendChild(nuclText);

  // Draw electrons
  shells.forEach(({ shell, count, radius }, si) => {
    const speed = SHELL_SPEEDS[shell];
    for (let e = 0; e < count; e++) {
      const angle = (e / count) * 2 * Math.PI;
      // Electron group (orbit wrapper)
      const g = document.createElementNS(ns, "g");
      g.setAttribute("transform", `rotate(${(angle * 180) / Math.PI})`);

      // Animated electron
      const eDot = document.createElementNS(ns, "circle");
      eDot.setAttribute("cy", "0");
      eDot.setAttribute("cx", "0");
      eDot.setAttribute("r", "3");
      eDot.setAttribute("fill", "var(--blue)");
      eDot.setAttribute("fill-opacity", "0.85");

      // Use animateTransform for CSS-independent animation
      const anim = document.createElementNS(ns, "animateTransform");
      anim.setAttribute("attributeName", "transform");
      anim.setAttribute("type", "rotate");
      anim.setAttribute("from", `0 0 0`);
      anim.setAttribute("to", `360 0 0`);
      anim.setAttribute("dur", `${speed}s`);
      anim.setAttribute("repeatCount", "indefinite");
      anim.setAttribute("additive", "sum");

      // Position on orbit
      const posX = radius * Math.cos(angle);
      const posY = radius * Math.sin(angle);
      eDot.setAttribute("cx", posX);
      eDot.setAttribute("cy", posY);

      // Electron orbit animation via extra group
      const gOrbit = document.createElementNS(ns, "g");
      const animOrbit = document.createElementNS(ns, "animateTransform");
      animOrbit.setAttribute("attributeName", "transform");
      animOrbit.setAttribute("type", "rotate");
      animOrbit.setAttribute("from", "0 0 0");
      animOrbit.setAttribute("to", "360 0 0");
      animOrbit.setAttribute("dur", `${speed}s`);
      animOrbit.setAttribute("repeatCount", "indefinite");
      gOrbit.appendChild(animOrbit);

      const eDot2 = document.createElementNS(ns, "circle");
      const startAngle = (e / count) * 2 * Math.PI;
      eDot2.setAttribute(
        "cx",
        (radius * Math.cos(startAngle)).toFixed(2),
      );
      eDot2.setAttribute(
        "cy",
        (radius * Math.sin(startAngle)).toFixed(2),
      );
      eDot2.setAttribute("r", "3");
      eDot2.setAttribute("fill", "var(--blue)");
      eDot2.setAttribute("fill-opacity", "0.85");

      gOrbit.appendChild(eDot2);
      svg.appendChild(gOrbit);
    }
  });

  // Shell labels
  shells.forEach(({ shell, count, radius }) => {
    const lbl = document.createElementNS(ns, "text");
    lbl.setAttribute("x", radius + 4);
    lbl.setAttribute("y", "-2");
    lbl.setAttribute("fill", "var(--ink-5)");
    lbl.setAttribute("font-family", "'IBM Plex Mono',monospace");
    lbl.setAttribute("font-size", "6");
    lbl.textContent = `${count}e`;
    svg.appendChild(lbl);
  });

  // Info badges
  const info = document.getElementById("bohrInfo");
  const neutrons = A - Z;
  info.innerHTML = `
    <div class="bohr-badge">P <span>${Z}</span></div>
    <div class="bohr-badge">N <span>${neutrons >= 0 ? neutrons : "?"}</span></div>
    <div class="bohr-badge">E <span>${Z}</span></div>
    <div class="bohr-badge">Shells <span>${shells.length}</span></div>
  `;
  document.getElementById("bohrAnimBadge").textContent = "ANIMATED";
}

function clearBohrAtom() {
  document.getElementById("bohrSVG").innerHTML = "";
  document.getElementById("bohrInfo").innerHTML =
    '<div class="bohr-empty">Run a valid simulation<br>to visualize atom</div>';
  document.getElementById("bohrAnimBadge").textContent = "STATIC";
}

/* ─── ELECTRON CONFIG ─── */
function electronConfig(Z) {
  const shells = [2, 8, 18, 32, 18, 8, 2];
  let z = Z;
  const parts = [];
  const labels = ["K", "L", "M", "N", "O", "P", "Q"];
  shells.forEach((max, i) => {
    if (z <= 0) return;
    const n = Math.min(z, max);
    parts.push(`${labels[i]}:${n}`);
    z -= n;
  });
  return parts.join(" · ");
}

/* ─── FSA TRANSITION ─── */
