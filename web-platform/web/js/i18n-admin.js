/*
 * TerraShield — i18n-admin.js : words for the Admin Panel (#/admin) and the website's
 * "admin-approved record" labels. Adds T.admin + a few website keys to TS.i18n.bn / TS.i18n.en.
 * Wording rule: "approved/অনুমোদিত" always means "a team admin looked at it" — never official verification.
 */
(function (root) {
  'use strict';
  var bn = root.TS.i18n.bn, en = root.TS.i18n.en;

  // ---- Website labels ----
  bn.adminTag = 'অ্যাডমিন যোগ করা (কাল্পনিক)';
  en.adminTag = 'added by admin (fictional)';
  bn.adminKinds = { plot: 'দাগ রেকর্ড', khatian: 'খতিয়ান', deed: 'দলিল', namjari: 'নামজারি' };
  en.adminKinds = { plot: 'dag record', khatian: 'khatian', deed: 'deed', namjari: 'namjari' };
  bn.adminUsedTitle = 'এই যাচাইয়ে অ্যাডমিন-অনুমোদিত রেকর্ড ব্যবহার হয়েছে।';
  en.adminUsedTitle = 'This check used admin-approved records.';
  bn.adminUsedText = 'রেকর্ডগুলো টিমের অ্যাডমিন যোগ করেছেন ও দেখেছেন — এগুলোও কাল্পনিক, সরকারি রেকর্ড বা সরকারি যাচাই নয়।';
  en.adminUsedText = 'A team admin added and looked at these records — they are fictional too, not government records or official verification.';
  bn.footerAdmin = 'অ্যাডমিন'; en.footerAdmin = 'Admin';
  bn.adminNav = 'অ্যাডমিন প্যানেল'; en.adminNav = 'Admin Panel';           // header button + mobile menu

  bn.admin = {
    title: 'অ্যাডমিন প্যানেল', tag: 'localhost প্রোটোটাইপ', tagLocal: 'অফলাইন প্রোটোটাইপ · এই ব্রাউজার',

    serverDown: 'সার্ভারের সাথে যোগাযোগ হচ্ছে না। সার্ভার চালু আছে কি না দেখুন, তারপর আবার চেষ্টা করুন।',
    retry: 'আবার চেষ্টা করুন', loading: 'লোড হচ্ছে…', backSite: 'ওয়েবসাইটে ফিরুন',
    login: { title: 'অ্যাডমিন লগইন', email: 'ইমেইল', password: 'পাসওয়ার্ড', show: 'দেখান', hide: 'লুকান', submit: 'লগইন করুন', busy: 'যাচাই হচ্ছে…',
      bad: 'ইমেইল বা পাসওয়ার্ড ঠিক নয়।', locked: function (m, f) { return 'অনেকবার ভুল চেষ্টা হয়েছে। ' + f.num(m) + ' মিনিট পরে আবার চেষ্টা করুন।'; },
      expired: 'সেশন শেষ হয়েছে — আবার লগইন করুন।', loggedOut: 'লগআউট হয়েছে।', required: 'ইমেইল ও পাসওয়ার্ড দুটোই দিন।' },
    nav: { dashboard: 'ড্যাশবোর্ড', records: 'রেকর্ড', review: 'পর্যালোচনা', new: 'নতুন রেকর্ড', log: 'পরিবর্তনের লগ', settings: 'সেটিংস' },
    navLabel: 'অ্যাডমিন মেনু', signedIn: 'লগইন করা আছেন', logout: 'লগআউট', viewSite: 'ওয়েবসাইট',
    status: { draft: 'খসড়া', reviewed: 'অনুমোদিত', rejected: 'বাতিল', archived: 'আর্কাইভ' },
    statusHint: { draft: 'পর্যালোচনার অপেক্ষায় — ফলাফলে ব্যবহার হয় না', reviewed: 'ওয়েবসাইটের যাচাইয়ে ব্যবহার হচ্ছে', rejected: 'ফলাফলে ব্যবহার হয় না', archived: 'সরিয়ে রাখা — ফলাফলে ব্যবহার হয় না' },
    types: { plot: 'দাগ (প্লট)', khatian: 'খতিয়ান', deed: 'দলিল', namjari: 'নামজারি' },
    typeHint: { plot: 'নতুন দাগ ও তার মোট জমি', khatian: 'দাগের মালিক ও তাঁদের অংশ', deed: 'জমি বিক্রি বা হস্তান্তর', namjari: 'নামজারির আবেদন ও অবস্থা' },
    dash: { title: 'ড্যাশবোর্ড', live: function (n, f) { return 'এখন ' + f.num(n) + 'টি অনুমোদিত অ্যাডমিন রেকর্ড ওয়েবসাইটের যাচাইয়ে ব্যবহার হচ্ছে।'; },
      base: function (n, f) { return 'কাল্পনিক মূল রেকর্ড ' + f.num(n) + 'টি — এগুলো শুধু পড়া যায়, বদলানো যায় না।'; },
      waiting: 'পর্যালোচনার অপেক্ষায়', none: 'এখন কিছু অপেক্ষায় নেই।', recent: 'সাম্প্রতিক কাজ', checkSite: 'ওয়েবসাইটে যাচাই করে দেখুন', reviewNow: 'পর্যালোচনা', addNew: 'নতুন রেকর্ড যোগ করুন' },
    records: { title: 'রেকর্ড', statusFilter: 'অবস্থা', typeFilter: 'ধরন', all: 'সব', allTypes: 'সব ধরন', empty: 'এই ফিল্টারে কোনো রেকর্ড নেই।', open: 'খুলুন', edit: 'সম্পাদনা', updated: 'হালনাগাদ' },
    review: { title: 'পর্যালোচনা', lead: 'খসড়া রেকর্ডগুলো খুলে কাল্পনিক উৎস কাগজের সাথে মিলিয়ে অনুমোদন বা বাতিল করুন। অনুমোদনের পরেই রেকর্ডটি ওয়েবসাইটের ফলাফলে ব্যবহার হবে।' },
    detail: { fields: 'রেকর্ডের তথ্য', history: 'ইতিহাস', related: 'একই দাগের অন্য রেকর্ড', relatedNone: 'একই দাগে আর কোনো রেকর্ড নেই।', base: 'মূল · কাল্পনিক', admin: 'অ্যাডমিন',
      approveTitle: 'অনুমোদন দিন', confirm: 'আমি রেকর্ডটি কাল্পনিক উৎস কাগজের সাথে মিলিয়ে দেখেছি এবং এতে কোনো আসল ব্যক্তিগত তথ্য নেই।', approve: 'অনুমোদন দিন',
      rejectTitle: 'বাতিল করুন', reason: 'বাতিলের কারণ (আবশ্যক)', reject: 'বাতিল করুন', archiveTitle: 'আর্কাইভ', archiveText: 'আর্কাইভ করলে রেকর্ডটি আর ফলাফলে ব্যবহার হবে না। পরে খসড়ায় ফেরানো যায়।', archive: 'আর্কাইভ করুন',
      restore: 'খসড়া হিসেবে ফেরান', note: 'নোট (ঐচ্ছিক)', edit: 'সম্পাদনা করুন', editWarn: 'সম্পাদনা করলে রেকর্ডটি আবার খসড়া হবে — নতুন করে অনুমোদন লাগবে।',
      blockers: { plot_not_live: 'আগে এই দাগের প্লট রেকর্ড অনুমোদন দিন।', deed_not_live: 'আগে সংযুক্ত দলিলটি অনুমোদন দিন।' },
      deps: function (list) { return 'এই রেকর্ডের উপর নির্ভর করে: ' + list + '। আগে সেগুলো আর্কাইভ করুন।'; },
      rejectReason: 'বাতিলের কারণ', liveNow: 'এই রেকর্ড এখন ওয়েবসাইটের যাচাইয়ে ব্যবহার হচ্ছে।', created: 'তৈরি', reviewedBy: 'অনুমোদন করেছেন', back: 'সব রেকর্ড' },
    form: { newTitle: 'নতুন রেকর্ড', editTitle: function (id) { return 'রেকর্ড সম্পাদনা · ' + id; }, chooseType: 'কী ধরনের রেকর্ড?',
      mouza: 'মৌজা', dag: 'দাগ নম্বর', totalArea: 'দাগের মোট জমি (শতাংশ)', khatianNo: 'খতিয়ান নম্বর', survey: 'জরিপ', recordDate: 'রেকর্ডের তারিখ',
      owners: 'মালিক ও অংশ', owner: 'মালিক', share: 'অংশ (শতাংশ)', addOwner: 'আরেকজন মালিক', removeOwner: 'সরান',
      deedNo: 'দলিল নম্বর', deedNoHelp: 'নম্বর/সাল, যেমন 0123/2024', date: 'তারিখ', seller: 'বিক্রেতা (দাতা)', buyer: 'ক্রেতা (গ্রহীতা)', area: 'জমির পরিমাণ (শতাংশ)',
      caseNo: 'নামজারি কেস নম্বর', caseHelp: 'যেমন N-900', applicant: 'আবেদনকারী', basis: 'ভিত্তি', basisOpts: { deed: 'দলিল', inheritance: 'উত্তরাধিকার' }, deed: 'সংযুক্ত দলিল',
      njStatus: 'নামজারির অবস্থা (রেকর্ডে যেমন লেখা)', njOpts: { pending: 'চলমান', approved: 'অনুমোদিত', rejected: 'নামঞ্জুর' },
      note: 'অ্যাডমিন নোট (ঐচ্ছিক)', choose: 'বাছুন…', peopleHelp: 'নাম শুধু কাল্পনিক ব্যক্তিদের তালিকা থেকে বাছাই করা যায় — আসল নাম লেখার সুযোগ নেই।',
      save: 'খসড়া হিসেবে সংরক্ষণ', saving: 'সংরক্ষণ হচ্ছে…', cancel: 'বাদ দিন', saved: 'খসড়া সংরক্ষিত — অনুমোদন না দেওয়া পর্যন্ত ফলাফলে ব্যবহার হবে না।',
      savedBack: 'সম্পাদনা সংরক্ষিত — রেকর্ডটি আবার খসড়া হয়েছে।', fixErrors: 'লাল চিহ্নিত ঘরগুলো ঠিক করুন।', warnTitle: 'জেনে রাখুন' },
    err: { mouza_invalid: 'মৌজা বাছুন', dag_invalid: '১ থেকে ৯৯৯৯৯ এর মধ্যে দাগ নম্বর লিখুন', area_invalid: '০-এর বেশি সঠিক পরিমাণ লিখুন', plot_exists: 'এই মৌজায় এই দাগ আগেই আছে',
      plot_missing: 'এই দাগের প্লট রেকর্ড নেই — আগে "দাগ (প্লট)" রেকর্ড যোগ করুন', khatian_exists: 'এই দাগের খতিয়ান আগেই আছে', khatian_invalid: 'শুধু সংখ্যা/ইংরেজি অক্ষর, যেমন 250',
      survey_invalid: 'জরিপ বাছুন', date_invalid: 'সঠিক তারিখ দিন', date_future: 'ভবিষ্যতের তারিখ হতে পারে না', owners_required: 'অন্তত একজন মালিক দিন', person_invalid: 'তালিকা থেকে একজন বাছুন',
      owner_duplicate: 'একই মালিক দুবার দেওয়া হয়েছে', deedno_invalid: 'নম্বর/সাল আকারে লিখুন, যেমন 0123/2024', same_person: 'বিক্রেতা ও ক্রেতা একই হতে পারেন না', case_invalid: 'যেমন N-900',
      case_exists: 'এই কেস নম্বর আগেই আছে', basis_invalid: 'ভিত্তি বাছুন', deed_missing: 'দলিল বাছুন', deed_other_dag: 'দলিলটি অন্য দাগের', njstatus_invalid: 'অবস্থা বাছুন',
      nid_like: '১০ বা তার বেশি অঙ্কের নম্বর (এনআইডি/ফোনের মতো) লেখা যাবে না', type_invalid: 'ধরন বাছুন', not_draft: 'শুধু খসড়া রেকর্ড অনুমোদন বা বাতিল করা যায়।',
      note_required: 'কারণ লিখুন', confirm_required: 'নিশ্চিতকরণের ঘরে টিক দিন', archived_readonly: 'আর্কাইভ করা রেকর্ড সম্পাদনা করা যায় না — আগে খসড়ায় ফেরান।',
      record_not_found: 'রেকর্ডটি পাওয়া যায়নি।', bad_csrf: 'সেশনে সমস্যা — পাতাটি রিফ্রেশ করে আবার চেষ্টা করুন।', bad_origin: 'অনুরোধটি এই সাইট থেকে আসেনি।',
      already_archived: 'রেকর্ডটি আগেই আর্কাইভ করা।', not_archived: 'রেকর্ডটি আর্কাইভে নেই।', generic: 'কিছু একটা ভুল হয়েছে — আবার চেষ্টা করুন।' },
    warn: { shares_exceed_total: 'মালিকদের মোট অংশ দাগের মোট জমির বেশি — অনুমোদন দিলে ইঞ্জিন এটিকে অমিল (R6) হিসেবে দেখাবে।', area_above_plot: 'বিক্রির পরিমাণ দাগের মোট জমির বেশি।',
      deedno_duplicate: 'এই দলিল নম্বর আগেই আছে — অনুমোদন দিলে ইঞ্জিন এটিকে অমিল (R8c) হিসেবে দেখাবে।' },
    log: { title: 'পরিবর্তনের লগ', lead: 'অ্যাডমিন প্যানেলের প্রতিটি কাজের তালিকা, নতুনগুলো উপরে। পাসওয়ার্ড কখনো লগে রাখা হয় না।', time: 'সময়', who: 'কে', action: 'কাজ', record: 'রেকর্ড', note: 'নোট', empty: 'এখনো কিছু নেই।',
      actions: { create: 'তৈরি', edit: 'সম্পাদনা', approve: 'অনুমোদন', reject: 'বাতিল', archive: 'আর্কাইভ', restore: 'খসড়ায় ফেরানো', reset: 'কাল্পনিক তথ্যে রিসেট', login: 'লগইন', logout: 'লগআউট', login_failed: 'ভুল লগইন চেষ্টা', password_changed: 'পাসওয়ার্ড বদল' } },
    settings: { title: 'সেটিংস', pwTitle: 'পাসওয়ার্ড বদলান', current: 'বর্তমান পাসওয়ার্ড', next: 'নতুন পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)', again: 'নতুন পাসওয়ার্ড আবার লিখুন', change: 'পাসওয়ার্ড বদলান',
      changed: 'পাসওয়ার্ড বদলানো হয়েছে। অন্য সব সেশন বন্ধ করা হয়েছে।', mismatch: 'দুটি নতুন পাসওয়ার্ড মেলেনি।',
      pwErr: { password_short: 'কমপক্ষে ১০ অক্ষর দিন', password_weak: 'পাসওয়ার্ডটি খুব সহজ', password_same: 'নতুন পাসওয়ার্ড পুরোনোটির মতোই', password_is_email: 'পাসওয়ার্ড ইমেইলের মতো হতে পারে না', current_wrong: 'বর্তমান পাসওয়ার্ড ঠিক নয়', password_long: 'পাসওয়ার্ড খুব লম্বা' },
      resetTitle: 'কাল্পনিক তথ্যে রিসেট', resetText: function (n, f) { return 'সব অ্যাডমিন রেকর্ড (' + f.num(n) + 'টি) মুছে যাবে। কাল্পনিক মূল তথ্য, লগইন ও পরিবর্তনের লগ থাকবে। এটি ফেরানো যায় না।'; },
      resetType: 'নিশ্চিত করতে RESET লিখুন', resetBtn: 'রিসেট করুন', resetDone: function (n, f) { return 'রিসেট হয়েছে — ' + f.num(n) + 'টি অ্যাডমিন রেকর্ড সরানো হয়েছে।'; },
      session: 'নিরাপত্তা: সেশন ৩০ মিনিট নিষ্ক্রিয় থাকলে বা ৮ ঘণ্টা পরে নিজে থেকেই বন্ধ হয়। ৫ বার ভুল পাসওয়ার্ডে ১৫ মিনিট লগইন বন্ধ থাকে।' },
    flash: { approved: 'অনুমোদন দেওয়া হয়েছে — রেকর্ডটি এখন ওয়েবসাইটের যাচাইয়ে ব্যবহার হবে।', rejected: 'রেকর্ডটি বাতিল করা হয়েছে।', archived: 'রেকর্ডটি আর্কাইভ করা হয়েছে।', restored: 'রেকর্ডটি খসড়া হিসেবে ফিরেছে।' }
  };

  en.admin = {
    title: 'Admin Panel', tag: 'localhost prototype', tagLocal: 'Offline prototype · this browser',

    serverDown: 'Cannot reach the server. Check that it is running, then try again.',
    retry: 'Try again', loading: 'Loading…', backSite: 'Back to the website',
    login: { title: 'Admin login', email: 'Email', password: 'Password', show: 'Show', hide: 'Hide', submit: 'Log in', busy: 'Checking…',
      bad: 'Email or password is not correct.', locked: function (m) { return 'Too many wrong attempts. Try again in ' + m + ' minutes.'; },
      expired: 'Your session has ended — please log in again.', loggedOut: 'You have logged out.', required: 'Enter both email and password.' },
    nav: { dashboard: 'Dashboard', records: 'Records', review: 'Review', new: 'New record', log: 'Change log', settings: 'Settings' },
    navLabel: 'Admin menu', signedIn: 'Logged in as', logout: 'Log out', viewSite: 'Website',
    status: { draft: 'Draft', reviewed: 'Approved', rejected: 'Rejected', archived: 'Archived' },
    statusHint: { draft: 'Awaiting review — not used in results', reviewed: 'Used in the website\'s checks', rejected: 'Not used in results', archived: 'Put aside — not used in results' },
    types: { plot: 'Dag (plot)', khatian: 'Khatian', deed: 'Deed', namjari: 'Namjari' },
    typeHint: { plot: 'A new dag and its total area', khatian: 'Owners of a dag and their shares', deed: 'A sale or transfer of land', namjari: 'A namjari application and its status' },
    dash: { title: 'Dashboard', live: function (n) { return n + ' approved admin record(s) are now used in the website\'s checks.'; },
      base: function (n) { return n + ' fictional base records — read-only, they cannot be changed.'; },
      waiting: 'Awaiting review', none: 'Nothing is waiting right now.', recent: 'Recent activity', checkSite: 'Try it on the website', reviewNow: 'Review', addNew: 'Add a new record' },
    records: { title: 'Records', statusFilter: 'Status', typeFilter: 'Type', all: 'All', allTypes: 'All types', empty: 'No records for this filter.', open: 'Open', edit: 'Edit', updated: 'Updated' },
    review: { title: 'Review', lead: 'Open each draft, compare it with the fictional source papers, then approve or reject it. Only approved records are used in the website\'s results.' },
    detail: { fields: 'Record details', history: 'History', related: 'Other records on the same dag', relatedNone: 'No other records on this dag.', base: 'base · fictional', admin: 'admin',
      approveTitle: 'Approve', confirm: 'I compared this record with the fictional source papers and it contains no real personal data.', approve: 'Approve',
      rejectTitle: 'Reject', reason: 'Reason for rejecting (required)', reject: 'Reject', archiveTitle: 'Archive', archiveText: 'Archived records are no longer used in results. You can bring them back as a draft later.', archive: 'Archive',
      restore: 'Restore as draft', note: 'Note (optional)', edit: 'Edit', editWarn: 'Editing turns the record back into a draft — it must be approved again.',
      blockers: { plot_not_live: 'Approve the plot record for this dag first.', deed_not_live: 'Approve the linked deed first.' },
      deps: function (list) { return 'These records depend on this one: ' + list + '. Archive them first.'; },
      rejectReason: 'Reason rejected', liveNow: 'This record is now used in the website\'s checks.', created: 'Created', reviewedBy: 'Approved by', back: 'All records' },
    form: { newTitle: 'New record', editTitle: function (id) { return 'Edit record · ' + id; }, chooseType: 'What kind of record?',
      mouza: 'Mouza', dag: 'Dag number', totalArea: 'Total area of the dag (decimal)', khatianNo: 'Khatian number', survey: 'Survey', recordDate: 'Record date',
      owners: 'Owners and shares', owner: 'Owner', share: 'Share (decimal)', addOwner: 'Another owner', removeOwner: 'Remove',
      deedNo: 'Deed number', deedNoHelp: 'number/year, e.g. 0123/2024', date: 'Date', seller: 'Seller (giver)', buyer: 'Buyer (receiver)', area: 'Area (decimal)',
      caseNo: 'Namjari case number', caseHelp: 'e.g. N-900', applicant: 'Applicant', basis: 'Basis', basisOpts: { deed: 'Deed', inheritance: 'Inheritance' }, deed: 'Linked deed',
      njStatus: 'Namjari status (as written in the record)', njOpts: { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' },
      note: 'Admin note (optional)', choose: 'Choose…', peopleHelp: 'Names can only be picked from the list of fictional people — real names cannot be typed.',
      save: 'Save as draft', saving: 'Saving…', cancel: 'Cancel', saved: 'Draft saved — it is not used in results until approved.',
      savedBack: 'Changes saved — the record is a draft again.', fixErrors: 'Please fix the boxes marked in red.', warnTitle: 'Good to know' },
    err: { mouza_invalid: 'Choose a mouza', dag_invalid: 'Enter a dag number from 1 to 99999', area_invalid: 'Enter a correct area above 0', plot_exists: 'This dag already exists in this mouza',
      plot_missing: 'No plot record for this dag — add a "Dag (plot)" record first', khatian_exists: 'This dag already has a khatian', khatian_invalid: 'Digits/English letters only, e.g. 250',
      survey_invalid: 'Choose a survey', date_invalid: 'Enter a correct date', date_future: 'The date cannot be in the future', owners_required: 'Add at least one owner', person_invalid: 'Choose someone from the list',
      owner_duplicate: 'The same owner is listed twice', deedno_invalid: 'Use number/year, e.g. 0123/2024', same_person: 'Seller and buyer cannot be the same person', case_invalid: 'e.g. N-900',
      case_exists: 'This case number already exists', basis_invalid: 'Choose the basis', deed_missing: 'Choose a deed', deed_other_dag: 'That deed is for another dag', njstatus_invalid: 'Choose a status',
      nid_like: 'Numbers with 10 or more digits (like NID/phone numbers) are not allowed', type_invalid: 'Choose a type', not_draft: 'Only draft records can be approved or rejected.',
      note_required: 'Please give a reason', confirm_required: 'Tick the confirmation box', archived_readonly: 'Archived records cannot be edited — restore it as a draft first.',
      record_not_found: 'Record not found.', bad_csrf: 'Session problem — refresh the page and try again.', bad_origin: 'This request did not come from this site.',
      already_archived: 'The record is already archived.', not_archived: 'The record is not archived.', generic: 'Something went wrong — please try again.' },
    warn: { shares_exceed_total: 'The owners\' shares add up to more than the dag\'s total — once approved, the engine will flag this as a conflict (R6).', area_above_plot: 'The area sold is more than the dag\'s total area.',
      deedno_duplicate: 'This deed number already exists — once approved, the engine will flag this as a conflict (R8c).' },
    log: { title: 'Change log', lead: 'Every action in the Admin Panel, newest first. Passwords are never logged.', time: 'Time', who: 'Who', action: 'Action', record: 'Record', note: 'Note', empty: 'Nothing yet.',
      actions: { create: 'Created', edit: 'Edited', approve: 'Approved', reject: 'Rejected', archive: 'Archived', restore: 'Restored as draft', reset: 'Reset to fictional data', login: 'Logged in', logout: 'Logged out', login_failed: 'Failed login attempt', password_changed: 'Password changed' } },
    settings: { title: 'Settings', pwTitle: 'Change password', current: 'Current password', next: 'New password (at least 10 characters)', again: 'New password again', change: 'Change password',
      changed: 'Password changed. All other sessions have been logged out.', mismatch: 'The two new passwords do not match.',
      pwErr: { password_short: 'Use at least 10 characters', password_weak: 'That password is too easy to guess', password_same: 'The new password is the same as the old one', password_is_email: 'The password cannot be your email', current_wrong: 'The current password is not correct', password_long: 'That password is too long' },
      resetTitle: 'Reset to fictional data', resetText: function (n) { return 'All admin records (' + n + ') will be removed. The fictional base data, your login and the change log stay. This cannot be undone.'; },
      resetType: 'Type RESET to confirm', resetBtn: 'Reset', resetDone: function (n) { return 'Reset done — ' + n + ' admin record(s) removed.'; },
      session: 'Security: a session ends after 30 minutes of no activity or after 8 hours. 5 wrong passwords lock login for 15 minutes.' },
    flash: { approved: 'Approved — the record is now used in the website\'s checks.', rejected: 'The record was rejected.', archived: 'The record was archived.', restored: 'The record is a draft again.' }
  };

  // ---- Standalone file (no server): admin data kept in this browser ----
  bn.admin.local = {
    backupTitle: 'ব্যাকআপ', backupText: 'সব অ্যাডমিন রেকর্ড ও পরিবর্তনের লগ একটি ফাইলে নামিয়ে রাখুন (পাসওয়ার্ড থাকে না)। অন্য কম্পিউটার বা ব্রাউজারে "ব্যাকআপ ফেরান" দিয়ে আবার আনা যায়।',
    download: 'ব্যাকআপ ডাউনলোড', importTitle: 'ব্যাকআপ ফেরান', importText: 'ব্যাকআপ ফাইল বাছুন। এই ব্রাউজারের বর্তমান সব অ্যাডমিন রেকর্ড এটি দিয়ে বদলে যাবে; লগইন একই থাকবে।',
    importFile: 'ব্যাকআপ ফাইল (.json) বাছুন', importConfirm: 'আমি বুঝেছি — বর্তমান অ্যাডমিন রেকর্ডগুলো ব্যাকআপ দিয়ে বদলে যাবে।', importBtn: 'ব্যাকআপ ফেরান',
    imported: function (n, f) { return 'ব্যাকআপ ফেরানো হয়েছে — ' + f.num(n) + 'টি রেকর্ড।'; }
  };
  en.admin.local = {
    backupTitle: 'Backup', backupText: 'Download all admin records and the change log as one file (no password inside). Use "Restore backup" to bring them into another computer or browser.',
    download: 'Download backup', importTitle: 'Restore backup', importText: 'Choose a backup file. It replaces all admin records in this browser; your login stays the same.',
    importFile: 'Choose a backup file (.json)', importConfirm: 'I understand — the current admin records will be replaced by the backup.', importBtn: 'Restore backup',
    imported: function (n) { return 'Backup restored — ' + n + ' record(s).'; }
  };
  // ---- Login page: the labelled local demo account ----
  bn.admin.demo = {
    title: 'লোকাল ডেমো অ্যাকাউন্ট', intro: 'ডেমো অ্যাডমিন লগইনের জন্য নিচের তথ্য ব্যবহার করুন।',
    tag: 'শুধু কাল্পনিক তথ্যের প্রোটোটাইপ', email: 'ডেমো অ্যাডমিন ইমেইল', password: 'ডেমো অ্যাডমিন পাসওয়ার্ড',
    copy: 'কপি', copied: 'কপি হয়েছে', copyEmail: 'ডেমো ইমেইল কপি করুন', copyPassword: 'ডেমো পাসওয়ার্ড কপি করুন',
    copiedEmail: 'ডেমো ইমেইল কপি হয়েছে', copiedPassword: 'ডেমো পাসওয়ার্ড কপি হয়েছে', copyFail: 'কপি করা যায়নি — লেখাটি সিলেক্ট করে নিজে কপি করুন।'
  };
  en.admin.demo = {
    title: 'Local demo account', intro: 'Use the details below for the demo admin login.',
    tag: 'Fictional-data prototype only', email: 'Demo admin email', password: 'Demo admin password',
    copy: 'Copy', copied: 'Copied', copyEmail: 'Copy demo email', copyPassword: 'Copy demo password',
    copiedEmail: 'Demo email copied', copiedPassword: 'Demo password copied', copyFail: 'Could not copy — select the text and copy it yourself.'
  };
  [[bn, { email_invalid: 'সঠিক ইমেইল লিখুন',
      storage_unavailable: 'এই ব্রাউজারে তথ্য সংরক্ষণ বন্ধ (যেমন প্রাইভেট উইন্ডো বা কড়া সেটিং)। সাধারণ উইন্ডোতে ফাইলটি খুলুন।', storage_failed: 'তথ্য সংরক্ষণ করা যায়নি (ব্রাউজারের জায়গা ভরে গেছে?)।',
      crypto_unavailable: 'এই ব্রাউজারে নিরাপদ পাসওয়ার্ড-হ্যাশ সুবিধা নেই। Chrome, Edge বা Firefox-এর নতুন সংস্করণে ফাইলটি খুলুন।', backup_invalid: 'এটি সঠিক TerraShield ব্যাকআপ ফাইল নয়।' },
     { setup: 'অ্যাকাউন্ট তৈরি', demo_account: 'ডেমো অ্যাকাউন্ট তৈরি', import: 'ব্যাকআপ ফেরানো' }],
   [en, { email_invalid: 'Enter a valid email',
      storage_unavailable: 'Saving is blocked in this browser (e.g. a private window or strict settings). Open the file in a normal window.', storage_failed: 'Could not save (is the browser\'s storage full?).',
      crypto_unavailable: 'This browser has no secure password hashing. Open the file in a recent Chrome, Edge or Firefox.', backup_invalid: 'This is not a valid TerraShield backup file.' },
     { setup: 'Account created', demo_account: 'Demo account created', import: 'Backup restored' }]
  ].forEach(function (x) { var A = x[0].admin; Object.keys(x[1]).forEach(function (k) { A.err[k] = x[1][k]; }); Object.keys(x[2]).forEach(function (k) { A.log.actions[k] = x[2][k]; }); });
})(typeof self !== 'undefined' ? self : this);
