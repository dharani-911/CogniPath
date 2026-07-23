document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector("[data-analytics]")) return;
  const reviews = RS.getReviews();
  const s = RS.summarize(reviews);
  RS.drawDonut(document.querySelector("#analyticsDonut"), s.counts);
  const sources = {};
  reviews.forEach(r => sources[r.source] = (sources[r.source] || 0) + 1);
  RS.drawBars(document.querySelector("#sourceBars"), Object.entries(sources));
  RS.drawLine(document.querySelector("#trendLine"), [62, 66, 71, 68, 74, s.satisfaction]);
  document.querySelector("[data-analytics-copy]").textContent = `Career readiness is ${s.satisfaction}%, with ${s.counts["Strong Fit"]} strong-fit signals, ${s.counts.Developing} developing areas, and ${s.counts["Skill Gap"]} skill gaps.`;
});
