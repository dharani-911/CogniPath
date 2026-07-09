function renderReport() {
  const s = RS.summarize();
  const recs = RS.recommendations();
  document.querySelector("[data-report-date]").textContent = new Date().toLocaleString();
  document.querySelector("[data-report-summary]").textContent = `CogniPath processed ${s.total} career inputs. Overall readiness is ${s.satisfaction}% with an average profile strength of ${s.avgRating}/5.`;
  document.querySelector("[data-report-kpis]").innerHTML = `
    <div class="metric"><b>${s.counts["Strong Fit"]}</b><span>Strong Fit</span></div>
    <div class="metric"><b>${s.counts.Developing}</b><span>Developing</span></div>
    <div class="metric"><b>${s.counts["Skill Gap"]}</b><span>Skill Gap</span></div>`;
  document.querySelector("[data-report-recs]").innerHTML = recs.map(r => `<li>${r}</li>`).join("");
  RS.write(RS.LS.reports, [...RS.read(RS.LS.reports, []), { id: RS.uid(), createdAt: new Date().toISOString(), satisfaction: s.satisfaction, total: s.total }]);
}
document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("[data-reports]")) return;
  renderReport();
  document.querySelector("[data-download-csv]").addEventListener("click", () => RS.download("cognipath-career-report.csv", RS.reviewsToCsv(), "text/csv"));
  document.querySelector("[data-download-pdf]").addEventListener("click", () => window.print());
  document.querySelector("[data-generate-report]").addEventListener("click", () => { renderReport(); RS.toast("Fresh report generated."); });
});
