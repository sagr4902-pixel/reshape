MOTION.scene({ id: 's1',
  setup(ctx) {
    const { THREE } = ctx, P = ctx.P;
    this.st = ctx.stage3D({ fov: 30, camera: [0, 0, 26], env: 'room', tone: 'neutral', exposure: 1.0 });
    const geo = new ctx.RoundedBoxGeometry(1, 1, 1, 4, .16);
    const mats = [new THREE.MeshPhysicalMaterial({ color: P.acc, roughness: .38, clearcoat: .3, envMapIntensity: .55 }),
                  new THREE.MeshPhysicalMaterial({ color: P.clay, roughness: .42, clearcoat: .2, envMapIntensity: .5 }),
                  new THREE.MeshPhysicalMaterial({ color: '#2F3034', roughness: .55, metalness: .2, envMapIntensity: .6 })];
    this.grp = new THREE.Group(); this.st.add(this.grp);
    const r = ctx.rng('cubes'); this.cubes = [];
    let i = 0;
    for (let gx = -1; gx <= 1; gx++) for (let gy = -1; gy <= 1; gy++) for (let gz = -1; gz <= 1; gz++) {
      const m = new THREE.Mesh(geo, mats[(gx + gy + gz + 6) % 3 === 0 ? 0 : ((gx * gy + 3) % 2 ? 1 : 2)]);
      const a = r() * Math.PI * 2, d = r.range(6, 11);
      this.cubes.push({ m, to: [gx * 1.06, gy * 1.06, gz * 1.06], from: [Math.cos(a) * d, Math.sin(a) * d * 1.3, r.range(-6, 3)],
        rot: [r.range(-4, 4), r.range(-4, 4), r.range(-4, 4)], delay: i * .022 + r() * .12 });
      this.grp.add(m); i++;
    }
  },
  draw(t, lt, ctx) {
    const { X, P, at } = ctx;
    rsBG(ctx, t, 540, 960);
    const wMore = ctx.wordTime('l1', 2);
    for (const c of this.cubes) {
      const k = at(lt, .05 + c.delay, .95 + c.delay, 'expoOut');
      c.m.position.set(...c.from.map((v, j) => v + (c.to[j] - v) * k));
      c.m.rotation.set(...c.rot.map(v => v * (1 - k)));
    }
    const pulse = at(t, wMore.s - .05, wMore.s + .35, 'expoOut') - at(t, wMore.s + .35, wMore.s + 1.0, 'sineInOut') * .5;
    this.grp.scale.setScalar(1 + .12 * pulse);
    this.grp.rotation.set(.45 + lt * .12, -.6 + lt * .55, 0);
    this.st.camera.position.set(0, -.3, 27 - 3 * at(lt, 0, 1.4, 'expoOut'));
    this.st.draw(X);
    rsWords(ctx, t, 'l1', 'جسمك يستطيع', 540, 380, { size: 132, color: P.ink }, [0, 1]);
    // «أكثر» تتمدد بكشيدة
    const k = at(t, wMore.s - .05, wMore.e + .3, 'expoInOut');
    if (t > wMore.s - .08) {
      const a = at(t, wMore.s - .08, wMore.s + .12, 'expoOut');
      X.save(); X.globalAlpha = a; X.translate(0, (1 - a) * 60);
      ctx.text.drawKashida(X, 'أكثر', 540, 1430, 820, { family: 'display', weight: 900, size: 300, color: P.acc }, k);
      X.restore();
    }
  } });
