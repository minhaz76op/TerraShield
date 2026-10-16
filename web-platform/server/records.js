/*
 * TerraShield — server/records.js
 * The admin record workflow now lives in web/js/admin-core.js, shared with the standalone file
 * (so the server and the double-clicked file follow exactly the same rules). This wrapper keeps
 * the server's existing API: createRecords(db) and ActionError.
 */
'use strict';
const core = require('../web/js/admin-core.js');

module.exports = {
  createRecords: (db) => core.createRecords(db),          // db.js provides { base, get, mutate }
  ActionError: core.ActionError,
  isActionError: core.isActionError
};
