// ── Jupiter ───────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['jupiter'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jupiter%2C_image_taken_by_NASA%27s_Hubble_Space_Telescope%2C_June_2019_-_Edited.jpg/1280px-Jupiter%2C_image_taken_by_NASA%27s_Hubble_Space_Telescope%2C_June_2019_-_Edited.jpg',
  features: [
    { key:'great_red', title:'大红斑 Great Red Spot',       desc:'已持续至少358年的巨大反气旋风暴，宽度现约为1.3倍地球直径（持续缩小中，19世纪时曾达3倍地球直径）。风速可达432km/h。其砖红色成因尚未完全确定，可能与高层大气中的复杂有机分子有关。' },
    { key:'bands',     title:'云带结构 Belt-Zone',           desc:'木星大气由明暗交替的云带组成，明亮带为上升气流（zone）、暗带为下沉气流（belt）。不同纬度以相反方向高速流动，风速差异在交界处产生强烈湍流和涡旋，形成丰富的云层纹理。' },
    { key:'galilean',  title:'伽利略卫星 Galilean Moons',   desc:'木星四大卫星——伊奥（剧烈火山活动）、欧罗巴（冰下海洋，可能存在生命）、加尼米德（太阳系最大卫星）、卡利斯托（古老陨击表面）。由伽利略于1610年发现，证明并非一切天体均绕地球运转。' },
  ],
  drawIllo(key, ctx, w) {
    function spot(cx, cy, rx, ry, col, alpha) {
      ctx.beginPath(); ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
      ctx.fillStyle=col; ctx.globalAlpha=alpha||1; ctx.fill(); ctx.globalAlpha=1;
    }
    ({
      great_red() {
        ctx.fillStyle='#553300'; ctx.fillRect(0,0,w,w);
        for(let i=0;i<8;i++){ctx.fillStyle=`rgba(${160+i*5},${80+i*8},${30+i*3},0.4)`;ctx.fillRect(0,4+i*5,w,4);}
        spot(32,26,12,7,'rgba(180,60,30,0.85)',1);
      },
      bands() {
        ctx.fillStyle='#332200'; ctx.fillRect(0,0,w,w);
        ['#997744','#cc9966','#885533','#ddaa77','#774422','#ccaa88'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(0,i*8,w,7);});
      },
      galilean() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,20,0,Math.PI*2); ctx.fillStyle='#cc9944'; ctx.fill();
        [[14,10,3,'#aaa'],[30,8,2.5,'#ccd'],[10,34,3.5,'#eed'],[34,34,2,'#aaa']].forEach(([x,y,r,col])=>{
          ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=col; ctx.fill();
        });
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const spot = new THREE.Mesh(
      new THREE.PlaneGeometry(r*0.55,r*0.35),
      new THREE.MeshBasicMaterial({color:0xcc4422,transparent:true,opacity:0.62,fog:false,depthWrite:false,side:THREE.DoubleSide}));
    spot.rotation.x=Math.PI*0.55; spot.position.set(r*0.35,r*0.05,r*0.85);
    mesh.add(spot); layers.push({mesh:spot,type:'pulse',speed:0.05});
  },
};
