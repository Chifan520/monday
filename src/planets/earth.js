// ── Earth ─────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['earth'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png',
  features: [
    { key:'continents', title:'大陆与海洋',     desc:'地球71%表面被液态水覆盖，是太阳系已知唯一拥有稳定液态水海洋的天体。七大洲由板块构造持续重塑，至今已历经多次超大陆（如盘古大陆）的形成与裂解。' },
    { key:'atmosphere', title:'大气层结构',     desc:'由对流层（0-12km）、平流层（含臭氧层）、中间层、热层和外逸层组成。氮氧混合气提供呼吸和温室保温。臭氧层吸收大部分有害紫外线，是地表生命的关键屏障。' },
    { key:'moon',       title:'月球 Moon',      desc:'地球唯一的天然卫星，直径3,474km，距地球38.4万km。表面布满陨击坑和月海（远古熔岩平原）。潮汐锁定使月球始终以同一面朝向地球。月球引力是地球海洋潮汐的主要驱动力。' },
  ],
  drawIllo(key, ctx, w) {
    function crater(cx, cy, r, col) {
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
      ctx.beginPath(); ctx.arc(cx-1,cy-1,r*0.4,0,Math.PI);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=0.5; ctx.stroke();
    }
    ({
      continents() {
        ctx.fillStyle='#114477'; ctx.fillRect(0,0,w,w);
        ctx.fillStyle='#2d7a2d'; ctx.beginPath(); ctx.ellipse(16,22,12,14,0.4,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3a8a3a'; ctx.beginPath(); ctx.ellipse(32,18,8,10,-0.2,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#c8a050'; ctx.beginPath(); ctx.ellipse(30,26,5,7,0,0,Math.PI*2); ctx.fill();
      },
      atmosphere() {
        ctx.fillStyle='#001122'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,16,0,Math.PI*2); ctx.fillStyle='#2266aa'; ctx.fill();
        ctx.beginPath(); ctx.arc(w/2,w/2,17,0,Math.PI*2); ctx.strokeStyle='rgba(120,180,255,0.5)'; ctx.lineWidth=2; ctx.stroke();
        ctx.beginPath(); ctx.arc(w/2,w/2,18.5,0,Math.PI*2); ctx.strokeStyle='rgba(120,180,255,0.2)'; ctx.lineWidth=1.5; ctx.stroke();
      },
      moon() {
        ctx.fillStyle='#111'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,18,0,Math.PI*2); ctx.fillStyle='#999'; ctx.fill();
        crater(14,16,5,'rgba(70,65,55,0.7)'); crater(30,28,4,'rgba(70,65,55,0.6)');
        crater(22,34,3,'rgba(70,65,55,0.5)'); crater(8,30,2,'rgba(60,55,45,0.5)');
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    // dynamicCloudTex is defined in zoom.js (global scope)
    const cloud = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.03,48,48),
      new THREE.MeshBasicMaterial({map:dynamicCloudTex,transparent:true,opacity:0.45,fog:false,depthWrite:false}));
    mesh.add(cloud); layers.push({mesh:cloud,type:'rotate',speed:0.0008});
  },
};
