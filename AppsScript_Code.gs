/**
 * Foundations Dashboard — shared save backend
 *
 * Deployed as a Google Apps Script Web App. It does two things:
 *   GET   returns the saved dashboard content as JSON
 *   POST  overwrites the saved content with whatever the dashboard sends
 *
 * The data is stored in a sheet named "data", split across as many rows
 * as needed because a single Google Sheets cell tops out at 50,000
 * characters. Rejoining happens automatically on read.
 *
 * You do not need to change anything in this file.
 */

var SHEET_NAME = 'data';
var CHUNK = 45000;          // safely under the 50,000 character cell limit
var LOCK_WAIT_MS = 20000;

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange('A1').setValue('');
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- READ ---------- */
function doGet() {
  try {
    var sh = getSheet_();
    var last = sh.getLastRow();
    if (last < 1) return json_({});

    var values = sh.getRange(1, 1, last, 1).getValues();
    var text = values.map(function (r) { return r[0] || ''; }).join('');

    if (!text.trim()) return json_({});
    return ContentService
      .createTextOutput(text)
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ error: String(err) });
  }
}

/* ---------- WRITE ---------- */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Stops two people saving at the same instant from corrupting the file.
    lock.waitLock(LOCK_WAIT_MS);

    var body = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!body) return json_({ ok: false, error: 'empty body' });

    // Reject anything that is not valid JSON, so a bad request cannot
    // overwrite good data with garbage.
    JSON.parse(body);

    var sh = getSheet_();
    sh.clear();

    var rows = [];
    for (var i = 0; i < body.length; i += CHUNK) {
      rows.push([body.substring(i, i + CHUNK)]);
    }
    if (!rows.length) rows.push(['']);

    sh.getRange(1, 1, rows.length, 1).setValues(rows);

    return json_({ ok: true, bytes: body.length, rows: rows.length });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}
