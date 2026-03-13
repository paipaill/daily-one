/* ═══════════════════════════════════════════════
   STORAGE HELPERS  (all keyed per username)
   ═══════════════════════════════════════════════
   dq_lastUser          → username string
   dq_user_{name}_first → timestamp of first login
   dq_user_{name}_state → { date, pos, done, dlCount }
   app_bound_user       → the ONLY username allowed on this browser
   ═══════════════════════════════════════════════ */

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function userKey(username, suffix) {
  return `dq_user_${username}_${suffix}`;
}

function safeSetItem(key, val) {
  try { localStorage.setItem(key, val); } catch (e) { console.warn('Storage Error:', e); }
}

function safeGetItem(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function loadUserState(username) {
  const today = todayKey();

  // Ensure first-visit timestamp
  if (!safeGetItem(userKey(username, 'first')))
    safeSetItem(userKey(username, 'first'), String(Date.now()));

  let s = null;
  try { s = JSON.parse(safeGetItem(userKey(username, 'state')) || 'null'); } catch (e) { }

  // Reset on new day OR corrupted state
  if (!s || s.date !== today) {
    s = { date: today, pos: 0, done: false, dlCount: 0 };
    saveUserState(username, s);
  }

  // Safety clamps
  if (s.done && s.date !== today) { s.done = false; s.pos = 0; saveUserState(username, s); }
  s.pos = Math.max(0, Math.min(s.pos, DAILY_COUNT - 1));

  return s;
}

function saveUserState(username, s) {
  safeSetItem(userKey(username, 'state'), JSON.stringify(s));
}

function daysSinceFirst(username) {
  const t = parseInt(safeGetItem(userKey(username, 'first')) || String(Date.now()), 10);
  return Math.max(1, Math.floor((Date.now() - t) / 86400000) + 1);
}
