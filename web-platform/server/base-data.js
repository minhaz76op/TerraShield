/*
 * TerraShield — server/base-data.js
 * The read-only FICTIONAL base data, built from shared/ exactly like scripts/build-data.js
 * builds web/js/data.js (a test checks the two are identical). Admin records never change this.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

function loadBaseData() {
  const loc = read('shared/data/locations.json');
  return {
    district: loc.district,
    upazila: loc.upazila,
    subRegistryOffice: loc.subRegistryOffice,
    mouzas: loc.mouzas,
    people: read('shared/data/people.json').people,
    plots: read('shared/data/plots.json').plots,
    khatians: read('shared/data/khatians.json').khatians,
    deeds: read('shared/data/deeds.json').deeds,
    namjari: read('shared/data/namjari.json').namjari
  };
}

module.exports = { loadBaseData, ROOT };
