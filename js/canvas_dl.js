/* ═══════════════════════════════════════════════

═══════════════════════════════════════════════ */
async function downloadCard() {
  if ((S.dlCount || 0) >= MAX_DL) { showToast('今日下载已达上限'); return; }

  // 锁定当前位置，防止下载过程中翻页导致错误
  const lockedPos = S.pos;
  const btn = document.getElementById('dlBtn');
  btn._busy = true;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中';

  try {
    const q = TQ[lockedPos];
    const dt = fmtDate();

    // 2× 高清：2160px 输出
    const SZ = 2160;
    const cv = document.createElement('canvas');
    cv.width = cv.height = SZ;
    const ctx = cv.getContext('2d');

    // ── 所有尺寸常量按 2× 缩放 ──────────────────────────
    const PAD = 80;   // 内边距
    const CM = 64;   // 角标长度
    const CO = 52;   // 角标偏移

    // ① 纯暗色精致背景（无图片）
    // ① 纯净底色（无任何纹理和背景）
    ctx.fillStyle = '#0b0b0b'; // 纯黑色底，可根据需要直接改为 rgba(0,0,0,0) 实现完全透明
    ctx.fillRect(0, 0, SZ, SZ);

    // ② 四角金色角标
    ctx.strokeStyle = 'rgba(191,160,106,0.45)';
    ctx.lineWidth = 2.5;
    [[CO, CO, 1, 1], [SZ - CO, CO, -1, 1], [CO, SZ - CO, 1, -1], [SZ - CO, SZ - CO, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * CM, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * CM);
      ctx.stroke();
    });

    // ④ 顶部标签：DAY · NNN
    const dayNum = String(daysSinceFirst(currentUser)).padStart(3, '0');
    ctx.fillStyle = 'rgba(191,160,106,0.55)';
    ctx.fillRect(CO + 4, CO + 10, 36, 3);
    ctx.save();
    ctx.font = '400 42px "Courier New", monospace';
    ctx.fillStyle = '#BFA06A';
    ctx.fillText(`DAY · ${dayNum}`, CO + 50, CO + 36);
    ctx.restore();

    // ⑤ 右上角日期
    ctx.save();
    ctx.font = '400 36px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.textAlign = 'right';
    ctx.fillText(dt.full, SZ - CO, CO + 28);
    ctx.fillText(dt.week.toUpperCase(), SZ - CO, CO + 72);
    ctx.textAlign = 'left';
    ctx.restore();

    // ⑥ 中文语录
    const cnText = q.cn || '';
    const cnMaxW = SZ - PAD * 2 - 80; // 留出更多呼吸空间
    const cnSz = cnText.length > 25 ? 68 : 78;
    const cnLH = cnSz * 2.1; // 增加行高，提升呼吸感
    ctx.save();
    ctx.font = `300 ${cnSz}px "PingFang SC","Microsoft YaHei","Noto Serif SC",sans-serif`;
    ctx.fillStyle = 'rgba(236,228,214,0.95)';
    const cnLines = wrapCtx(ctx, cnText, cnMaxW);
    const bodyTop = SZ * 0.35 + (3 - cnLines.length) * 20; // 动态居中补偿
    cnLines.forEach((l, i) => ctx.fillText(l, PAD + 20, bodyTop + i * cnLH));
    ctx.restore();

    // ⑦ 英文语录（使用最新的 Cormorant Garamond，更加优雅）
    const enText = q.en || '';
    const enSz = enText.length > 70 ? 42 : 50;
    const enLH = enSz * 1.6;
    const enMaxW = SZ - PAD * 2 - 80;
    const enTop = bodyTop + cnLines.length * cnLH + 60;
    ctx.save();
    ctx.font = `italic 400 ${enSz}px "Cormorant Garamond", "Playfair Display", serif`;
    ctx.fillStyle = 'rgba(236,228,214,0.45)';
    const enLines = wrapCtx(ctx, enText ? `"${enText}"` : '', enMaxW);
    enLines.forEach((l, i) => ctx.fillText(l, PAD + 20, enTop + i * enLH));
    ctx.restore();

    // ⑧ 分割线（金色短线取代长线，更显精致）
    const bottomBase = enTop + enLines.length * enLH + 100;
    const gDiv = ctx.createLinearGradient(PAD + 20, 0, PAD + 220, 0);
    gDiv.addColorStop(0, 'rgba(191,160,106,0.6)');
    gDiv.addColorStop(1, 'rgba(191,160,106,0)');
    ctx.strokeStyle = gDiv;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(PAD + 20, bottomBase);
    ctx.lineTo(PAD + 220, bottomBase);
    ctx.stroke();

    // ⑨ 作者名（适度减弱字号，提高高级感）
    ctx.save();
    ctx.font = `400 64px "PingFang SC","Microsoft YaHei","Noto Serif SC",sans-serif`;
    ctx.fillStyle = 'rgba(236,228,214,0.9)';
    ctx.fillText(q.author || "佚名", PAD + 20, bottomBase + 100);
    ctx.restore();

    // ⑩ 来源、头衔 (Sub)
    ctx.save();
    ctx.font = `300 36px "PingFang SC","Microsoft YaHei","Noto Serif SC",sans-serif`;
    ctx.fillStyle = 'rgba(191,160,106,0.7)';
    ctx.fillText(q.sub || "文学摘要", PAD + 20, bottomBase + 160);
    ctx.restore();

    /* download */
    const a = document.createElement('a');
    a.download = `daily-quote-${dt.full.replace(/\./g, '-')}.png`;
    a.href = cv.toDataURL('image/png', 1.0); a.click();

    S.dlCount = (S.dlCount || 0) + 1;
    saveUserState(currentUser, S);
    showToast(`已保存  今日剩余 ${MAX_DL - S.dlCount} 次`);

  } catch (err) {
    console.error('Download error:', err);
    showToast('下载失败，请重试');
  } finally {
    // Restore button structure FIRST, then update badge
    btn._busy = false;
    btn.innerHTML = '<i class="fas fa-download"></i> 下载 <span class="dl-left" id="dlLeft"></span>';
    btn.disabled = false;
    updateDlBadge();
  }
}

function wrapCtx(ctx, text, maxW) {
  const chars = [...text]; const lines = []; let line = '';
  for (const ch of chars) {
    const t = line + ch;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = ch; }
    else line = t;
  }
  if (line) lines.push(line); return lines;
}
