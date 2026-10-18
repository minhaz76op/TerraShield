# TerraShield — জমি কেনার আগে যাচাই করুন

**Team TerraSync · DIU LandTech 2026 Innovation Hackathon · Problem P3: Catch Fraud & Double-Selling**

TerraShield is a mobile-friendly web app that helps ordinary people and land buyers in Bangladesh **spot possible double-selling and conflicting land records before they pay**. The user picks the mouza, enters the dag, taps the seller from the khatian's owner list and enters the area; TerraShield compares the khatian, deed and namjari records and explains every mismatch in simple Bangla (or English), with the evidence side by side and clear next steps.

> ⚠️ **Hackathon prototype using fictional sample data only.** TerraShield is **not** a government website or service and is **not** connected to any government system. Results are warnings for further checking — **not** legal verification, **not** proof of ownership and **not** proof of fraud.
>
> এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা। এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।

---

## Try it

| Version | How to open | Notes |
|---|---|---|
| **Standalone** `dist/terrashield.html` | Double-click — works fully **offline** | One file (~870 KB) with fonts, data, code and the Admin Panel built in. Best venue backup. |
| **Project website** `web/index.html` | Double-click, or host `web/` on GitHub Pages | Same app as separate, readable files |
| **Judge Mode story** | Header button **৬০ সেকেন্ডে দেখুন**, or open `#/judge` | 60-second auto-playing story of the real app in a phone frame (see below) |
| **Judge panel** | Add `?judge=1` to the address → **নমুনা উদাহরণ / Samples** | Manual live demo: add a sale, check again, reset, run all tests |
| **Admin Panel in the file** (v3.1) | Double-click `terrashield.html` → header **অ্যাডমিন প্যানেল** | No commands. The login page shows the **demo admin email + password** (with Copy buttons); records are kept in **this browser** and used in checks after closing/reopening — see below |
| **Local server + Admin Panel** (v3) | `npm start` → http://127.0.0.1:8080 and **/#/admin** (demo login shown; `npm run setup` for your own password) | Same panel with records in `data/db.json` on the laptop (shared by every browser on it) |

### Judge Mode story (60 seconds, no clicking)
Six steps of 10 seconds each, looping, with a clock (`০:২৩ / ১:০০ · চক্র ২`), progress bars, ⏮ ⏯ ⏭, restart and a step list. The left panel narrates; the right shows the **real app** in a phone frame:
1. The problem (two ministries, the namjari gap) → 2. Clean land, 🟢 → 3. The seller sells 40 decimal again (demo deed) → 4. Same check turns 🔴 R1 + R2 → 5. Evidence side by side → 6. All 14 shared tests pass.
Touching the live screen pauses the story so you can explain; ▶ continues. Inputs are scripted; the engine and screens are real; demo data resets every cycle.

## Features
- **Landing page** (JibonRekha-style sections): deep-forest-green hero (v2.3) with faint cadastral parcel lines, an inline-SVG **fictional mouza map** (dag 103 highlighted, the part already sold hatched — labelled *কাল্পনিক*) overlapped by the illustrative example card, a link to the step-by-step guide and a 3-item trust row · the problem (Ministry of Law vs Ministry of Land, the namjari gap) · 4 numbered steps · the 8 rules · *what it does / never does* · *what is real, simulated, future* · **sourced facts** with links.
- **Site frame:** demo-disclosure strip, sticky header (nav, hotline 16122, Judge Mode, language, voice, **light/dark theme**), mobile menu, footer credit. Dark mode follows the device and is remembered; applied before first paint (no flash).
- **Step-by-step check** (one question per screen): mouza → dag → seller (tap from the latest khatian's owner list, or "not in list") → area (± buttons) → seller's deed number (optional) → review. On wide screens a sticky side panel shows every step and your answers, plus a **help card** with the land hotline 16122 (clearly marked: TerraShield is not a government service).
- **Live dag lookup (v2.1):** while typing the dag, a polite live message says *"found in sample records · khatian X · Y decimal in total"*, or *"not in sample records"* with this mouza's sample dags as tappable chips. Display only — the rule engine and the grey "not in sample records" result are unchanged, and it never says "verified".
- **Land calculator (v2.2, `#/calc`):** (1) *How much land is in this khatian share?* — dag total (decimal or acre) × the seller's share written as `১/৩`, `০.২৫`, `.৩৩৩` or `২৫%`, with quick picks (½, ⅓, ¼, whole), live result, the working shown, and a button that puts the result into the check form's area step (*"buying the whole share?"*); (2) *Change units* — one amount shown in decimal, acre, sq ft, sq m, katha and bigha at once. Katha/bigha use the common standard (720 sq ft / 20 katha) and are tagged **"varies by area"** with a warning. Every result says it is approximate arithmetic, not a survey or proof of ownership. Ana-gonda shares are **not included** until the conversion rules are verified. Display only — the rule engine is not involved. Constants live in `shared/units.json` (with sources) so the mobile app uses the same numbers.
- **Step-by-step guide (v2.3, `#/calc/guide`):** a tab on the calculator page (also linked from the hero). Plain-Bangla explanations of **খতিয়ান, দাগ নম্বর, দলিল, নামজারি** (what each contains, how to read it, what to check, how to read namjari status), each with a *fictional* example taken from the sample records; a 7-step *before you buy* workflow; 7 common mistakes; a 7-item tick list (kept on the page only, nothing saved); practice buttons. Marked at the top and bottom as **educational — not legal advice or official verification; no single document proves undisputed ownership**. No fees, deadlines or legal requirements are stated.
- **Rule engine R1–R8** (see [`docs/rules.md`](docs/rules.md)) with a 4-colour result: 🔴 serious mismatch · 🟡 needs checking · 🟢🔍 no mismatch in sample records (*never* "safe") · ⚪ not in sample records (with "did you mean" dags).
- **Result page:** gradient result card, "সংক্ষেপে / In short" summary (template-based, no AI), finding cards with level + rule ID, **See Evidence** (records side by side, mismatches highlighted), and on wide screens a side panel with the area bar, combined next steps, history/report and the exact disclaimer.
- **R7b quick resale** is a blue *information* note only — it never changes the colour.
- **Land history** timeline and **printable report** with a "Sample — not a legal document" watermark. Dates read naturally — *১৫ জানুয়ারি ২০২৩* / *15 January 2023* — and the report time uses Bangla time-of-day words (সকাল / দুপুর / বিকাল / সন্ধ্যা / রাত).
- **Bangla first**, English switch; Bangla digits, including numbered lists (১. ২. ৩.); large targets; status by icon + words + colour; skip link; arrow keys move between radio choices; `prefers-reduced-motion` respected.
- **Voice help (optional):** 🔊 Listen (device voice); 🎤 voice input for **dag and area only** (Bangla mode, Chrome) with a **“আপনি বলেছেন / You said” confirm** step and automatic switch to the keypad after two failed tries.
- **Design system** mirrors JibonRekha v5: ink / brand / mint / coral / info / warn / crit tokens, 18 px cards, 12 px buttons, soft and lift shadows, eyebrow pills, `tag-sim` labels, staggered rise-in, hero shine; Hind Siliguri + Inter + IBM Plex Mono (bundled). Animated cadastral land-parcel background with nakshi-kantha stitch lines. No government emblems or look-alike branding.
- **Privacy:** the website itself has no accounts and uploads nothing. Only language/voice/theme preferences are remembered in the browser. (The optional local server below adds an admin login that runs only on the team's laptop.)

## Admin Panel (`#/admin`) — two ways to run it
**Demo login (v3.2).** The Admin Login page shows a clearly labelled **local demo account** beside the login fields (above them on phones), with a Copy button beside each value and the line *"ডেমো অ্যাডমিন লগইনের জন্য নিচের তথ্য ব্যবহার করুন।"*:

| | |
|---|---|
| Demo admin email | `demo.admin@terrashield.local` |
| Demo admin password | `TerraShield-Demo-2026` |

It is public on purpose (fictional-data hackathon prototype) and **fixed**: in the file and in `npm start` demo mode the password cannot be changed, so the details on the login page always work (an account made with an older version is switched to the demo account; admin records are kept). Only when the server has its own password from `npm run setup` / `.env` is no demo shown — that password is never displayed. Defined once in `web/js/admin-core.js` (`DEMO`).

**1. Inside the double-clicked file (v3.1, no commands).** Open `dist/terrashield.html` (or `web/index.html`) and press **অ্যাডমিন প্যানেল / Admin Panel** in the header (☰ menu on phones). The first visit creates the demo account in this browser (stored only as a hash); log in with the demo details shown beside the form. Approved records are saved in this browser's storage and are used in the website's own checks — also after closing and reopening the file.
- **Limits a browser file cannot avoid:** records live **only in this browser on this computer** — another browser or laptop, a private window or "clear browsing data" will not have them, so use **Settings › Download backup / Restore backup** (backups contain records and the change log, never the password or its hash). Without a server the login is **a lock against casual users, not full security** — someone with the file and the browser's developer tools could change the stored data. That is acceptable only because every record is fictional.
- Same rules as the server: shared workflow (`web/js/admin-core.js`), same checks, same "approved ≠ official" labels. Password stored as a PBKDF2-SHA-256 hash (310 000 iterations, Web Crypto); session ends when the browser closes, after 30 min idle or 8 h; 5 wrong passwords lock login for 15 min; switching an older account to the demo account logs out other open tabs; restored backups are rebuilt field by field and re-checked before they are stored; broken stored data is kept aside, never silently lost; other open tabs of the file update at once.

**On any web host (v3.3).** Put `dist/terrashield.html` (or the `web/` folder) on GitHub Pages, Netlify, VS Code Live Server, `python -m http.server` or any other static host and the Admin Panel works **exactly like the double-clicked file** (records in this browser, demo login shown). The page checks `/api/data` once: only when the TerraShield server really answers does it use server mode. Over plain `http://` from another device (e.g. `http://192.168.x.x`) browsers hide Web Crypto, so the file uses a built-in PBKDF2-SHA-256 implementation with identical results.

**2. With the local server (v3).** Runs **only on the team's laptop** (`npm start`, bound to 127.0.0.1); records live in `data/db.json` and are shared by every browser on that laptop.

**Run it**
```bash
npm start         # → website http://127.0.0.1:8080/   Admin Panel http://127.0.0.1:8080/#/admin
                  #   no .env yet → runs with the demo account (printed in the terminal and shown on the login page)
npm run setup     # optional: your own admin email + password in .env (only a scrypt hash) — the demo login is then not shown
```
Node 18+ only — no npm packages. Admin records are stored in `data/db.json` (created automatically; never in the ZIP).

**What an admin can do:** dashboard (counts by status, what is live, waiting list, recent activity) · add and edit **dag (plot), khatian, deed and namjari** records with instant checks · review queue · **approve** (with a confirmation tick) or **reject** (reason required) · **archive** and restore · per-record history · **change log** of every action (passwords are never logged) · change password (only with your own `.env` password; the demo password is fixed) · **reset to fictional data**. Bangla and English, light and dark, phone-friendly.

**Rules that keep it honest**
- **Only approved ("reviewed") admin records affect results**, and only in a person's own check. Drafts, rejected and archived records never do. Editing an approved record turns it back into a draft.
- **Samples, Judge Mode and the 14 shared tests always use the fictional base data**, so admin records can never change 14 / 14.
- **Base fictional records are read-only** (there is no route that edits them); `shared/` is never written.
- A result that used admin records says so: *"এই যাচাইয়ে অ্যাডমিন-অনুমোদিত রেকর্ড ব্যবহার হয়েছে … কাল্পনিক, সরকারি রেকর্ড বা সরকারি যাচাই নয়"*, and deed evidence is tagged *অ্যাডমিন যোগ করা (কাল্পনিক)*. "Approved" means *a team admin looked at it* — never official verification.
- People can only be **picked from the fictional people list** (no typed names); any 10+ digit number (NID / phone-like) is refused; dates can't be in the future; one plot and one khatian per mouza + dag (the engine reads the first match). Conflicts the engine is meant to detect (shares above the dag total → R6, duplicate deed number → R8c) are allowed with a warning.
- Approval order is enforced: a khatian/deed/namjari can't be approved before its plot (and a namjari before its deed); a plot or deed with active linked records can't be archived or changed.

**Security (localhost prototype — not audited, not for public hosting):** scrypt password hash (from `.env` or set in the panel) · the server refuses to start with broken or weak credentials (with nothing configured it uses the labelled demo account) · HttpOnly + SameSite=Strict session cookie limited to `/api/admin` · CSRF token on every change + same-origin check · 30-minute idle / 8-hour session limit · 5 wrong passwords for the admin email, or 20 wrong logins from one computer, lock login for 15 minutes (guesses for other emails cannot lock the real admin out; blocked retries are not written to the log, so a flood cannot push real entries out) · 32 KB JSON-only request bodies · strict Content-Security-Policy and security headers · static files served only from `web/` (path tricks refused) · every record re-validated on the server · errors never leak details. Forgot the password? Run `npm run setup` again (it backs up `.env` and the DB first).

## Tests (actual results at release)
| Suite | Command | Result |
|---|---|---|
| Rule engine — all 14 shared cases + input checks | `node --test tests/engine.test.js` | **27 / 27 pass** |
| Spoken-number reader | `node --test tests/voice.test.js` | **21 / 21 pass** |
| Land calculator arithmetic (units, share parsing, conversions, errors, rounding) | `node --test tests/calc.test.js` | **24 / 24 pass** |
| Browser check — **both** `web/index.html` and `dist/terrashield.html`, opened from disk with **network blocked**: Judge "Run all tests", every sample case on screen, R7b blue, live demo + reset, exact disclaimer, English switch, simulated voice flow, **Judge Mode story** (frame, step jump, red R1+R2, 14/14, pause on touch, exit), **dark mode** persists, **desktop 1366 px** two-column result, no sideways scroll at 320/390/1366 px, offline Bangla font, no JS errors | `python3 tests/browser_check.py` (needs Playwright) | **84 / 84 pass** |
| Land calculator — both versions, network blocked: share × total (fraction / decimal / percent / acre), quick picks, 7 error cases, errors clear, converter values incl. 1 bigha = 33.06 decimal, regional tags + warning, disclaimer, engine never called, English switch, transfer to the check form (empty and filled form) and the check then runs, no sideways scroll 320–1366 px, axe light + dark | `python3 tests/browser_calc_check.py` | **74 / 74 pass** |
| v2.1 checks — both versions, network blocked: Bangla list numbers (and unnumbered lists stay unnumbered), long dates + time-of-day boundaries + invalid-date fallbacks, hotline help card (wide screens only), scroll padding + `[hidden]`, live dag lookup (found / not found / letters / tap a chip / Next / grey result unchanged / English), axe on the new states light + dark, no JS errors | `python3 tests/browser_v21_check.py` | **46 / 46 pass** |
| v2.3 home + guide — both versions, network blocked: hero links/buttons, disclosures kept, decorative art never blocks clicks, light main button in light + dark, English, header never wraps (menu below 1200 px), guide structure (4 concepts / 7 steps / 7 mistakes / 7 ticks), disclaimers top + bottom, examples match the sample records, checklist saves nothing, jump buttons, engine never called, reduced motion, no sideways scroll 320–1440 px, axe light + dark | `python3 tests/browser_home_guide_check.py` | **98 / 98 pass** |
| Server + database (Node): base data identical to the bundle, identical engine results for all 14 cases, only reviewed records public, persistence, atomic writes, corrupt file kept, reset, static serving, path tricks refused, security headers + CSP | `node --test tests/server.test.js` | **19 / 19 pass** |
| Admin login + API (Node): credentials required at start, scrypt hashes, `npm run setup`, wrong login, cookie flags, every route needs login, CSRF + same-origin, bad bodies, lockout + unlock, idle/8 h expiry, logout, password change (survives restart, ends other sessions), full workflow incl. engine results, validation (fictional people only, NID guard, dates, deed numbers, duplicates), approval order + dependants, base read-only, reset, no passwords in the log, **hostile payloads → 400 never 500, per-email vs per-IP lockout, login flood cannot wash out the log, demo account: shown + works only in demo mode, never a configured/changed password, `npm start` with nothing configured uses it** | `node --test tests/admin-api.test.js` | **26 / 26 pass** |
| Admin end-to-end in Chromium against the real server: login → add → draft has no effect → approve → the website's own check turns red with the admin label → samples, Judge Mode and 14/14 unchanged → edit → archive → restore → reject → khatian/plot forms → filters → change log → English → axe on every admin screen light + dark → 390 px → reset → password change → logout/protection → lockout → no JS/CSP errors → standalone file still offline | `python3 tests/browser_admin_check.py` | **78 / 78 pass** |
| Admin Panel **inside the double-clicked file** (both files, network blocked, real persistent browser profile): header button → login page shows the demo email + password with Copy buttons and the Bangla instruction, no notice boxes → demo login → dashboard (removed notices gone) → draft has no effect → approve → own check red + label → samples & 14/14 unchanged → password only as a PBKDF2 hash → **close the browser and reopen the file: record still there and used**, login asked again → archive/restore → a second tab follows → backup without password → reset → restore backup (wrong file refused) → change log → password change → idle timeout → lockout → broken storage handled → English → axe light + dark → no console errors | `python3 tests/browser_standalone_admin_check.py` | **82 / 82 pass** |
| Shared workflow core (Node): merge, backup round trip without secrets, merged logs, tampered backups refused, **restored backups rebuilt from known fields (types fixed, unknown / `__proto__` keys dropped) and really used**, shared password rules, reset keeps login, **built-in PBKDF2 fallback equals standard PBKDF2-SHA-256**, **restoring a backup after reset keeps each log entry once with its details** | `node --test tests/admin-core.test.js` | **8 / 8 pass** |
| **Admin Panel through its real buttons and forms (v3.3)**, run 3 ways — double-clicked file, static web host without the API, `npm start`: login page (copy, empty/wrong password, show password) → demo login → add plot, khatian (2 owners), deed, namjari via the forms → approve each → website check + wizard use them (labelled) → reject needs a reason → archive blocked by live dependants → archive / restore → edit → draft → list, filters, review queue, log → backup download (no password) → reset needs RESET → restore by file upload, log not duplicated → English → no sideways scroll at 360 px on every admin screen → dark → logout protects pages → no JS errors | `python3 tests/browser_admin_ui_flow_check.py` | **38 + 38 + 35 pass** |
| **SQA regressions (v3.1.1 + v3.3)** in the double-clicked file, network blocked: demo account created on first visit, password change in one tab logs out the other tab and stops offering the demo password, no setup route, HTML/script in a note shown as plain text (no XSS), odd payloads → error not crash, tampered backup cleaned and used, base data untouched, all admin tabs visible at 320 px, no sideways scroll, log links ≥ 24 px, exactly one `<h1>` on every wizard step + review, skip link language, file-mode label, no console errors; **static web host without the API → working this-browser Admin Panel (direct `#/admin`, login, add + approve, used after reload), plain-http LAN address without Web Crypto still logs in** | `python3 tests/browser_sqa_check.py` | **33 / 33 pass** |
| Accessibility audit (axe-core, WCAG 2 A/AA), 13 screens (incl. calculator, guide, admin) × light + dark, both versions | run manually during QA (`AXE_PATH=…/axe.min.js`) | **0 violations** |
| In-app | Judge Mode → সব পরীক্ষা চালান | **14 / 14** |

```bash
npm test                 # build data + engine, voice & calculator tests (Node 18+, no packages) — 72 tests
npm run build            # rebuild dist/terrashield.html from web/ (and web/js/data.js from shared/)
npm run test:browser     # optional: browser checks (pip install playwright && playwright install chromium)
npm run test:calc        # optional: land calculator browser checks
npm run test:v23         # optional: homepage hero + step-by-step guide checks
npm run test:v21         # optional: v2.1 checks (set AXE_PATH=/path/to/axe.min.js to include the accessibility audit)
npm run test:server      # server, database, admin login + API + shared core (Node, no packages) — 53 tests
npm run test:standalone-admin  # optional: the Admin Panel inside the double-clicked file (persistence across browser restarts)
npm run test:ui-flow     # optional: the Admin Panel driven through its forms, as file / static host / server
npm run test:sqa         # optional: SQA regression checks (sessions, XSS, backups, small screens, headings)
npm run test:admin       # optional: Admin Panel end-to-end in Chromium (starts its own server with a temporary DB)
```

## Project structure
```
terrashield/
├── shared/                   ← SINGLE SOURCE OF TRUTH (the mobile app must use these too)
│   ├── data/*.json           ← fictional places, people, plots, khatians, deeds, namjari
│   └── test-cases.json       ← 14 cases + expected results (web AND mobile must pass)
├── web/                      ← the website (host this folder on GitHub Pages)
│   ├── index.html            ← page shell: theme pre-paint, demo strip, header, Judge stage, app scope, footer
│   ├── tests.html            ← simple in-browser engine check
│   ├── css/styles.css        ← design tokens (light + dark), components, container-query layouts, print
│   ├── assets/fonts/         ← Hind Siliguri, Inter, IBM Plex Mono (SIL Open Font License)
│   └── js/
│       ├── data.js           ← AUTO-GENERATED from shared/ (do not edit)
│       ├── data-source.js    ← bundled data offline · /api/data when served (keeps TS.baseData for samples/tests)
│       ├── admin-validate.js ← record checks shared by the server and the Admin Panel
│       ├── admin-core.js     ← admin workflow shared by the server and the file (draft → approved …, backup)
│       ├── admin-local.js    ← Admin Panel backend for the double-clicked file (localStorage + Web Crypto)
│       ├── engine.js         ← rule engine R1–R8 (pure functions)
│       ├── voice.js          ← spoken-number reader, speech in/out
│       ├── i18n.js           ← app wording (rules, results, steps, help) in Bangla & English
│       ├── i18n-site.js      ← site wording (header, landing, sourced facts, Judge story)
│       ├── i18n-guide.js · i18n-admin.js ← guide and Admin Panel wording
│       ├── ui/               ← core (state, theme, format) · icons · background · router (frame) · components · voice-panel
│       ├── screens/          ← home · check (wizard) · result (+ evidence, history, report) · samples (+ Judge panel) · help · calc · guide · admin · story (Judge Mode)
│       └── main.js           ← named actions + one click listener + start-up
├── dist/terrashield.html     ← standalone single file (built)
├── server/                   ← local server (v3): server.js (static + API) · db.js (JSON DB) · auth.js · records.js · setup.js · base-data.js
├── data/                     ← db.json with admin records (created by the server; not committed, not zipped)
├── scripts/                  ← build-data.js, build-standalone.js
├── tests/                    ← engine, voice, calc, server, admin-api (Node) · browser_check, v21, calc, home_guide, admin (Playwright)
└── docs/                     ← rules.md, data-dictionary.md, code-guide.md
```

## Data used
- **All data is fictional**, created by the team: "Demo" district/upazila, mouzas *নমুনাপুর* and *পরীক্ষাগাঁও*, invented names, no NID or phone numbers. Any resemblance to real people is coincidental.
- **No government website or API was accessed, scraped or downloaded.** A real deployment would need official data-sharing agreements with the Ministry of Land and the Sub-Registry offices.
- Hotline shown: **16122** (Ministry of Land service hotline). The legal-aid hotline 16430 is built in but **switched off** (`TS.config.showLegalAidHotline` in `web/js/i18n.js`) until the team confirms by phone that it is active and covers land disputes.

## Mobile app (teammate)
Use `shared/data/*.json`, `shared/test-cases.json` and [`docs/rules.md`](docs/rules.md). The mobile app is correct when it gives the same `status` and rule IDs for every case in `test-cases.json`.

## Known limits
Fictional data only · one dag per deed · decimal unit only · the Admin Panel is a localhost prototype (one admin account, sessions in memory — a restart logs out, no file uploads, one admin can approve their own entry; security not independently audited) · voice input mainly in Chrome (Android/desktop) with internet · device voice quality varies and some devices have no Bangla voice (the app then says so and the text stays on screen) · pre-recorded clips are supported (`TS.clips`) but not yet recorded.

## AI tools used
| Tool | Used for |
|---|---|
| **Claude (Anthropic)** | Research support, planning, generating code, tests and documentation drafts. All code was reviewed and tested by the team, and is explained in [`docs/code-guide.md`](docs/code-guide.md). |

## Team
- Student: _(name)_ — Team Leader
- Student: _(name)_
- Faculty mentor: _(name)_
- Industry mentor: _(name)_

## License
Code: MIT — see [LICENSE](LICENSE). Fonts: SIL Open Font License (see `web/assets/fonts/`).
