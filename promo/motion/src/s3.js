MOTION.scene({ id: 's3',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 900);
    const hk = at(lt, 0, .35, 'expoOut');
    ctx.text(X, 'أيام تدريب مرنة', 540, 300, { family: 'display', weight: 800, size: 84, color: P.mut, alpha: hk });
    const w2 = ctx.wordTime('l3', 1), w6 = ctx.wordTime('l3', 3), wk = ctx.wordTime('l3', 6);
    // الرقم 2 يمين، 6 يسار (قراءة عربية)
    const k2 = at(t, w2.s - .1, w2.s + .25, 'expoOut'), k6 = at(t, w6.s - .1, w6.s + .25, 'expoOut');
    if (k2 > 0) { X.save(); X.globalAlpha = k2; X.translate(780, 760); X.scale(.92 + .08 * k2, .92 + .08 * k2);
      ctx.text(X, '2', 0, 0, { family: 'num', weight: 700, size: 380, color: P.ink, dir: 'ltr' });
      ctx.text(X, 'يومين', 0, 230, { family: 'display', weight: 900, size: 88, color: P.mut }); X.restore(); }
    // سهم مرسوم من 2 إلى 6
    const ka = at(t, ctx.wordTime('l3', 2).s - .05, w6.s + .05, 'cubicInOut');
    const tip = ctx.drawPath(X, 'M 640 640 C 580 560, 500 560, 440 640', ka, { width: 9, color: P.acc, cap: 'round' });
    if (ka > .97) { X.save(); X.translate(440, 640); X.rotate(2.2); X.strokeStyle = P.acc; X.lineWidth = 9; X.lineCap = 'round'; X.beginPath(); X.moveTo(-26, -14); X.lineTo(0, 0); X.lineTo(-26, 16); X.stroke(); X.restore(); }
    if (k6 > 0) { X.save(); X.globalAlpha = k6; X.translate(300, 760); X.scale(.92 + .08 * k6, .92 + .08 * k6);
      ctx.text(X, '6', 0, 0, { family: 'num', weight: 700, size: 380, color: P.acc, dir: 'ltr' });
      ctx.text(X, 'ستة أيام', 0, 230, { family: 'display', weight: 900, size: 88, color: P.mut }); X.restore(); }
    // أسبوع من 7 خانات: تتعبّى لين 2 ثم لين 6
    const fill = 2 * at(t, w2.s, w2.s + .3, 'expoOut') + 4 * at(t, w6.s, w6.s + .6, 'expoOut');
    for (let i = 0; i < 7; i++) {
      const x = 900 - i * 120, y = 1180, ki = at(lt, .08 + i * .045, .38 + i * .045, 'expoOut');
      const f = ctx.clamp(fill - i, 0, 1);
      X.save(); X.globalAlpha = ki; X.translate(0, (1 - ki) * 40);
      rsRR(X, x - 45, y, 90, 170, 45); X.fillStyle = '#202124'; X.fill(); X.lineWidth = 3; X.strokeStyle = '#3A3B40'; X.stroke();
      if (f > 0) { rsRR(X, x - 45, y + 170 * (1 - f), 90, 170 * f, 45); X.fillStyle = P.acc; X.fill(); }
      X.restore();
    }
    const kw = at(t, wk.s - .1, wk.s + .25, 'expoOut');
    if (kw > 0) ctx.text(X, 'في الأسبوع', 540, 1450 - (1 - kw) * 40, { family: 'display', weight: 900, size: 92, color: P.ink, alpha: kw });
  } });
