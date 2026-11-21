(function () {
    var intro = document.getElementById('intro');
    var seen = false;
    try { seen = sessionStorage.getItem('tb-intro') === '1'; } catch (e) {}
    if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) { intro.remove(); return; }
    try { sessionStorage.setItem('tb-intro', '1'); } catch (e) {}

    var canvas = intro.querySelector('canvas'), ctx = canvas.getContext('2d');
    var logo = intro.querySelector('.intro-logo');
    var css = getComputedStyle(document.documentElement);
    function v(n) { return css.getPropertyValue(n).trim(); }
    function rgb(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.replace(/./g, '$&$&'); var n = parseInt(hex, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    var bg = rgb(v('--bg') || '#EEF2EA');
    var cols = [v('--jay'), v('--cardinal'), v('--hummer')];

    var W, H, S, dpr;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight; S = Math.min(W, H);
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = 'rgb(' + bg + ')'; ctx.fillRect(0, 0, W, H);
    }
    size(); addEventListener('resize', size);

    // Shapes are sampled as N points so a circle can melt smoothly into a bird.
    var N = 60;
    var circle = [];
    for (var i = 0; i < N; i++) { var a = i / N * Math.PI * 2; circle.push([Math.cos(a), Math.sin(a)]); }
    function birdPts(flap) {
      // A minimal bird: beak tip, swept wings, a notch for the tail. flap: 0..1
      var wy = .55 + .45 * flap, wx = -.55 - .25 * (1 - flap);
      var poly = [[1.15, 0], [wx, -wy * 1.1], [-.25 + .2 * flap, 0], [wx, wy * 1.1]];
      var len = [], tot = 0;
      for (var k = 0; k < 4; k++) { var p = poly[k], q = poly[(k + 1) % 4]; var l = Math.hypot(q[0] - p[0], q[1] - p[1]); len.push(l); tot += l; }
      var pts = [];
      for (var i = 0; i < N; i++) {
        // start at the beak (angle 0 on the circle) and walk the same way round
        var d = i / N * tot, k = 0;
        while (d > len[k]) { d -= len[k]; k++; }
        var p = poly[k], q = poly[(k + 1) % 4], t = d / len[k];
        pts.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
      return pts;
    }
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function clamp(t) { return Math.max(0, Math.min(1, t)); }

    var T_ORBIT = 1150, T_MORPH = 1550, T_END = 3000;
    var start = null, done = false, raf;
    var birds = [0, 1, 2].map(function (i) { return { phase: i / 3 * Math.PI * 2 - Math.PI / 2, col: cols[i] }; });

    var last = null;
    function frame(now) {
      if (!start) { start = now; last = now; }
      var t = now - start, dt = Math.min(.05, (now - last) / 1000); last = now;
      ctx.fillStyle = 'rgb(' + bg + ')';
      ctx.fillRect(0, 0, W, H);

      var cx = W / 2, cy = H / 2;
      var r0 = S * .2;
      var orbitT = clamp(t / T_ORBIT);
      var spin = Math.PI * 2 * (1.9 * ease(orbitT) + Math.max(0, t - T_ORBIT) / 420);
      var R = r0 * (1 - .45 * ease(orbitT)) + r0 * .25 * ease(clamp((t - T_ORBIT) / 400));
      var morph = ease(clamp((t - T_ORBIT + 150) / 450));
      var dotR = S * (.035 - .006 * orbitT);

      birds.forEach(function (b, i) {
        var ang = b.phase + spin, x, y, heading, scale = dotR, alpha = 1;
        if (t < T_MORPH) {
          x = cx + Math.cos(ang) * R; y = cy + Math.sin(ang) * R;
          heading = ang + Math.PI / 2;
          b.x = x; b.y = y; b.h = heading;
        } else {
          // release: each bird peels off along its last heading, then banks upward into a fan
          var ft = (t - T_MORPH) / 1000;
          var speed = S * (.8 + ft * 1.8);
          var target = -Math.PI / 2 + (i - 1) * .6;
          var diff = Math.atan2(Math.sin(target - b.h), Math.cos(target - b.h));
          b.h += diff * Math.min(1, dt * 3.4);
          b.x += Math.cos(b.h) * speed * dt; b.y += Math.sin(b.h) * speed * dt;
          x = b.x; y = b.y; heading = b.h;
          scale = dotR * (1 + .35 * Math.sin(Math.min(ft, 1) * Math.PI)) * (1 - .45 * clamp(ft / 1.3));
          alpha = 1 - clamp((ft - .9) / .5);
        }
        // trail: a smooth tapered ribbon over the last ~220ms
        b.hist = b.hist || [];
        b.hist.push({ x: x, y: y, t: t });
        while (b.hist.length && t - b.hist[0].t > 220) b.hist.shift();
        ctx.lineCap = 'round'; ctx.strokeStyle = b.col;
        for (var k = 1; k < b.hist.length; k++) {
          var f = k / b.hist.length;
          ctx.globalAlpha = alpha * f * f * .55;
          ctx.lineWidth = scale * 1.5 * f;
          ctx.beginPath(); ctx.moveTo(b.hist[k - 1].x, b.hist[k - 1].y); ctx.lineTo(b.hist[k].x, b.hist[k].y); ctx.stroke();
        }

        var flap = t < T_MORPH ? 1 : .5 + .5 * Math.cos((t - T_MORPH) / 95);
        var bird = birdPts(flap);
        var c = Math.cos(heading), sn = Math.sin(heading);
        ctx.beginPath();
        for (var k = 0; k < N; k++) {
          var px = circle[k][0] + (bird[k][0] - circle[k][0]) * morph;
          var py = circle[k][1] + (bird[k][1] - circle[k][1]) * morph;
          var rx = (px * c - py * sn) * scale + x, ry = (px * sn + py * c) * scale + y;
          k ? ctx.lineTo(rx, ry) : ctx.moveTo(rx, ry);
        }
        ctx.closePath();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = b.col; ctx.fill();
        ctx.globalAlpha = 1;
      });

      if (t > T_MORPH + 150 && !logo.classList.contains('show')) logo.classList.add('show');
      if (t > T_END) { end(); return; }
      raf = requestAnimationFrame(frame);
    }
    function end() {
      if (done) return; done = true;
      cancelAnimationFrame(raf);
      logo.classList.add('show');
      setTimeout(function () { intro.classList.add('done'); }, 350);
      setTimeout(function () { intro.remove(); }, 1000);
    }
    raf = requestAnimationFrame(frame);
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
  })();
