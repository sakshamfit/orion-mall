// Coffee adaptation of sakshamfit/kingfisher's original pour simulation.
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  if (!$('#coffee-pour')) return;
  const clamp = (v, min = 0, max = 1) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pourSection = $('#pour'), pourStage = $('.pour-stage');
  const pour = {liquid:0, foam:0, spilled:0, angle:-78, target:-78, holding:false, done:false, overflowed:false};
  const P = {x:214, y:128}, REST = -78, HOLD_TILT = -124, MAX_TILT = -140;
  const GLASS_TOP = 306, GLASS_BOTTOM = 490, GLASS_H = GLASS_BOTTOM - GLASS_TOP, FILL_LINE = .8, GLASS_ML = 250;
  const RATE = .21, GRAVITY = 1500, TABLE = 500;
  const levelY = level => GLASS_BOTTOM - level * GLASS_H;
  const wallX = (y, side) => { const t = clamp((y - GLASS_TOP) / (GLASS_BOTTOM - GLASS_TOP)); const inset = 48 * t * t; return side < 0 ? 80 + inset : 260 - inset; };
  const flowAt = angle => Math.pow(clamp((-angle - 100) / 34), .75);
  const fillY = levelY(FILL_LINE);
  const bw = 270, bh = 158;
  const glassInside = 'M80 306 H260 C258 389 245 490 203 490 H137 C95 490 82 389 80 306 Z';
  const ticks = Array.from({length:9}, (_, i) => { const y = levelY((i + 1) / 10).toFixed(1); return `<line x1="${i % 2 ? 70 : 76}" x2="84" y1="${y}" y2="${y}"/>`; }).join('');
  const bubbles = Array.from({length:14}, (_, i) => `<circle class="bubble" cx="${120 + ((i * 53) % 100)}" cy="${GLASS_BOTTOM + 4}" r="${(1.1 + (i * 37 % 10) / 6).toFixed(1)}" style="animation-duration:${(2.1 + (i % 4) * .55).toFixed(2)}s;animation-delay:${(-(i * .41) % 3).toFixed(2)}s"/>`).join('');
  pourStage.innerHTML = `<svg class="pour-svg" viewBox="0 -40 460 580">
    <defs>
      <clipPath id="glass-clip"><path d="${glassInside}"/></clipPath>
      <clipPath id="beer-clip"><rect id="beer-clip-rect" x="70" y="${GLASS_BOTTOM}" width="200" height="0"/></clipPath>
      <linearGradient id="beer-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b4784c"/><stop offset=".3" stop-color="#985d38"/><stop offset="1" stop-color="#61391f"/></linearGradient>
      <linearGradient id="stream-grad" gradientUnits="userSpaceOnUse" x1="0" y1="${P.y}" x2="0" y2="${GLASS_BOTTOM}"><stop offset="0" stop-color="#b47a50"/><stop offset=".45" stop-color="#975a36"/><stop offset="1" stop-color="#704027"/></linearGradient>
      <radialGradient id="coffee-surface-grad"><stop offset="0" stop-color="#bd8455"/><stop offset=".55" stop-color="#a1673d"/><stop offset=".9" stop-color="#774627"/><stop offset="1" stop-color="#cc9a6d"/></radialGradient>
      <linearGradient id="sheen-grad" x1="0" x2="1"><stop offset=".08" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff" stop-opacity=".45"/><stop offset=".26" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <ellipse class="glass-shadow" cx="170" cy="503" rx="88" ry="7"/>
    <ellipse id="puddle" class="puddle" cx="150" cy="503" rx="0" ry="0"/>
    <g class="pour-ruler">${ticks}<line x1="84" x2="84" y1="${GLASS_TOP + 8}" y2="${GLASS_BOTTOM}"/></g>
    <g id="level-tag" class="level-tag"><rect x="0" y="-11" width="62" height="22" rx="11"/><text x="31" y="4.5">0 ml</text></g>
    <g clip-path="url(#glass-clip)">
      <rect class="glass-tint" x="70" y="300" width="200" height="195"/>
      <rect id="beer-fill" x="70" y="${GLASS_BOTTOM}" width="200" height="0" fill="url(#beer-grad)"/>
      <g clip-path="url(#beer-clip)">${bubbles}</g>
      <ellipse id="coffee-liquid-surface" fill="url(#coffee-surface-grad)" opacity="0"/><ellipse id="coffee-liquid-ripple" fill="none" stroke="#d7a476" stroke-width="1.4" opacity="0"/><path id="foam" class="foam" d=""/>
      <g id="splash"></g>
    </g>
    <path d="${glassInside}" fill="url(#sheen-grad)"/>
    <image href="images/glass-coffee-cup.png" x="74" y="299" width="234" height="198" preserveAspectRatio="none" aria-hidden="true"/>
    <image href="https://orionmallgorakhpur.com/wp-content/uploads/2023/06/Orion-Logo.png" x="198" y="324" width="51" height="28" preserveAspectRatio="xMidYMid meet" aria-hidden="true"/>
    <g class="fill-line" id="fill-line"><line x1="90" x2="250" y1="${fillY}" y2="${fillY}"/><text x="320" y="${fillY + 1}" id="fill-label">fill line</text><text class="fill-ml" x="320" y="${fillY + 17}">${Math.round(FILL_LINE * GLASS_ML)} ml</text></g>
    <g id="spill" class="spill"><path d="M73 306Q170 286 267 306L262 312Q170 300 78 312Z"/><path d="M77 307C70 322 76 343 72 359C70 371 80 371 80 359C82 341 84 324 87 310Z"/><path d="M263 307C272 323 267 342 271 357C273 369 264 370 264 357C261 339 257 323 255 310Z"/><ellipse cx="170" cy="503" rx="128" ry="9"/></g>
    <path id="stream" class="stream" d="" fill="url(#stream-grad)"/>
    <path id="stream-edge" class="coffee-stream-edge" d=""/><path id="stream-shine" class="stream-shine" d=""/><path id="stream-sparkle" class="coffee-stream-sparkle" d=""/>
    <g id="drops"></g>
    <g id="pour-bottle" class="pour-grab" transform="translate(${P.x} ${P.y}) rotate(${REST})"><g transform="rotate(90)"><image href="images/coffee-server-cut.png" x="0" y="-46" width="${bw}" height="${bh}"/><line class="grab-zone" x1="160" y1="-32" x2="250" y2="-32"/></g></g>
    <g class="pour-hint" id="pour-hint"><path d="M440 222C462 204 466 168 450 138"/><path d="M440 150L450 136L459 150"/><text x="458" y="250">lift to pour</text></g>
  </svg>`;
  const pourSvg = $('.pour-svg', pourStage);
  const beerRect = $('#beer-fill'), beerClip = $('#beer-clip-rect'), foamPath = $('#foam'), streamPath = $('#stream'), shinePath = $('#stream-shine');
  const edgePath = $('#stream-edge'), sparklePath = $('#stream-sparkle');
  const liquidSurface = $('#coffee-liquid-surface'), liquidRipple = $('#coffee-liquid-ripple');
  const pourBottle = $('#pour-bottle'), spill = $('#spill'), puddle = $('#puddle'), dropLayer = $('#drops'), splashLayer = $('#splash');
  const levelTag = $('#level-tag'), levelText = $('text', levelTag), fillLine = $('#fill-line'), fillLabel = $('#fill-label'), pourHint = $('#pour-hint');
  const holdButton = $('#pour-hold'), serveButton = $('#pour-serve'), soundButton = $('#pour-sound'), pourResult = $('#pour-result'), pourStatus = $('#pour-status');
  const parcels = [], drops = [];
  const impact = {x:170, amp:0, landing:0};
  let pourFrame = 0, pourClock = 0, pourTime = 0, dragging = null, lastSpillAt = -9, lineState = '', statusText = '';

  let audio = null; // shared by the pour sound and the horn
  // Sound: filtered noise whose pitch rises as the glass fills, the way a real pour does.
  let pourAudio = null, soundOn = false;
  function ensurePourAudio() {
    if (!soundOn || pourAudio) { pourAudio?.ctx.resume?.(); return; }
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audio, buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource(), band = ctx.createBiquadFilter(), gain = ctx.createGain();
      source.buffer = buffer; source.loop = true; band.type = 'bandpass'; band.Q.value = 4.5; gain.gain.value = 0;
      source.connect(band); band.connect(gain); gain.connect(ctx.destination); source.start();
      pourAudio = {ctx, band, gain};
      ctx.resume?.();
    } catch (err) { pourAudio = null; }
  }
  function pourSound(level) {
    if (!pourAudio) return;
    const t = pourAudio.ctx.currentTime;
    pourAudio.band.frequency.setTargetAtTime(300 + 1150 * Math.pow(clamp(level), 1.4), t, .05);
    pourAudio.gain.gain.setTargetAtTime(soundOn ? .2 * impact.landing : 0, t, .04);
  }
  soundButton.addEventListener('click', () => {
    soundOn = !soundOn;
    soundButton.setAttribute('aria-pressed', String(soundOn));
    if (soundOn) ensurePourAudio(); else pourSound(0);
  });

  function emitParcel(fe, dt) {
    const a = pour.angle * Math.PI / 180, nx = Math.sin(a), ny = -Math.cos(a), v0 = 40 + 110 * fe;
    parcels.push({x:P.x + nx * 3, y:P.y + ny * 3, vx:nx * v0 + (Math.random() - .5) * 5, vy:ny * v0, v0, w:6 + 15 * fe, fe, vol:RATE * fe * dt, born:pourTime, outside:false});
  }
  function land(p, surface) {
    const drop = clamp((surface - P.y) / (GLASS_BOTTOM - P.y));
    pour.liquid += p.vol;
    pour.foam += p.vol * (.1 + 1.05 * p.fe * p.fe) * (.5 + .8 * drop);
    impact.x = lerp(impact.x, p.x, .35);
    impact.landing = Math.max(impact.landing, p.fe);
    if (!reducedMotion && drops.length < 26 && Math.random() < .08 + .3 * p.fe) {
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      el.setAttribute('r', (1.2 + Math.random() * 1.6).toFixed(1));
      el.setAttribute('class', 'drop');
      splashLayer.append(el);
      drops.push({el, x:p.x, y:surface, vx:(Math.random() - .5) * 110, vy:-(50 + Math.random() * 150) * (.4 + p.fe), floor:surface});
    }
  }
  function stepParcels(dt) {
    const surface = levelY(pour.liquid + pour.foam);
    for (let i = parcels.length - 1; i >= 0; i--) {
      const p = parcels[i], prevY = p.y;
      p.vy += GRAVITY * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (!p.outside && prevY < GLASS_TOP && p.y >= GLASS_TOP && (p.x < wallX(GLASS_TOP, -1) || p.x > wallX(GLASS_TOP, 1))) p.outside = true;
      if (!p.outside && p.y >= surface) { land(p, surface); parcels.splice(i, 1); }
      else if (p.outside && p.y >= TABLE) { pour.spilled += p.vol; lastSpillAt = pourTime; puddle.setAttribute('cx', p.x.toFixed(1)); parcels.splice(i, 1); }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.vy += GRAVITY * .8 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      d.el.setAttribute('cx', d.x.toFixed(1)); d.el.setAttribute('cy', d.y.toFixed(1));
      if (d.y > d.floor + 2 && d.vy > 0) { d.el.remove(); drops.splice(i, 1); }
    }
  }
  // Amul's liquid-ribbon treatment, adapted to the interactive ballistic parcels:
  // tapered normal offsets, subtle edge waves and independently shaded highlights.
  function streamShapes(flowing) {
    let body = '', shine = '', edge = '', sparkle = '', run = [];
    const flush = withNeck => {
      if (withNeck && run.length) {
        const last = run[run.length - 1], a = pour.angle * Math.PI / 180;
        run.push({x:P.x, y:P.y, vx:Math.sin(a) * last.v0, vy:-Math.cos(a) * last.v0, v0:last.v0, w:last.w});
      }
      if (run.length >= 2) {
        const left = [], right = [], highlights = [], edges = [], sparkles = [];
        run.forEach((p, i) => {
          const a = run[Math.max(0, i - 1)], b = run[Math.min(run.length - 1, i + 1)];
          let tx = b.x - a.x, ty = b.y - a.y;
          const len = Math.hypot(tx, ty) || 1; tx /= len; ty /= len;
          const u = i / (run.length - 1);
          const width = Math.max(2.2, p.w * Math.sqrt(p.v0 / Math.max(p.v0, Math.hypot(p.vx, p.vy)))) / 2;
          const wave = reducedMotion ? 0 : width * .12 * Math.sin(2 * Math.PI * (1.35 * u - 1.7 * pourTime));
          const point = offset => `${(p.x - ty * (offset + wave)).toFixed(2)} ${(p.y + tx * (offset + wave)).toFixed(2)}`;
          left.push(point(width)); right.push(point(-width));
          highlights.push(point(width * .34)); edges.push(point(-width * .69)); sparkles.push(point(width * .16));
        });
        body += `M${left.join('L')}L${right.reverse().join('L')}Z`;
        shine += `M${highlights.join('L')}`; edge += `M${edges.join('L')}`; sparkle += `M${sparkles.join('L')}`;
      }
      run = [];
    };
    parcels.forEach(p => { if (run.length && p.born - run[run.length - 1].born > .05) flush(false); run.push(p); });
    flush(flowing);
    streamPath.setAttribute('d', body); shinePath.setAttribute('d', shine);
    edgePath.setAttribute('d', edge); sparklePath.setAttribute('d', sparkle);
  }
  function foamShape(top, base) {
    let d = `M80 ${base.toFixed(1)}V${top.toFixed(1)}`;
    for (let x = 80; x <= 260; x += 6) {
      const bump = impact.amp * Math.exp(-(((x - impact.x) / 15) ** 2));
      const ripple = (Math.sin(x * .32 + pourTime * 3.2) + 1) * 1.4 + (Math.sin(x * .9 - pourTime * 5) + 1) * .6;
      d += `L${x} ${(top - bump - ripple).toFixed(1)}`;
    }
    return `${d}V${base.toFixed(1)}Z`;
  }
  function drawPour(flowing) {
    const beerY = levelY(pour.liquid), foamY = beerY - pour.foam * GLASS_H;
    beerRect.setAttribute('y', beerY.toFixed(1)); beerRect.setAttribute('height', (GLASS_BOTTOM - beerY + 2).toFixed(1));
    beerClip.setAttribute('y', beerY.toFixed(1)); beerClip.setAttribute('height', (GLASS_BOTTOM - beerY + 6).toFixed(1));
    foamPath.setAttribute('d', pour.foam > .004 ? foamShape(foamY, beerY + 1) : '');
    const surfaceY = Math.max(GLASS_TOP + 3, foamY);
    const surfaceLeft = wallX(surfaceY, -1), surfaceRight = wallX(surfaceY, 1);
    const surfaceWidth = (surfaceRight - surfaceLeft) / 2;
    liquidSurface.setAttribute('cx', ((surfaceLeft + surfaceRight) / 2).toFixed(1));
    liquidSurface.setAttribute('cy', surfaceY.toFixed(1));
    liquidSurface.setAttribute('rx', surfaceWidth.toFixed(1));
    liquidSurface.setAttribute('ry', (3 + 5 * clamp(pour.liquid)).toFixed(1));
    liquidSurface.setAttribute('opacity', pour.liquid > .01 ? '.85' : '0');
    const rippleRadius = 4 + (reducedMotion ? 4 : (pourTime * 22) % 18);
    liquidRipple.setAttribute('cx', impact.x.toFixed(1));
    liquidRipple.setAttribute('cy', surfaceY.toFixed(1));
    liquidRipple.setAttribute('rx', rippleRadius.toFixed(1));
    liquidRipple.setAttribute('ry', (rippleRadius * .22).toFixed(1));
    liquidRipple.setAttribute('opacity', impact.landing > .03 ? '.6' : '0');
    pourBottle.setAttribute('transform', `translate(${P.x} ${P.y}) rotate(${pour.angle.toFixed(2)})`);
    streamShapes(flowing);
    const rx = pour.spilled > .002 ? Math.min(70, 16 + pour.spilled * 900) : 0;
    puddle.setAttribute('rx', rx.toFixed(1)); puddle.setAttribute('ry', (rx * .12).toFixed(1));
    levelTag.setAttribute('transform', `translate(4 ${Math.max(GLASS_TOP + 4, beerY).toFixed(1)})`);
    levelTag.classList.toggle('on', pour.liquid > .015);
    levelText.textContent = `${Math.round(pour.liquid * GLASS_ML)} ml`;
  }
  function updateFeedback(pouring) {
    const l = pour.liquid;
    const state = pour.overflowed ? 'spilt' : l > .84 ? 'over' : l >= .77 ? 'on' : l >= .66 ? 'near' : '';
    if (state !== lineState) {
      if (state === 'on' && pouring && navigator.userActivation?.hasBeenActive !== false) navigator.vibrate?.(30);
      lineState = state;
      fillLine.setAttribute('class', `fill-line ${state === 'spilt' ? 'over' : state}`);
      fillLabel.textContent = {spilt:'overflow!', over:'over the line', on:'bas! on the line', near:'almost…', '':'fill line'}[state];
    }
    let text;
    if (pour.done) text = '';
    else if (pourTime - lastSpillAt < .6) text = 'Arre! Aim for the cup.';
    else if (pour.foam > .19) text = 'Easy does it. Let the coffee settle.';
    else if (state === 'over') text = 'Over the line. Serve it, or pour another.';
    else if (state === 'on') text = pouring ? 'Bas! Stop pouring, you’re on the line.' : 'On the line. Serve your coffee.';
    else if (state === 'near') text = 'Aaram se. Nearly at the line.';
    else if (pouring) text = 'Keep pouring…';
    else text = l > .01 ? 'Lift the server again to top up.' : 'Lift the server by its handle to pour.';
    if (text !== statusText) { statusText = text; pourStatus.textContent = text; }
  }
  function pourLoop(now) {
    const dt = Math.min(.05, (now - pourClock) / 1000 || .016);
    pourClock = now; pourTime += dt;
    const target = pour.done ? REST : pour.holding ? HOLD_TILT : pour.target;
    pour.angle += (target - pour.angle) * (1 - Math.exp(-dt * (dragging !== null ? 16 : 9)));
    const flow = pour.done ? 0 : flowAt(pour.angle);
    const glug = smooth((flow - .55) / .35);
    const fe = flow * (1 - .22 * glug * (.5 + .5 * Math.sin(pourTime * Math.PI * 11)));
    if (fe > .005) { emitParcel(fe, dt); pourHint.classList.add('gone'); }
    impact.landing *= Math.exp(-dt * 10);
    stepParcels(dt);
    impact.amp += ((impact.landing > .02 ? 3 + 9 * impact.landing : 0) - impact.amp) * (1 - Math.exp(-dt * 7));
    const settled = pour.foam > .05 ? (pour.foam - .05) * (1 - Math.exp(-dt / 1.5)) : pour.foam * (1 - Math.exp(-dt / 40));
    pour.foam -= settled; pour.liquid += settled * .2;
    if (!pour.done && pour.liquid + pour.foam >= 1) overflow();
    drawPour(fe > .005);
    updateFeedback(fe > .005 || parcels.length > 0);
    pourSound(pour.liquid + pour.foam * .5);
    serveButton.disabled = pour.done || pour.holding || dragging !== null || parcels.length > 0 || pour.liquid < .15;
    const active = Math.abs(target - pour.angle) > .1 || flow > 0 || parcels.length || drops.length || impact.amp > .05 || (pour.foam > .052 && !pour.done);
    pourFrame = active ? requestAnimationFrame(pourLoop) : 0;
  }
  function runPour() { if (!pourFrame) { pourClock = performance.now(); pourFrame = requestAnimationFrame(pourLoop); } }
  function showPourResult(title, gloss, body, finished) {
    pourResult.innerHTML = `<strong>${title}${gloss ? ` <span class="gloss">${gloss}</span>` : ''}</strong><p>${body}</p>${finished ? '<button class="text-link" data-pour-reset>Pour another <span aria-hidden="true">↻</span></button>' : ''}`;
    pourResult.classList.toggle('finished', finished);
    if (finished) $('[data-pour-reset]', pourResult).addEventListener('click', resetPour);
  }
  function finishPour() {
    pour.done = true; pour.holding = false; pour.target = REST; dragging = null;
    holdButton.classList.remove('is-pouring'); pourStage.classList.remove('dragging');
    holdButton.disabled = true; serveButton.disabled = true;
    updateFeedback(false); runPour();
  }
  function overflow() {
    pour.overflowed = true;
    finishPour();
    spill.classList.add('on');
    showPourResult('Arre, overflow!', '', 'Your coffee overflowed. Pour another and aim for the line.', true);
  }
  function servePour() {
    if (pour.done || pour.liquid < .15) return;
    const foamMiss = Math.max(0, .08 - pour.foam, pour.foam - .16);
    const score = Math.round(clamp(100 - Math.abs(pour.liquid - FILL_LINE) * 250 - foamMiss * 350 - pour.spilled * 400, 0, 100));
    finishPour();
    if (pour.liquid < .66) showPourResult('Bas itna?', 'That’s it?', `${score}/100. Fill your cup up to the line before you serve.`, true);
    else if (pour.foam > .18) showPourResult('Itna jhaag?', 'So much foam?', `${score}/100. Pause between pours and let your coffee settle.`, true);
    else if (pour.foam < .06) showPourResult('Thoda jhaag bhi.', 'Some foam too.', `${score}/100. Try a gentle finish for a little crema.`, true);
    else if (pour.spilled > .03) showPourResult('Table pe bhi?', 'On the table too?', `${score}/100. Keep the stream inside the cup.`, true);
    else if (score >= 88) showPourResult('Ekdum perfect!', 'Absolutely perfect!', `${score}/100. Just right. Enjoy your coffee at Orion!`, true);
    else showPourResult('Sahi hai.', 'Nicely done.', `${score}/100. A good pour. Get closer to the line for full marks.`, true);

  }
  function resetPour() {
    Object.assign(pour, {liquid:0, foam:0, spilled:0, holding:false, done:false, overflowed:false, target:REST});
    parcels.length = 0; drops.splice(0).forEach(d => d.el.remove());
    spill.classList.remove('on');
    holdButton.disabled = false;
    showPourResult('Cup ready.', '', 'Tip: lift the handle slowly, fill to the line, then serve.', false);
    drawPour(false); updateFeedback(false); runPour();
    holdButton.focus({preventScroll:true});
  }

  // Lifting the bottle: its body points from the neck towards the pointer, clamped between resting and fully tipped.
  function aimBottle(e) {
    const pt = pourSvg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(pourSvg.getScreenCTM().inverse());
    let angle = Math.atan2(-(p.x - P.x), p.y - P.y) * 180 / Math.PI;
    if (angle > 90) angle -= 360;
    pour.target = clamp(angle, MAX_TILT, REST);
  }
  pourBottle.addEventListener('pointerdown', e => {
    if (pour.done || e.button !== 0) return;
    e.preventDefault();
    try { pourBottle.setPointerCapture(e.pointerId); } catch (err) {}
    dragging = e.pointerId;
    pourStage.classList.add('dragging');
    ensurePourAudio(); aimBottle(e); runPour();
  });
  pourBottle.addEventListener('pointermove', e => { if (dragging === e.pointerId) { aimBottle(e); runPour(); } });
  const releaseBottle = e => { if (dragging !== e.pointerId) return; dragging = null; pour.target = REST; pourStage.classList.remove('dragging'); runPour(); };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => pourBottle.addEventListener(type, releaseBottle));

  const startPour = () => { if (pour.done) return; pour.holding = true; holdButton.classList.add('is-pouring'); ensurePourAudio(); runPour(); };
  const stopPour = () => { if (!pour.holding) return; pour.holding = false; holdButton.classList.remove('is-pouring'); runPour(); };
  holdButton.addEventListener('pointerdown', e => { if (e.button !== 0) return; e.preventDefault(); try { holdButton.setPointerCapture(e.pointerId); } catch (err) {} startPour(); });
  ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach(type => holdButton.addEventListener(type, stopPour));
  holdButton.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startPour(); } });
  holdButton.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stopPour(); } });
  holdButton.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('blur', () => { stopPour(); if (dragging !== null) { dragging = null; pour.target = REST; pourStage.classList.remove('dragging'); runPour(); } });
  serveButton.addEventListener('click', servePour);
  showPourResult('Cup ready.', '', 'Tip: lift the handle slowly, fill to the line, then serve.', false);
  drawPour(false); updateFeedback(false);

})();
