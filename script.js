/* ERROR CATCHING */
window.onerror = function(msg, url, line, col, err) {
  document.body.insertAdjacentHTML('afterbegin',
    '<div style="position:fixed;top:0;left:0;z-index:9999;background:red;color:white;padding:12px;font-family:monospace;font-size:14px;max-width:100vw;word-break:break-word">' +
    'ERROR: ' + msg + ' at line ' + line +
    '</div>'
  );
};

console.clear();

let firstFrame = true;

/* SETUP */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.z = 500;

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

/* SHARED HELPERS */
function screenToWorld(x, y, z = 0) {
  const vec = new THREE.Vector3(
    (x / window.innerWidth) * 2 - 1,
    -(y / window.innerHeight) * 2 + 1,
    0.5
  );
  vec.unproject(camera);
  const dir = vec.sub(camera.position).normalize();
  const dist = (-camera.position.z + z) / dir.z;
  return camera.position.clone().add(dir.multiplyScalar(dist));
}

function createHeartTexture(color = '#ff69b4', size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const cx = size / 2, cy = size / 2, s = size / 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 1.2);
  ctx.bezierCurveTo(cx - s * 1.5, cy - s * 0.2, cx - s * 0.8, cy - s * 1.2, cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 0.8, cy - s * 1.2, cx + s * 1.5, cy - s * 0.2, cx, cy + s * 1.2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const heartTex = createHeartTexture('#ff69b4');
const goldHeartTex = createHeartTexture('#ffd700');
const whiteHeartTex = createHeartTexture('#ffffff');

function createHeartSprite(texture, size = 1) {
  const mat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(size, size, 1);
  return sprite;
}

/* HEART TEXTURE FOR POINTS */
const palette = [
  [1.0, 0.84, 0.0],
  [0.93, 0.32, 0.51],
  [1.0, 0.41, 0.71],
  [1.0, 0.42, 0.42],
  [0.53, 0.81, 0.92],
  [0.6, 0.98, 0.6],
  [0.79, 0.69, 1.0],
  [1.0, 1.0, 1.0],
];

/* MAIN HEART PARTICLES */
const tl = gsap.timeline({ repeat: -1, yoyo: true });
const path = document.querySelector("path");
const length = path.getTotalLength();
const vertices = [];
const colorArray = [];

for (let i = 0; i < length; i += 0.1) {
  const point = path.getPointAtLength(i);
  const vector = new THREE.Vector3(point.x, -point.y, 0);
  vector.x += (Math.random() - 0.5) * 30;
  vector.y += (Math.random() - 0.5) * 30;
  vector.z += (Math.random() - 0.5) * 70;
  vertices.push(vector);
  const [r, g, b] = palette[Math.floor(Math.random() * palette.length)];
  colorArray.push(r, g, b);
  tl.from(vector, {
    x: 600 / 2,
    y: -552 / 2,
    z: 0,
    ease: "power2.inOut",
    duration: "random(2, 5)"
  }, i * 0.002);
}

const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
geometry.setAttribute('color', new THREE.Float32BufferAttribute(colorArray, 3));
const material = new THREE.PointsMaterial({
  vertexColors: true,
  blending: THREE.AdditiveBlending,
  size: 3,
});
const particles = new THREE.Points(geometry, material);
particles.position.x -= 600 / 2;
particles.position.y += 552 / 2;
scene.add(particles);

gsap.fromTo(scene.rotation, { y: -0.2 }, {
  y: 0.2, repeat: -1, yoyo: true, ease: 'power2.inOut', duration: 3
});

gsap.to(particles.scale, {
  x: 1.08, y: 1.08, z: 1.08,
  duration: tl.duration() / 4, yoyo: true, repeat: -1, ease: 'power1.inOut',
});

/* WORD TRACING THE HEART PATH: "LOVE" written along the outline */
const wordSprites = [];

function createLetterCanvas(letter, color) {
  const c = document.createElement('canvas');
  c.width = 80; c.height = 80;
  const ctx = c.getContext('2d');
  ctx.fillStyle = color;
  ctx.font = 'bold 52px Dancing Script, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillText(letter, 40, 42);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const letterTexes = {
  L: createLetterCanvas('L', '#ff69b4'),
  O: createLetterCanvas('O', '#ffd700'),
  V: createLetterCanvas('V', '#ff1493'),
  E: createLetterCanvas('E', '#ffb6c1'),
};

const wordLetters = ['L', 'O', 'V', 'E'];
const letterStep = 22;
const pathLen = path.getTotalLength();
const totalLetters = Math.floor(pathLen / letterStep);

for (let i = 0; i < totalLetters; i++) {
  const letter = wordLetters[i % 4];
  const pt = path.getPointAtLength(i * letterStep);
  const mat = new THREE.SpriteMaterial({
    map: letterTexes[letter],
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.set(pt.x - 300, -pt.y + 276, (Math.random() - 0.5) * 15);
  sprite.scale.set(16, 16, 1);
  scene.add(sprite);
  wordSprites.push(sprite);

  tl.from(mat, {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
  }, i * 0.002 + 0.1);
}

/* CONFETTI BURST */
const confettiCount = 300;
const confettiPos = [];
const confettiColors = [];
for (let i = 0; i < confettiCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 30 + Math.random() * 60;
  confettiPos.push(
    Math.sin(phi) * Math.cos(theta) * r,
    Math.sin(phi) * Math.sin(theta) * r,
    Math.cos(phi) * r
  );
  const [cr, cg, cb] = palette[Math.floor(Math.random() * palette.length)];
  confettiColors.push(cr, cg, cb);
}
const confettiGeom = new THREE.BufferGeometry();
confettiGeom.setAttribute('position', new THREE.Float32BufferAttribute(confettiPos, 3));
confettiGeom.setAttribute('color', new THREE.Float32BufferAttribute(confettiColors, 3));
const confettiMat = new THREE.PointsMaterial({
  vertexColors: true, size: 5, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
});
const confetti = new THREE.Points(confettiGeom, confettiMat);
confetti.position.set(-300, 276, 0);
scene.add(confetti);

setTimeout(() => {
  const td = tl.duration(), hd = td / 2;
  tl.to(confettiMat, { opacity: 0.9, duration: hd * 0.25, ease: 'power2.out' }, hd * 0.85);
  tl.to(confetti.scale, { x: 2.5, y: 2.5, z: 2.5, duration: hd * 0.5, ease: 'power2.out' }, hd * 0.85);
  tl.to(confettiMat, { opacity: 0, duration: hd * 0.3, ease: 'power2.in' }, hd * 1.35);
  tl.set(confetti.scale, { x: 1, y: 1, z: 1 }, td - 0.1);
}, 0);

/* FLOATING MINI HEARTS AROUND THE MAIN HEART */
const floatingHearts = [];
const floatingHeartCount = 40;
for (let i = 0; i < floatingHeartCount; i++) {
  const tex = [heartTex, goldHeartTex, whiteHeartTex][Math.floor(Math.random() * 3)];
  const size = 8 + Math.random() * 18;
  const sprite = createHeartSprite(tex, size);
  const angle = Math.random() * Math.PI * 2;
  const radius = 120 + Math.random() * 200;
  const heightOffset = (Math.random() - 0.5) * 200;
  sprite.position.set(
    Math.cos(angle) * radius - 300,
    Math.sin(angle) * radius * 0.6 + 276 + heightOffset,
    (Math.random() - 0.5) * 150
  );
  sprite.userData = {
    basePos: sprite.position.clone(),
    angle: angle,
    radius: radius,
    speed: 0.2 + Math.random() * 0.4,
    floatOffset: Math.random() * Math.PI * 2,
    heightOffset: heightOffset,
  };
  sprite.material.opacity = 0.15 + Math.random() * 0.3;
  scene.add(sprite);
  floatingHearts.push(sprite);
}

/* ROSE PETALS FALLING */
const petalCount = 40;
const petals = [];
for (let i = 0; i < petalCount; i++) {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(12, 8, 2, 12, 8, 12);
  const shades = ['#ff69b4', '#ff1493', '#ffb6c1', '#ff6b9d'];
  const c = shades[Math.floor(Math.random() * shades.length)];
  gradient.addColorStop(0, c);
  gradient.addColorStop(1, 'rgba(255,105,180,0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(12, 8, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  const s = 2 + Math.random() * 4;
  sprite.scale.set(s, s * 0.7, 1);
  sprite.position.set(
    (Math.random() - 0.5) * 800,
    300 + Math.random() * 200,
    (Math.random() - 0.5) * 800 - 200
  );
  sprite.userData = {
    spawnY: sprite.position.y,
    speed: 0.3 + Math.random() * 0.5,
    swayAmp: 20 + Math.random() * 40,
    swaySpeed: 0.5 + Math.random() * 0.8,
    rotSpeed: (Math.random() - 0.5) * 0.02,
    baseX: sprite.position.x,
    phase: Math.random() * Math.PI * 2,
  };
  scene.add(sprite);
  petals.push(sprite);
}

/* MOUSE TRAIL HEARTS */
const trailHearts = [];
const trailCount = 10;
for (let i = 0; i < trailCount; i++) {
  const sprite = createHeartSprite(heartTex, 12 - i * 0.8);
  sprite.position.set(0, 0, 50);
  sprite.material.opacity = 0;
  sprite.userData = { trail: i };
  scene.add(sprite);
  trailHearts.push(sprite);
}
let mouseTarget = new THREE.Vector2(0, 0);
let mouseWorld = new THREE.Vector3(0, 0, 50);

document.addEventListener('mousemove', (e) => {
  mouseTarget.set(e.clientX, e.clientY);
});

/* CLICK BURST HEARTS */
const burstHeartsPool = [];

function burstHearts(x, y) {
  const pos = screenToWorld(x, y, 50);
  const count = 40 + Math.floor(Math.random() * 20);
  for (let i = 0; i < count; i++) {
    const tex = [heartTex, goldHeartTex, whiteHeartTex][Math.floor(Math.random() * 3)];
    const size = 10 + Math.random() * 20;
    const sprite = createHeartSprite(tex, size);
    sprite.position.copy(pos);
    sprite.position.z = 50;
    sprite.material.opacity = 1;
    const angle = Math.random() * Math.PI * 2;
    const speed = 80 + Math.random() * 200;
    const vel = new THREE.Vector3(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      (Math.random() - 0.5) * speed * 0.7
    );
    sprite.userData = { vel, life: 1.2 + Math.random() * 0.5 };
    scene.add(sprite);
    burstHeartsPool.push(sprite);
  }
}

let audioStarted = false;

document.addEventListener('click', (e) => {
  burstHearts(e.clientX, e.clientY);
  if (!audioStarted) {
    startSong();
    audioStarted = true;
  }
});

/* TEXT ANIMATION */
const textSpans = document.querySelectorAll('.heart-text span');

setTimeout(() => {
  const td = tl.duration(), hd = td / 2;
  const l1 = document.querySelectorAll('.line1 span').length;
  const l2 = document.querySelectorAll('.line2 span').length;
  const l4 = document.querySelectorAll('.line4 span').length;

  // Line 1: "Happy Birthday" appears in gold during forming
  document.querySelectorAll('.line1 span').forEach((span, i) => {
    tl.to(span, { opacity: 1, color: '#ffd700', duration: hd * 0.55 / l1, ease: 'power1.inOut' }, i * (hd * 0.55 / l1));
  });
  document.querySelectorAll('.line1 span').forEach((span, i) => {
    tl.to(span, { opacity: 0, duration: hd * 0.2 / l1, ease: 'power1.in' }, hd * 0.65 + (i * (hd * 0.25 / l1)));
  });

  // Line 2: "Tasha ❤" appears at peak in bright pink
  document.querySelectorAll('.line2 span').forEach((span, i) => {
    tl.to(span, { opacity: 1, color: '#ff69b4', duration: hd * 0.4 / l2, ease: 'back.out(1.7)' }, hd * 0.7 + (i * (hd * 0.3 / l2)));
  });
  document.querySelectorAll('.line2 span').forEach((span, i) => {
    tl.to(span, { opacity: 0, duration: hd * 0.2 / l2, ease: 'power1.in' }, hd * 1.3 + (i * (hd * 0.1 / l2)));
  });

  // Line 3: message fades in inside the heart
  const line3 = document.querySelector('.line3');
  const msgTl = gsap.timeline({ repeat: -1, repeatDelay: 8 });
  msgTl.to({}, { duration: 4 });
  msgTl.to(line3, { opacity: 1, duration: 0.6, ease: 'power2.out' });
  msgTl.to({}, { duration: 35 });
  msgTl.to(line3, { opacity: 0, duration: 0.5, ease: 'power2.in' });

  // Line 4: "Forever yours ❤" appears during love phase
  document.querySelectorAll('.line4 span').forEach((span, i) => {
    tl.to(span, { opacity: 1, color: '#ffb6c1', duration: hd * 0.4 / l4, ease: 'power1.inOut' }, hd * 1.1 + (i * (hd * 0.3 / l4)));
  });
  document.querySelectorAll('.line4 span').forEach((span, i) => {
    tl.to(span, { opacity: 0, duration: hd * 0.2 / l4, ease: 'power1.in' }, td - hd * 0.3 + (i * (hd * 0.1 / l4)));
  });
}, 0);

/* SPARKLES */
const sparkleCount = 80;
const sparkleVertices = [];
const sparkleOpacities = [];
for (let i = 0; i < sparkleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 180 + Math.random() * 120;
  sparkleVertices.push(
    Math.cos(angle) * radius + (Math.random() - 0.5) * 60,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 60,
    (Math.random() - 0.5) * 120
  );
  sparkleOpacities.push(0);
}
const sparkleGeometry = new THREE.BufferGeometry();
sparkleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(sparkleVertices, 3));
sparkleGeometry.setAttribute('alpha', new THREE.Float32BufferAttribute(sparkleOpacities, 1));
const sparkleMaterial = new THREE.PointsMaterial({
  color: 0xffffcc, size: 2.5, transparent: true, opacity: 1, blending: THREE.AdditiveBlending,
});
const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
sparkles.position.x -= 600 / 2;
sparkles.position.y += 552 / 2;
scene.add(sparkles);

setTimeout(() => {
  const hd = tl.duration() / 2;
  for (let i = 0; i < sparkleCount; i++) {
    tl.to(sparkleGeometry.attributes.alpha.array, {
      [i]: 1, duration: hd * 0.5, ease: 'power1.in',
      onUpdate: () => sparkleGeometry.attributes.alpha.needsUpdate = true,
    }, hd + (i * (hd * 0.5 / sparkleCount)));
    tl.to(sparkleGeometry.attributes.alpha.array, {
      [i]: 0, duration: hd * 0.5, ease: 'power1.out',
      onUpdate: () => sparkleGeometry.attributes.alpha.needsUpdate = true,
    }, hd + (hd * 0.5) + (i * (hd * 0.5 / sparkleCount)));
  }
}, 0);

/* HAPPY BIRTHDAY + ROMANTIC LOVE THEME */
let audioCtx = null;
let songTimer = null;
let isSongPlaying = false;
const musicBtn = document.getElementById('musicToggle');

const nf = {
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
  'G4': 392.00, 'A4': 440.00, 'Bb4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46,
  'G5': 783.99, 'A5': 880.00,
};

const happyBirthdayMelody = [
  ['C4', 0.75], ['C4', 0.25], ['D4', 1],    ['C4', 1],    ['F4', 1],    ['E4', 2],
  ['C4', 0.75], ['C4', 0.25], ['D4', 1],    ['C4', 1],    ['G4', 1],    ['F4', 2],
  ['C4', 0.75], ['C4', 0.25], ['C5', 1],    ['A4', 1],    ['F4', 1],    ['E4', 1],    ['D4', 2],
  ['Bb4', 0.75],['Bb4', 0.25],['A4', 1],    ['F4', 1],    ['G4', 1],    ['F4', 2],
];

const songTempo = 0.35;

function playNote(freq, duration, startTime, type = 'triangle', vol = 0.22) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = type;
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

function scheduleSong() {
  if (!audioCtx) return;
  let t = 0;
  const now = audioCtx.currentTime;

  // Part 1: Happy Birthday melody
  happyBirthdayMelody.forEach(([note, dur]) => {
    if (nf[note]) playNote(nf[note], dur * songTempo, now + t);
    t += dur * songTempo;
  });

  return t + 2.0;
}

function getFullDuration() {
  let t = 0;
  happyBirthdayMelody.forEach(([, d]) => t += d * songTempo);
  return t + 2.0;
}

function startSong() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  isSongPlaying = true;
  musicBtn.textContent = '\u{1F50A} Playing';
  musicBtn.classList.add('playing');

  // Schedule song and loop it
  const schedule = () => {
    if (!isSongPlaying) return;
    scheduleSong();
    songTimer = setTimeout(schedule, getFullDuration() * 1000);
  };
  schedule();
}

function stopSong() {
  isSongPlaying = false;
  if (songTimer) { clearTimeout(songTimer); songTimer = null; }
  if (audioCtx && audioCtx.state !== 'closed') audioCtx.suspend();
  musicBtn.textContent = '\u{1F3B5} Play Song';
  musicBtn.classList.remove('playing');
}

musicBtn.addEventListener('click', () => {
  isSongPlaying ? stopSong() : startSong();
});

/* RENDERING */
function render() {
  requestAnimationFrame(render);

  if (firstFrame) {
    firstFrame = false;
    setTimeout(() => {
      document.getElementById('pageOverlay').classList.add('fade-out');
    }, 800);
  }

  // Update main heart particle positions from animated vertices
  geometry.setFromPoints(vertices);

  // Update sparkle opacity
  sparkleMaterial.opacity = 1;
  sparkleGeometry.setAttribute('alpha', sparkleGeometry.attributes.alpha);

  // Floating hearts: gentle bob rotation
  const t = Date.now() * 0.001;
  floatingHearts.forEach((sprite, i) => {
    const ud = sprite.userData;
    sprite.position.x = ud.basePos.x + Math.sin(t * ud.speed + ud.floatOffset) * 20;
    sprite.position.y = ud.basePos.y + Math.cos(t * ud.speed * 0.7 + ud.floatOffset) * 15;
    sprite.material.rotation += 0.002;
  });

  // Petals: fall down and sway
  petals.forEach((sprite) => {
    const ud = sprite.userData;
    sprite.position.y -= ud.speed;
    sprite.position.x = ud.baseX + Math.sin(t * ud.swaySpeed + ud.phase) * ud.swayAmp;
    sprite.material.rotation += ud.rotSpeed;
    if (sprite.position.y < -400) {
      sprite.position.y = ud.spawnY;
      sprite.position.x = ud.baseX;
    }
  });

  // Petal opacity: fade in when animation is running
  const petalShow = Math.abs(Math.sin(t * 0.15)) * 0.5 + 0.2;
  petals.forEach((sprite, i) => {
    sprite.material.opacity = petalShow * (0.5 + 0.5 * Math.sin(t * 0.3 + i));
  });

  // Mouse trail: smooth follow
  if (mouseTarget.x !== 0 || mouseTarget.y !== 0) {
    const targetPos = screenToWorld(mouseTarget.x, mouseTarget.y, 50);
    trailHearts.forEach((sprite, i) => {
      const prev = i === 0 ? targetPos : trailHearts[i - 1].position;
      sprite.position.lerp(prev, 0.25 + i * 0.02);
      sprite.material.opacity = Math.max(0, 0.6 - i * 0.055);
      sprite.material.rotation += 0.02;
    });
  }

  // Animate burst hearts: fly outward and fade
  for (let i = burstHeartsPool.length - 1; i >= 0; i--) {
    const sprite = burstHeartsPool[i];
    const ud = sprite.userData;
    sprite.position.add(ud.vel.clone().multiplyScalar(0.016));
    ud.vel.multiplyScalar(0.97);
    ud.vel.y += 0.2;
    ud.life -= 0.008;
    sprite.material.opacity = Math.max(0, ud.life);
    sprite.material.rotation += 0.05;
    if (ud.life <= 0) {
      scene.remove(sprite);
      sprite.material.dispose();
      burstHeartsPool.splice(i, 1);
    }
  }

  renderer.render(scene, camera);
}

/* EVENTS */
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize, false);

requestAnimationFrame(render);
