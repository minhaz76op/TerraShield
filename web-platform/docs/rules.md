# TerraShield — Conflict Rules (shared contract)

This file is the **single description of the rules** for both the web app and the mobile app.
Both apps must pass every case in `shared/test-cases.json`. If they do, they give the same answers.

> **Wording rule:** a rule result is a *mismatch between records* (অমিল), **never** proof of fraud and **never** legal verification.

## The simple maths (all areas in decimal / শতাংশ)

| Symbol | Meaning |
|---|---|
| **S** | Seller's share in the **latest khatian** for this dag |
| **A** | Area this seller already sold from this dag in deeds dated **after** the latest khatian's record date |
| **L** | Left on record = **S − A** |
| **W** | Area the user wants to buy |

A rounding tolerance of **0.01 decimal** is allowed in every comparison.

## The rules

| ID | Triggers when | Level | Message (বাংলা / English) |
|---|---|---|---|
| **R1** | The seller has a deed on this dag after the khatian date (A > 0) with **no approved namjari** | Medium 🟡 | বিক্রেতা আগে এই জমির কিছু অংশ বিক্রি করেছেন, কিন্তু নামজারি হয়নি / The seller sold part of this land before, but namjari was not done |
| **R2** | **W > L** | High 🔴 | বিক্রেতার রেকর্ডে যতটুকু জমি বাকি আছে, তার চেয়ে বেশি বিক্রি হচ্ছে / The seller is selling more land than the records show he has left |
| **R3** | The seller is **not an owner** in the latest khatian (user chose "not in list"). Area rules (R1, R2, R4) are skipped. | High 🔴 | বিক্রেতার নাম সর্বশেষ খতিয়ানে নেই / The seller's name is not in the latest khatian |
| **R4** | **A > S** (already sold more than his whole share) | High 🔴 | রেকর্ড অনুযায়ী এই জমি একাধিক ব্যক্তির কাছে বিক্রি হয়েছে / Records show this land was sold to more than one person |
| **R5** | A **pending** namjari on this dag by someone **other than the seller** | Medium 🟡 | এই জমিতে অন্য একজনের নামজারি আবেদন চলমান / Someone else has a pending namjari application on this land |
| **R6** | Sum of all owners' shares in the khatian **>** the dag's total area | Medium 🟡 | খতিয়ানে মোট অংশ দাগের মোট জমির চেয়ে বেশি / The khatian shares add up to more than the plot's total area |
| **R7a** | A deed shows the seller selling this dag **before** the date of his earliest deed buying it | High 🔴 | তারিখে অসঙ্গতি আছে / The dates don't match up |
| **R7b** | Anyone in this dag's deed history resold it **0–90 days** after buying | **Info 🔵** — never changes the colour | শুধু জানার জন্য: জমিটি অল্প সময়ে হাতবদল হয়েছে / For information: the land changed hands quickly |
| **R8a** | Seller's deed number (optional) is **not found** | Medium 🟡 | বিক্রেতার দলিল নমুনা রেকর্ডে পাওয়া যায়নি / The seller's deed was not found in the sample records |
| **R8b** | Found once, but buyer ≠ seller, **or** different mouza/dag, **or** deed area < W | High 🔴 | বিক্রেতার মালিকানার দলিলের তথ্য রেকর্ডের সাথে মেলে না / The seller's ownership deed does not match the records |
| **R8c** | The same deed number (same number + year) appears **more than once** | High 🔴 | একই নম্বরের একাধিক দলিল রেকর্ডে আছে / More than one deed with the same number exists in the records |

Deed numbers are compared after normalising: `0109/2010`, `109/2010` and `০১০৯/২০১০` are the same.

## Overall result

| Situation | Status | Headline |
|---|---|---|
| Any High | `red` 🔴 | গুরুতর অমিল পাওয়া গেছে — টাকা দেওয়ার আগে ভূমি অফিসে যাচাই করুন |
| Any Medium (no High) | `yellow` 🟡 | কিছু বিষয় যাচাই করা দরকার |
| None, or Info only | `green` 🟢🔍 | আমাদের নমুনা রেকর্ডে কোনো অমিল পাওয়া যায়নি — *this does not mean the land is safe or legally verified* |
| Mouza + dag not in data | `grey` ⚪ | এই জমির তথ্য আমাদের নমুনা রেকর্ডে নেই |

## Input checks (before any rule runs)

| Code | When |
|---|---|
| `dag_required` / `dag_digits` | Dag empty / not only digits (Bangla digits are fine) |
| `area_required` / `area_number` / `area_positive` | Area empty / not a number / 0 or less |
| `area_too_big` | Area bigger than the whole dag (`params.total`) |
| `seller_required` | Known dag but no seller chosen and no name typed |
| `deed_format` | Deed number given but not like `1234/2020` |

## How the app shows each level
| Level | Card | Changes colour? |
|---|---|---|
| High | Red stop-sign badge "উচ্চ / High", red left border | Yes → red |
| Medium | Amber triangle badge "মাঝারি / Medium" | Yes → yellow (if no High) |
| Info (R7b only) | **Blue** "শুধু জানার জন্য / For your information only" card | **Never** — a result with only R7b stays green |

Every result also shows the exact disclaimer:
> এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা। এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।

## Live demo case
`demo-live` in `shared/test-cases.json`: after a fictional deed (Rahim Uddin → Demo Buyer, 40 decimal, no namjari) is added, Rahim / dag 101 / 20 decimal becomes **red with R1 + R2** (S 50, A 40, L 10, W 20). Judge Mode reproduces this live.

## Reference implementation
`web/js/engine.js` — tested by `tests/engine.test.js` (27 tests) and, through the real screens of both the website and the standalone file, by `tests/browser_check.py`.
