// ── Neptune ───────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['neptune'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Neptune_Voyager2_color_calibrated.png/1024px-Neptune_Voyager2_color_calibrated.png',
  features: [
    { key:'dark_spot',  title:'大暗斑 Great Dark Spot',        desc:'海王星南半球的巨大反气旋风暴，大小与地球相当。1989年旅行者2号首次观测到，1994年哈勃望远镜发现已消失，但北半球出现新暗斑。暗斑生命周期比木星大红斑短得多，仅数年。' },
    { key:'supersonic', title:'超音速风暴 Supersonic Winds',   desc:'海王星拥有太阳系最高风速，可达2,100km/h（约580m/s，远超地球音速340m/s）。大风速与行星内部热流和环境低温（-218°C）有关，低温降低大气黏性，使气体高速流动成为可能。' },
    { key:'triton',     title:'海卫一特里同 Triton',            desc:'太阳系最大的逆行卫星，绕海王星逆向运行，表明它很可能是被捕获的柯伊伯带天体。表面温度仅-235°C。有活跃的冰火山喷发氮气间歇泉，高度可达8km。表面地质年轻，陨击坑稀少。' },
  ],
  drawIllo(key, ctx, w) {
    function spot(cx, cy, rx, ry, col, alpha) {
      ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=col; ctx.globalAlpha=alpha||1; ctx.fill(); ctx.globalAlpha=1;
    }
    ({
      dark_spot() {
        ctx.fillStyle='#000411'; ctx.fillRect(0,0,w,w);
        const g=ctx.createRadialGradient(w/2,w/2,0,w/2,w/2,20);
        g.addColorStop(0,'#2244ff'); g.addColorStop(1,'#001166'); ctx.fillStyle=g; ctx.fillRect(0,0,w,w);
        spot(20,22,7,4,'rgba(10,10,50,0.85)',1);
      },
      supersonic() {
        ctx.fillStyle='#001133'; ctx.fillRect(0,0,w,w);
        for(let i=0;i<12;i++){ctx.fillStyle='rgba(100,140,255,0.3)';ctx.fillRect(i*4,20-i%3*3,3,1);}
        ctx.fillStyle='#88bbff'; ctx.font='9px monospace'; ctx.fillText('⟶2100km/h',4,40);
      },
      triton() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,12,0,Math.PI*2); ctx.fillStyle='#aabbcc'; ctx.fill();
        ctx.fillStyle='rgba(200,220,240,0.15)'; ctx.fillRect(0,0,w,w);
        ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.setLineDash([1,1]); ctx.beginPath(); ctx.arc(w/2,w/2,17,0,Math.PI*2); ctx.stroke(); ctx.setLineDash([]);
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const storm = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.025,36,36),
      new THREE.MeshBasicMaterial({color:0x8899cc,transparent:true,opacity:0.2,fog:false,depthWrite:false}));
    mesh.add(storm); layers.push({mesh:storm,type:'rotate',speed:0.0006});
  },
};
