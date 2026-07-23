let dashRows = [];
let dashPage = 1;
let dashSort = { key: "createdAt", dir: -1 };

function renderDashboard() {
  const reviews = RS.getReviews();
  const s = RS.summarize(reviews);
  document.querySelector("[data-total]").textContent = s.total;
  document.querySelector("[data-positive]").textContent = s.counts["Strong Fit"];
  document.querySelector("[data-negative]").textContent = s.counts["Skill Gap"];
  document.querySelector("[data-satisfaction]").textContent = s.satisfaction + "%";
  document.querySelector("[data-summary]").textContent = `CogniPath analyzed ${s.total} career inputs with a ${s.satisfaction}% readiness score and an average profile strength of ${s.avgRating}/5.`;
  document.querySelector("[data-recommendations]").innerHTML = RS.recommendations().map(r => `<li>${r}</li>`).join("");
  renderKeywords();
  renderReviewTable();
  RS.drawDonut(document.querySelector("#sentimentChart"), s.counts);
}

function renderKeywords() {
  const pos = RS.keywords("positive");
  const neg = RS.keywords("negative");
  document.querySelector("[data-positive-keywords]").innerHTML = (pos.length ? pos : [["reliable",1],["helpful",1]]).map(k => `<span>${k[0]} <small>${k[1]}</small></span>`).join("");
  document.querySelector("[data-negative-keywords]").innerHTML = (neg.length ? neg : [["slow",1],["confusing",1]]).map(k => `<span>${k[0]} <small>${k[1]}</small></span>`).join("");
}

function filteredRows() {
  const q = document.querySelector("[data-search]")?.value.toLowerCase() || "";
  const f = document.querySelector("[data-filter]")?.value || "All";
  return RS.getReviews().filter(r =>
    (f === "All" || r.sentiment === f) &&
    (`${r.customer} ${r.source} ${r.text}`.toLowerCase().includes(q))
  ).sort((a,b) => String(a[dashSort.key]).localeCompare(String(b[dashSort.key])) * dashSort.dir);
}

function renderReviewTable() {
  dashRows = filteredRows();
  const per = 6;
  const pages = Math.max(1, Math.ceil(dashRows.length / per));
  dashPage = Math.min(dashPage, pages);
  const rows = dashRows.slice((dashPage - 1) * per, dashPage * per);
  document.querySelector("[data-review-body]").innerHTML = rows.map(r => `
    <tr>
      <td>${r.createdAt}</td>
      <td>${r.customer}</td>
      <td>${r.source}</td>
      <td>${r.rating}/5</td>
      <td><span class="badge ${r.sentiment === "Strong Fit" ? "positive" : r.sentiment === "Skill Gap" ? "negative" : "neutral"}">${r.sentiment}</span></td>
      <td>${r.confidence}%</td>
      <td>${r.text}</td>
    </tr>`).join("");
  document.querySelector("[data-page-info]").textContent = `Page ${dashPage} of ${pages} · ${dashRows.length} results`;
}

function analyzePasted() {
  const text = document.querySelector("[data-paste]").value.trim();
  if (!text) return RS.toast("Paste resume highlights or skills first.");
  const items = text.split(/\n+/).map((line, i) => ({ customer: `Candidate Input ${i + 1}`, source: "Pasted Resume", rating: 3, text: line }));
  RS.addReviews(items);
  document.querySelector("[data-paste]").value = "";
  RS.toast(`${items.length} career input(s) analyzed.`);
  renderDashboard();
}

function uploadCsv(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const rows = RS.parseCsv(reader.result);
    if (!rows.length) return RS.toast("CSV needs columns: candidate, source, readiness, resume text.");
    RS.addReviews(rows);
    RS.toast(`${rows.length} CSV career input(s) imported.`);
    renderDashboard();
  };
  reader.readAsText(file);
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("[data-dashboard]")) return;
  renderDashboard();
  document.querySelector("[data-analyze]")?.addEventListener("click", analyzePasted);
  document.querySelector("[data-csv]")?.addEventListener("change", e => uploadCsv(e.target.files[0]));
  document.querySelector("[data-export]")?.addEventListener("click", () => RS.download("cognipath-career-insights.csv", RS.reviewsToCsv(dashRows.length ? dashRows : RS.getReviews()), "text/csv"));
  document.querySelector("[data-search]")?.addEventListener("input", () => { dashPage = 1; renderReviewTable(); });
  document.querySelector("[data-filter]")?.addEventListener("change", () => { dashPage = 1; renderReviewTable(); });
  document.querySelector("[data-prev]")?.addEventListener("click", () => { dashPage = Math.max(1, dashPage - 1); renderReviewTable(); });
  document.querySelector("[data-next]")?.addEventListener("click", () => { dashPage++; renderReviewTable(); });
  document.querySelectorAll("th[data-sort]").forEach(th => th.addEventListener("click", () => { dashSort.key = th.dataset.sort; dashSort.dir *= -1; renderReviewTable(); }));
});
