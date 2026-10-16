/*
 * TerraShield — i18n.js : every word the user sees, in Bangla (default) and English.
 * Tone guide: respectful ("আপনি"), calm, no blame words, never "fraud", "fake",
 * "safe" or "verified". Every problem ends with a clear next step.
 * Functions receive (e, f): e = rule evidence, f = formatting helpers from app.js.
 */
(function (root) {
  'use strict';
  root.TS = root.TS || {};

  var DISCLAIMER_BN = 'এই ফলাফল শুধুমাত্র নমুনা তথ্যের ভিত্তিতে তৈরি সতর্কবার্তা। এটি আইনি যাচাই বা মালিকানার প্রমাণ নয়। জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।';
  var DISCLAIMER_EN = 'This result is a warning based on sample data only. It is not legal verification or proof of ownership. Before buying, consult the land office and a lawyer.';

  root.TS.i18n = {
    bn: {
      _lang: 'bn', _speech: 'bn-BD',
      appTagline: 'জমি কেনার আগে যাচাই করুন',
      sampleBadge: 'নমুনা তথ্য',
      langSwitch: 'English',
      voiceOn: 'কণ্ঠ সহায়তা চালু', voiceOff: 'কণ্ঠ সহায়তা বন্ধ',
      back: 'পেছনে', next: 'পরবর্তী', skip: 'এড়িয়ে যান', change: 'বদলান',
      home: 'হোম', samples: 'নমুনা উদাহরণ', help: 'সাহায্য',
      listen: 'শুনুন', speak: 'কথা বলুন',
      homeTitle: 'জমি কেনার আগে যাচাই করুন',
      homeLead: 'বিক্রেতা আগে জমি বিক্রি করেছেন কি না, বা রেকর্ডে অমিল আছে কি না — টাকা দেওয়ার আগে দেখে নিন।',
      ctaCheck: 'জমি যাচাই করুন', ctaSample: 'নমুনা উদাহরণ দেখুন',
      howTitle: 'কীভাবে কাজ করে',
      how1: 'জমির তথ্য দিন', how2: 'বিক্রেতা বাছুন', how3: 'ফলাফল দেখুন',
      fictionalNote: 'এটি একটি হ্যাকাথন প্রোটোটাইপ। সব তথ্য কাল্পনিক নমুনা — কোনো সরকারি সংস্থার সাথে সম্পর্কিত নয়।',
      stepOf: function (a, b, f) { return 'ধাপ ' + f.num(a) + ' / ' + f.num(b); },
      qWhere: 'জমিটি কোথায়?', district: 'জেলা', upazila: 'উপজেলা', mouza: 'মৌজা', choose: 'বাছাই করুন',
      lockedHint: 'এই প্রোটোটাইপে একটি মাত্র কাল্পনিক জেলা ও উপজেলা আছে',
      qDag: 'দাগ নম্বর কত?', dagPh: 'যেমন: ১০৩', dagHelp: 'দাগ নম্বর খতিয়ান বা দলিলে "দাগ নং" ঘরে লেখা থাকে।',
      qSeller: 'বিক্রেতা কে?', sellerSub: 'এই দাগের সর্বশেষ খতিয়ানে যাদের নাম আছে',
      share: 'অংশ', notInList: 'বিক্রেতার নাম তালিকায় নেই', typeSellerName: 'বিক্রেতার নাম লিখুন',
      qArea: 'কতটুকু জমি কিনতে চান?', unit: 'শতাংশ', unitHelp: '১ শতাংশ ≈ ৪৩৬ বর্গফুট',
      plotTotal: function (n, f) { return 'এই দাগের মোট জমি ' + f.num(n) + ' শতাংশ'; },
      qDeed: 'বিক্রেতার নিজের দলিল নম্বর জানেন?', optional: 'ঐচ্ছিক', deedPh: 'যেমন: 1234/2020',
      deedHelp: 'বিক্রেতা যে দলিলে জমিটি কিনেছিলেন তার নম্বর। না জানলে এড়িয়ে যান।',
      reviewTitle: 'তথ্য মিলিয়ে নিন', rPlace: 'স্থান', rDag: 'দাগ', rSeller: 'বিক্রেতা', rArea: 'জমির পরিমাণ', rDeed: 'বিক্রেতার দলিল',
      notGiven: 'দেওয়া হয়নি', startCheck: 'যাচাই শুরু করুন',
      checking: 'রেকর্ড মিলিয়ে দেখা হচ্ছে…', chkKhatian: 'খতিয়ান', chkDeed: 'দলিল', chkNamjari: 'নামজারি',
      // Results
      head: {
        red: 'গুরুতর অমিল পাওয়া গেছে — টাকা দেওয়ার আগে ভূমি অফিসে যাচাই করুন',
        yellow: 'কিছু বিষয় যাচাই করা দরকার',
        green: 'আমাদের নমুনা রেকর্ডে কোনো অমিল পাওয়া যায়নি',
        grey: 'এই জমির তথ্য আমাদের নমুনা রেকর্ডে নেই'
      },
      greenNote: 'এর মানে এই নয় যে জমিটি নিরাপদ বা আইনিভাবে যাচাইকৃত।',
      issuesFound: function (n, f) { return f.num(n) + 'টি বিষয় পাওয়া গেছে'; },
      inShort: 'সংক্ষেপে', hearResult: 'ফলাফল শুনুন',
      level: { high: 'উচ্চ', medium: 'মাঝারি', info: 'তথ্য' },
      seeEvidence: 'প্রমাণ দেখুন', whatNext: 'এখন কী করবেন', history: 'জমির ইতিহাস', report: 'রিপোর্ট প্রিন্ট / PDF', newCheck: 'নতুন যাচাই',
      infoOnly: 'শুধু জানার জন্য',
      areaSkipped: 'বিক্রেতার অংশ জানা নেই, তাই জমির পরিমাণ মিলিয়ে দেখা যায়নি।',
      checkAgainDetails: 'তথ্য আবার দেখুন',
      didYouMean: 'এই মৌজায় নমুনা রেকর্ডে আছে এমন দাগ:',
      sampleBanner: 'নমুনা উদাহরণ', seeInputs: 'তথ্য দেখুন',
      bar: { sold: 'আগে বিক্রি', left: 'বাকি', want: 'আপনি চান', over: function (n, f) { return f.num(n) + ' শতাংশ বেশি'; }, owns: 'রেকর্ডে মালিকানা' },
      disclaimerTitle: 'গুরুত্বপূর্ণ',
      disclaimer: DISCLAIMER_BN,
      // Evidence
      evTitle: 'রেকর্ডে যা পাওয়া গেছে', backToResult: 'ফলাফলে ফিরুন', mismatch: 'অমিল',
      khatianCard: function (k, f) { return 'খতিয়ান ' + f.num(k); },
      deedCard: function (d, f) { return 'দলিল ' + d; },
      namjariCard: function (c) { return 'নামজারি কেস ' + c; },
      fOwner: 'মালিক', fShare: 'অংশ', fDate: 'তারিখ', fSeller: 'বিক্রেতা', fBuyer: 'ক্রেতা', fArea: 'পরিমাণ',
      fNamjari: 'নামজারি', fApplicant: 'আবেদনকারী', fStatus: 'অবস্থা', fBasis: 'ভিত্তি', fDag: 'দাগ', fPlotArea: 'দাগের মোট জমি', fTotal: 'মোট অংশ',
      done: 'হয়েছে ✓', notDone: 'হয়নি ✗',
      status: { approved: 'অনুমোদিত', pending: 'চলমান', rejected: 'বাতিল' },
      basis: { deed: 'দলিল', inheritance: 'উত্তরাধিকার দাবি' },
      // History
      histTitle: 'জমির ইতিহাস', histKhatian: function (e, f) { return f.survey(e.survey) + ' খতিয়ান: ' + e.owners; },
      histDeed: function (e, f) { return e.seller + ' → ' + e.buyer + ', ' + f.num(e.area) + ' শতাংশ (দলিল ' + e.deedNo + ')'; },
      histNamjari: function (e) { return 'নামজারি ' + e.caseNo + ': ' + e.applicant + ' — ' + e.status; },
      // Report
      reportTitle: 'নমুনা যাচাই রিপোর্ট', reportRef: 'রেফারেন্স', reportDate: 'তৈরির সময়', print: 'প্রিন্ট / PDF সংরক্ষণ',
      watermark: 'নমুনা — আইনি দলিল নয়',
      // Samples & Judge
      samplesTitle: 'নমুনা উদাহরণ', samplesLead: 'একটি উদাহরণ চাপুন — সাথে সাথে ফলাফল দেখুন।',
      judgeTitle: 'বিচারক মোড', judgeLead: 'লাইভ ডেমো ও স্বয়ংক্রিয় পরীক্ষা। সব পরিবর্তন শুধু এই ব্রাউজারের মেমরিতে থাকে।',
      demoTitle: 'নমুনা বিক্রয় যোগ করুন', demoBanner: 'ডেমো মোড — শুধু উপস্থাপনার জন্য',
      buyer: 'ক্রেতা', saleDate: 'তারিখ', namjariDone: 'নামজারি হয়েছে?', yes: 'হ্যাঁ', no: 'না',
      addSale: 'বিক্রয় যোগ করুন', saleAdded: 'নমুনা বিক্রয় যোগ হয়েছে। এখন আবার যাচাই করুন।',
      checkAgain: 'আবার যাচাই করুন', resetData: 'আগের অবস্থায় ফেরান', resetDone: 'নমুনা তথ্য আগের অবস্থায় ফেরানো হয়েছে।',
      demoScript: 'এক চাপে ডেমো: রহিম উদ্দিন ৪০ শতাংশ বিক্রি করলেন',
      runTests: 'সব পরীক্ষা চালান', testsPass: function (a, b, f) { return f.num(a) + ' / ' + f.num(b) + ' পরীক্ষা সফল'; },
      addedSales: function (n, f) { return 'যোগ করা নমুনা বিক্রয়: ' + f.num(n) + 'টি'; },
      // Help
      helpTitle: 'সাহায্য', glossaryTitle: 'শব্দের অর্থ', faqTitle: 'সাধারণ প্রশ্ন', hotlineTitle: 'সহায়তা',
      hotlineLand: 'ভূমি সেবা হটলাইন (সরকারি)', hotlineLegal: 'বিনামূল্যে সরকারি আইনি সহায়তা (NLASO)',
      aboutTitle: 'এই প্রকল্প সম্পর্কে',
      about: 'TerraShield — টিম TerraSync-এর DIU LandTech 2026 হ্যাকাথন প্রোটোটাইপ (P3: জালিয়াতি ও একাধিকবার বিক্রি শনাক্তকরণ)। এটি কোনো সরকারি ওয়েবসাইট বা সেবা নয় এবং কোনো সরকারি সিস্টেমের সাথে যুক্ত নয়। সব নাম, স্থান ও রেকর্ড কাল্পনিক।',
      glossary: [
        ['খতিয়ান', 'জমির মালিকানার সরকারি রেকর্ড। কার নামে কোন দাগে কতটুকু জমি আছে, তা লেখা থাকে।'],
        ['দাগ', 'মৌজার ম্যাপে প্রতিটি জমির টুকরার নম্বর।'],
        ['মৌজা', 'জমির হিসাবের জন্য একটি গ্রাম বা এলাকার সরকারি একক।'],
        ['দলিল', 'জমি বিক্রি বা হস্তান্তরের নিবন্ধিত কাগজ, যা সাব-রেজিস্ট্রি অফিসে নিবন্ধন হয়।'],
        ['নামজারি', 'জমি কেনার পর খতিয়ানে নতুন মালিকের নাম তোলা। এটি না হলে পুরনো মালিকের নাম রেকর্ডে থেকে যায়।'],
        ['শতাংশ', 'জমি মাপার একক। ১ শতাংশ ≈ ৪৩৬ বর্গফুট।']
      ],
      faq: [
        ['সবুজ ফল মানে কি জমি নিরাপদ?', 'না। এর মানে শুধু আমাদের নমুনা রেকর্ডে কোনো অমিল পাওয়া যায়নি। কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।'],
        ['এখানে কি আসল জমির তথ্য আছে?', 'না। সব তথ্য কাল্পনিক নমুনা। কোনো সরকারি ওয়েবসাইট বা সিস্টেম থেকে তথ্য নেওয়া হয়নি।'],
        ['লাল ফল মানে কি বিক্রেতা প্রতারক?', 'না। এর মানে রেকর্ডগুলো একে অপরের সাথে মিলছে না। কারণ জানতে ভূমি অফিসে যাচাই করুন।'],
        ['আমার তথ্য কি কোথাও জমা থাকে?', 'না। কোনো অ্যাকাউন্ট নেই, কোনো সার্ভারে তথ্য পাঠানো হয় না। কণ্ঠ ইনপুট ব্যবহার করলে ব্রাউজার আপনার কথা প্রক্রিয়া করতে ইন্টারনেটে পাঠাতে পারে; আমরা কোনো রেকর্ডিং রাখি না।'],
        ['কণ্ঠ ইনপুট কাজ করছে না কেন?', 'কণ্ঠ ইনপুট মূলত Android ও কম্পিউটারের Chrome-এ এবং ইন্টারনেট থাকলে কাজ করে। না হলে লিখে তথ্য দিন।']
      ],
      // Voice panel
      listening: 'শুনছি… বলুন', sayExample: 'যেমন: "এক শূন্য তিন" বা "একশো তিন"', youSaid: 'আপনি বলেছেন:',
      correct: 'ঠিক আছে', sayAgain: 'আবার বলুন', typeInstead: 'লিখে দিন', stop: 'বন্ধ করুন',
      notUnderstood: 'বুঝতে পারিনি। অনুগ্রহ করে আবার বলুন।',
      notUnderstood2: 'বুঝতে পারিনি। অনুগ্রহ করে লিখে দিন।',
      micDenied: 'মাইক্রোফোন ব্যবহারের অনুমতি দেওয়া হয়নি। আপনি লিখেও তথ্য দিতে পারেন।',
      noRecognition: 'এই ব্রাউজারে কণ্ঠ ইনপুট কাজ করে না — Chrome ব্যবহার করুন বা লিখে দিন।',
      noNetVoice: 'কণ্ঠ ইনপুটের জন্য ইন্টারনেট লাগে। লিখে দিন।',
      noBnVoice: 'এই ডিভাইসে বাংলা কণ্ঠ নেই — লেখাটি পড়ে নিন।',
      voicePrivacy: 'কণ্ঠ ইনপুট ব্রাউজারের সেবা ব্যবহার করে; আপনার কথা প্রক্রিয়ার জন্য ইন্টারনেটে যেতে পারে। TerraShield কোনো রেকর্ডিং রাখে না।',
      // Errors
      err: {
        mouza_required: 'একটি মৌজা বাছাই করুন',
        dag_required: 'দাগ নম্বর লিখুন (যেমন: ১০৩)',
        dag_digits: 'দাগ নম্বর শুধু সংখ্যা হবে, যেমন: ১২৩',
        area_required: 'জমির পরিমাণ লিখুন (যেমন: ২০)',
        area_number: 'জমির পরিমাণ সংখ্যায় লিখুন (যেমন: ২০)',
        area_positive: 'পরিমাণ ০-এর বেশি হতে হবে',
        area_too_big: function (p, f) { return 'এই দাগের মোট জমি ' + f.num(p.total) + ' শতাংশ — পরিমাণ আবার দেখুন'; },
        seller_required: 'একজন বিক্রেতা বাছাই করুন, অথবা নাম লিখুন',
        deed_format: 'দলিল নম্বর এভাবে লিখুন: 1234/2020'
      },
      // Rules
      rules: {
        R1: { t: 'বিক্রেতা আগে এই জমির কিছু অংশ বিক্রি করেছেন, কিন্তু নামজারি হয়নি',
              d: function (e, f) { return 'খতিয়ান ' + f.num(e.khatianNo) + '-এ বিক্রেতা এখনো ' + f.num(e.share) + ' শতাংশের মালিক দেখায়, কারণ ' + e.deeds.map(function (x) { return 'দলিল ' + x.deedNo + ' (' + f.num(x.area) + ' শতাংশ, ' + f.date(x.date) + ')'; }).join(', ') + '-এর নামজারি হয়নি।'; } },
        R2: { t: 'বিক্রেতার রেকর্ডে যতটুকু জমি বাকি আছে, তার চেয়ে বেশি বিক্রি হচ্ছে',
              d: function (e, f) { return 'রেকর্ডে মালিকানা ' + f.num(e.S) + ' শতাংশ, আগে বিক্রি ' + f.num(e.A) + ' শতাংশ, বাকি ' + f.num(Math.max(e.L, 0)) + ' শতাংশ — কিন্তু আপনি ' + f.num(e.W) + ' শতাংশ কিনতে চান।'; } },
        R3: { t: 'বিক্রেতার নাম সর্বশেষ খতিয়ানে নেই',
              d: function (e, f) { return (e.sellerName ? '"' + e.sellerName + '" ' : 'এই বিক্রেতা ') + 'খতিয়ান ' + f.num(e.khatianNo || '—') + '-এর মালিকদের তালিকায় নেই। উত্তরাধিকার বা নামজারি না হওয়া কেনার কারণেও এমন হতে পারে — কাগজপত্র যাচাই করুন।'; } },
        R4: { t: 'রেকর্ড অনুযায়ী এই জমি একাধিক ব্যক্তির কাছে বিক্রি হয়েছে',
              d: function (e, f) { return 'বিক্রেতার অংশ ' + f.num(e.S) + ' শতাংশ, কিন্তু খতিয়ানের পরের দলিলগুলোতে মোট ' + f.num(e.A) + ' শতাংশ বিক্রি দেখা যায়।'; } },
        R5: { t: 'এই জমিতে অন্য একজনের নামজারি আবেদন চলমান',
              d: function (e, f) { return e.cases.map(function (c) { return 'কেস ' + c.caseNo + ': ' + f.person(c.applicantId) + ' (' + f.date(c.date) + ')'; }).join(', ') + '।'; } },
        R6: { t: 'খতিয়ানে মোট অংশ দাগের মোট জমির চেয়ে বেশি',
              d: function (e, f) { return 'মালিকদের মোট অংশ ' + f.num(e.totalShares) + ' শতাংশ, কিন্তু দাগে মোট জমি ' + f.num(e.plotArea) + ' শতাংশ।'; } },
        R7a: { t: 'তারিখে অসঙ্গতি আছে — কেনার আগেই বিক্রির দলিল',
               d: function (e, f) { return 'বিক্রেতা জমিটি কিনেছেন ' + f.date(e.acquiredDeed.date) + ' (দলিল ' + e.acquiredDeed.deedNo + '), কিন্তু ' + e.saleDeeds.map(function (x) { return f.date(x.date) + ' তারিখে দলিল ' + x.deedNo; }).join(', ') + '-এ তিনি বিক্রেতা।'; } },
        R7b: { t: 'জমিটি অল্প সময়ে হাতবদল হয়েছে',
               d: function (e, f) { return f.person(e.personId) + ' জমিটি কেনার ' + f.num(e.days) + ' দিনের মধ্যে বিক্রি করেছেন। দ্রুত বিক্রি নিজে কোনো সমস্যা নয় — শুধু জানার জন্য।'; } },
        R8a: { t: 'বিক্রেতার দলিল নমুনা রেকর্ডে পাওয়া যায়নি',
               d: function (e) { return 'দলিল নম্বর ' + e.deedNo + ' আমাদের নমুনা রেকর্ডে নেই। নম্বরটি আবার দেখুন বা সাব-রেজিস্ট্রি অফিসে যাচাই করুন।'; } },
        R8b: { t: 'বিক্রেতার মালিকানার দলিলের তথ্য রেকর্ডের সাথে মেলে না',
               d: function (e, f) { var m = { buyer: 'দলিলের ক্রেতা বিক্রেতা নন', dag: 'দাগ ভিন্ন', area: 'দলিলের জমি কম' }; return 'দলিল ' + e.deed.deedNo + ': ' + e.problems.map(function (p) { return m[p]; }).join(', ') + '।'; } },
        R8c: { t: 'একই নম্বরের একাধিক দলিল রেকর্ডে আছে',
               d: function (e, f) { return 'দলিল নম্বর ' + e.deedNo + ' রেকর্ডে ' + f.num(e.deeds.length) + 'বার আছে, ভিন্ন ক্রেতা বা তারিখসহ।'; } }
      },
      steps: {
        office: 'এসি ল্যান্ড / ইউনিয়ন ভূমি অফিসে খতিয়ান ও নামজারির অবস্থা জেনে নিন',
        copy: 'সাব-রেজিস্ট্রি অফিস থেকে দলিলের সার্টিফাইড কপি তুলে মিলিয়ে দেখুন',
        hotline: 'ভূমি সেবা হটলাইন ১৬১২২-এ ফোন করুন',
        lawyer: 'কেনার আগে একজন আইনজীবীর পরামর্শ নিন',
        noPay: 'বিষয়টি পরিষ্কার না হওয়া পর্যন্ত টাকা বা বায়না দেবেন না',
        heirs: 'উত্তরাধিকার হলে ওয়ারিশ সনদ ও সব ওয়ারিশের সম্মতি দেখুন',
        greenSteps: 'তবুও কেনার আগে ভূমি অফিসে সর্বশেষ খতিয়ান ও নামজারি যাচাই করুন'
      },
      summary: {
        red: 'রেকর্ডে গুরুতর অমিল পাওয়া গেছে।', yellow: 'কিছু বিষয় যাচাই করা দরকার।',
        green: 'আমাদের নমুনা রেকর্ডে কোনো অমিল পাওয়া যায়নি, তবে এর মানে জমিটি নিরাপদ নয়।',
        advice: 'টাকা দেওয়ার আগে ভূমি অফিসে যাচাই করুন।'
      },
      survey: { 'BS': 'বিএস', 'BS (updated by namjari)': 'বিএস (নামজারির পর হালনাগাদ)' },
      voiceQ: { mouza: 'জমিটি কোন মৌজায়? একটি বাছাই করুন।', dag: 'দাগ নম্বর বলুন বা লিখুন।', seller: 'বিক্রেতার নাম চাপুন।', area: 'কত শতাংশ জমি কিনতে চান, বলুন বা লিখুন।', deed: 'বিক্রেতার দলিল নম্বর জানলে লিখুন, না জানলে এড়িয়ে যান।' }
    },

    en: {
      _lang: 'en', _speech: 'en-US',
      appTagline: 'Check before you buy land',
      sampleBadge: 'Sample data',
      langSwitch: 'বাংলা',
      voiceOn: 'Voice help on', voiceOff: 'Voice help off',
      back: 'Back', next: 'Next', skip: 'Skip', change: 'Change',
      home: 'Home', samples: 'Samples', help: 'Help',
      listen: 'Listen', speak: 'Speak',
      homeTitle: 'Check before you buy land',
      homeLead: 'See whether the seller already sold this land, or whether the records don\'t match — before you pay.',
      ctaCheck: 'Check a Land', ctaSample: 'Try a Sample',
      howTitle: 'How it works',
      how1: 'Enter land details', how2: 'Choose the seller', how3: 'See the result',
      fictionalNote: 'This is a hackathon prototype. All data is fictional sample data — not affiliated with any government body.',
      stepOf: function (a, b) { return 'Step ' + a + ' of ' + b; },
      qWhere: 'Where is the land?', district: 'District', upazila: 'Upazila', mouza: 'Mouza', choose: 'Choose',
      lockedHint: 'This prototype has one fictional district and upazila',
      qDag: 'What is the dag number?', dagPh: 'e.g. 103', dagHelp: 'The dag number is written in the "Dag No." column of the khatian or deed.',
      qSeller: 'Who is the seller?', sellerSub: 'People named in the latest khatian for this plot',
      share: 'Share', notInList: 'Seller not in this list', typeSellerName: 'Type the seller\'s name',
      qArea: 'How much land do you want to buy?', unit: 'decimal', unitHelp: '1 decimal ≈ 436 sq ft',
      plotTotal: function (n) { return 'This plot is ' + n + ' decimal in total'; },
      qDeed: 'Do you know the seller\'s own deed number?', optional: 'Optional', deedPh: 'e.g. 1234/2020',
      deedHelp: 'The number of the deed by which the seller bought this land. Skip if you don\'t know.',
      reviewTitle: 'Check your details', rPlace: 'Place', rDag: 'Dag', rSeller: 'Seller', rArea: 'Area', rDeed: 'Seller\'s deed',
      notGiven: 'Not given', startCheck: 'Start Check',
      checking: 'Comparing records…', chkKhatian: 'Khatian', chkDeed: 'Deeds', chkNamjari: 'Namjari',
      head: {
        red: 'Serious mismatch found — check with the land office before paying',
        yellow: 'Some things need checking',
        green: 'No mismatch found in our sample records',
        grey: 'This land is not in our sample records'
      },
      greenNote: 'This does not mean the land is safe or legally verified.',
      issuesFound: function (n) { return n + (n === 1 ? ' issue found' : ' issues found'); },
      inShort: 'In short', hearResult: 'Hear the Result',
      level: { high: 'High', medium: 'Medium', info: 'Info' },
      seeEvidence: 'See Evidence', whatNext: 'What to Do Next', history: 'Land History', report: 'Print / Save Report', newCheck: 'New Check',
      infoOnly: 'For your information only',
      areaSkipped: 'The seller\'s share is unknown, so the area could not be compared.',
      checkAgainDetails: 'Check details again',
      didYouMean: 'Dags in this mouza that are in the sample records:',
      sampleBanner: 'Sample example', seeInputs: 'See inputs',
      bar: { sold: 'Sold before', left: 'Left', want: 'You want', over: function (n) { return n + ' decimal too much'; }, owns: 'Owned on record' },
      disclaimerTitle: 'Important',
      disclaimer: DISCLAIMER_EN,
      evTitle: 'What the records show', backToResult: 'Back to Result', mismatch: 'mismatch',
      khatianCard: function (k) { return 'Khatian ' + k; },
      deedCard: function (d) { return 'Deed ' + d; },
      namjariCard: function (c) { return 'Namjari case ' + c; },
      fOwner: 'Owner', fShare: 'Share', fDate: 'Date', fSeller: 'Seller', fBuyer: 'Buyer', fArea: 'Area',
      fNamjari: 'Namjari', fApplicant: 'Applicant', fStatus: 'Status', fBasis: 'Basis', fDag: 'Dag', fPlotArea: 'Plot total', fTotal: 'Total shares',
      done: 'Done ✓', notDone: 'Not done ✗',
      status: { approved: 'Approved', pending: 'Pending', rejected: 'Rejected' },
      basis: { deed: 'Deed', inheritance: 'Inheritance claim' },
      histTitle: 'Land History', histKhatian: function (e, f) { return f.survey(e.survey) + ' khatian: ' + e.owners; },
      histDeed: function (e) { return e.seller + ' → ' + e.buyer + ', ' + e.area + ' decimal (deed ' + e.deedNo + ')'; },
      histNamjari: function (e) { return 'Namjari ' + e.caseNo + ': ' + e.applicant + ' — ' + e.status; },
      reportTitle: 'Sample Check Report', reportRef: 'Reference', reportDate: 'Created', print: 'Print / Save as PDF',
      watermark: 'SAMPLE — NOT A LEGAL DOCUMENT',
      samplesTitle: 'Sample Examples', samplesLead: 'Tap an example to see its result straight away.',
      judgeTitle: 'Judge Mode', judgeLead: 'Live demo and automatic tests. Changes stay only in this browser\'s memory.',
      demoTitle: 'Add a Sample Sale', demoBanner: 'Demo mode — for presentation only',
      buyer: 'Buyer', saleDate: 'Date', namjariDone: 'Namjari done?', yes: 'Yes', no: 'No',
      addSale: 'Add Sale', saleAdded: 'Sample sale added. Now check again.',
      checkAgain: 'Check Again', resetData: 'Reset Sample Data', resetDone: 'Sample data has been reset.',
      demoScript: 'One-tap demo: Rahim Uddin sells 40 decimal',
      runTests: 'Run all tests', testsPass: function (a, b) { return a + ' / ' + b + ' tests pass'; },
      addedSales: function (n) { return 'Sample sales added: ' + n; },
      helpTitle: 'Help', glossaryTitle: 'What the words mean', faqTitle: 'Common questions', hotlineTitle: 'Get help',
      hotlineLand: 'Land service hotline (government)', hotlineLegal: 'Free government legal aid (NLASO)',
      aboutTitle: 'About this project',
      about: 'TerraShield — Team TerraSync\'s prototype for the DIU LandTech 2026 hackathon (P3: Catch Fraud & Double-Selling). It is not a government website or service and is not connected to any government system. All names, places and records are fictional.',
      glossary: [
        ['Khatian (খতিয়ান)', 'The official record of land ownership: who owns how much land in which dag.'],
        ['Dag (দাগ)', 'The number of each piece of land on the mouza map.'],
        ['Mouza (মৌজা)', 'The official unit of a village or area for land records.'],
        ['Deed (দলিল)', 'The registered paper for selling or transferring land, registered at the Sub-Registry office.'],
        ['Namjari (নামজারি)', 'Putting the new owner\'s name in the khatian after buying. Without it, the old owner\'s name stays on record.'],
        ['Decimal (শতাংশ)', 'A unit of land area. 1 decimal ≈ 436 square feet.']
      ],
      faq: [
        ['Does a green result mean the land is safe?', 'No. It only means no mismatch was found in our sample records. Consult the land office and a lawyer before buying.'],
        ['Is real land data used here?', 'No. All data is fictional sample data. Nothing was taken from any government website or system.'],
        ['Does a red result mean the seller is a cheat?', 'No. It means the records don\'t agree with each other. Check with the land office to find out why.'],
        ['Is my information stored anywhere?', 'No. There are no accounts and nothing is sent to a server. If you use voice input, the browser may send your speech over the internet to be processed; we keep no recordings.'],
        ['Why isn\'t voice input working?', 'Voice input works mainly in Chrome on Android and computers, with internet. Otherwise, please type.']
      ],
      listening: 'Listening… please speak', sayExample: 'e.g. "one zero three" or "one hundred three"', youSaid: 'You said:',
      correct: 'Correct', sayAgain: 'Say Again', typeInstead: 'Type Instead', stop: 'Stop',
      notUnderstood: 'Sorry, I couldn\'t understand. Please say it again.',
      notUnderstood2: 'Sorry, I couldn\'t understand. Please type it.',
      micDenied: 'Microphone permission was not given. You can type instead.',
      noRecognition: 'Voice input doesn\'t work in this browser. Use Chrome or type.',
      noNetVoice: 'Voice input needs internet. Please type.',
      noBnVoice: 'This device has no voice for this language — please read the text.',
      voicePrivacy: 'Voice input uses the browser\'s speech service; your speech may go over the internet to be processed. TerraShield keeps no recordings.',
      err: {
        mouza_required: 'Please choose a mouza',
        dag_required: 'Please enter the dag number (e.g. 103)',
        dag_digits: 'Dag number should be numbers only, like 123',
        area_required: 'Please enter the area, e.g. 20',
        area_number: 'Please enter the area as a number, e.g. 20',
        area_positive: 'Area must be more than 0',
        area_too_big: function (p) { return 'This plot is only ' + p.total + ' decimal in total. Please check the amount'; },
        seller_required: 'Please choose a seller, or type the name',
        deed_format: 'Write the deed number like this: 1234/2020'
      },
      rules: {
        R1: { t: 'The seller sold part of this land before, but namjari was not done',
              d: function (e, f) { return 'Khatian ' + e.khatianNo + ' still shows the seller owning ' + e.share + ' decimal, because namjari was not done for ' + e.deeds.map(function (x) { return 'deed ' + x.deedNo + ' (' + x.area + ' decimal, ' + f.date(x.date) + ')'; }).join(', ') + '.'; } },
        R2: { t: 'The seller is selling more land than the records show he has left',
              d: function (e) { return 'Owned on record ' + e.S + ' decimal, sold before ' + e.A + ', left ' + Math.max(e.L, 0) + ' — but you want to buy ' + e.W + ' decimal.'; } },
        R3: { t: 'The seller\'s name is not in the latest khatian',
              d: function (e) { return (e.sellerName ? '"' + e.sellerName + '"' : 'This seller') + ' is not among the owners in khatian ' + (e.khatianNo || '—') + '. This can also happen with inheritance or an unrecorded purchase — get the documents checked.'; } },
        R4: { t: 'Records show this land was sold to more than one person',
              d: function (e) { return 'The seller\'s share is ' + e.S + ' decimal, but deeds after the khatian add up to ' + e.A + ' decimal sold.'; } },
        R5: { t: 'Someone else has a pending namjari application on this land',
              d: function (e, f) { return e.cases.map(function (c) { return 'Case ' + c.caseNo + ': ' + f.person(c.applicantId) + ' (' + f.date(c.date) + ')'; }).join(', ') + '.'; } },
        R6: { t: 'The khatian shares add up to more than the plot\'s total area',
              d: function (e) { return 'Owners\' shares total ' + e.totalShares + ' decimal, but the plot is only ' + e.plotArea + ' decimal.'; } },
        R7a: { t: 'The dates don\'t match up — a sale deed dated before he bought it',
               d: function (e, f) { return 'The seller bought this land on ' + f.date(e.acquiredDeed.date) + ' (deed ' + e.acquiredDeed.deedNo + '), but he is the seller in ' + e.saleDeeds.map(function (x) { return 'deed ' + x.deedNo + ' dated ' + f.date(x.date); }).join(', ') + '.'; } },
        R7b: { t: 'The land changed hands quickly',
               d: function (e, f) { return f.person(e.personId) + ' sold the land within ' + e.days + ' days of buying it. A quick resale is not a problem by itself — for your information only.'; } },
        R8a: { t: 'The seller\'s deed was not found in the sample records',
               d: function (e) { return 'Deed number ' + e.deedNo + ' is not in our sample records. Check the number, or verify at the Sub-Registry office.'; } },
        R8b: { t: 'The seller\'s ownership deed does not match the records',
               d: function (e) { var m = { buyer: 'the buyer on the deed is not the seller', dag: 'different dag', area: 'the deed covers less land' }; return 'Deed ' + e.deed.deedNo + ': ' + e.problems.map(function (p) { return m[p]; }).join(', ') + '.'; } },
        R8c: { t: 'More than one deed with the same number exists in the records',
               d: function (e) { return 'Deed number ' + e.deedNo + ' appears ' + e.deeds.length + ' times, with different buyers or dates.'; } }
      },
      steps: {
        office: 'Ask the AC Land / Union Land Office about the khatian and namjari status',
        copy: 'Get a certified copy of the deed from the Sub-Registry office and compare',
        hotline: 'Call the land service hotline 16122',
        lawyer: 'Talk to a lawyer before buying',
        noPay: 'Don\'t pay any money or advance until this is clear',
        heirs: 'If it is inheritance, check the heirs\' certificate and all heirs\' consent',
        greenSteps: 'Even so, check the latest khatian and namjari at the land office before buying'
      },
      summary: {
        red: 'Serious mismatches were found in the records.', yellow: 'Some things need checking.',
        green: 'No mismatch was found in our sample records, but this does not mean the land is safe.',
        advice: 'Check with the land office before paying.'
      },
      survey: { 'BS': 'BS', 'BS (updated by namjari)': 'BS (updated after namjari)' },
      voiceQ: { mouza: 'Which mouza is the land in? Choose one.', dag: 'Say or type the dag number.', seller: 'Tap the seller\'s name.', area: 'Say or type how many decimal you want to buy.', deed: 'Type the seller\'s deed number if you know it, or skip.' }
    }
  };

  // Which next steps to show for each rule (most useful first).
  root.TS.nextStepsFor = {
    R1: ['office', 'noPay', 'lawyer'], R2: ['noPay', 'office', 'lawyer'], R3: ['heirs', 'office', 'lawyer'],
    R4: ['noPay', 'copy', 'lawyer'], R5: ['office', 'hotline'], R6: ['office', 'hotline'],
    R7a: ['copy', 'lawyer', 'noPay'], R7b: [], R8a: ['copy', 'office'], R8b: ['copy', 'lawyer'], R8c: ['copy', 'noPay', 'lawyer']
  };

  // Hotline settings. 16430 (NLASO legal aid) stays OFF until the team confirms by phone
  // that it is active and helps with land disputes (approved decision).
  root.TS.config = { showLegalAidHotline: false, landHotline: '16122', legalAidHotline: '16430' };
})(typeof self !== 'undefined' ? self : this);
