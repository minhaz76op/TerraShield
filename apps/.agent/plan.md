# Project Plan

TerraShield — জমি কেনার আগে যাচাই করুন (Check before you buy land).
A LandTech app for ordinary people and land buyers in Bangladesh. Native Android app using Kotlin + Jetpack Compose.
Key Features:
1. Land record comparison & fraud detection (khatian, deed, namjari comparison using rule engine R1-R8).
2. All UI text in Bangla by default (values-bn), English fallback in Settings.
3. Check wizard (Mouza, Dag number live lookup with voice input, Seller selection, Land area input with ± and voice, optional deed number, review & check).
4. 1.2s scan animation -> Result screen (Status card, findings R1-R8, area bar, next steps, evidence view, history, PDF report).
5. Home screen with hero background animation, problem section, 4-step guide, 8 rules sheet, source facts.
6. Calculator (share calculation, unit conversion: decimal, acre, sq ft, sq m, katha, bigha) & Guide (educational workflow, common mistakes, checklist).
7. Samples & Judge Mode (14 sample test cases, demo sale, 60s story player).
8. Help & Settings (Hotline 16122, FAQ, About, Language/Voice/Theme preferences).
9. Admin Panel (Local demo data management - draft, review, approve, reject, archive, audit log).
10. Custom Material 3 branding (light/dark theme tokens, Hind Siliguri, IBM Plex Mono, Inter fonts, custom canvas painters for background parcel lines and mouza map).
11. Comprehensive motion system with custom transitions, reduced motion support, haptics, and 100% offline functionality.

## Project Brief

# TerraShield — Project Brief (MVP)

TerraShield (জমি কেনার আগে যাচাই করুন) is a native Android LandTech application designed for land buyers in Bangladesh to verify land records and detect potential fraud before purchasing property.

---

## Features

1. **Land Record Verification Wizard & Fraud Engine**: Interactive step-by-step lookup wizard allowing users to input Mouza, Dag number, seller details, and deed numbers (with voice input support) to run against a automated R1–R8 fraud detection rule engine.
2. **Scan Analysis & Findings Dashboard**: Animated scanning process (1.2s transition) leading to a result screen featuring risk status cards, rule-by-rule (R1–R8) findings, land area visualization, evidence views, and downloadable PDF reports.
3. **Land Calculator & Unit Converter**: Precision calculator for land share distribution and multi-unit conversions tailored to Bangladeshi measurements (Katha, Bigha, Decimal, Acre, Square Feet, Square Meters).
4. **Interactive Buyer Guide & Sample Sandbox**: Educational guide covering common land purchasing mistakes and step-by-step checklists, along with 14 pre-loaded sample test cases and a 60-second story walkthrough player.
5. **Native Bangla UI & Material 3 Styling**: Built with Bangla (`values-bn`) as the primary language and English fallback in Settings, leveraging custom Material 3 branding, typography (Hind Siliguri, IBM Plex Mono, Inter), and custom canvas painters for parcel lines.

---

## High-Level Tech Stack

* **Language**: Kotlin
* **UI Framework**: Jetpack Compose & Material 3 Design System
* **Navigation**: Jetpack Navigation 3 (State-driven navigation)
* **Adaptive Strategy**: Compose Material Adaptive library
* **Asynchrony & Reactive Streams**: Kotlin Coroutines & Flow
* **Architecture**: Modern Android Architecture (ViewModel, StateFlow, Unidirectional Data Flow)

## Implementation Steps
**Total Duration:** 1h 8m 22s

### Task_1_Foundation_Engine_DataStore: Implement domain models, rule evaluation engine (R1-R8 rules), unit conversion utilities, Bangla digit/date helpers, DataStore settings, and local JSON sample repositories.
- **Status:** COMPLETED
- **Updates:** Implemented domain models, pure Kotlin RuleEngine (R1-R8c), LandCalculator, BanglaFormatter, SpokenNumberParser, UserPreferencesRepository DataStore, LandRecordRepository with JSON syncing, and verified all 14 shared test cases pass in JVM unit tests (14/14) as well as debug APK build success.
- **Acceptance Criteria:**
  - Rule engine ports R1-R8 rules and passes unit tests
  - Bangla language utilities and DataStore user preferences implemented
  - Land unit converter logic and sample test dataset implemented
  - Project builds successfully
- **Duration:** 17m 32s

### Task_2_AppShell_Navigation_Home_Calculator: Implement core app shell (theme tokens, custom fonts/Bangla strings, splash screen, demo strip, bottom navigation), Home screen with Hero section & canvas mouza/parcel map painters, and Calculator & Guide screen.
- **Status:** COMPLETED
- **Updates:** Implemented core app shell, custom M3 design system with Hind Siliguri / IBM Plex Mono fonts, motion tokens, ParcelBackground and MouzaMap canvas painters, 4-tab bottom navigation with dismissible demo strip, Home screen with 8-rules bottom sheet, and Calculator & Guide screen with share math, multi-unit converter, and buyer guide checklist. Build and unit tests verified (14/14 engine tests passing, assembleDebug successful).
- **Acceptance Criteria:**
  - App theme, Bangla i18n resources, bottom navigation and demo strip implemented
  - Home screen rendered with hero section and custom canvas map painter
  - Calculator & Land conversion tool functional
  - Project builds successfully
- **Duration:** 5m 51s

### Task_3_VerificationWizard_ScanResult_Pdf_History: Implement land record verification wizard flow (Mouza/Dag lookup, seller selection, voice input, land area calculation, review), scan analysis screen with animation, findings cards R1-R8, evidence table, history timeline, and PDF report generator.
- **Status:** COMPLETED
- **Updates:** Implemented 6-step Check Wizard with live Dag lookup & voice input, ~1.2s Checking animation, Result screen with Status Card, Findings R1-R8c, Area Bar visualization, 🔊 TTS audio speech button, exact mandatory disclaimer, Evidence side-by-side view, History timeline, and A4 PDF Report generator with FileProvider sharing. Build and 14/14 engine unit tests verified.
- **Acceptance Criteria:**
  - Multi-step land verification wizard allows Dag lookup, seller selection, and validation
  - Scan result screen displays risk status, findings cards, and evidence table
  - PDF report generation and history timeline functional
  - Project builds successfully
- **Duration:** 6m 54s

### Task_4_Samples_JudgeMode_Settings_AdminPanel: Implement Samples & Judge Mode (14 test cases runner, story player), Help & Settings (Hotline 16122, FAQ, language switch, TalkBack accessibility), and Admin Panel workflow (PBKDF2 auth, draft/review/approve/reject/audit log).
- **Status:** COMPLETED
- **Updates:** Implemented Samples screen (14 shared test cases), Judge Panel with demo sale toggle & "সব পরীক্ষা চালান" runner (14/14 PASS banner), 60s interactive Story Player with step progress bars, Help & Settings (Hotline 16122 dialing, FAQ, About screen, language/voice/theme controls), Accessibility TalkBack labels and touch targets >= 48dp, and Admin Panel with PBKDF2 authentication, draft/review/approve/reject document workflow, and audit logging. Verified build and 17/17 unit tests pass.
- **Acceptance Criteria:**
  - 14 test cases sample runner and 60s story player functional
  - Settings, helpline dialing, and accessibility semantics implemented
  - Admin panel authentication and document moderation workflow functional
  - Project builds successfully
- **Duration:** 9m 40s

### Task_5_Run_And_Verify: Final build, execution, and verification step. Instruct critic_agent to verify application stability (no crashes), confirm alignment with user requirements, verify UI responsiveness and accessibility, and report any critical UI issues.
- **Status:** COMPLETED
- **Updates:** Final quality assurance and verification completed successfully by critic_agent. Verified zero crashes, 100% test pass rate (14/14 test cases), full feature execution across Check Wizard, Result view, Evidence, History, PDF generator, Calculator, Samples, Judge Mode, Help & Settings, and Admin Panel. All accessibility, typography, and theme requirements met.
- **Acceptance Criteria:**
  - make sure all existing tests pass
  - build pass
  - app does not crash
  - Application verified for stability, feature completeness, and user requirements alignment
- **Duration:** 28m 25s

