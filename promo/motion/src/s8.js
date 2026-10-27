MOTION.scene({ id: 's8',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 960);
    const prim = ctx.img('primary');
    const kl = at(lt, 0, .4, 'expoOut');
    X.save(); X.globalAlpha = kl; X.drawImage(prim, 540 - 315, 300 - (1 - kl) * 30, 630, 210); X.restore();
    const w0 = ctx.wordTime('l8', 0), w1 = ctx.wordTime('l8', 1), w2 = ctx.wordTime('l8', 2);
    // الزر
    const kb = at(t, w0.s - .15, w0.s + .3, 'expoOut');
    const press = at(t, w1.e + .05, w1.e + .15, 'quadOut') - at(t, w1.e + .15, w1.e + .45, 'expoOut');
    if (kb > 0) {
      const s = (.94 + .06 * kb) * (1 - .04 * press);
      X.save(); X.globalAlpha = kb; X.translate(540, 820); X.scale(s, s);
      rsRR(X, -420, -95, 840, 190, 95); X.fillStyle = P.acc; X.fill();
      // لمعة تمرّ على الزر عند «الآن»
      const sh = at(t, w1.s, w1.s + .6, 'cubicInOut');
      if (sh > 0 && sh < 1) { X.save(); rsRR(X, -420, -95, 840, 190, 95); X.clip(); const sx = 520 - 1040 * sh;
        const g = X.createLinearGradient(sx - 120, 0, sx + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        X.fillStyle = g; X.fillRect(-420, -95, 840, 190); X.restore(); }
      ctx.text(X, 'ابدأ التسجيل الآن', 0, 30, { family: 'display', weight: 900, size: 92, color: '#FFFFFF' });
      X.restore();
      // دائرة الضغطة
      const kt = at(t, w1.e + .05, w1.e + .6, 'expoOut');
      if (kt > 0 && kt < 1) { X.strokeStyle = P.ink; X.globalAlpha = 1 - kt; X.lineWidth = 5; X.beginPath(); X.arc(380, 840, 30 + 90 * kt, 0, Math.PI * 2); X.stroke(); X.globalAlpha = 1; }
    }
    // «دقيقتان» بساعة إيقاف
    const kd = at(t, w2.s - .12, w2.s + .25, 'expoOut');
    if (kd > 0) {
      X.save(); X.globalAlpha = kd; X.translate(0, (1 - kd) * 40);
      const cx = 850, cy = 1080;
      X.strokeStyle = P.acc; X.lineWidth = 9; X.lineCap = 'round';
      X.beginPath(); X.arc(cx, cy, 58, 0, Math.PI * 2); X.stroke();
      X.beginPath(); X.moveTo(cx, cy - 58); X.lineTo(cx, cy - 76); X.moveTo(cx - 16, cy - 80); X.lineTo(cx + 16, cy - 80); X.stroke();
      const a = -Math.PI / 2 + Math.PI * 2 * at(t, w2.s, w2.s + 1.4, 'cubicInOut') * 2;
      X.beginPath(); X.moveTo(cx, cy); X.lineTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40); X.stroke();
      ctx.text(X, 'دقيقتان فقط', 760, 1112, { family: 'display', weight: 900, size: 104, color: P.ink, align: 'right' });
      X.restore();
    }
    const kn = at(t, w2.e, w2.e + .4, 'expoOut');
    if (kn > 0) {
      ctx.text(X, 'التسجيل لا يلزمك بالدفع', 540, 1290 + (1 - kn) * 20, { family: 'display', weight: 800, size: 62, color: P.mut, alpha: kn });
      ctx.text(X, 'reshape-online.com', 540, 1410 + (1 - kn) * 20, { family: 'num', weight: 600, size: 66, color: P.ink, dir: 'ltr', alpha: kn });
    }
  } });
