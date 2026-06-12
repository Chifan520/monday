// ── Zoom mode: real textures + feature panel ─────────────────────────────────

// Real texture loader (Wikimedia, supports CORS)
const _texLoader = new THREE.TextureLoader();
const REAL_TEX = {};
const REAL_TEX_URLS = {
  sun:     'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1280px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  mercury: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Mercury_in_color_-_Prockter07_centered.jpg/1024px-Mercury_in_color_-_Prockter07_centered.jpg',
  venus:   'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Venus_globe.jpg/1024px-Venus_globe.jpg',
  earth:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png',
  mars:    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Mars_Valles_Marineris.jpeg/1280px-Mars_Valles_Marineris.jpeg',
  jupiter: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jupiter%2C_image_taken_by_NASA%27s_Hubble_Space_Telescope%2C_June_2019_-_Edited.jpg/1280px-Jupiter%2C_image_taken_by_NASA%27s_Hubble_Space_Telescope%2C_June_2019_-_Edited.jpg',
  saturn:  'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg',
  uranus:  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Uranus_Voyager2_color_calibrated.png/1024px-Uranus_Voyager2_color_calibrated.png',
  neptune: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Neptune_Voyager2_color_calibrated.png/1024px-Neptune_Voyager2_color_calibrated.png',
  moon:    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/FullMoon2010.jpg/1024px-FullMoon2010.jpg',
};
Object.entries(REAL_TEX_URLS).forEach(([key, url]) => {
  _texLoader.load(url, tex => { REAL_TEX[key] = tex; }, undefined, () => {});
});

let prevPhongMat = null;

function makeCloudTex(size) {
  const c = document.createElement('canvas'); c.width = c.height = size || 512;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(c.width, c.width);
  for (let y = 0; y < c.width; y++) for (let x = 0; x < c.width; x++) {
    const n = fbm(x / c.width * 6, y / c.width * 6, 99, 4);
    const a = n > 0.5 ? (n - 0.5) * 3 : 0;
    const i4 = (y * c.width + x) * 4;
    img.data[i4]=255; img.data[i4+1]=255; img.data[i4+2]=255; img.data[i4+3]=Math.min(255, a * 255);
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const dynamicCloudTex = makeCloudTex(512);


// ── Feature illustration drawing ──────────────────────────────────────────────
// Each feature gets a small 48×48 canvas illustration generated live
function drawFeatureIllo(featureKey) {
  const c = document.createElement('canvas'); c.width = c.height = 48;
  const ctx = c.getContext('2d');
  const w = 48;

  // Helper: draw circle crater
  function crater(cx, cy, r, col) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(cx-1, cy-1, r*0.4, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  // Helper: ellipse
  function spot(cx, cy, rx, ry, col, alpha) {
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
    ctx.fillStyle = col; ctx.globalAlpha = alpha || 1; ctx.fill(); ctx.globalAlpha = 1;
  }

  const illos = {
    // Sun
    sunspot(ctx) {
      const g = ctx.createRadialGradient(24,24,0,24,24,24);
      g.addColorStop(0,'#ff9900'); g.addColorStop(0.6,'#ff4400'); g.addColorStop(1,'#220000');
      ctx.fillStyle = g; ctx.fillRect(0,0,w,w);
      spot(18,30,10,6,'#1a0500',1);
      spot(28,18,6,4,'#2a0a00',0.9);
    },
    granules(ctx) {
      const g = ctx.createRadialGradient(24,24,0,24,24,24);
      g.addColorStop(0,'#fff8c0'); g.addColorStop(0.5,'#ffaa00'); g.addColorStop(1,'#441100');
      ctx.fillStyle = g; ctx.fillRect(0,0,w,w);
      for (let i=0;i<50;i++) { ctx.fillStyle=`rgba(255,${200+Math.random()*55},0,${0.3+Math.random()*0.3})`; ctx.fillRect(Math.random()*w,Math.random()*w,3+Math.random()*4,2+Math.random()*2); }
    },
    corona(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      const g = ctx.createRadialGradient(24,24,2,24,24,26);
      g.addColorStop(0,'#fff'); g.addColorStop(0.3,'rgba(255,200,100,0.4)'); g.addColorStop(0.6,'rgba(255,100,30,0.1)'); g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0,0,w,w);
      for (let i=0;i<8;i++) { ctx.strokeStyle='rgba(255,200,100,0.3)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(24,24); ctx.lineTo(24+Math.cos(i*0.78)*22,24+Math.sin(i*0.78)*22); ctx.stroke(); }
    },
    prom(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,28,10,Math.PI,0);
      ctx.fillStyle = '#ff8800'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(14,28); ctx.quadraticCurveTo(24,4,30,6);
      ctx.strokeStyle='rgba(255,150,30,0.8)'; ctx.lineWidth=2; ctx.stroke();
    },

    // Mercury
    cal_basin(ctx) {
      ctx.fillStyle='#444'; ctx.fillRect(0,0,w,w);
      for (let i=0;i<15;i++) crater(4+Math.random()*40,4+Math.random()*40,2+Math.random()*3,'rgba(30,25,20,0.7)');
      ctx.beginPath(); ctx.arc(20,28,12,0,Math.PI*2);
      ctx.strokeStyle='rgba(60,50,40,0.8)'; ctx.lineWidth=0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(20,28,10,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(40,35,25,0.5)'; ctx.fill();
    },
    scarp(ctx) {
      ctx.fillStyle='#555'; ctx.fillRect(0,0,w,w);
      crater(10,20,4,'rgba(40,35,25,0.6)'); crater(30,15,3,'rgba(40,35,25,0.5)');
      ctx.beginPath(); ctx.moveTo(2,32); ctx.lineTo(46,28);
      ctx.strokeStyle='rgba(80,70,55,0.9)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='rgba(90,80,65,0.4)'; ctx.fillRect(0,22,48,10);
    },

    // Venus
    volc(ctx) {
      const g = ctx.createLinearGradient(0,0,0,w);
      g.addColorStop(0,'#221100'); g.addColorStop(0.3,'#cc8811'); g.addColorStop(0.6,'#ddbb44'); g.addColorStop(1,'#221100');
      ctx.fillStyle = g; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.moveTo(24,8); ctx.lineTo(38,38); ctx.lineTo(10,38); ctx.closePath();
      ctx.fillStyle='#664400'; ctx.fill();
      ctx.fillStyle='rgba(255,150,30,0.4)'; ctx.beginPath(); ctx.arc(24,38,4,0,Math.PI*2); ctx.fill();
    },
    greenhouse(ctx) {
      ctx.fillStyle='#331100'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,32,14,Math.PI,0); ctx.fillStyle='#994400'; ctx.fill();
      ctx.fillStyle='rgba(255,200,50,0.15)'; ctx.fillRect(0,18,w,30);
      ['↑','↑','↑'].forEach((a,i)=>{ctx.fillStyle='rgba(255,180,50,0.5)';ctx.font='12px monospace';ctx.fillText(a,10+i*15,30-Math.random()*16);});
    },

    // Earth
    continents(ctx) {
      ctx.fillStyle='#114477'; ctx.fillRect(0,0,w,w);
      ctx.fillStyle='#2d7a2d'; ctx.beginPath(); ctx.ellipse(16,22,12,14,0.4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#3a8a3a'; ctx.beginPath(); ctx.ellipse(32,18,8,10,-0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.ellipse(30,26,5,7,0,0,Math.PI*2); ctx.fill();
    },
    atmosphere(ctx) {
      ctx.fillStyle='#001122'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,16,0,Math.PI*2); ctx.fillStyle='#2266aa'; ctx.fill();
      ctx.beginPath(); ctx.arc(24,24,17,0,Math.PI*2); ctx.strokeStyle='rgba(120,180,255,0.5)'; ctx.lineWidth=2; ctx.stroke();
      ctx.beginPath(); ctx.arc(24,24,18.5,0,Math.PI*2); ctx.strokeStyle='rgba(120,180,255,0.2)'; ctx.lineWidth=1.5; ctx.stroke();
    },
    moon(ctx) {
      ctx.fillStyle='#111'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,18,0,Math.PI*2); ctx.fillStyle='#999'; ctx.fill();
      crater(14,16,5,'rgba(70,65,55,0.7)'); crater(30,28,4,'rgba(70,65,55,0.6)');
      crater(22,34,3,'rgba(70,65,55,0.5)'); crater(8,30,2,'rgba(60,55,45,0.5)');
    },

    // Mars
    olympus(ctx) {
      ctx.fillStyle='#110500'; ctx.fillRect(0,0,w,w);
      ctx.fillStyle='#cc5522'; ctx.fillRect(0,28,w,20);
      ctx.beginPath(); ctx.moveTo(24,28); ctx.lineTo(42,16); ctx.lineTo(6,16); ctx.closePath();
      ctx.fillStyle='#aa4422'; ctx.fill();
      spot(24,16,6,2,'#ff6633',0.5);
    },
    valles(ctx) {
      ctx.fillStyle='#cc4422'; ctx.fillRect(0,0,w,w);
      ctx.strokeStyle='rgba(80,20,5,0.8)'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(2,24); ctx.bezierCurveTo(16,22,32,26,46,24); ctx.stroke();
      ctx.strokeStyle='rgba(40,10,0,0.6)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(2,24); ctx.bezierCurveTo(16,21,32,27,46,24); ctx.stroke();
    },
    polar_ice(ctx) {
      ctx.fillStyle='#cc4422'; ctx.fillRect(0,0,w,w);
      ctx.fillStyle='rgba(220,220,210,0.7)'; ctx.fillRect(0,0,w,12);
      ctx.fillStyle='rgba(240,240,230,0.9)'; ctx.beginPath(); ctx.ellipse(24,10,20,8,0,0,Math.PI*2); ctx.fill();
    },

    // Jupiter
    great_red(ctx) {
      ctx.fillStyle='#553300'; ctx.fillRect(0,0,w,w);
      for (let i=0;i<8;i++) { ctx.fillStyle=`rgba(${160+i*5},${80+i*8},${30+i*3},0.4)`; ctx.fillRect(0,4+i*5,w,4); }
      spot(32,26,12,7,'rgba(180,60,30,0.85)',1);
    },
    bands(ctx) {
      ctx.fillStyle='#332200'; ctx.fillRect(0,0,w,w);
      ['#997744','#cc9966','#885533','#ddaa77','#774422','#ccaa88'].forEach((c,i)=>{
        ctx.fillStyle=c; ctx.fillRect(0,i*8,w,7);
      });
    },
    galilean(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,20,0,Math.PI*2); ctx.fillStyle='#cc9944'; ctx.fill();
      [[14,10,3,'#aaa'],[30,8,2.5,'#ccd'],[10,34,3.5,'#eed'],[34,34,2,'#aaa']].forEach(([x,y,r,col])=>{
        ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
      });
    },

    // Saturn
    rings_detail(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,28,12,0,Math.PI*2); ctx.fillStyle='#ddaa77'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(24,28,20,22,0,0,Math.PI*2); ctx.strokeStyle='#ccbb88'; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(24,28,17,19,0,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.ellipse(24,28,14,16,0,0,Math.PI*2); ctx.lineWidth=1.5; ctx.stroke();
    },
    hexagon(ctx) {
      ctx.fillStyle='#110800'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); for (let i=0;i<6;i++){const a=i*Math.PI/3; ctx.lineTo(24+Math.cos(a)*14,24+Math.sin(a)*14);} ctx.closePath();
      ctx.strokeStyle='rgba(200,180,140,0.7)'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='rgba(200,180,140,0.1)'; ctx.fill();
    },
    titan(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,16,0,Math.PI*2); ctx.fillStyle='#ddaa66'; ctx.fill();
      ctx.fillStyle='rgba(255,200,100,0.2)'; ctx.fillRect(0,0,w,w);
    },

    // Uranus
    extreme_tilt(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.save(); ctx.translate(24,24); ctx.rotate(Math.PI*0.42);
      ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fillStyle='#88ddee'; ctx.fill();
      ctx.strokeStyle='rgba(200,240,255,0.4)'; ctx.lineWidth=0.5; ctx.beginPath(); ctx.arc(0,0,17,0,Math.PI*2); ctx.stroke();
      ctx.restore();
      // axis line
      ctx.beginPath(); ctx.moveTo(8,30); ctx.lineTo(40,14); ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.setLineDash([2,4]); ctx.stroke(); ctx.setLineDash([]);
    },

    // Neptune
    dark_spot(ctx) {
      ctx.fillStyle='#000411'; ctx.fillRect(0,0,w,w);
      const g = ctx.createRadialGradient(24,24,0,24,24,20);
      g.addColorStop(0,'#2244ff'); g.addColorStop(1,'#001166'); ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
      spot(20,22,7,4,'rgba(10,10,50,0.85)',1);
    },
    supersonic(ctx) {
      ctx.fillStyle='#001133'; ctx.fillRect(0,0,w,w);
      for (let i=0;i<12;i++) { ctx.fillStyle=`rgba(100,140,255,0.3)`; ctx.fillRect(i*4,20-i%3*3,3,1); }
      ctx.fillStyle='#88bbff'; ctx.font='9px monospace'; ctx.fillText('⟶2100km/h',4,40);
    },
    triton(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,12,0,Math.PI*2); ctx.fillStyle='#aabbcc'; ctx.fill();
      ctx.fillStyle='rgba(200,220,240,0.15)'; ctx.fillRect(0,0,w,w);
      ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([1,1]); ctx.beginPath(); ctx.arc(24,24,17,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
    },
    // Venus tessera terrain
    tessera(ctx) {
      ctx.fillStyle='#994400'; ctx.fillRect(0,0,w,w);
      for(let i=0;i<12;i++){
        ctx.beginPath(); ctx.moveTo(Math.random()*w,Math.random()*w);
        ctx.lineTo(Math.random()*w,Math.random()*w);
        ctx.strokeStyle='rgba(200,150,50,0.5)'; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.fillStyle='rgba(120,60,20,0.3)'; ctx.fillRect(5,22,38,6);
    },
    // Uranus faint rings
    rings_faint(ctx) {
      ctx.fillStyle='#000811'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,28,12,0,Math.PI*2); ctx.fillStyle='#88ddee'; ctx.fill();
      ctx.beginPath(); ctx.ellipse(24,28,16,17,0,0,Math.PI*2);
      ctx.strokeStyle='rgba(140,140,130,0.4)'; ctx.lineWidth=0.7; ctx.stroke();
    },
    // Miranda chevron terrain
    miranda(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,14,0,Math.PI*2); ctx.fillStyle='#99aabb'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(10,22); for(let i=0;i<5;i++){ctx.lineTo(14+i*5,15-i*2);ctx.lineTo(16+i*5,22+i);}
      ctx.strokeStyle='rgba(60,50,40,0.7)'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.fillStyle='rgba(40,30,20,0.4)'; ctx.beginPath(); ctx.arc(38,24,5,0,Math.PI*2); ctx.fill();
    },

    // Moon (Luna)
    maria(ctx) {
      ctx.fillStyle='#111'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,18,0,Math.PI*2); ctx.fillStyle='#aaa'; ctx.fill();
      ctx.fillStyle='rgba(60,55,50,0.6)'; ctx.beginPath(); ctx.ellipse(16,18,8,7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(55,50,45,0.5)'; ctx.beginPath(); ctx.ellipse(30,30,7,6,0.2,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(65,60,55,0.5)'; ctx.beginPath(); ctx.ellipse(28,14,5,4,0,0,Math.PI*2); ctx.fill();
    },
    highlands(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,18,0,Math.PI*2); ctx.fillStyle='#ccd'; ctx.fill();
      for (let i=0;i<40;i++) { crater(4+Math.random()*40,4+Math.random()*40,1+Math.random()*3,'rgba(180,180,190,0.5)'); }
    },
    south_pole(ctx) {
      ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
      ctx.beginPath(); ctx.arc(24,24,18,0,Math.PI*2); ctx.fillStyle='#999'; ctx.fill();
      ctx.beginPath(); ctx.arc(24,36,14,Math.PI,0);
      ctx.fillStyle='rgba(40,40,50,0.5)'; ctx.fill();
      ctx.strokeStyle='rgba(80,80,100,0.7)'; ctx.lineWidth=1; ctx.stroke();
      ctx.beginPath(); ctx.arc(24,36,10,Math.PI,0); ctx.stroke();
      ctx.beginPath(); ctx.arc(24,36,6,Math.PI,0); ctx.strokeStyle='rgba(60,60,80,0.5)'; ctx.stroke();
    },
  };

  if (illos[featureKey]) illos[featureKey](ctx);
  return c;
}

// ── Planet feature data ──────────────────────────────────────────────────────
const FEATURE_DATA = {
  sun: [
    { key:'sunspot',     title:'太阳黑子 Sunspots',    desc:'光球表面低温区，温度约3,800°C。由强磁场抑制对流形成。黑子数量遵循约11年的活动周期（太阳周），峰值时可达200个以上。单个黑子寿命从数天至数月不等。' },
    { key:'granules',    title:'米粒组织 Granulation',  desc:'光球层的蜂窝状对流胞结构，典型直径约1,000km，寿命仅8-15分钟。热气体从中心上升、冷却后沿边缘下沉，形成明亮的颗粒状纹理，是太阳能量输运的主要方式。' },
    { key:'corona',      title:'日冕 Corona',           desc:'太阳最外层大气，延伸数百万公里。温度高达100万°C以上（远超光球的5,500°C），加热机制至今尚未完全解明。日全食时肉眼可见白色光晕，由稀薄等离子体发出。' },
    { key:'prom',        title:'日珥 Prominences',       desc:'从太阳表面喷射至日冕的巨大等离子体弧，高度可达数十万公里。由磁力线支撑悬浮数周，最终或回落到太阳表面，或爆发抛射成为日冕物质抛射（CME）。' },
  ],
  mercury: [
    { key:'cal_basin',   title:'卡洛里斯盆地 Caloris',   desc:'太阳系最大撞击盆地之一，直径约1,550km。形成于约39亿年前的晚期重轰炸期。盆地周边有高达2km的环形山脉，对跖点存在因地震波汇聚形成的"怪异地形"。' },
    { key:'crater_mer',  title:'陨击地貌 Cratering',     desc:'水星表面类似月球，布满大大小小的撞击坑。由于引力较强（3.7m/s²），弹射物散落范围比月球小。陨击坑壁和辐射纹保存完好，表明近期无明显侵蚀。' },
    { key:'scarp',       title:'叶片状悬崖 Scarps',      desc:'水星表面独特的巨大悬崖，高度可达1km、长数百公里。由核心冷却收缩导致地壳压缩形成，证明水星半径已缩小约7km。是水星最具辨识性的构造特征之一。' },
  ],
  venus: [
    { key:'volc',        title:'盾形火山 Shield Volcanoes', desc:'金星表面遍布大型盾形火山，马亚特火山高达8km，可能仍在活动。盾形火山由低黏度熔岩层层堆叠形成，坡度平缓。金星大气SO₂浓度波动也暗示近期火山活动。' },
    { key:'greenhouse',  title:'失控温室效应',              desc:'金星大气CO₂占比96.5%，地表气压达地球92倍。太阳辐射穿透大气加热地表，地表向外辐射的红外线却无法逃逸——温室效应失控使表面温度高达465°C，足以融化铅。' },
    { key:'tessera',     title:'镶嵌地形 Tesserae',        desc:'金星表面最古老的地貌单元，由复杂交错的脊谷和断裂组成，约占表面8%。被认为是经历多期构造变形的古老地壳残片，形成于约7亿年前金星全球表面重塑之前。' },
  ],
  earth: [
    { key:'continents',  title:'大陆与海洋',               desc:'地球71%表面被液态水覆盖，是太阳系已知唯一拥有稳定液态水海洋的天体。七大洲由板块构造持续重塑，至今已历经多次超大陆（如盘古大陆）的形成与裂解。' },
    { key:'atmosphere',  title:'大气层结构',               desc:'由对流层（0-12km）、平流层（含臭氧层）、中间层、热层和外逸层组成。氮氧混合气提供呼吸和温室保温。臭氧层吸收大部分有害紫外线，是地表生命的关键屏障。' },
    { key:'moon',        title:'月球 Moon',               desc:'地球唯一的天然卫星，直径3,474km，距地球38.4万km。表面布满陨击坑和月海（远古熔岩平原）。潮汐锁定使月球始终以同一面朝向地球。月球引力是地球海洋潮汐的主要驱动力。' },
  ],
  mars: [
    { key:'olympus',     title:'奥林匹斯山 Olympus Mons',  desc:'太阳系最高火山，峰顶高于基准面21,229m，约为珠穆朗玛峰的2.4倍。底部直径约600km，面积相当于法国。为盾形火山，因火星无板块运动，同一火山可长期堆积，寿命逾数十亿年。' },
    { key:'valles',      title:'水手号峡谷 Valles Marineris', desc:'太阳系最大峡谷系统，长约4,000km（相当于北京到拉萨的往返），宽达200km，最深7km。由地壳拉伸和塌陷形成，非流水侵蚀。峡谷壁暴露数层古老岩层，记录火星地质史。' },
    { key:'polar_ice',   title:'极地冰盖 Polar Caps',      desc:'南北极均有冰盖，由水冰和干冰（固态CO₂）组成。夏季部分干冰升华，冰盖缩小；冬季CO₂重新凝结，覆盖更广。北极冠全年存在的水冰厚度可达3km，是未来载人探索的重要水资源。' },
  ],
  jupiter: [
    { key:'great_red',   title:'大红斑 Great Red Spot',    desc:'已持续至少358年的巨大反气旋风暴，宽度现约为1.3倍地球直径（持续缩小中，19世纪时曾达3倍地球直径）。风速可达432km/h。其砖红色成因尚未完全确定，可能与高层大气中的复杂有机分子有关。' },
    { key:'bands',       title:'云带结构 Belt-Zone',       desc:'木星大气由明暗交替的云带组成，明亮带为上升气流（zone）、暗带为下沉气流（belt）。不同纬度以相反方向高速流动，风速差异在交界处产生强烈湍流和涡旋，形成丰富的云层纹理。' },
    { key:'galilean',    title:'伽利略卫星 Galilean Moons', desc:'木星四大卫星——伊奥（剧烈火山活动）、欧罗巴（冰下海洋，可能存在生命）、加尼米德（太阳系最大卫星）、卡利斯托（古老陨击表面）。由伽利略于1610年发现，证明并非一切天体均绕地球运转。' },
  ],
  saturn: [
    { key:'rings_detail',title:'光环结构 Ring System',      desc:'土星光环由数十亿颗水冰颗粒和少量岩屑组成，宽约28万km，厚度不足1km。由A至G共7个主环，环间有多个间隙（如卡西尼缝宽4,700km）。环粒直径从微米到房屋大小不等，轨道速度达17-75km/s。' },
    { key:'hexagon',     title:'北极六边形风暴 Hexagon',    desc:'土星北极特有的六边形气旋，每边长约13,800km，直径大于地球。围绕北极以与土星内部自转相同周期旋转。成因可能与深层大气中的罗斯比波和角速度差异有关，实验室流体实验已成功复现类似结构。' },
    { key:'titan',       title:'土卫六泰坦 Titan',          desc:'太阳系唯一拥有稠密大气（1.45倍地球气压）的卫星。表面有液态甲烷/乙烷湖泊和河流，构成类地水文循环（以甲烷替代水）。卡西尼-惠更斯探测器揭示其地形包括沙丘、山脉和极地海洋，是寻找地外生命的重点目标。' },
  ],
  uranus: [
    { key:'extreme_tilt',title:'极端自转轴倾斜 Axial Tilt', desc:'天王星自转轴相对公转平面倾斜达97.8°，几乎"侧躺"运行。极区会经历连续42年白昼、再42年黑夜。可能由早期一次巨大撞击所致，也导致其磁轴相对自转轴极度偏斜59°。' },
    { key:'rings_faint', title:'暗淡光环 Faint Rings',      desc:'天王星拥有13条暗淡光环，主要由暗色物质组成，反射率极低（约2%）。最早于1977年通过掩星偶然发现。光环极窄（<10km）、间隔大，与土星宽阔明亮的光环形成鲜明对比。' },
    { key:'miranda',     title:'天卫五 Miranda',             desc:'天王星最内侧的大卫星，直径仅472km，但拥有太阳系最奇特的地形——表面有深达20km的峡谷、高耸的悬崖和交错的地质断层（人字形山脊）。可能经历了多次碎裂-重组的灾难性撞击事件。' },
  ],
  neptune: [
    { key:'dark_spot',   title:'大暗斑 Great Dark Spot',    desc:'海王星南半球的巨大反气旋风暴，大小与地球相当。1989年旅行者2号首次观测到，1994年哈勃望远镜发现已消失，但北半球出现新暗斑。暗斑生命周期比木星大红斑短得多，仅数年。' },
    { key:'supersonic',  title:'超音速风暴 Supersonic Winds', desc:'海王星拥有太阳系最高风速，可达2,100km/h（约580m/s，远超地球音速340m/s）。大风速与行星内部热流和环境低温（-218°C）有关，低温降低大气黏性，使气体高速流动成为可能。' },
    { key:'triton',      title:'海卫一特里同 Triton',        desc:'太阳系最大的逆行卫星，绕海王星逆向运行，表明它很可能是被捕获的柯伊伯带天体。表面温度仅-235°C。有活跃的冰火山喷发氮气间歇泉，高度可达8km。表面地质年轻，陨击坑稀少。' },
  ],
  moon: [
    { key:'maria',       title:'月海 Lunar Maria',          desc:'月球正面暗色区域，约占可见面积31%。由约30-39亿年前的玄武岩熔岩流填充巨大撞击盆地形成。雨海直径1,123km，静海直径873km。月海陨击坑密度远低于月陆，表明其表面相对年轻。' },
    { key:'highlands',   title:'月陆 Highlands',            desc:'亮色斜长岩高地，覆盖月球大部分表面，是月球最古老的地壳（>44亿年）。由月球早期岩浆洋结晶形成，轻质斜长石上浮堆积。月陆陨击坑极其密集，记录着太阳系早期剧烈撞击史。' },
    { key:'south_pole',  title:'南极-艾特肯盆地 SPA Basin',  desc:'太阳系最大确认撞击盆地，直径约2,500km，深达13km。位于月球背面南极附近，形成于约42亿年前。盆地底部暴露下月壳甚至上月幔物质，是研究月球内部结构的重要窗口。中国嫦娥四号在此区域实现人类首次月球背面着陆。' },
  ],
};
FEATURE_DATA.mercury = [
  { key:'cal_basin', title:'卡洛里斯盆地 Caloris', desc:'太阳系最大撞击盆地之一，直径约1,550km。形成于约39亿年前的晚期重轰炸期。盆地周边有高达2km的环形山脉，对跖点存在因地震波汇聚形成的怪异地形。' },
  { key:'scarp',     title:'陨击密度 Crater Density', desc:'水星表面陨击坑密度与月球高地相当，年轻撞击坑周围有明亮的辐射纹。陨击密度高表明表面极为古老（>40亿年），无板块构造和大气侵蚀来抹除陨击记录。' },
  { key:'scarp',     title:'叶片状悬崖 Scarps', desc:'水星表面独特的巨大悬崖，高度可达1km、长数百公里。由核心冷却收缩导致地壳压缩形成，证明水星半径已缩小约7km。是水星最具辨识性的构造特征之一。' },
];
FEATURE_DATA.venus[2] = { key:'tessera', title:'镶嵌地形 Tesserae', desc:'金星表面最古老的地貌单元，由复杂交错的脊谷和断裂组成，约占表面8%。被认为是经历多期构造变形的古老地壳残片，形成于约7亿年前金星全球表面重塑之前。' };


// Left panel reference
const featurePanel = document.getElementById('feature-panel');
const fpBody = document.getElementById('fp-body');

function openFeaturePanel(p) {
  const en = (p.en || '').toLowerCase();
  const key = (p === SUN_DATA) ? 'sun' : en;
  const features = FEATURE_DATA[key] || [];
  if (!features.length) { featurePanel.classList.remove('open'); return; }

  fpBody.innerHTML = features.map(f => `
    <div class="fp-feature">
      <div class="fp-feature-header">
        <canvas class="fp-feature-canvas" width="48" height="48"></canvas>
        <div class="fp-feature-title">${f.title}</div>
      </div>
      <div class="fp-feature-desc">${f.desc}</div>
    </div>
  `).join('');

  // Draw illustrations onto each canvas
  const canvases = fpBody.querySelectorAll('.fp-feature-canvas');
  canvases.forEach((canvas, i) => {
    const illo = drawFeatureIllo(features[i].key);
    const ctx2 = canvas.getContext('2d');
    ctx2.drawImage(illo, 0, 0);
  });

  featurePanel.classList.add('open');
}

function closeFeaturePanel() {
  featurePanel.classList.remove('open');
}


const _worldPos = new THREE.Vector3();
function zoomToPlanet(p) {
  if (zoomedPlanet === p) return;
  // Clean up previous
  surfaceAnimLayers.forEach(l => l.mesh.parent && l.mesh.parent.remove(l.mesh));
  surfaceAnimLayers.length = 0;

  zoomedPlanet = p;
  p.mesh.getWorldPosition(_worldPos);
  targetCamPos.copy(_worldPos);
  targetDist = (p.r || 6) * ZOOM_DIST_FACTOR;

  const en  = (p.en || '').toLowerCase();
  const r   = p.r || 1;
  const key = en; // matches REAL_TEX keys

  // Save original Phong material for zoomOut
  prevPhongMat = p.mesh.material;

  // Choose real texture if available, otherwise keep procedural
  const realTex  = REAL_TEX[key];
  const finalTex = realTex || prevPhongMat.map;
  const mat = new THREE.MeshBasicMaterial({ map: finalTex, fog: false });
  if (mat.map) mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  p.mesh.material = mat;

  // ── Per-planet overlay layers ────────────────────────────────────────
  if (en === 'sun' || p === SUN_DATA) {
    mat.color = new THREE.Color(1, 0.92, 0.55);
    for (let fi = 0; fi < 8; fi++) {
      const fGeo = new THREE.RingGeometry(r * (1.06 + fi * 0.12), r * (1.12 + fi * 0.12), 32, 1, Math.random() * Math.PI, Math.PI * 0.35);
      const fCol = new THREE.Color().setHSL(0.1 + Math.random() * 0.07, 1, 0.55 + Math.random() * 0.4);
      const fMat = new THREE.MeshBasicMaterial({ color: fCol, transparent: true, opacity: 0.36 - fi * 0.035, side: THREE.DoubleSide, fog: false, depthWrite: false });
      const flare = new THREE.Mesh(fGeo, fMat);
      flare.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI * 2, 0);
      p.mesh.add(flare);
      surfaceAnimLayers.push({ mesh: flare, type: 'flare', speed: 0.001 + Math.random() * 0.005, planetKey: en });
    }
  }
  else if (en === 'mercury') { /* real texture already shows craters */ }
  else if (en === 'venus') {
    const haze = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0xddaa55, transparent: true, opacity: 0.28, fog: false, depthWrite: false }));
    p.mesh.add(haze); surfaceAnimLayers.push({ mesh: haze, type: 'rotate', speed: -0.0003, planetKey: en });
  }
  else if (en === 'earth') {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 48, 48),
      new THREE.MeshBasicMaterial({ map: dynamicCloudTex, transparent: true, opacity: 0.45, fog: false, depthWrite: false }));
    p.mesh.add(cloud); surfaceAnimLayers.push({ mesh: cloud, type: 'rotate', speed: 0.0008, planetKey: en });
  }
  else if (en === 'mars') {
    const dust = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 36, 36),
      new THREE.MeshBasicMaterial({ color: 0xcc8855, transparent: true, opacity: 0.18, fog: false, depthWrite: false }));
    p.mesh.add(dust); surfaceAnimLayers.push({ mesh: dust, type: 'rotate', speed: 0.0008, planetKey: en });
    const ice = new THREE.Mesh(new THREE.SphereGeometry(r * 0.18, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.45),
      new THREE.MeshBasicMaterial({ color: 0xeeeedd, transparent: true, opacity: 0.55, fog: false, depthWrite: false }));
    ice.position.y = r * 1.01; p.mesh.add(ice);
    surfaceAnimLayers.push({ mesh: ice, type: 'none', speed: 0, planetKey: en });
  }
  else if (en === 'jupiter') {
    const spot = new THREE.Mesh(new THREE.PlaneGeometry(r * 0.55, r * 0.35),
      new THREE.MeshBasicMaterial({ color: 0xcc4422, transparent: true, opacity: 0.62, fog: false, depthWrite: false, side: THREE.DoubleSide }));
    spot.rotation.x = Math.PI * 0.55; spot.position.set(r * 0.35, r * 0.05, r * 0.85);
    p.mesh.add(spot); surfaceAnimLayers.push({ mesh: spot, type: 'pulse', speed: 0.05, planetKey: en });
  }
  else if (en === 'saturn') {
    const haze = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xeeddcc, transparent: true, opacity: 0.15, fog: false, depthWrite: false }));
    p.mesh.add(haze); surfaceAnimLayers.push({ mesh: haze, type: 'rotate', speed: 0.0004, planetKey: en });
  }
  else if (en === 'uranus') {
    const haze = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x88e8ee, transparent: true, opacity: 0.16, fog: false, depthWrite: false }));
    p.mesh.add(haze); surfaceAnimLayers.push({ mesh: haze, type: 'rotate', speed: -0.00035, planetKey: en });
  }
  else if (en === 'neptune') {
    const storm = new THREE.Mesh(new THREE.SphereGeometry(r * 1.025, 36, 36),
      new THREE.MeshBasicMaterial({ color: 0x8899cc, transparent: true, opacity: 0.2, fog: false, depthWrite: false }));
    p.mesh.add(storm); surfaceAnimLayers.push({ mesh: storm, type: 'rotate', speed: 0.0006, planetKey: en });
  }
  else if (en === 'moon') {
    const dust = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
    p.mesh.add(dust); surfaceAnimLayers.push({ mesh: dust, type: 'none', speed: 0, planetKey: en });
  }

  // Open panels
  openFeaturePanel(p);
  openPanelForZoom(p);
}

function zoomOut() {
  if (!zoomedPlanet) return;
  const p = zoomedPlanet;

  closeFeaturePanel();

  surfaceAnimLayers.forEach(l => l.mesh.parent && l.mesh.parent.remove(l.mesh));
  surfaceAnimLayers.length = 0;

  if (prevPhongMat) {
    p.mesh.material.dispose();
    p.mesh.material = prevPhongMat;
    prevPhongMat = null;
  }

  zoomedPlanet = null;
  targetDist = 73;
  targetCamPos.set(0, 0, 0);
}

// ── Zoom-mode panel with Earth ↔ Moon subtitle toggle ────────────────────────
function openPanelForZoom(p) {
  const moon = (typeof moonEntries !== 'undefined') ? moonEntries.find(m => m.parentPlanet === p || m.parentPlanetName === (p.en || '')) : null;
  const actualParent = (typeof planetMeshes !== 'undefined' && p.parentPlanetName) ? planetMeshes.find(pp => pp.en === p.parentPlanetName) : null;

  let subtitleHTML = '';
  if (moon) {
    subtitleHTML = `<span class="p-subtitle-link" data-zoom-target="moon">月球 MOON</span>`;
  } else if (actualParent) {
    subtitleHTML = `<span class="p-subtitle-link" data-zoom-target="planet">${actualParent.name} ${actualParent.en.toUpperCase()}</span>`;
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
      if (moon) switchZoomTarget(moon);
      else if (actualParent) switchZoomTarget(actualParent);
    });
  }

  panel.classList.add('open');
}

// Switch the zoomed planet (e.g. Earth → Moon) without full zoomOut/zoomIn
function switchZoomTarget(target) {
  if (!zoomedPlanet) return;
  // Clean up current surface layers
  surfaceAnimLayers.forEach(l => l.mesh.parent && l.mesh.parent.remove(l.mesh));
  surfaceAnimLayers.length = 0;
  // Restore current planet's material
  if (prevPhongMat) {
    zoomedPlanet.mesh.material.dispose();
    zoomedPlanet.mesh.material = prevPhongMat;
    prevPhongMat = null;
  }
  // Apply zoom to new target
  zoomedPlanet = target;
  target.mesh.getWorldPosition(_worldPos);
  targetCamPos.copy(_worldPos);
  targetDist = (target.r || 6) * ZOOM_DIST_FACTOR;

  const en = (target.en || '').toLowerCase();
  const r = target.r || 1;
  const key = en;

  prevPhongMat = target.mesh.material;
  const realTex = REAL_TEX[key];
  const finalTex = realTex || prevPhongMat.map;
  const mat = new THREE.MeshBasicMaterial({ map: finalTex, fog: false });
  if (mat.map) mat.map.wrapS = mat.map.wrapT = THREE.RepeatWrapping;
  target.mesh.material = mat;

  // Surface layers for new target
  if (en === 'earth') {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(r * 1.03, 48, 48),
      new THREE.MeshBasicMaterial({ map: dynamicCloudTex, transparent: true, opacity: 0.45, fog: false, depthWrite: false }));
    target.mesh.add(cloud); surfaceAnimLayers.push({ mesh: cloud, type: 'rotate', speed: 0.0008, planetKey: en });
  } else if (en === 'moon') {
    const dust = new THREE.Mesh(new THREE.SphereGeometry(r * 1.02, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x999999, transparent: true, opacity: 0.12, fog: false, depthWrite: false }));
    target.mesh.add(dust); surfaceAnimLayers.push({ mesh: dust, type: 'none', speed: 0, planetKey: en });
  }

  openFeaturePanel(target);
  openPanelForZoom(target);
}
