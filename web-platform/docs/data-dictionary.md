# TerraShield — Data Dictionary

All data in `shared/data/` is **fictional sample data** made for the LandTech 2026 hackathon.
No real places, people, NID numbers, phone numbers or land records are used. No government website or API was accessed.

`shared/` is the **single source of truth**. The website reads a generated copy (`web/js/data.js`, made by `node scripts/build-data.js`). The mobile app should read the JSON files directly.

| File | Field | Meaning |
|---|---|---|
| `locations.json` | `district`, `upazila` | Fictional "Demo" district and upazila (pre-filled in the app) |
| | `mouzas[]` | `id`, `jl` (JL number), `name.bn`, `name.en` |
| | `subRegistryOffice` | The one fictional office where all deeds are registered |
| `people.json` | `people[]` | `id` and `name.bn` / `name.en`. `O..` = owners in khatians, `P..` = other people, `P99` = Demo Buyer |
| `plots.json` | `plots[]` | `mouzaId`, `dag` (plot number), `totalArea` (decimal) |
| `khatians.json` | `khatians[]` | Latest khatian per dag: `khatianNo`, `mouzaId`, `dag`, `survey`, `recordDate` (YYYY-MM-DD), `owners[]` (`personId`, `share` in decimal) |
| `deeds.json` | `deeds[]` | `id` (internal, unique), `deedNo` (number/year as printed), `office`, `date`, `sellerId`, `buyerId`, `mouzaId`, `dag`, `area` |
| `namjari.json` | `namjari[]` | `caseNo`, `mouzaId`, `dag`, `applicantId`, `basis` (`deed` / `inheritance`), `deedId` (link to a deed or `null`), `status` (`approved` / `pending` / `rejected`), `date` |
| `../test-cases.json` | `cases[]` | `id`, `sample` (shown as "Try a Sample"?), `title`, `story`, `input`, optional `addDeeds` (live demo), and `expect` (`status`, `rules`, optional `calc`, `skipped`) |

## Simplifying assumptions (stated openly)
1. Each deed covers **one dag**; each khatian record covers **one dag**.
2. Area unit is **decimal (শতাংশ)** only.
3. Dates are ISO `YYYY-MM-DD`.
4. A deed number is unique per office per year — except the deliberate duplicate `0109/2010` (test case 10).

## Admin records (v3, local server only — `data/db.json`)
Not part of `shared/` and never mixed into it. Each record: `id` (`AR-n`), `type` (`plot` / `khatian` / `deed` / `namjari`), `status` (`draft` / `reviewed` = approved / `rejected` / `archived`), `data` (exactly the same fields as the matching file above; admin deeds get `id` `AD-n`, office `SRO-DEMO`), `createdAt`, `updatedAt`, `createdBy`, `reviewedBy`, `rejectReason`, `history[]`. The file also holds the change `log[]` and, if the password was changed in the panel, `auth` (email + scrypt hash).
Only `reviewed` records are added to the data served at `/api/data` (marked `_src: "admin"`). People are always chosen from `people.json`; admin records must stay fictional.
