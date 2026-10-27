MOTION.scene({ id: 's6',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 820);
    rsWords(ctx, t, 'l6', 'الكابتن يتابع تقدّمك', 540, 320, { size: 94, color: P.ink, accIdx: [2] }, [0, 1, 2]);
    // لوحة الرسم
    const kb = at(lt, 0, .4, 'expoOut');
    X.save(); X.globalAlpha = kb;
    rsRR(X, 100, 470, 880, 660, 44); X.fillStyle = '#202124'; X.fill(); X.lineWidth = 3; X.strokeStyle = '#3A3B40'; X.stroke();
    X.strokeStyle = 'rgba(233,221,215,0.07)'; X.lineWidth = 2;
    for (let i = 1; i < 5; i++) { X.beginPath(); X.moveTo(160, 520 + i * 115); X.lineTo(920, 520 + i * 115); X.stroke(); }
    X.restore();
    const pts = [[170, 1040], [290, 1000], [410, 1015], [530, 900], [650, 860], [770, 740], [900, 600]];
    const kl = at(t, ctx.wordTime('l6', 1).s - .1, ctx.wordTime('l6', 3).s, 'cubicInOut');
    if (kl > 0) {
      // تعبئة تحت الخط
      const info = ctx.pathInfo(pts), tipX = 170 + (900 - 170) * kl;
      X.save(); X.beginPath(); X.rect(150, 480, tipX - 150, 650); X.clip();
      const g = X.createLinearGradient(0, 600, 0, 1100); g.addColorStop(0, 'rgba(255,84,32,0.30)'); g.addColorStop(1, 'rgba(255,84,32,0)');
      X.beginPath(); X.moveTo(170, 1100); pts.forEach(p => X.lineTo(p[0], p[1])); X.lineTo(900, 1100); X.closePath(); X.fillStyle = g; X.fill(); X.restore();
      ctx.drawPath(X, pts, kl, { width: 10, color: P.acc, cap: 'round', tip: { r: 16, color: P.ink } });
    }
    // «أولاً بأول» + نسبة الالتزام
    const w3 = ctx.wordTime('l6', 3), kc = at(t, w3.s - .1, w3.s + .25, 'expoOut');
    if (kc > 0) {
      X.save(); X.globalAlpha = kc; X.translate(0, (1 - kc) * 40);
      X.lineWidth = 18; X.strokeStyle = '#2A2B2F'; X.beginPath(); X.arc(780, 1310, 84, 0, Math.PI * 2); X.stroke();
      X.strokeStyle = P.acc; X.lineCap = 'round'; X.beginPath(); X.arc(780, 1310, 84, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * .86 * at(t, w3.s, w3.s + .9, 'expoOut')); X.stroke();
      rsCheck(ctx, 780, 1310, 70, at(t, w3.s + .5, w3.s + .8), P.acc, 10);
      ctx.text(X, 'نسبة التزامك', 660, 1297, { family: 'display', weight: 900, size: 80, color: P.ink, align: 'right' });
      ctx.text(X, 'أولاً بأول', 660, 1385, { family: 'display', weight: 900, size: 64, color: P.acc, align: 'right', alpha: at(t, ctx.wordTime('l6', 4).s - .1, ctx.wordTime('l6', 4).s + .2) });
      X.restore();
    }
  } });
