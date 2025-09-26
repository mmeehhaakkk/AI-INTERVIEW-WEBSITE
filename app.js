// Minimal, framework-free logic shared by both pages.
// Data schema (localStorage):
//   ai_profile -> {name,email,phone}
//   ai_interview_state -> persisted running interview (for resume/pause)
//   ai_candidates -> [{ id, name, email, phone, total, avg, summary, qa[], createdAt }]

const AI = (() => {
  // ===== Utilities
  const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  const PHONE_RE = /(\+?\d[\d -]{8,}\d)/;
  const get = (k, d = null) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  };
  const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const rid = () => Math.random().toString(36).slice(2, 10);

  const difficultyTime = { easy: 20, medium: 60, hard: 120 };
  const bank = [
    {
      difficulty: "easy",
      prompt: "What is React reconciliation and why is it useful?",
    },
    {
      difficulty: "easy",
      prompt: "How do you lift state up in React? Give a tiny example.",
    },
    {
      difficulty: "medium",
      prompt: "Explain closures and one useful case in React hooks.",
    },
    {
      difficulty: "medium",
      prompt: "Node.js event loop phases—how does it affect API design?",
    },
    { difficulty: "hard", prompt: "Design a rate limiter for an Express API." },
    {
      difficulty: "hard",
      prompt: "Optimize a React list of 50k items: approaches & tradeoffs.",
    },
  ];

  // ===== Profile
  function validateEmail(v) {
    return EMAIL_RE.test((v || "").trim());
  }
  function validatePhone(v) {
    return PHONE_RE.test((v || "").trim());
  }
  function loadProfile() {
    return get("ai_profile");
  }
  function saveProfile(p) {
    if (
      !p ||
      !p.name?.trim() ||
      !validateEmail(p.email) ||
      !validatePhone(p.phone)
    )
      return false;
    set("ai_profile", {
      name: p.name.trim(),
      email: p.email.trim(),
      phone: p.phone.trim(),
    });
    return true;
  }
  function extractFields(text) {
    const lines = (text || "")
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
    const email = (text.match(EMAIL_RE) || [])[0] || "";
    const phone = (text.match(PHONE_RE) || [])[0] || "";
    const firstLine = (
      lines.find((l) => l !== email && l !== phone) || ""
    ).slice(0, 80);
    return { name: firstLine, email, phone };
  }

  // ===== Interview (stateful)
  let tickRef = null;
  function hasUnfinishedInterview() {
    const st = get("ai_interview_state");
    return !!(st && !st.finished);
  }
  function discardInterview() {
    localStorage.removeItem("ai_interview_state");
  }

  function startOrResumeInterview(resume, onTick, onFinish) {
    let st = get("ai_interview_state");
    if (!resume || !st) {
      // fresh start
      const prof = loadProfile();
      if (!prof) return;
      st = {
        id: rid(),
        profile: prof,
        index: 0,
        order: bank, // fixed 6
        left: difficultyTime[bank[0].difficulty],
        currentStartedAt: Date.now(),
        paused: false,
        draft: "",
        qa: [],
        finished: false,
      };
    }
    set("ai_interview_state", st);
    runTimer(onTick, onFinish);
    onTick(snapshot());
  }

  function snapshot() {
    const st = get("ai_interview_state");
    const current = st.order[st.index];
    return {
      id: st.id,
      index: st.index,
      current,
      left: st.left,
      paused: st.paused,
      draft: st.draft ?? "",
    };
  }

  function setDraft(text) {
    const st = get("ai_interview_state");
    if (!st || st.finished) return;
    st.draft = (text || "").slice(0, 4000);
    set("ai_interview_state", st);
  }

  function togglePause() {
    const st = get("ai_interview_state");
    if (!st || st.finished) return;
    st.paused = !st.paused;
    set("ai_interview_state", st);
  }

  function submitAnswer(text) {
    const st = get("ai_interview_state");
    if (!st || st.finished) return;

    const q = st.order[st.index];
    const used = difficultyTime[q.difficulty] - st.left;
    const a = (text || st.draft || "").trim();

    const score = gradeAnswer(q.prompt, a, q.difficulty); // 0..20

    st.qa.push({
      q: q.prompt,
      a,
      difficulty: q.difficulty,
      score,
      timeUsed: Math.max(0, used),
    });
    st.index += 1;
    st.draft = "";

    if (st.index >= st.order.length) {
      st.finished = true;
      const total = st.qa.reduce((s, x) => s + x.score, 0);
      const avg = total / st.qa.length;
      const summary = summarize(st.profile.name, st.qa, Math.round(avg));
      saveCandidate({
        id: st.id,
        profile: st.profile,
        qa: st.qa,
        total,
        avg,
        summary,
      });
      set("ai_interview_state", st);
      return; // timer loop will detect finished
    } else {
      const next = st.order[st.index];
      st.left = difficultyTime[next.difficulty];
      st.currentStartedAt = Date.now();
      set("ai_interview_state", st);
    }
  }

  function runTimer(onTick, onFinish) {
    if (tickRef) clearInterval(tickRef);
    tickRef = setInterval(() => {
      const st = get("ai_interview_state");
      if (!st) {
        clearInterval(tickRef);
        return;
      }
      if (st.finished) {
        clearInterval(tickRef);
        onFinish &&
          onFinish({
            total: st.qa.reduce((s, x) => s + x.score, 0),
            avg: st.qa.reduce((s, x) => s + x.score, 0) / st.qa.length,
            summary: summarize(
              st.profile.name,
              st.qa,
              Math.round(st.qa.reduce((s, x) => s + x.score, 0) / st.qa.length)
            ),
          });
        return;
      }
      if (st.paused) {
        onTick && onTick(snapshot());
        return;
      }
      st.left = Math.max(0, st.left - 1);
      set("ai_interview_state", st);
      onTick && onTick(snapshot());
      if (st.left === 0) {
        // auto-submit empty if user didn’t submit
        submitAnswer("");
      }
    }, 1000);
  }

  // ===== Scoring & summary (heuristic offline)
  function gradeAnswer(q, a, diff) {
    // Very simple heuristic: longer & keyword-y answers = more points
    const words = (a || "").trim().split(/\s+/).filter(Boolean);
    const len = words.length;
    let base = diff === "easy" ? 8 : diff === "medium" ? 12 : 14;
    let bonus = 0;
    const kws = [
      "react",
      "hook",
      "closure",
      "event",
      "loop",
      "express",
      "rate",
      "limit",
      "virtual",
      "dom",
      "memo",
      "optimiz",
      "cache",
      "queue",
      "throttle",
      "debounce",
    ];
    const matched = kws.filter((k) => a?.toLowerCase().includes(k)).length;
    bonus += Math.min(6, matched); // up to +6
    bonus += Math.min(6, Math.floor(Math.sqrt(len))); // length up to +6
    return Math.max(0, Math.min(20, base + bonus));
  }

  function summarize(name, qa, avg) {
    const strong = qa.reduce(
      (m, x) => (x.score > m.score ? x : m),
      qa[0] || { score: 0, q: "" }
    );
    const weak = qa.reduce(
      (m, x) => (x.score < m.score ? x : m),
      qa[0] || { score: 0, q: "" }
    );
    return `${name} scored an average ${avg}/20. Strongest on “${strong?.q?.slice(
      0,
      60
    )}”, needs improvement on “${weak?.q?.slice(0, 60)}”.`;
  }

  // ===== Candidates store
  function saveCandidate({ id, profile, qa, total, avg, summary }) {
    const all = get("ai_candidates", []);
    all.push({
      id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      qa,
      total,
      avg,
      summary,
      createdAt: Date.now(),
    });
    set("ai_candidates", all);
  }
  function getCandidate(id) {
    const all = get("ai_candidates", []);
    return all.find((x) => x.id === id);
  }
  function getAllCandidates(q, sort) {
    let all = get("ai_candidates", []);
    if (q) {
      const s = q.toLowerCase();
      all = all.filter(
        (c) =>
          c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)
      );
    }
    if (sort === "date") all.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === "name") all.sort((a, b) => a.name.localeCompare(b.name));
    /*score*/ else all.sort((a, b) => b.total - a.total);
    return all;
  }

  function escape(s = "") {
    return (s + "").replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m])
    );
  }

  return {
    validateEmail,
    validatePhone,
    loadProfile,
    saveProfile,
    extractFields,
    hasUnfinishedInterview,
    discardInterview,
    startOrResumeInterview,
    setDraft,
    submitAnswer,
    togglePause,
    getAllCandidates,
    getCandidate,
    escape,
  };
})();
