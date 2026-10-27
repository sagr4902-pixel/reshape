MOTION.scene({ id: 's7',
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 760);
    const badge = ctx.img('badge'), mark = ctx.img('mark'), word = ctx.img('word');
    // الختم يلف بالخلفية
    X.save(); X.globalAlpha = .07 * at(lt, 0, .6); X.translate(540, 760); X.rotate(lt * .25); X.drawImage(badge, -460, -452, 920, 904); X.restore();
    const w0 = ctx.wordTime('l7', 0), km = at(t, w0.s - .25, w0.s + .3, 'expoOut');
    // الشعار: نصّين ينزلقون ويتجمّعون
    const mw = 380, mh = 350, mx = 540 - mw / 2, my = 420;
    if (km > 0) {
      X.save(); X.globalAlpha = km;
      X.save(); X.beginPath(); X.rect(mx - 40, my - 40, mw + 80, mh / 2 + 40); X.clip(); X.drawImage(mark, mx + (1 - km) * 260, my, mw, mh); X.restore();
      X.save(); X.beginPath(); X.rect(mx - 40, my + mh / 2, mw + 80, mh / 2 + 40); X.clip(); X.drawImage(mark, mx - (1 - km) * 260, my, mw, mh); X.restore();
      X.restore();
      // حلقة نبضة
      const kr = at(t, w0.s, w0.s + .7, 'expoOut');
      if (kr > 0 && kr < 1) { X.strokeStyle = P.acc; X.globalAlpha = 1 - kr; X.lineWidth = 6; X.beginPath(); X.arc(540, my + mh / 2, 200 + 260 * kr, 0, Math.PI * 2); X.stroke(); X.globalAlpha = 1; }
    }
    // الكلمة reshape تنكشف من اليسار
    const kw = at(t, w0.s + .05, w0.s + .55, 'expoInOut');
    if (kw > 0) { const ww = 600, wh = 178, wx = 540 - ww / 2, wy = 830;
      X.save(); X.beginPath(); X.rect(wx - 10, wy - 10, (ww + 20) * kw, wh + 20); X.clip(); X.drawImage(word, wx, wy, ww, wh); X.restore();
      ctx.drawPath(X, [[wx, wy + wh + 30], [wx + ww, wy + wh + 30]], kw, { width: 5, color: P.acc, cap: 'round' }); }
    rsWords(ctx, t, 'l7', 'تدرّب مع', 540, 1170, { size: 78, weight: 800, color: P.mut }, [1, 2]);
    rsWords(ctx, t, 'l7', 'الكابتن محمد الصقر', 520, 1290, { size: 88, color: P.ink, accIdx: [2] }, [3, 4, 5]);
    const w5 = ctx.wordTime('l7', 4), ke = at(t, w5.s - .1, w5.s + .2, 'expoOut');
    if (ke > 0) {
      X.save(); X.globalAlpha = ke; X.translate(0, (1 - ke) * 30);
      rsRR(X, 300, 1360, 480, 104, 52); X.fillStyle = 'rgba(255,84,32,0.14)'; X.fill(); X.lineWidth = 3; X.strokeStyle = P.acc; X.stroke();
      ctx.text(X, '10+', 690, 1432, { family: 'num', weight: 700, size: 70, color: P.acc, dir: 'ltr' });
      ctx.text(X, 'سنوات خبرة', 620, 1432, { family: 'display', weight: 900, size: 60, color: P.ink, align: 'right' });
      X.restore();
    }
  } });
