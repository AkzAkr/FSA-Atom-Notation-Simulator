window.addEventListener("load", () => {
  activateNode("q0");
  buildTransitionTable();
  buildPeriodicTable();
  const initVal = document.getElementById("inputStr").value || "23_11Na";
  buildTape(initVal);
  liveValidate(initVal);
  const saved = localStorage.getItem("fsa-theme");
  if (saved === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    document.getElementById("dmIcon").textContent = "◑";
  }
});
