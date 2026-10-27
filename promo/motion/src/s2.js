MOTION.scene({ id: 's2',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 820);
    rsWords(ctx, t, 'l2', 'برنامج مصمّم لك', 540, 340, { size: 112, color: P.ink, accIdx: [2] }, [0, 1, 2]);
    // الكرت
    const ka = at(lt, .05, .45, 'expoOut');
    X.save(); X.globalAlpha = ka; X.translate(540, 840); X.scale(.94 + .06 * ka, .94 + .06 * ka); X.translate(-540, -840);
    rsRR(X, 110, 520, 860, 640, 44); X.fillStyle = '#202124'; X.fill(); X.lineWidth = 3; X.strokeStyle = '#3A3B40'; X.stroke();
    // العدّاد 0 → 100
    const kn = at(t, ctx.wordTime('l2', 1).s, ctx.wordTime('l2', 2).e + .25, 'expoOut');
    ctx.text(X, ctx.num(Math.round(100 * kn)) + '%', 540, 800, { family: 'num', weight: 700, size: 250, color: P.acc, dir: 'ltr' });
    ctx.text(X, 'برنامج مخصّص لك', 540, 960, { family: 'display', weight: 800, size: 78, color: P.ink });
    // شريط تقدم تحت
    rsRR(X, 230, 1050, 620, 16, 8); X.fillStyle = '#2A2B2F'; X.fill();
    rsRR(X, 850 - 620 * kn, 1050, 620 * kn, 16, 8); X.fillStyle = P.acc; X.fill();
    X.restore();
    // شرائح «هدفك» و«وقتك»
    const chips = [{ i: 4, label: 'هدفك', cx: 735, icon: 'goal' }, { i: 5, label: 'وقتك', cx: 340, icon: 'clock' }];
    for (const c of chips) {
      const w = ctx.wordTime('l2', c.i), k = at(t, w.s - .1, w.s + .25, 'expoOut');
      if (k <= 0) continue;
      ctx.drawPath(X, [[c.cx, 1170], [c.cx, 1255]], at(t, w.s - .1, w.s + .15), { width: 4, color: P.acc, cap: 'round' });
      X.save(); X.globalAlpha = k; X.translate(0, (1 - k) * 50);
      rsRR(X, c.cx - 185, 1260, 370, 130, 65); X.fillStyle = 'rgba(255,84,32,0.14)'; X.fill(); X.lineWidth = 3; X.strokeStyle = P.acc; X.stroke();
      const ix = c.cx + 115, iy = 1325;
      X.strokeStyle = P.acc; X.lineWidth = 6; X.lineCap = 'round';
      if (c.icon === 'goal') { for (const r of [34, 20]) { X.beginPath(); X.arc(ix, iy, r, 0, Math.PI * 2); X.stroke(); } X.fillStyle = P.acc; X.beginPath(); X.arc(ix, iy, 7, 0, Math.PI * 2); X.fill(); }
      else { X.beginPath(); X.arc(ix, iy, 34, 0, Math.PI * 2); X.stroke(); const a = -Math.PI / 2 + lt * 4; X.beginPath(); X.moveTo(ix, iy); X.lineTo(ix + Math.cos(a) * 24, iy + Math.sin(a) * 24); X.moveTo(ix, iy); X.lineTo(ix, iy - 16); X.stroke(); }
      ctx.text(X, c.label, c.cx + 58, 1350, { family: 'display', weight: 900, size: 72, color: P.ink, align: 'right' });
      X.restore();
    }
  } });
