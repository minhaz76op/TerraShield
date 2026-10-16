/*
 * TerraShield — spoken-number reader tests (voice input for dag & area)
 * Run: node --test tests/voice.test.js
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseSpokenNumber } = require('../web/js/voice.js');

const good = [
  ['১০৩', 103], ['103', 103], ['1 0 3', 103],
  ['এক শূন্য তিন', 103], ['একশো তিন', 103], ['একশ তিন', 103], ['দুইশো পঁচিশ', 225],
  ['বিশ', 20], ['পঁয়তাল্লিশ', 45], ['সাড়ে বারো', 12.5], ['২০ শতাংশ', 20], ['দাগ নম্বর ১০৫', 105],
  ['one zero three', 103], ['one hundred three', 103], ['twenty five', 25], ['forty', 40], ['twelve point five', 12.5]
];
for (const [said, n] of good) test(`"${said}" → ${n}`, () => assert.equal(parseSpokenNumber(said), n));

for (const said of ['', 'hello', 'দশমিক', 'সাড়ে'])
  test(`"${said}" → not understood (null)`, () => assert.equal(parseSpokenNumber(said), null));
