// ── مشترك لكل المشاهد (ينسخه build.sh أول كل ملف) ──
function rsBG(ctx, t, gx, gy) {
  const { X, P, W, H } = ctx;
  X.fillStyle = P.bg; X.fillRect(0, 0, W, H);
  const g = X.createRadialGradient(gx, gy, 0, gx, gy, 950);
  g.addColorStop(0, 'rgba(255,84,32,0.16)'); g.addColorStop(1, 'rgba(255,84,32,0)');
  X.fillStyle = g; X.fillRect(0, 0, W, H);
  X.fillStyle = 'rgba(233,221,215,0.055)';
  const drift = (t * 14) % 60;
  for (let y = -60; y < H + 60; y += 60) for (let x = 30; x < W; x += 60) X.fillRect(x - 1.5, y + drift - 1.5, 3, 3);
}
// كلمات تطلع من تحت خط الأساس كلمة كلمة على وقت نطقها. map[i] = رقم الكلمة المنطوقة
function rsWords(ctx, t, line, str, x, y, o, map) {
  const { X } = ctx;
  const L = ctx.text.layout(X, str, { family: o.family || 'display', weight: o.weight || 900, size: o.size, maxWidth: o.maxWidth || 1400 });
  return ctx.text.drawLayout(X, L, x, y, { align: o.align || 'center', color: o.color, perWord: (i) => {
    const w = ctx.wordTime(line, map ? map[i] : i), k = ctx.at(t, w.s - .1, w.s + .2, 'expoOut');
    const c = o.accIdx && o.accIdx.includes(i) ? ctx.P.acc : undefined;
    return { clipUp: 1, dy: (1 - k) * o.size * .75, alpha: k > 0 ? 1 : 0, color: c };
  } });
}
function rsRR(X, x, y, w, h, r) { X.beginPath(); X.roundRect(x, y, w, h, r); }
function rsCheck(ctx, cx, cy, s, k, color, width) {
  if (k <= 0) return;
  ctx.drawPath(ctx.X, [[cx - s * .42, cy + s * .02], [cx - s * .12, cy + s * .3], [cx + s * .45, cy - s * .32]], k, { width: width || s * .16, color, cap: 'round' });
}
