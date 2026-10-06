// Compiz.js - todos los efectos en un solo archivo separado
// Wobbly + Cube + Expo + Scale + Magic Lamp + Burn/Firepaint
(() => {
  const viewport = document.getElementById('viewport');
  const cube = document.getElementById('cube');
  const faces = [...document.querySelectorAll('.workspace')];
  const fx = document.getElementById('fx');
  const ctx = fx.getContext('2d');
  const expoOverlay = document.getElementById('expoOverlay');
  const scaleOverlay = document.getElementById('scaleOverlay');

  let currentFace = 0;
  let wobblyOn = true;
  let fireMode = false;
  let shiftDown = false;
  const minimized = []; // {el, face}

  function resizeFx() {
    fx.width = innerWidth;
    fx.height = innerHeight;
  }
  addEventListener('resize', () => { resizeFx(); layoutCube(); });
  resizeFx();

  // ---------- CUBO ----------
  function halfW() { return viewport.clientWidth / 2; }
  function layoutCube() {
    faces.forEach((f, i) => {
      const ang = i * 90;
      f.style.transform = `rotateY(${ang}deg) translateZ(${halfW()}px)`;
      f.style.width = '100%';
      f.style.height = '100%';
    });
    updateCube(false);
  }
  function updateCube(animate = true) {
    cube.style.transition = animate ? '' : 'none';
    cube.style.transform = `translateZ(${-halfW()}px) rotateY(${-currentFace * 90}deg)`;
    if (!animate) requestAnimationFrame(() => cube.style.transition = '');
  }
  function goFace(n) {
    currentFace = ((n % 4) + 4) % 4;
    updateCube(true);
  }
  document.getElementById('bCubeL').onclick = () => goFace(currentFace - 1);
  document.getElementById('bCubeR').onclick = () => goFace(currentFace + 1);

  // ---------- VENTANAS ----------
  let zTop = 10;
  function makeWindow(face, x, y, title, html) {
    const w = document.createElement('div');
    w.className = 'window';
    w.style.left = x + 'px';
    w.style.top = y + 'px';
    w.innerHTML = `<div class="titlebar"><span>◈</span><span>${title}</span>
      <div class="btns"><span class="min" title="lámpara"></span><span class="max" title="max"></span><span class="close" title="quemar"></span></div></div>
      <div class="content">${html}</div>`;
    w._pos = { x, y };
    w._wob = { sx: 0, sy: 0, vsx: 0, vsy: 0 };
    faces[face].appendChild(w);
    w.addEventListener('mousedown', () => w.style.zIndex = ++zTop);

    const bar = w.querySelector('.titlebar');
    bar.addEventListener('dblclick', e => { e.stopPropagation(); burnWindow(w); });
    w.querySelector('.close').onclick = e => { e.stopPropagation(); burnWindow(w); };
    w.querySelector('.min').onclick = e => { e.stopPropagation(); magicLampMin(w); };
    w.querySelector('.max').onclick = e => { e.stopPropagation(); toggleMax(w); };

    enableDrag(w, bar);
    return w;
  }
  function toggleMax(w) {
    if (w._maxed) {
      Object.assign(w.style, { left: w._prev.left, top: w._prev.top, width: w._prev.width });
      w._maxed = false;
    } else {
      w._prev = { left: w.style.left, top: w.style.top, width: w.style.width || '300px' };
      Object.assign(w.style, { left: '10px', top: '40px', width: (viewport.clientWidth - 40) + 'px' });
      w._pos = { x: 10, y: 40 };
      wobbleKick(w, 14, -8);
    }
  }

  function enableDrag(el, handle) {
    let sx, sy, ox, oy, dragging = false, lastX = 0, lastY = 0, lastT = 0;
    handle.addEventListener('mousedown', e => {
      dragging = true; sx = e.clientX; sy = e.clientY;
      ox = el._pos.x; oy = el._pos.y;
      lastX = sx; lastY = sy; lastT = performance.now();
      el.style.zIndex = ++zTop;
      e.preventDefault();
    });
    addEventListener('mousemove', e => {
      // firepaint con shift
      if ((shiftDown || fireMode) && e.buttons) spawnFire(e.clientX, e.clientY, 4);
      if (!dragging) return;
      const now = performance.now();
      const dt = Math.max(16, now - lastT);
      const nx = ox + (e.clientX - sx);
      const ny = oy + (e.clientY - sy);
      const vx = (e.clientX - lastX) / dt * 16;
      const vy = (e.clientY - lastY) / dt * 16;
      el._pos = { x: nx, y: ny };
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
      if (wobblyOn) {
        el._wob.vsx += Math.max(-8, Math.min(8, vx * 0.35));
        el._wob.vsy += Math.max(-8, Math.min(8, vy * 0.35));
      }
      lastX = e.clientX; lastY = e.clientY; lastT = now;
    });
    addEventListener('mouseup', () => {
      if (dragging && wobblyOn) wobbleKick(el, el._wob.vsx * 1.2, el._wob.vsy * 1.2);
      dragging = false;
    });
  }
  function wobbleKick(el, px, py) {
    el._wob.vsx += px * 0.4;
    el._wob.vsy += py * 0.4;
  }
  // loop física wobbly (muelle amortiguado)
  function wobbleStep() {
    document.querySelectorAll('.window').forEach(w => {
      const o = w._wob; if (!o) return;
      // muelle hacia 0
      o.vsx += (-o.sx * 0.18);
      o.vsy += (-o.sy * 0.18);
      o.vsx *= 0.82; o.vsy *= 0.82;
      o.sx += o.vsx; o.sy += o.vsy;
      const cx = Math.max(-22, Math.min(22, o.sx));
      const cy = Math.max(-22, Math.min(22, o.sy));
      w.style.transform = wobblyOn || Math.abs(cx) + Math.abs(cy) > 0.1
        ? `skewX(${cx * 0.9}deg) skewY(${-cy * 0.6}deg) scale(${1 + Math.abs(cx) * 0.002},${1 + Math.abs(cy) * 0.002})`
        : '';
    });
  }

  // ---------- LÁMPARA MÁGICA (genie) ----------
  function magicLampMin(win) {
    const target = document.getElementById('dockIcon1');
    const r1 = win.getBoundingClientRect();
    const r2 = target.getBoundingClientRect();
    const ghost = win.cloneNode(true);
    Object.assign(ghost.style, {
      position: 'fixed', left: r1.left + 'px', top: r1.top + 'px',
      width: r1.width + 'px', height: r1.height + 'px',
      margin: 0, zIndex: 3000, transformOrigin: 'bottom center', pointerEvents: 'none'
    });
    document.body.appendChild(ghost);
    win.style.visibility = 'hidden';
    minimized.push({ el: win, ghost: null });
    const t0 = performance.now(), DUR = 650;
    (function anim(t) {
      const p = Math.min(1, (t - t0) / DUR);
      const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // easeInOut
      // colapsa hacia el dock con cintura sinusoidal
      const cx = r1.left + (r2.left + r2.width / 2 - r1.left - r1.width / 2) * e;
      const cy = r1.top + (r2.top - r1.top) * (e * e);
      const ww = r1.width * (1 - e * 0.96);
      const wave = Math.sin(e * Math.PI * 3) * (1 - e) * 30;
      ghost.style.left = (cx) + 'px';
      ghost.style.top = cy + 'px';
      ghost.style.width = Math.max(6, ww) + 'px';
      ghost.style.height = Math.max(6, r1.height * (1 - e * 0.95)) + 'px';
      ghost.style.transform = `skewX(${wave}deg) scaleX(${1 - Math.sin(e * Math.PI) * 0.4})`;
      ghost.style.opacity = 1 - e * 0.35;
      if (p < 1) requestAnimationFrame(anim);
      else { ghost.remove(); target.animate([{ transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 300 }); }
    })(t0);
  }
  function restoreAll() {
    // reversa simple: aparece con fade+scale
    minimized.splice(0).forEach(m => {
      m.el.style.visibility = 'visible';
      m.el.animate(
        [{ opacity: 0, transform: 'scale(.2) translateY(120px)' }, { opacity: 1, transform: 'scale(1) translateY(0)' }],
        { duration: 450, easing: 'cubic-bezier(.2,.9,.3,1.2)' }
      );
      wobbleKick(m.el, -10, 12);
    });
  }
  document.querySelector('[data-restore="all"]').onclick = restoreAll;
  document.getElementById('bLamp').onclick = () => {
    const w = document.querySelector('.window:not([style*="hidden"])');
    const vis = [...document.querySelectorAll('.window')].find(x => x.style.visibility !== 'hidden');
    if (vis) magicLampMin(vis);
  };
  document.getElementById('newWin').onclick = () => {
    makeWindow(currentFace, 60 + Math.random() * 300, 60 + Math.random() * 160,
      'Ventana ' + (document.querySelectorAll('.window').length + 1),
      'Nueva ventana Compiz.js.<br>Doble-click en barra = quemar.');
  };

  // ---------- QUEMAR / FUEGO ----------
  const parts = [];
  function spawnFire(x, y, n = 6, spread = 60) {
    for (let i = 0; i < n; i++) {
      parts.push({
        x: x + (Math.random() - .5) * 18, y,
        vx: (Math.random() - .5) * 1.6, vy: -1 - Math.random() * 2.4,
        life: 1, decay: 0.012 + Math.random() * 0.02,
        size: 4 + Math.random() * 10,
        col: ['#ffdd55', '#ff9a2a', '#ff5a1a', '#ff2a00'][Math.random() * 4 | 0]
      });
    }
    if (parts.length > 1200) parts.splice(0, parts.length - 1200);
  }
  function burnWindow(win) {
    const r = win.getBoundingClientRect();
    // lluvia de fuego desde la ventana, de abajo hacia arriba
    for (let i = 0; i < 160; i++) {
      spawnFire(r.left + Math.random() * r.width, r.top + Math.random() * r.height, 1);
    }
    win.animate([{ opacity: 1, filter: 'brightness(1)' }, { opacity: 0, filter: 'brightness(3) saturate(0)' }],
      { duration: 550, easing: 'ease-in' }).onfinish = () => win.remove();
  }
  document.getElementById('bBurn').onclick = () => {
    const vis = [...document.querySelectorAll('.window')].find(x => x.style.visibility !== 'hidden' && x.isConnected);
    if (vis) burnWindow(vis);
  };
  const bFire = document.getElementById('bFire');
  bFire.onclick = () => { fireMode = !fireMode; bFire.classList.toggle('active', fireMode); };

  function drawFx() {
    ctx.clearRect(0, 0, fx.width, fx.height);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy -= 0.02; p.vx *= 0.99; p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, 7);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- EXPO ----------
  function allWindows() { return [...document.querySelectorAll('.window')]; }
  document.getElementById('bExpo').onclick = toggleExpo;
  function toggleExpo(force) {
    const show = force !== undefined ? force : !expoOverlay.classList.contains('show');
    expoOverlay.classList.toggle('show', show);
    if (!show) return;
    scaleOverlay.classList.remove('show');
    expoOverlay.innerHTML = '';
    faces.forEach((f, i) => {
      const cell = document.createElement('div');
      cell.className = 'expo-cell';
      cell.innerHTML = `<span class="tag">Workspace ${i + 1}</span>`;
      allWindows().filter(w => w.parentElement === f && w.style.visibility !== 'hidden').forEach(w => {
        const m = document.createElement('div');
        m.className = 'mini-win';
        m.textContent = w.querySelector('.titlebar span:nth-child(2)').textContent;
        m.style.left = (parseFloat(w.style.left) / viewport.clientWidth * 100 * 0.9 + 8) + '%';
        m.style.top = (parseFloat(w.style.top) / viewport.clientHeight * 100 * 0.9 + 28) + 'px';
        cell.appendChild(m);
      });
      cell.onclick = () => { expoOverlay.classList.remove('show'); goFace(i); };
      expoOverlay.appendChild(cell);
    });
  }

  // ---------- SCALE ----------
  document.getElementById('bScale').onclick = () => {
    const show = !scaleOverlay.classList.contains('show');
    scaleOverlay.classList.toggle('show', show);
    expoOverlay.classList.remove('show');
    if (!show) return;
    scaleOverlay.innerHTML = '';
    allWindows().filter(w => w.isConnected && w.style.visibility !== 'hidden').forEach(w => {
      const c = document.createElement('div');
      c.className = 'scale-cell';
      c.innerHTML = `<span class="tag">${w.querySelector('.titlebar span:nth-child(2)').textContent}</span>
        <div style="padding:34px 12px 12px;font-size:12px;opacity:.8">${w.querySelector('.content').innerHTML}</div>`;
      c.onclick = () => {
        scaleOverlay.classList.remove('show');
        const faceIdx = faces.indexOf(w.parentElement);
        if (faceIdx >= 0) goFace(faceIdx);
        w.style.zIndex = ++zTop;
        w.animate([{ transform: 'scale(.7)' }, { transform: 'scale(1)' }], { duration: 350 });
      };
      scaleOverlay.appendChild(c);
    });
    if (!scaleOverlay.children.length) scaleOverlay.innerHTML = '<p style="grid-column:1/3;text-align:center">No hay ventanas</p>';
  };

  // ---------- WOBBLY TOGGLE ----------
  const bW = document.getElementById('bWobbly');
  bW.onclick = () => { wobblyOn = !wobblyOn; bW.textContent = 'Wobbly: ' + (wobblyOn ? 'ON' : 'OFF'); bW.classList.toggle('active', wobblyOn); };

  // ---------- TECLADO / FONDO ----------
  addEventListener('keydown', e => {
    if (e.key === 'Shift') shiftDown = true;
    if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') goFace(currentFace + 1);
    if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') goFace(currentFace - 1);
    if (e.key === 'e' || e.key === 'E') toggleExpo();
    if (e.key === 's' || e.key === 'S') document.getElementById('bScale').click();
  });
  addEventListener('keyup', e => { if (e.key === 'Shift') shiftDown = false; });
  viewport.addEventListener('dblclick', e => { if (e.target === viewport || e.target.classList.contains('workspace')) goFace(currentFace + 1); });

  // ---------- INIT ----------
  makeWindow(0, 60, 60, 'Terminal', 'user@linux:~$ compiz --replace<br>Efecto <b>wobbly</b> activo. Arrástrame rápido.');
  makeWindow(0, 400, 120, 'Firefox', 'Pestañas abiertas: 3<br><b>Shift+arrastrar</b> = pintar fuego.');
  makeWindow(1, 120, 80, 'Editor', 'Workspace 2 — gira el cubo con <b>Ctrl+Alt+←/→</b>.');
  makeWindow(2, 200, 100, 'Música', 'Workspace 3 — prueba <b>Expo</b> (E) y <b>Scale</b> (S).');
  makeWindow(3, 90, 140, 'Chat', 'Workspace 4 — minimizar = <b>lámpara</b>, cerrar = <b>quemar</b>.');
  layoutCube();

  (function loop() { wobbleStep(); drawFx(); requestAnimationFrame(loop); })();
  console.log('Compiz.js cargado: wobbly+cube+expo+scale+lamp+burn listos');
})();
