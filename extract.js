const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf-8');
const lines = content.split('\n');

const css = lines.slice(32, 426).join('\n');
fs.writeFileSync('css/style.css', css);

const CONSTANTS = lines.slice(570, 576).join('\n');
const STORAGE = lines.slice(576, 626).join('\n');
const FETCH_API = lines.slice(627, 755).join('\n');
const STATE = lines.slice(755, 764).join('\n');
const LOGIN = lines.slice(764, 814).join('\n');
const APP_START = lines.slice(814, 872).join('\n');
const IMAGE = lines.slice(873, 890).join('\n');
const STEPS = lines.slice(891, 922).join('\n');
const RENDER = lines.slice(923, 952).join('\n');
const NAV = lines.slice(953, 980).join('\n');
const DL_BADGE = lines.slice(981, 991).join('\n');
const COPY = lines.slice(992, 1000).join('\n');
const DL_CANVAS = lines.slice(1001, 1187).join('\n');
const COUNTDOWN = lines.slice(1188, 1205).join('\n');
const TOAST = lines.slice(1206, 1214).join('\n');
const BOOT = lines.slice(1215, 1228).join('\n');

// Build js/storage.js
fs.writeFileSync('js/storage.js', [CONSTANTS, STORAGE].join('\n\n'));

// Build js/api.js (depends on fetch/fallback logic)
fs.writeFileSync('js/api.js', [FETCH_API].join('\n\n'));

// Build js/canvas_dl.js
fs.writeFileSync('js/canvas_dl.js', [DL_CANVAS].join('\n\n'));

// Build js/app.js (Everything else)
fs.writeFileSync('js/app.js', [
  STATE,
  LOGIN,
  APP_START,
  IMAGE,
  STEPS,
  RENDER,
  NAV,
  DL_BADGE,
  COPY,
  COUNTDOWN,
  TOAST,
  BOOT
].join('\n\n'));

console.log('Extraction complete.');
