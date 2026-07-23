const RS = (() => {
  const LS = {
    users: "rs_users",
    session: "rs_session",
    reviews: "cp_career_inputs",
    settings: "rs_settings",
    profile: "rs_profile",
    reports: "rs_reports"
  };

  const positiveWords = ["python","sql","analytics","leadership","communication","cloud","java","javascript","machine","learning","data","project","agile","dashboard","api","database","research","design","testing","security"];
  const negativeWords = ["missing","gap","beginner","limited","weak","basic","unfamiliar","none","lacking","improve","learn","needed","required","transition","challenge","difficult","new","entry","support","training"];

  const sampleReviews = [
    { id: uid(), source: "Resume", customer: "Aarav Sharma", rating: 5, text: "Python SQL analytics dashboard project leadership communication agile", createdAt: "2026-07-01" },
    { id: uid(), source: "Skill Gap", customer: "Priya Nair", rating: 2, text: "Cloud security missing beginner database training needed", createdAt: "2026-07-02" },
    { id: uid(), source: "Resume", customer: "Riya Kapoor", rating: 4, text: "JavaScript API design testing data project machine learning", createdAt: "2026-07-03" },
    { id: uid(), source: "Career Goal", customer: "Kabir Mehta", rating: 3, text: "Product analytics communication basic leadership improve roadmap", createdAt: "2026-07-04" },
    { id: uid(), source: "Skill Gap", customer: "Neha Das", rating: 1, text: "Limited cloud experience missing SQL weak deployment skills", createdAt: "2026-07-05" },
    { id: uid(), source: "Resume", customer: "Isha Rao", rating: 5, text: "Machine learning research Python data visualization database project", createdAt: "2026-07-06" }
  ];

  function uid() { return "rs_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }
  function write(key, value) { localStorage.setItem(key, JSON.stringify(value)); return value; }
  function getUsers() { return read(LS.users, []); }
  function setUsers(users) { return write(LS.users, users); }
  function getSession() { return read(LS.session, null); }
  function setSession(session) { return write(LS.session, session); }
  function currentUser() {
    const session = getSession();
    if (session) return getUsers().find(u => u.email === session.email) || null;
    const legacyUser = read("user", null);
    return legacyUser?.email ? legacyUser : null;
  }
  function requireAuth() {
    const publicPages = ["index.html", "login.html", "register.html", "forgot-password.html", "contact.html", ""];
    const page = location.pathname.split("/").pop();
    if (!publicPages.includes(page) && !currentUser()) location.href = "login.html";
  }
  function logout() {
    localStorage.removeItem(LS.session);
    localStorage.removeItem("user");
    toast("Signed out successfully.");
    setTimeout(() => location.href = "login.html", 500);
  }
  function toast(message) {
    let box = document.querySelector(".toast");
    if (!box) {
      box = document.createElement("div");
      box.className = "toast";
      document.body.appendChild(box);
    }
    const item = document.createElement("div");
    item.textContent = message;
    box.appendChild(item);
    setTimeout(() => item.remove(), 3200);
  }
  function setActiveNav() {
    const page = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll("[data-nav]").forEach(a => {
      if (a.getAttribute("href") === page) a.classList.add("active");
    });
    const user = currentUser();
    document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = user ? user.name : "Guest");
  }
  function scoreReview(text, rating = 3) {
    const words = String(text).toLowerCase().match(/[a-z]+/g) || [];
    const pos = words.filter(w => positiveWords.includes(w)).length;
    const neg = words.filter(w => negativeWords.includes(w)).length;
    let score = pos - neg + (Number(rating) - 3) * .7;
    const sentiment = score > .7 ? "Strong Fit" : score < -.7 ? "Skill Gap" : "Developing";
    const confidence = Math.min(98, Math.max(58, Math.round(62 + Math.abs(score) * 12 + (pos + neg) * 3)));
    return { sentiment, confidence, score: Number(score.toFixed(2)) };
  }
  function enrich(review) { return { ...review, ...scoreReview(review.text, review.rating) }; }
  function getReviews() {
    const existing = read(LS.reviews, null);
    if (existing) return existing.map(enrich);
    const seeded = sampleReviews.map(enrich);
    write(LS.reviews, seeded);
    return seeded;
  }
  function setReviews(reviews) { return write(LS.reviews, reviews.map(enrich)); }
  function addReviews(items) {
    const reviews = [...items.map(r => enrich({ id: uid(), createdAt: new Date().toISOString().slice(0,10), ...r })), ...getReviews()];
    setReviews(reviews);
    return reviews;
  }
  function summarize(reviews = getReviews()) {
    const total = reviews.length || 1;
    const counts = { "Strong Fit": 0, "Skill Gap": 0, Developing: 0 };
    reviews.forEach(r => counts[r.sentiment]++);
    const avgRating = reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / total;
    const satisfaction = Math.round(((counts["Strong Fit"] + counts.Developing * .45) / total) * 100);
    return { total: reviews.length, counts, avgRating: avgRating.toFixed(1), satisfaction };
  }
  function keywords(type, limit = 8) {
    const bank = type === "positive" ? positiveWords : negativeWords;
    const tally = {};
    getReviews().forEach(r => (String(r.text).toLowerCase().match(/[a-z]+/g) || []).forEach(w => {
      if (bank.includes(w)) tally[w] = (tally[w] || 0) + 1;
    }));
    return Object.entries(tally).sort((a,b) => b[1] - a[1]).slice(0, limit);
  }
  function recommendations() {
    const s = summarize();
    const neg = keywords("negative", 5).map(k => k[0]);
    const recs = [];
    if (neg.includes("missing") || neg.includes("gap")) recs.push("Build a focused skill-gap plan from the resume analysis.");
    if (neg.includes("beginner") || neg.includes("basic") || neg.includes("limited")) recs.push("Recommend beginner-to-intermediate learning resources before advanced job matching.");
    if (neg.includes("training") || neg.includes("learn") || neg.includes("needed")) recs.push("Add structured courses and project milestones to improve readiness.");
    if (s.satisfaction >= 75) recs.push("Prioritize job recommendations that match the candidate's strongest skills.");
    return recs.length ? recs : ["Refresh the resume, compare career paths, and review career insights weekly."];
  }
  function download(filename, content, type = "text/plain") {
    const blob = new Blob([content], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  function reviewsToCsv(rows = getReviews()) {
    const head = ["Date","Candidate","Source","Readiness","Fit Signal","Confidence","Resume or Career Input"];
    const esc = v => `"${String(v ?? "").replaceAll('"', '""')}"`;
    return [head.join(","), ...rows.map(r => [r.createdAt,r.customer,r.source,r.rating,r.sentiment,r.confidence,r.text].map(esc).join(","))].join("\n");
  }
  function parseCsv(text) {
    return text.trim().split(/\r?\n/).slice(1).map(line => {
      const cells = line.match(/("([^"]|"")*"|[^,]+)/g) || [];
      const clean = cells.map(c => c.replace(/^"|"$/g, "").replaceAll('""','"'));
      return { customer: clean[0] || "Customer", source: clean[1] || "CSV", rating: Number(clean[2] || 3), text: clean.slice(3).join(",") || line };
    }).filter(r => r.text);
  }
  function drawDonut(canvas, counts) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.scale(dpr, dpr);
    const w = canvas.clientWidth, h = canvas.clientHeight, cx = w/2, cy = h/2, r = Math.min(w,h)*.36;
    ctx.clearRect(0,0,w,h);
    const total = Math.max(1, Object.values(counts).reduce((sum, count) => sum + Number(count || 0), 0));
    let start = -Math.PI/2;
    [["Strong Fit","#34d399"],["Developing","#fbbf24"],["Skill Gap","#fb7185"]].forEach(([key,color]) => {
      const end = start + (counts[key]/total) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.fillStyle = color; ctx.fill(); start = end;
    });
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(cx, cy, r*.58, 0, Math.PI*2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }
  function drawBars(canvas, rows) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d"), dpr = devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; ctx.scale(dpr,dpr);
    const w = canvas.clientWidth, h = canvas.clientHeight, pad = 38;
    ctx.clearRect(0,0,w,h);
    const max = Math.max(1, ...rows.map(r => r[1]));
    rows.forEach((row, i) => {
      const bw = (w - pad*2) / rows.length - 12;
      const x = pad + i * ((w - pad*2) / rows.length) + 6;
      const bh = (h - 70) * (row[1] / max);
      ctx.fillStyle = ["#8b5cf6","#22d3ee","#34d399","#fbbf24","#ec4899"][i % 5];
      ctx.fillRect(x, h - pad - bh, bw, bh);
      ctx.fillStyle = "#a9a2c9"; ctx.font = "12px sans-serif"; ctx.fillText(row[0], x, h - 14);
    });
  }
  function drawLine(canvas, points) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d"), dpr = devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; ctx.scale(dpr,dpr);
    const w = canvas.clientWidth, h = canvas.clientHeight, pad = 34;
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = "rgba(255,255,255,.12)";
    for (let i=0;i<5;i++){ const y=pad+i*(h-pad*2)/4; ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke(); }
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 3; ctx.beginPath();
    points.forEach((p,i) => {
      const x = pad + i * ((w-pad*2)/(points.length-1 || 1));
      const y = h - pad - (p/100)*(h-pad*2);
      i ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
    });
    ctx.stroke();
  }
  function init() {
    requireAuth();
    setActiveNav();
    document.querySelectorAll("[data-logout]").forEach(b => b.addEventListener("click", logout));
  }
  document.addEventListener("DOMContentLoaded", init);
  return { LS, uid, read, write, getUsers, setUsers, getSession, setSession, currentUser, toast, logout, scoreReview, enrich, getReviews, setReviews, addReviews, summarize, keywords, recommendations, download, reviewsToCsv, parseCsv, drawDonut, drawBars, drawLine };
})();
