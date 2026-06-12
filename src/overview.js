// ── Renderer / Scene / Camera ─────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.0012);

const camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 8000);
camera.position.set(0, 80, 220);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);


const labelCanvas = document.getElementById('labels');
const lctx = labelCanvas.getContext('2d');
function resizeAll() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelCanvas.width = innerWidth;
  labelCanvas.height = innerHeight;
}
resizeAll();
window.addEventListener('resize', resizeAll);

// ── Texture generator (canvas-based, no external images) ─────────────────────
function makeTexture(fn, size) {
  const c = document.createElement('canvas'); c.width = c.height = size || 256;
  fn(c.getContext('2d'), c.width);
  return new THREE.CanvasTexture(c);
}

function noiseTexture(baseHex, bands) {
  return makeTexture((ctx, S) => {
    const base = new THREE.Color(baseHex);
    ctx.fillStyle = `rgb(${~~(base.r*255)},${~~(base.g*255)},${~~(base.b*255)})`;
    ctx.fillRect(0, 0, S, S);
    bands.forEach(([col, alpha, cnt]) => {
      for (let i = 0; i < cnt; i++) {
        const y = Math.random() * S, h = Math.random() * 12 + 2;
        ctx.fillStyle = `rgba(${col},${alpha})`;
        ctx.fillRect(0, y, S, h);
      }
    });
    // Noise dots
    for (let i = 0; i < 3000; i++) {
      const x = Math.random()*S, y = Math.random()*S;
      ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.06})`;
      ctx.fillRect(x, y, 1, 1);
    }
  });
}

// ── Procedural noise helpers ──────────────────────────────────────────────────
// Simple value noise interpolated for organic look
function vnoise(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const fade = t => t * t * (3 - 2 * t);
  const hash = (a, b) => Math.sin(a * 127.1 + b * 311.7 + seed * 74.3) * 43758.5453 % 1;
  const lerp = (a, b, t) => a + (b - a) * fade(t);
  return lerp(
    lerp(hash(ix, iy),   hash(ix+1, iy),   fx),
    lerp(hash(ix, iy+1), hash(ix+1, iy+1), fx),
    fy
  );
}
// Fractal Brownian Motion — stack octaves of vnoise
function fbm(x, y, seed, oct = 5) {
  let v = 0, amp = 0.5, freq = 1, max = 0;
  for (let i = 0; i < oct; i++) {
    v   += vnoise(x * freq, y * freq, seed + i) * amp;
    max += amp; freq *= 2.1; amp *= 0.5;
  }
  return v / max;
}

const textures = {
  // ── Sun: convection cells + sunspots + limb darkening ──────────────────────
  sun: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const nx = x / S * 6, ny = y / S * 6;
      // convection cell pattern via voronoi-ish fbm
      const n1 = fbm(nx, ny, 0, 6);
      const n2 = fbm(nx + 3.1, ny + 1.7, 42, 4);
      const cell = Math.abs(Math.sin((n1 - n2) * Math.PI * 4));
      // limb darkening: distance from centre
      const dx = (x/S - 0.5) * 2, dy = (y/S - 0.5) * 2;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const limb = 1 - dist * dist * 0.6;
      // colour: white-hot core → orange → dark red edges
      const heat = (cell * 0.7 + n1 * 0.3) * limb;
      const r = Math.min(255, 180 + heat * 75);
      const g = Math.min(255, heat * heat * 180);
      const b = Math.min(60,  heat * 30);
      const i4 = (y * S + x) * 4;
      d[i4]   = r; d[i4+1] = g; d[i4+2] = b; d[i4+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // sunspots
    for (let s = 0; s < 8; s++) {
      const sx = S * (0.2 + Math.random() * 0.6), sy = S * (0.2 + Math.random() * 0.6);
      const r  = 3 + Math.random() * 8;
      const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
      g.addColorStop(0,   'rgba(20,5,0,0.9)');
      g.addColorStop(0.5, 'rgba(80,20,0,0.6)');
      g.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
    }
  }, 512),

  // ── Mercury: cratered grey rock ────────────────────────────────────────────
  mercury: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n = fbm(x/S*5, y/S*5, 10);
      const v = Math.round(90 + n * 80);
      const i4 = (y * S + x) * 4;
      d[i4] = v + 10; d[i4+1] = v; d[i4+2] = v - 8; d[i4+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // craters
    for (let c = 0; c < 40; c++) {
      const cx = Math.random()*S, cy = Math.random()*S, r = 2 + Math.random()*14;
      const g = ctx.createRadialGradient(cx,cy,0,cx,cy,r);
      g.addColorStop(0,   'rgba(40,35,30,0.7)');
      g.addColorStop(0.7, 'rgba(80,75,65,0.3)');
      g.addColorStop(1,   'rgba(160,155,140,0.4)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill();
    }
  }, 512),

  // ── Venus: thick swirling sulphur cloud bands ──────────────────────────────
  venus: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ny = y / S;
      const warp = fbm(x/S*3, ny*3, 20) * 0.3;
      const band = Math.sin((ny + warp) * Math.PI * 8) * 0.5 + 0.5;
      const n = fbm(x/S*4, ny*4, 21);
      const v = band * 0.6 + n * 0.4;
      const i4 = (y * S + x) * 4;
      d[i4]   = Math.min(255, 180 + v * 60);
      d[i4+1] = Math.min(255, 130 + v * 50);
      d[i4+2] = Math.min(255, 30  + v * 20);
      d[i4+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, 512),

  // ── Earth: oceans + continents + clouds ────────────────────────────────────
  earth: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n = fbm(x/S*4, y/S*4, 30, 6);
      const pole = Math.abs(y/S - 0.5) * 2; // 0 equator, 1 pole
      const i4 = (y * S + x) * 4;
      if (n > 0.52) { // land
        const h = (n - 0.52) * 10;
        if (pole > 0.82) { d[i4]=220;d[i4+1]=235;d[i4+2]=255; } // ice caps
        else if (h < 0.2) { d[i4]=210;d[i4+1]=190;d[i4+2]=130; } // beach
        else { d[i4]=30+h*40;d[i4+1]=90+h*30;d[i4+2]=20; } // green/mountain
      } else { // ocean
        const deep = 1 - n / 0.52;
        d[i4]=10;d[i4+1]=40+deep*40;d[i4+2]=100+deep*60;
      }
      d[i4+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // cloud layer
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const c = fbm(x/S*5+10, y/S*5, 99, 4);
      if (c > 0.58) {
        const a = (c - 0.58) * 5 * 0.7;
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, 512),

  // ── Mars: rusty dunes + polar ice ─────────────────────────────────────────
  mars: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n  = fbm(x/S*5, y/S*5, 40, 6);
      const n2 = fbm(x/S*12, y/S*12, 41, 3);
      const pole = Math.abs(y/S - 0.5) * 2;
      const i4 = (y * S + x) * 4;
      if (pole > 0.88) { d[i4]=230;d[i4+1]=220;d[i4+2]=210;d[i4+3]=255; continue; }
      const v = n * 0.7 + n2 * 0.3;
      d[i4]   = Math.min(255, 160 + v * 60);
      d[i4+1] = Math.min(255, 60  + v * 40);
      d[i4+2] = Math.min(255, 20  + v * 15);
      d[i4+3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // Valles Marineris hint
    ctx.strokeStyle='rgba(80,30,10,0.5)'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(S*0.2,S*0.48); ctx.bezierCurveTo(S*0.4,S*0.45,S*0.6,S*0.52,S*0.8,S*0.49); ctx.stroke();
  }, 512),

  // ── Jupiter: turbulent banded atmosphere + GRS ────────────────────────────
  jupiter: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    const bandCols = [[200,150,100],[180,120,70],[220,180,130],[160,100,60],[230,200,150],[140,80,50]];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ny = y / S;
      const warp = fbm(x/S*2, ny*2, 50) * 0.08;
      const bi = Math.floor(((ny + warp) * 12) % bandCols.length);
      const [br,bg,bb] = bandCols[((bi % bandCols.length) + bandCols.length) % bandCols.length];
      const n = fbm(x/S*8, ny*8, 51, 3) * 30;
      const i4 = (y * S + x) * 4;
      d[i4]=br+n;d[i4+1]=bg+n*0.7;d[i4+2]=bb+n*0.4;d[i4+3]=255;
    }
    ctx.putImageData(img, 0, 0);
    // Great Red Spot
    const gx = S*0.35, gy = S*0.52, gr = S*0.09;
    for (let r = gr; r > 0; r -= 0.5) {
      const t = r / gr;
      ctx.strokeStyle = `rgba(${160+t*40},${40+t*20},${20},${0.15})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(gx, gy, r*1.7, r, 0, 0, Math.PI*2); ctx.stroke();
    }
    ctx.fillStyle='rgba(180,55,35,0.5)';
    ctx.beginPath(); ctx.ellipse(gx, gy, gr*1.4, gr*0.7, 0, 0, Math.PI*2); ctx.fill();
  }, 512),

  // ── Saturn: subtle pale bands ─────────────────────────────────────────────
  saturn: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const ny = y / S;
      const warp = fbm(x/S*2, ny*2, 60) * 0.05;
      const band = Math.sin((ny + warp) * Math.PI * 14) * 0.5 + 0.5;
      const n = fbm(x/S*5, ny*5, 61) * 0.3;
      const v = band * 0.5 + n + 0.3;
      const i4 = (y * S + x) * 4;
      d[i4]=Math.min(255,180+v*50);d[i4+1]=Math.min(255,155+v*40);d[i4+2]=Math.min(255,90+v*20);d[i4+3]=255;
    }
    ctx.putImageData(img, 0, 0);
  }, 512),

  // ── Uranus: featureless haze with faint banding ───────────────────────────
  uranus: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n = fbm(x/S*3, y/S*3, 70, 3) * 0.15;
      const i4 = (y * S + x) * 4;
      d[i4]=110+n*40;d[i4+1]=195+n*30;d[i4+2]=200+n*20;d[i4+3]=255;
    }
    ctx.putImageData(img, 0, 0);
  }, 256),

  // ── Neptune: deep blue with faint storm wisps ─────────────────────────────
  neptune: makeTexture((ctx, S) => {
    const img = ctx.createImageData(S, S);
    const d = img.data;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const n  = fbm(x/S*4, y/S*4, 80, 5);
      const n2 = fbm(x/S*8, y/S*8, 81, 3);
      const i4 = (y * S + x) * 4;
      d[i4]=20+n*30;d[i4+1]=50+n*60;d[i4+2]=160+n*60;d[i4+3]=255;
      // storm wisps
      if (n2 > 0.65) { const a=(n2-0.65)*3; d[i4]+=a*80;d[i4+1]+=a*80;d[i4+2]+=a*40; }
    }
    ctx.putImageData(img, 0, 0);
  }, 512),
};

// ── Lights ────────────────────────────────────────────────────────────────────
const sunLight = new THREE.PointLight(0xfff0cc, 3.0, 2000);
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x080820, 2.5));

// ── Glow sprite helper ────────────────────────────────────────────────────────
// Builds a radial-gradient canvas texture: bright centre → fully transparent edge.
// Uses AdditiveBlending so overlapping glows accumulate naturally.
function makeGlowSprite(r, g, b, size) {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0,   `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.2, `rgba(${r},${g},${b},0.6)`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  const mat = new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(size);
  return sprite;
}

// ── Sun ───────────────────────────────────────────────────────────────────────
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(6, 48, 48),
  new THREE.MeshStandardMaterial({ map: textures.sun, emissiveMap: textures.sun, emissive: new THREE.Color(1, 0.6, 0.1), emissiveIntensity: 0.8, roughness: 1, metalness: 0 })
);
scene.add(sun);

// Soft additive glow — realistic: small tight halo, no giant nebula
const sunGlow1 = makeGlowSprite(255, 245, 200, 14);   // tight white-hot core
scene.add(sunGlow1);
const sunGlow2 = makeGlowSprite(255, 160, 40, 28);    // warm inner corona
scene.add(sunGlow2);
const sunGlow3 = makeGlowSprite(255, 80, 10, 50);     // faint outer diffusion
sunGlow3.material.opacity = 0.35;
scene.add(sunGlow3);

// ── Starfield — two layers for parallax depth ─────────────────────────────────
function makeStars(count, spread, size, opacity) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size, transparent: true, opacity, sizeAttenuation: false }));
}
const stars1 = makeStars(12000, 6000, 0.8, 0.9);
const stars2 = makeStars(4000,  3000, 1.4, 0.5);
scene.add(stars1); scene.add(stars2);

// ── Nebula background (large blurred spheres) ─────────────────────────────────
[
  { pos: [400, 200, -800], col: 0x110033, r: 300 },
  { pos: [-500, -100, -600], col: 0x001122, r: 250 },
  { pos: [100, -300, -700], col: 0x002211, r: 280 },
].forEach(({ pos, col, r }) => {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 16, 16),
    new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.18, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  m.position.set(...pos);
  scene.add(m);
});

// ── Planet data ───────────────────────────────────────────────────────────────
const PLANETS = [
  { name: '水星', en: 'Mercury', r: 0.55, orbit: 14, tex: textures.mercury, speed: 1.607, tilt: 0.03,
    tagline: '太阳系最小、最内侧的行星，昼夜温差极为剧烈。',
    desc: '水星是离太阳最近的行星，公转周期仅88个地球日。由于几乎没有大气层保温，白天温度可达430°C，夜晚骤降至-180°C，温差超过600°C。表面布满陨击坑，类似月球地貌，南极附近可能存在水冰。',
    geology: '水星拥有相对较大的铁质内核，约占半径的85%。表面以硅酸盐岩石为主，覆盖大量古老的撞击盆地与熔岩平原。卡洛里斯盆地直径约1,550公里，是太阳系最大撞击坑之一。',
    stats: [
      { label: '质量', value: '3.30 × 10²³ kg' },
      { label: '赤道半径', value: '2,439.7 km' },
      { label: '公转周期', value: '87.97 地球日' },
      { label: '自转周期', value: '58.65 地球日' },
      { label: '表面重力', value: '3.7 m/s²' },
      { label: '卫星数量', value: '0' },
    ]
  },
  { name: '金星', en: 'Venus', r: 1.05, orbit: 20, tex: textures.venus, speed: 1.174, tilt: 177.4,
    tagline: '太阳系最热的行星，被厚重的硫酸云层永久笼罩。',
    desc: '金星是距地球最近的行星，亮度仅次于太阳和月球，清晨或黄昏时肉眼可见，因此有"启明星"之称。金星以逆向自转著称，即从北极看来，自转方向与大多数行星相反，一个金星日比金星年还长。',
    geology: '金星表面以玄武岩为主，覆盖大量火山地貌，包括盾形火山、熔岩高原与构造变形区。马亚特火山可能仍在活动。大气层主要由CO₂组成，形成极强温室效应，地表气压约为地球的92倍。',
    stats: [
      { label: '质量', value: '4.87 × 10²⁴ kg' },
      { label: '赤道半径', value: '6,051.8 km' },
      { label: '公转周期', value: '224.7 地球日' },
      { label: '自转周期', value: '243.0 地球日（逆）' },
      { label: '表面温度', value: '465°C' },
      { label: '卫星数量', value: '0' },
    ]
  },
  { name: '地球', en: 'Earth', r: 1.15, orbit: 28, tex: textures.earth, speed: 1.000, tilt: 23.4,
    tagline: '目前已知宇宙中唯一孕育生命的星球。',
    desc: '地球是太阳系第三颗行星，也是目前唯一确认存在生命的天体。71%的表面被液态水覆盖，稳定的磁场屏蔽太阳风，适中的大气层提供温室保温，轴倾斜23.4°带来四季变化，共同构成生命存在的理想条件。',
    geology: '地球内部分为地壳、地幔、外核（液态铁镍）与内核（固态铁镍）四层。板块构造持续重塑地貌，造山运动、火山、地震均源于此。表面有七大洲四大洋，最高峰珠穆朗玛海拔8,848m，最深马里亚纳海沟深11,034m。',
    stats: [
      { label: '质量', value: '5.97 × 10²⁴ kg' },
      { label: '赤道半径', value: '6,371 km' },
      { label: '公转周期', value: '365.25 天' },
      { label: '自转周期', value: '23小时56分' },
      { label: '表面重力', value: '9.8 m/s²' },
      { label: '卫星数量', value: '1（月球）' },
    ]
  },
  { name: '火星', en: 'Mars', r: 0.85, orbit: 38, tex: textures.mars, speed: 0.802, tilt: 25.2,
    tagline: '红色星球，太阳系最高山脉与最深峡谷的家园。',
    desc: '火星因表面富含氧化铁而呈红色，是人类最有可能移民的行星候选。大气层极为稀薄，主要成分为CO₂，表面平均温度-60°C。自转周期与地球相近（24小时37分），同样有四季更替，北极冠有水冰存在。',
    geology: '火星表面有奥林匹斯山（高21km，太阳系最高火山）与水手号峡谷（长4,000km，深7km，太阳系最大峡谷）。南北半球地形迥异，北半球多低洼平原，南半球多古老高地。早期可能存在液态水海洋。',
    stats: [
      { label: '质量', value: '6.42 × 10²³ kg' },
      { label: '赤道半径', value: '3,389.5 km' },
      { label: '公转周期', value: '686.97 地球日' },
      { label: '自转周期', value: '24小时37分' },
      { label: '表面重力', value: '3.72 m/s²' },
      { label: '卫星数量', value: '2（火卫一、二）' },
    ]
  },
  { name: '木星', en: 'Jupiter', r: 3.8, orbit: 62, tex: textures.jupiter, speed: 0.434, tilt: 3.1,
    tagline: '太阳系最大行星，一颗未能点燃的气态巨行星。',
    desc: '木星质量是其余所有行星总和的2.5倍。其巨大引力像"吸尘器"般保护了内太阳系，多次将来袭彗星偏转。木星自转极快，约10小时一圈，导致赤道明显隆起。若质量再大75倍，将足以点燃成为恒星。',
    geology: '木星无固态表面，主要由氢氦构成，深部氢气在极端压力下形成液态金属氢，产生太阳系最强磁场。大红斑是持续三百余年的反气旋风暴，直径曾达地球3倍。云带结构复杂，呈现多层次彩色条纹。',
    stats: [
      { label: '质量', value: '1.90 × 10²⁷ kg' },
      { label: '赤道半径', value: '71,492 km' },
      { label: '公转周期', value: '11.86 地球年' },
      { label: '自转周期', value: '9小时56分' },
      { label: '云顶温度', value: '-145°C' },
      { label: '卫星数量', value: '95颗（含木卫一~四）' },
    ]
  },
  { name: '土星', en: 'Saturn', r: 3.2, orbit: 86, tex: textures.saturn, speed: 0.323, tilt: 26.7,
    tagline: '拥有壮观光环系统，平均密度低于水的气态巨星。',
    desc: '土星光环宽度超过27万公里，厚度却不足1公里，主要由水冰颗粒和少量岩石碎屑组成。土星平均密度仅0.687 g/cm³，比水还轻，理论上可以漂浮在足够大的水面上。土卫六（泰坦）有浓厚氮气大气和液态甲烷湖，是寻找地外生命的重要目标。',
    geology: '与木星类似，土星无固态表面。内部结构由外到内为气态氢氦大气→液态氢层→液态金属氢层→岩石/冰核。土星风速可达1,800km/h，六边形极地气旋宽约32,000公里，成因仍有争议。',
    stats: [
      { label: '质量', value: '5.68 × 10²⁶ kg' },
      { label: '赤道半径', value: '60,268 km' },
      { label: '公转周期', value: '29.46 地球年' },
      { label: '自转周期', value: '10小时34分' },
      { label: '平均密度', value: '0.687 g/cm³' },
      { label: '卫星数量', value: '146颗（最多）' },
    ]
  },
  { name: '天王星', en: 'Uranus', r: 2.1, orbit: 112, tex: textures.uranus, speed: 0.228, tilt: 97.8,
    tagline: '侧躺旋转的冰巨星，拥有极度倾斜的磁轴。',
    desc: '天王星自转轴倾斜达97.8°，几乎是"侧躺"运行，导致极区会经历42年连续白昼后再是42年极夜。其蓝绿色外观源于大气中甲烷对红光的吸收。天王星磁轴相对自转轴偏斜59°，且不经过星球中心，形成极不规则的磁场。',
    geology: '天王星属于"冰巨星"，内部主要为水、氨、甲烷组成的"热冰"超临界流体，而非气态巨行星那样的氢氦为主。岩石核外包裹冰幔，无明显固态表面。表面特征较为平淡，云层活动不如木星活跃。',
    stats: [
      { label: '质量', value: '8.68 × 10²⁵ kg' },
      { label: '赤道半径', value: '25,559 km' },
      { label: '公转周期', value: '84.01 地球年' },
      { label: '自转周期', value: '17小时14分（逆）' },
      { label: '云顶温度', value: '-224°C' },
      { label: '卫星数量', value: '27颗' },
    ]
  },
  { name: '海王星', en: 'Neptune', r: 2.0, orbit: 136, tex: textures.neptune, speed: 0.182, tilt: 28.3,
    tagline: '太阳系最远行星，拥有太阳系最猛烈的风暴。',
    desc: '海王星是目前太阳系最外侧的行星（冥王星降级后），距太阳约45亿公里，光线到达需要4小时。其存在早在被观测到之前就由数学计算预测，是天体力学的辉煌成就。海卫一（特里同）是太阳系中唯一逆行的大型卫星，可能是捕获的柯伊伯带天体。',
    geology: '海王星与天王星同为冰巨星，内部由水、氨、甲烷冰构成。深蓝色外观比天王星更鲜艳，源于更高浓度的甲烷及未知成分。大暗斑是巨大反气旋风暴，风速达2,100km/h，是太阳系有记录的最高风速。',
    stats: [
      { label: '质量', value: '1.02 × 10²⁶ kg' },
      { label: '赤道半径', value: '24,622 km' },
      { label: '公转周期', value: '164.8 地球年' },
      { label: '自转周期', value: '16小时6分' },
      { label: '最高风速', value: '2,100 km/h' },
      { label: '卫星数量', value: '16颗' },
    ]
  },
];

const SPEED_SCALE = 0.0012; // very slow — grand, majestic feel
const planetMeshes = [];
const moonEntries = [];   // interactable moon data entries

PLANETS.forEach(p => {
  // Orbit ring — 3-layer HUD navigation system (all parented to pivot for correct tilt)
  // Layer 1: base ring (subtle, fog-immune)
  const orbitGeo = new THREE.RingGeometry(p.orbit - 0.06, p.orbit + 0.06, 180);
  const orbitMat = new THREE.MeshBasicMaterial({ color: 0x0e3040, transparent: true, opacity: 0.22, side: THREE.DoubleSide, fog: false });
  const orbitRing = new THREE.Mesh(orbitGeo, orbitMat);
  orbitRing.rotation.x = Math.PI / 2;
  // Layer 2: additive glow ring (thin cyan neon — matches HUD palette)
  const glowGeo = new THREE.RingGeometry(p.orbit - 0.02, p.orbit + 0.02, 180);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x00c8b4, transparent: true, opacity: 0.40, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const glowRing = new THREE.Mesh(glowGeo, glowMat);
  glowRing.rotation.x = Math.PI / 2;
  // Layer 3: navigation waypoints (sparse dots around orbit)
  const dotCount = 72;
  const dotPositions = new Float32Array(dotCount * 3);
  for (let di = 0; di < dotCount; di++) {
    const angle = (di / dotCount) * Math.PI * 2;
    dotPositions[di * 3] = Math.cos(angle) * p.orbit;
    dotPositions[di * 3 + 1] = 0;
    dotPositions[di * 3 + 2] = Math.sin(angle) * p.orbit;
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
  const dotMat = new THREE.PointsMaterial({ color: 0x009080, size: 0.18, sizeAttenuation: true, transparent: true, opacity: 0.30, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  const orbitDots = new THREE.Points(dotGeo, dotMat);
  // Store refs
  p.orbitRing = orbitRing; p.orbitGlow = glowRing; p.orbitDots = orbitDots;

  // Pivot for orbit
  const pivot = new THREE.Object3D();
  pivot.rotation.x = (Math.random() - 0.5) * 0.18;
  scene.add(pivot);

  // Parent all orbit layers to pivot (inherits tilt — fixes trajectory alignment)
  pivot.add(orbitRing);
  pivot.add(glowRing);
  pivot.add(orbitDots);

  // Planet
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(p.r, 40, 40),
    new THREE.MeshPhongMaterial({ map: p.tex, shininess: 25, specular: new THREE.Color(0x222222) })
  );
  mesh.position.x = p.orbit;
  mesh.rotation.z = THREE.MathUtils.degToRad(p.tilt);
  pivot.add(mesh);

  // Saturn rings
  if (p.en === 'Saturn') {
    const ringTex = makeTexture((ctx, S) => {
      const g = ctx.createLinearGradient(0,0,S,0);
      g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(0.15,'rgba(180,160,100,0.3)');
      g.addColorStop(0.35,'rgba(220,200,140,0.7)'); g.addColorStop(0.55,'rgba(160,140,90,0.5)');
      g.addColorStop(0.75,'rgba(200,180,120,0.6)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,S,S);
    });
    const rg = new THREE.RingGeometry(p.r * 1.3, p.r * 2.6, 128);
    // UV remap so texture applies radially
    const pos = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      const d = v.length();
      uv.setXY(i, (d - p.r*1.3)/(p.r*2.6 - p.r*1.3), 0.5);
    }
    const rm = new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, opacity: 0.85, side: THREE.DoubleSide, fog: false, depthWrite: false });
    const ring = new THREE.Mesh(rg, rm);
    ring.rotation.x = Math.PI / 2.3;
    mesh.add(ring);
  }

  // Earth: atmosphere glow sprite + moon
  if (p.en === 'Earth') {
    const atmoSprite = makeGlowSprite(60, 120, 255, p.r * 5);
    atmoSprite.material.opacity = 0.35;
    mesh.add(atmoSprite);

    const moonPivot = new THREE.Object3D();
    mesh.add(moonPivot);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 28, 28),
      new THREE.MeshPhongMaterial({ map: noiseTexture(0x999999, [['150,140,130',0.4,20],['80,70,60',0.3,15]]), shininess: 5 })
    );
    moon.position.x = 2.6;
    moonPivot.add(moon);
    p.moonPivots = [{ pivot: moonPivot, speed: 0.018 }];

    moonEntries.push({
      name: '月球', en: 'Moon', r: 0.3, mesh,
      parentPlanetName: 'Earth',
      tagline: '地球唯一的天然卫星，潮汐锁定的荒芜世界。',
      desc: '月球是地球唯一的天然卫星，直径3,474km，距地球约38.4万km。由于潮汐锁定，月球始终以同一面朝向地球。月球没有大气层和液态水，表面温差极大，白昼可达127°C，夜晚降至-173°C。月球的引力是地球海洋潮汐的主要驱动力，同时也稳定了地球的自转轴倾斜。',
      geology: '月球表面分为月海（暗色玄武岩平原，约占正面31%）和月陆（亮色斜长岩高地，更为古老）。月海形成于约30-39亿年前的火山活动，月陆则保存了超过44亿年的撞击记录。南极艾特肯盆地直径约2,500km，深13km，是太阳系最大的确认撞击盆地之一。月球内部已冷却固化，月震极少且微弱。',
      stats: [
        { label: '质量', value: '7.34 × 10²² kg' },
        { label: '半径', value: '1,737 km' },
        { label: '公转周期', value: '27.3 地球日' },
        { label: '距地球', value: '384,400 km' },
        { label: '表面重力', value: '1.62 m/s²' },
        { label: '表面温度', value: '-173°C ~ 127°C' },
      ],
    });
  }

  // Mars moons: Phobos & Deimos
  if (p.en === 'Mars') {
    p.moonPivots = [];
    const phPivot = new THREE.Object3D(); mesh.add(phPivot);
    const phobos = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x887766, shininess: 3, specular: new THREE.Color(0x111111) })
    );
    phobos.position.x = 1.6; phPivot.add(phobos);
    p.moonPivots.push({ pivot: phPivot, speed: 0.048 });
    const dePivot = new THREE.Object3D(); mesh.add(dePivot);
    const deimos = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshPhongMaterial({ color: 0x998877, shininess: 3, specular: new THREE.Color(0x111111) })
    );
    deimos.position.x = 2.3; dePivot.add(deimos);
    p.moonPivots.push({ pivot: dePivot, speed: 0.019 });
  }

  // Jupiter: 4 Galilean moons
  if (p.en === 'Jupiter') {
    p.moonPivots = [];
    const galilean = [
      { dist: 5.6, r: 0.22, col: 0xddcc44, speed: 0.040 },
      { dist: 6.9, r: 0.20, col: 0xccddee, speed: 0.030 },
      { dist: 8.3, r: 0.28, col: 0xbbccdd, speed: 0.024 },
      { dist: 9.9, r: 0.26, col: 0x998877, speed: 0.018 },
    ];
    galilean.forEach(g => {
      const gPivot = new THREE.Object3D(); mesh.add(gPivot);
      const gMoon = new THREE.Mesh(
        new THREE.SphereGeometry(g.r, 16, 16),
        new THREE.MeshPhongMaterial({ color: g.col, shininess: 8, specular: new THREE.Color(0x111111) })
      );
      gMoon.position.x = g.dist; gPivot.add(gMoon);
      p.moonPivots.push({ pivot: gPivot, speed: g.speed });
    });
  }

  // Saturn: Titan
  if (p.en === 'Saturn') {
    p.moonPivots = [];
    const tPivot = new THREE.Object3D(); mesh.add(tPivot);
    const titan = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xddaa66, shininess: 8, specular: new THREE.Color(0x111111) })
    );
    titan.position.x = 9.5; tPivot.add(titan);
    p.moonPivots.push({ pivot: tPivot, speed: 0.012 });
  }

  // Neptune: Triton (retrograde)
  if (p.en === 'Neptune') {
    p.moonPivots = [];
    const trPivot = new THREE.Object3D(); mesh.add(trPivot);
    const triton = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshPhongMaterial({ color: 0xaabbcc, shininess: 8, specular: new THREE.Color(0x111111) })
    );
    triton.position.x = 4.2; trPivot.add(triton);
    p.moonPivots.push({ pivot: trPivot, speed: -0.015 });
  }

  // Per-planet rim glow sprite — colour matches planet tint
  const col = new THREE.Color(p.color || 0xffffff);
  const glow = makeGlowSprite(
    Math.round(col.r * 255), Math.round(col.g * 255), Math.round(col.b * 255),
    p.r * 4.5
  );
  glow.material.opacity = 0.22;
  mesh.add(glow);
  p.glowSprite = glow;

  pivot.rotation.y = Math.random() * Math.PI * 2;
  const pmEntry = { ...p, pivot, mesh };
  planetMeshes.push(pmEntry);
  // Fix moon parentPlanet refs to point to actual planetMeshes entry
  moonEntries.forEach(m => {
    if (m.parentPlanetName === p.en) m.parentPlanet = pmEntry;
  });
});

// ── Asteroid belt ─────────────────────────────────────────────────────────────
(() => {
  // Round soft dot alphaMap — eliminates square pixel look at any zoom
  const dotCanvas = document.createElement('canvas'); dotCanvas.width = dotCanvas.height = 32;
  const dc = dotCanvas.getContext('2d');
  const dg = dc.createRadialGradient(16,16,0,16,16,16);
  dg.addColorStop(0,'rgba(255,255,255,1)'); dg.addColorStop(0.4,'rgba(255,255,255,0.8)'); dg.addColorStop(1,'rgba(255,255,255,0)');
  dc.fillStyle = dg; dc.fillRect(0,0,32,32);
  const dotTex = new THREE.CanvasTexture(dotCanvas);

  const pos = [], col = [];
  for (let i = 0; i < 2500; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 47 + (Math.random() - 0.5) * 9;
    const y = (Math.random() - 0.5) * 2.5;
    pos.push(Math.cos(angle)*r, y, Math.sin(angle)*r);
    const b = 0.3 + Math.random() * 0.4;
    col.push(b*0.6, b*0.55, b*0.45);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(new Float32Array(col), 3));
  scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
    vertexColors: true, map: dotTex, alphaMap: dotTex,
    size: 0.5, sizeAttenuation: true,   // shrinks with distance — no fixed-pixel squares
    transparent: true, opacity: 0.65, depthWrite: false,
    alphaTest: 0.02
  })));
})();

// ── Comets ────────────────────────────────────────────────────────────────────
const COMETS = Array.from({ length: 3 }, (_, i) => {
  const inclination = (Math.random() - 0.5) * Math.PI * 0.6;
  const perihelion = 15 + Math.random() * 20;
  const aphelion = 160 + Math.random() * 80;
  const a = (perihelion + aphelion) / 2;
  const e = (aphelion - perihelion) / (aphelion + perihelion);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xccddff })
  );
  scene.add(head);

  // Tail: line of fading points
  const tailCount = 60;
  const tailPos = new Float32Array(tailCount * 3);
  const tailGeo = new THREE.BufferGeometry();
  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos, 3));
  const tailMat = new THREE.LineBasicMaterial({ color: 0x88bbff, transparent: true, opacity: 0.5, linewidth: 1 });
  const tail = new THREE.Line(tailGeo, tailMat);
  scene.add(tail);

  return { head, tail, tailPos, tailCount, a, e, inclination, phase: Math.random() * Math.PI * 2, speed: 0.00015 + Math.random() * 0.0001, history: [] };
});

function updateComet(c, frame) {
  // Elliptical orbit: true anomaly stepping
  c.phase += c.speed * (1 / Math.max(0.3, (1 - c.e * Math.cos(c.phase)) ** 2)) * 0.5;
  const r = c.a * (1 - c.e * c.e) / (1 + c.e * Math.cos(c.phase));
  const x = r * Math.cos(c.phase);
  const z = r * Math.sin(c.phase);
  const y = Math.sin(c.inclination) * z * 0.4;

  c.head.position.set(x, y, z);

  // Trail history
  c.history.unshift(new THREE.Vector3(x, y, z));
  if (c.history.length > c.tailCount) c.history.pop();

  for (let i = 0; i < c.tailCount; i++) {
    const p = c.history[i] || c.head.position;
    c.tailPos[i*3] = p.x; c.tailPos[i*3+1] = p.y; c.tailPos[i*3+2] = p.z;
  }
  c.tail.geometry.attributes.position.needsUpdate = true;
  // Tail fades near sun
  c.tail.material.opacity = Math.min(0.6, r / 40) * 0.8;
}

// ── Mouse orbit ───────────────────────────────────────────────────────────────
let drag = false, lastX = 0, lastY = 0;
let rotY = 0.4, rotX = 0.35;
let camDist = 220, targetDist = 220;

// ── Zoom state ────────────────────────────────────────────────────────────────
let zoomedPlanet = null;            // which planet we're zoomed into (null = overview)
let targetCamPos = new THREE.Vector3(0, 0, 0);  // smooth target for camera.lookAt
let currentCamTarget = new THREE.Vector3(0, 0, 0); // current smoothed lookAt point
let prevProceduralTex = null;       // backup procedural texture while zoomed
const ZOOM_DIST_FACTOR = 5;        // planet radius × this = zoom distance
const surfaceAnimLayers = [];       // { mesh, type, planetKey } — populated by zoom.js
// ── Panel ─────────────────────────────────────────────────────────────────────
const tmpV = new THREE.Vector3();
const panel = document.getElementById('panel');
const panelBody = document.getElementById('panel-body');

document.getElementById('panel-close').addEventListener('click', () => {
  panel.classList.remove('open');
  selectedPlanet = null;
});

let selectedPlanet = null;

// Find moon entry for a planet
function getMoonForPlanet(p) {
  return moonEntries.find(m => m.parentPlanet === p || m.parentPlanetName === (p.en || '')) || null;
}
// Find planet entry for a moon
function getPlanetForMoon(m) {
  if (m.parentPlanet) return m.parentPlanet;
  if (m.parentPlanetName) return planetMeshes.find(p => p.en === m.parentPlanetName) || null;
  return null;
}

function openPanel(p) {
  selectedPlanet = p;
  const moon = getMoonForPlanet(p);
  const parentPlanet = getPlanetForMoon(p);

  let subtitleHTML = '';
  if (moon) {
    subtitleHTML = `<span class="p-subtitle-link" data-target="moon">月球 MOON</span>`;
  } else if (parentPlanet) {
    subtitleHTML = `<span class="p-subtitle-link" data-target="planet">${parentPlanet.name} ${parentPlanet.en.toUpperCase()}</span>`;
  }

  panelBody.innerHTML = `
    <div class="p-header">
      <div class="p-name-row">
        <span class="p-name">${p.name}</span>
        ${subtitleHTML}
      </div>
      <div class="p-en">${p.en.toUpperCase()}</div>
      <div class="p-tagline">${p.tagline}</div>
    </div>
    <div class="p-section">
      <div class="p-section-title">概述</div>
      <p>${p.desc}</p>
    </div>
    <div class="p-section">
      <div class="p-section-title">地形与地质</div>
      <p>${p.geology}</p>
    </div>
    <div class="p-section">
      <div class="p-section-title">天体物理数据</div>
      <div class="p-stats">
        ${p.stats.map(s => `
          <div class="p-stat">
            <div class="p-stat-label">${s.label}</div>
            <div class="p-stat-value">${s.value}</div>
          </div>`).join('')}
      </div>
    </div>`;

  const link = panelBody.querySelector('.p-subtitle-link');
  if (link) {
    link.addEventListener('click', () => {
      if (moon) openPanel(moon);
      else if (parentPlanet) openPanel(parentPlanet);
    });
  }

  panel.classList.add('open');
}

// ── Raycaster + mouse ─────────────────────────────────────────────────────────
const raycaster = new THREE.Raycaster();
const mouse2 = new THREE.Vector2();
const hint = document.getElementById('hint');
const SUN_DATA = {
  name: '太阳', en: 'Sun',
  tagline: '太阳系的中心恒星，提供维持所有行星运转的能量。',
  desc: '太阳是一颗G型主序星，诞生于约46亿年前，预计还能燃烧50亿年。其质量占太阳系总质量的99.86%，引力主宰着所有天体的轨道。核心每秒将6亿吨氢聚变为氦，释放出相当于3.8×10²⁶瓦的能量，以光和粒子流的形式向外辐射。',
  geology: '太阳由外到内分为日冕、色球、光球、对流层、辐射层和核心。光球表面温度约5,500°C，核心温度高达1,500万°C。表面可见对流胞（米粒组织）和偶发的太阳黑子，黑子温度约3,800°C，因此相对周边显得暗。太阳黑子活动遵循约11年的周期。',
  stats: [
    { label: '质量',     value: '1.99 × 10³⁰ kg' },
    { label: '半径',     value: '696,340 km' },
    { label: '表面温度', value: '5,500°C' },
    { label: '核心温度', value: '1,500万°C' },
    { label: '自转周期', value: '25天（赤道）' },
    { label: '距地球',   value: '1 AU · 约1.5亿km' },
  ],
  mesh: sun,    // reference filled after sun is created
};

const allMeshes = [sun, ...planetMeshes.map(p => p.mesh)];
let mouseMovedAfterDown = false;

renderer.domElement.addEventListener('mousedown', e => {
  drag = true; lastX = e.clientX; lastY = e.clientY;
  mouseMovedAfterDown = false;
});
window.addEventListener('mouseup', e => {
  drag = false;
  if (!mouseMovedAfterDown) handleClick(e);
});
window.addEventListener('mousemove', e => {
  if (drag) {
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) mouseMovedAfterDown = true;
    rotY += dx * 0.003;
    rotX += dy * 0.003;
    rotX = Math.max(-1.3, Math.min(1.3, rotX));
    lastX = e.clientX; lastY = e.clientY;
  }
  checkHoverHint(e);
});
window.addEventListener('wheel', e => {
  if (zoomedPlanet) return;
  targetDist = Math.max(20, Math.min(500, targetDist + e.deltaY * 0.2));
});

// Double-click → zoom into planet with real texture
renderer.domElement.addEventListener('dblclick', e => {
  const p = getRayHit(e.clientX, e.clientY);
  if (p) {
    zoomToPlanet(p);
  } else {
    zoomOut();
  }
});

// Touch — pinch zoom blocked when zoomed; rotation always allowed
let lastTouchDist = 0;
window.addEventListener('touchstart', e => {
  if (e.touches.length === 1) { drag = true; mouseMovedAfterDown = false; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; }
  if (e.touches.length === 2) lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
});
window.addEventListener('touchend', e => { drag = false; if (!mouseMovedAfterDown && e.changedTouches.length) handleClick(e.changedTouches[0]); });
window.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && drag) {
    const dx = e.touches[0].clientX - lastX, dy = e.touches[0].clientY - lastY;
    if (Math.abs(dx)+Math.abs(dy) > 3) mouseMovedAfterDown = true;
    rotY += dx * 0.003; rotX += dy * 0.003;
    rotX = Math.max(-1.3, Math.min(1.3, rotX));
    lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
  }
  if (e.touches.length === 2 && !zoomedPlanet) {
    const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    targetDist = Math.max(20, Math.min(500, targetDist - (d - lastTouchDist) * 0.5));
    lastTouchDist = d;
  }
});

function getRayHit(clientX, clientY) {
  mouse2.x = (clientX / innerWidth) * 2 - 1;
  mouse2.y = -(clientY / innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse2, camera);
  const hits = raycaster.intersectObjects(allMeshes);
  if (!hits.length) return null;
  if (hits[0].object === sun) return SUN_DATA;
  return planetMeshes.find(p => p.mesh === hits[0].object) || null;
}

function checkHoverHint(e) {
  const p = getRayHit(e.clientX, e.clientY);
  renderer.domElement.style.cursor = p ? 'pointer' : 'default';
}

// ── Surface animation layers (added when zoomed) ───────────────────────────────

function handleClick(e) {
  const p = getRayHit(e.clientX, e.clientY);
  if (p) openPanel(p);
}

// ── Labels (2D canvas overlay — name dot only when panel closed) ──────────────
function drawLabels() {
  lctx.clearRect(0, 0, innerWidth, innerHeight);
  if (panel.classList.contains('open')) return; // hide labels when panel open
  lctx.font = '10px Courier New';
  planetMeshes.forEach(p => {
    p.mesh.getWorldPosition(tmpV);
    tmpV.project(camera);
    if (tmpV.z > 1) return;
    const panelW = panel.classList.contains('open') ? 360 : 0;
    const sx = (tmpV.x * 0.5 + 0.5) * innerWidth;
    const sy = (-tmpV.y * 0.5 + 0.5) * innerHeight;
    if (sx > innerWidth - panelW - 20) return;
    // small dot indicator
    lctx.beginPath();
    lctx.arc(sx, sy - p.r * 14, 2, 0, Math.PI * 2);
    lctx.fillStyle = 'rgba(140,180,255,0.4)';
    lctx.fill();
    // name label
    lctx.fillStyle = 'rgba(140,180,255,0.35)';
    lctx.fillText(p.name, sx + 6, sy - p.r * 14 + 4);
  });
}

// ── Animate ───────────────────────────────────────────────────────────────────
const fpsEl = document.getElementById('fps');
let frame = 0, fpsCount = 0, lastFpsT = performance.now();

function animate(ts) {
  requestAnimationFrame(animate);
  frame++;
  fpsCount++;
  if (ts - lastFpsT >= 1000) { fpsEl.textContent = fpsCount; fpsCount = 0; lastFpsT = ts; }

  // Smooth zoom
  camDist += (targetDist - camDist) * 0.06;

  // Smooth lookAt target (follows planet when zoomed)
  if (zoomedPlanet) {
    zoomedPlanet.mesh.getWorldPosition(targetCamPos);
  }
  currentCamTarget.lerp(targetCamPos, 0.06);

  // Very slow auto-rotate when not dragging and not zoomed
  if (!drag && !zoomedPlanet) rotY += 0.0003;

  // Camera — orbits around currentCamTarget, not always origin
  camera.position.x = currentCamTarget.x + Math.sin(rotY) * Math.cos(rotX) * camDist;
  camera.position.y = currentCamTarget.y + Math.sin(rotX) * camDist;
  camera.position.z = currentCamTarget.z + Math.cos(rotY) * Math.cos(rotX) * camDist;
  camera.lookAt(currentCamTarget);

  // Sun + glow sprites (always face camera, pulse gently)
  sun.rotation.y += 0.001;
  const pulse = Math.sin(frame * 0.018) * 0.06;
  sunGlow1.scale.setScalar(14 * (1 + pulse * 0.08));
  sunGlow2.scale.setScalar(28 * (1 + pulse * 0.05));
  sunGlow3.scale.setScalar(50 * (1 + pulse * 0.03));
  sunLight.intensity = 2.4 + pulse * 0.4;

  // Planets — almost no self-glow (realistic: lit by sun only)
  planetMeshes.forEach(p => {
    p.pivot.rotation.y += p.speed * SPEED_SCALE;
    // Slower self-rotation when zoomed for detail viewing
    p.mesh.rotation.y += (zoomedPlanet === p ? 0.002 : 0.003);
    if (p.moonPivots) p.moonPivots.forEach(m => { m.pivot.rotation.y += m.speed; });
    if (p.glowSprite) {
      p.glowSprite.material.opacity = Math.max(0.02, 0.06 - p.orbit * 0.0003);
    }
  });


  // Surface animation layers — drive per-frame
  surfaceAnimLayers.forEach(l => {
    switch (l.type) {
      case 'rotate':
        l.mesh.rotation.y += l.speed;
        break;
      case 'pulse':
        const s = 1 + Math.sin(frame * l.speed) * 0.15;
        l.mesh.scale.setScalar(s);
        break;
      case 'flare':
        l.mesh.rotation.z += l.speed;
        l.mesh.material.opacity = 0.18 + Math.sin(frame * l.speed * 3 + l.mesh.rotation.z) * 0.1;
        break;
    }
  });

  // Comets
  COMETS.forEach(c => updateComet(c, frame));

  // Stars slow drift
  stars1.rotation.y += 0.00004;
  stars2.rotation.y -= 0.00002;

  drawLabels();
  renderer.render(scene, camera);
}

animate(0);
