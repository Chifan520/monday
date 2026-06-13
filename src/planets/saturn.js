// ── Saturn ────────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['saturn'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Saturn_during_Equinox.jpg/1280px-Saturn_during_Equinox.jpg',
  features: [
    { key:'rings_detail', title:'光环结构 Ring System',     desc:'土星光环由数十亿颗水冰颗粒和少量岩屑组成，宽约28万km，厚度不足1km。由A至G共7个主环，环间有多个间隙（如卡西尼缝宽4,700km）。环粒直径从微米到房屋大小不等，轨道速度达17-75km/s。' },
    { key:'hexagon',      title:'北极六边形风暴 Hexagon',  desc:'土星北极特有的六边形气旋，每边长约13,800km，直径大于地球。围绕北极以与土星内部自转相同周期旋转。成因可能与深层大气中的罗斯比波和角速度差异有关，实验室流体实验已成功复现类似结构。' },
    { key:'titan',        title:'土卫六泰坦 Titan',         desc:'太阳系唯一拥有稠密大气（1.45倍地球气压）的卫星。表面有液态甲烷/乙烷湖泊和河流，构成类地水文循环（以甲烷替代水）。卡西尼-惠更斯探测器揭示其地形包括沙丘、山脉和极地海洋，是寻找地外生命的重点目标。' },
  ],
  drawIllo(key, ctx, w) {
    ({
      rings_detail() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,28,12,0,Math.PI*2); ctx.fillStyle='#ddaa77'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(w/2,28,20,22,0,0,Math.PI*2); ctx.strokeStyle='#ccbb88'; ctx.lineWidth=1; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w/2,28,17,19,0,0,Math.PI*2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w/2,28,14,16,0,0,Math.PI*2); ctx.lineWidth=1.5; ctx.stroke();
      },
      hexagon() {
        ctx.fillStyle='#110800'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); for(let i=0;i<6;i++){const a=i*Math.PI/3;ctx.lineTo(w/2+Math.cos(a)*14,w/2+Math.sin(a)*14);} ctx.closePath();
        ctx.strokeStyle='rgba(200,180,140,0.7)'; ctx.lineWidth=1.2; ctx.stroke();
        ctx.fillStyle='rgba(200,180,140,0.1)'; ctx.fill();
      },
      titan() {
        ctx.fillStyle='#000'; ctx.fillRect(0,0,w,w);
        ctx.beginPath(); ctx.arc(w/2,w/2,16,0,Math.PI*2); ctx.fillStyle='#ddaa66'; ctx.fill();
        ctx.fillStyle='rgba(255,200,100,0.2)'; ctx.fillRect(0,0,w,w);
      },
    }[key] || function(){})();
  },
  buildLayers(mesh, r, layers) {
    const haze = new THREE.Mesh(
      new THREE.SphereGeometry(r*1.02,32,32),
      new THREE.MeshBasicMaterial({color:0xeeddcc,transparent:true,opacity:0.15,fog:false,depthWrite:false}));
    mesh.add(haze); layers.push({mesh:haze,type:'rotate',speed:0.0004});
  },
};
