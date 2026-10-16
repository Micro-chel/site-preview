/* Avelis Frost — cold-chain frost that crystallises in from the screen edges and melts back.
   A growth map is drawn once on a 2D canvas (R = when a pixel freezes, G = crystal brightness);
   a full-screen WebGL pass thresholds it, so the freezing front follows dendrites, not a smooth vignette.
   API: const fr = Frost.create(canvas, {seed}); fr.set({amount: 0..1, wet: 0..1}).render(); */
(function (root) {
  'use strict';

  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }

  function growthMap(W, H, seed) {
    var rand = rng(seed);
    var A = document.createElement('canvas'); A.width = W; A.height = H; var a = A.getContext('2d');
    var B = document.createElement('canvas'); B.width = W; B.height = H; var b = B.getContext('2d');
    // R: distance from the nearest edge (0 at the edge, 255 deep inside), as the min of four gradients
    a.fillStyle = '#fff'; a.fillRect(0, 0, W, H); a.globalCompositeOperation = 'darken';
    var reach = 0.34;
    [[0, 0, W * reach, 0], [W, 0, W * (1 - reach), 0], [0, 0, 0, H * reach * 1.4], [0, H, 0, H * (1 - reach * 1.4)]].forEach(function (g) {
      var gr = a.createLinearGradient(g[0], g[1], g[2], g[3]); gr.addColorStop(0, '#000'); gr.addColorStop(1, '#fff');
      a.fillStyle = gr; a.fillRect(0, 0, W, H);
    });
    // rime haze: a faint matte film, thickest at the edges (brightness only)
    b.fillStyle = '#000'; b.fillRect(0, 0, W, H);
    for (var i = 0; i < 900; i++) {
      var e = Math.floor(rand() * 4), d = Math.pow(rand(), 2.6) * 0.22, x, y;
      if (e === 0) { x = d * W; y = rand() * H; } else if (e === 1) { x = W - d * W; y = rand() * H; }
      else if (e === 2) { x = rand() * W; y = d * H * 1.4; } else { x = rand() * W; y = H - d * H * 1.4; }
      var r = 10 + rand() * 40, gr = b.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,' + (0.05 + rand() * 0.07) + ')'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      b.fillStyle = gr; b.fillRect(x - r, y - r, r * 2, r * 2);
    }
    b.lineCap = a.lineCap = 'round';
    function seg(x0, y0, x1, y1, t, w, alpha) {
      var v = Math.max(0, Math.min(255, Math.floor(t * 255)));
      a.strokeStyle = 'rgb(' + v + ',' + v + ',' + v + ')'; a.lineWidth = w + 2;
      a.beginPath(); a.moveTo(x0, y0); a.lineTo(x1, y1); a.stroke();
      b.strokeStyle = 'rgba(255,255,255,' + alpha + ')'; b.lineWidth = w;
      b.beginPath(); b.moveTo(x0, y0); b.lineTo(x1, y1); b.stroke();
    }
    // a feather of window frost: a long, gently curving stem; dense needles leaning forward on both sides,
    // longest near the base, shortening to the tip; occasionally a needle sprouts a few barbs of its own
    function feather(x, y, ang, len, t0) {
      var step = 2.2, n = Math.floor(len / step), t = t0, curl = (rand() - 0.5) * 0.012, lean = 0.55 + rand() * 0.35;
      for (var i = 0; i < n; i++) {
        var f = i / n, nx = x + Math.cos(ang) * step, ny = y + Math.sin(ang) * step;
        t += 0.0042;
        seg(x, y, nx, ny, t, 1.1 - f * 0.5, 0.7 - f * 0.25);
        x = nx; y = ny; ang += curl + (rand() - 0.5) * 0.03;
        if (i % 2 === 0) {
          for (var sd = -1; sd <= 1; sd += 2) {
            if (rand() < 0.18) continue;
            var nl = len * (0.16 + rand() * 0.1) * Math.pow(1 - f, 0.8) * (0.6 + rand() * 0.6);
            var na = ang + sd * (lean + (rand() - 0.5) * 0.25), ex = x + Math.cos(na) * nl, ey = y + Math.sin(na) * nl;
            seg(x, y, ex, ey, t + nl / W * 0.9, 0.55, 0.45 + rand() * 0.25);
            if (nl > 18 && rand() < 0.25) {
              for (var k = 1; k <= 3; k++) {
                var px = x + (ex - x) * k / 4, py = y + (ey - y) * k / 4, bl = nl * 0.22, ba = na + sd * 0.6;
                seg(px, py, px + Math.cos(ba) * bl, py + Math.sin(ba) * bl, t + nl / W, 0.45, 0.35);
              }
            }
          }
        }
      }
    }
    var mn = Math.min(W, H);
    function fromEdge(depthMax) {
      var e = Math.floor(rand() * 4), inset = Math.pow(rand(), 2) * depthMax, x, y, ang;
      if (e === 0) { x = inset * W; y = rand() * H; ang = 0; } else if (e === 1) { x = W - inset * W; y = rand() * H; ang = Math.PI; }
      else if (e === 2) { x = rand() * W; y = inset * H; ang = Math.PI / 2; } else { x = rand() * W; y = H - inset * H; ang = -Math.PI / 2; }
      return [x, y, ang, inset];
    }
    for (i = 0; i < 38; i++) {
      var o = fromEdge(0.06);
      feather(o[0], o[1], o[2] + (rand() - 0.5) * 1.5, mn * (0.18 + rand() * 0.3), o[3] * 1.5 + rand() * 0.04);
    }
    // loose needles: straight, thin, mostly pointing inwards
    for (i = 0; i < 700; i++) {
      var q = fromEdge(0.16), l = 6 + Math.pow(rand(), 2) * 50, an = q[2] + (rand() - 0.5) * 2.2;
      seg(q[0], q[1], q[0] + Math.cos(an) * l, q[1] + Math.sin(an) * l, q[3] * 1.4 + 0.02 + rand() * 0.06, 0.5, 0.3 + rand() * 0.35);
    }
    var da = a.getImageData(0, 0, W, H).data, db = b.getImageData(0, 0, W, H).data;
    var out = new Uint8Array(W * H * 4);
    for (i = 0; i < W * H; i++) {
      // jitter the freeze time with a little noise so the front is never a clean line
      out[i * 4] = Math.min(255, da[i * 4] + Math.floor((rand() - 0.5) * 22 + 11));
      out[i * 4 + 1] = db[i * 4];
      out[i * 4 + 2] = 0; out[i * 4 + 3] = 255;
    }
    return out;
  }

  var VS = 'attribute vec2 aQ; varying vec2 vUv; void main(){ vUv = aQ*0.5+0.5; gl_Position = vec4(aQ,0.0,1.0); }';
  var FS = [
    'precision highp float;',
    'uniform sampler2D uMap; uniform float uAmount, uWet; uniform vec2 uTexel; varying vec2 vUv;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }',
    'void main(){',
    '  vec2 uv = vec2(vUv.x, 1.0-vUv.y);',
    '  vec4 m = texture2D(uMap, uv);',
    '  float t = uAmount*0.5 - m.r;',
    '  float vis = smoothstep(0.0, 0.03, t);',
    '  if(vis <= 0.0) discard;',
    // relief: the crystal lines catch light on one flank and shade on the other, like ice ridges on glass
    '  float g1 = texture2D(uMap, uv - uTexel*1.5).g, g2 = texture2D(uMap, uv + uTexel*1.5).g;',
    '  float relief = (g1 - g2);',
    '  float front = smoothstep(0.05, 0.0, t) * vis;',
    '  vec3 col = vec3(0.93,0.97,1.0) + relief*vec3(0.25,0.28,0.3);',
    '  float a = vis * (0.06 + 0.78*m.g) + abs(relief)*0.25*vis + front*0.2*m.g;',
    // glints: a few crystal points flash as the page scrolls (they change with the freeze amount, not with time)
    '  float gl = step(0.996, h(floor(uv/uTexel/2.0) + floor(uAmount*60.0))) * step(0.35, m.g);',
    '  col += gl*0.8; a += gl*0.6*vis;',
    '  a *= 1.0 - uWet*0.7; col = mix(col, vec3(0.78,0.86,0.92), uWet*0.5);',
    '  a = clamp(a, 0.0, 0.9);',
    '  gl_FragColor = vec4(col*a, a);',
    '}'].join('\n');

  function create(canvas, opts) {
    opts = opts || {};
    var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: !!opts.preserve });
    if (!gl) return null;
    var prog = root.Pen3D.lib.program(gl, VS, FS);
    var W = opts.mapW || 1536, H = opts.mapH || 864;
    var tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, growthMap(W, H, opts.seed || 11));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var q = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, q); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aQ = gl.getAttribLocation(prog, 'aQ'), uMap = gl.getUniformLocation(prog, 'uMap'), uAmount = gl.getUniformLocation(prog, 'uAmount'), uWet = gl.getUniformLocation(prog, 'uWet'), uTexel = gl.getUniformLocation(prog, 'uTexel');
    var st = { amount: 0, wet: 0 }, drawn = -1;
    function render() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5), w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      var key = st.amount.toFixed(3) + st.wet.toFixed(3) + w + 'x' + h;
      if (key === drawn) return; drawn = key;            // nothing to redraw while the frost holds still
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (st.amount < 0.005) return;
      gl.useProgram(prog); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindBuffer(gl.ARRAY_BUFFER, q); gl.enableVertexAttribArray(aQ); gl.vertexAttribPointer(aQ, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(uMap, 0);
      gl.uniform1f(uAmount, st.amount); gl.uniform1f(uWet, st.wet); gl.uniform2f(uTexel, 1 / W, 1 / H);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    return { state: st, set: function (o) { for (var k in o) st[k] = o[k]; return this; }, render: render };
  }

  root.Frost = { create: create };
})(window);
