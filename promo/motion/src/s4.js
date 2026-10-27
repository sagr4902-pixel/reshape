MOTION.scene({ id: 's4',
  setup(ctx) {
    const { THREE } = ctx, P = ctx.P;
    this.st = ctx.stage3D({ fov: 28, camera: [0, 0, 23], env: 'room', tone: 'neutral' });
    const body = new THREE.Mesh(new ctx.RoundedBoxGeometry(3.3, 6.8, .34, 8, .42),
      new THREE.MeshPhysicalMaterial({ color: '#2F3034', metalness: .75, roughness: .28, clearcoat: .6, envMapIntensity: .9 }));
    this.cv = document.createElement('canvas'); this.cv.width = 600; this.cv.height = 1260;
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(3.04, 6.38), new THREE.MeshBasicMaterial({ map: this.tex, toneMapped: false }));
    scr.position.z = .175;
    this.phone = new THREE.Group(); this.phone.add(body); this.phone.add(scr); this.st.add(this.phone);
    this.P = P;
  },
  paintScreen(ctx, lt) {
    const X = this.cv.getContext('2d'), P = this.P, W = 600, H = 1260;
    X.fillStyle = '#111113'; X.fillRect(0, 0, W, H);
    // «فيديو» : لوح داكن بخطوط حركة
    const g = X.createLinearGradient(0, 120, 0, 820); g.addColorStop(0, '#2A2B2F'); g.addColorStop(1, '#17181A');
    X.fillStyle = g; X.beginPath(); X.roundRect(36, 130, 528, 680, 36); X.fill();
    X.strokeStyle = 'rgba(255,84,32,0.25)'; X.lineWidth = 3;
    for (let i = 0; i < 6; i++) { const y = 200 + i * 100 + ((lt * 120) % 100); X.beginPath(); X.moveTo(70, y); X.lineTo(530, y - 60); X.stroke(); }
    const pk = ctx.E.expoOut(ctx.clamp((lt - .3) / .4, 0, 1));
    X.fillStyle = P.acc; X.beginPath(); X.arc(300, 470, 92 * (.9 + .1 * pk), 0, Math.PI * 2); X.fill();
    X.fillStyle = '#FFFFFF'; X.beginPath(); X.moveTo(272, 420); X.lineTo(272, 520); X.lineTo(352, 470); X.closePath(); X.fill();
    // شريط التشغيل
    const pr = ctx.clamp((lt - .4) / 2.6, 0, 1);
    X.fillStyle = '#2A2B2F'; X.beginPath(); X.roundRect(70, 860, 460, 12, 6); X.fill();
    X.fillStyle = P.acc; X.beginPath(); X.roundRect(530 - 460 * pr, 860, 460 * pr, 12, 6); X.fill();
    X.beginPath(); X.arc(530 - 460 * pr, 866, 16, 0, Math.PI * 2); X.fill();
    // صفوف تمارين
    for (let i = 0; i < 3; i++) { X.fillStyle = '#1D1E21'; X.beginPath(); X.roundRect(36, 930 + i * 100, 528, 80, 22); X.fill();
      X.fillStyle = i === 0 ? P.acc : '#3A3B40'; X.beginPath(); X.arc(510, 970 + i * 100, 16, 0, Math.PI * 2); X.fill();
      X.fillStyle = '#444448'; X.beginPath(); X.roundRect(110, 960 + i * 100, 330 - i * 60, 18, 9); X.fill(); }
    this.tex.needsUpdate = true;
  },
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 900);
    this.paintScreen(ctx, lt);
    const ki = at(lt, 0, .9, 'expoOut');
    this.phone.rotation.set(.12 - .1 * ki + Math.sin(lt * 1.3) * .03, -.9 + 1.1 * ki + Math.sin(lt * .9) * .06, .05 * (1 - ki));
    this.phone.position.set(0, -.15 + (1 - ki) * -3 + Math.sin(lt * 1.6) * .08, 0);
    this.st.draw(X);
    rsWords(ctx, t, 'l4', 'فيديو لكل تمرين', 540, 300, { size: 112, color: P.ink, accIdx: [0] }, [0, 1, 2]);
    // تكنيك صحيح ✓
    const w3 = ctx.wordTime('l4', 3), kt = at(t, w3.s - .1, w3.s + .25, 'expoOut');
    if (kt > 0) {
      X.save(); X.globalAlpha = kt; X.translate(0, (1 - kt) * 40);
      rsRR(X, 150, 1330, 780, 150, 75); X.fillStyle = '#202124'; X.fill(); X.lineWidth = 3; X.strokeStyle = '#3A3B40'; X.stroke();
      X.fillStyle = P.acc; X.beginPath(); X.arc(840, 1405, 46, 0, Math.PI * 2); X.fill();
      rsCheck(ctx, 840, 1405, 52, at(t, ctx.wordTime('l4', 4).s - .05, ctx.wordTime('l4', 4).s + .25), '#FFFFFF', 9);
      ctx.text(X, 'تكنيك صحيح من أول يوم', 770, 1428, { family: 'display', weight: 900, size: 62, color: P.ink, align: 'right' });
      X.restore();
    }
  } });
