// ── Sun ───────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['sun'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg/1280px-The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
  features: [
    { key:'sunspot',  title:'太阳黑子 Sunspots',     desc:'光球表面低温区，温度约3,800°C。由强磁场抑制对流形成。黑子数量遵循约11年的活动周期（太阳周），峰值时可达200个以上。单个黑子寿命从数天至数月不等。' },
    { key:'granules', title:'米粒组织 Granulation',   desc:'光球层的蜂窝状对流胞结构，典型直径约1,000km，寿命仅8-15分钟。热气体从中心上升、冷却后沿边缘下沉，形成明亮的颗粒状纹理，是太阳能量输运的主要方式。' },
    { key:'corona',   title:'日冕 Corona',            desc:'太阳最外层大气，延伸数百万公里。温度高达100万°C以上（远超光球的5,500°C），加热机制至今尚未完全解明。日全食时肉眼可见白色光晕，由稀薄等离子体发出。' },
    { key:'prom',     title:'日珥 Prominences',        desc:'从太阳表面喷射至日冕的巨大等离子体弧，高度可达数十万公里。由磁力线支撑悬浮数周，最终或回落到太阳表面，或爆发抛射成为日冕物质抛射（CME）。' },
  ],
  drawIllo(key, ctx, w) {
    function spot(cx, cy, rx, ry, col, alpha) {
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI*2);
      ctx.fillStyle = col; ctx.globalAlpha = alpha || 1; ctx.fill(); ctx.globalAlpha = 1;
    }
    ({
      sunspot() {
        const g = ctx.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);
        g.addColorStop(0,'#ff9900'); g.addColorStop(0.6,'#ff4400'); g.addColorStop(1,'#220000');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        spot(18,30,10,6,'#1a0500',1); spot(28,18,6,4,'#2a0a00',0.9);
      },
      granules() {
        const g = ctx.createRadialGradient(w/2,w/2,0,w/2,w/2,w/2);
        g.addColorStop(0,'#fff8c0'); g.addColorStop(0.5,'#ffaa00'); g.addColorStop(1,'#441100');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        for(let i=0;i<50;i++){ctx.fillStyle=`rgba(255,${200+Math.random()*55},0,${0.3+Math.random()*0.3})`;ctx.fillRect(Math.random()*w,Math.random()*w,3+Math.random()*4,2+Math.random()*2);}
      },
      corona() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        const g=ctx.createRadialGradient(w/2,w/2,2,w/2,w/2,26);
        g.addColorStop(0,'#fff'); g.addColorStop(0.3,'rgba(255,200,100,0.4)'); g.addColorStop(0.6,'rgba(255,100,30,0.1)'); g.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        for(let i=0;i<8;i++){ctx.strokeStyle='rgba(255,200,100,0.3)';ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(w/2,w/2);ctx.lineTo(w/2+Math.cos(i*0.78)*22,w/2+Math.sin(i*0.78)*22);ctx.stroke();}
      },
      prom() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,28,10,Math.PI,0); ctx.fillStyle='#ff8800'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(14,28); ctx.quadraticCurveTo(24,4,30,6);
        ctx.strokeStyle='rgba(255,150,30,0.8)'; ctx.lineWidth=2; ctx.stroke();
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const mat = mesh.material;
    if (mat) mat.color = new THREE.Color(1, 0.92, 0.55);
    for(let fi=0;fi<8;fi++){
      const fGeo=new THREE.RingGeometry(r*(1.06+fi*0.12),r*(1.12+fi*0.12),32,1,Math.random()*Math.PI,Math.PI*0.35);
      const fCol=new THREE.Color().setHSL(0.1+Math.random()*0.07,1,0.55+Math.random()*0.4);
      const fMat=new THREE.MeshBasicMaterial({color:fCol,transparent:true,opacity:0.36-fi*0.035,side:THREE.DoubleSide,fog:false,depthWrite:false});
      const flare=new THREE.Mesh(fGeo,fMat);
      flare.rotation.set(Math.random()*Math.PI,Math.random()*Math.PI*2,0);
      mesh.add(flare);
      layers.push({mesh:flare,type:'flare',speed:0.001+Math.random()*0.005});
    }
  },
};
