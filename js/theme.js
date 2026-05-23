function toggleDark() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  html.setAttribute("data-theme", isDark ? "light" : "dark");
  document.getElementById("dmIcon").textContent = isDark ? "◐" : "◑";
  localStorage.setItem("fsa-theme", isDark ? "light" : "dark");
}

/* ─── BATCH INPUT ─── */
