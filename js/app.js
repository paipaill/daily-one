/* ═══════════════════════════════════════════════
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
let currentUser = null;
const DAILY_COUNT = 3;
const MAX_DL = 3;
let S = null;           // user state
let TQ = [];            // today's quotes

/* ═══════════════════════════════════════════════
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function initLogin() {
  const input = document.getElementById('usernameInput');
  const btn = document.getElementById('loginBtn');

  // Enable button only when input has value
  input.addEventListener('input', () => {
    btn.disabled = input.value.trim().length === 0;
  });

  // 设备指纹锁定：强制检查并跳过登录
  const boundUser = safeGetItem('dq_bound_user');
  if (boundUser) {
    // Already bound to this device, force them to use it
    document.getElementById('loginScreen').style.display = 'none';
    input.value = boundUser;
    initiateAutoLogin(boundUser);
    return; // Don't even let them see the screen properly or click around
  }

  // 遗留兼容（没被绑定的旧用户）
  const lastUser = safeGetItem('dq_lastUser');
  if (lastUser) {
    document.getElementById('existingUserBlock').style.display = 'block';
    document.getElementById('lastUserName').textContent = `（上次：${lastUser}）`;
    input.value = lastUser;
    btn.disabled = false;
  }

  input.focus();
}

function initiateAutoLogin(name) {
  safeSetItem('dq_bound_user', name);
  safeSetItem('dq_lastUser', name);
  startApp(name);
}

function doLogin() {
  const input = document.getElementById('usernameInput');
  const btn = document.getElementById('loginBtn');
  const name = input.value.trim();
  if (!name) return;

  // 避免回车穿透导致连续触发多次网络请求
  input.disabled = true;
  if (btn) btn.disabled = true;

  // Bind this device
  safeSetItem('dq_bound_user', name);
  safeSetItem('dq_lastUser', name);
  startApp(name);
}

function switchUser() {
  // If bound, deny switching!
  if (safeGetItem('dq_bound_user')) {
    showToast('该设备已绑定账号，无法切换。');
    return;
  }
  document.getElementById('usernameInput').value = '';
  document.getElementById('loginBtn').disabled = true;
  document.getElementById('usernameInput').focus();
}

function logoutConfirm() {
  // Since switching is disabled, changing the text
  showToast('账号已绑定至设备。你可以安全地关闭网页，进度会自动保存。');
}


/* ═══════════════════════════════════════════════
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
async function startApp(username) {
  currentUser = username;
  S = loadUserState(username);

  // Hide login, show loader
  const ls = document.getElementById('loginScreen');
  ls.classList.add('out');
  setTimeout(() => ls.style.display = 'none', 600);

  document.getElementById('loadingScreen').classList.add('show');

  // Fetch quotes
  TQ = await fetchAIQuotes(username);

  // Hide loader
  const loadEl = document.getElementById('loadingScreen');
  loadEl.classList.add('out');
  setTimeout(() => { loadEl.classList.remove('show', 'out'); }, 500);

  // Setup UI
  setupHeader(username);
  buildSteps();

  if (S.done && S.date === todayKey()) {
    showEndScreen();
    return;
  }

  // Ensure fresh start: pos always 0 for new user on new day
  // (loadUserState already handles this)
  showMainApp();
  render(false);
}

function setupHeader(username) {
  const dt = fmtDate();
  document.getElementById('hDate').textContent = `${dt.full} · ${dt.week}`;
  document.getElementById('hdrUserName').textContent = username;
}

function showMainApp() {
  document.getElementById('hdr').classList.remove('hide');
  document.getElementById('scene').classList.remove('hide');
  document.getElementById('bar').classList.remove('hide');
}

/* ═══════════════════════════════════════════════
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function fmtDate() {
  const d = new Date(), p = n => String(n).padStart(2, '0');
  const W = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return { full: `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`, week: W[d.getDay()] };
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function setBg(url) {
  const bg = document.getElementById('cardBg');
  bg.classList.remove('ready');
  bg.style.backgroundImage = `url('${url}')`;
  const im = new Image(); im.src = url; im.onload = () => bg.classList.add('ready');
}


/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function buildSteps() {
  const el = document.getElementById('steps');
  el.innerHTML = '';
  for (let i = 0; i < DAILY_COUNT; i++) {
    const d = document.createElement('div');
    d.className = 'step ' + getStepClass(i);
    el.appendChild(d);
  }
  updateStepLabel();
}

function getStepClass(i) {
  if (i < S.pos) return 'step-done';
  if (i === S.pos) return 'step-active';
  return 'step-todo';
}

function updateSteps() {
  document.querySelectorAll('.step').forEach((el, i) => {
    el.className = 'step ' + getStepClass(i);
  });
  updateStepLabel();
}

function updateStepLabel() {
  const el = document.getElementById('stepLabel');
  if (el) el.textContent = `${S.pos + 1} / ${DAILY_COUNT}`;
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function populate(q) {
  const dt = fmtDate();
  document.getElementById('qCn').textContent = q.cn;
  document.getElementById('qEn').textContent = `"${q.en}"`;
  document.getElementById('aName').textContent = q.author || '佚名';
  document.getElementById('aSub').textContent = q.sub || '文学摘要';
  document.getElementById('aSrc').style.display = 'none'; // 新版不再分离作品名，直接隐藏该 DOM
  document.getElementById('tagEl').textContent = `Day · ${String(daysSinceFirst(currentUser)).padStart(3, '0')}`;
  document.getElementById('topDate').innerHTML = `${dt.full}<br>${dt.week}`;
  setBg(q.img);
  updateSteps();
  updateDlBadge();
}

function render(anim) {
  const q = TQ[S.pos];
  const cc = document.getElementById('cc');
  if (anim) {
    cc.classList.add('out');
    setTimeout(() => {
      cc.classList.remove('out'); populate(q);
      cc.classList.add('in');
      setTimeout(() => cc.classList.remove('in'), 480);
    }, 330);
  } else { populate(q); }
}


/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function tryAdvance() {
  if (S.done) return;
  if (S.pos < DAILY_COUNT - 1) {
    S.pos++; saveUserState(currentUser, S); render(true);
  } else {
    document.getElementById('modal').classList.add('show');
  }
}

function closeModal() { document.getElementById('modal').classList.remove('show'); }

function goToEnd() {
  closeModal();
  S.done = true; saveUserState(currentUser, S);
  document.getElementById('hdr').classList.add('hide');
  document.getElementById('scene').classList.add('hide');
  document.getElementById('bar').classList.add('hide');
  setTimeout(() => { showEndScreen(); }, 500);
}

function showEndScreen() {
  document.getElementById('end').classList.add('show');
  startCountdown();
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function updateDlBadge() {
  const rem = MAX_DL - (S.dlCount || 0);
  const badge = document.getElementById('dlLeft');
  const btn = document.getElementById('dlBtn');
  if (badge) badge.textContent = `${rem}/${MAX_DL}`;
  if (btn && !btn._busy) btn.disabled = rem <= 0;
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function copyQ() {
  const q = TQ[S.pos];
  navigator.clipboard.writeText(`${q.cn}\n\n—— ${q.author || '佚名'} · ${q.sub || '文学摘要'}`)
    .then(() => showToast('已复制到剪贴板'));
}


/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function startCountdown() {
  function tick() {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const diff = mid - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const el = document.getElementById('cdText');
    if (el) el.textContent =
      `距明天还有 ${String(h).padStart(2, '0')} 小时 ${String(m).padStart(2, '0')} 分 ${String(s).padStart(2, '0')} 秒`;
  }
  tick(); setInterval(tick, 1000);
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}
/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
(function boot() {
  initLogin();

  // Keyboard (only in main app)
  document.addEventListener('keydown', e => {
    if (!currentUser || S?.done) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') tryAdvance();
    if (e.key === 'Escape') closeModal();
  });
})();
