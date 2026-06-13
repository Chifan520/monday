// ── Mercury ──────────────────────────────────────────────────────────────────
(window.PLANET_DEFS || (window.PLANET_DEFS = {}))['mercury'] = {
  texUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Mercury_in_color_-_Prockter07_centered.jpg/1024px-Mercury_in_color_-_Prockter07_centered.jpg',
  features: [
    { key:'cal_basin', title:'卡洛里斯盆地 Caloris',    desc:'太阳系最大撞击盆地之一，直径约1,550km。形成于约39亿年前的晚期重轰炸期。盆地周边有高达2km的环形山脉，对跖点存在因地震波汇聚形成的怪异地形。' },
    { key:'scarp',     title:'陨击密度 Crater Density', desc:'水星表面陨击坑密度与月球高地相当，年轻撞击坑周围有明亮的辐射纹。陨击密度高表明表面极为古老（>40亿年），无板块构造和大气侵蚀来抹除陨击记录。' },
    { key:'scarp',     title:'叶片状悬崖 Scarps',       desc:'水星表面独特的巨大悬崖，高度可达1km、长数百公里。由核心冷却收缩导致地壳压缩形成，证明水星半径已缩小约7km。是水星最具辨识性的构造特征之一。' },
  ],
  drawIllo(key, ctx, w) {
    function crater(cx, cy, r, col) {
      ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
      ctx.fillStyle=col; ctx.fill();
      ctx.beginPath(); ctx.arc(cx-1,cy-1,r*0.4,0,Math.PI);
      ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=0.5; ctx.stroke();
    }
    ({
      cal_basin() {
        ctx.fillStyle='#444'; ctx.fillRect(0,0,w,w);
        for(let i=0;i<15;i++) crater(4+Math.random()*40,4+Math.random()*40,2+Math.random()*3,'rgba(30,25,20,0.7)');
        ctx.beginPath(); ctx.arc(20,28,12,0,Math.PI*2);
        ctx.strokeStyle='rgba(60,50,40,0.8)'; ctx.lineWidth=0.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(20,28,10,0,Math.PI*2); ctx.stroke();
        ctx.fillStyle='rgba(40,35,25,0.5)'; ctx.fill();
      },
      scarp() {
        ctx.fillStyle='#555'; ctx.fillRect(0,0,w,w);
        crater(10,20,4,'rgba(40,35,25,0.6)'); crater(30,15,3,'rgba(40,35,25,0.5)');
        ctx.beginPath(); ctx.moveTo(2,32); ctx.lineTo(46,28);
        ctx.strokeStyle='rgba(80,70,55,0.9)'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='rgba(90,80,65,0.4)'; ctx.fillRect(0,22,48,10);
      },
    }[key] || function(){})();
  },
  buildLayers(_mesh, _r, _layers) { /* real texture already shows craters */ },
};
