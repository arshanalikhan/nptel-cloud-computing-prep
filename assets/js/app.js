// Generated from cloud-computing-prep.html by tools/site/build_site.py. Edit the source, not this file.
const KEY = "ccprep-v1";
const LET = "ABCDEF";
let store = {};
try { store = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { store = {}; }
let filter = "mine";
try { filter = localStorage.getItem(KEY + "-f") || "mine"; } catch (e) {}
let reveal = false;
let order = QS.map((_, i) => i);

function save() { try { localStorage.setItem(KEY, JSON.stringify(store)); localStorage.setItem(KEY + "-f", filter); } catch (e) {} }
function inSet(i) {
  const q = QS[i];
  if (filter === "all") return true;
  if (filter === "num") return q[5] === "num";
  if (filter === "mine") return q[6] === "y";
  if (filter === "past") return q[6] !== "y";
  return String(q[0]) === filter;
}
function visible() { return order.filter(inSet); }

function buildChips() {
  const box = document.getElementById("chips");
  const defs = [
    ["mine", "My 2026 assignments", QS.filter(q => q[6] === "y").length],
    ["past", "Older runs", QS.filter(q => q[6] !== "y").length],
    ["all", "All", QS.length],
    ["num", "Numericals", QS.filter(q => q[5] === "num").length]
  ];
  for (let w = 0; w <= 12; w++) defs.push([String(w), w === 0 ? "W0 prereq" : "W" + w, QS.filter(q => q[0] === w).length]);
  box.innerHTML = "";
  defs.forEach(([id, label, n]) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "chip"; b.dataset.f = id;
    b.setAttribute("aria-pressed", String(filter === id));
    b.innerHTML = label + " <small>" + n + "</small>";
    b.addEventListener("click", () => { filter = id; qpage = 0; save(); buildChips(); render(); });
    box.appendChild(b);
  });
}

function card(i, n) {
  const [w, text, opts, ans, expl, kind, src] = QS[i];
  const multi = ans.length > 1;
  const st = store[i] || { sel: [], done: false };
  const show = st.done || reveal;
  const el = document.createElement("article");
  el.className = "q"; el.id = "q" + i; el.dataset.n = n;

  const meta = document.createElement("div");
  meta.className = "q-meta";
  const parts = ["Q" + n, w === 0 ? "W0 prereq" : "Week " + w];
  meta.innerHTML = parts.map(p => "<span>" + p + "</span>").join("") +
    (src === "y" ? '<span class="mine">Your Jul–Oct 2026 assignment</span>' : "") +
    (kind === "num" ? '<span class="k">Numerical</span>' : "") +
    "<span>" + (multi ? "Select all that apply" : "One answer") + "</span>";
  el.appendChild(meta);

  const p = document.createElement("p");
  p.className = "q-text"; p.textContent = text;
  el.appendChild(p);

  const box = document.createElement("div");
  box.className = "opts";
  opts.forEach((o, k) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "opt";
    const key = document.createElement("span"); key.className = "key"; key.textContent = LET[k];
    const t = document.createElement("span"); t.textContent = o;
    b.append(key, t);
    const picked = st.sel.includes(k);
    b.setAttribute("aria-pressed", String(picked && !show));
    if (show) {
      b.disabled = true;
      if (ans.includes(k)) b.classList.add("correct");
      else if (picked) b.classList.add("wrong");
    } else {
      b.addEventListener("click", () => pick(i, k));
    }
    box.appendChild(b);
  });
  el.appendChild(box);

  const foot = document.createElement("div");
  foot.className = "q-foot";
  if (multi && !show) {
    const c = document.createElement("button");
    c.type = "button"; c.className = "btn primary"; c.textContent = "Check";
    c.disabled = st.sel.length === 0;
    c.addEventListener("click", () => check(i));
    foot.appendChild(c);
  }
  if (st.done) {
    const v = document.createElement("span");
    v.className = "verdict " + (st.ok ? "ok" : "no");
    v.textContent = st.ok ? "Correct" : "Not quite";
    foot.appendChild(v);
  }
  if (foot.childNodes.length) el.appendChild(foot);

  if (show) {
    const why = document.createElement("p");
    why.className = "why";
    const lab = document.createElement("b");
    lab.textContent = "Answer " + ans.map(a => LET[a]).join(", ");
    why.append(lab, document.createTextNode(expl || ""));
    el.appendChild(why);
  }
  return el;
}

function redraw(i) {
  const old = document.getElementById("q" + i);
  if (old) old.replaceWith(card(i, Number(old.dataset.n)));
  updateScore();
}
function pick(i, k) {
  const q = QS[i];
  const st = store[i] || { sel: [], done: false };
  if (st.done) return;
  if (q[3].length === 1) { st.sel = [k]; st.done = true; st.ok = k === q[3][0]; }
  else { st.sel = st.sel.includes(k) ? st.sel.filter(x => x !== k) : st.sel.concat(k); }
  store[i] = st; save(); redraw(i);
}
function check(i) {
  const st = store[i];
  if (!st || !st.sel.length) return;
  st.done = true;
  st.ok = st.sel.slice().sort().join() === QS[i][3].slice().sort().join();
  save(); redraw(i);
}
function updateScore() {
  const ids = visible();
  let done = 0, ok = 0;
  ids.forEach(i => { const s = store[i]; if (s && s.done) { done++; if (s.ok) ok++; } });
  const pct = done ? Math.round(ok * 100 / done) : 0;
  document.getElementById("score").innerHTML =
    "<b>" + done + "</b>/" + ids.length + " answered · <b>" + ok + "</b> correct" + (done ? " (" + pct + "%)" : "");
}
const PER_PAGE = 15;
let qpage = 0;
function renderQPager(box, pages) {
  box.innerHTML = "";
  if (pages <= 1) return;
  const mk = (label, to, cls) => { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (cls ? " " + cls : ""); b.textContent = label; b.disabled = to < 0 || to >= pages; b.addEventListener("click", () => { qpage = to; render(); document.getElementById("qlist").scrollIntoView({ block: "start" }); }); return b; };
  const info = document.createElement("span"); info.className = "score"; info.innerHTML = "Page <b>" + (qpage + 1) + "</b> of " + pages;
  box.append(mk("← Previous", qpage - 1), info, mk("Next →", qpage + 1, "primary"));
}
function render() {
  const list = document.getElementById("qlist");
  list.innerHTML = "";
  const ids = visible();
  const pages = Math.max(1, Math.ceil(ids.length / PER_PAGE));
  if (qpage >= pages) qpage = pages - 1;
  const frag = document.createDocumentFragment();
  ids.slice(qpage * PER_PAGE, (qpage + 1) * PER_PAGE).forEach((i, n) => frag.appendChild(card(i, qpage * PER_PAGE + n + 1)));
  list.appendChild(frag);
  renderQPager(document.getElementById("qpagerTop"), pages);
  renderQPager(document.getElementById("qpagerBot"), pages);
  updateScore();
}

document.getElementById("shuffle").addEventListener("click", e => {
  const b = e.currentTarget;
  if (b.dataset.on === "1") { order = QS.map((_, i) => i); b.dataset.on = "0"; b.textContent = "Shuffle"; }
  else {
    order = QS.map((_, i) => i);
    for (let j = order.length - 1; j > 0; j--) { const r = Math.floor(Math.random() * (j + 1)); [order[j], order[r]] = [order[r], order[j]]; }
    b.dataset.on = "1"; b.textContent = "Original order";
  }
  qpage = 0;
  render();
});
document.getElementById("reveal").addEventListener("click", e => {
  reveal = !reveal;
  e.currentTarget.setAttribute("aria-pressed", String(reveal));
  e.currentTarget.textContent = reveal ? "Hide answers" : "Show all answers";
  render();
});
let resetArmed = null;
document.getElementById("reset").addEventListener("click", e => {
  const b = e.currentTarget;
  if (!resetArmed) {
    b.textContent = "Tap again to clear";
    resetArmed = setTimeout(() => { resetArmed = null; b.textContent = "Reset this set"; }, 3000);
    return;
  }
  clearTimeout(resetArmed); resetArmed = null; b.textContent = "Reset this set";
  visible().forEach(i => delete store[i]);
  save(); render();
});

(function countdown() {
  const el = document.getElementById("countdown");
  const exam = new Date("2026-10-18T09:00:00+05:30").getTime();
  const days = daysToExam();
  if (days > 1) el.textContent = days + " days to go";
  else if (days === 1) el.textContent = "Tomorrow";
  else if (days === 0) el.textContent = "Today";
  else el.textContent = "Exam day has passed";
})();

buildChips();
render();

/* ---------- Light / dark toggle ---------- */
(function themeToggle() {
  const btns = [...document.querySelectorAll(".themebtn")];
  const root = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  function current() {
    const t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return mq && mq.matches ? "dark" : "light";
  }
  function paint() {
    const dark = current() === "dark";
    btns.forEach(btn => {
      btn.innerHTML = (dark ? SUN : MOON) + "<span>" + (dark ? "Light mode" : "Dark mode") + "</span>";
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    });
  }
  btns.forEach(btn => btn.addEventListener("click", () => {
    const next = current() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("ccprep-theme", next); } catch (e) {}
    paint();
    document.dispatchEvent(new Event("themechange"));
  }));
  if (mq && mq.addEventListener) mq.addEventListener("change", () => { paint(); document.dispatchEvent(new Event("themechange")); });
  paint();
})();

/* ---------- Shared helpers ---------- */
function loadJSON(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
function saveJSON(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function daysToExam() { const ist = new Date(Date.now() + 5.5 * 3600e3); return Math.round((Date.UTC(2026, 9, 18) - Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate())) / 86400000); }
const REDUCE = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
function same(a, b) { return a.slice().sort().join() === b.slice().sort().join(); }
function armButton(btn, label, armedLabel, action) {
  let t = null;
  btn.addEventListener("click", () => {
    if (!t) { btn.textContent = armedLabel; t = setTimeout(() => { t = null; btn.textContent = label; }, 3000); return; }
    clearTimeout(t); t = null; btn.textContent = label; action();
  });
}
function optionButton(k, text) {
  const b = el("button", "opt"); b.type = "button";
  b.append(el("span", "key", LET[k]), el("span", null, text));
  return b;
}
function whyBox(ans, label, text) {
  const why = el("p", "why");
  why.append(el("b", null, "Answer " + ans.map(a => LET[a]).join(", ")));
  if (label) why.append(el("b", null, label));
  why.append(document.createTextNode(text || ""));
  return why;
}

/* ---------- Most repeated (as MCQs) ---------- */
const REP_KEY = KEY + "-rep";
let repStore = loadJSON(REP_KEY, {});
let repReveal = false;

function repCard(i, rank) {
  const it = REP[i];
  const multi = it.k.length > 1;
  const st = repStore[i] || { sel: [], done: false };
  const show = st.done || repReveal;
  const c = el("article", "q"); c.id = "rep" + i; c.dataset.rank = rank;
  const meta = el("div", "q-meta");
  meta.append(el("span", "rkn", "#" + String(rank).padStart(2, "0")), el("span", null, it.w));
  const strip = el("span", "strip");
  RUNS.forEach(([code, label]) => { const s = el("span", it.r.includes(code) ? "on" : null, label); strip.appendChild(s); });
  meta.appendChild(strip);
  if (it.x) meta.appendChild(el("span", "xr", "Same wording"));
  meta.appendChild(el("span", null, multi ? "Select all that apply" : "One answer"));
  c.append(meta, el("p", "q-text", it.q));
  const ob = el("div", "opts");
  it.o.forEach((o, k) => {
    const b = optionButton(k, o);
    const picked = st.sel.includes(k);
    b.setAttribute("aria-pressed", String(picked && !show));
    if (show) { b.disabled = true; if (it.k.includes(k)) b.classList.add("correct"); else if (picked) b.classList.add("wrong"); }
    else b.addEventListener("click", () => repPick(i, k));
    ob.appendChild(b);
  });
  c.appendChild(ob);
  const foot = el("div", "q-foot");
  if (multi && !show) {
    const chk = el("button", "btn primary", "Check"); chk.type = "button"; chk.disabled = st.sel.length === 0;
    chk.addEventListener("click", () => repCheck(i));
    foot.appendChild(chk);
  }
  if (st.done) foot.appendChild(el("span", "verdict " + (st.ok ? "ok" : "no"), st.ok ? "Correct" : "Not quite"));
  if (foot.childNodes.length) c.appendChild(foot);
  if (show) c.appendChild(whyBox(it.k, "Key idea", it.e));
  return c;
}
function repRedraw(i) { const old = document.getElementById("rep" + i); if (old) old.replaceWith(repCard(i, Number(old.dataset.rank))); repScore(); }
function repPick(i, k) {
  const it = REP[i]; const st = repStore[i] || { sel: [], done: false };
  if (st.done) return;
  if (it.k.length === 1) { st.sel = [k]; st.done = true; st.ok = k === it.k[0]; }
  else st.sel = st.sel.includes(k) ? st.sel.filter(x => x !== k) : st.sel.concat(k);
  repStore[i] = st; saveJSON(REP_KEY, repStore); repRedraw(i);
}
function repCheck(i) {
  const st = repStore[i]; if (!st || !st.sel.length) return;
  st.done = true; st.ok = same(st.sel, REP[i].k);
  saveJSON(REP_KEY, repStore); repRedraw(i);
}
function repScore() {
  let done = 0, ok = 0;
  REP.forEach((_, i) => { const s = repStore[i]; if (s && s.done) { done++; if (s.ok) ok++; } });
  document.getElementById("repcount").innerHTML = "<b>" + done + "</b>/" + REP.length + " answered · <b>" + ok + "</b> correct" + (done ? " (" + Math.round(ok * 100 / done) + "%)" : "") + " · " + REP.filter(it => it.x).length + " same-wording repeats";
}
function renderRep() {
  const root = document.getElementById("replist");
  root.innerHTML = "";
  let rank = 0;
  [5, 4, 3, 2].forEach(n => {
    const ids = REP.map((_, i) => i).filter(i => REP[i].r.length === n);
    if (!ids.length) return;
    const g = el("div", "repgroup");
    g.appendChild(el("h3", null, n === 5 ? "Asked in all 5 runs" : "Asked in " + n + " runs"));
    const list = el("div", "qlist");
    ids.forEach(i => { rank++; list.appendChild(repCard(i, rank)); });
    g.appendChild(list);
    root.appendChild(g);
  });
  repScore();
}
document.getElementById("repreveal").addEventListener("click", e => {
  repReveal = !repReveal;
  e.currentTarget.setAttribute("aria-pressed", String(repReveal));
  e.currentTarget.textContent = repReveal ? "Hide answers" : "Show all answers";
  renderRep();
});
armButton(document.getElementById("represet"), "Reset answers", "Tap again to clear", () => { repStore = {}; saveJSON(REP_KEY, repStore); renderRep(); });
renderRep();

/* ---------- Mock exams ---------- */
const PAPERS = [
  { id: "p1", name: "Paper 1", src: "Your Jul–Oct 2026 assignments", note: "4 per week + 2 numericals" },
  { id: "p2", name: "Paper 2", src: "Past runs, set A (2019 – Jan 2026)", note: "4 per week + 2 prerequisite" },
  { id: "p3", name: "Paper 3", src: "Past runs, set B (2019 – Jan 2026)", note: "No overlap with set A" },
  { id: "p4", name: "Paper 4", src: "Past runs, set C (2019 – Jan 2026)", note: "No overlap with sets A or B" },
  { id: "rand", name: "Random paper", src: "New mix from all 361 questions", note: "Different every time" }
];
const MODES = { learn: "Practice mode", exam: "Exam mode" };
const EXAM_KEY = KEY + "-exam", BEST_KEY = KEY + "-best2";
let exam = loadJSON(EXAM_KEY, null);
if (exam) { exam.mode = exam.mode || "exam"; exam.lock = exam.lock || {}; exam.rev = exam.rev || {}; exam.flag = exam.flag || {}; }
let best = loadJSON(BEST_KEY, {});
let reviewAll = false;

function rng(seed) {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuf(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function buildPaper(id) {
  const mine = id === "p1", rand = id === "rand";
  const pool = QS.map((_, i) => i).filter(i => rand ? true : mine ? QS[i][6] === "y" : QS[i][6] !== "y");
  const slot = { p1: 0, p2: 0, p3: 1, p4: 2, rand: 0 }[id];
  const seed = rand ? (Date.now() & 0x7fffffff) : (mine ? 11 : 7);
  const r = rng(seed);
  let pick = [];
  for (let w = 1; w <= 12; w++) {
    const wk = shuf(pool.filter(i => QS[i][0] === w), r);
    pick = pick.concat(wk.slice(slot * 4, slot * 4 + 4));
  }
  const rest = pool.filter(i => !pick.includes(i));
  let extra;
  if (mine || rand) {
    extra = shuf(rest.filter(i => QS[i][5] === "num"), r).concat(shuf(rest.filter(i => QS[i][5] !== "num"), r)).slice(0, 50 - pick.length);
  } else {
    extra = shuf(pool.filter(i => QS[i][0] === 0), r).slice(slot * 2, slot * 2 + 2);
  }
  return shuf(pick.concat(extra), rng(seed + 101 + slot));
}

function fmt(sec) { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h + ":" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"); }
function remaining() { return exam ? exam.dur - (Date.now() - exam.start) / 1000 : 0; }
function paperName(id) { const p = PAPERS.find(p => p.id === id); return p ? p.name + " · " + p.src : id; }
function isRight(ex, pos) { return !(ex.rev && ex.rev[pos]) && same(ex.ans[pos] || [], QS[ex.ids[pos]][3]); }
function score(ex) {
  let correct = 0, revealed = 0;
  const byWeek = {};
  ex.ids.forEach((qi, pos) => {
    const ok = isRight(ex, pos);
    if (ok) correct++;
    if (ex.rev && ex.rev[pos]) revealed++;
    const w = QS[qi][0];
    byWeek[w] = byWeek[w] || [0, 0];
    byWeek[w][1]++; if (ok) byWeek[w][0]++;
  });
  const raw = Math.round(correct / ex.ids.length * 100);
  return { correct, revealed, raw, out75: raw * 0.75, pass: raw * 0.75 >= 30, byWeek };
}

function startExam(id, mode) {
  exam = { id, mode, ids: buildPaper(id), ans: {}, flag: {}, lock: {}, rev: {}, cur: 0, start: Date.now(), dur: 3 * 3600, done: false };
  saveJSON(EXAM_KEY, exam); renderMock(); focusQuestion();
}
function submitExam() {
  if (!exam || exam.done) return;
  exam.done = true; exam.end = Date.now();
  const s = score(exam);
  const key = exam.id + "|" + exam.mode;
  const prev = best[key];
  if (!prev || s.raw > prev.raw) { best[key] = { raw: s.raw, at: exam.end }; saveJSON(BEST_KEY, best); }
  saveJSON(EXAM_KEY, exam); reviewAll = false; renderMock(); window.scrollTo({ top: 0, behavior: "instant" });
  if (s.pass && window.confetti && !REDUCE) {
    const cs = getComputedStyle(document.documentElement);
    const colors = ["--accent", "--ok", "--hi"].map(v => cs.getPropertyValue(v).trim()).filter(Boolean);
    setTimeout(() => window.confetti({ particleCount: 140, spread: 80, startVelocity: 42, origin: { y: 0.3 }, colors }), 250);
  }
}
function persist() { saveJSON(EXAM_KEY, exam); renderMock(); }
// After moving to another question, bring its card into view below the sticky bars (matters on phones).
function focusQuestion() {
  const go = () => {
    const c = document.querySelector("#mockroot .q"); if (!c) return;
    const bar = document.querySelector(".exambar");
    const off = (document.querySelector(".topbar") || { offsetHeight: 0 }).offsetHeight + (bar ? bar.offsetHeight : 0) + 12;
    const top = c.getBoundingClientRect().top;
    if (top < off || top > window.innerHeight * 0.5) window.scrollTo({ top: Math.max(0, window.scrollY + top - off), behavior: "instant" });
  };
  go();
  requestAnimationFrame(go); // once more after the sticky bar settles into place
}

function renderMock() {
  const root = document.getElementById("mockroot");
  root.innerHTML = "";
  if (!exam) root.appendChild(renderPapers());
  else if (!exam.done) root.appendChild(renderExam());
  else root.appendChild(renderResult());
}

function renderPapers() {
  const wrap = el("div", "papers");
  PAPERS.forEach(p => {
    const c = el("div", "paper");
    c.append(el("p", "eyebrow", p.name), el("h3", null, p.src), el("p", "src", "50 questions · 3 hours · " + p.note));
    ["learn", "exam"].forEach(m => {
      const b = best[p.id + "|" + m];
      const bl = el("p", "best");
      bl.append(document.createTextNode(MODES[m] + ": "));
      if (b) bl.append(el("b", null, "best " + b.raw + "/100"), document.createTextNode(" (" + (b.raw * 0.75).toFixed(1) + "/75)"));
      else bl.append(document.createTextNode("not attempted"));
      c.appendChild(bl);
    });
    const row = el("div", "startrow");
    const learn = el("button", "btn primary", "Practice mode"); learn.type = "button";
    learn.addEventListener("click", () => startExam(p.id, "learn"));
    const ex = el("button", "btn", "Exam mode"); ex.type = "button";
    ex.addEventListener("click", () => startExam(p.id, "exam"));
    row.append(learn, ex);
    c.appendChild(row);
    wrap.appendChild(c);
  });
  return wrap;
}

function renderExam() {
  const learn = exam.mode === "learn";
  const N = exam.ids.length;
  const box = el("div", "result");
  const bar = el("div", "exambar");
  const who = el("span", "who name", paperName(exam.id) + " · " + MODES[exam.mode]);
  const timer = el("span", "timer"); timer.id = "timer"; timer.textContent = fmt(remaining());
  let progText;
  if (learn) {
    const checked = Object.keys(exam.lock).filter(k => exam.lock[k]).length;
    const right = Object.keys(exam.lock).filter(k => exam.lock[k] && isRight(exam, Number(k))).length;
    progText = checked + "/" + N + " checked · " + right + " right";
  } else {
    progText = Object.keys(exam.ans).filter(k => exam.ans[k].length).length + "/" + N + " answered";
  }
  const prog = el("span", "who", progText);
  const sub = el("button", "btn primary", "Finish & see score"); sub.type = "button";
  armButton(sub, "Finish & see score", "Tap again to finish", submitExam);
  bar.append(who, timer, prog, sub);

  const grid = el("div", "exam-grid");
  const pos = exam.cur, qi = exam.ids[pos];
  const [w, text, opts, ans, expl] = QS[qi];
  const multi = ans.length > 1;
  const sel = exam.ans[pos] || [];
  const locked = learn && !!exam.lock[pos];
  const revealed = !!exam.rev[pos];
  const card = el("article", "q");
  const meta = el("div", "q-meta");
  meta.append(el("span", null, "Question " + (pos + 1) + " of " + N), el("span", null, w === 0 ? "Prerequisite" : "Week " + w), el("span", null, multi ? "Select all that apply" : "One answer"));
  if (exam.flag[pos]) meta.appendChild(el("span", "k", "Marked for review"));
  card.append(meta, el("p", "q-text", text));
  const ob = el("div", "opts");
  opts.forEach((o, k) => {
    const b = optionButton(k, o);
    if (locked) {
      b.disabled = true;
      if (ans.includes(k)) b.classList.add("correct"); else if (sel.includes(k)) b.classList.add("wrong");
    } else {
      b.setAttribute("aria-pressed", String(sel.includes(k)));
      b.addEventListener("click", () => {
        let s = exam.ans[pos] || [];
        if (multi) s = s.includes(k) ? s.filter(x => x !== k) : s.concat(k);
        else s = learn ? [k] : (s.includes(k) ? [] : [k]);
        exam.ans[pos] = s;
        if (learn && !multi) exam.lock[pos] = true;
        persist();
      });
    }
    ob.appendChild(b);
  });
  card.appendChild(ob);

  if (learn) {
    const foot = el("div", "q-foot");
    if (!locked) {
      if (multi) {
        const chk = el("button", "btn primary", "Check"); chk.type = "button"; chk.disabled = sel.length === 0;
        chk.addEventListener("click", () => { exam.lock[pos] = true; persist(); });
        foot.appendChild(chk);
      }
      const rv = el("button", "btn", "Reveal answer"); rv.type = "button";
      rv.addEventListener("click", () => { exam.rev[pos] = true; exam.lock[pos] = true; persist(); });
      foot.appendChild(rv);
    } else {
      const ok = isRight(exam, pos);
      foot.appendChild(el("span", "verdict " + (revealed ? "rev" : ok ? "ok" : "no"), revealed ? "Revealed (counts as wrong)" : ok ? "Correct" : "Not quite"));
    }
    card.appendChild(foot);
    if (locked) card.appendChild(whyBox(ans, null, expl));
  }

  const nav = el("div", "navbtns");
  const left = el("div"), rgt = el("div");
  const prev = el("button", "btn", "← Previous"); prev.type = "button"; prev.disabled = pos === 0;
  prev.addEventListener("click", () => { exam.cur--; persist(); focusQuestion(); });
  const flag = el("button", "btn", exam.flag[pos] ? "Unmark" : "Mark for review"); flag.type = "button";
  flag.addEventListener("click", () => { exam.flag[pos] = !exam.flag[pos]; persist(); });
  left.append(prev, flag);
  if (!locked) {
    const clr = el("button", "btn", "Clear"); clr.type = "button";
    clr.addEventListener("click", () => { delete exam.ans[pos]; persist(); });
    left.appendChild(clr);
  }
  const next = el("button", "btn primary", "Next →"); next.type = "button"; next.disabled = pos === N - 1;
  next.addEventListener("click", () => { exam.cur++; persist(); focusQuestion(); });
  rgt.append(next); nav.append(left, rgt);
  card.appendChild(nav);

  const side = el("div", "side");
  side.appendChild(el("p", "eyebrow", "Questions"));
  const pal = el("div", "palette");
  exam.ids.forEach((_, i) => {
    const b = el("button", "pal", String(i + 1)); b.type = "button";
    if (learn && exam.lock[i]) b.classList.add(exam.rev[i] ? "rev" : isRight(exam, i) ? "ok" : "no");
    else if ((exam.ans[i] || []).length) b.classList.add("ans");
    if (exam.flag[i]) b.classList.add("flag");
    if (i === pos) { b.classList.add("cur"); b.setAttribute("aria-current", "true"); }
    b.addEventListener("click", () => { exam.cur = i; persist(); focusQuestion(); });
    pal.appendChild(b);
  });
  const lg = el("p", "legend");
  const items = learn ? ["Green = right", "Red = wrong", "Amber = revealed", "Blue = picked, not checked", "Outline = current"] : ["Blue = answered", "Amber underline = marked", "Outline = current"];
  items.forEach(t => lg.appendChild(el("span", null, t)));
  const quit = el("button", "btn", "Quit paper"); quit.type = "button";
  armButton(quit, "Quit paper", "Tap again to discard", () => { exam = null; saveJSON(EXAM_KEY, null); renderMock(); });
  side.append(pal, lg, quit);
  grid.append(card, side);
  box.append(bar, grid);
  return box;
}

function renderResult() {
  const s = score(exam);
  const box = el("div", "result");
  box.appendChild(el("p", "eyebrow", paperName(exam.id) + " · " + MODES[exam.mode] + " · finished"));
  const tiles = el("div", "tiles");
  const t = (v, l) => { const d = el("div", "tile"); d.append(el("span", "l", l), el("span", "v", v)); return d; };
  const used = Math.min(exam.dur, ((exam.end || Date.now()) - exam.start) / 1000);
  tiles.append(t(s.raw + "/100", "Final score"), t(s.out75.toFixed(1) + "/75", "Exam component"), t(s.correct + "/" + exam.ids.length, "Correct"), t(fmt(used), "Time used"));
  if (s.revealed) tiles.appendChild(t(String(s.revealed), "Answers revealed"));
  const verdict = el("p");
  verdict.append(el("span", "pill " + (s.pass ? "ok" : "no"), s.pass ? "Above the pass line" : "Below the pass line"),
    document.createTextNode(s.pass ? "  You need ≥ 30/75 in the exam; you have " + s.out75.toFixed(1) + "." : "  You need ≥ 30/75 (40/100 raw). Review the misses below and retake."));

  const wk = el("div", "tbl");
  const tb = document.createElement("table");
  tb.innerHTML = "<thead><tr><th>Week</th><th>Correct</th><th>Accuracy</th></tr></thead>";
  const body = document.createElement("tbody");
  Object.keys(s.byWeek).map(Number).sort((a, b) => a - b).forEach(w => {
    const [c, n] = s.byWeek[w];
    const tr = document.createElement("tr");
    [w === 0 ? "W0 prereq" : "W" + w, c + "/" + n, Math.round(c / n * 100) + "%"].forEach(v => tr.appendChild(el("td", null, v)));
    body.appendChild(tr);
  });
  tb.appendChild(body); wk.appendChild(tb);

  const acts = el("div", "navbtns");
  const a1 = el("div");
  const again = el("button", "btn primary", "Retake this paper"); again.type = "button";
  again.addEventListener("click", () => startExam(exam.id, exam.mode));
  const back = el("button", "btn", "Back to papers"); back.type = "button";
  back.addEventListener("click", () => { exam = null; saveJSON(EXAM_KEY, null); renderMock(); });
  const tog = el("button", "btn", reviewAll ? "Show only mistakes" : "Show all questions"); tog.type = "button";
  tog.addEventListener("click", () => { reviewAll = !reviewAll; renderMock(); });
  a1.append(again, back); acts.append(a1, tog);

  const list = el("div", "qlist");
  exam.ids.forEach((qi, pos) => {
    const [w, text, opts, ans, expl] = QS[qi];
    const mineSel = exam.ans[pos] || [];
    const ok = isRight(exam, pos);
    if (ok && !reviewAll) return;
    const c = el("article", "q");
    const meta = el("div", "q-meta");
    meta.append(el("span", null, "Q" + (pos + 1)), el("span", null, w === 0 ? "Prerequisite" : "Week " + w));
    const label = exam.rev[pos] ? "Revealed" : ok ? "Correct" : (mineSel.length ? "Wrong" : "Not answered");
    meta.appendChild(el("span", "verdict " + (exam.rev[pos] ? "rev" : ok ? "ok" : "no"), label));
    c.append(meta, el("p", "q-text", text));
    const ob = el("div", "opts");
    opts.forEach((o, k) => {
      const b = optionButton(k, o); b.disabled = true;
      if (ans.includes(k)) b.classList.add("correct"); else if (mineSel.includes(k)) b.classList.add("wrong");
      ob.appendChild(b);
    });
    c.append(ob, whyBox(ans, null, expl));
    list.appendChild(c);
  });
  if (!list.childNodes.length) list.appendChild(el("p", "callout", "No mistakes on this paper."));
  box.append(tiles, verdict, wk, acts, list);
  return box;
}

/* ---------- Phone helpers ---------- */
(function phoneHelpers() {
  const nav = document.querySelector(".topbar");
  const setNavH = () => document.documentElement.style.setProperty("--navh", nav.offsetHeight + "px");
  setNavH();
  window.addEventListener("resize", setNavH);
  const up = document.getElementById("totop");
  const onScroll = () => up.classList.toggle("show", window.scrollY > 900 && !(exam && !exam.done));
  window.addEventListener("scroll", onScroll, { passive: true });
  up.addEventListener("click", () => window.scrollTo({ top: 0 }));
  onScroll();
})();

setInterval(() => {
  if (!exam || exam.done) return;
  const r = remaining();
  const tEl = document.getElementById("timer");
  if (tEl) { tEl.textContent = fmt(r); tEl.classList.toggle("low", r < 600); }
  if (r <= 0) submitExam();
}, 1000);
renderMock();

/* ---------- Pages & routing ---------- */
const PAGE_ORDER = ["home", "notes", "videos", "map", "formulas", "repeated", "practice", "mock", "traps", "resources"];
const PAGE_NAMES = { home: "Home", notes: "Week notes", videos: "Videos", map: "Course map", formulas: "Numericals", repeated: "Most repeated", practice: "Practice", mock: "Mock exams", traps: "Last-minute traps", resources: "Videos & sources" };
const ALIAS = { plan: ["home", "plan"], lectures: ["resources", "videos-block"], sources: ["resources", "sources-block"], poster: ["map", null] };
const WEEKS_KEY = KEY + "-weeks", CURWEEK_KEY = KEY + "-curweek";
let reviewed = loadJSON(WEEKS_KEY, {});
let curWeek = loadJSON(CURWEEK_KEY, "w1");
const WEEK_IDS = [...document.querySelectorAll("#notes .week")].map(a => a.id);
if (!WEEK_IDS.includes(curWeek)) curWeek = "w1";

function paintWeekNav() {
  document.querySelectorAll("#notes .weeknav a").forEach(a => {
    const id = a.getAttribute("href").slice(1);
    const on = id === curWeek;
    a.classList.toggle("on", on);
    a.classList.toggle("done", !!reviewed[id]);
    if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
  });
}
function showWeek(id) {
  const changed = id !== curWeek;
  curWeek = id; saveJSON(CURWEEK_KEY, id);
  document.querySelectorAll("#notes .week").forEach(a => {
    const on = a.id === id;
    a.hidden = !on;
    if (on && changed) { a.classList.remove("enter"); void a.offsetWidth; a.classList.add("enter"); }
  });
  paintWeekNav();
}
function buildWeekFooters() {
  WEEK_IDS.forEach((id, i) => {
    const body = document.querySelector("#" + id + " .body");
    if (!body || body.querySelector(".weekfoot")) return;
    const foot = el("div", "weekfoot");
    const rv = el("button", "btn reviewbtn"); rv.type = "button";
    const paint = () => { const on = !!reviewed[id]; rv.textContent = on ? "✓ Week reviewed" : "Mark week as reviewed"; rv.setAttribute("aria-pressed", String(on)); };
    rv.addEventListener("click", () => { reviewed[id] = !reviewed[id]; saveJSON(WEEKS_KEY, reviewed); paint(); paintWeekNav(); });
    paint();
    const nav = el("div", "wkpager");
    if (i > 0) { const p = el("a", "btn", "← Week " + WEEK_IDS[i - 1].slice(1)); p.href = "#" + WEEK_IDS[i - 1]; nav.appendChild(p); }
    const nx = el("a", "btn primary", i < WEEK_IDS.length - 1 ? "Week " + WEEK_IDS[i + 1].slice(1) + " →" : "Course map →");
    nx.href = i < WEEK_IDS.length - 1 ? "#" + WEEK_IDS[i + 1] : "#map";
    nav.appendChild(nx);
    foot.append(rv, nav);
    body.appendChild(foot);
  });
}

function renderHome() {
  const box = document.getElementById("stats"); if (!box) return;
  const done = Object.keys(store).filter(k => store[k] && store[k].done);
  const ok = done.filter(k => store[k].ok).length;
  const rdone = Object.keys(repStore).filter(k => repStore[k] && repStore[k].done);
  const rok = rdone.filter(k => repStore[k].ok).length;
  const bestRaw = Object.values(best).reduce((m, b) => Math.max(m, b && typeof b.raw === "number" ? b.raw : -1), -1);
  const wk = WEEK_IDS.filter(id => reviewed[id]).length;
  const nextWeek = WEEK_IDS.find(id => !reviewed[id]);
  const cards = [
    { icon: "calendar-check", href: "#" + (nextWeek || curWeek), label: "Weeks reviewed", v: wk + "/12", sub: nextWeek ? "next up: week " + nextWeek.slice(1) : "all 12 done", pct: wk / 12 },
    { icon: "list-checks", href: "#practice", label: "Practice", v: done.length + "/" + QS.length, sub: done.length ? Math.round(ok * 100 / done.length) + "% correct so far" : "not started yet", pct: done.length / QS.length },
    { icon: "repeat", href: "#repeated", label: "Most repeated", v: rdone.length + "/" + REP.length, sub: rdone.length ? Math.round(rok * 100 / rdone.length) + "% correct so far" : "not started yet", pct: rdone.length / REP.length },
    { icon: "timer", href: "#mock", label: "Best mock score", v: bestRaw >= 0 ? bestRaw + "/100" : "—", sub: bestRaw >= 0 ? (bestRaw >= 40 ? "above the 40/100 pass line" : "pass line is 40/100") : "no paper finished yet", pct: Math.max(0, bestRaw) / 100, good: bestRaw >= 40 }
  ];
  box.innerHTML = "";
  const C = 2 * Math.PI * 26, fills = [];
  cards.forEach(c => {
    const a = el("a", "stat" + (c.good ? " good" : "")); a.href = c.href;
    const ring = el("span", "ring");
    ring.innerHTML = '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="rt" cx="32" cy="32" r="26"/><circle class="rf" cx="32" cy="32" r="26" stroke-dasharray="' + C.toFixed(2) + '" stroke-dashoffset="' + C.toFixed(2) + '"/></svg><i data-lucide="' + c.icon + '"></i>';
    const tx = el("span", "sx");
    tx.append(el("span", "l", c.label), el("span", "v", c.v), el("span", "s", c.sub));
    a.append(ring, tx); box.appendChild(a);
    fills.push([ring.querySelector(".rf"), Math.min(1, c.pct)]);
  });
  window.ccIcons && window.ccIcons();
  requestAnimationFrame(() => requestAnimationFrame(() => fills.forEach(([f, p]) => { f.style.strokeDashoffset = (C * (1 - p)).toFixed(2); })));
  const ist = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const dayIdx = ["2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18"].indexOf(ist);
  const dayCards = [...document.querySelectorAll("#home .days .day")];
  dayCards.forEach((d, i) => {
    d.classList.toggle("today", i === dayIdx);
    const w = d.querySelector(".when"); let badge = w.querySelector(".todaybadge");
    if (i === dayIdx && !badge) w.appendChild(el("span", "todaybadge", "Today"));
    if (i !== dayIdx && badge) badge.remove();
  });
  const tf = document.getElementById("todayFocus");
  if (tf) {
    tf.hidden = dayIdx < 0;
    if (dayIdx >= 0) { tf.innerHTML = ""; tf.append(el("span", "tf-l", "Today"), el("span", "tf-v", dayCards[dayIdx].querySelector("h3").textContent + " — see the plan")); }
  }
  const cta = document.getElementById("cta-notes");
  if (cta) {
    const target = nextWeek || curWeek;
    cta.href = "#" + target;
    cta.textContent = wk === 0 && curWeek === "w1" ? "Start week notes" : "Continue: week " + target.slice(1);
  }
  const days = daysToExam();
  const n = document.getElementById("cdnum"), l = document.getElementById("cdlabel");
  if (n && l) {
    if (days > 1) { n.textContent = days; l.textContent = "days to the exam"; }
    else if (days === 1) { n.textContent = "1"; l.textContent = "day to the exam"; }
    else if (days === 0) { n.textContent = "0"; l.textContent = "exam is today"; }
    else { n.textContent = "✓"; l.textContent = "exam day has passed"; }
  }
}

function renderPager(page) {
  const nav = document.getElementById("pager"); if (!nav) return;
  nav.innerHTML = "";
  const i = PAGE_ORDER.indexOf(page);
  if (i > 0) {
    const p = el("a", "pg prev"); p.href = "#" + PAGE_ORDER[i - 1];
    p.append(el("span", "l", "Previous"), el("span", "n", "← " + PAGE_NAMES[PAGE_ORDER[i - 1]]));
    nav.appendChild(p);
  }
  if (i < PAGE_ORDER.length - 1) {
    const n = el("a", "pg next"); n.href = "#" + PAGE_ORDER[i + 1];
    n.append(el("span", "l", "Next"), el("span", "n", PAGE_NAMES[PAGE_ORDER[i + 1]] + " →"));
    nav.appendChild(n);
  }
}

let currentPage = null;
function hashNow() { try { return decodeURIComponent((location.hash || "").slice(1)); } catch (e) { return ""; } }
function isRoute(h) { return PAGE_ORDER.includes(h) || !!ALIAS[h] || /^[wv]([1-9]|1[0-2])$/.test(h); }
// Page switches never depend on the URL changing (some embedded viewers ignore hash changes);
// the URL is updated when the browser allows it, so links and the back button still work.
function go(h) {
  route(h);
  try { if (hashNow() !== h) history.pushState({ h }, "", "#" + h); } catch (e) {}
}
document.addEventListener("click", e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const h = a.getAttribute("href").slice(1);
  if (!isRoute(h)) return;
  e.preventDefault();
  go(h);
});
const MORE_PAGES = ["map", "formulas", "repeated", "traps", "resources"];
function openSheet() { const s = document.getElementById("moreSheet"); if (!s) return; s.hidden = false; document.getElementById("moreBtn").setAttribute("aria-expanded", "true"); }
function closeSheet() { const s = document.getElementById("moreSheet"); if (!s || s.hidden) return; s.hidden = true; document.getElementById("moreBtn").setAttribute("aria-expanded", "false"); }
document.getElementById("moreBtn").addEventListener("click", () => { document.getElementById("moreSheet").hidden ? openSheet() : closeSheet(); });
document.getElementById("moreSheet").addEventListener("click", e => { if (e.target.id === "moreSheet") closeSheet(); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeSheet(); });

function updateCountdowns() {
  const days = daysToExam();
  const set = (nId, lId) => {
    const n = document.getElementById(nId), l = document.getElementById(lId); if (!n || !l) return;
    if (days > 1) { n.textContent = days; l.textContent = "days to the exam"; }
    else if (days === 1) { n.textContent = "1"; l.textContent = "day to the exam"; }
    else if (days === 0) { n.textContent = "0"; l.textContent = "exam is today"; }
    else { n.textContent = "✓"; l.textContent = "exam day has passed"; }
  };
  set("cdnum", "cdlabel"); set("sidecd", "sidecdl");
}

// Animated cloud ← fog ← edge network behind the home heading: data packets travel upward.
const heroNet = (function () {
  const cv = document.querySelector(".hero-net");
  if (!cv || !cv.getContext) return () => {};
  const ctx = cv.getContext("2d");
  let raf = 0, running = false, nodes = [], links = [], packets = [], W = 0, H = 0, col = "#0b6a87", muted = "#51626c";
  const readColor = () => { const cs = getComputedStyle(document.documentElement); col = cs.getPropertyValue("--accent").trim() || col; muted = cs.getPropertyValue("--muted").trim() || muted; };
  function layout() {
    const r = cv.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // keep the network in the right-hand column, clear of the heading and intro text
    const hm = document.querySelector(".hero-main"), cr = cv.getBoundingClientRect();
    const x0 = hm ? hm.getBoundingClientRect().right - cr.left + 28 : W * 0.6, x1 = W - 20;
    nodes = []; links = []; packets = [];
    if (W < 760 || x1 - x0 < 140) return;
    const tier = (n, y, rad) => Array.from({ length: n }, (_, i) => ({ x: x0 + (x1 - x0) * (n === 1 ? 0.5 : i / (n - 1)), y, r: rad }));
    const c = tier(3, H * 0.14, 5), f = tier(4, H * 0.5, 3.6), e = tier(7, H * 0.86, 2.6);
    nodes = [...c, ...f, ...e];
    e.forEach((n, i) => links.push([n, f[Math.min(3, Math.floor(i / 2))]]));
    f.forEach((n, i) => links.push([n, c[Math.min(2, Math.round(i * 2 / 3))]]));
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1;
    ctx.globalAlpha = 0.22; links.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); });
    ctx.globalAlpha = 0.55; nodes.forEach(n => { ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill(); });
    if (running && links.length && packets.length < 16 && Math.random() < 0.09) packets.push({ l: links[Math.floor(Math.random() * links.length)], p: 0, s: 0.004 + Math.random() * 0.006 });
    ctx.globalAlpha = 0.9;
    packets = packets.filter(k => { k.p += k.s; if (k.p >= 1) return false; const [a, b] = k.l; ctx.beginPath(); ctx.arc(a.x + (b.x - a.x) * k.p, a.y + (b.y - a.y) * k.p, 2.2, 0, Math.PI * 2); ctx.fill(); return true; });
    ctx.globalAlpha = 1;
    if (running) raf = requestAnimationFrame(frame);
  }
  function start() { readColor(); layout(); if (REDUCE || !links.length) { stop(); frame(); return; } if (!running) { running = true; raf = requestAnimationFrame(frame); } }
  function stop() { running = false; cancelAnimationFrame(raf); }
  window.addEventListener("resize", () => { if (currentPage === "home") start(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (currentPage === "home") start(); });
  document.addEventListener("themechange", () => { readColor(); if (!running) frame(); });
  return on => (on ? start() : stop());
})();

function route(hIn) {
  const h = hIn == null ? hashNow() : hIn;
  let page = h || "home", target = null, week = null;
  if (/^w([1-9]|1[0-2])$/.test(h)) { page = "notes"; week = h; }
  else if (/^v([1-9]|1[0-2])$/.test(h)) { page = "videos"; target = "vid-" + h.slice(1); }
  else if (ALIAS[h]) { [page, target] = ALIAS[h]; }
  if (!PAGE_ORDER.includes(page)) page = "home";
  const pageChanged = currentPage !== page;
  const useVT = pageChanged && currentPage !== null && !!document.startViewTransition && !REDUCE && document.visibilityState === "visible";
  let applied = false;
  const apply = () => {
    if (applied) return; applied = true;
    if (page === "notes") showWeek(week || curWeek);
    document.querySelectorAll("main > section.page").forEach(s => {
      const on = s.id === page;
      s.hidden = !on;
      if (on && pageChanged && !useVT) { s.classList.remove("enter"); void s.offsetWidth; s.classList.add("enter"); }
    });
    document.querySelectorAll("[data-page]").forEach(a => {
      const on = a.dataset.page === page;
      a.classList.toggle("on", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    const mb = document.getElementById("moreBtn"); if (mb) mb.classList.toggle("on", MORE_PAGES.includes(page));
    const tt = document.getElementById("topTitle"); if (tt) tt.textContent = PAGE_NAMES[page];
    closeSheet();
    renderPager(page);
    currentPage = page;
    if (page === "home") renderHome();
    if (page === "videos") focusVideo(target);
    heroNet(page === "home");
    document.title = (page === "home" ? "" : PAGE_NAMES[page] + " · ") + "NPTEL Cloud Computing Prep";
    const t = target ? document.getElementById(target) : null;
    if (t) t.scrollIntoView(); else window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (useVT) {
    // never let the animation hold up navigation: if it hasn't run shortly, switch pages directly
    try { const vt = document.startViewTransition(apply); setTimeout(() => { if (!applied) { try { vt.skipTransition(); } catch (e) {} apply(); } }, 400); }
    catch (e) { apply(); }
  } else apply();
}
updateCountdowns();
/* ---------- Videos ---------- */
// One entry per week; set src/poster/dur when a week's video is published.
const VIDEO_LIST = [
  { w: 1, title: "Introduction to cloud computing", src: "videos/week-01.mp4", poster: "videos/week-01.jpg", dur: "4:38" },
  { w: 2, title: "Architecture, virtualization, XML & web services", src: "videos/week-02.mp4", poster: "videos/week-02.jpg", dur: "6:49" },
  { w: 3, title: "SLA, cloud economics, data, MapReduce & OpenStack", src: "videos/week-03.mp4", poster: "videos/week-03.jpg", dur: "6:17" },
  { w: 4, title: "OpenStack demo, Microsoft Azure & Google Cloud", src: "videos/week-04.mp4", poster: "videos/week-04.jpg", dur: "4:39" },
  { w: 5, title: "Numericals tutorials & resource management", src: "videos/week-05.mp4", poster: "videos/week-05.jpg", dur: "4:45" },
  { w: 6, title: "Cloud security", src: "videos/week-06.mp4", poster: "videos/week-06.jpg", dur: "4:33" },
  { w: 7, title: "Mobile cloud, fog computing & geospatial cloud", src: "videos/week-07.mp4", poster: "videos/week-07.jpg", dur: "3:45" },
  { w: 8, title: "Docker, green cloud, sensor & IoT cloud", src: "videos/week-08.mp4", poster: "videos/week-08.jpg", dur: "3:48" },
  { w: 9, title: "Cloud–fog–edge & cloud federation", src: "videos/week-09.mp4", poster: "videos/week-09.jpg", dur: "3:38" },
  { w: 10, title: "VM migration, containers & Kubernetes", src: "videos/week-10.mp4", poster: "videos/week-10.jpg", dur: "3:53" },
  { w: 11, title: "Dew, serverless & sustainable cloud", src: "videos/week-11.mp4", poster: "videos/week-11.jpg", dur: "3:02" },
  { w: 12, title: "5G, CPS, spatial cloud & health IoT", src: "videos/week-12.mp4", poster: "videos/week-12.jpg", dur: "3:15" }
];
const VSPEED_KEY = KEY + "-vspeed";
let vspeed = loadJSON(VSPEED_KEY, 1);
function allVideos() { return [...document.querySelectorAll("#vgrid video")]; }
function paintSpeed() {
  const box = document.getElementById("vspeed"); box.innerHTML = "";
  [1, 1.25, 1.5, 1.75].forEach(s => {
    const b = el("button", "chip", s + "×"); b.type = "button"; b.setAttribute("aria-pressed", String(s === vspeed));
    b.addEventListener("click", () => { vspeed = s; saveJSON(VSPEED_KEY, s); allVideos().forEach(v => { v.playbackRate = s; }); paintSpeed(); });
    box.appendChild(b);
  });
}
function renderVideos() {
  const grid = document.getElementById("vgrid"); grid.innerHTML = "";
  VIDEO_LIST.forEach(it => {
    const c = el("article", "vcard"); c.id = "vid-" + it.w;
    const head = el("div", "vhead");
    const txt = el("div"); txt.append(el("h3", null, it.title), el("p", "vmeta", it.src ? it.dur + " · Hinglish" : "coming soon"));
    const notes = el("a", "btn", "Notes"); notes.href = "#w" + it.w;
    head.append(el("span", "vnum", "W" + it.w), txt, notes);
    c.appendChild(head);
    if (it.src) {
      const v = document.createElement("video");
      v.controls = true; v.preload = "none"; v.playsInline = true; v.src = it.src; if (it.poster) v.poster = it.poster;
      v.addEventListener("play", () => { v.playbackRate = vspeed; allVideos().forEach(o => { if (o !== v) o.pause(); }); });
      v.addEventListener("ratechange", () => { if ([1, 1.25, 1.5, 1.75].includes(v.playbackRate) && v.playbackRate !== vspeed) { vspeed = v.playbackRate; saveJSON(VSPEED_KEY, vspeed); paintSpeed(); } });
      c.appendChild(v);
      if (it.alt) {
        const alt = el("div", "valt");
        const mk = (label, src, dur) => { const b = el("button", "chip", label); b.type = "button"; b.setAttribute("aria-pressed", String(v.getAttribute("src") === src));
          b.addEventListener("click", () => { v.pause(); v.src = src; txt.querySelector(".vmeta").textContent = dur + " · " + label; alt.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); }); return b; };
        alt.append(mk("Hinglish", it.src, it.dur), mk(it.alt.label, it.alt.src, it.alt.dur));
        c.appendChild(alt);
      }
    } else {
      const s = el("div", "vsoon"); s.innerHTML = '<i data-lucide="clock"></i><span>Being made · check back soon</span>'; c.appendChild(s);
    }
    grid.appendChild(c);
  });
  const n = VIDEO_LIST.filter(x => x.src).length;
  document.getElementById("vcount").textContent = n + " of 12 weeks published";
  paintSpeed();
  window.ccIcons && window.ccIcons();
}
function focusVideo(target) {
  document.querySelectorAll(".vcard.focus").forEach(x => x.classList.remove("focus"));
  const t = target && document.getElementById(target); if (t) t.classList.add("focus");
}
function addWatchButtons() {
  VIDEO_LIST.filter(it => it.src).forEach(it => {
    const body = document.querySelector("#w" + it.w + " .body"); if (!body || body.querySelector(".watchbtn")) return;
    const a = el("a", "btn primary watchbtn"); a.href = "#v" + it.w;
    a.innerHTML = '<i data-lucide="circle-play"></i><span></span>'; a.querySelector("span").textContent = "Watch the Week " + it.w + " video (" + it.dur + ")";
    const h3 = body.querySelector("h3"); h3.insertAdjacentElement("afterend", a);
  });
}
renderVideos();
addWatchButtons();

buildWeekFooters();
window.addEventListener("hashchange", () => route());
window.addEventListener("popstate", () => route());
route();
window.ccIcons && window.ccIcons();
