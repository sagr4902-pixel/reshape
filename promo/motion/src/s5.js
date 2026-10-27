MOTION.scene({ id: 's5',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 780);
    rsWords(ctx, t, 'l5', 'تسجّل كل مجموعة', 540, 320, { size: 100, color: P.ink, accIdx: [2] }, [0, 1, 2]);
    const t0 = ctx.wordTime('l5', 1).s, t1 = ctx.wordTime('l5', 4).s + .1;
    for (let i = 0; i < 4; i++) {
      const y = 470 + i * 150, ki = at(lt, .05 + i * .06, .4 + i * .06, 'expoOut');
      const tc = t0 + (t1 - t0) * i / 3, kc = at(t, tc, tc + .22, 'expoOut');
      X.save(); X.globalAlpha = ki; X.translate((1 - ki) * -80, 0);
      rsRR(X, 120, y, 840, 124, 34); X.fillStyle = kc > 0 ? 'rgba(255,84,32,' + (.14 * kc) + ')' : '#202124'; X.fill();
      X.fillStyle = '#202124'; if (kc <= 0) X.fill();
      X.lineWidth = 3; X.strokeStyle = kc > .5 ? P.acc : '#3A3B40'; X.stroke();
      // مربع الصح يمين
      X.lineWidth = 5; X.strokeStyle = kc > 0 ? P.acc : '#444448'; rsRR(X, 832, y + 30, 64, 64, 18); X.stroke();
      if (kc > 0) { X.fillStyle = P.acc; X.globalAlpha = ki * kc; rsRR(X, 832, y + 30, 64, 64, 18); X.fill(); X.globalAlpha = ki; }
      rsCheck(ctx, 864, y + 62, 48, kc, '#FFFFFF', 8);
      ctx.text(X, 'مجموعة', 690, y + 80, { family: 'display', weight: 800, size: 62, color: kc > .5 ? P.ink : P.mut });
      // شريط الأداء
      rsRR(X, 170, y + 52, 360, 20, 10); X.fillStyle = '#2A2B2F'; X.fill();
      const bw = (220 + i * 40) * at(t, tc - .05, tc + .35, 'expoOut'); if (bw > 1) { rsRR(X, 530 - bw, y + 52, bw, 20, 10); X.fillStyle = P.acc; X.fill(); }
      X.restore();
      if (kc > 0 && kc < 1) ctx.MK.burst(t, { s: tc, cx: 864, cy: y + 62, spread: 90 });
    }
    // مؤقّت الراحة
    const w3 = ctx.wordTime('l5', 3), kr = at(t, w3.s - .1, w3.s + .25, 'expoOut');
    if (kr > 0) {
      X.save(); X.globalAlpha = kr; X.translate(0, (1 - kr) * 40);
      X.lineWidth = 16; X.strokeStyle = '#2A2B2F'; X.beginPath(); X.arc(760, 1270, 88, 0, Math.PI * 2); X.stroke();
      const sw = Math.PI * 2 * (1 - ctx.clamp((t - w3.s) / 2.2, 0, 1) * .8);
      X.strokeStyle = P.acc; X.lineCap = 'round'; X.beginPath(); X.arc(760, 1270, 88, -Math.PI / 2, -Math.PI / 2 + sw); X.stroke();
      ctx.text(X, 'مؤقّت الراحة', 640, 1262, { family: 'display', weight: 900, size: 84, color: P.ink, align: 'right' });
      ctx.text(X, 'يشتغل معك تلقائياً', 640, 1345, { family: 'display', weight: 800, size: 54, color: P.mut, align: 'right' });
      X.restore();
    }
  } });
