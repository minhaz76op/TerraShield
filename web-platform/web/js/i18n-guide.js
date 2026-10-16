/*
 * TerraShield — i18n-guide.js : words for the beginner's land-document guide (#/calc/guide).
 * Adds T.guide to TS.i18n.bn / TS.i18n.en.
 *
 * Writing rules for this file (please keep them when editing):
 *  - Educational only. Never state fees, deadlines, legal requirements or "this proves ownership".
 *  - Every example uses the FICTIONAL sample data (নমুনাপুর, দাগ ১০৩, খতিয়ান ২০৩, দলিল 0102/2023).
 *  - Say "check / compare / ask", never "verified" or "safe".
 */
(function (root) {
  'use strict';
  var bn = root.TS.i18n.bn, en = root.TS.i18n.en;

  bn.guide = {
    tabCalc: 'ক্যালকুলেটর', tabGuide: 'ধাপে ধাপে নির্দেশিকা', tabsLabel: 'জমির হিসাব',
    eyebrow: 'শিক্ষামূলক নির্দেশিকা', title: 'ধাপে ধাপে নির্দেশিকা',
    lead: 'জমির কাগজ প্রথমবার দেখছেন? খতিয়ান, দাগ, দলিল ও নামজারি — এই চারটি জিনিস সহজ ভাষায় বুঝে নিন, তারপর জানুন জমি কেনার আগে কী কী মিলিয়ে দেখবেন।',
    eduTitle: 'এটি শেখার জন্য — আইনি পরামর্শ নয়',
    eduText: 'এই নির্দেশিকা সাধারণ ধারণা দেয়। এটি আইনি পরামর্শ বা সরকারি যাচাই নয়, আর কোনো একটি কাগজ একাই নিঃসন্দেহ মালিকানা প্রমাণ করে না। নিয়ম ও প্রক্রিয়া সময়ের সাথে বদলাতে পারে — জমি কেনার আগে ভূমি অফিস ও আইনজীবীর পরামর্শ নিন।',
    onPage: 'এই পাতায়',
    whatK: 'এটা কী', hasK: 'এতে কী থাকে', readK: 'কীভাবে পড়বেন', checkK: 'কী মিলিয়ে দেখবেন', pointsK: 'মনে রাখুন', statusK: 'অবস্থা কীভাবে বুঝবেন',
    exampleK: 'কাল্পনিক উদাহরণ',
    concepts: [
      { id: 'khatian', icon: 'book', title: 'খতিয়ান', aka: 'রেকর্ড অব রাইটস বা স্বত্বলিপি',
        what: 'জরিপের সময় তৈরি জমির মালিকানার রেকর্ড। একটি মৌজার প্রতিটি খতিয়ানের আলাদা নম্বর থাকে, আর তাতে লেখা থাকে কোন দাগে কার কতটুকু অংশ।',
        listK: 'hasK', list: ['মৌজার নাম ও জে.এল. নম্বর', 'খতিয়ান নম্বর', 'মালিকের নাম, পিতা বা স্বামীর নাম ও ঠিকানা', 'প্রতিটি মালিকের অংশ (যেমন ১/৩ বা ০.৩৩৩)', 'দাগ নম্বর, জমির শ্রেণি ও প্রতিটি দাগে জমির পরিমাণ'],
        list2K: 'readK', list2: ['প্রথমে মৌজা ও খতিয়ান নম্বর মিলিয়ে নিন।', 'মালিকের ঘরে বিক্রেতার নাম আছে কি না দেখুন।', '"অংশ" ঘর দেখুন: দাগের মোট জমি × অংশ = ওই মালিকের জমি।', 'একই জমির কয়েকটি জরিপের খতিয়ান থাকতে পারে (যেমন সিএস, এসএ, আরএস, বিএস)। সাধারণত সর্বশেষ জরিপের খতিয়ান ও তার পরের নামজারি খতিয়ান বেশি কাজে লাগে।'],
        example: 'খতিয়ান ২০৩-এ নমুনাপুর মৌজার দাগ ১০৩-এর মোট জমি ৪০ শতাংশ। মালিক জামাল মিয়া — পুরো ৪০ শতাংশই তাঁর নামে লেখা। খতিয়ানে অংশ কখনো ভগ্নাংশে (যেমন ১/২), কখনো শতাংশে লেখা থাকে।',
        cta: ['#/calc', 'অংশ থেকে জমি হিসাব করুন'] },
      { id: 'dag', icon: 'hash', title: 'দাগ নম্বর', aka: 'প্লট নম্বর',
        what: 'মৌজার নকশায় (ম্যাপে) প্রতিটি জমির টুকরোর একটি নম্বর থাকে — এটাই দাগ নম্বর। মৌজা আর দাগ নম্বর একসাথে মিলে একটি নির্দিষ্ট জমিকে চেনায়।',
        listK: 'pointsK', list: ['একই দাগ নম্বর অন্য মৌজাতেও থাকতে পারে — তাই সবসময় মৌজার নামসহ মেলান।', 'জরিপ বদলালে একই জমির দাগ নম্বর বদলে যেতে পারে (সিএস দাগ আর বিএস দাগ আলাদা হতে পারে)। কাগজে কোন জরিপের দাগ লেখা, দেখে নিন।', 'একটি দাগে কয়েকজন মালিক থাকতে পারেন, আবার একজনের কয়েকটি দাগ থাকতে পারে।', 'নকশায় দাগের সীমানা দেখে সরেজমিনে জমির সাথে মিলিয়ে নিন।'],
        example: '"নমুনাপুর মৌজা, দাগ ১০৩" — শুধু "দাগ ১০৩" বললে যথেষ্ট নয়, কারণ পাশের মৌজায়ও ১০৩ নম্বর দাগ থাকতে পারে।' },
      { id: 'dalil', icon: 'doc', title: 'দলিল', aka: 'হস্তান্তরের রেজিস্ট্রি করা কাগজ',
        what: 'বিক্রি, দান বা অন্যভাবে জমির মালিকানা হস্তান্তরের লিখিত কাগজ, যা সাব-রেজিস্ট্রি অফিসে রেজিস্ট্রি হয়। প্রতিটি দলিলের একটি নম্বর ও সাল থাকে।',
        listK: 'checkK', list: ['দলিল নম্বর, সাল, রেজিস্ট্রির তারিখ ও অফিস', 'দাতা (বিক্রেতা) ও গ্রহীতার (ক্রেতা) নাম', 'মৌজা, খতিয়ান ও দাগ নম্বর', 'কত শতাংশ হস্তান্তর হয়েছে', 'চৌহদ্দি — জমির চারপাশে কী আছে', 'বিক্রেতা কীভাবে মালিক হয়েছিলেন — আগের দলিল (বায়া দলিল) বা উত্তরাধিকার'],
        example: 'দলিল 0102/2023: জামাল মিয়া দাগ ১০৩ থেকে ৩০ শতাংশ নাসরিন বেগমকে বিক্রি করেছেন। তাহলে জামালের হাতে বাকি থাকার কথা ১০ শতাংশ — খতিয়ানে ৪০ লেখা থাকলেও।' },
      { id: 'namjari', icon: 'refresh', title: 'নামজারি', aka: 'মিউটেশন বা খারিজ',
        what: 'জমি কেনার পর সরকারি রেকর্ডে পুরোনো মালিকের জায়গায় নতুন মালিকের নাম তোলা। এটি উপজেলা বা সার্কেল ভূমি অফিসে হয়। নামজারি হলে নতুন মালিকের নামে নামজারি খতিয়ান হয়।',
        listK: 'statusK', status: [['অনুমোদিত', 'নতুন মালিকের নামে নামজারি খতিয়ান হয়েছে। তবুও অন্য কাগজের সাথে মিলিয়ে নিন।'], ['চলমান', 'আবেদন জমা হয়েছে, সিদ্ধান্ত হয়নি। এই জমিতে অন্য কারো নামজারি চলমান থাকলে সাবধান — অন্য কেউ জমিটি দাবি করতে পারেন।'], ['নামঞ্জুর', 'আবেদন বাতিল হয়েছে। কেন বাতিল হলো, জেনে নিন।'], ['নামজারি হয়নি', 'দলিল হয়েছে কিন্তু নামজারি হয়নি — তাহলে খতিয়ানে এখনো পুরোনো মালিকের নাম থাকতে পারে। একই জমি দুইবার বিক্রির ঝুঁকি এখানেই বেশি।']],
        example: 'নাসরিন বেগম ২০২৩-এ কিনেছেন কিন্তু নামজারি করেননি। তাই খতিয়ানে এখনো জামাল মিয়ার নামে ৪০ শতাংশ দেখায়, অথচ তাঁর বাকি আছে মাত্র ১০ শতাংশ। TerraShield এই ধরনের অমিল দেখায়।' }
    ],
    stepsTitle: 'কেনার আগে ধাপে ধাপে', stepsSub: 'প্রতিটি ধাপ শেষ করে পরেরটিতে যান। কোনো ধাপে অমিল পেলে থামুন ও খোঁজ নিন।',
    steps: [
      ['বিক্রেতার কাছে কাগজ চান', 'সর্বশেষ খতিয়ান, নামজারি খতিয়ান ও ডিসিআর, বিক্রেতার দলিল ও আগের (বায়া) দলিল, আর ভূমি উন্নয়ন কর (খাজনা) পরিশোধের রসিদ।'],
      ['মৌজা ও দাগ মেলান', 'সব কাগজে একই মৌজা ও দাগ আছে কি না দেখুন। কোন জরিপের দাগ লেখা, সেটাও খেয়াল করুন।'],
      ['মালিকের নাম মেলান', 'খতিয়ান, নামজারি ও দলিলে বিক্রেতার নাম একই কি না দেখুন। নাম না মিললে কারণ জানতে চান।'],
      ['বিক্রেতার কত জমি বাকি, হিসাব করুন', 'দাগের মোট জমি × বিক্রেতার অংশ = তাঁর জমি। তারপর আগে বিক্রি করা জমি বাদ দিন। বাকিটা আপনার কেনা জমির চেয়ে কম হলে সমস্যা।'],
      ['আগের বিক্রি ও নামজারির খোঁজ নিন', 'সাব-রেজিস্ট্রি অফিসে আগের দলিলের খোঁজ (তল্লাশি) নিন, আর ভূমি অফিসে জেনে নিন এই জমিতে অন্য কারো নামজারি চলছে কি না।'],
      ['সরেজমিনে জমি দেখুন', 'আমিন দিয়ে মাপ নিন, চৌহদ্দি মিলিয়ে নিন, প্রতিবেশীদের সাথে কথা বলুন — কেউ জমিতে আছেন বা দাবি করছেন কি না।'],
      ['আইনজীবীকে দেখান, তারপর টাকা দিন', 'সব মিললেও টাকা দেওয়ার আগে একজন আইনজীবীকে সব কাগজ দেখান। চাপ বা তাড়াহুড়োয় অগ্রিম দেবেন না।']
    ],
    mistakesTitle: 'সাধারণ ভুল',
    mistakes: ['শুধু পুরোনো খতিয়ান দেখে কেনা — পরে বিক্রি হলে তা খতিয়ানে নাও থাকতে পারে।', 'মৌজা না মিলিয়ে শুধু দাগ নম্বর মেলানো।', 'দাগের মোট জমিকে বিক্রেতার জমি ভাবা — অংশ ও আগের বিক্রি বাদ দিতে হয়।', 'নামজারি হয়েছে কি না, বা অন্য কারো নামজারি চলছে কি না না দেখা।', 'শুধু ফটোকপি দেখা, মূল কাগজ না দেখা।', 'কাঠা-বিঘার মাপ এলাকাভেদে আলাদা — না জেনে পরিমাণ ধরে নেওয়া।', 'চাপ বা তাড়াহুড়োয় অগ্রিম টাকা দেওয়া।'],
    checklistTitle: 'টাকা দেওয়ার আগে নিজে মিলিয়ে নিন', checklistSub: 'টিক দিয়ে মনে রাখুন। এই টিক শুধু এই পাতায় থাকে — কোথাও জমা হয় না।',
    checklist: ['বিক্রেতার নাম সর্বশেষ খতিয়ান বা নামজারি খতিয়ানে আছে', 'মৌজা, দাগ ও পরিমাণ সব কাগজে একই', 'বিক্রেতার বাকি জমি আপনার কেনা জমির চেয়ে কম নয়', 'এই জমিতে অন্য কারো নামজারি চলছে না', 'খাজনার রসিদ দেখেছি', 'জমি সরেজমিনে দেখেছি ও মাপ নিয়েছি', 'আইনজীবী কাগজ দেখেছেন'],
    checklistNote: 'সব টিক দিলেও এটি মালিকানার নিশ্চয়তা নয় — শুধু ঝুঁকি কমানোর একটি তালিকা।',
    practiceTitle: 'কাল্পনিক নমুনা দিয়ে অনুশীলন করুন', practiceText: 'TerraShield-এ দেখুন খতিয়ান, দলিল ও নামজারি না মিললে অমিল কীভাবে ধরা পড়ে।',
    practiceCheck: 'জমি যাচাই শুরু করুন', practiceSamples: 'নমুনা উদাহরণ', practiceCalc: 'অংশ থেকে হিসাব'
  };

  en.guide = {
    tabCalc: 'Calculator', tabGuide: 'Step-by-step guide', tabsLabel: 'Land calculator',
    eyebrow: 'Learning guide', title: 'Step-by-step guide',
    lead: 'Looking at land papers for the first time? Learn the four basics — khatian, dag, deed and namjari — then see what to compare before you buy.',
    eduTitle: 'For learning — not legal advice',
    eduText: 'This guide gives a general idea. It is not legal advice or official verification, and no single document on its own proves undisputed ownership. Rules and procedures can change — consult the land office and a lawyer before buying land.',
    onPage: 'On this page',
    whatK: 'What it is', hasK: 'What it contains', readK: 'How to read it', checkK: 'What to check', pointsK: 'Remember', statusK: 'Reading the status',
    exampleK: 'Fictional example',
    concepts: [
      { id: 'khatian', icon: 'book', title: 'Khatian', aka: 'Record of rights',
        what: 'The land ownership record made during a survey. Each khatian in a mouza has its own number and shows who owns what share of which dag.',
        listK: 'hasK', list: ['Mouza name and J.L. number', 'Khatian number', "Owner's name, father's or husband's name and address", "Each owner's share (e.g. 1/3 or 0.333)", 'Dag numbers, land class and the area of each dag'],
        list2K: 'readK', list2: ['First match the mouza and khatian number.', "Check that the seller's name is in the owner column.", 'Look at the "share" column: total area of the dag × share = that owner\'s land.', 'The same land may have khatians from several surveys (e.g. CS, SA, RS, BS). Usually the latest survey khatian and any namjari khatian after it matter most.'],
        example: 'In khatian 203, dag 103 of Nomunapur mouza has 40 decimal in total. The owner is Jamal Mia — all 40 decimal is written in his name. A khatian may show a share as a fraction (e.g. 1/2) or directly in decimal.',
        cta: ['#/calc', 'Work out land from a share'] },
      { id: 'dag', icon: 'hash', title: 'Dag number', aka: 'Plot number',
        what: 'Every piece of land on the mouza map has a number — the dag number. The mouza and the dag number together identify one particular piece of land.',
        listK: 'pointsK', list: ['The same dag number can exist in another mouza — always match it together with the mouza name.', 'When a new survey is made, the dag number of the same land can change (a CS dag and a BS dag may differ). Check which survey the paper refers to.', 'One dag can have several owners, and one owner can have several dags.', 'Compare the dag boundary on the map with the land on the ground.'],
        example: '"Nomunapur mouza, dag 103" — just "dag 103" is not enough, because the next mouza may also have a dag 103.' },
      { id: 'dalil', icon: 'doc', title: 'Deed (dalil)', aka: 'Registered transfer document',
        what: 'The written document for transferring land by sale, gift or other means, registered at the Sub-Registry office. Every deed has a number and a year.',
        listK: 'checkK', list: ['Deed number, year, registration date and office', 'Names of the giver (seller) and receiver (buyer)', 'Mouza, khatian and dag numbers', 'How many decimal were transferred', 'Boundaries (chouhoddi) — what lies around the land', 'How the seller became owner — an earlier deed (baya dalil) or inheritance'],
        example: 'Deed 0102/2023: Jamal Mia sold 30 decimal of dag 103 to Nasrin Begum. So Jamal should have only 10 decimal left — even though the khatian still says 40.' },
      { id: 'namjari', icon: 'refresh', title: 'Namjari', aka: 'Mutation',
        what: "After land is bought, the government record is updated to put the new owner's name in place of the old one. This is done at the upazila or circle land office; once approved, a namjari khatian is made in the new owner's name.",
        listK: 'statusK', status: [['Approved', "A namjari khatian has been made in the new owner's name. Still compare it with the other papers."], ['Pending', 'An application has been filed but not decided. If someone else\'s namjari is pending on this land, be careful — someone else may be claiming it.'], ['Rejected', 'The application was refused. Find out why.'], ['Not done', 'A deed was made but namjari was not — so the khatian may still show the old owner. This is where the risk of selling the same land twice is highest.']],
        example: 'Nasrin Begum bought in 2023 but did not do namjari. So the khatian still shows 40 decimal for Jamal Mia, although he has only 10 left. TerraShield shows this kind of conflict.' }
    ],
    stepsTitle: 'Before you buy, step by step', stepsSub: 'Finish each step before the next. If anything does not match, stop and ask.',
    steps: [
      ['Ask the seller for the papers', 'Latest khatian, namjari khatian and DCR, the seller\'s deed and earlier (baya) deeds, and the land development tax (khajna) receipt.'],
      ['Match the mouza and dag', 'Check that every paper shows the same mouza and dag, and which survey the dag number comes from.'],
      ["Match the owner's name", "Check that the seller's name is the same in the khatian, namjari and deed. If not, ask why."],
      ['Work out how much land the seller has left', "Total area of the dag × the seller's share = their land. Then subtract what they already sold. If what is left is less than you are buying, there is a problem."],
      ['Ask about earlier sales and namjari', 'Ask at the Sub-Registry office about earlier deeds (a search, "tallashi"), and at the land office whether anyone else\'s namjari is pending on this land.'],
      ['See the land yourself', 'Have an amin measure it, compare the boundaries, and talk to neighbours — is anyone living on it or claiming it?'],
      ['Show a lawyer, then pay', 'Even if everything matches, show all the papers to a lawyer before paying. Do not pay an advance under pressure or in a hurry.']
    ],
    mistakesTitle: 'Common mistakes',
    mistakes: ['Buying from an old khatian only — later sales may not appear on it.', 'Matching only the dag number, not the mouza.', "Treating the dag's total area as the seller's land — the share and earlier sales must be taken out.", "Not checking whether namjari was done, or whether someone else's namjari is pending.", 'Looking only at photocopies, not the original papers.', 'Assuming a katha or bigha size — they differ by area.', 'Paying an advance under pressure or in a hurry.'],
    checklistTitle: 'Check for yourself before paying', checklistSub: 'Tick to keep track. Ticks stay on this page only — nothing is saved or sent.',
    checklist: ["The seller's name is in the latest khatian or namjari khatian", 'Mouza, dag and area are the same on every paper', "The seller's remaining land is not less than what you are buying", "No one else's namjari is pending on this land", 'I have seen the khajna (tax) receipt', 'I have seen and measured the land on the ground', 'A lawyer has looked at the papers'],
    checklistNote: 'Even with every box ticked this is not a guarantee of ownership — only a list to lower the risk.',
    practiceTitle: 'Practise with fictional samples', practiceText: 'See in TerraShield how a conflict shows up when the khatian, deed and namjari do not agree.',
    practiceCheck: 'Start a land check', practiceSamples: 'Samples', practiceCalc: 'Work out from a share'
  };
})(typeof self !== 'undefined' ? self : this);
