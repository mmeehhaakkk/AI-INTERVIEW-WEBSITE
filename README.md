# 🧑‍💻 AI Interview Assistant — Static Website

A **fully client-side** interview simulator with a timed Q&A flow and a reviewer dashboard — all powered by the browser. No backend, no database, works offline.

---

## 🔗 Live Demo :- 

- **Vercel:** -  https://ai-interview-website-ochre.vercel.app/

---

## ✨ Features :- 

- **Timed Interview Flow**  
  6 questions (2 Easy → 2 Medium → 2 Hard). Per-question countdown, **pause/resume**, and auto-submit on timeout.

- **Local Scoring (0–20)**  
  Simple rubric based on **answer length** and **keyword matches**. Instant summary report.

- **Offline & Private**  
  All data stored in **localStorage** only. No network calls, no server.

- **Interviewer Dashboard**  
  Review attempts, full Q&A, score breakdown, and **sort/search** by Score / Date / Name / Email.

- **Responsive Dark UI**  
  Pure **HTML + CSS + JS** with a clean, accessible dark theme.

---

## 🧱 Project Structure :- 

AI-INTERVIEW-WEBSITE/

├── index.html # Landing page

├── interviewee.html # Candidate profile + timed interview

├── interviewer.html # Reviewer dashboard (localStorage viewer)

├── styles.css # Dark theme styles

├── app.js # Core logic (timers, scoring, storage)

└── assets/

└── logo.svg # Replace with your brand logo

---

## 🧩 Tech Stack :- 

- Core: HTML5, CSS3, Vanilla JavaScript (ES6+)

- Persistence: localStorage (namespaced keys)

- Build/Tooling: None required (fully static)

---

## 📝 Scoring Rubric (0–20) :- 

- Base Score (0–12): proportional to answer length up to a sensible cap (prevents padding).

- Keywords (0–8): +2 per relevant keyword hit (per question) up to max.

- Total: 0–20 per question; summed and normalized for summary.

- Configurable in app.js under the SCORING_CONFIG object.

---

## ⏱️ Timers & Auto-Submit :- 

- Per-question countdown visible to the candidate.

- Pause/Resume allowed (optional toggle in app.js).

- When time hits zero, the current answer locks and the flow moves forward.

- On final timeout or manual submit, the attempt is saved and the summary is shown.

---

## 💾 Data Model (localStorage) :- 

- All interview attempts are stored under a single namespaced key:

- Key: aiInterview:attempts

- Shape (array of attempts):

- The Interviewer Dashboard (interviewer.html) supports:
- Sort by Score / Date / Name

- Search by name or email

- Detail view with full Q&A and per-question breakdown.

---

## 🔍 Usage Guide :- 
- Candidate (Interviewee)

- Open Interviewee page.

- Fill basic details (Name, Email, Phone).

- Start interview → answer 6 timed questions.

- Submit → see summary & score.

- Reviewer (Interviewer)

- Open Interviewer page.

- Use Search and Sort controls.

- Click an attempt → view answers, timings, and breakdowns.

---

## 🧪 Testing Checklist :- 

 - Per-question timers (pause/resume, auto-submit)

 - Scoring & keywords behave as expected

 - Attempts appear in dashboard; sort/search works

 - Mobile responsiveness

 - Dark mode contrast & accessibility

 ---

## 🌐 Deployment :- 
- Vercel (recommended)

- Import the repo in Vercel.

- Framework Preset: Other.

- Output directory: / (root).

- Deploy & share URL.

- GitHub Pages

- Use the main branch /root as the Pages source.

---

## 🔒 Privacy & Security :- 

- All data stays on the user’s device via localStorage.

- No tracking, no server, no external API calls.

- Clear storage from Interviewer page or browser devtools if needed.

---

## ⚠️ Limitations :- 

- Keyword-based scoring is intentionally simple.

- For production-grade evaluation, integrate advanced scoring or AI evaluation (not in scope here).

---

## 🧑‍🎨 Customization :- 

- Theme: Edit CSS variables in styles.css.

- Logo: Replace assets/logo.svg.

- Questions/Keywords/Timers: Edit QUESTION_BANK & SCORING_CONFIG in app.js.

- Pause/Resume: Toggle feature flag in app.js.
