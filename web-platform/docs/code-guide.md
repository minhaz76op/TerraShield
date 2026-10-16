# TerraShield — Code Guide (for Q&A preparation)

Read this so **both students can explain every part**. Plain HTML, CSS and JavaScript — no frameworks, no server.

## Files in the order the browser loads them
`data.js` (also `TS.units` from `shared/units.json`) → `engine.js` → `voice.js` → `calc.js` (land-calculator arithmetic, pure, tested in Node) → `i18n.js` → `i18n-site.js` → `i18n-guide.js` (guide text) → `ui/core.js` (state, theme, formatting incl. `f.dateLong` / `f.timeOfDay`, `esc`) → `ui/icons.js` → `ui/background.js` → `ui/router.js` (page frame + routes) → `ui/components.js` (progress, errors, area bar, evidence cards) → `screens/*.js` (each registers `U.screens.<name>`) → `screens/story.js` (Judge Mode) → `ui/voice-panel.js` → `main.js` (actions + start).
All UI files share one namespace, `TS.ui` (called `U` inside each file). Each file only uses what earlier files put on `U`.

## Layout: why "container queries"?
Screens decide their layout by the width of the **app area**, not the browser window (`@container app`). That's what lets the same screens look like a laptop page normally and like a phone inside the Judge Mode frame.

## Judge Mode story (`screens/story.js`)
Six steps × 10 s. Every step has an action (in `ACTIONS`) that first resets the demo data and then sets up exactly what that step needs — so skipping forward/back always works. `router.js` moves `#scope` (the whole app) into `#screen-host` (the phone screen) while the story is active and back when it stops. A click inside the phone pauses the story (`main.js`).

## Admin Panel inside the double-clicked file (v3.1)
- `screens/admin.js` sends every request through `transport()`: to the server when served, otherwise to `admin-local.js`, which answers the same paths in the browser (`localStorage` for records/log/account, `sessionStorage` for the login session, Web Crypto PBKDF2 for the password).
- The workflow itself is `web/js/admin-core.js`, used unchanged by both `admin-local.js` and the server (`server/records.js` is now a thin wrapper) — one set of rules, tested in Node (`admin-core.test.js`, `admin-api.test.js`) and in the browser.
- **Demo login (v3.2):** `admin-core.js` holds `DEMO` (email + password). File mode: `admin-local.js` stores the demo account as a PBKDF2 hash with `demo: true` on the first request (an older account without the flag is replaced; records kept) and always includes `demo` in the logged-out `session` answer; `password` answers 403 `demo_fixed`. Server: `ADMIN_DEMO=1` (set by `npm start` only when no password is configured) makes `auth.js` use `DEMO` (fixed: `changePassword` → `demo_fixed`), and `GET /api/admin/session` includes `demo` only when `auth.source === 'demo'`; a password from `.env` is never shown. Settings hides the password form when `credentialSource === 'demo'`. `screens/admin.js` → `demoCard()` / `copyDemo()` (Clipboard API with a `textarea` fallback, result announced in a `role=status` line).
- `data-source.js` in file mode merges approved local records synchronously before the first screen (`TS.dataMeta.source = 'local'`), and listens to the `storage` event so other tabs follow.

## Local server and Admin Panel (v3)
- **Two data views** (`data-source.js`, `ui/core.js`): `TS.baseData` is always the bundled fictional data; `TS.data` is what a person's own check uses — the same bundle offline, or `/api/data` (base + **approved** admin records) when served by `npm start`. `U.baseView()` is used by samples, Judge Mode and "Run all tests"; `U.currentData()` by the wizard; `U.resultData()` picks the right one for the result/evidence screens (`state.resultSource`).
- **Server** (`server/`): `server.js` serves `web/` and the API (no framework), `db.js` keeps admin records in `data/db.json` (atomic writes; base data never copied in), `records.js` is the workflow draft → approved/rejected → archived (+ restore, edit → draft), `auth.js` does scrypt hashes, sessions, CSRF and lockout, `setup.js` writes `.env`.
- **One validator for both sides**: `web/js/admin-validate.js` runs in the browser for instant feedback and on the server as the authority.
- **Admin Panel** (`screens/admin.js` + `i18n-admin.js`): async screens painted into `#admin-main`; one set of event listeners on `#admin-root`; every value through `esc()`; after any change it calls `TS.dataSource.refresh()` so the website uses the new data at once.
- *"How do you know approved records reach the results — and nothing else changes?"* — `tests/admin-api.test.js` runs the engine on `/api/data` after each step, and `tests/browser_admin_check.py` does the same through the real website, while checking samples, Judge Mode and 14/14 stay on the base data.

## Homepage hero and step-by-step guide (v2.3)
- **Hero** (`screens/home.js`): `heroParcels()` draws faint parcel lines behind the band; `mapCard()` draws the fictional mouza map (inline SVG, dag 103 outlined, the 30 decimal already sold hatched) — both are pictures only (`aria-hidden`, `pointer-events: none`), the map card has one `aria-label` for screen readers. All hero styles are scoped to `.hero-forest` in `styles.css`; the band is dark in both themes, so its text uses fixed light colours.
- **Guide** (`#/calc/guide`): text lives in `i18n-guide.js` (`T.guide`, Bangla + English, same structure); `screens/guide.js` builds the page and the tab bar `U.calcTabs()` shared with the calculator. `router.js` sends `#/calc/guide` to the guide. In-page jumps are buttons (`data-jump`) because the URL hash is used for routing. The tick list is plain checkboxes — nothing is stored.

## Land calculator (`#/calc`) — how it works
- **`shared/units.json`** stores every area unit as square feet (1 decimal = 435.6, 1 acre = 43,560, katha 720 and bigha 14,400 marked `regional: true`). `build-data.js` copies it into `data.js` as `TS.units`.
- **`web/js/calc.js`** is pure arithmetic (no screen code), like the engine: `parseAmount` (Bangla/English digits, commas; errors *empty / notNumber / notPositive / tooLarge*), `parseShare` (`1/3`, `0.25`, `.333`, `25%`; errors *zeroDen / notPositive / overOne*), `shareArea(total, 'decimal'|'acre', share)` → land in decimal, `convert(amount, unit)` → every unit via square feet, `round` for display. Tested by `tests/calc.test.js`.
- **`web/js/screens/calc.js`** draws the two cards. Typing only repaints the result boxes (`paintShare` / `paintConv`), so the cursor stays where it is. Errors appear only for boxes that have something typed in.
- **"Check with this area"** (`calc-use` in `main.js` → `U.calcAction`) puts the rounded result into `state.form.area`, then opens step 4 if mouza/dag/seller are already chosen, otherwise step 1. It never calls the engine; the check runs later exactly as before.
- **Not included on purpose:** ana-gonda shares (rules not verified), area from measurements and voice input (not needed for P3 Round 1).

## How a check flows
1. **`screens/check.js` collects answers** step by step into `state.form` (mouza, dag, seller, area, deed no.). On the dag step, `dagLookupHtml()` / `paintDagLookup()` show a live *found / not found* hint by reading the sample data directly — display only, the engine is not called until Next.
2. Each **Next** button calls `validateStep()`, which reuses the engine's own `validateInput()` and shows the friendly message from `i18n.js` (`err.*`).
3. If the dag is not in the data, the app jumps straight to the ⚪ result with "did you mean" dags.
4. **Start Check** calls `TS.engine.check(input, data)` → returns `{status, calc:{S,A,L,W}, findings:[{rule, level, evidence}]}`.
5. The **result screen** turns each finding into words with `i18n.js` (`rules.R1.t` = title, `rules.R1.d(evidence)` = detail) and builds the area bar from `calc`.
6. **See Evidence** (`#/evidence/<n>`) draws the records stored in `finding.evidence` side by side, highlighting the mismatching fields.

## The engine (`web/js/engine.js`) — the most important file
- **S / A / L / W:** S = seller's share in the latest khatian; A = what he sold from this dag *after* the khatian date; L = S − A; W = what the buyer wants.
- R1 = A > 0 with no approved namjari · R2 = W > L · R3 = seller not in khatian · R4 = A > S · R5 = someone else's pending namjari · R6 = shares > plot area · R7a = sold before buying · R7b = resold within 90 days (**info only**) · R8a/b/c = seller's deed not found / doesn't match / duplicated number.
- Colour: any *high* → red; else any *medium* → yellow; else green (info notes allowed). Unknown dag → grey.
- It is "pure": same input → same output, no screen, no storage. That's why it can be tested in Node and why the mobile app can copy it.

## Why plain `<script>` files and `data.js`?
Browsers block `fetch()` and JS modules when a page is opened by double-click (`file://`). Plain scripts and data as a JS file work everywhere, offline. `scripts/build-data.js` creates `web/js/data.js` from `shared/`.

## The standalone file
`scripts/build-standalone.js` copies `index.html` and replaces the stylesheet link with the CSS (fonts converted to base64) and each `<script src>` with the script's text → `dist/terrashield.html`.

## Judge Mode (`?judge=1`)
- **Add a sample sale** pushes a fictional deed into `state.extraDeeds` (memory only); every check then uses `currentData()` = base data + added deeds.
- **Reset** empties those lists.
- **Run all tests** runs every case in `shared/test-cases.json` against the *original* data — exactly what `tests/engine.test.js` does in Node.

## Voice (`web/js/voice.js`)
- `parseSpokenNumber()` turns "এক শূন্য তিন" / "একশো তিন" / "সাড়ে বারো" / "one zero three" into numbers (tested in `tests/voice.test.js`).
- `listen()` wraps the browser's speech recognition (Chrome). The app always shows **"আপনি বলেছেন"** and waits for ✅ before using the value; after 2 failed tries it closes and focuses the keypad.
- `speak()` uses the device voice; if there is no Bangla voice it returns `no-voice` and the app shows a message. `TS.clips` can map text → recorded audio files later.

## Likely judge questions
- *"Does red mean fraud?"* — No. It means the records disagree; the officer or lawyer decides. We never use the word fraud on screen.
- *"Where does real data come from?"* — Nowhere yet; it's fictional by the rules. A real version needs official agreements with the Ministry of Land and Sub-Registry offices.
- *"Why not AI?"* — Legal context needs explainable, repeatable answers. Every flag points to the exact records; the summary is template-based.
- *"How do you know it works?"* — 27 engine tests + 21 voice tests in Node, 24 calculator tests in Node, 84 browser checks + 46 v2.1 checks + 74 calculator checks + 96 home/guide checks on both versions, 39 server/admin API tests, 67 admin end-to-end checks, a WCAG accessibility audit, and the live "Run all tests" button (14/14).
