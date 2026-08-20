/* ===================================================================
   app.js — Foundations Program Dashboard

   Reads two things:
     1. PROGRAM  from content/program.js  (you edit that file)
     2. data/monday.json from the Monday sync (automatic)

   Items you add in the browser are saved to this browser's storage
   and included in Export. They are never written back to Monday.
   =================================================================== */

(function () {
'use strict';

/* ---------- Monday column ids on board 18425316244 ---------- */
var COL = {
  itemType:    'color_mm5ygkzc',
  status:      'color_mm5yv473',
  decision:    'color_mm5yzdhc',
  blocked:     'color_mm5ye4nt',
  modality:    'dropdown_mm5y36nj',
  newExisting: 'color_mm5yk79d',
  owner:       'multiple_person_mm5yyd42',
  sme:         'text_mm5yrxry',
  start:       'date_mm5ybgw5',
  due:         'date_mm5yh1r9',
  done:        'date_mm5yqagm',
  hours:       'numeric_mm5yff5w',
  link:        'link_mm5yn27w',
  notes:       'long_text_mm5ys34c',
  health:      'formula_mm5y7hwb',
  cornerstone: 'color_mm5y2hc9',
  phase:       'color_mm5ysg9c',
  pathway:     'dropdown_mm5y1t31',
  source:      'color_mm5yjcbk'
};

var STORE_KEY = 'foundations.dashboard.cache.v1';

/* ===== SHARED SAVE (Google Sheet via Apps Script) =====
   Paste your Apps Script Web App URL between the quotes below.
   It looks like: https://script.google.com/macros/s/XXXXXXXX/exec

   With a URL here, everything anyone adds is saved to a Google Sheet
   and every stakeholder sees it. If left empty, the dashboard falls
   back to browser-only storage and says so on screen. */
var SYNC_URL = 'https://script.google.com/macros/s/AKfycbwbxE-7LppOv9L-3Bid7PZD8evjBQhuBxZ7w2ozcG5xtkprDQxC2k7MiNKb9HvXh4BvRw/exec';

/* Decision Status values on the board, grouped for display. */
var DECISION_NEEDS = ['Open', 'In Discussion', 'Ready to Confirm'];
var DECISION_DECIDED = ['Decided'];
var DECISION_PARKED = ['Deferred / Parking Lot'];

/* A row counts as CONTENT only if it sits in a Cornerstone group on the
   board and is not a decision or research item. Decisions, blockers and
   program-level items are tracked elsewhere and must not appear as content. */
function isContentRow(r){
  if (r.source === 'local') return true;
  if (!r.group || r.group.indexOf('Cornerstone') === -1) return false;
  if (r.itemType === 'Decision' || r.itemType === 'Research / Discovery') return false;
  return true;
}
function decisionBucket(r){
  var d = r.decision;
  if (!d || d === 'N/A') return null;
  if (DECISION_NEEDS.indexOf(d) !== -1) return 'needs';
  if (DECISION_DECIDED.indexOf(d) !== -1) return 'decided';
  if (DECISION_PARKED.indexOf(d) !== -1) return 'parked';
  return null;
}

var OPTIONS = {
  cornerstone: ['C1 - Who We Are','C2 - Who You Are','C3 - How We Work Together',
                'C4 - Your Role (Handoff)','C5 - Team Tools & Systems','Cross-Cornerstone','Program-Level'],
  pathway: ['Universal (All Pathways)','Utility Services','Onboarding','CAT / Customer','Billing',
            'Pro Teams','Leaders','Capturis','Meters','ESG','PayOps','TBD'],
  modality: ['eLearning (Rise360, Storyline)','ILT (Instructor-Led Training)','vILT (Virtual Live Training)',
             'Blended','Knowledge Base','Video','Video Script Only','Graphic/Asset','Job Aid / QRG',
             'Facilitator Guide','Assessment','Template','Google Document','TBD','Other'],
  status: ['Not Started','In Development','Internal Review','IR Revisions','Stakeholder Review',
           'Stakeholder Revisions','Approved','Launched','Blocked','On Hold','N/A'],
  newExisting: ['New Content','Update to Existing Content','Retire / Remove','TBD','N/A']
};

var state = { monday: null, local: [], rows: [], editingId: null, syncState: 'local', sharedUpdatedAt: null };

/* ================= helpers ================= */
function $(id){ return document.getElementById(id); }
function esc(s){
  return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function val(v){ return (v === null || v === undefined || v === '') ? null : v; }
function dash(v){ return val(v) === null ? '—' : esc(v); }
function fmtDate(s){
  if (!s) return '—';
  var d = new Date(s.length === 10 ? s + 'T12:00:00' : s);
  if (isNaN(d)) return esc(s);
  return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'});
}
function fmtDateTime(s){
  if (!s) return '—';
  var d = new Date(s);
  if (isNaN(d)) return '—';
  return d.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'});
}
function toast(msg){
  var t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(function(){ t.hidden = true; }, 2600);
}
function daysUntil(dateStr){
  if (!dateStr) return null;
  var d = new Date(dateStr.length === 10 ? dateStr + 'T12:00:00' : dateStr);
  if (isNaN(d)) return null;
  return Math.round((d - new Date()) / 86400000);
}
function fillSelect(el, list, includeBlank){
  el.innerHTML = (includeBlank ? '<option value=""></option>' : '')
    + list.map(function(o){ return '<option value="'+esc(o)+'">'+esc(o)+'</option>'; }).join('');
}

/* ================= storage: shared sheet + local cache ================= */

/* The browser cache exists only so the page paints instantly. The Google
   Sheet is the record. On load we show the cache, then overwrite it with
   whatever the Sheet returns. */
function loadCache(){
  try {
    var raw = localStorage.getItem(STORE_KEY);
    state.local = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(state.local)) state.local = [];
  } catch (e) { state.local = []; }
}
function writeCache(){
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state.local)); }
  catch (e) { /* private browsing or storage full; the Sheet still has it */ }
}

function fetchShared(){
  if (!SYNC_URL) { setSyncBadge('local', 'Saving to this browser only'); return Promise.resolve(); }
  return fetch(SYNC_URL, { method: 'GET' })
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
    .then(function(text){
      if (text && text.trim() && text.trim() !== '{}') {
        var parsed = JSON.parse(text);
        var content = Array.isArray(parsed) ? parsed : (parsed.content || []);
        state.local = content;
        writeCache();
        state.sharedUpdatedAt = parsed.updatedAt || null;
      }
      setSyncBadge('ok', 'Shared. Everyone sees this.');
    })
    .catch(function(e){
      setSyncBadge('warn', 'Could not reach the Sheet. Showing the last copy saved on this computer.');
    });
}

var syncTimer = null;
function saveLocal(){
  writeCache();
  if (!SYNC_URL) return;
  setSyncBadge('saving', 'Saving\u2026');
  // Debounce so rapid edits become one write.
  clearTimeout(syncTimer);
  syncTimer = setTimeout(pushShared, 1000);
}

function pushShared(){
  // text/plain avoids a CORS preflight, which Apps Script cannot answer.
  fetch(SYNC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ content: state.local, updatedAt: new Date().toISOString() })
  })
  .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); })
  .then(function(){ setSyncBadge('ok', 'Saved. Everyone sees this.'); })
  .catch(function(){
    setSyncBadge('error', 'Save failed. The change is on this computer only.');
    toast('Could not save to the shared Sheet. Try again in a moment.');
  });
}

function setSyncBadge(kind, msg){
  state.syncState = kind;
  var b = $('sync-badge');
  if (b) {
    b.className = 'sync-badge s-' + kind;
    b.textContent = msg;
  }
  var panel = $('sync-share');
  if (panel) {
    panel.className = 'sync-info ' + (kind === 'ok' ? 'ok' : kind === 'error' ? 'error' : kind === 'local' ? 'warn' : '');
    panel.innerHTML = '<span><b>Shared content</b>' + esc(msg) + '</span>';
  }
  var note = $('share-note');
  if (note) {
    note.innerHTML = SYNC_URL
      ? '<b>Everyone sees this.</b> Anything you add is saved to the shared Foundations Google Sheet and appears for every stakeholder who opens the dashboard.'
      : '<b>Not shared yet.</b> The shared Google Sheet is not connected, so this saves in your browser only. See the setup guide to connect it.';
    note.className = SYNC_URL ? 'share-note ok' : 'warn-note';
  }
}

/* ================= build unified rows ================= */
function buildRows(){
  var rows = [];

  if (state.monday && Array.isArray(state.monday.items)) {
    state.monday.items.forEach(function(it){
      var c = it.columns || {};
      rows.push({
        id: 'mon-' + it.id,
        source: 'monday',
        name: it.name,
        url: it.url,
        group: it.group,
        cornerstone: c[COL.cornerstone],
        pathway: c[COL.pathway],
        modality: c[COL.modality],
        status: c[COL.status],
        itemType: c[COL.itemType],
        decision: c[COL.decision],
        blocked: c[COL.blocked],
        newExisting: c[COL.newExisting],
        owner: c[COL.owner],
        sme: c[COL.sme],
        start: c[COL.start],
        due: c[COL.due],
        done: c[COL.done],
        hours: c[COL.hours],
        link: c[COL.link],
        notes: c[COL.notes],
        health: c[COL.health],
        phase: c[COL.phase],
        sourceMaterial: c[COL.source]
      });
    });
  }

  state.local.forEach(function(it){
    rows.push({
      id: it.id, source: 'local', name: it.name, url: it.link || null, group: 'Added here',
      cornerstone: it.cornerstone, pathway: it.pathway, modality: it.modality,
      status: it.status, newExisting: it.newExisting, owner: it.owner, sme: it.sme,
      start: it.start, due: it.due, minutes: it.minutes, outcome: it.outcome,
      link: it.link, notes: it.notes, health: computeHealth(it)
    });
  });

  state.rows = rows;
}
function computeHealth(it){
  if (it.status === 'Launched' || it.status === 'Approved') return 'Complete';
  if (it.status === 'On Hold') return 'On Hold';
  if (!it.due) return 'No Data';
  var d = daysUntil(it.due);
  if (d === null) return 'No Data';
  if (d < 0) return 'Past Due';
  if (d <= 7) return 'At Risk';
  return 'In Progress';
}

/* ================= header + KPIs ================= */
function renderHeader(){
  var m = PROGRAM.meta;
  $('prog-name').textContent = m.name + ' — Program Dashboard';
  $('prog-sub').textContent = m.subtitle + ' · Launch ' + fmtDate(m.launchDate);
  document.title = m.name + ' — Program Dashboard';
  $('footer-line').textContent =
    m.docVersion + ' (' + fmtDate(m.docDate) + ') · Design lead ' + m.designLead +
    ' · Approver ' + m.approver;
}

function renderKPIs(){
  var needs = state.rows.filter(function(r){ return decisionBucket(r) === 'needs'; }).length;
  var decided = state.rows.filter(function(r){ return decisionBucket(r) === 'decided'; }).length;
  var contentRows = state.rows.filter(isContentRow);
  var launch = daysUntil(PROGRAM.meta.launchDate);

  var confirmedStages = 0, totalStages = 0;
  PROGRAM.journey.parts.forEach(function(p){
    p.stages.forEach(function(s){ totalStages++; if (s.readiness === 'confirmed') confirmedStages++; });
  });
  var pctReady = Math.round(confirmedStages / totalStages * 100);

  var blocked = state.rows.filter(function(r){ return r.blocked === 'Yes - Blocked'; }).length;

  var kpis = [
    { label:'Current phase',    value:'Design',   sub:'ADDIE' },
    { label:'Journey model',    value:pctReady + '%', sub:'stages confirmed' },
    { label:'Needs a decision', value:needs,      sub:'open on the board', alert: needs > 0 },
    { label:'Decided',          value:decided,    sub:'settled' },
    { label:'Content items',    value:contentRows.length, sub:'in Cornerstone groups' },
    { label:'Days to launch',   value:(launch !== null ? launch : '—'), sub:fmtDate(PROGRAM.meta.launchDate) }
  ];

  $('kpis').innerHTML = kpis.map(function(k){
    return '<dl class="kpi' + (k.alert ? ' alert' : '') + '">' +
             '<dt>' + esc(k.label) + '</dt>' +
             '<dd>' + esc(k.value) + '<span class="kpi-sub">' + esc(k.sub) + '</span></dd>' +
           '</dl>';
  }).join('');
}

/* ================= readiness ================= */
function renderReadiness(){
  var buckets = { confirmed: [], pending: [], unowned: [] };
  PROGRAM.journey.parts.forEach(function(p){
    p.stages.forEach(function(s){
      buckets[s.readiness].push(s.name + (s.note ? ' — ' + s.note : ''));
    });
  });
  state.rows.forEach(function(r){
    if (r.itemType === 'Research / Discovery' && r.decision === 'Open') buckets.unowned.push(r.name);
  });

  var groups = [
    { key:'confirmed', label:'Ready to build',        cls:'d-ok' },
    { key:'pending',   label:'Pending confirmation',  cls:'d-pending' },
    { key:'unowned',   label:'Still to verify',       cls:'d-unowned' }
  ];

  $('readiness').innerHTML = groups.map(function(g){
    var items = buckets[g.key];
    if (!items.length) return '';
    return '<div class="ready-group">' +
      '<div class="ready-head"><span class="dotmark ' + g.cls + '"></span>' + esc(g.label) +
      '<span class="count">' + items.length + '</span></div><ul>' +
      items.map(function(i){ return '<li>' + esc(i) + '</li>'; }).join('') +
      '</ul></div>';
  }).join('');
}

function renderOpenTop(){
  var order = { 'Open': 0, 'In Discussion': 1, 'Ready to Confirm': 2 };
  var open = state.rows.filter(function(r){ return decisionBucket(r) === 'needs'; })
    .sort(function(a,b){ return (order[a.decision]||9) - (order[b.decision]||9); })
    .slice(0, 6);

  $('open-top').innerHTML = open.map(function(r){
    var link = r.url ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '</a>' : esc(r.name);
    return '<li><span class="lt">' + link + '</span>' +
           '<span class="lo">' + esc(r.decision) + (r.cornerstone ? ' · ' + esc(r.cornerstone) : '') + '</span></li>';
  }).join('') || '<li class="lo">Nothing awaiting a decision.</li>';
}

/* ================= now / next / waiting ================= */
function renderNowNext(){
  var inFlight = state.rows.filter(function(r){
    return r.status === 'In Development' || r.status === 'Internal Review' || r.status === 'IR Revisions';
  });
  var next = state.rows.filter(function(r){ return r.status === 'Not Started' && r.due; })
    .sort(function(a,b){ return String(a.due).localeCompare(String(b.due)); }).slice(0, 6);
  var waiting = state.rows.filter(function(r){
    return r.blocked === 'Yes - Blocked' || r.status === 'Stakeholder Review' || r.sourceMaterial === 'Requested';
  });

  function block(title, items, cls, subFn){
    var body = items.length
      ? items.slice(0, 6).map(function(r){
          return '<li>' + esc(r.name) + '<small>' + esc(subFn(r)) + '</small></li>';
        }).join('')
      : '<li><small>Nothing here right now.</small></li>';
    return '<div class="stack ' + cls + '"><h3>' + title + '</h3><ul>' + body + '</ul></div>';
  }

  $('now-next').innerHTML =
    block('Now', inFlight, '', function(r){ return [r.cornerstone, r.status].filter(Boolean).join(' · '); }) +
    block('Next', next, '', function(r){ return 'Due ' + fmtDate(r.due); }) +
    block('Waiting on', waiting, 'waiting', function(r){
      return r.blocked === 'Yes - Blocked' ? 'Blocked by an open decision'
           : (r.sourceMaterial === 'Requested' ? 'Source material requested' : 'With stakeholders');
    });
}

/* ================= program map ================= */
function renderMap(){
  $('map-intro').textContent = PROGRAM.journey.intro;

  var html = '';
  PROGRAM.cornerstones.forEach(function(cs, i){
    if (cs.scope === 'branch' && PROGRAM.cornerstones[i-1] && PROGRAM.cornerstones[i-1].scope === 'universal') {
      html += '<div class="branchpoint"><span>BRANCH POINT</span></div>';
    }
    html += '<div class="cs ' + cs.scope + '">' +
      '<span class="cs-min">' + cs.minutes + 'm</span>' +
      '<span class="cs-id">' + esc(cs.id) + '</span>' +
      '<span class="cs-title">' + esc(cs.title) + '</span>' +
      '<span class="cs-sum">' + esc(cs.summary) + '</span>' +
      '<span class="cs-why">' + esc(cs.why) + '</span>' +
      '</div>';
  });
  $('cornerstone-flow').innerHTML = html;

  $('pathway-chips').innerHTML = PROGRAM.pathways.map(function(p){
    return '<span class="chip' + (p.note ? ' has-note' : '') + '">' +
      (p.priority ? '<span class="pri">' + p.priority + '</span>' : '') +
      esc(p.name) + (p.note ? ' <small>' + esc(p.note) + '</small>' : '') + '</span>';
  }).join('');

  $('journey').innerHTML = PROGRAM.journey.parts.map(function(part){
    return '<div class="jpart"><div class="jpart-label">' + esc(part.label) + '</div><div class="jrow">' +
      part.stages.map(function(s){
        return '<div class="jstage ' + s.readiness + '">' +
          '<b>' + (s.n ? s.n + ' · ' : '') + esc(s.name) + '</b>' +
          '<em>' + esc(s.who) + '</em>' +
          (s.note ? '<span class="jnote">' + esc(s.note) + '</span>' : '') +
          '</div>';
      }).join('') + '</div></div>';
  }).join('');
}

/* ================= ADDIE ================= */
function renderAddie(){
  $('addie').innerHTML = PROGRAM.addie.map(function(p){
    return '<div class="phase ' + p.state + '">' +
      '<div class="phase-head"><h3>' + esc(p.phase) + '</h3>' +
      '<span class="badge b-' + p.state + '">' + esc(p.state) + '</span></div>' +
      '<p class="phase-sum">' + esc(p.summary) + '</p><ul>' +
      p.work.map(function(w){ return '<li>' + esc(w) + '</li>'; }).join('') +
      '</ul><span class="phase-ev">' + esc(p.evidence) + '</span></div>';
  }).join('');
}

/* ================= decisions (all from Monday, verbatim) ================= */
function renderDecisions(){
  var buckets = { needs: [], decided: [], parked: [] };
  state.rows.forEach(function(r){
    var b = decisionBucket(r);
    if (b) buckets[b].push(r);
  });

  // Within "needs", surface Open first, then In Discussion, then Ready to Confirm.
  var order = { 'Open': 0, 'In Discussion': 1, 'Ready to Confirm': 2 };
  buckets.needs.sort(function(a, b){ return (order[a.decision] || 9) - (order[b.decision] || 9); });

  function statusBadge(d){
    var cls = d === 'Decided' ? 'b-decided'
            : d === 'Deferred / Parking Lot' ? 'b-upcoming' : 'b-open';
    return '<span class="badge ' + cls + '">' + esc(d) + '</span>';
  }

  function render(list, cls){
    if (!list.length) return '<p class="empty">Nothing in this category.</p>';
    return list.map(function(r){
      var link = r.url
        ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">Open in Monday</a>'
        : '';
      var meta = [r.cornerstone, r.group].filter(Boolean).join(' · ');
      var blocked = (r.blocked === 'Yes - Blocked')
        ? '<span class="badge b-risk">Blocking other work</span>'
        : (r.blocked === 'Partially' ? '<span class="badge b-open">Partially blocking</span>' : '');
      return '<details class="acc ' + cls + '"><summary><span>' +
        '<span class="at">' + esc(r.name) + '</span>' +
        '<span class="ao">' + esc(meta) + '</span></span>' +
        statusBadge(r.decision) + '</summary>' +
        '<div class="ad">' + blocked +
        '<p class="acc-note">Item names and statuses are shown exactly as recorded on the Monday board. ' +
        'To change anything here, change it in Monday.</p>' + link + '</div></details>';
    }).join('');
  }

  $('dec-needs').innerHTML   = render(buckets.needs, 'open-item');
  $('dec-closed').innerHTML  = render(buckets.decided, 'decided-item');
  $('dec-parked').innerHTML  = render(buckets.parked, 'parked-item');

  $('dec-needs-count').textContent  = buckets.needs.length;
  $('dec-closed-count').textContent = buckets.decided.length;
  $('dec-parked-count').textContent = buckets.parked.length;
}

/* ================= guard rails + vocabulary ================= */
function renderGuardRails(){
  $('guardrails').innerHTML = PROGRAM.guardRails.map(function(g){
    return '<div class="gr"><span class="grn">' + g.n + '</span><div>' +
      '<b>' + esc(g.rule) + '</b><p>' + esc(g.detail) + '</p></div></div>';
  }).join('');

  $('vocab-table').querySelector('tbody').innerHTML = PROGRAM.vocabulary.map(function(v){
    return '<tr><td>' + esc(v.publicName) + '</td><td>' + esc(v.internal) + '</td><td>' + esc(v.what) + '</td></tr>';
  }).join('');
}

/* ================= resources ================= */
function renderResources(){
  $('resources').innerHTML = PROGRAM.resources.map(function(r){
    return '<li><a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '</a>' +
      (r.note ? '<small>' + esc(r.note) + '</small>' : '') + '</li>';
  }).join('');
}

function renderSyncInfo(kind, title, detail){
  $('sync-info').className = 'sync-info ' + kind;
  $('sync-info').innerHTML = '<span><b>' + esc(title) + '</b>' + esc(detail) + '</span>';
}

/* ================= content table ================= */
function renderFilters(){
  var contentRows = state.rows.filter(isContentRow);
  var uniq = function(key){
    var seen = {};
    contentRows.forEach(function(r){ if (val(r[key])) seen[r[key]] = 1; });
    return Object.keys(seen).sort();
  };
  function fill(id, list){
    var el = $(id), keep = el.options[0].outerHTML;
    el.innerHTML = keep + list.map(function(o){ return '<option value="'+esc(o)+'">'+esc(o)+'</option>'; }).join('');
  }
  fill('f-cornerstone', uniq('cornerstone'));
  fill('f-pathway',     uniq('pathway'));
  fill('f-status',      uniq('status'));
}

function renderContent(){
  var q  = $('f-search').value.trim().toLowerCase();
  var fc = $('f-cornerstone').value, fp = $('f-pathway').value;
  var fs = $('f-status').value,      fr = $('f-source').value;

  var contentRows = state.rows.filter(isContentRow);

  var list = contentRows.filter(function(r){
    if (q && String(r.name).toLowerCase().indexOf(q) === -1) return false;
    if (fc && r.cornerstone !== fc) return false;
    if (fp && r.pathway !== fp) return false;
    if (fs && r.status !== fs) return false;
    if (fr && r.source !== fr) return false;
    return true;
  });

  var healthBadge = function(h){
    if (!h) return '—';
    var cls = (h === 'Past Due' || h === 'At Risk') ? 'b-risk'
            : (h === 'Complete' || h === 'Completed Early') ? 'b-decided' : 'b-upcoming';
    return '<span class="badge ' + cls + '">' + esc(h) + '</span>';
  };

  $('content-table').querySelector('tbody').innerHTML = list.map(function(r){
    var name = r.url
      ? '<a href="' + esc(r.url) + '" target="_blank" rel="noopener">' + esc(r.name) + '</a>'
      : esc(r.name);
    var action = r.source === 'local'
      ? '<button class="rowbtn" data-edit="' + esc(r.id) + '">Edit</button>'
      : '<span class="src-tag">Monday</span>';
    var draftTag = r.source === 'local'
      ? ' <span class="badge b-draft">' + (SYNC_URL ? 'Added here' : 'Only you') + '</span>' : '';
    return '<tr>' +
      '<td>' + name + draftTag + '</td>' +
      '<td>' + dash(r.cornerstone) + '</td>' +
      '<td>' + dash(r.pathway) + '</td>' +
      '<td>' + dash(r.modality) + '</td>' +
      '<td>' + dash(r.status) + '</td>' +
      '<td>' + (r.due ? fmtDate(r.due) : '—') + '</td>' +
      '<td>' + healthBadge(r.health) + '</td>' +
      '<td>' + action + '</td>' +
      '</tr>';
  }).join('');

  $('content-empty').hidden = list.length > 0;
  $('content-note').textContent =
    list.length + ' of ' + contentRows.length + ' content items · ' +
    contentRows.filter(function(r){ return r.source === 'monday'; }).length +
    ' from Cornerstone groups in Monday, ' + state.local.length +
    (SYNC_URL ? ' added in the dashboard' : ' personal drafts');
}

/* ================= modal ================= */
function openModal(id){
  state.editingId = id || null;
  var it = id ? state.local.filter(function(x){ return x.id === id; })[0] : null;

  $('modal-title').textContent = it ? 'Edit Content' : 'Add Content';
  $('m-delete').hidden = !it;

  $('m-name').value        = it ? (it.name || '') : '';
  $('m-cornerstone').value = it ? (it.cornerstone || '') : '';
  $('m-pathway').value     = it ? (it.pathway || '') : '';
  $('m-modality').value    = it ? (it.modality || '') : '';
  $('m-status').value      = it ? (it.status || 'Not Started') : 'Not Started';
  $('m-newexisting').value = it ? (it.newExisting || '') : '';
  $('m-minutes').value     = it ? (it.minutes || '') : '';
  $('m-start').value       = it ? (it.start || '') : '';
  $('m-due').value         = it ? (it.due || '') : '';
  $('m-owner').value       = it ? (it.owner || '') : '';
  $('m-sme').value         = it ? (it.sme || '') : '';
  $('m-outcome').value     = it ? (it.outcome || '') : '';
  $('m-link').value        = it ? (it.link || '') : '';
  $('m-notes').value       = it ? (it.notes || '') : '';

  $('m-name').classList.remove('invalid');
  $('modal').hidden = false;
  $('m-name').focus();
}
function closeModal(){ $('modal').hidden = true; state.editingId = null; }

function saveModal(){
  var name = $('m-name').value.trim();
  if (!name) { $('m-name').classList.add('invalid'); $('m-name').focus(); toast('A name is required.'); return; }

  var rec = {
    id: state.editingId || ('loc-' + Date.now() + '-' + Math.floor(Math.random()*1000)),
    name: name,
    cornerstone: $('m-cornerstone').value || null,
    pathway:     $('m-pathway').value || null,
    modality:    $('m-modality').value || null,
    status:      $('m-status').value || 'Not Started',
    newExisting: $('m-newexisting').value || null,
    minutes:     $('m-minutes').value || null,
    start:       $('m-start').value || null,
    due:         $('m-due').value || null,
    owner:       $('m-owner').value.trim() || null,
    sme:         $('m-sme').value.trim() || null,
    outcome:     $('m-outcome').value.trim() || null,
    link:        $('m-link').value.trim() || null,
    notes:       $('m-notes').value.trim() || null,
    updatedAt:   new Date().toISOString()
  };

  if (state.editingId) {
    state.local = state.local.map(function(x){ return x.id === rec.id ? rec : x; });
  } else {
    state.local.push(rec);
  }
  saveLocal(); refreshAll(); closeModal();
  toast(state.editingId ? (SYNC_URL ? 'Updated and shared.' : 'Updated.') : (SYNC_URL ? 'Added. Everyone will see it.' : 'Added to this browser only.'));
}

function deleteModal(){
  if (!state.editingId) return;
  if (!confirm('Delete this item? This cannot be undone.')) return;
  state.local = state.local.filter(function(x){ return x.id !== state.editingId; });
  saveLocal(); refreshAll(); closeModal(); toast('Deleted.');
}

/* ================= export ================= */
function exportData(){
  var payload = {
    exportedAt: new Date().toISOString(),
    program: PROGRAM.meta,
    addedHere: state.local,
    mondaySnapshot: state.monday ? {
      fetchedAt: state.monday.fetchedAt,
      itemCount: state.monday.itemCount,
      items: state.monday.items
    } : null
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'foundations-dashboard-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
  toast('Exported.');
}

/* ================= tabs ================= */
function initTabs(){
  var tabs = document.querySelectorAll('.tab');
  Array.prototype.forEach.call(tabs, function(t){
    t.addEventListener('click', function(){
      Array.prototype.forEach.call(tabs, function(x){ x.classList.remove('is-active'); });
      t.classList.add('is-active');
      Array.prototype.forEach.call(document.querySelectorAll('.view'), function(v){ v.classList.remove('is-active'); });
      $('view-' + t.dataset.view).classList.add('is-active');
      if (location.hash !== '#' + t.dataset.view) history.replaceState(null, '', '#' + t.dataset.view);
      window.scrollTo(0, 0);
    });
  });
  var want = location.hash.replace('#','');
  if (want && $('view-' + want)) {
    var target = document.querySelector('.tab[data-view="' + want + '"]');
    if (target) target.click();
  }
}

/* ================= wiring ================= */
function refreshAll(){
  buildRows();
  renderKPIs(); renderReadiness(); renderOpenTop(); renderNowNext(); renderDecisions();
  renderFilters(); renderContent();
}

function init(){
  renderHeader(); renderMap(); renderAddie();
  renderGuardRails(); renderResources(); initTabs();

  fillSelect($('m-cornerstone'), OPTIONS.cornerstone, true);
  fillSelect($('m-pathway'),     OPTIONS.pathway, true);
  fillSelect($('m-modality'),    OPTIONS.modality, true);
  fillSelect($('m-status'),      OPTIONS.status, false);
  fillSelect($('m-newexisting'), OPTIONS.newExisting, true);

  loadCache();
  setSyncBadge(SYNC_URL ? 'saving' : 'local', SYNC_URL ? 'Loading shared content\u2026' : 'Saving to this browser only');

  $('btn-add').addEventListener('click', function(){ openModal(null); });
  $('btn-add-2').addEventListener('click', function(){ openModal(null); });
  $('btn-print').addEventListener('click', function(){ window.print(); });
  $('btn-refresh').addEventListener('click', function(){
    fetchShared().then(function(){ refreshAll(); toast('Refreshed.'); });
  });
  $('btn-export').addEventListener('click', exportData);
  $('m-save').addEventListener('click', saveModal);
  $('m-cancel').addEventListener('click', closeModal);
  $('modal-close').addEventListener('click', closeModal);
  $('m-delete').addEventListener('click', deleteModal);
  $('modal').addEventListener('click', function(e){ if (e.target === $('modal')) closeModal(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });

  ['f-search','f-cornerstone','f-pathway','f-status','f-source'].forEach(function(id){
    $(id).addEventListener('input', renderContent);
  });
  $('f-clear').addEventListener('click', function(){
    ['f-search','f-cornerstone','f-pathway','f-status','f-source'].forEach(function(id){ $(id).value = ''; });
    renderContent();
  });

  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-edit]');
    if (b) openModal(b.getAttribute('data-edit'));
  });

  // Shared content first, then Monday task data, then draw.
  fetchShared().then(function(){
  return fetch('monday.json?t=' + Date.now())
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(data){
      state.monday = data;
      if (data.fetchedAt) {
        renderSyncInfo('ok', 'Connected to Monday.',
          data.itemCount + ' items · last sync ' + fmtDateTime(data.fetchedAt));
      } else {
        renderSyncInfo('warn', 'No Monday data yet.',
          'Run the workflow from the Actions tab in GitHub, then reload.');
      }
      refreshAll();
    })
    .catch(function(err){
      renderSyncInfo('error', 'Could not load Monday data.',
        'The dashboard still works; task rows will be empty. Detail: ' + err.message);
      refreshAll();
    });
  });
}

if (typeof PROGRAM === 'undefined') {
  document.body.innerHTML = '<div style="max-width:600px;margin:80px auto;font-family:Roboto,Arial,sans-serif">' +
    '<h1 style="color:#263746">Content file did not load</h1>' +
    '<p style="color:#555759">The file <code>program.js</code> is missing or has a syntax error ' +
    '(usually a missing comma or quote). Open your browser console with F12 to see the exact line.</p></div>';
} else {
  document.addEventListener('DOMContentLoaded', init);
}

})();
